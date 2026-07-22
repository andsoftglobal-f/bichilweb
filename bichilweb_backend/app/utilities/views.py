from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.db import connection, transaction
import logging

from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from rest_framework.permissions import DjangoModelPermissionsOrAnonReadOnly
from app.accounts.permissions import ReadOnlyOrAuthenticated
logger = logging.getLogger(__name__)
from app.models.models import Document, Collateral, Conditions, Pages, Branches, BranchCategory, BranchPageSettings, HrPolicy, HrPolicyCategory, HrSection, JobTranslations, Jobs, Footer, FloatMenu, FloatMenuSubmenus, FloatMenuSocials, CallButton
from app.utilities.document.serializers.read import DocumentReadSerializer
from app.utilities.document.serializers.write import DocumentWriteSerializer
from app.utilities.collateral.serializers.read import CollateralReadSerializer
from app.utilities.collateral.serializers.write import CollateralWriteSerializer
from app.utilities.conditions.serializers.read import ConditionReadSerializer
from app.utilities.conditions.serializers.write import ConditionWriteSerializer
from app.utilities.pages.serializers.read import PagesReadSerializer
from app.utilities.pages.serializers.write import PagesWriteSerializer
from app.utilities.branch.serializers.read import BranchesReadSerializer, BranchCategorySerializer, BranchPageSettingsSerializer
from app.utilities.branch.serializers.write import BranchesWriteSerializer
from app.utilities.hrpolicy.serializers.read import  HrPolicyReadSerializer, HrPolicyCategoryReadSerializer
from app.utilities.hrpolicy.serializers.write import HrPolicyWriteSerializer, HrPolicyCategoryWriteSerializer
from app.utilities.hrsection.serializers.read import HrSectionReadSerializer
from app.utilities.hrsection.serializers.write import HrSectionWriteSerializer
from app.utilities.jobs.serializers.read import JobReadSerializer
from app.utilities.jobs.serializers.write import JobWriteSerializer
from app.utilities.footer.serializers.read import FooterReadSerializer 
from app.utilities.footer.serializers.write import FooterWriteSerializer
from app.utilities.floatMenu.serializers.serializers import ( FloatMenuReadSerializer,
    FloatMenuWriteSerializer,
    FloatMenuSubmenusReadSerializer,
    FloatMenuSubmenuCreateSerializer,
    FloatMenuSubmenuUpdateSerializer,
    FloatMenuSocialsSerializer,
    CallButtonSerializer)
from app.utils.storage import delete_file

