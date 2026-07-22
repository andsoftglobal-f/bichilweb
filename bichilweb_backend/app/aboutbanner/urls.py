from rest_framework.routers import DefaultRouter
from app.aboutbanner.views import AboutBannerViewSet

router = DefaultRouter()
router.register(r"about-banner", AboutBannerViewSet, basename="about-banner")
