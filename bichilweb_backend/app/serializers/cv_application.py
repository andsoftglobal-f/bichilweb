import re

from rest_framework import serializers
from app.models.models import CvApplication

EMAIL_RE = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')
PHONE_RE = re.compile(r'^\d{8}$')


class CvApplicationReadSerializer(serializers.ModelSerializer):
    job_title = serializers.SerializerMethodField()
    status_label = serializers.SerializerMethodField()

    class Meta:
        model = CvApplication
        fields = [
            'id', 'first_name', 'last_name', 'email', 'phone',
            'position', 'experience', 'message', 'cv_file',
            'job', 'job_title', 'status', 'status_label', 'created_at',
        ]

    def get_job_title(self, obj):
        if obj.job:
            from app.models.models import JobTranslations
            t = JobTranslations.objects.filter(job=obj.job, language_id=2).first()
            if t:
                return t.title
        return None

    def get_status_label(self, obj):
        return dict(CvApplication.STATUS_CHOICES).get(obj.status, 'Шинэ')


class CvApplicationWriteSerializer(serializers.ModelSerializer):
    # 'status' deliberately excluded — this serializer is used by the public,
    # anonymous create endpoint (see PublicCreateStaffManage). Every new
    # application must start at the model's default (0 / "Шинэ"); letting
    # the field through here would let any anonymous submitter self-approve
    # their own application by posting status=2 directly.
    #
    # 'cv_file' is read_only for the exact same reason: it must only ever be
    # set server-side, from the validated multipart upload result (see
    # CvApplicationViewSet.create in app/views/cv_application.py). It's a
    # plain TextField with no URL/format validation at the model level —
    # letting the client set it directly (as ordinary request data, no file
    # needed at all) would bypass every bit of magic-byte/size/MIME
    # validation and let arbitrary text (including a javascript: URI) get
    # stored and later rendered as an href in the admin panel's CV list.
    class Meta:
        model = CvApplication
        fields = [
            'first_name', 'last_name', 'email', 'phone',
            'position', 'experience', 'message', 'cv_file', 'job',
        ]
        extra_kwargs = {
            'cv_file': {'read_only': True},
        }

    def validate_first_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('Нэр заавал оруулна уу.')
        return value.strip()

    def validate_last_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('Овог заавал оруулна уу.')
        return value.strip()

    def validate_email(self, value):
        value = (value or '').strip()
        if not EMAIL_RE.match(value):
            raise serializers.ValidationError('И-мэйл хаяг буруу форматтай байна.')
        return value

    def validate_phone(self, value):
        value = (value or '').strip()
        if not PHONE_RE.match(value):
            raise serializers.ValidationError('Утасны дугаар 8 оронтой тоо байх ёстой.')
        return value


class CvApplicationUpdateSerializer(CvApplicationWriteSerializer):
    """
    Staff-only update path (CvApplicationViewSet.update — unreachable
    anonymously, PublicCreateStaffManage requires auth for anything but
    create). Adds 'status' back so staff can move an application through
    the review workflow; kept separate from the public write serializer so
    that field is never reachable from the anonymous create endpoint.
    """
    class Meta(CvApplicationWriteSerializer.Meta):
        fields = CvApplicationWriteSerializer.Meta.fields + ['status']
