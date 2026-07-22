"""
Migration: Create all application tables that have managed=False.
Uses CREATE TABLE IF NOT EXISTS so it's safe to run on existing databases.
"""

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0006_aboutbanner_aboutbannertranslations_and_more'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
-- ============================================================
-- 1. STANDALONE TABLES (no foreign keys to app tables)
-- ============================================================

-- Language table is already created by migration 0003
-- ALTER TABLE to add columns if they don't exist
ALTER TABLE IF EXISTS "language"
ADD COLUMN IF NOT EXISTS lang_code TEXT;

ALTER TABLE IF EXISTS "language"
ADD COLUMN IF NOT EXISTS lang_name TEXT;

-- Insert default languages if they don't exist (checking by lang_code)
INSERT INTO "language" (id, lang_code, lang_name)
VALUES (1, 'mn', 'Монгол'), (2, 'en', 'English')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS "font" (
    id BIGINT PRIMARY KEY,
    font TEXT
);

CREATE TABLE IF NOT EXISTS "category" (
    id BIGSERIAL PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS "conditions" (
    id BIGSERIAL PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS "collateral" (
    id BIGSERIAL PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS "document" (
    id BIGSERIAL PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS "header" (
    id BIGSERIAL PRIMARY KEY,
    logo TEXT,
    active SMALLINT
);

CREATE TABLE IF NOT EXISTS "footer" (
    id BIGSERIAL PRIMARY KEY,
    logotext TEXT,
    logo TEXT,
    svg TEXT,
    "descMN" TEXT,
    "descEN" TEXT,
    "locationMN" TEXT,
    "locationEN" TEXT,
    email TEXT,
    phone TEXT,
    "bgColor" TEXT,
    fontcolor TEXT,
    featurecolor TEXT,
    "socialIconColor" TEXT,
    "titleSize" TEXT,
    fontsize TEXT,
    "copyrightEN" TEXT,
    "copyrightMN" TEXT
);

CREATE TABLE IF NOT EXISTS "news_category" (
    id BIGSERIAL PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS "hero_slider" (
    id BIGSERIAL PRIMARY KEY,
    type TEXT,
    file TEXT,
    time SMALLINT,
    index SMALLINT,
    visible BOOLEAN,
    tablet_file TEXT,
    tablet_type TEXT DEFAULT 'i',
    mobile_file TEXT,
    mobile_type TEXT DEFAULT 'i'
);

CREATE TABLE IF NOT EXISTS "pages" (
    id BIGSERIAL PRIMARY KEY,
    url TEXT,
    active BOOLEAN,
    image TEXT,
    date TIMESTAMP,
    style SMALLINT,
    content_blocks TEXT DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS "about_page" (
    id BIGSERIAL PRIMARY KEY,
    key TEXT,
    active BOOLEAN,
    created TIMESTAMP,
    updated TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "core_value" (
    id BIGSERIAL PRIMARY KEY,
    file TEXT,
    file_ratio TEXT,
    index BIGINT,
    visible BOOLEAN
);

CREATE TABLE IF NOT EXISTS "vision_block" (
    id BIGSERIAL PRIMARY KEY,
    file TEXT,
    file_ratio TEXT,
    visible BOOLEAN
);

CREATE TABLE IF NOT EXISTS "float_menu" (
    id BIGSERIAL PRIMARY KEY,
    iconcolor TEXT,
    fontfamily TEXT,
    bgcolor TEXT,
    fontcolor TEXT,
    image TEXT,
    svg TEXT
);

CREATE TABLE IF NOT EXISTS "shareholder" (
    id BIGSERIAL PRIMARY KEY,
    image TEXT,
    index BIGINT,
    active BOOLEAN,
    created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "timeline" (
    id BIGSERIAL PRIMARY KEY,
    year TEXT,
    "order" BIGINT,
    color TEXT,
    visible BOOLEAN
);

CREATE TABLE IF NOT EXISTS "jobs" (
    id BIGSERIAL PRIMARY KEY,
    type SMALLINT,
    location TEXT,
    deadline DATE,
    status SMALLINT,
    date TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "hr_policy" (
    id BIGSERIAL PRIMARY KEY,
    key TEXT,
    visual_type TEXT,
    visual_preset TEXT,
    font_color TEXT,
    bg_color TEXT,
    fontsize TEXT,
    active BOOLEAN,
    created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "management_member" (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(20) DEFAULT 'management',
    image TEXT,
    sort_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS "management_category" (
    id BIGSERIAL PRIMARY KEY,
    key VARCHAR(50) UNIQUE,
    sort_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created TIMESTAMP,
    updated TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "branch_category" (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS "app_download" (
    id BIGSERIAL PRIMARY KEY,
    image TEXT,
    index SMALLINT,
    appstore TEXT,
    playstore TEXT,
    bgcolor TEXT,
    fontcolor TEXT,
    titlecolor TEXT,
    iconcolor TEXT,
    buttonbgcolor TEXT,
    buttonfontcolor TEXT,
    googlebuttonbgcolor TEXT,
    googlebuttonfontcolor TEXT,
    active BOOLEAN DEFAULT TRUE,
    layout TEXT DEFAULT 'standard',
    features_layout TEXT DEFAULT 'vertical'
);

CREATE TABLE IF NOT EXISTS "news_page_settings" (
    id BIGSERIAL PRIMARY KEY,
    latest_heading TEXT DEFAULT 'Сүүлийн мэдээнүүд',
    featured_heading TEXT DEFAULT 'Онцлох мэдээ'
);

CREATE TABLE IF NOT EXISTS "branch_page_settings" (
    id BIGSERIAL PRIMARY KEY,
    popup_bg TEXT DEFAULT '#ffffff',
    popup_title_color TEXT DEFAULT '#111827',
    popup_text_color TEXT DEFAULT '#374151',
    popup_icon_color TEXT DEFAULT '#0d9488',
    popup_btn_bg TEXT DEFAULT '#0d9488',
    popup_btn_text TEXT DEFAULT '#ffffff',
    popup_btn_label TEXT DEFAULT 'Чиглэл авах',
    card_bg TEXT DEFAULT '#ffffff',
    card_border TEXT DEFAULT '#e5e7eb',
    card_title_color TEXT DEFAULT '#111827',
    card_text_color TEXT DEFAULT '#4b5563',
    card_icon_color TEXT DEFAULT '#0d9488',
    card_btn_bg TEXT DEFAULT '#f0fdfa',
    card_btn_text TEXT DEFAULT '#0d9488',
    card_btn_label TEXT DEFAULT 'Газрын зургаас харах',
    marker_color TEXT DEFAULT '#0d9488',
    marker_selected_color TEXT DEFAULT '#0f766e',
    map_btn_bg TEXT DEFAULT '#0d9488',
    map_btn_text TEXT DEFAULT '#ffffff',
    map_btn_label TEXT DEFAULT 'Газрын зураг'
);

CREATE TABLE IF NOT EXISTS "loan_calculator_config" (
    id BIGSERIAL PRIMARY KEY,
    key VARCHAR(50) UNIQUE DEFAULT 'default',
    default_amount BIGINT DEFAULT 10000000,
    default_rate NUMERIC(5,2) DEFAULT 2.5,
    default_term INTEGER DEFAULT 12,
    max_amount BIGINT DEFAULT 100000000,
    max_term INTEGER DEFAULT 60,
    min_rate NUMERIC(5,2) DEFAULT 0.5,
    max_rate NUMERIC(5,2) DEFAULT 5.0,
    active BOOLEAN DEFAULT TRUE,
    calc_btn_color VARCHAR(20) DEFAULT '#0d9488',
    calc_btn_font_size VARCHAR(10) DEFAULT '14px',
    calc_btn_text VARCHAR(100) DEFAULT 'Тооцоолох',
    request_btn_color VARCHAR(20) DEFAULT '#2563eb',
    request_btn_font_size VARCHAR(10) DEFAULT '14px',
    request_btn_text VARCHAR(100) DEFAULT 'Хүсэлт илгээх',
    request_btn_url VARCHAR(500) DEFAULT '',
    disclaimer_color VARCHAR(20) DEFAULT '#92400e',
    disclaimer_font_size VARCHAR(10) DEFAULT '10px',
    disclaimer_text TEXT DEFAULT 'Энэхүү тооцоолуур нь зөвхөн мэдээллийн зорилготой бөгөөд бодит зээлийн нөхцөл өөр байж болно.',
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "exchange_rate_config" (
    id SERIAL PRIMARY KEY,
    config_json TEXT DEFAULT '{}',
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "site_analytics" (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(64),
    visitor_id VARCHAR(64),
    page_path VARCHAR(500),
    page_title VARCHAR(500) DEFAULT '',
    referrer VARCHAR(500) DEFAULT '',
    user_agent TEXT DEFAULT '',
    device_type VARCHAR(20) DEFAULT 'desktop',
    ip_address VARCHAR(45) DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "CTA" (
    id BIGSERIAL PRIMARY KEY,
    file TEXT,
    index SMALLINT,
    font TEXT,
    color TEXT,
    number TEXT,
    description TEXT,
    url TEXT
);

CREATE TABLE IF NOT EXISTS "Services" (
    id BIGSERIAL PRIMARY KEY
);

-- ============================================================
-- 2. TABLES WITH FOREIGN KEYS (depend on tables above)
-- ============================================================

CREATE TABLE IF NOT EXISTS "category_translations" (
    id BIGSERIAL PRIMARY KEY,
    category BIGINT REFERENCES "category"(id),
    language BIGINT REFERENCES "language"(id),
    label TEXT
);

CREATE TABLE IF NOT EXISTS "condition_translations" (
    id BIGSERIAL PRIMARY KEY,
    language BIGINT REFERENCES "language"(id),
    label TEXT,
    condition BIGINT REFERENCES "conditions"(id)
);

CREATE TABLE IF NOT EXISTS "collateral_translation" (
    id BIGSERIAL PRIMARY KEY,
    collateral BIGINT REFERENCES "collateral"(id),
    language BIGINT REFERENCES "language"(id),
    label TEXT
);

CREATE TABLE IF NOT EXISTS "document_translation" (
    id BIGSERIAL PRIMARY KEY,
    document BIGINT REFERENCES "document"(id),
    language BIGINT REFERENCES "language"(id),
    label TEXT
);

CREATE TABLE IF NOT EXISTS "product_type" (
    id BIGSERIAL PRIMARY KEY,
    category BIGINT REFERENCES "category"(id)
);

CREATE TABLE IF NOT EXISTS "product" (
    id BIGSERIAL PRIMARY KEY,
    product_type BIGINT REFERENCES "product_type"(id)
);

CREATE TABLE IF NOT EXISTS "product_translations" (
    id BIGSERIAL PRIMARY KEY,
    product BIGINT REFERENCES "product"(id) ON DELETE CASCADE,
    language BIGINT REFERENCES "language"(id),
    label TEXT
);

CREATE TABLE IF NOT EXISTS "product_type_translations" (
    id BIGSERIAL PRIMARY KEY,
    product_type BIGINT REFERENCES "product_type"(id) ON DELETE CASCADE,
    language BIGINT REFERENCES "language"(id),
    label TEXT
);

CREATE TABLE IF NOT EXISTS "product_details" (
    id BIGSERIAL PRIMARY KEY,
    product BIGINT REFERENCES "product"(id) ON DELETE CASCADE,
    amount NUMERIC(12,2),
    min_fee_percent NUMERIC(5,2),
    max_fee_percent NUMERIC(5,2),
    min_interest_rate NUMERIC(10,2),
    max_interest_rate NUMERIC(10,2),
    term_months SMALLINT,
    min_processing_hours SMALLINT,
    max_processing_hoyrs SMALLINT,
    processing_time_minutes INTEGER DEFAULT 0,
    fee_type VARCHAR(20) DEFAULT 'fee',
    calc_btn_color VARCHAR(20) DEFAULT '#0d9488',
    calc_btn_font_size VARCHAR(10) DEFAULT '14px',
    calc_btn_text VARCHAR(100) DEFAULT 'Тооцоолох',
    request_btn_color VARCHAR(20) DEFAULT '#2563eb',
    request_btn_font_size VARCHAR(10) DEFAULT '14px',
    request_btn_text VARCHAR(100) DEFAULT 'Хүсэлт илгээх',
    request_btn_url VARCHAR(500) DEFAULT '',
    disclaimer_color VARCHAR(20) DEFAULT '#92400e',
    disclaimer_font_size VARCHAR(10) DEFAULT '10px',
    disclaimer_text TEXT DEFAULT 'Энэхүү тооцоолуур нь зөвхөн мэдээллийн зорилготой бөгөөд бодит зээлийн нөхцөл өөр байж болно.'
);

CREATE TABLE IF NOT EXISTS "product_document" (
    id BIGSERIAL PRIMARY KEY,
    product BIGINT REFERENCES "product"(id) ON DELETE CASCADE,
    document BIGINT REFERENCES "document"(id)
);

CREATE TABLE IF NOT EXISTS "product_collaterial" (
    id BIGSERIAL PRIMARY KEY,
    product BIGINT REFERENCES "product"(id) ON DELETE CASCADE,
    collateral BIGINT REFERENCES "collateral"(id)
);

CREATE TABLE IF NOT EXISTS "product_condition" (
    id BIGSERIAL PRIMARY KEY,
    product BIGINT REFERENCES "product"(id) ON DELETE CASCADE,
    condition BIGINT REFERENCES "conditions"(id)
);

CREATE TABLE IF NOT EXISTS "Services_translations" (
    id BIGSERIAL PRIMARY KEY,
    service BIGINT REFERENCES "Services"(id),
    language BIGINT REFERENCES "language"(id),
    title TEXT,
    description TEXT
);

CREATE TABLE IF NOT EXISTS "Service_card" (
    id BIGSERIAL PRIMARY KEY,
    title TEXT,
    service BIGINT REFERENCES "Services"(id)
);

CREATE TABLE IF NOT EXISTS "Service_card_translations" (
    id BIGSERIAL PRIMARY KEY,
    service_card BIGINT REFERENCES "Service_card"(id),
    label TEXT,
    short_desc TEXT,
    language BIGINT REFERENCES "language"(id)
);

CREATE TABLE IF NOT EXISTS "service_collateral" (
    id BIGSERIAL PRIMARY KEY,
    service BIGINT REFERENCES "Services"(id),
    collateral BIGINT REFERENCES "collateral"(id)
);

CREATE TABLE IF NOT EXISTS "service_condition" (
    id BIGSERIAL PRIMARY KEY,
    service BIGINT REFERENCES "Services"(id),
    condition BIGINT REFERENCES "conditions"(id)
);

CREATE TABLE IF NOT EXISTS "service_document" (
    id BIGSERIAL PRIMARY KEY,
    service BIGINT REFERENCES "Services"(id),
    document BIGINT REFERENCES "document"(id)
);

CREATE TABLE IF NOT EXISTS "header_menu" (
    id BIGSERIAL PRIMARY KEY,
    header BIGINT REFERENCES "header"(id),
    font BIGINT,
    path TEXT,
    index SMALLINT,
    visible SMALLINT
);

CREATE TABLE IF NOT EXISTS "header_menu_translation" (
    id BIGSERIAL PRIMARY KEY,
    menu BIGINT REFERENCES "header_menu"(id),
    language BIGINT REFERENCES "language"(id),
    label TEXT
);

CREATE TABLE IF NOT EXISTS "header_style" (
    id BIGSERIAL PRIMARY KEY,
    header BIGINT REFERENCES "header"(id),
    "bgColor" TEXT,
    "fontColor" TEXT,
    "hoverColor" TEXT,
    height SMALLINT,
    sticky SMALLINT,
    max_width TEXT DEFAULT '1240px',
    logo_size SMALLINT DEFAULT 44
);

CREATE TABLE IF NOT EXISTS "header_submenu" (
    id BIGSERIAL PRIMARY KEY,
    header_menu BIGINT REFERENCES "header_menu"(id),
    font BIGINT,
    path TEXT,
    index SMALLINT,
    visible SMALLINT
);

CREATE TABLE IF NOT EXISTS "header_submenu_translation" (
    id BIGSERIAL PRIMARY KEY,
    submenu BIGINT REFERENCES "header_submenu"(id),
    language BIGINT REFERENCES "language"(id),
    label TEXT
);

CREATE TABLE IF NOT EXISTS "header_tertiary_menu" (
    id BIGSERIAL PRIMARY KEY,
    header_submenu BIGINT REFERENCES "header_submenu"(id),
    font TEXT,
    path TEXT,
    index SMALLINT,
    visible SMALLINT
);

CREATE TABLE IF NOT EXISTS "header_tertiary_menu_translation" (
    id BIGSERIAL PRIMARY KEY,
    tertiary_menu BIGINT REFERENCES "header_tertiary_menu"(id),
    language BIGINT REFERENCES "language"(id),
    label TEXT
);

CREATE TABLE IF NOT EXISTS "footer_socials" (
    id BIGSERIAL PRIMARY KEY,
    footer BIGINT REFERENCES "footer"(id),
    social TEXT,
    url TEXT,
    index SMALLINT,
    active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS "footer_urls" (
    id BIGSERIAL PRIMARY KEY,
    footer BIGINT REFERENCES "footer"(id),
    "nameEN" TEXT,
    "nameMN" TEXT,
    url TEXT
);

CREATE TABLE IF NOT EXISTS "news" (
    id BIGSERIAL PRIMARY KEY,
    category BIGINT REFERENCES "news_category"(id),
    image TEXT,
    video TEXT,
    feature BOOLEAN,
    render BOOLEAN,
    show_on_home BOOLEAN DEFAULT FALSE,
    readtime SMALLINT,
    slug TEXT,
    date TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "news_category_translations" (
    id BIGSERIAL PRIMARY KEY,
    category BIGINT REFERENCES "news_category"(id),
    language BIGINT REFERENCES "language"(id),
    label TEXT
);

CREATE TABLE IF NOT EXISTS "news_title_translations" (
    id BIGSERIAL PRIMARY KEY,
    news BIGINT REFERENCES "news"(id),
    language BIGINT REFERENCES "language"(id),
    label TEXT,
    font TEXT,
    family TEXT,
    weight TEXT,
    size TEXT
);

CREATE TABLE IF NOT EXISTS "news_shortdesc_translations" (
    id BIGSERIAL PRIMARY KEY,
    news BIGINT REFERENCES "news"(id),
    language BIGINT REFERENCES "language"(id),
    label TEXT,
    font TEXT,
    family TEXT,
    weight TEXT,
    size TEXT
);

CREATE TABLE IF NOT EXISTS "news_content_translations" (
    id BIGSERIAL PRIMARY KEY,
    news BIGINT REFERENCES "news"(id),
    language BIGINT REFERENCES "language"(id),
    label TEXT,
    font TEXT,
    family TEXT,
    weight TEXT,
    size TEXT
);

CREATE TABLE IF NOT EXISTS "news_images" (
    id BIGSERIAL PRIMARY KEY,
    news BIGINT REFERENCES "news"(id),
    image TEXT
);

CREATE TABLE IF NOT EXISTS "news_socials" (
    id BIGSERIAL PRIMARY KEY,
    news BIGINT REFERENCES "news"(id),
    social TEXT,
    icon TEXT
);

CREATE TABLE IF NOT EXISTS "page_title_translations" (
    id BIGSERIAL PRIMARY KEY,
    page BIGINT REFERENCES "pages"(id),
    language BIGINT REFERENCES "language"(id),
    label TEXT,
    font TEXT,
    family TEXT,
    weight TEXT,
    size TEXT
);

CREATE TABLE IF NOT EXISTS "page_description_translations" (
    id BIGSERIAL PRIMARY KEY,
    page BIGINT REFERENCES "pages"(id),
    language BIGINT REFERENCES "language"(id),
    label TEXT,
    font TEXT,
    family TEXT,
    weight TEXT,
    size TEXT
);

CREATE TABLE IF NOT EXISTS "about_page_section" (
    id BIGSERIAL PRIMARY KEY,
    page BIGINT REFERENCES "about_page"(id),
    index SMALLINT,
    visible BOOLEAN,
    created TIMESTAMP,
    updated TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "about_page_block" (
    id BIGSERIAL PRIMARY KEY,
    section BIGINT REFERENCES "about_page_section"(id),
    index SMALLINT,
    visible BOOLEAN
);

CREATE TABLE IF NOT EXISTS "about_page_media" (
    id BIGSERIAL PRIMARY KEY,
    about BIGINT REFERENCES "about_page"(id),
    file TEXT,
    aspect_ratio TEXT
);

CREATE TABLE IF NOT EXISTS "about_page_section_translations" (
    id BIGSERIAL PRIMARY KEY,
    section BIGINT REFERENCES "about_page_section"(id),
    language BIGINT REFERENCES "language"(id),
    title TEXT,
    color TEXT,
    fontsize TEXT,
    fontweight TEXT,
    fontfamily TEXT
);

CREATE TABLE IF NOT EXISTS "about_page_block_translations" (
    id BIGSERIAL PRIMARY KEY,
    block BIGINT REFERENCES "about_page_block"(id) ON DELETE CASCADE,
    language BIGINT REFERENCES "language"(id),
    content TEXT,
    fontcolor TEXT,
    fontsize TEXT,
    fontweight TEXT,
    fontfamily TEXT
);

CREATE TABLE IF NOT EXISTS "about_page_translations" (
    id BIGSERIAL PRIMARY KEY,
    page BIGINT REFERENCES "about_page"(id),
    language BIGINT REFERENCES "language"(id),
    label TEXT,
    font TEXT,
    family TEXT,
    weight TEXT,
    size TEXT
);

CREATE TABLE IF NOT EXISTS "core_value_title_translations" (
    id BIGSERIAL PRIMARY KEY,
    core_value BIGINT REFERENCES "core_value"(id),
    language BIGINT REFERENCES "language"(id),
    label TEXT,
    fontcolor TEXT,
    fontsize BIGINT,
    fontweight SMALLINT,
    fontfamily TEXT,
    letterspace BIGINT
);

CREATE TABLE IF NOT EXISTS "core_value_desc_translations" (
    id BIGSERIAL PRIMARY KEY,
    core_value BIGINT REFERENCES "core_value"(id),
    language BIGINT REFERENCES "language"(id),
    label TEXT,
    fontcolor TEXT,
    fontsize SMALLINT,
    fontweight TEXT,
    fontfamily TEXT,
    letterspace TEXT
);

CREATE TABLE IF NOT EXISTS "vision_block_title_translations" (
    id BIGSERIAL PRIMARY KEY,
    vision_block BIGINT REFERENCES "vision_block"(id),
    language BIGINT REFERENCES "language"(id),
    title TEXT,
    fontcolor TEXT,
    fontsize BIGINT,
    fontweight SMALLINT,
    fontfamily TEXT,
    letterspace BIGINT
);

CREATE TABLE IF NOT EXISTS "vision_block_desc_translations" (
    id BIGSERIAL PRIMARY KEY,
    vision_block BIGINT REFERENCES "vision_block"(id),
    language BIGINT REFERENCES "language"(id),
    "desc" TEXT,
    fontcolor TEXT,
    fontsize BIGINT,
    fontweight TEXT,
    fontfamily TEXT,
    letterspace BIGINT
);

CREATE TABLE IF NOT EXISTS "float_menu_submenus" (
    id BIGSERIAL PRIMARY KEY,
    float_menu BIGINT REFERENCES "float_menu"(id),
    url TEXT,
    file TEXT,
    fontfamily TEXT,
    bgcolor TEXT,
    fontcolor TEXT,
    svg TEXT
);

CREATE TABLE IF NOT EXISTS "float_menu_translations" (
    id BIGSERIAL PRIMARY KEY,
    float_menu BIGINT REFERENCES "float_menu"(id),
    language BIGINT REFERENCES "language"(id),
    label TEXT
);

CREATE TABLE IF NOT EXISTS "float_menu_submenus_translations" (
    id BIGSERIAL PRIMARY KEY,
    float_menu_submenu BIGINT REFERENCES "float_menu_submenus"(id),
    language BIGINT REFERENCES "language"(id),
    title TEXT
);

CREATE TABLE IF NOT EXISTS "shareholder_translations" (
    id BIGSERIAL PRIMARY KEY,
    shareholder BIGINT REFERENCES "shareholder"(id),
    language BIGINT REFERENCES "language"(id),
    fullname TEXT,
    role TEXT,
    description TEXT
);

CREATE TABLE IF NOT EXISTS "timeline_translations" (
    id BIGSERIAL PRIMARY KEY,
    timeline BIGINT REFERENCES "timeline"(id),
    language BIGINT REFERENCES "language"(id),
    title TEXT,
    title_color TEXT,
    shortdesc TEXT,
    shortdesc_color TEXT,
    fulldesc TEXT,
    fulldesc_color TEXT
);

CREATE TABLE IF NOT EXISTS "job_translations" (
    id BIGSERIAL PRIMARY KEY,
    job BIGINT REFERENCES "jobs"(id),
    language BIGINT REFERENCES "language"(id),
    title TEXT,
    department TEXT,
    "desc" TEXT,
    requirements TEXT
);

CREATE TABLE IF NOT EXISTS "hr_policy_translations" (
    id BIGSERIAL PRIMARY KEY,
    policy BIGINT REFERENCES "hr_policy"(id),
    language BIGINT REFERENCES "language"(id),
    name TEXT,
    "desc" TEXT
);

CREATE TABLE IF NOT EXISTS "management_member_translations" (
    id BIGSERIAL PRIMARY KEY,
    member BIGINT REFERENCES "management_member"(id) ON DELETE CASCADE,
    language BIGINT REFERENCES "language"(id) ON DELETE CASCADE,
    name TEXT,
    role TEXT,
    description TEXT,
    location TEXT,
    district TEXT
);

CREATE TABLE IF NOT EXISTS "management_category_translations" (
    id BIGSERIAL PRIMARY KEY,
    category BIGINT REFERENCES "management_category"(id) ON DELETE CASCADE,
    language BIGINT REFERENCES "language"(id) ON DELETE CASCADE,
    label TEXT,
    UNIQUE(category, language)
);

CREATE TABLE IF NOT EXISTS "branches" (
    id BIGSERIAL PRIMARY KEY,
    name TEXT,
    location TEXT,
    image TEXT,
    area TEXT,
    city TEXT,
    district TEXT,
    open TEXT,
    time TEXT,
    latitude TEXT,
    longitude TEXT,
    category_id BIGINT REFERENCES "branch_category"(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "branch_phone" (
    id BIGSERIAL PRIMARY KEY,
    branch BIGINT REFERENCES "branches"(id),
    phone TEXT
);

CREATE TABLE IF NOT EXISTS "CTA_subtitle" (
    id BIGSERIAL PRIMARY KEY,
    cta BIGINT REFERENCES "CTA"(id),
    language BIGINT REFERENCES "language"(id),
    label TEXT
);

CREATE TABLE IF NOT EXISTS "CTA_title" (
    id BIGSERIAL PRIMARY KEY,
    language BIGINT REFERENCES "language"(id),
    label TEXT,
    cta BIGINT REFERENCES "CTA"(id)
);

CREATE TABLE IF NOT EXISTS "app_download_list" (
    id BIGSERIAL PRIMARY KEY,
    app_download BIGINT REFERENCES "app_download"(id) ON DELETE CASCADE,
    icon TEXT,
    link TEXT,
    index SMALLINT,
    labelmn TEXT,
    labelen TEXT,
    icon_url TEXT
);

CREATE TABLE IF NOT EXISTS "app_download_title" (
    id BIGSERIAL PRIMARY KEY,
    app_download BIGINT REFERENCES "app_download"(id) ON DELETE CASCADE,
    index SMALLINT,
    labelmn TEXT,
    labelen TEXT,
    color TEXT,
    fontsize TEXT,
    fontweight TEXT,
    top INTEGER,
    "left" INTEGER,
    rotate INTEGER,
    size INTEGER
);

CREATE TABLE IF NOT EXISTS "app_download_list_translation" (
    id BIGSERIAL PRIMARY KEY,
    app_download_list BIGINT REFERENCES "app_download_list"(id),
    language BIGINT REFERENCES "language"(id),
    label TEXT
);

CREATE TABLE IF NOT EXISTS "app_download_title_position" (
    id BIGSERIAL PRIMARY KEY,
    app_download_title BIGINT REFERENCES "app_download_title"(id),
    index SMALLINT
);

CREATE TABLE IF NOT EXISTS "app_download_title_translation" (
    id BIGSERIAL PRIMARY KEY,
    app_download_title BIGINT REFERENCES "app_download_title"(id),
    language BIGINT REFERENCES "language"(id),
    label TEXT
);

CREATE TABLE IF NOT EXISTS "timeline_event" (
    id BIGSERIAL PRIMARY KEY,
    page BIGINT REFERENCES "about_page"(id) ON DELETE CASCADE,
    year VARCHAR(20) DEFAULT '',
    sort_order INTEGER DEFAULT 0,
    visible BOOLEAN DEFAULT TRUE,
    year_color VARCHAR(20) DEFAULT '#0d9488',
    title_color VARCHAR(20) DEFAULT '#111827',
    short_color VARCHAR(20) DEFAULT '#4b5563',
    desc_color VARCHAR(20) DEFAULT '#4b5563',
    created TIMESTAMP,
    updated TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "timeline_event_translations" (
    id BIGSERIAL PRIMARY KEY,
    event BIGINT REFERENCES "timeline_event"(id) ON DELETE CASCADE,
    language BIGINT REFERENCES "language"(id) ON DELETE CASCADE,
    title TEXT,
    short_desc TEXT,
    full_desc TEXT,
    UNIQUE(event, language)
);

CREATE TABLE IF NOT EXISTS "org_structure" (
    id BIGSERIAL PRIMARY KEY,
    page BIGINT REFERENCES "about_page"(id) ON DELETE CASCADE,
    chart_data JSONB DEFAULT '{}',
    title TEXT DEFAULT '',
    description TEXT DEFAULT '',
    created TIMESTAMP DEFAULT NOW(),
    updated TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "about_banner" (
    id BIGSERIAL PRIMARY KEY,
    page BIGINT REFERENCES "about_page"(id) ON DELETE CASCADE,
    image TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created TIMESTAMP DEFAULT NOW(),
    updated TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "about_banner_translations" (
    id BIGSERIAL PRIMARY KEY,
    banner BIGINT REFERENCES "about_banner"(id) ON DELETE CASCADE,
    language BIGINT REFERENCES "language"(id) ON DELETE CASCADE,
    title TEXT DEFAULT '',
    subtitle TEXT DEFAULT '',
    UNIQUE(banner, language)
);
""",
            reverse_sql="SELECT 1;",  # No-op reverse (don't drop tables)
        ),
    ]
