from rest_framework.routers import DefaultRouter
from app.exchangerate.views import ExchangeRateConfigViewSet

router = DefaultRouter()
router.register(r"exchange-rate-config", ExchangeRateConfigViewSet, basename="exchange-rate-config")

urlpatterns = router.urls
