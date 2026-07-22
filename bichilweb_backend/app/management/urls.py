from rest_framework.routers import DefaultRouter
from app.management.views import ManagementMemberViewSet

router = DefaultRouter()
router.register(r"management", ManagementMemberViewSet, basename="management")

urlpatterns = router.urls
