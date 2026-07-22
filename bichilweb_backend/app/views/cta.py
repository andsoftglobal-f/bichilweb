# =============================================================================
# VIEWSET - CTA Slider
# =============================================================================
# app/views/cta.py

import re
import mimetypes
from rest_framework.viewsets import ModelViewSet
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework import status
import json
import logging
from django.conf import settings

from rest_framework.permissions import DjangoModelPermissionsOrAnonReadOnly
logger = logging.getLogger(__name__)

from app.models.models import Cta, CtaTitle, CtaSubtitle
from app.serializers.cta import CtaSerializer
from app.utils.storage import upload_file, delete_file

class CtaViewSet(ModelViewSet):
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]
    queryset = Cta.objects.all().order_by('index')
    serializer_class = CtaSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    # ─── Storage helpers ─────────────────────────────────────────
    def _upload_to_storage(self, file_obj):
        """Файлыг upload хийнэ. Буцаах: URL"""
        return upload_file(file_obj, folder='bichil/cta', resource_type='image')

    def _delete_from_storage(self, url):
        """Файл устгах"""
        delete_file(url)

    def create(self, request, *args, **kwargs):
        """Create new CTA slide"""
        try:
            data = {}
            data['number'] = request.data.get('number')
            data['index'] = request.data.get('index')
            data['font'] = request.data.get('font')
            data['description_font'] = request.data.get('description_font', '')
            data['subtitle_font'] = request.data.get('subtitle_font', '')
            data['color'] = request.data.get('color')
            data['description'] = request.data.get('description', '')
            data['description_position'] = request.data.get('description_position', 'top')
            data['description_align'] = request.data.get('description_align', 'left')
            data['url'] = request.data.get('url', '')
            if 'file' in request.FILES:
                file = request.FILES['file']
                data['file'] = self._upload_to_storage(file)
            else:
                return Response(
                    {'error': 'File is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Collapsed file (desktop collapsed image)
            if 'collapsed_file' in request.FILES:
                data['collapsed_file'] = self._upload_to_storage(request.FILES['collapsed_file'])

            # Mobile expanded file
            if 'mobile_expanded_file' in request.FILES:
                data['mobile_expanded_file'] = self._upload_to_storage(request.FILES['mobile_expanded_file'])
            
            # Cta үүсгэх
            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            cta_instance = serializer.save()
            
            # Titles үүсгэх
            titles_json = request.data.get('titles')
            if titles_json:
                try:
                    titles_data = json.loads(titles_json) if isinstance(titles_json, str) else titles_json
                    for title_item in titles_data:
                        language_value = title_item.get('language')
                        
                        # ✅ Language model шалгах
                        if self._has_language_model():
                            from app.models.models import Language
                            language_obj = Language.objects.get(id=language_value)
                            CtaTitle.objects.create(
                                cta=cta_instance,
                                language=language_obj,
                                label=title_item.get('label', '')
                            )
                        else:
                            # IntegerField бол шууд хадгална
                            CtaTitle.objects.create(
                                cta=cta_instance,
                                language=language_value,
                                label=title_item.get('label', '')
                            )
                except json.JSONDecodeError as e:
                    logger.warning('Titles JSON parse error: %s', e)
                except Exception as e:
                    logger.warning('Titles create error: %s', e)
            
            # Subtitles үүсгэх
            subtitles_json = request.data.get('subtitles')
            if subtitles_json:
                try:
                    subtitles_data = json.loads(subtitles_json) if isinstance(subtitles_json, str) else subtitles_json
                    for subtitle_item in subtitles_data:
                        language_value = subtitle_item.get('language')
                        
                        # ✅ Language model шалгах
                        if self._has_language_model():
                            from app.models.models import Language
                            language_obj = Language.objects.get(id=language_value)
                            CtaSubtitle.objects.create(
                                cta=cta_instance,
                                language=language_obj,
                                label=subtitle_item.get('label', '')
                            )
                        else:
                            # IntegerField бол шууд хадгална
                            CtaSubtitle.objects.create(
                                cta=cta_instance,
                                language=language_value,
                                label=subtitle_item.get('label', '')
                            )
                except json.JSONDecodeError as e:
                    logger.warning('Subtitles JSON parse error: %s', e)
                except Exception as e:
                    logger.warning('Subtitles create error: %s', e)
            
            # Response буцаах
            response_serializer = self.get_serializer(cta_instance)
            return Response(
                response_serializer.data,
                status=status.HTTP_201_CREATED
            )
            
        except Exception as e:
            logger.exception('CTA create error')
            error_detail = str(e)
            if hasattr(e, 'detail'):
                error_detail = e.detail
            return Response(
                {'error': error_detail},
                status=status.HTTP_400_BAD_REQUEST
            )

    def update(self, request, *args, **kwargs):
        """Update CTA slide"""
        try:
            partial = kwargs.pop('partial', False)
            instance = self.get_object()
            
            data = {}
            data['number'] = request.data.get('number', instance.number)
            data['index'] = request.data.get('index', instance.index)
            data['font'] = request.data.get('font', instance.font)
            data['description_font'] = request.data.get('description_font', instance.description_font or '')
            data['subtitle_font'] = request.data.get('subtitle_font', instance.subtitle_font or '')
            data['color'] = request.data.get('color', instance.color)
            data['description'] = request.data.get('description', instance.description or '')
            data['description_position'] = request.data.get('description_position', instance.description_position or 'top')
            data['description_align'] = request.data.get('description_align', instance.description_align or 'left')
            data['url'] = request.data.get('url', instance.url or '')
            
            # Шинэ файл байвал
            if 'file' in request.FILES:
                file = request.FILES['file']
                
                # Хуучин файлыг storage-с устгах
                self._delete_from_storage(instance.file)
                
                data['file'] = self._upload_to_storage(file)
            else:
                data['file'] = instance.file

            # Collapsed file (desktop collapsed image)
            if 'collapsed_file' in request.FILES:
                if instance.collapsed_file:
                    self._delete_from_storage(instance.collapsed_file)
                data['collapsed_file'] = self._upload_to_storage(request.FILES['collapsed_file'])
            elif request.data.get('remove_collapsed_file') == 'true':
                if instance.collapsed_file:
                    self._delete_from_storage(instance.collapsed_file)
                data['collapsed_file'] = None
            else:
                data['collapsed_file'] = instance.collapsed_file

            # Mobile expanded file
            if 'mobile_expanded_file' in request.FILES:
                if instance.mobile_expanded_file:
                    self._delete_from_storage(instance.mobile_expanded_file)
                data['mobile_expanded_file'] = self._upload_to_storage(request.FILES['mobile_expanded_file'])
            elif request.data.get('remove_mobile_expanded_file') == 'true':
                if instance.mobile_expanded_file:
                    self._delete_from_storage(instance.mobile_expanded_file)
                data['mobile_expanded_file'] = None
            else:
                data['mobile_expanded_file'] = instance.mobile_expanded_file
            
            # Update хийх
            serializer = self.get_serializer(instance, data=data, partial=partial)
            serializer.is_valid(raise_exception=True)
            cta_instance = serializer.save()
            
            # Titles шинэчлэх
            titles_json = request.data.get('titles')
            if titles_json:
                try:
                    instance.ctatitle_set.all().delete()
                    
                    titles_data = json.loads(titles_json) if isinstance(titles_json, str) else titles_json
                    for title_item in titles_data:
                        language_value = title_item.get('language')
                        
                        if self._has_language_model():
                            from app.models.models import Language
                            language_obj = Language.objects.get(id=language_value)
                            CtaTitle.objects.create(
                                cta=cta_instance,
                                language=language_obj,
                                label=title_item.get('label', '')
                            )
                        else:
                            CtaTitle.objects.create(
                                cta=cta_instance,
                                language=language_value,
                                label=title_item.get('label', '')
                            )
                except Exception as e:
                    logger.warning('Titles update error: %s', e)
            
            # Subtitles шинэчлэх
            subtitles_json = request.data.get('subtitles')
            if subtitles_json:
                try:
                    instance.ctasubtitle_set.all().delete()
                    
                    subtitles_data = json.loads(subtitles_json) if isinstance(subtitles_json, str) else subtitles_json
                    for subtitle_item in subtitles_data:
                        language_value = subtitle_item.get('language')
                        
                        if self._has_language_model():
                            from app.models.models import Language
                            language_obj = Language.objects.get(id=language_value)
                            CtaSubtitle.objects.create(
                                cta=cta_instance,
                                language=language_obj,
                                label=subtitle_item.get('label', '')
                            )
                        else:
                            CtaSubtitle.objects.create(
                                cta=cta_instance,
                                language=language_value,
                                label=subtitle_item.get('label', '')
                            )
                except Exception as e:
                    logger.warning('Subtitles update error: %s', e)
            
            response_serializer = self.get_serializer(cta_instance)
            return Response(response_serializer.data)
            
        except Exception as e:
            logger.exception('CTA update error')
            error_detail = str(e)
            if hasattr(e, 'detail'):
                error_detail = e.detail
            return Response(
                {'error': error_detail},
                status=status.HTTP_400_BAD_REQUEST
            )

    def destroy(self, request, *args, **kwargs):
        """Delete CTA slide"""
        try:
            instance = self.get_object()
            
            # Storage дээрх файлуудыг устгах
            self._delete_from_storage(instance.file)
            if instance.collapsed_file:
                self._delete_from_storage(instance.collapsed_file)
            if instance.mobile_expanded_file:
                self._delete_from_storage(instance.mobile_expanded_file)
            
            # FK constraint-тай child record-уудыг эхлээд устгах
            # (DB-д CASCADE байхгүй тул гараар устгана)
            CtaTitle.objects.filter(cta=instance).delete()
            CtaSubtitle.objects.filter(cta=instance).delete()
            
            self.perform_destroy(instance)
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        except Exception as e:
            logger.exception('CTA destroy error')
            return Response(
                {'error': 'Устгахад алдаа гарлаа'},
                status=status.HTTP_400_BAD_REQUEST
            )

    def _has_language_model(self):
        """Check if Language model exists"""
        try:
            from app.models.models import Language
            return True
        except ImportError:
            return False


# =============================================================================
# QUICK FIX - If you just want to make it work NOW
# =============================================================================
"""
Just update your serializer's get_titles and get_subtitles methods:

def get_titles(self, obj):
    titles = []
    for t in obj.ctatitle_set.all():
        # Convert Language object to ID
        lang_id = t.language.id if hasattr(t.language, 'id') else t.language
        titles.append({
            "id": t.id,
            "language": lang_id,
            "label": t.label
        })
    return titles

def get_subtitles(self, obj):
    subtitles = []
    for s in obj.ctasubtitle_set.all():
        # Convert Language object to ID
        lang_id = s.language.id if hasattr(s.language, 'id') else s.language
        subtitles.append({
            "id": s.id,
            "language": lang_id,
            "label": s.label
        })
    return subtitles
"""
