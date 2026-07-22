from rest_framework.routers import DefaultRouter
from app.aboutpage.views import AboutPageViewSet

router = DefaultRouter()
router.register(r"about-page", AboutPageViewSet, basename="about-page")

urlpatterns = router.urls
