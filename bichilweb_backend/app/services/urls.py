from rest_framework.routers import DefaultRouter
from app.services.views import ServicesViewSet, ServiceCardViewSet, ServiceDocumentViewSet, ServiceConditionViewSet, ServiceCollateralViewSet

router = DefaultRouter()

router.register(r'services', ServicesViewSet, basename='services')
router.register(r'service-card', ServiceCardViewSet, basename='servicecard')
router.register(r'service-document', ServiceDocumentViewSet, basename='servicedocument')
router.register(r'service-condition', ServiceConditionViewSet, basename='servicecondition')
router.register(r'service-collateral', ServiceCollateralViewSet, basename='servicecollateral')

urlpatterns = router.urls
