from rest_framework.routers import DefaultRouter
from app.product.views import ProductTypeViewSet, ProductViewSet, ProductDocumentViewSet, ProductCollateralViewSet, ProductConditionViewSet

router = DefaultRouter()

router.register(r"product-type", ProductTypeViewSet, basename="producttype")
router.register(r"product", ProductViewSet, basename="product")
router.register(r"product-document", ProductDocumentViewSet, basename="productdocument")
router.register(r"product-collateral", ProductCollateralViewSet, basename="productcollateral")
router.register(r"product-condition", ProductConditionViewSet, basename="productcondition")

urlpatterns = router.urls
