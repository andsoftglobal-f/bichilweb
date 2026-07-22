from rest_framework.routers import DefaultRouter
from app.about_category.views import AboutCategoryViewSet

router = DefaultRouter()
router.register(r'about-category', AboutCategoryViewSet, basename='about-category')

urlpatterns = router.urls
