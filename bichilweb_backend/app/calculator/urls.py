from rest_framework.routers import DefaultRouter
from app.calculator.views import LoanCalculatorConfigViewSet

router = DefaultRouter()
router.register(r"calculator-config", LoanCalculatorConfigViewSet, basename="calculator-config")

urlpatterns = router.urls
