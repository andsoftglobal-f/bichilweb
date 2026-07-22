"""
Content-based (magic-byte) file-type validation.

mimetypes.guess_type() and a browser-supplied Content-Type header are both
purely label-based — an attacker can rename a malicious payload to
photo.jpg or lie about Content-Type in the multipart request, and neither
check ever looks at what the file actually contains. This module inspects
the real bytes before anything is handed to storage:

  - Every allowed MIME type is checked against a magic-byte signature.
  - Raster images are additionally decoded with Pillow (catches malformed/
    exploit-crafted files that happen to start with a valid signature).
  - SVG (which is XML, not a raster format — no magic bytes to check) is
    parsed with defusedxml and rejected if it contains <script>, event-
    handler attributes, or references to external resources — the standard
    SVG-as-stored-XSS vector.
"""
import logging

from django.core.exceptions import ValidationError as DjangoValidationError

logger = logging.getLogger(__name__)

try:
    from PIL import Image
    _PIL_AVAILABLE = True
except ImportError:  # pragma: no cover - Pillow is a required dependency
    _PIL_AVAILABLE = False

try:
    import defusedxml.ElementTree as _safe_ET
    _DEFUSEDXML_AVAILABLE = True
except ImportError:  # pragma: no cover - see requirements.txt
    _DEFUSEDXML_AVAILABLE = False


class FileValidationError(Exception):
    """Raised when a file's actual content doesn't match/pass its declared type."""


# Magic-byte signatures for the MIME types FileUploadView/CV upload allow.
# A file matches a MIME type if ALL of its (offset, bytes) pairs match —
# RIFF-container types (webp/wav/avi) need both the outer 'RIFF' tag and the
# inner four-char format code, otherwise any RIFF file would pass as any of
# the three.
_SIGNATURES = {
    'image/jpeg': [(0, b'\xff\xd8\xff')],
    'image/png': [(0, b'\x89PNG\r\n\x1a\n')],
    'image/gif': [(0, b'GIF87a')],  # checked with an OR against GIF89a below
    'image/webp': [(0, b'RIFF'), (8, b'WEBP')],
    'video/mp4': [(4, b'ftyp')],
    'video/quicktime': [(4, b'ftyp')],
    'video/webm': [(0, b'\x1a\x45\xdf\xa3')],
    'video/mpeg': [(0, b'\x00\x00\x01\xba')],  # checked with an OR below
    'video/x-msvideo': [(0, b'RIFF'), (8, b'AVI ')],
    'audio/mpeg': [(0, b'ID3')],  # checked with an OR against frame-sync below
    'audio/wav': [(0, b'RIFF'), (8, b'WAVE')],
    'audio/x-wav': [(0, b'RIFF'), (8, b'WAVE')],
    'audio/ogg': [(0, b'OggS')],
    'audio/mp4': [(4, b'ftyp')],
    'application/pdf': [(0, b'%PDF-')],
    'application/msword': [(0, b'\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1')],
    'application/vnd.ms-excel': [(0, b'\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1')],
    'application/vnd.ms-powerpoint': [(0, b'\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1')],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [(0, b'PK\x03\x04')],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [(0, b'PK\x03\x04')],
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': [(0, b'PK\x03\x04')],
    'application/zip': [(0, b'PK\x03\x04')],
    'application/x-zip-compressed': [(0, b'PK\x03\x04')],
    'application/x-rar-compressed': [(0, b'Rar!\x1a\x07')],
    'application/vnd.rar': [(0, b'Rar!\x1a\x07')],
}

# Extra alternative signatures for types that have more than one valid magic
# (declared separately so the "all pairs must match" rule above still works
# for the RIFF-container types).
_ALT_SIGNATURES = {
    'image/gif': [b'GIF89a'],
    'video/mpeg': [b'\x00\x00\x01\xb3'],
    'audio/mpeg': [b'\xff\xfb', b'\xff\xf3', b'\xff\xf2'],
}

_RIFF_TYPES = {'image/webp', 'audio/wav', 'audio/x-wav', 'video/x-msvideo'}

# Pillow's own decoder is the source of truth for these — a file can only
# claim one of these MIME types if Pillow both opens it AND reports a
# matching format, regardless of what its magic bytes look like.
_PIL_FORMAT_TO_MIME = {
    'JPEG': 'image/jpeg',
    'PNG': 'image/png',
    'GIF': 'image/gif',
    'WEBP': 'image/webp',
}
_IMAGE_MIME_TYPES = set(_PIL_FORMAT_TO_MIME.values())

_SVG_DANGEROUS_TAGS = {
    'script', 'foreignobject', 'iframe', 'embed', 'object', 'audio', 'video', 'set',
}
_SVG_DANGEROUS_HREF_SCHEMES = ('javascript:', 'data:text/html', 'vbscript:')


def _read_head(file_obj, n=4096):
    if hasattr(file_obj, 'seek'):
        file_obj.seek(0)
    head = file_obj.read(n)
    if hasattr(file_obj, 'seek'):
        file_obj.seek(0)
    return head


