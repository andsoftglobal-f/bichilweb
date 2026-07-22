"""
Зураг, видео upload хийх API view.
Файлуудыг S3 эсвэл local storage дээр хадгалаад URL-ийг буцаана.
"""
import logging
import mimetypes
import re
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from app.utils.storage import upload_file, upload_large_file
from app.utils.file_validation import validate_file_content, FileValidationError

logger = logging.getLogger(__name__)


class FileUploadView(APIView):
    """
    POST /api/v1/upload/
    Зураг, видео, баримт файлуудыг хадгална (S3 эсвэл local storage).
    Буцаах: { "url": "file_url", "file_type": "image|video|document" }

    Admin-panel only — there is no legitimate anonymous use of a generic
    file-upload endpoint, so unlike most content views this requires
    authentication even for GET-equivalent inspection (there is none here,
    it's POST-only, but the class stays closed by default regardless).
    """

    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)
    
    # Дүлхүүрт өврүүлэх боломжтой файл төрлүүд
    ALLOWED_MIME_TYPES = {
        # Зураг
        'image/jpeg': {'type': 'image', 'resource_type': 'image'},
        'image/png': {'type': 'image', 'resource_type': 'image'},
        'image/gif': {'type': 'image', 'resource_type': 'image'},
        'image/webp': {'type': 'image', 'resource_type': 'image'},
        'image/svg+xml': {'type': 'image', 'resource_type': 'image'},
        # Видео
        'video/mp4': {'type': 'video', 'resource_type': 'video'},
        'video/webm': {'type': 'video', 'resource_type': 'video'},
        'video/quicktime': {'type': 'video', 'resource_type': 'video'},
        'video/mpeg': {'type': 'video', 'resource_type': 'video'},
        'video/x-msvideo': {'type': 'video', 'resource_type': 'video'},
        # Аудио
        'audio/mpeg': {'type': 'document', 'resource_type': 'raw'},
        'audio/wav': {'type': 'document', 'resource_type': 'raw'},
        'audio/x-wav': {'type': 'document', 'resource_type': 'raw'},
        'audio/ogg': {'type': 'document', 'resource_type': 'raw'},
        'audio/mp4': {'type': 'document', 'resource_type': 'raw'},
        # Баримт
        'application/pdf': {'type': 'document', 'resource_type': 'raw'},
        'text/plain': {'type': 'document', 'resource_type': 'raw'},
        'application/msword': {'type': 'document', 'resource_type': 'raw'},
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {'type': 'document', 'resource_type': 'raw'},
        'application/vnd.ms-excel': {'type': 'document', 'resource_type': 'raw'},
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {'type': 'document', 'resource_type': 'raw'},
        'application/vnd.ms-powerpoint': {'type': 'document', 'resource_type': 'raw'},
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': {'type': 'document', 'resource_type': 'raw'},
        'application/zip': {'type': 'document', 'resource_type': 'raw'},
        'application/x-zip-compressed': {'type': 'document', 'resource_type': 'raw'},
        'application/x-rar-compressed': {'type': 'document', 'resource_type': 'raw'},
        'application/vnd.rar': {'type': 'document', 'resource_type': 'raw'},
        # 'application/octet-stream' deliberately NOT allowed: it's a generic
        # "unknown binary" label with no magic-byte signature to verify
        # against, so it can never be content-validated — accepting it would
        # let any file through as long as its extension/content-type claims
        # this catch-all. Every real file type this endpoint needs to accept
        # already has a specific MIME type above.
    }

    @staticmethod
    def _safe_segment(value):
        value = str(value or '').strip().strip('/')
        return re.sub(r'[^A-Za-z0-9_.-]+', '-', value).strip('.-')[:80]

    def _build_upload_folder(self, request, file_type):
        raw_folder = request.data.get('folder')
        if raw_folder:
            parts = [self._safe_segment(part) for part in str(raw_folder).replace('\\', '/').split('/')]
            clean_parts = [part for part in parts if part]
            if clean_parts:
                return '/'.join(clean_parts)

        page_slug = (
            request.data.get('page_slug')
            or request.data.get('slug')
            or request.data.get('page')
            or request.data.get('url')
        )
        safe_page = self._safe_segment(page_slug)
        if safe_page:
            return f"bichil/pages/{safe_page}/{file_type}"

        return f"bichil/{file_type}"

    def post(self, request, *args, **kwargs):
        try:
            file_obj = request.FILES.get('file')
            if not file_obj:
                return Response(
                    {'error': 'Файл олдсонгүй. "file" талбараар илгээнэ үү.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Файлын MIME type шалгах
            mime_type, _ = mimetypes.guess_type(file_obj.name)
            if not mime_type:
                mime_type = file_obj.content_type

            # Дүлхүүрт өвөрүүлэх боломжтой төрөлүүдэнгүүлэх эсэхийг шалгах
            if mime_type not in self.ALLOWED_MIME_TYPES:
                return Response(
                    {
                        'error': f'Уг төрлийн файл дүлхүүрт өвөрүүлэх боломжгүй байна. MIME type: {mime_type}',
                        'allowed_types': list(self.ALLOWED_MIME_TYPES.keys())
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Файлын хэмжээ шалгах (100MB)
            file_size = file_obj.size
            max_size = 100 * 1024 * 1024  # 100MB
            if file_size > max_size:
                return Response(
                    {
                        'error': f'Файлын хэмжээ хэт их байна. Хамгийн дээд: {max_size / (1024*1024)}MB, таны файл: {file_size / (1024*1024):.2f}MB'
                    },
                    status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
                )

            # Файлын бодит агуулгыг (magic bytes) declared MIME type-тай
            # харьцуулж баталгаажуулах — нэр/Content-Type худал байж болно.
            try:
                validate_file_content(file_obj, mime_type)
            except FileValidationError as validation_error:
                return Response(
                    {'error': str(validation_error)},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Файлын төрлийг тодорхойлох
            file_config = self.ALLOWED_MIME_TYPES[mime_type]
            file_type = file_config['type']
            resource_type = file_config['resource_type']

            # Upload хийх (S3 эсвэл local storage)
            try:
                folder = self._build_upload_folder(request, file_type)
                force_local = file_type == 'document'
                if resource_type == 'video':
                    file_url = upload_large_file(file_obj, folder=folder, resource_type=resource_type, force_local=force_local)
                else:
                    file_url = upload_file(file_obj, folder=folder, resource_type=resource_type, force_local=force_local)

                return Response(
                    {
                        'url': file_url,
                        'file_url': file_url,
                        'filename': file_obj.name,
                        'file_type': file_type,
                        'mime_type': mime_type,
                        'size': file_size,
                    },
                    status=status.HTTP_201_CREATED
                )
            except Exception:
                logger.exception('[upload] File upload failed (folder=%s, mime=%s)', folder, mime_type)
                return Response(
                    {'error': 'Upload хийхэд алдаа гарлаа. Дахин оролдоно уу.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        except Exception:
            logger.exception('[upload] Unexpected error handling file upload request')
            return Response(
                {'error': 'Файл хадгалахад алдаа гарлаа. Дахин оролдоно уу.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