class DocumentViewSet(viewsets.ModelViewSet):
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]
    queryset = Document.objects.all().prefetch_related(
        "documenttranslation_set",
        "documenttranslation_set__language"
    )

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return DocumentReadSerializer
        return DocumentWriteSerializer

    def create(self, request, *args, **kwargs):
        write_serializer = DocumentWriteSerializer(data=request.data)
        write_serializer.is_valid(raise_exception=True)
        instance = write_serializer.save()
        
        read_serializer = DocumentReadSerializer(instance)
        headers = self.get_success_headers(read_serializer.data)
        
        return Response(
            read_serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        write_serializer = DocumentWriteSerializer(
            instance, 
            data=request.data, 
            partial=partial
        )
        write_serializer.is_valid(raise_exception=True)
        instance = write_serializer.save()
        
        read_serializer = DocumentReadSerializer(instance)
        return Response(read_serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        doc_id = instance.id
        try:
            with connection.cursor() as cursor:
                cursor.execute("DELETE FROM document_translation WHERE document = %s", [doc_id])
                cursor.execute("DELETE FROM document WHERE id = %s", [doc_id])
            return Response({"message": "Document амжилттай устгагдлаа"}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error('Document destroy error id=%s: %s', doc_id, e)
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
class CollateralViewSet(viewsets.ModelViewSet):
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]
    queryset = Collateral.objects.all().prefetch_related(
        "collateraltranslation_set",
        "collateraltranslation_set__language"
    )

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return CollateralReadSerializer
        return CollateralWriteSerializer

    def create(self, request, *args, **kwargs):
        write_serializer = CollateralWriteSerializer(data=request.data)
        write_serializer.is_valid(raise_exception=True)
        instance = write_serializer.save()
        
        read_serializer = CollateralReadSerializer(instance)
        headers = self.get_success_headers(read_serializer.data)
        
        return Response(
            read_serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        write_serializer = CollateralWriteSerializer(
            instance, 
            data=request.data, 
            partial=partial
        )
        write_serializer.is_valid(raise_exception=True)
        instance = write_serializer.save()
        
        read_serializer = CollateralReadSerializer(instance)
        return Response(read_serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        coll_id = instance.id
        try:
            with connection.cursor() as cursor:
                cursor.execute("DELETE FROM collateral_translation WHERE collateral = %s", [coll_id])
                cursor.execute("DELETE FROM collateral WHERE id = %s", [coll_id])
            return Response({"message": "Collateral амжилттай устгагдлаа"}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error('Collateral destroy error id=%s: %s', coll_id, e)
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
class ConditionViewSet(viewsets.ModelViewSet):
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]
    queryset = Conditions.objects.all().prefetch_related(
        "conditiontranslations_set",
        "conditiontranslations_set__language"
    )

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return ConditionReadSerializer
        return ConditionWriteSerializer

    def create(self, request, *args, **kwargs):
        write_serializer = ConditionWriteSerializer(data=request.data)
        write_serializer.is_valid(raise_exception=True)
        instance = write_serializer.save()
        
        read_serializer = ConditionReadSerializer(instance)
        headers = self.get_success_headers(read_serializer.data)
        
        return Response(
            read_serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        write_serializer = ConditionWriteSerializer(
            instance, 
            data=request.data, 
            partial=partial
        )
        write_serializer.is_valid(raise_exception=True)
        instance = write_serializer.save()
        
        read_serializer = ConditionReadSerializer(instance)
        return Response(read_serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        cond_id = instance.id
        try:
            with connection.cursor() as cursor:
                cursor.execute("DELETE FROM condition_translations WHERE condition = %s", [cond_id])
                cursor.execute("DELETE FROM conditions WHERE id = %s", [cond_id])
            return Response({"message": "Condition амжилттай устгагдлаа"}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error('Condition destroy error id=%s: %s', cond_id, e)
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

class PagesViewSet(viewsets.ModelViewSet):
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]
    queryset = Pages.objects.all().prefetch_related(
        "pagetitletranslations_set",
        "pagetitletranslations_set__language",
        "pagedescriptiontranslations_set",
        "pagedescriptiontranslations_set__language"
    )

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return PagesReadSerializer
        return PagesWriteSerializer

    @action(detail=False, methods=['get'], url_path='by-url')
    def by_url(self, request):
        """Lookup a page by its URL field, e.g. /api/v1/page/by-url/?url=/about-us"""
        page_url = request.query_params.get('url', '')
        if not page_url:
            return Response({'detail': 'url parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
        # Try exact match first, then with/without leading slash
        page = Pages.objects.filter(url=page_url).first()
        if not page and not page_url.startswith('/'):
            page = Pages.objects.filter(url=f'/{page_url}').first()
        if not page and page_url.startswith('/'):
            page = Pages.objects.filter(url=page_url[1:]).first()
        if not page:
            return Response({'detail': 'Page not found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = PagesReadSerializer(page)
        return Response(serializer.data)
    
    def create(self, request, *args, **kwargs):
        write_serializer = PagesWriteSerializer(data=request.data)
        write_serializer.is_valid(raise_exception=True)
        instance = write_serializer.save()
        
        read_serializer = PagesReadSerializer(instance)
        headers = self.get_success_headers(read_serializer.data)
        
        return Response(
            read_serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        write_serializer = PagesWriteSerializer(
            instance, 
            data=request.data, 
            partial=partial
        )
        write_serializer.is_valid(raise_exception=True)
        instance = write_serializer.save()
        
        read_serializer = PagesReadSerializer(instance)
        return Response(read_serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        read_serializer = PagesReadSerializer(instance)
        data = read_serializer.data

        # Delete related translations first (FK uses DO_NOTHING, no cascade)
        instance.pagedescriptiontranslations_set.all().delete()
        instance.pagetitletranslations_set.all().delete()

        instance.delete()

        return Response(
            {
                "message": "Page амжилттай устгагдлаа",
                "deleted_data": data
            },
            status=status.HTTP_200_OK
        )
    

class BranchesViewSet(viewsets.ModelViewSet):
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]
    queryset = Branches.objects.all().select_related("category").prefetch_related("branchphone_set")
    parser_classes = (MultiPartParser, FormParser)  

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return BranchesReadSerializer
        return BranchesWriteSerializer

    def create(self, request, *args, **kwargs):
        write_serializer = BranchesWriteSerializer(data=request.data)
        write_serializer.is_valid(raise_exception=True)
        instance = write_serializer.save()
        
        read_serializer = BranchesReadSerializer(instance)
        headers = self.get_success_headers(read_serializer.data)
        
        return Response(
            read_serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        write_serializer = BranchesWriteSerializer(
            instance, 
            data=request.data, 
            partial=partial
        )
        write_serializer.is_valid(raise_exception=True)
        instance = write_serializer.save()
        
        read_serializer = BranchesReadSerializer(instance)
        return Response(read_serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        read_serializer = BranchesReadSerializer(instance)
        data = read_serializer.data
        
        # Delete image file from storage
        if instance.image:
            from app.utils.storage import delete_file
            delete_file(instance.image)
        
        instance.delete()
        
        return Response(
            {
                "message": "Branch амжилттай устгагдлаа",
                "deleted_data": data
            },
            status=status.HTTP_200_OK
        )
    

class BranchCategoryViewSet(viewsets.ModelViewSet):
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]
    queryset = BranchCategory.objects.all().order_by('sort_order', 'id')
    serializer_class = BranchCategorySerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response({"message": "Ангилал устгагдлаа"}, status=status.HTTP_200_OK)

class BranchPageSettingsViewSet(viewsets.ModelViewSet):
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]
    queryset = BranchPageSettings.objects.all()
    serializer_class = BranchPageSettingsSerializer

    def list(self, request, *args, **kwargs):
        instance = BranchPageSettings.objects.first()
        if not instance:
            instance = BranchPageSettings.objects.create()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        instance = BranchPageSettings.objects.first()
        if not instance:
            instance = BranchPageSettings.objects.create()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

class HrPolicyCategoryViewSet(viewsets.ModelViewSet):
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]
    queryset = HrPolicyCategory.objects.all().prefetch_related(
        'hrpolicycategorytranslations_set',
        'hrpolicycategorytranslations_set__language'
    ).order_by('sort_order', 'id')

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return HrPolicyCategoryReadSerializer
        return HrPolicyCategoryWriteSerializer

    def create(self, request, *args, **kwargs):
        write_serializer = HrPolicyCategoryWriteSerializer(
            data=request.data,
            context={'request': request}
        )
        write_serializer.is_valid(raise_exception=True)
        instance = write_serializer.save()

        read_serializer = HrPolicyCategoryReadSerializer(
            instance,
            context={'request': request}
        )
        headers = self.get_success_headers(read_serializer.data)

        return Response(
            read_serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        write_serializer = HrPolicyCategoryWriteSerializer(
            instance,
            data=request.data,
            partial=partial,
            context={'request': request}
        )
        write_serializer.is_valid(raise_exception=True)
        instance = write_serializer.save()

        read_serializer = HrPolicyCategoryReadSerializer(
            instance,
            context={'request': request}
        )
        return Response(read_serializer.data)

class HrPolicyViewSet(viewsets.ModelViewSet):
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]
    queryset = HrPolicy.objects.all().select_related('category').prefetch_related(
        'hrpolicytranslations_set',
        'hrpolicytranslations_set__language',
        'category__hrpolicycategorytranslations_set',
        'category__hrpolicycategorytranslations_set__language'
    ).order_by('-created_at')

    def get_queryset(self):
        queryset = self.queryset
        category = self.request.query_params.get('category')

        if category == 'null':
            return queryset.filter(category__isnull=True)
        if category:
            return queryset.filter(category_id=category)

        return queryset
    
    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return HrPolicyReadSerializer
        return HrPolicyWriteSerializer
    
    def create(self, request, *args, **kwargs):
        write_serializer = HrPolicyWriteSerializer(
            data=request.data,
            context={'request': request}
        )
        write_serializer.is_valid(raise_exception=True)
        instance = write_serializer.save()
        
        read_serializer = HrPolicyReadSerializer(
            instance,
            context={'request': request}
        )
        headers = self.get_success_headers(read_serializer.data)
        
        return Response(
            read_serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers
        )
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        write_serializer = HrPolicyWriteSerializer(
            instance,
            data=request.data,
            partial=partial,
            context={'request': request}
        )
        write_serializer.is_valid(raise_exception=True)
        instance = write_serializer.save()
        
        read_serializer = HrPolicyReadSerializer(
            instance,
            context={'request': request}
        )
        return Response(read_serializer.data)
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        read_serializer = HrPolicyReadSerializer(
            instance,
            context={'request': request}
        )
        data = read_serializer.data
        
        instance.delete()
        
        return Response(
            {
                "message": "HR Policy амжилттай устгагдлаа",
                "deleted_data": data
            },
            status=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get only active policies"""
        active_policies = self.get_queryset().filter(active=True)
        serializer = HrPolicyReadSerializer(
            active_policies,
            many=True,
            context={'request': request}
        )
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Toggle active status"""
        instance = self.get_object()
        instance.active = not instance.active
        instance.save()
        
        serializer = HrPolicyReadSerializer(
            instance,
            context={'request': request}
        )
        return Response(serializer.data)
    

class JobViewSet(viewsets.ViewSet):

    
    permission_classes = [ReadOnlyOrAuthenticated]
    def list(self, request):

        queryset = Jobs.objects.all().order_by('-date').prefetch_related('jobtranslations_set__language')
        serializer = JobReadSerializer(queryset, many=True)
        return Response(serializer.data)
    
    def create(self, request):
      
        serializer = JobWriteSerializer(data=request.data)
        
        if serializer.is_valid():
            job = serializer.save()
            read_serializer = JobReadSerializer(job)
            return Response(read_serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def retrieve(self, request, pk=None):

        job = get_object_or_404(Jobs, pk=pk)
        serializer = JobReadSerializer(job)
        return Response(serializer.data)
    
    def update(self, request, pk=None):

        job = get_object_or_404(Jobs, pk=pk)
        serializer = JobWriteSerializer(job, data=request.data)
        
        if serializer.is_valid():
            job = serializer.save()
            read_serializer = JobReadSerializer(job)
            return Response(read_serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def partial_update(self, request, pk=None):

        job = get_object_or_404(Jobs, pk=pk)
        serializer = JobWriteSerializer(job, data=request.data, partial=True)
        
        if serializer.is_valid():
            job = serializer.save()
            read_serializer = JobReadSerializer(job)
            return Response(read_serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def destroy(self, request, pk=None):

        job = get_object_or_404(Jobs, pk=pk)
        job.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        queryset = Jobs.objects.filter(status=1).order_by('-date').prefetch_related('jobtranslations_set__language')
        serializer = JobReadSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_type(self, request):
  
        job_type = request.query_params.get('type')
        if not job_type:
            return Response(
                {"error": "Алдаа гарлаа."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = Jobs.objects.filter(type=job_type).order_by('-date').prefetch_related('jobtranslations_set__language')
        serializer = JobReadSerializer(queryset, many=True)
        return Response(serializer.data)
    

class FooterViewSet(viewsets.ModelViewSet):
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]
    """
    ViewSet for Footer with nested socials and urls + image upload
    
    GET /footer/ - List all footers
    GET /footer/{id}/ - Retrieve single footer
    POST /footer/ - Create new footer (multipart/form-data)
    PUT /footer/{id}/ - Update footer (multipart/form-data)
    PATCH /footer/{id}/ - Partial update footer
    DELETE /footer/{id}/ - Delete footer
    """
    queryset = Footer.objects.all().prefetch_related('footersocials_set', 'footerurls_set', 'footeremails_set', 'footerphones_set')
    parser_classes = (MultiPartParser, FormParser)
    
    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return FooterReadSerializer
        return FooterWriteSerializer
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = FooterReadSerializer(queryset, many=True)
        return Response(serializer.data)
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = FooterReadSerializer(instance)
        return Response(serializer.data)
    
    def create(self, request, *args, **kwargs):
        write_serializer = FooterWriteSerializer(data=request.data)
        write_serializer.is_valid(raise_exception=True)
        footer = write_serializer.save()
        
        read_serializer = FooterReadSerializer(footer)
        headers = self.get_success_headers(read_serializer.data)
        
        return Response(
            read_serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers
        )
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        write_serializer = FooterWriteSerializer(
            instance,
            data=request.data,
            partial=partial
        )
        write_serializer.is_valid(raise_exception=True)
        footer = write_serializer.save()
        
        read_serializer = FooterReadSerializer(footer)
        return Response(read_serializer.data)
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        read_serializer = FooterReadSerializer(instance)
        data = read_serializer.data
        
        if instance.logo:
            from app.utils.storage import delete_file
            delete_file(instance.logo)
        
        instance.delete()
        
        return Response(
            {
                "message": "Footer амжилттай устгагдлаа",
                "deleted_data": data
            },
            status=status.HTTP_200_OK
        )
    

class FloatMenuViewSet(viewsets.ModelViewSet):
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]
    queryset = FloatMenu.objects.all().prefetch_related(
        'floatmenutranslations_set',
        'floatmenusubmenus_set',
        'floatmenusubmenus_set__floatmenusubmenustranslations_set'
    )
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    
    def get_serializer_class(self):
        if self.action in ['list', 'retrieve', 'get_submenus']:
            return FloatMenuReadSerializer
        return FloatMenuWriteSerializer
    
    def list(self, request, *args, **kwargs):
        """List all float menus with nested data"""
        queryset = self.get_queryset()
        serializer = FloatMenuReadSerializer(queryset, many=True)
        return Response(serializer.data)
    
    def retrieve(self, request, *args, **kwargs):
        """Retrieve single float menu with nested data"""
        instance = self.get_object()
        serializer = FloatMenuReadSerializer(instance)
        return Response(serializer.data)
    
    def create(self, request, *args, **kwargs):
        """
        Create new float menu with translations and submenus
        
        Expected JSON format for translations and submenus:
        {
            "iconcolor": "#000000",
            "fontfamily": "Arial",
            "bgcolor": "#ffffff",
            "fontcolor": "#000000",
            "image": <file>,
            "svg": "<svg>...</svg>",
            "translations": [
                {"language": 1, "label": "Main Menu"},
                {"language": 2, "label": "Үндсэн цэс"}
            ],
            "submenus": [
                {
                    "url": "/about",
                    "file": <file>,
                    "fontfamily": "Arial",
                    "bgcolor": "#f0f0f0",
                    "fontcolor": "#333333",
                    "translations": [
                        {"language": 1, "title": "About"},
                        {"language": 2, "title": "Тухай"}
                    ]
                }
            ]
        }
        """
        # Handle JSON strings for nested data
        data = request.data.copy()
        
        # Parse translations if it's a JSON string
        if 'translations' in data and isinstance(data['translations'], str):
            import json
            data['translations'] = json.loads(data['translations'])
        
        # Parse submenus if it's a JSON string
        if 'submenus' in data and isinstance(data['submenus'], str):
            import json
            data['submenus'] = json.loads(data['submenus'])
        
        write_serializer = FloatMenuWriteSerializer(data=data)
        write_serializer.is_valid(raise_exception=True)
        float_menu = write_serializer.save()
        
        read_serializer = FloatMenuReadSerializer(float_menu)
        headers = self.get_success_headers(read_serializer.data)
        
        return Response(
            read_serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers
        )
    
    def update(self, request, *args, **kwargs):
        """Update float menu with translations and submenus"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Handle JSON strings for nested data
        data = request.data.copy()
        
        # Parse translations if it's a JSON string
        if 'translations' in data and isinstance(data['translations'], str):
            import json
            data['translations'] = json.loads(data['translations'])
        
        # Parse submenus if it's a JSON string
        if 'submenus' in data and isinstance(data['submenus'], str):
            import json
            data['submenus'] = json.loads(data['submenus'])
        
        write_serializer = FloatMenuWriteSerializer(
            instance,
            data=data,
            partial=partial
        )
        write_serializer.is_valid(raise_exception=True)
        float_menu = write_serializer.save()
        
        read_serializer = FloatMenuReadSerializer(float_menu)
        return Response(read_serializer.data)
    
    def destroy(self, request, *args, **kwargs):
        """Delete float menu and all associated files"""
        instance = self.get_object()
        read_serializer = FloatMenuReadSerializer(instance)
        data = read_serializer.data
        
        # Delete main menu image if exists
        if instance.image:
            clean_filename = str(instance.image).replace('media/', '').lstrip('/')
            if not clean_filename.startswith('float_menu/'):
                clean_filename = f"float_menu/{clean_filename}"
            delete_file(clean_filename)
        
        # Delete related social links first (FK → float_menu)
        FloatMenuSocials.objects.filter(float_menu=instance).delete()

        # Delete all submenu files and related DB records
        # Must delete in order: translations → submenus → menu translations → menu
        # Because FK uses DO_NOTHING, Django won't cascade automatically
        for submenu in instance.floatmenusubmenus_set.all():
            if submenu.file:
                clean_filename = str(submenu.file).replace('media/', '').lstrip('/')
                if not clean_filename.startswith('float_menu/'):
                    clean_filename = f"float_menu/submenus/{clean_filename.replace('submenus/', '')}"
                delete_file(clean_filename)
            # Delete submenu translations first (FK → submenu)
            submenu.floatmenusubmenustranslations_set.all().delete()
            # Then delete the submenu itself
            submenu.delete()
        
        # Delete float menu translations (FK → float_menu)
        instance.floatmenutranslations_set.all().delete()
        
        # Finally delete the float menu itself
        instance.delete()
        
        return Response(
            {
                "message": "FloatMenu амжилттай устгагдлаа",
                "deleted_data": data
            },
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['get'])
    def submenus(self, request, pk=None):
        """
        Get all submenus for a specific float menu
        GET /float-menu/{id}/submenus/
        """
        float_menu = self.get_object()
        submenus = float_menu.floatmenusubmenus_set.all()
        serializer = FloatMenuSubmenusReadSerializer(submenus, many=True)
        return Response(serializer.data)

class FloatMenuSubmenuViewSet(viewsets.ModelViewSet):
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]
    """
    ViewSet for managing FloatMenu submenus independently
    
    GET /float-menu-submenu/ - List all submenus
    GET /float-menu-submenu/{id}/ - Retrieve single submenu
    POST /float-menu-submenu/ - Create new submenu (multipart/form-data)
    PUT /float-menu-submenu/{id}/ - Update submenu (multipart/form-data)
    PATCH /float-menu-submenu/{id}/ - Partial update submenu
    DELETE /float-menu-submenu/{id}/ - Delete submenu
    """
    queryset = FloatMenuSubmenus.objects.all().prefetch_related(
        'floatmenusubmenustranslations_set'
    )
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    
    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return FloatMenuSubmenusReadSerializer
        elif self.action == 'create':
            return FloatMenuSubmenuCreateSerializer
        else:
            return FloatMenuSubmenuUpdateSerializer
    
    def list(self, request, *args, **kwargs):
        """
        List all submenus with optional filtering by float_menu
        Query params:
        - float_menu: Filter by float menu ID
        """
        queryset = self.get_queryset()
        
        # Filter by float_menu if provided
        float_menu_id = request.query_params.get('float_menu', None)
        if float_menu_id is not None:
            queryset = queryset.filter(float_menu_id=float_menu_id)
        
        serializer = FloatMenuSubmenusReadSerializer(queryset, many=True)
        return Response(serializer.data)
    
    def retrieve(self, request, *args, **kwargs):
        """Retrieve single submenu with translations"""
        instance = self.get_object()
        serializer = FloatMenuSubmenusReadSerializer(instance)
        return Response(serializer.data)
    
    def create(self, request, *args, **kwargs):
        """
        Create new submenu
        
        Expected format:
        {
            "float_menu": 1,
            "url": "/contact",
            "file": <file>,
            "fontfamily": "Arial",
            "bgcolor": "#f5f5f5",
            "fontcolor": "#333333",
            "translations": [
                {"language": 1, "title": "Contact"},
                {"language": 2, "title": "Холбоо барих"}
            ]
        }
        """
        # Handle JSON strings for nested data
        data = request.data.copy()
        
        # Parse translations if it's a JSON string
        if 'translations' in data and isinstance(data['translations'], str):
            import json
            data['translations'] = json.loads(data['translations'])
        
        write_serializer = FloatMenuSubmenuCreateSerializer(data=data)
        write_serializer.is_valid(raise_exception=True)
        submenu = write_serializer.save()
        
        read_serializer = FloatMenuSubmenusReadSerializer(submenu)
        headers = self.get_success_headers(read_serializer.data)
        
        return Response(
            read_serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers
        )
    
    def update(self, request, *args, **kwargs):
        """Update submenu"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Handle JSON strings for nested data
        data = request.data.copy()
        
        # Parse translations if it's a JSON string
        if 'translations' in data and isinstance(data['translations'], str):
            import json
            data['translations'] = json.loads(data['translations'])
        
        write_serializer = FloatMenuSubmenuUpdateSerializer(
            instance,
            data=data,
            partial=partial
        )
        write_serializer.is_valid(raise_exception=True)
        submenu = write_serializer.save()
        
        read_serializer = FloatMenuSubmenusReadSerializer(submenu)
        return Response(read_serializer.data)
    
    def destroy(self, request, *args, **kwargs):
        """Delete submenu and associated file"""
        instance = self.get_object()
        read_serializer = FloatMenuSubmenusReadSerializer(instance)
        data = read_serializer.data
        
        # Delete submenu file if exists
        if instance.file:
            clean_filename = str(instance.file).replace('media/', '').lstrip('/')
            if not clean_filename.startswith('float_menu/'):
                clean_filename = f"float_menu/submenus/{clean_filename.replace('submenus/', '')}"
            delete_file(clean_filename)
        
        instance.delete()
        
        return Response(
            {
                "message": "FloatMenu submenu амжилттай устгагдлаа",
                "deleted_data": data
            },
            status=status.HTTP_200_OK
        )

class FloatMenuSocialsViewSet(viewsets.ModelViewSet):
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]
    """ViewSet for managing floating menu social links"""
    queryset = FloatMenuSocials.objects.all().order_by('sort_order')
    serializer_class = FloatMenuSocialsSerializer
    parser_classes = (JSONParser,)

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response({"message": "Social link устгагдлаа"}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['put'])
    def bulk_update(self, request):
        """Replace all social links at once (delete all + recreate)"""
        socials_data = request.data if isinstance(request.data, list) else request.data.get('socials', [])
        
        with transaction.atomic():
            # Delete all existing
            FloatMenuSocials.objects.all().delete()
            
            # Create new ones
            created = []
            for item in socials_data:
                # id талбарыг хасах (шинээр үүсгэх болно)
                item_data = {k: v for k, v in item.items() if k != 'id'}
                serializer = self.get_serializer(data=item_data)
                serializer.is_valid(raise_exception=True)
                serializer.save()
                created.append(serializer.data)
        
        return Response(created, status=status.HTTP_200_OK)

class CallButtonViewSet(viewsets.ModelViewSet):
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]
    """ViewSet for managing the floating call button"""
    queryset = CallButton.objects.all()
    serializer_class = CallButtonSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def list(self, request, *args, **kwargs):
        """Return the call button settings (singleton — only first record)"""
        instance = CallButton.objects.first()
        if instance is None:
            return Response({
                'id': None,
                'url': '',
                'svg': '',
                'button_color': '#ef4444',
                'icon_color': '#ffffff',
                'active': True,
            })
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        """Create or update the call button (singleton pattern)"""
        instance = CallButton.objects.first()
        if instance:
            serializer = self.get_serializer(instance, data=request.data, partial=True)
        else:
            serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    def update(self, request, *args, **kwargs):
        """Update the call button"""
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

class HrSectionViewSet(viewsets.ModelViewSet):
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]
    """ViewSet for HR hero section styling (singleton)"""
    queryset = HrSection.objects.all().prefetch_related(
        'hrsectiontranslations_set',
        'hrsectiontranslations_set__language',
    )

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return HrSectionReadSerializer
        return HrSectionWriteSerializer

    def list(self, request, *args, **kwargs):
        instance = HrSection.objects.first()
        if instance is None:
            return Response({})
        serializer = HrSectionReadSerializer(instance, context={'request': request})
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        instance = HrSection.objects.first()
        if instance:
            write_serializer = HrSectionWriteSerializer(instance, data=request.data, partial=True, context={'request': request})
        else:
            write_serializer = HrSectionWriteSerializer(data=request.data, context={'request': request})
        write_serializer.is_valid(raise_exception=True)
        instance = write_serializer.save()
        instance = HrSection.objects.prefetch_related('hrsectiontranslations_set', 'hrsectiontranslations_set__language').get(pk=instance.pk)
        read_serializer = HrSectionReadSerializer(instance, context={'request': request})
        return Response(read_serializer.data, status=status.HTTP_200_OK)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        write_serializer = HrSectionWriteSerializer(instance, data=request.data, partial=True, context={'request': request})
        write_serializer.is_valid(raise_exception=True)
        instance = write_serializer.save()
        instance = HrSection.objects.prefetch_related('hrsectiontranslations_set', 'hrsectiontranslations_set__language').get(pk=instance.pk)
        read_serializer = HrSectionReadSerializer(instance, context={'request': request})
        return Response(read_serializer.data)
