from rest_framework.routers import DefaultRouter
from app.loanrequest.views import LoanRequestViewSet, LoanRequestPageViewSet

router = DefaultRouter()
router.register(r'loan-request', LoanRequestViewSet, basename='loan-request')
router.register(r'loan-request-page', LoanRequestPageViewSet, basename='loan-request-page')

urlpatterns = router.urls