def _matches_signature(head, mime_type):
    sigs = _SIGNATURES.get(mime_type)
    if not sigs:
        return False

    if mime_type in _RIFF_TYPES:
        return all(head[offset:offset + len(sig)] == sig for offset, sig in sigs)

    primary_offset, primary_sig = sigs[0]
    if head[primary_offset:primary_offset + len(primary_sig)] == primary_sig:
        return True
    return any(head.startswith(alt) for alt in _ALT_SIGNATURES.get(mime_type, []))


def _validate_raster_image(file_obj, mime_type):
    if not _PIL_AVAILABLE:
        logger.warning('[file_validation] Pillow unavailable — skipping deep image decode for %s', mime_type)
        return

    if hasattr(file_obj, 'seek'):
        file_obj.seek(0)
    try:
        with Image.open(file_obj) as img:
            img.verify()
            detected_format = img.format
    except Exception as exc:
        raise FileValidationError(f'Зургийн файл эвдэрсэн эсвэл хүчинтэй бус байна: {exc}') from exc
    finally:
        if hasattr(file_obj, 'seek'):
            file_obj.seek(0)

    if _PIL_FORMAT_TO_MIME.get(detected_format) != mime_type:
        raise FileValidationError(
            f'Зургийн бодит агуулга ({detected_format}) илэрхийлсэн MIME type-той ({mime_type}) тохирохгүй байна.'
        )


def _local_name(tag):
    return tag.rsplit('}', 1)[-1].lower() if tag else ''


def validate_svg(file_obj):
    """Rejects SVGs containing script execution or external-resource vectors."""
    if not _DEFUSEDXML_AVAILABLE:
        raise FileValidationError('SVG баталгаажуулах сан (defusedxml) суулгаагүй тул SVG upload идэвхгүй байна.')

    if hasattr(file_obj, 'seek'):
        file_obj.seek(0)
    raw = file_obj.read()
    if hasattr(file_obj, 'seek'):
        file_obj.seek(0)

    try:
        root = _safe_ET.fromstring(raw)
    except Exception as exc:
        raise FileValidationError(f'SVG файл хүчинтэй XML биш байна: {exc}') from exc

    if _local_name(root.tag) != 'svg':
        raise FileValidationError('Файл SVG root элементгүй байна.')

    for el in root.iter():
        tag = _local_name(el.tag)
        if tag in _SVG_DANGEROUS_TAGS:
            raise FileValidationError(f'SVG-д зөвшөөрөгдөөгүй элемент илэрлээ: <{tag}>')

        for attr_name, attr_value in el.attrib.items():
            local_attr = _local_name(attr_name)
            if local_attr.startswith('on'):
                raise FileValidationError(f'SVG-д зөвшөөрөгдөөгүй event handler attribute илэрлээ: {local_attr}')

            if local_attr in ('href', 'src') or local_attr.endswith('href'):
                value = (attr_value or '').strip().lower()
                if value.startswith(_SVG_DANGEROUS_HREF_SCHEMES):
                    raise FileValidationError(f'SVG-д зөвшөөрөгдөөгүй href схем илэрлээ: {attr_value[:40]}')
                if value.startswith(('http://', 'https://', '//')):
                    raise FileValidationError('SVG нь гадаад URL рүү холбогдож болохгүй (SSRF/tracking эрсдэл).')


def validate_text_plain(file_obj, max_check_bytes=8192):
    """Best-effort: reject binaries mislabeled as text/plain (no fixed magic bytes exist for text)."""
    head = _read_head(file_obj, max_check_bytes)
    if b'\x00' in head:
        raise FileValidationError('Файл "текст" гэж тодорхойлогдсон боловч хоёртын (binary) агуулгатай байна.')
    try:
        head.decode('utf-8')
    except UnicodeDecodeError as exc:
        raise FileValidationError('Файл "текст" гэж тодорхойлогдсон боловч UTF-8 текст биш байна.') from exc


def validate_file_content(file_obj, mime_type):
    """
    Validates file_obj's actual bytes against the claimed mime_type.
    Raises FileValidationError on any mismatch or malformed/unsafe content.
    Caller is responsible for checking mime_type is itself in an allow-list.
    """
    if mime_type == 'image/svg+xml':
        validate_svg(file_obj)
        return

    if mime_type == 'text/plain':
        validate_text_plain(file_obj)
        return

    if mime_type not in _SIGNATURES:
        # No reliable magic-byte signature exists for this type (shouldn't
        # normally be reached — every entry in upload.py's ALLOWED_MIME_TYPES
        # has a signature above). Fail closed rather than silently accepting
        # unverifiable content.
        raise FileValidationError(f'"{mime_type}" төрлийн файлыг агуулгаар нь баталгаажуулах боломжгүй байна.')

    head = _read_head(file_obj)
    if not _matches_signature(head, mime_type):
        raise FileValidationError(
            f'Файлын бодит агуулга илэрхийлсэн MIME type-той ({mime_type}) тохирохгүй байна.'
        )

    if mime_type in _IMAGE_MIME_TYPES:
        _validate_raster_image(file_obj, mime_type)
