from rest_framework import serializers
from app.models.models import Jobs

class JobTranslationReadSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    language = serializers.IntegerField(source='language_id')
    language_code = serializers.CharField(source='language.lang_code', read_only=True)
    language_name = serializers.CharField(source='language.lang_name', read_only=True)
    title = serializers.CharField()
    department = serializers.CharField()
    desc = serializers.CharField()
    requirements = serializers.CharField(allow_blank=True, allow_null=True)


class JobReadSerializer(serializers.ModelSerializer):
    translations = serializers.SerializerMethodField()
    
    class Meta:
        model = Jobs
        fields = [
            'id',
            'type',
            'location',
            'deadline',
            'status',
            'date',
            'icon_image',
            'icon_url',
            'translations'
        ]
    
    def get_translations(self, obj):
        # Uses the prefetched cache (see JobViewSet's querysets, which
        # prefetch 'jobtranslations_set__language') instead of issuing a
        # fresh query per job — this was a real N+1: one extra query per
        # job in every /jobs/ list response.
        return JobTranslationReadSerializer(obj.jobtranslations_set.all(), many=True).data

