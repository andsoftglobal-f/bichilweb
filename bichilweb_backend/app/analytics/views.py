from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from django.db.models import Count, Q
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from app.models.models import (
    AboutCategory,
    Advertisement,
    ExchangeRateConfig,
    JobTranslations,
    Jobs,
    LoanCalculatorConfig,
    News,
    NewsTitleTranslations,
    PageTitleTranslations,
    Pages,
    SiteAnalytics,
)
from .serializers import TrackPageViewSerializer


# Admin dashboard dates are selected in Mongolia local time.
ANALYTICS_TIMEZONE = ZoneInfo('Asia/Ulaanbaatar')
LANGUAGE_MN_ID = 2


def _safe_limit(value, default=10, max_value=50):
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return default
    return min(max(parsed, 1), max_value)


def _date_range_from_request(request, default_days=7):
    start_str = request.query_params.get('start')
    end_str = request.query_params.get('end')

    if start_str and end_str:
        try:
            start_date = datetime.strptime(start_str, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_str, '%Y-%m-%d').date()
        except ValueError:
            return None, None, None, None, Response(
                {'error': 'Invalid date format. Use YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST,
            )
    else:
        end_date = timezone.localtime(timezone.now(), ANALYTICS_TIMEZONE).date()
        start_date = end_date - timedelta(days=default_days - 1)

    if start_date > end_date:
        start_date, end_date = end_date, start_date

    start_datetime = timezone.make_aware(
        datetime.combine(start_date, datetime.min.time()),
        ANALYTICS_TIMEZONE,
    )
    end_datetime = timezone.make_aware(
        datetime.combine(end_date, datetime.max.time()),
        ANALYTICS_TIMEZONE,
    )
    return start_date, end_date, start_datetime, end_datetime, None


def _date_key(value):
    return value.strftime('%Y-%m-%d') if hasattr(value, 'strftime') else str(value)


def _normalize_datetime(value):
    if value is None:
        return None
    if not isinstance(value, datetime):
        value = datetime.combine(value, datetime.min.time())
    if timezone.is_naive(value):
        return timezone.make_aware(value, ANALYTICS_TIMEZONE)
    return value


def _translation_map(model, parent_field, ids, text_field='label'):
    if not ids:
        return {}
    queryset = model.objects.filter(
        **{
            f'{parent_field}_id__in': ids,
            'language_id': LANGUAGE_MN_ID,
        }
    ).values_list(f'{parent_field}_id', text_field)
    return {item_id: text for item_id, text in queryset if text}


@api_view(['POST'])
@permission_classes([AllowAny])
def track_page_view(request):
    """Record a page view event from the frontend. Public beacon — every
    visitor to the public site posts here, anonymously, by design."""
    serializer = TrackPageViewSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data

    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    ip_address = x_forwarded_for.split(',')[0] if x_forwarded_for else request.META.get('REMOTE_ADDR', '')

    SiteAnalytics.objects.create(
        session_id=data['session_id'],
        visitor_id=data['visitor_id'],
        page_path=data['page_path'],
        page_title=data.get('page_title', ''),
        referrer=data.get('referrer', ''),
        user_agent=data.get('user_agent', ''),
        device_type=data.get('device_type', 'desktop'),
        ip_address=ip_address,
    )
    return Response({'status': 'ok'}, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_summary(request):
    """
    Returns analytics summary for a date range.
    Query params: start (YYYY-MM-DD), end (YYYY-MM-DD)
    """
    start_date, end_date, start_datetime, end_datetime, error_response = _date_range_from_request(request)
    if error_response is not None:
        return error_response

    qs = SiteAnalytics.objects.filter(
        created_at__gte=start_datetime,
        created_at__lte=end_datetime,
    )

    daily_rows = qs.annotate(
        day=TruncDate('created_at', tzinfo=ANALYTICS_TIMEZONE),
    ).values('day').annotate(
        visitors=Count('visitor_id', distinct=True),
        sessions=Count('session_id', distinct=True),
        page_views=Count('id'),
    ).order_by('day')

    session_rows = qs.annotate(
        day=TruncDate('created_at', tzinfo=ANALYTICS_TIMEZONE),
    ).values('day', 'session_id').annotate(
        page_count=Count('id'),
    )

    bounce_map = {}
    for row in session_rows:
        day = _date_key(row['day'])
        current = bounce_map.setdefault(day, {'total': 0, 'bounced': 0})
        current['total'] += 1
        if row['page_count'] == 1:
            current['bounced'] += 1

    daily_map = {}
    for row in daily_rows:
        day = _date_key(row['day'])
        bounce = bounce_map.get(day, {'total': 0, 'bounced': 0})
        daily_map[day] = {
            'date': day,
            'visitors': row['visitors'],
            'sessions': row['sessions'],
            'pageViews': row['page_views'],
            'bounceRate': round((bounce['bounced'] / bounce['total'] * 100) if bounce['total'] else 0, 1),
        }

    daily_data = []
    current = start_date
    while current <= end_date:
        day = current.strftime('%Y-%m-%d')
        daily_data.append(daily_map.get(day, {
            'date': day,
            'visitors': 0,
            'sessions': 0,
            'pageViews': 0,
            'bounceRate': 0,
        }))
        current += timedelta(days=1)

    session_counts = list(qs.values('session_id').annotate(page_count=Count('id')))
    bounced_sessions = sum(1 for row in session_counts if row['page_count'] == 1)
    total_sessions = len(session_counts)

    return Response({
        'totals': {
            'visitors': qs.values('visitor_id').distinct().count(),
            'sessions': total_sessions,
            'pageViews': qs.count(),
            'bounceRate': round((bounced_sessions / total_sessions * 100) if total_sessions else 0, 1),
        },
        'daily': daily_data,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def page_stats(request):
    """
    Returns top pages with visit counts, percentages, and device breakdown.
    Query params: start (YYYY-MM-DD), end (YYYY-MM-DD), limit (int, default 10)
    """
    start_date, end_date, start_datetime, end_datetime, error_response = _date_range_from_request(request)
    if error_response is not None:
        return error_response

    limit = _safe_limit(request.query_params.get('limit'), default=10, max_value=50)
    qs = SiteAnalytics.objects.filter(
        created_at__gte=start_datetime,
        created_at__lte=end_datetime,
    )

    rows = qs.values('page_path').annotate(
        total_views=Count('id'),
        unique_visitors=Count('visitor_id', distinct=True),
        desktop=Count('id', filter=Q(device_type='desktop')),
        mobile=Count('id', filter=Q(device_type='mobile')),
        tablet=Count('id', filter=Q(device_type='tablet')),
    ).order_by('-total_views')[:limit]

    total = qs.count()
    denominator = total or 1

    pages = []
    for row in rows:
        total_views = row['total_views'] or 0
        row_denominator = total_views or 1
        desktop = row['desktop'] or 0
        mobile = row['mobile'] or 0
        tablet = row['tablet'] or 0

        pages.append({
            'page_path': row['page_path'],
            'total_views': total_views,
            'unique_visitors': row['unique_visitors'] or 0,
            'percentage': round(total_views / denominator * 100, 1),
            'desktop': desktop,
            'mobile': mobile,
            'tablet': tablet,
            'desktop_pct': round(desktop / row_denominator * 100, 1),
            'mobile_pct': round(mobile / row_denominator * 100, 1),
            'tablet_pct': round(tablet / row_denominator * 100, 1),
        })

    return Response({
        'total_views': total,
        'pages': pages,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recent_updates(request):
    """Return recently updated content from tables that have real timestamps."""
    limit = _safe_limit(request.query_params.get('limit'), default=10, max_value=50)
    items = []

    def add_item(item_type, label, item_id, title, updated_at, href):
        normalized = _normalize_datetime(updated_at)
        if normalized is None:
            return
        items.append({
            'id': f'{item_type}_{item_id}',
            'type': label,
            'title': title,
            'href': href,
            '_sortAt': normalized,
        })

    try:
        records = list(News.objects.filter(date__isnull=False).order_by('-date')[:limit])
        titles = _translation_map(NewsTitleTranslations, 'news', [record.id for record in records])
        for record in records:
            add_item('news', 'Мэдээ', record.id, titles.get(record.id) or f'Мэдээ #{record.id}', record.date, '/admin/news')
    except Exception:
        pass

    try:
        records = list(Jobs.objects.filter(date__isnull=False).order_by('-date')[:limit])
        titles = _translation_map(JobTranslations, 'job', [record.id for record in records], 'title')
        for record in records:
            add_item('job', 'Ажлын зар', record.id, titles.get(record.id) or f'Ажлын зар #{record.id}', record.date, '/admin/hr')
    except Exception:
        pass

    try:
        records = list(Pages.objects.filter(date__isnull=False).order_by('-date')[:limit])
        titles = _translation_map(PageTitleTranslations, 'page', [record.id for record in records])
        for record in records:
            title = titles.get(record.id) or record.url or f'Хуудас #{record.id}'
            add_item('page', 'Хуудас', record.id, title, record.date, '/admin/pages')
    except Exception:
        pass

    try:
        records = list(Advertisement.objects.filter(updated_at__isnull=False).order_by('-updated_at')[:limit])
        for record in records:
            add_item(
                'advertisement',
                'Зар сурталчилгаа',
                record.id,
                record.title or f'Зар #{record.id}',
                record.updated_at,
                '/admin/ads',
            )
    except Exception:
        pass

    try:
        records = list(AboutCategory.objects.filter(updated__isnull=False).order_by('-updated')[:limit])
        for record in records:
            add_item(
                'about_category',
                'Бидний тухай ангилал',
                record.id,
                f'Бидний тухай ангилал #{record.id}',
                record.updated,
                '/admin/about',
            )
    except Exception:
        pass

    try:
        for record in ExchangeRateConfig.objects.filter(updated_at__isnull=False).order_by('-updated_at')[:limit]:
            add_item(
                'exchange_rate',
                'Валютын ханш',
                record.id,
                'Валютын ханш тохиргоо',
                record.updated_at,
                '/admin/rates',
            )
    except Exception:
        pass

    try:
        for record in LoanCalculatorConfig.objects.filter(updated_at__isnull=False).order_by('-updated_at')[:limit]:
            add_item(
                'loan_calculator',
                'Зээлийн тооцоолуур',
                record.id,
                'Зээлийн тооцоолуур тохиргоо',
                record.updated_at,
                '/admin/calculator',
            )
    except Exception:
        pass

    items.sort(key=lambda item: item['_sortAt'], reverse=True)
    response_items = []
    for item in items[:limit]:
        updated_at = item.pop('_sortAt')
        response_items.append({
            **item,
            'updatedAt': updated_at.isoformat(),
        })

    return Response({'items': response_items})
