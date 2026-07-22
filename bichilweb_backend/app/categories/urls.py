from rest_framework.routers import DefaultRouter
from app.categories.views import CategoryViewSet

router = DefaultRouter()
router.register(r"categories", CategoryViewSet, basename="category")

urlpatterns = router.urls
