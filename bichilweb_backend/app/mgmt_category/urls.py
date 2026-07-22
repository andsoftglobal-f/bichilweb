from rest_framework.routers import DefaultRouter
from app.mgmt_category.views import ManagementCategoryViewSet

router = DefaultRouter()
router.register(r"management-category", ManagementCategoryViewSet, basename="management-category")

urlpatterns = router.urls
