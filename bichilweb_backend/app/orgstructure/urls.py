from rest_framework.routers import DefaultRouter
from app.orgstructure.views import OrgStructureViewSet

router = DefaultRouter()
router.register(r"org-structure", OrgStructureViewSet, basename="org-structure")
