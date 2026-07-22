from rest_framework.routers import DefaultRouter
from app.timeline.views import TimelineEventViewSet

router = DefaultRouter()
router.register(r"timeline", TimelineEventViewSet, basename="timeline")

urlpatterns = router.urls
