import logging
import mimetypes
from urllib.parse import urlparse

from rest_framework import viewsets, status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from app.models.models import CvApplication
from app.serializers.cv_application import (
    CvApplicationReadSerializer,
    CvApplicationWriteSerializer,
    CvApplicationUpdateSerializer,
)
from app.utils.storage import upload_file
from app.utils.file_validation import validate_file_content, FileValidationError
from app.accounts.permissions import PublicCreateStaffManage

logger = logging.getLogger(__name__)

# Anonymous, public-facing endpoint — keep the accepted CV formats narrow
# (unlike the admin-only generic upload endpoint's much broader allow-list).
CV_ALLOWED_MIME_TYPES = {
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}
CV_MAX_SIZE = 10 * 1024 * 1024  # 10MB


def _is_safe_stored_url(value):
    """
    Last-line guard on whatever upload_file() returns before it's persisted
    to cv_file: only a root-relative path (local/SFTP storage) or an
    absolute http(s) URL (S3/CDN) is acceptable. Rejects javascript:, data:,
    file:, vbscript:, or any other scheme outright — cv_file is rendered as
    an <a href> in the admin panel, so anything else stored there is a
    stored-XSS payload waiting for a staff member to click it.
    """
    if not value:
        return False
    parsed = urlparse(value)
    if parsed.scheme in ('http', 'https'):
        return True
    return not parsed.scheme and value.startswith('/')


class CvApplicationViewSet(viewsets.ModelViewSet):
    permission_classes = [PublicCreateStaffManage]
    queryset = CvApplication.objects.all()
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_serializer_class(self):
        if self.action in ('create',):
            return CvApplicationWriteSerializer
        return CvApplicationReadSerializer

    def get_throttles(self):
        # Only the anonymous, public 'create' action gets the tighter
        # 'public-submit' budget — staff list/retrieve/update stay on the
        # normal authenticated-user rate.
        if self.action == 'create':
            self.throttle_scope = 'public-submit'
            return [ScopedRateThrottle()]
        return super().get_throttles()

    def create(self, request, *args, **kwargs):
        # Anonymous, public endpoint — only a real multipart upload is
        # accepted. Blocks the JSON/urlencoded route entirely, closing off
        # the easiest way to submit a plain-text cv_file with no file
        # attached at all (see CvApplicationWriteSerializer's read_only
        # cv_file for the actual enforcement; this is the earlier gate).
        if not (request.content_type or '').startswith('multipart/form-data'):
            return Response(
                {'detail': 'Хүсэлт multipart/form-data төрөлтэй байх ёстой.'},
                status=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            )

        data = request.data.copy()
        # cv_file is read_only on the serializer (so this would be ignored
        # during validation regardless), but drop it here too — it must
        # never be treated as anything other than the server-generated
        # upload URL below.
        data.pop('cv_file', None)
        cv_file = request.FILES.get('cv_file')

        file_url = ''
        if cv_file:
            if cv_file.size > CV_MAX_SIZE:
                return Response(
                    {'detail': f'CV файлын хэмжээ хэт их байна. Хамгийн дээд: {CV_MAX_SIZE // (1024 * 1024)}MB.'},
                    status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                )

            mime_type, _ = mimetypes.guess_type(cv_file.name)
            if not mime_type:
                mime_type = cv_file.content_type
            if mime_type not in CV_ALLOWED_MIME_TYPES:
                return Response(
                    {'detail': f'CV файлын төрөл дэмжигдэхгүй байна. Зөвшөөрөгдсөн: PDF, DOC, DOCX. Илэрсэн: {mime_type}'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            try:
                validate_file_content(cv_file, mime_type)
            except FileValidationError as validation_error:
                return Response({'detail': str(validation_error)}, status=status.HTTP_400_BAD_REQUEST)

            try:
                file_url = upload_file(cv_file, folder='bichil/cv', resource_type='raw')
            except Exception:
                logger.exception('[cv_application] CV file upload failed')
                return Response(
                    {'detail': 'CV файл upload хийхэд алдаа гарлаа. Дахин оролдоно уу.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            if not _is_safe_stored_url(file_url):
                logger.error('[cv_application] Storage returned an unsafe URL, refusing to persist: %r', file_url)
                return Response(
                    {'detail': 'CV файл хадгалахад алдаа гарлаа. Дахин оролдоно уу.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save(cv_file=file_url)
        return Response(
            CvApplicationReadSerializer(serializer.instance).data,
            status=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        data = request.data.copy()

        serializer = CvApplicationUpdateSerializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(CvApplicationReadSerializer(instance).data)
