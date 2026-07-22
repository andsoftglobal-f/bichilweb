from django.urls import path
from rest_framework.routers import DefaultRouter
from app.news.views import NewsCategoryViewSet, NewsViewSet, news_page_settings_view

router = DefaultRouter()

router.register(r"news-category", NewsCategoryViewSet, basename="newscategory")
router.register(r"news", NewsViewSet, basename="news")

extra_urlpatterns = [
    path('news-page-settings/', news_page_settings_view, name='news-page-settings'),
]

urlpatterns = extra_urlpatterns + router.urls
