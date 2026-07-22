from rest_framework.routers import DefaultRouter
from app.corevalue.views import CoreValueViewSet

router = DefaultRouter()
router.register(r"core-value", CoreValueViewSet, basename="core-value")

urlpatterns = router.urls
