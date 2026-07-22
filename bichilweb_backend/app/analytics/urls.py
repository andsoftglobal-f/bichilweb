from django.urls import path
from . import views

urlpatterns = [
    path('analytics/track/', views.track_page_view, name='analytics-track'),
    path('analytics/summary/', views.analytics_summary, name='analytics-summary'),
    path('analytics/pages/', views.page_stats, name='analytics-pages'),
    path('analytics/recent-updates/', views.recent_updates, name='analytics-recent-updates'),
]
