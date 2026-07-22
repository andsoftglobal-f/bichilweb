from django.urls import path, include
from rest_framework.routers import DefaultRouter
from app.views.headers import HeaderViewSet  
from app.views.headersMenu import HeaderMenuViewSet
from app.views.headersSubmenu import HeaderSubmenuViewSet
from app.views.headersTertiaryMenu import HeaderTertiaryMenuViewSet
from app.views.headersQuaternaryMenu import HeaderQuaternaryMenuViewSet
from app.views.headerStyle import HeaderStyleViewSet
from app.views.heroSlider import HeroSliderViewSet
from app.views.cta import CtaViewSet
from app.views.appDownload import AppDownloadViewSet
from app.views.upload import FileUploadView
from app.views.partner import PartnerViewSet, PartnerSectionConfigViewSet
from app.views.statItem import StatItemViewSet
from app.views.statsConfig import StatsConfigViewSet
from app.views.cv_application import CvApplicationViewSet
from app.views.advertisement import AdvertisementViewSet
from app.views.productTutorial import ProductTutorialViewSet
from app.views.productTutorialConfig import ProductTutorialConfigViewSet
from app.views.homePageLink import HomePageLinkViewSet

router = DefaultRouter()
router.register(r'headers', HeaderViewSet, basename='header')
router.register(r'header-menu', HeaderMenuViewSet, basename='header-menu')
router.register(r'header-submenu', HeaderSubmenuViewSet, basename='header-submenu')
router.register(r'header-tertiary', HeaderTertiaryMenuViewSet, basename='header-tertiary')
router.register(r'header-quaternary', HeaderQuaternaryMenuViewSet, basename='header-quaternary')
router.register(r'header-style', HeaderStyleViewSet, basename='header-style')
router.register(r'hero-slider', HeroSliderViewSet, basename='hero-slider')
router.register(r'CTA', CtaViewSet, basename='CTA')
router.register(r'app-download', AppDownloadViewSet, basename='app-download')
router.register(r'partners', PartnerViewSet, basename='partners')
router.register(r'partner-section-config', PartnerSectionConfigViewSet, basename='partner-section-config')
router.register(r'stat-items', StatItemViewSet, basename='stat-items')
router.register(r'stats-config', StatsConfigViewSet, basename='stats-config')
router.register(r'cv-applications', CvApplicationViewSet, basename='cv-applications')
router.register(r'advertisements', AdvertisementViewSet, basename='advertisements')
router.register(r'product-tutorials', ProductTutorialViewSet, basename='product-tutorials')
router.register(r'product-tutorial-config', ProductTutorialConfigViewSet, basename='product-tutorial-config')
router.register(r'home-page-links', HomePageLinkViewSet, basename='home-page-links')

urlpatterns = [
    path('', include(router.urls)),
    path('upload/', FileUploadView.as_view(), name='file-upload'),
]
