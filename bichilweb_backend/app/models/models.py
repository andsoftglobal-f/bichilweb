# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models


class Cta(models.Model):
    id = models.BigAutoField(primary_key=True)
    file = models.TextField(blank=True, null=True)
    collapsed_file = models.TextField(blank=True, null=True)
    mobile_expanded_file = models.TextField(blank=True, null=True)
    index = models.SmallIntegerField(blank=True, null=True)
    font = models.TextField(blank=True, null=True)
    description_font = models.TextField(blank=True, null=True)
    subtitle_font = models.TextField(blank=True, null=True)
    color = models.TextField(blank=True, null=True)  # This field type is a guess.
    number = models.TextField(blank=True, null=True)  # This field type is a guess.
    description = models.TextField(blank=True, null=True)
    description_position = models.TextField(default='top', blank=True, null=True)
    description_align = models.TextField(default='left', blank=True, null=True)
    url = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'CTA'


class CtaSubtitle(models.Model):
    id = models.BigAutoField(primary_key=True)
    cta = models.ForeignKey(Cta, models.DO_NOTHING, db_column='cta', blank=True, null=True)
    language = models.ForeignKey('Language', models.DO_NOTHING, db_column='language', blank=True, null=True)
    label = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'CTA_subtitle'


class CtaTitle(models.Model):
    id = models.BigAutoField(primary_key=True)
    language = models.ForeignKey('Language', models.DO_NOTHING, db_column='language', blank=True, null=True)
    label = models.TextField(blank=True, null=True)
    cta = models.ForeignKey(Cta, models.DO_NOTHING, db_column='cta', blank=True, null=True)

    class Meta:
        db_table = 'CTA_title'


class ServiceCard(models.Model):
    id = models.BigAutoField(primary_key=True)
    title = models.TextField(blank=True, null=True)
    service = models.ForeignKey('Services', models.DO_NOTHING, db_column='service', blank=True, null=True)

    class Meta:
        db_table = 'Service_card'


class ServiceCardTranslations(models.Model):
    id = models.BigAutoField(primary_key=True)
    service_card = models.ForeignKey(ServiceCard, models.DO_NOTHING, db_column='service_card', blank=True, null=True)
    label = models.TextField(blank=True, null=True)
    short_desc = models.TextField(blank=True, null=True)
    language = models.ForeignKey('Language', models.DO_NOTHING, db_column='language', blank=True, null=True)

    class Meta:
        db_table = 'Service_card_translations'


class Services(models.Model):
    id = models.BigAutoField(primary_key=True)

    class Meta:
        db_table = 'Services'


class ServicesTranslations(models.Model):
    id = models.BigAutoField(primary_key=True)
    service = models.ForeignKey(Services, models.DO_NOTHING, db_column='service', blank=True, null=True)
    language = models.ForeignKey('Language', models.DO_NOTHING, db_column='language', blank=True, null=True)
    title = models.TextField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'Services_translations'


class AboutPage(models.Model):
    id = models.BigAutoField(primary_key=True)
    key = models.TextField(blank=True, null=True)
    active = models.BooleanField(blank=True, null=True)
    created = models.DateTimeField(blank=True, null=True)
    updated = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'about_page'


class AboutPageBlock(models.Model):
    id = models.BigAutoField(primary_key=True)
    section = models.ForeignKey('AboutPageSection', models.DO_NOTHING, db_column='section', blank=True, null=True)
    index = models.SmallIntegerField(blank=True, null=True)
    visible = models.BooleanField(blank=True, null=True)

    class Meta:
        db_table = 'about_page_block'


class AboutPageMedia(models.Model):
    id = models.BigAutoField(primary_key=True)
    about = models.ForeignKey(AboutPage, models.DO_NOTHING, db_column='about', blank=True, null=True)
    file = models.TextField(blank=True, null=True)
    aspect_ratio = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'about_page_media'


class AboutPageSection(models.Model):
    id = models.BigAutoField(primary_key=True)
    page = models.ForeignKey(AboutPage, models.DO_NOTHING, db_column='page', blank=True, null=True)
    index = models.SmallIntegerField(blank=True, null=True)
    visible = models.BooleanField(blank=True, null=True)
    image = models.TextField(blank=True, null=True)
    image_position = models.TextField(blank=True, null=True, default='right')
    created = models.DateTimeField(blank=True, null=True)
    updated = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'about_page_section'


class AboutPageSectionTranslations(models.Model):
    id = models.BigAutoField(primary_key=True)
    section = models.ForeignKey(AboutPageSection, models.DO_NOTHING, db_column='section', blank=True, null=True)
    language = models.ForeignKey('Language', models.DO_NOTHING, db_column='language', blank=True, null=True)
    title = models.TextField(blank=True, null=True)
    color = models.TextField(blank=True, null=True)  # This field type is a guess.
    fontsize = models.TextField(blank=True, null=True)  # This field type is a guess.
    fontweight = models.TextField(blank=True, null=True)  # This field type is a guess.
    fontfamily = models.TextField(blank=True, null=True)  # This field type is a guess.

    class Meta:
        db_table = 'about_page_section_translations'


class AboutPageBlockTranslations(models.Model):
    id = models.BigAutoField(primary_key=True)
    block = models.ForeignKey(AboutPageBlock, models.CASCADE, db_column='block', blank=True, null=True)
    language = models.ForeignKey('Language', models.DO_NOTHING, db_column='language', blank=True, null=True)
    content = models.TextField(blank=True, null=True)
    fontcolor = models.TextField(blank=True, null=True)
    fontsize = models.TextField(blank=True, null=True)
    fontweight = models.TextField(blank=True, null=True)
    fontfamily = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'about_page_block_translations'


class AboutPageTranslations(models.Model):
    id = models.BigAutoField(primary_key=True)
    page = models.ForeignKey(AboutPage, models.DO_NOTHING, db_column='page', blank=True, null=True)
    language = models.ForeignKey('Language', models.DO_NOTHING, db_column='language', blank=True, null=True)
    label = models.TextField(blank=True, null=True)
    font = models.TextField(blank=True, null=True)
    family = models.TextField(blank=True, null=True)
    weight = models.TextField(blank=True, null=True)
    size = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'about_page_translations'


class AppDownload(models.Model):
    id = models.BigAutoField(primary_key=True)
    image = models.TextField(blank=True, null=True)
    index = models.SmallIntegerField(blank=True, null=True)
    appstore = models.TextField(blank=True, null=True)
    playstore = models.TextField(blank=True, null=True)
    bgcolor = models.TextField(blank=True, null=True)
    fontcolor = models.TextField(blank=True, null=True)
    titlecolor = models.TextField(blank=True, null=True)
    iconcolor = models.TextField(blank=True, null=True)
    buttonbgcolor = models.TextField(blank=True, null=True)
    buttonfontcolor = models.TextField(blank=True, null=True)
    googlebuttonbgcolor = models.TextField(blank=True, null=True)
    googlebuttonfontcolor = models.TextField(blank=True, null=True)
    active = models.BooleanField(default=True, blank=True, null=True)
    appstore_active = models.BooleanField(default=True, blank=True, null=True)
    playstore_active = models.BooleanField(default=True, blank=True, null=True)
    layout = models.TextField(default='standard', blank=True, null=True)
    mobile_layout = models.TextField(default='image-top', blank=True, null=True)
    features_layout = models.TextField(default='vertical', blank=True, null=True)
    fontfamily = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'app_download'


class AppDownloadList(models.Model):
    id = models.BigAutoField(primary_key=True)
    app_download = models.ForeignKey(AppDownload, models.CASCADE, db_column='app_download', blank=True, null=True, related_name='lists')
    icon = models.TextField(blank=True, null=True)
    link = models.TextField(blank=True, null=True)
    index = models.SmallIntegerField(blank=True, null=True)
    labelmn = models.TextField(blank=True, null=True)
    labelen = models.TextField(blank=True, null=True)
    icon_url = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'app_download_list'
        ordering = ['index', 'id']


class AppDownloadTitle(models.Model):
    id = models.BigAutoField(primary_key=True)
    app_download = models.ForeignKey(AppDownload, models.CASCADE, db_column='app_download', blank=True, null=True, related_name='titles')
    index = models.SmallIntegerField(blank=True, null=True)
    labelmn = models.TextField(blank=True, null=True)
    labelen = models.TextField(blank=True, null=True)
    color = models.TextField(blank=True, null=True)
    fontsize = models.TextField(blank=True, null=True)
    fontweight = models.TextField(blank=True, null=True)
    top = models.IntegerField(blank=True, null=True)
    left = models.IntegerField(db_column='left', blank=True, null=True)
    rotate = models.IntegerField(blank=True, null=True)
    size = models.IntegerField(blank=True, null=True)

    class Meta:
        db_table = 'app_download_title'
        ordering = ['index', 'id']


class AppDownloadListTranslation(models.Model):
    id = models.BigAutoField(primary_key=True)
    app_download_list = models.ForeignKey(AppDownloadList, models.DO_NOTHING, db_column='app_download_list', blank=True, null=True)
    language = models.ForeignKey('Language', models.DO_NOTHING, db_column='language', blank=True, null=True)
    label = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'app_download_list_translation'


class AppDownloadTitlePosition(models.Model):
    id = models.BigAutoField(primary_key=True)
    app_download_title = models.ForeignKey(AppDownloadTitle, models.DO_NOTHING, db_column='app_download_title', blank=True, null=True)
    index = models.SmallIntegerField(blank=True, null=True)

    class Meta:
        db_table = 'app_download_title_position'


class AppDownloadTitleTranslation(models.Model):
    id = models.BigAutoField(primary_key=True)
    app_download_title = models.ForeignKey(AppDownloadTitle, models.DO_NOTHING, db_column='app_download_title', blank=True, null=True)
    language = models.ForeignKey('Language', models.DO_NOTHING, db_column='language', blank=True, null=True)
    label = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'app_download_title_translation'


class BranchCategory(models.Model):
    id = models.BigAutoField(primary_key=True)
    name = models.TextField()
    name_en = models.TextField(blank=True, null=True, default='')
    sort_order = models.IntegerField(default=0)
    active = models.BooleanField(default=True)

    class Meta:
        db_table = 'branch_category'

    def __str__(self):
        return self.name or ''


class BranchPhone(models.Model):
    id = models.BigAutoField(primary_key=True)
    branch = models.ForeignKey('Branches', models.DO_NOTHING, db_column='branch', blank=True, null=True)
    phone = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'branch_phone'


class Branches(models.Model):
    id = models.BigAutoField(primary_key=True)
    name = models.TextField(blank=True, null=True)
    name_en = models.TextField(blank=True, null=True, default='')
    location = models.TextField(blank=True, null=True)
    location_en = models.TextField(blank=True, null=True, default='')
    image = models.TextField(blank=True, null=True)
    area = models.TextField(blank=True, null=True)
    area_en = models.TextField(blank=True, null=True, default='')
    city = models.TextField(blank=True, null=True)
    city_en = models.TextField(blank=True, null=True, default='')
    district = models.TextField(blank=True, null=True)
    district_en = models.TextField(blank=True, null=True, default='')
    open = models.TextField(blank=True, null=True)
    open_en = models.TextField(blank=True, null=True, default='')
    time = models.TextField(blank=True, null=True)
    latitude = models.TextField(blank=True, null=True)
    longitude = models.TextField(blank=True, null=True)
    category = models.ForeignKey('BranchCategory', models.SET_NULL, db_column='category_id', blank=True, null=True)

    class Meta:
        db_table = 'branches'


class BranchPageSettings(models.Model):
    id = models.BigAutoField(primary_key=True)
    popup_bg = models.TextField(default='#ffffff')
    popup_title_color = models.TextField(default='#111827')
    popup_text_color = models.TextField(default='#374151')
    popup_icon_color = models.TextField(default='#0d9488')
    popup_btn_bg = models.TextField(default='#0d9488')
    popup_btn_text = models.TextField(default='#ffffff')
    popup_btn_label = models.TextField(default='Чиглэл авах')
    popup_btn_label_en = models.TextField(blank=True, null=True, default='')
    card_bg = models.TextField(default='#ffffff')
    card_border = models.TextField(default='#e5e7eb')
    card_title_color = models.TextField(default='#111827')
    card_text_color = models.TextField(default='#4b5563')
    card_icon_color = models.TextField(default='#0d9488')
    card_btn_bg = models.TextField(default='#f0fdfa')
    card_btn_text = models.TextField(default='#0d9488')
    card_btn_label = models.TextField(default='Газрын зургаас харах')
    card_btn_label_en = models.TextField(blank=True, null=True, default='')
    marker_color = models.TextField(default='#0d9488')
    marker_selected_color = models.TextField(default='#0f766e')
    map_btn_bg = models.TextField(default='#0d9488')
    map_btn_text = models.TextField(default='#ffffff')
    map_btn_label = models.TextField(default='Газрын зураг')
    map_btn_label_en = models.TextField(blank=True, null=True, default='')
    fontfamily = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'branch_page_settings'


class Category(models.Model):
    id = models.BigAutoField(primary_key=True)
    sort_order = models.IntegerField(default=0)

    class Meta:
        db_table = 'category'
        ordering = ['sort_order', 'id']


class CategoryTranslations(models.Model):
    id = models.BigAutoField(primary_key=True)
    category = models.ForeignKey(Category, models.DO_NOTHING, db_column='category', blank=True, null=True)
    language = models.ForeignKey('Language', models.DO_NOTHING, db_column='language', blank=True, null=True)
    label = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'category_translations'


class Collateral(models.Model):
    id = models.BigAutoField(primary_key=True)

    class Meta:
        db_table = 'collateral'


class CollateralTranslation(models.Model):
    id = models.BigAutoField(primary_key=True)
    collateral = models.ForeignKey(Collateral, models.DO_NOTHING, db_column='collateral', blank=True, null=True)
    language = models.ForeignKey('Language', models.DO_NOTHING, db_column='language', blank=True, null=True)
    label = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'collateral_translation'


class ConditionTranslations(models.Model):
    id = models.BigAutoField(primary_key=True)
    language = models.ForeignKey('Language', models.DO_NOTHING, db_column='language', blank=True, null=True)
    label = models.TextField(blank=True, null=True)
    condition = models.ForeignKey('Conditions', models.DO_NOTHING, db_column='condition', blank=True, null=True)

    class Meta:
        db_table = 'condition_translations'


class Conditions(models.Model):
    id = models.BigAutoField(primary_key=True)

    class Meta:
        db_table = 'conditions'


class CoreValue(models.Model):
    CARD_SIZE_CHOICES = [
        ('large', 'Том дөрвөлжин'),
        ('small', 'Жижиг дөрвөлжин'),
        ('vertical', 'Босоо дөрвөлжин'),
    ]

    id = models.BigAutoField(primary_key=True)
    file = models.TextField(blank=True, null=True)
    file_ratio = models.TextField(blank=True, null=True)
    index = models.BigIntegerField(blank=True, null=True)
    visible = models.BooleanField(blank=True, null=True)
    card_size = models.TextField(choices=CARD_SIZE_CHOICES, default='small', blank=True, null=True)

    class Meta:
        db_table = 'core_value'


class CoreValueDescTranslations(models.Model):
    id = models.BigAutoField(primary_key=True)
    corevalue = models.ForeignKey(CoreValue, models.DO_NOTHING, db_column='core_value', blank=True, null=True)
    language = models.ForeignKey('Language', models.DO_NOTHING, db_column='language', blank=True, null=True)
    label = models.TextField(blank=True, null=True)
    fontcolor = models.TextField(blank=True, null=True)
    fontsize = models.SmallIntegerField(blank=True, null=True)
    fontweight = models.TextField(blank=True, null=True)
    fontfamily = models.TextField(blank=True, null=True)
    letterspace = models.TextField(blank=True, null=True)
    textalign = models.TextField(blank=True, null=True, default='left')

    class Meta:
        db_table = 'core_value_desc_translations'


class CoreValueTitleTranslations(models.Model):
    id = models.BigAutoField(primary_key=True)
    corevalue = models.ForeignKey(CoreValue, models.DO_NOTHING, db_column='core_value', blank=True, null=True)
    language = models.ForeignKey('Language', models.DO_NOTHING, db_column='language', blank=True, null=True)
    label = models.TextField(blank=True, null=True)
    fontcolor = models.TextField(blank=True, null=True)
    fontsize = models.SmallIntegerField(blank=True, null=True)
    fontweight = models.TextField(blank=True, null=True)
    fontfamily = models.TextField(blank=True, null=True)
    letterspace = models.TextField(blank=True, null=True)
    textalign = models.TextField(blank=True, null=True, default='left')

    class Meta:
        db_table = 'core_value_title_translations'


class Document(models.Model):
    id = models.BigAutoField(primary_key=True)

    class Meta:
        db_table = 'document'


class DocumentTranslation(models.Model):
    id = models.BigAutoField(primary_key=True)
    document = models.ForeignKey(Document, models.DO_NOTHING, db_column='document', blank=True, null=True)
    language = models.ForeignKey('Language', models.DO_NOTHING, db_column='language', blank=True, null=True)
    label = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'document_translation'


class FloatMenu(models.Model):
    id = models.BigAutoField(primary_key=True)
    iconcolor = models.TextField(blank=True, null=True)
    fontfamily = models.TextField(blank=True, null=True)
    bgcolor = models.TextField(blank=True, null=True)
    fontcolor = models.TextField(blank=True, null=True)
    image = models.TextField(blank=True, null=True)
    svg = models.TextField(blank=True, null=True)
    url = models.TextField(blank=True, null=True)
    open_in_iframe = models.BooleanField(default=False, blank=True, null=True)

    class Meta:
        db_table = 'float_menu'


class FloatMenuSubmenus(models.Model):
    id = models.BigAutoField(primary_key=True)
    float_menu = models.ForeignKey(FloatMenu, models.DO_NOTHING, db_column='float_menu', blank=True, null=True)
    url = models.TextField(blank=True, null=True)
    file = models.TextField(blank=True, null=True)
    fontfamily = models.TextField(blank=True, null=True)
    bgcolor = models.TextField(blank=True, null=True)
    fontcolor = models.TextField(blank=True, null=True)
    svg = models.TextField(blank=True, null=True)
    open_in_iframe = models.BooleanField(default=False, blank=True, null=True)

    class Meta:
        db_table = 'float_menu_submenus'


class FloatMenuSubmenusTranslations(models.Model):
    id = models.BigAutoField(primary_key=True)
    float_menu_submenu = models.ForeignKey(FloatMenuSubmenus, models.DO_NOTHING, db_column='float_menu_submenu', blank=True, null=True)
    language = models.ForeignKey('Language', models.DO_NOTHING, db_column='language', blank=True, null=True)
    title = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'float_menu_submenus_translations'


class FloatMenuTranslations(models.Model):
    id = models.BigAutoField(primary_key=True)
    float_menu = models.ForeignKey(FloatMenu, models.DO_NOTHING, db_column='float_menu', blank=True, null=True)
    language = models.ForeignKey('Language', models.DO_NOTHING, db_column='language', blank=True, null=True)
    label = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'float_menu_translations'


class FloatMenuSocials(models.Model):
    id = models.BigAutoField(primary_key=True)
    float_menu = models.ForeignKey(FloatMenu, models.DO_NOTHING, db_column='float_menu', blank=True, null=True)
    platform = models.TextField(blank=True, null=True)
    url = models.TextField(blank=True, null=True)
    hover_color = models.TextField(default='#0d9488', blank=True, null=True)
    sort_order = models.SmallIntegerField(default=0, blank=True, null=True)
    active = models.BooleanField(default=True, blank=True, null=True)

    class Meta:
        db_table = 'float_menu_socials'


class CallButton(models.Model):
    id = models.BigAutoField(primary_key=True)
    url = models.TextField(blank=True, null=True)
    svg = models.TextField(blank=True, null=True)
    button_color = models.TextField(default='#ef4444', blank=True, null=True)
    icon_color = models.TextField(default='#ffffff', blank=True, null=True)
    arrow_color = models.TextField(default='#9ca3af', blank=True, null=True)
    active = models.BooleanField(default=True, blank=True, null=True)

    class Meta:
        db_table = 'call_button'


class Font(models.Model):
    id = models.BigIntegerField(primary_key=True)
    font = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'font'


class Footer(models.Model):
    id = models.BigAutoField(primary_key=True)
    logotext = models.TextField(blank=True, null=True)
    logo = models.TextField(blank=True, null=True)
    svg = models.TextField(blank=True, null=True)
    descmn = models.TextField(db_column='descMN', blank=True, null=True)  # Field name made lowercase.
    descen = models.TextField(db_column='descEN', blank=True, null=True)  # Field name made lowercase.
    locationmn = models.TextField(db_column='locationMN', blank=True, null=True)  # Field name made lowercase.
    locationen = models.TextField(db_column='locationEN', blank=True, null=True)  # Field name made lowercase.
    email = models.TextField(blank=True, null=True)
    phone = models.TextField(blank=True, null=True)
    bgcolor = models.TextField(db_column='bgColor', blank=True, null=True)  # Field name made lowercase.
    fontcolor = models.TextField(blank=True, null=True)
    featurecolor = models.TextField(blank=True, null=True)
    socialiconcolor = models.TextField(db_column='socialIconColor', blank=True, null=True)  # Field name made lowercase.
    titlesize = models.TextField(db_column='titleSize', blank=True, null=True)  # Field name made lowercase.
    fontsize = models.TextField(blank=True, null=True)
    fontfamily = models.TextField(blank=True, null=True)
    copyrighten = models.TextField(db_column='copyrightEN', blank=True, null=True)  # Field name made lowercase.
    copyrightmn = models.TextField(db_column='copyrightMN', blank=True, null=True)  # Field name made lowercase.
    logo_size = models.TextField(default='56', blank=True, null=True)

    class Meta:
        db_table = 'footer'


class FooterSocials(models.Model):
    id = models.BigAutoField(primary_key=True)
    footer = models.ForeignKey(Footer, models.DO_NOTHING, db_column='footer', blank=True, null=True)
    social = models.TextField(blank=True, null=True)
    url = models.TextField(blank=True, null=True)
    index = models.SmallIntegerField(blank=True, null=True)
    active = models.BooleanField(default=True, blank=True, null=True)

    class Meta:
        db_table = 'footer_socials'


class FooterUrls(models.Model):
    id = models.BigAutoField(primary_key=True)
    footer = models.ForeignKey(Footer, models.DO_NOTHING, db_column='footer', blank=True, null=True)
    nameen = models.TextField(db_column='nameEN', blank=True, null=True)  # Field name made lowercase.
    namemn = models.TextField(db_column='nameMN', blank=True, null=True)  # Field name made lowercase.
    url = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'footer_urls'


class FooterEmails(models.Model):
    id = models.BigAutoField(primary_key=True)
    footer = models.ForeignKey(Footer, models.DO_NOTHING, db_column='footer', blank=True, null=True)
    label = models.TextField(blank=True, null=True)
    email = models.TextField(blank=True, null=True)
    index = models.SmallIntegerField(default=0, blank=True, null=True)

    class Meta:
        db_table = 'footer_emails'
        ordering = ['index']


class FooterPhones(models.Model):
    id = models.BigAutoField(primary_key=True)
    footer = models.ForeignKey(Footer, models.DO_NOTHING, db_column='footer', blank=True, null=True)
    phone = models.TextField(blank=True, null=True)
    index = models.SmallIntegerField(default=0, blank=True, null=True)

    class Meta:
        db_table = 'footer_phones'
        ordering = ['index']


class Header(models.Model):
    id = models.BigAutoField(primary_key=True)
    logo = models.TextField(blank=True, null=True)
    active = models.SmallIntegerField(blank=True, null=True)

    class Meta:
        db_table = 'header'
        db_table_comment = 'Headeer'


class HeaderMenu(models.Model):
    id = models.BigAutoField(primary_key=True)
    header = models.ForeignKey(Header, models.CASCADE, db_column='header', blank=True, null=True, related_name='menus')
    font = models.TextField(blank=True, null=True)
    path = models.TextField(blank=True, null=True)
    index = models.SmallIntegerField(blank=True, null=True)
    visible = models.SmallIntegerField(blank=True, null=True)

    class Meta:
        db_table = 'header_menu'


class HeaderMenuTranslation(models.Model):
    id = models.BigAutoField(primary_key=True)
    menu = models.ForeignKey(HeaderMenu, models.CASCADE, db_column='menu', blank=True, null=True)
    language = models.ForeignKey('Language', models.DO_NOTHING, db_column='language', blank=True, null=True)
    label = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'header_menu_translation'


class HeaderStyle(models.Model):
    id = models.BigAutoField(primary_key=True)
    header = models.ForeignKey(Header, models.DO_NOTHING, db_column='header', blank=True, null=True)
    bgcolor = models.TextField(db_column='bgColor', blank=True, null=True)  # Field name made lowercase.
    fontcolor = models.TextField(db_column='fontColor', blank=True, null=True)  # Field name made lowercase.
    hovercolor = models.TextField(db_column='hoverColor', blank=True, null=True)  # Field name made lowercase.
    height = models.SmallIntegerField(blank=True, null=True)
    sticky = models.SmallIntegerField(blank=True, null=True)
    max_width = models.TextField(blank=True, null=True, default='1240px')
    logo_size = models.SmallIntegerField(blank=True, null=True, default=44)

    class Meta:
        db_table = 'header_style'


class HeaderSubmenu(models.Model):
    id = models.BigAutoField(primary_key=True)
    header_menu = models.ForeignKey(HeaderMenu, models.CASCADE, db_column='header_menu', blank=True, null=True, related_name='submenus')
    font = models.TextField(blank=True, null=True)
    path = models.TextField(blank=True, null=True)
    index = models.SmallIntegerField(blank=True, null=True)
    visible = models.SmallIntegerField(blank=True, null=True)

    class Meta:
        db_table = 'header_submenu'


class HeaderSubmenuTranslation(models.Model):
    id = models.BigAutoField(primary_key=True)
    submenu = models.ForeignKey(HeaderSubmenu, models.CASCADE, db_column='submenu', blank=True, null=True)
    language = models.ForeignKey('Language', models.DO_NOTHING, db_column='language', blank=True, null=True)
    label = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'header_submenu_translation'


class HeaderTertiaryMenu(models.Model):
    id = models.BigAutoField(primary_key=True)
    header_submenu = models.ForeignKey(HeaderSubmenu, models.CASCADE, db_column='header_submenu', blank=True, null=True, related_name='tertiary_menus')
    font = models.TextField(blank=True, null=True)
    path = models.TextField(blank=True, null=True)
    index = models.SmallIntegerField(blank=True, null=True)
    visible = models.SmallIntegerField(blank=True, null=True)

    class Meta:
        db_table = 'header_tertiary_menu'


class HeaderTertiaryMenuTranslation(models.Model):
    id = models.BigAutoField(primary_key=True)
    tertiary_menu = models.ForeignKey(HeaderTertiaryMenu, models.CASCADE, db_column='tertiary_menu', blank=True, null=True)
    language = models.ForeignKey('Language', models.DO_NOTHING, db_column='language', blank=True, null=True)
    label = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'header_tertiary_menu_translation'


class HeaderQuaternaryMenu(models.Model):
    id = models.BigAutoField(primary_key=True)
    header_tertiary = models.ForeignKey(HeaderTertiaryMenu, models.CASCADE, db_column='header_tertiary', blank=True, null=True, related_name='quaternary_menus')
    font = models.TextField(blank=True, null=True)
    path = models.TextField(blank=True, null=True)
    index = models.SmallIntegerField(blank=True, null=True)
    visible = models.SmallIntegerField(blank=True, null=True)

    class Meta:
        db_table = 'header_quaternary_menu'


class HeaderQuaternaryMenuTranslation(models.Model):
    id = models.BigAutoField(primary_key=True)
    quaternary_menu = models.ForeignKey(HeaderQuaternaryMenu, models.CASCADE, db_column='quaternary_menu', blank=True, null=True)
    language = models.ForeignKey('Language', models.DO_NOTHING, db_column='language', blank=True, null=True)
    label = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'header_quaternary_menu_translation'


class HeroSlider(models.Model):
    id = models.BigAutoField(primary_key=True)
    type = models.TextField(blank=True, null=True)  # This field type is a guess.
    file = models.TextField(blank=True, null=True)
    time = models.SmallIntegerField(blank=True, null=True)
    index = models.SmallIntegerField(blank=True, null=True)
    visible = models.BooleanField(blank=True, null=True)
    tablet_file = models.TextField(blank=True, null=True)
    tablet_type = models.TextField(default='i', blank=True, null=True)
    mobile_file = models.TextField(blank=True, null=True)
    mobile_type = models.TextField(default='i', blank=True, null=True)

    class Meta:
        db_table = 'hero_slider'


class HrPolicyCategory(models.Model):
    id = models.BigAutoField(primary_key=True)
    key = models.CharField(max_length=100, unique=True)
    sort_order = models.IntegerField(default=0)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'hr_policy_category'
        ordering = ['sort_order', 'id']


class HrPolicyCategoryTranslations(models.Model):
    id = models.BigAutoField(primary_key=True)
    category = models.ForeignKey(HrPolicyCategory, models.CASCADE, db_column='category', blank=True, null=True)
    language = models.ForeignKey('Language', models.CASCADE, db_column='language', blank=True, null=True)
    name = models.TextField(blank=True, null=True)
    desc = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'hr_policy_category_translations'
        unique_together = [('category', 'language')]


class HrPolicy(models.Model):
    id = models.BigAutoField(primary_key=True)
    category = models.ForeignKey('HrPolicyCategory', models.SET_NULL, db_column='category', blank=True, null=True)
    key = models.TextField(blank=True, null=True)
    visual_type = models.TextField(blank=True, null=True)  # This field type is a guess.
    visual_preset = models.TextField(blank=True, null=True)  # This field type is a guess.
    font_color = models.TextField(blank=True, null=True)  # This field type is a guess.
    bg_color = models.TextField(blank=True, null=True)  # This field type is a guess.
    fontsize = models.TextField(blank=True, null=True)  # This field type is a guess.
    fontfamily = models.TextField(blank=True, null=True)
    active = models.BooleanField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    icon_image = models.TextField(blank=True, default='')
    icon_url = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'hr_policy'


class HrPolicyTranslations(models.Model):
    id = models.BigAutoField(primary_key=True)
    policy = models.ForeignKey(HrPolicy, models.DO_NOTHING, db_column='policy', blank=True, null=True)
    language = models.ForeignKey('Language', models.DO_NOTHING, db_column='language', blank=True, null=True)
    name = models.TextField(blank=True, null=True)
    desc = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'hr_policy_translations'


class HrSection(models.Model):
    id = models.BigAutoField(primary_key=True)
    title_fontfamily = models.TextField(blank=True, default='')
    title_fontsize = models.TextField(blank=True, default='32')
    title_color = models.TextField(blank=True, default='#0f172a')
    title_weight = models.TextField(blank=True, default='700')
    subtitle_fontfamily = models.TextField(blank=True, default='')
    subtitle_fontsize = models.TextField(blank=True, default='14')
    subtitle_color = models.TextField(blank=True, default='#64748b')
    subtitle_weight = models.TextField(blank=True, default='500')
    desc_fontfamily = models.TextField(blank=True, default='')
    desc_fontsize = models.TextField(blank=True, default='15')
    desc_color = models.TextField(blank=True, default='#475569')
    btn_bg = models.TextField(blank=True, default='#1e293b')
    btn_color = models.TextField(blank=True, default='#ffffff')
    btn_radius = models.TextField(blank=True, default='12')
    btn_fontfamily = models.TextField(blank=True, default='')
    btn_fontsize = models.TextField(blank=True, default='14')
    btn_fontweight = models.TextField(blank=True, default='600')
    section_bg = models.TextField(blank=True, default='rgba(255,255,255,0.7)')
    section_border_radius = models.TextField(blank=True, default='16')
    section_border_color = models.TextField(blank=True, default='transparent')
    section_border_width = models.TextField(blank=True, default='0')
    accent_gradient = models.TextField(blank=True, default='from-blue-500 via-indigo-500 to-purple-500')
    banner_image = models.TextField(blank=True, default='')
    banner_url = models.TextField(blank=True, default='')
    banner_desktop_image = models.TextField(blank=True, default='')
    banner_desktop_url = models.TextField(blank=True, default='')
    banner_tablet_image = models.TextField(blank=True, default='')
    banner_tablet_url = models.TextField(blank=True, default='')
    banner_mobile_image = models.TextField(blank=True, default='')
    banner_mobile_url = models.TextField(blank=True, default='')
    icon_image = models.TextField(blank=True, default='')
    icon_url = models.TextField(blank=True, default='')
    policy_title_fontfamily = models.TextField(blank=True, default='')
    policy_title_fontsize = models.TextField(blank=True, default='18')
    policy_title_color = models.TextField(blank=True, default='#334155')
    policy_title_weight = models.TextField(blank=True, default='600')
    policy_desc_fontsize = models.TextField(blank=True, default='14')
    policy_desc_color = models.TextField(blank=True, default='#64748b')
    policy_card_bg = models.TextField(blank=True, default='#ffffff')
    policy_card_border_color = models.TextField(blank=True, default='#e2e8f0')
    policy_card_border_radius = models.TextField(blank=True, default='12')
    jobs_title_fontfamily = models.TextField(blank=True, default='')
    jobs_title_fontsize = models.TextField(blank=True, default='18')
    jobs_title_color = models.TextField(blank=True, default='#0f172a')
    jobs_title_weight = models.TextField(blank=True, default='600')
    jobs_desc_fontsize = models.TextField(blank=True, default='14')
    jobs_desc_color = models.TextField(blank=True, default='#475569')
    jobs_card_bg = models.TextField(blank=True, default='#ffffff')
    jobs_card_border_color = models.TextField(blank=True, default='#e2e8f0')
    jobs_card_border_radius = models.TextField(blank=True, default='12')
    jobs_badge_bg = models.TextField(blank=True, default='#f0fdf4')
    jobs_badge_color = models.TextField(blank=True, default='#15803d')
    btn_icon_image = models.TextField(blank=True, default='')
    btn_icon_url = models.TextField(blank=True, default='')
    policy_tab_icon_image = models.TextField(blank=True, default='')
    policy_tab_icon_url = models.TextField(blank=True, default='')
    jobs_tab_icon_image = models.TextField(blank=True, default='')
    jobs_tab_icon_url = models.TextField(blank=True, default='')
    jobs_icon_image = models.TextField(blank=True, default='')
    jobs_icon_url = models.TextField(blank=True, default='')
    policy_tab_active_bg = models.TextField(blank=True, default='#1e293b')
    policy_tab_active_color = models.TextField(blank=True, default='#ffffff')
    jobs_tab_active_bg = models.TextField(blank=True, default='#1e293b')
    jobs_tab_active_color = models.TextField(blank=True, default='#ffffff')
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'hr_section'


class HrSectionTranslations(models.Model):
    id = models.BigAutoField(primary_key=True)
    section = models.ForeignKey(HrSection, models.CASCADE, db_column='section', blank=True, null=True)
    language = models.ForeignKey('Language', models.CASCADE, db_column='language', blank=True, null=True)
    title = models.TextField(blank=True, default='')
    subtitle = models.TextField(blank=True, default='')
    description = models.TextField(blank=True, default='')
    btn_text = models.TextField(blank=True, default='')

    class Meta:
        managed = False
        db_table = 'hr_section_translations'
        unique_together = [('section', 'language')]


class JobTranslations(models.Model):
    id = models.BigAutoField(primary_key=True)
    job = models.ForeignKey('Jobs', models.DO_NOTHING, db_column='job', blank=True, null=True)
    language = models.ForeignKey('Language', models.DO_NOTHING, db_column='language', blank=True, null=True)
    title = models.TextField(blank=True, null=True)
    department = models.TextField(blank=True, null=True)
    desc = models.TextField(blank=True, null=True)
    requirements = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'job_translations'


class Jobs(models.Model):
    id = models.BigAutoField(primary_key=True)
    type = models.SmallIntegerField(blank=True, null=True)
    location = models.TextField(blank=True, null=True)
    deadline = models.DateField(blank=True, null=True)
    status = models.SmallIntegerField(blank=True, null=True)
    date = models.DateTimeField(blank=True, null=True)
    icon_image = models.TextField(blank=True, default='')
    icon_url = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'jobs'


class CvApplication(models.Model):
    STATUS_CHOICES = [
        (0, 'Шинэ'),
        (1, 'Хянагдаж байна'),
        (2, 'Зөвшөөрсөн'),
        (3, 'Татгалзсан'),
    ]
    id = models.BigAutoField(primary_key=True)
    first_name = models.TextField()
    last_name = models.TextField()
    email = models.TextField()
    phone = models.TextField()
    position = models.TextField(blank=True, default='')
    experience = models.TextField(blank=True, default='')
    message = models.TextField(blank=True, default='')
    cv_file = models.TextField(blank=True, default='')
    job = models.ForeignKey(Jobs, models.SET_NULL, db_column='job', blank=True, null=True)
    status = models.SmallIntegerField(default=0, choices=STATUS_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'cv_application'
        ordering = ['-created_at']


class Language(models.Model):
    id = models.BigAutoField(primary_key=True)
    lang_code = models.TextField(blank=True, null=True)
    lang_name = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'language'


class ManagementMember(models.Model):
    id = models.BigAutoField(primary_key=True)
    type = models.CharField(max_length=20, default='management')
    image = models.TextField(blank=True, null=True)
    sort_order = models.IntegerField(default=0)
    active = models.BooleanField(default=True)
    pinned = models.BooleanField(default=False)

    class Meta:
        db_table = 'management_member'
        ordering = ['sort_order']


class ManagementMemberTranslations(models.Model):
    id = models.BigAutoField(primary_key=True)
    member = models.ForeignKey(ManagementMember, models.CASCADE, db_column='member')
    language = models.ForeignKey(Language, models.CASCADE, db_column='language')
    name = models.TextField(blank=True, null=True)
    role = models.TextField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    location = models.TextField(blank=True, null=True)
    district = models.TextField(blank=True, null=True)
    styles = models.TextField(blank=True, null=True, default='{}')

    class Meta:
        db_table = 'management_member_translations'


class ManagementCategory(models.Model):
    id = models.BigAutoField(primary_key=True)
    key = models.CharField(max_length=50, unique=True)
    sort_order = models.IntegerField(default=0)
    active = models.BooleanField(default=True)
    created = models.DateTimeField(blank=True, null=True)
    updated = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'management_category'
        ordering = ['sort_order']


class ManagementCategoryTranslations(models.Model):
    id = models.BigAutoField(primary_key=True)
    category = models.ForeignKey(ManagementCategory, models.CASCADE, db_column='category')
    language = models.ForeignKey(Language, models.CASCADE, db_column='language')
    label = models.TextField(blank=True, null=True)
    slogan = models.TextField(blank=True, null=True, default='')
    styles = models.TextField(blank=True, null=True, default='{}')

    class Meta:
        db_table = 'management_category_translations'
        unique_together = [('category', 'language')]


class TimelineEvent(models.Model):
    id = models.BigAutoField(primary_key=True)
    page = models.ForeignKey(AboutPage, models.CASCADE, db_column='page', blank=True, null=True)
    year = models.CharField(max_length=20, default='')
    sort_order = models.IntegerField(default=0)
    visible = models.BooleanField(default=True)
    image = models.TextField(blank=True, null=True)
    year_color = models.CharField(max_length=20, default='#0d9488')
    title_color = models.CharField(max_length=20, default='#111827')
    short_color = models.CharField(max_length=20, default='#4b5563')
    desc_color = models.CharField(max_length=20, default='#4b5563')
    created = models.DateTimeField(blank=True, null=True)
    updated = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'timeline_event'
        ordering = ['sort_order']


class TimelineEventTranslations(models.Model):
    id = models.BigAutoField(primary_key=True)
    event = models.ForeignKey(TimelineEvent, models.CASCADE, db_column='event')
    language = models.ForeignKey(Language, models.CASCADE, db_column='language')
    title = models.TextField(blank=True, null=True)
    short_desc = models.TextField(blank=True, null=True)
    full_desc = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'timeline_event_translations'
        unique_together = [('event', 'language')]


class News(models.Model):
    id = models.BigAutoField(primary_key=True)
    category = models.ForeignKey('NewsCategory', models.DO_NOTHING, db_column='category', blank=True, null=True)
    image = models.TextField(blank=True, null=True)
    video = models.TextField(blank=True, null=True)
    video_orientation = models.TextField(blank=True, null=True, default='horizontal')
    facebook_url = models.TextField(blank=True, null=True, default='')
    feature = models.BooleanField(blank=True, null=True)
    render = models.BooleanField(blank=True, null=True)
    show_on_home = models.BooleanField(blank=True, null=True, default=False)
    readtime = models.SmallIntegerField(blank=True, null=True)
    slug = models.TextField(blank=True, null=True)
    date = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'news'


class NewsCategory(models.Model):
    id = models.BigAutoField(primary_key=True)

    class Meta:
        db_table = 'news_category'


class NewsCategoryTranslations(models.Model):
    id = models.BigAutoField(primary_key=True)
    category = models.ForeignKey(NewsCategory, models.DO_NOTHING, db_column='category', blank=True, null=True)
    language = models.ForeignKey(Language, models.DO_NOTHING, db_column='language', blank=True, null=True)
    label = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'news_category_translations'


class NewsContentTranslations(models.Model):
    id = models.BigAutoField(primary_key=True)
    news = models.ForeignKey(News, models.DO_NOTHING, db_column='news', blank=True, null=True)
    language = models.ForeignKey(Language, models.DO_NOTHING, db_column='language', blank=True, null=True)
    label = models.TextField(blank=True, null=True)
    font = models.TextField(blank=True, null=True)
    family = models.TextField(blank=True, null=True)
    weight = models.TextField(blank=True, null=True)
    size = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'news_content_translations'


class NewsImages(models.Model):
    id = models.BigAutoField(primary_key=True)
    news = models.ForeignKey(News, models.DO_NOTHING, db_column='news', blank=True, null=True)
    image = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'news_images'


class NewsShortdescTranslations(models.Model):
    id = models.BigAutoField(primary_key=True)
    news = models.ForeignKey(News, models.DO_NOTHING, db_column='news', blank=True, null=True)
    language = models.ForeignKey(Language, models.DO_NOTHING, db_column='language', blank=True, null=True)
    label = models.TextField(blank=True, null=True)
    font = models.TextField(blank=True, null=True)
    family = models.TextField(blank=True, null=True)
    weight = models.TextField(blank=True, null=True)
    size = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'news_shortdesc_translations'


class NewsSocials(models.Model):
    id = models.BigAutoField(primary_key=True)
    news = models.ForeignKey(News, models.DO_NOTHING, db_column='news', blank=True, null=True)
    social = models.TextField(blank=True, null=True)
    icon = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'news_socials'


class NewsPageSettings(models.Model):
    id = models.BigAutoField(primary_key=True)
    home_heading = models.TextField(default='Мэдээ', blank=True, null=True)
    home_heading_en = models.TextField(default='News', blank=True, null=True)
    latest_heading = models.TextField(default='Сүүлийн мэдээнүүд')
    featured_heading = models.TextField(default='Онцлох мэдээ')
    latest_heading_en = models.TextField(default='', blank=True, null=True)
    featured_heading_en = models.TextField(default='', blank=True, null=True)
    section_label_color = models.TextField(default='#0d9488', blank=True, null=True)
    section_label_size = models.TextField(default='14px', blank=True, null=True)
    heading_color = models.TextField(default='#111827', blank=True, null=True)
    heading_size = models.TextField(default='48px', blank=True, null=True)
    heading_font_family = models.TextField(default='', blank=True, null=True)
    divider_color = models.TextField(default='#0048BA', blank=True, null=True)
    divider_width = models.TextField(default='64px', blank=True, null=True)
    divider_height = models.TextField(default='4px', blank=True, null=True)
    divider_margin_top = models.TextField(default='12px', blank=True, null=True)
    divider_margin_bottom = models.TextField(default='80px', blank=True, null=True)
    button_color = models.TextField(default='#0d9488', blank=True, null=True)
    button_text = models.TextField(default='Дэлгэрэнгүй', blank=True, null=True)
    button_text_en = models.TextField(default='View All', blank=True, null=True)
    button_text_color = models.TextField(default='#ffffff', blank=True, null=True)
    button_size = models.TextField(default='16px', blank=True, null=True)
    button_font_family = models.TextField(default='', blank=True, null=True)

    class Meta:
        db_table = 'news_page_settings'


class NewsTitleTranslations(models.Model):
    id = models.BigAutoField(primary_key=True)
    news = models.ForeignKey(News, models.DO_NOTHING, db_column='news', blank=True, null=True)
    language = models.ForeignKey(Language, models.DO_NOTHING, db_column='language', blank=True, null=True)
    label = models.TextField(blank=True, null=True)
    font = models.TextField(blank=True, null=True)
    family = models.TextField(blank=True, null=True)
    weight = models.TextField(blank=True, null=True)
    size = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'news_title_translations'


class PageDescriptionTranslations(models.Model):
    id = models.BigAutoField(primary_key=True)
    page = models.ForeignKey('Pages', models.DO_NOTHING, db_column='page', blank=True, null=True)
    language = models.ForeignKey(Language, models.DO_NOTHING, db_column='language', blank=True, null=True)
    label = models.TextField(blank=True, null=True)
    font = models.TextField(blank=True, null=True)
    family = models.TextField(blank=True, null=True)
    weight = models.TextField(blank=True, null=True)
    size = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'page_description_translations'


class PageTitleTranslations(models.Model):
    id = models.BigAutoField(primary_key=True)
    page = models.ForeignKey('Pages', models.DO_NOTHING, db_column='page', blank=True, null=True)
    language = models.ForeignKey(Language, models.DO_NOTHING, db_column='language', blank=True, null=True)
    label = models.TextField(blank=True, null=True)
    font = models.TextField(blank=True, null=True)
    family = models.TextField(blank=True, null=True)
    weight = models.TextField(blank=True, null=True)
    size = models.TextField(blank=True, null=True)  # This field type is a guess.

    class Meta:
        db_table = 'page_title_translations'


class Pages(models.Model):
    id = models.BigAutoField(primary_key=True)
    url = models.TextField(blank=True, null=True)
    active = models.BooleanField(blank=True, null=True)
    image = models.TextField(blank=True, null=True)
    date = models.DateTimeField(blank=True, null=True)
    style = models.SmallIntegerField(blank=True, null=True)
    content_blocks = models.TextField(blank=True, null=True, default='[]')

    class Meta:
        db_table = 'pages'


class HomePageLink(models.Model):
    id = models.BigAutoField(primary_key=True)
    title = models.TextField(blank=True, null=True)
    page_url = models.TextField(blank=True, null=True)
    placement = models.TextField(blank=True, null=True, default='after-hero')
    sort_order = models.IntegerField(default=0, blank=True, null=True)
    active = models.BooleanField(default=True, blank=True, null=True)

    class Meta:
        db_table = 'home_page_links'
        ordering = ['placement', 'sort_order', 'id']


class Product(models.Model):
    id = models.BigAutoField(primary_key=True)
    product_type = models.ForeignKey('ProductType', models.DO_NOTHING, db_column='product_type', blank=True, null=True)
    sort_order = models.IntegerField(default=0)

    class Meta:
        db_table = 'product'
        ordering = ['sort_order', 'id']


class ProductCollaterial(models.Model):
    id = models.BigAutoField(primary_key=True)
    product = models.ForeignKey(Product, models.CASCADE, db_column='product', blank=True, null=True)
    collateral = models.ForeignKey(Collateral, models.DO_NOTHING, db_column='collateral', blank=True, null=True)

    class Meta:
        db_table = 'product_collaterial'


class ProductCondition(models.Model):
    id = models.BigAutoField(primary_key=True)
    product = models.ForeignKey(Product, models.CASCADE, db_column='product', blank=True, null=True)
    condition = models.ForeignKey(Conditions, models.DO_NOTHING, db_column='condition', blank=True, null=True)

    class Meta:
        db_table = 'product_condition'


class ProductDetails(models.Model):
    id = models.BigAutoField(primary_key=True)
    product = models.ForeignKey(Product, models.CASCADE, db_column='product', blank=True, null=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    min_fee_percent = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    max_fee_percent = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    min_interest_rate = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    max_interest_rate = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    term_months = models.SmallIntegerField(blank=True, null=True)
    min_processing_hours = models.SmallIntegerField(blank=True, null=True)
    max_processing_hoyrs = models.SmallIntegerField(blank=True, null=True)
    processing_time_minutes = models.IntegerField(default=0, blank=True, null=True)
    fee_type = models.CharField(max_length=20, default='fee', blank=True)
    # Calculator styling
    calc_btn_color = models.CharField(max_length=20, default='#0d9488', blank=True)
    calc_btn_font_size = models.CharField(max_length=10, default='14px', blank=True)
    calc_btn_text = models.CharField(max_length=100, default='Тооцоолох', blank=True)
    request_btn_color = models.CharField(max_length=20, default='#2563eb', blank=True)
    request_btn_font_size = models.CharField(max_length=10, default='14px', blank=True)
    request_btn_text = models.CharField(max_length=100, default='Хүсэлт илгээх', blank=True)
    request_btn_url = models.CharField(max_length=500, default='', blank=True)
    disclaimer_color = models.CharField(max_length=20, default='#92400e', blank=True)
    disclaimer_font_size = models.CharField(max_length=10, default='10px', blank=True)
    disclaimer_text = models.TextField(default='Энэхүү тооцоолуур нь зөвхөн мэдээллийн зорилготой бөгөөд бодит зээлийн нөхцөл өөр байж болно.', blank=True)
    # Banner
    banner_image = models.CharField(max_length=500, default='', blank=True)
    banner_mobile_image = models.CharField(max_length=500, default='', blank=True)
    # Description styling
    description_mn = models.TextField(default='', blank=True)
    description_en = models.TextField(default='', blank=True)
    description_color = models.CharField(max_length=20, default='#ffffff', blank=True)
    description_font_size = models.CharField(max_length=10, default='16px', blank=True)
    description_align = models.CharField(max_length=10, default='center', blank=True)
    description_font_family = models.CharField(max_length=100, default='', blank=True)

    class Meta:
        db_table = 'product_details'


class ProductDocument(models.Model):
    id = models.BigAutoField(primary_key=True)
    product = models.ForeignKey(Product, models.CASCADE, db_column='product', blank=True, null=True)
    document = models.ForeignKey(Document, models.DO_NOTHING, db_column='document', blank=True, null=True)

    class Meta:
        db_table = 'product_document'


class ProductTranslations(models.Model):
    id = models.BigAutoField(primary_key=True)
    product = models.ForeignKey(Product, models.CASCADE, db_column='product', blank=True, null=True)
    language = models.ForeignKey(Language, models.DO_NOTHING, db_column='language', blank=True, null=True)
    label = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'product_translations'


class ProductType(models.Model):
    id = models.BigAutoField(primary_key=True)
    category = models.ForeignKey(Category, models.DO_NOTHING, db_column='category', blank=True, null=True)
    sort_order = models.IntegerField(default=0)

    class Meta:
        db_table = 'product_type'
        ordering = ['sort_order', 'id']


class ProductTypeTranslations(models.Model):
    id = models.BigAutoField(primary_key=True)
    product_type = models.ForeignKey(ProductType, models.CASCADE, db_column='product_type', blank=True, null=True)
    language = models.ForeignKey(Language, models.DO_NOTHING, db_column='language', blank=True, null=True)
    label = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'product_type_translations'


class ServiceCollateral(models.Model):
    id = models.BigAutoField(primary_key=True)
    service = models.ForeignKey(Services, models.DO_NOTHING, db_column='service', blank=True, null=True)
    collateral = models.ForeignKey(Collateral, models.DO_NOTHING, db_column='collateral', blank=True, null=True)

    class Meta:
        db_table = 'service_collateral'


class ServiceCondition(models.Model):
    id = models.BigAutoField(primary_key=True)
    service = models.ForeignKey(Services, models.DO_NOTHING, db_column='service', blank=True, null=True)
    condition = models.ForeignKey(Conditions, models.DO_NOTHING, db_column='condition', blank=True, null=True)

    class Meta:
        db_table = 'service_condition'


class ServiceDocument(models.Model):
    id = models.BigAutoField(primary_key=True)
    service = models.ForeignKey(Services, models.DO_NOTHING, db_column='service', blank=True, null=True)
    document = models.ForeignKey(Document, models.DO_NOTHING, db_column='document', blank=True, null=True)

    class Meta:
        db_table = 'service_document'


class Shareholder(models.Model):
    id = models.BigAutoField(primary_key=True)
    image = models.TextField(blank=True, null=True)
    index = models.BigIntegerField(blank=True, null=True)
    active = models.BooleanField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'shareholder'


class ShareholderTranslations(models.Model):
    id = models.BigAutoField(primary_key=True)
    shareholder = models.ForeignKey(Shareholder, models.DO_NOTHING, db_column='shareholder', blank=True, null=True)
    language = models.ForeignKey(Language, models.DO_NOTHING, db_column='language', blank=True, null=True)
    fullname = models.TextField(blank=True, null=True)
    role = models.TextField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'shareholder_translations'


class Timeline(models.Model):
    id = models.BigAutoField(primary_key=True)
    year = models.TextField(blank=True, null=True)  # This field type is a guess.
    order = models.BigIntegerField(blank=True, null=True)
    color = models.TextField(blank=True, null=True)
    visible = models.BooleanField(blank=True, null=True)

    class Meta:
        db_table = 'timeline'


class TimelineTranslations(models.Model):
    id = models.BigAutoField(primary_key=True)
    timeline = models.ForeignKey(Timeline, models.DO_NOTHING, db_column='timeline', blank=True, null=True)
    language = models.ForeignKey(Language, models.DO_NOTHING, db_column='language', blank=True, null=True)
    title = models.TextField(blank=True, null=True)
    title_color = models.TextField(blank=True, null=True)
    shortdesc = models.TextField(blank=True, null=True)
    shortdesc_color = models.TextField(blank=True, null=True)
    fulldesc = models.TextField(blank=True, null=True)
    fulldesc_color = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'timeline_translations'


class VisionBlock(models.Model):
    id = models.BigAutoField(primary_key=True)
    file = models.TextField(blank=True, null=True)
    file_ratio = models.TextField(blank=True, null=True)
    visible = models.BooleanField(blank=True, null=True)

    class Meta:
        db_table = 'vision_block'


class VisionBlockDescTranslations(models.Model):
    id = models.BigAutoField(primary_key=True)
    vision_block = models.ForeignKey(VisionBlock, models.DO_NOTHING, db_column='vision_block', blank=True, null=True)
    language = models.ForeignKey(Language, models.DO_NOTHING, db_column='language', blank=True, null=True)
    desc = models.TextField(blank=True, null=True)
    fontcolor = models.TextField(blank=True, null=True)
    fontsize = models.BigIntegerField(blank=True, null=True)
    fontweight = models.TextField(blank=True, null=True)
    fontfamily = models.TextField(blank=True, null=True)
    letterspace = models.BigIntegerField(blank=True, null=True)

    class Meta:
        db_table = 'vision_block_desc_translations'


class VisionBlockTitleTranslations(models.Model):
    id = models.BigAutoField(primary_key=True)
    vision_block = models.ForeignKey(VisionBlock, models.DO_NOTHING, db_column='vision_block', blank=True, null=True)
    language = models.ForeignKey(Language, models.DO_NOTHING, db_column='language', blank=True, null=True)
    title = models.TextField(blank=True, null=True)
    fontcolor = models.TextField(blank=True, null=True)
    fontsize = models.BigIntegerField(blank=True, null=True)
    fontweight = models.SmallIntegerField(blank=True, null=True)
    fontfamily = models.TextField(blank=True, null=True)
    letterspace = models.BigIntegerField(blank=True, null=True)

    class Meta:
        db_table = 'vision_block_title_translations'


# ─── Org Structure ───

class OrgStructure(models.Model):
    id = models.BigAutoField(primary_key=True)
    page = models.ForeignKey(AboutPage, models.CASCADE, db_column='page', blank=True, null=True)
    chart_data = models.JSONField(default=dict)
    title = models.TextField(blank=True, default='')
    description = models.TextField(blank=True, default='')
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'org_structure'


# ─── About Banner ───

class AboutBanner(models.Model):
    id = models.BigAutoField(primary_key=True)
    page = models.ForeignKey(AboutPage, models.CASCADE, db_column='page', blank=True, null=True)
    image = models.TextField(blank=True, default='')
    mobile_image = models.TextField(blank=True, default='')
    sort_order = models.IntegerField(default=0)
    active = models.BooleanField(default=True)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'about_banner'


class AboutBannerTranslations(models.Model):
    id = models.BigAutoField(primary_key=True)
    banner = models.ForeignKey(AboutBanner, models.CASCADE, db_column='banner')
    language = models.ForeignKey(Language, models.CASCADE, db_column='language')
    title = models.TextField(blank=True, default='')
    subtitle = models.TextField(blank=True, default='')
    fontfamily = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'about_banner_translations'
        unique_together = [('banner', 'language')]


class LoanCalculatorConfig(models.Model):
    id = models.BigAutoField(primary_key=True)
    key = models.CharField(max_length=50, unique=True, default='default')
    default_amount = models.BigIntegerField(default=10000000)
    default_rate = models.DecimalField(max_digits=5, decimal_places=2, default=2.5)
    default_term = models.IntegerField(default=12)
    max_amount = models.BigIntegerField(default=100000000)
    max_term = models.IntegerField(default=60)
    min_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.5)
    max_rate = models.DecimalField(max_digits=5, decimal_places=2, default=5.0)
    active = models.BooleanField(default=True)
    # Button & disclaimer styling
    calc_btn_color = models.CharField(max_length=20, default='#0d9488')
    calc_btn_font_size = models.CharField(max_length=10, default='14px')
    calc_btn_text = models.CharField(max_length=100, default='Тооцоолох')
    request_btn_color = models.CharField(max_length=20, default='#2563eb')
    request_btn_font_size = models.CharField(max_length=10, default='14px')
    request_btn_text = models.CharField(max_length=100, default='Хүсэлт илгээх')
    request_btn_url = models.CharField(max_length=500, default='', blank=True)
    disclaimer_color = models.CharField(max_length=20, default='#92400e')
    disclaimer_font_size = models.CharField(max_length=10, default='10px')
    disclaimer_text = models.TextField(default='Энэхүү тооцоолуур нь зөвхөн мэдээллийн зорилготой бөгөөд бодит зээлийн нөхцөл өөр байж болно.')
    banner_image = models.CharField(max_length=500, default='', blank=True)
    banner_mobile_image = models.CharField(max_length=500, default='', blank=True)
    title_mn = models.TextField(default='', blank=True)
    title_en = models.TextField(default='', blank=True)
    subtitle_mn = models.TextField(default='', blank=True)
    subtitle_en = models.TextField(default='', blank=True)
    text_styles = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'loan_calculator_config'


class ExchangeRateConfig(models.Model):
    id = models.AutoField(primary_key=True)
    config_json = models.TextField(default='{}')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'exchange_rate_config'


class SiteAnalytics(models.Model):
    id = models.AutoField(primary_key=True)
    session_id = models.CharField(max_length=64)
    visitor_id = models.CharField(max_length=64)
    page_path = models.CharField(max_length=500)
    page_title = models.CharField(max_length=500, blank=True, default='')
    referrer = models.CharField(max_length=500, blank=True, default='')
    user_agent = models.TextField(blank=True, default='')
    device_type = models.CharField(max_length=20, blank=True, default='desktop')
    ip_address = models.CharField(max_length=45, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'site_analytics'


class Partner(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255, blank=True, default='')
    logo = models.TextField(blank=True, null=True)
    url = models.TextField(blank=True, default='')
    index = models.SmallIntegerField(default=0)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'partners'
        ordering = ['index', 'id']

    def __str__(self):
        return self.name or f'Partner #{self.id}'


class PartnerSectionConfig(models.Model):
    id = models.AutoField(primary_key=True)
    title_mn = models.CharField(max_length=255, blank=True, default='Хамтрагч байгууллагууд')
    title_en = models.CharField(max_length=255, blank=True, default='Partner organizations')
    title_color = models.CharField(max_length=20, blank=True, default='#9ca3af')
    title_font_size = models.CharField(max_length=20, blank=True, default='0.875rem')
    title_font_family = models.CharField(max_length=100, blank=True, default='')
    divider_width = models.CharField(max_length=20, blank=True, default='64px')
    divider_height = models.CharField(max_length=20, blank=True, default='4px')
    divider_color = models.CharField(max_length=20, blank=True, default='#0048BA')
    divider_margin_top = models.CharField(max_length=20, blank=True, default='12px')
    divider_margin_bottom = models.CharField(max_length=20, blank=True, default='24px')

    class Meta:
        db_table = 'partner_section_config'

    def __str__(self):
        return 'Partner Section Config'


class StatsConfig(models.Model):
    id = models.AutoField(primary_key=True)
    title_mn = models.CharField(max_length=255, blank=True, default='Бидний тоон үзүүлэлтүүд')
    title_en = models.CharField(max_length=255, blank=True, default='Our key metrics')
    description_mn = models.TextField(blank=True, default='Глобус санхүүгийн байгууллагын бодит тоон үзүүлэлтүүд, манай үйл ажиллагааны хэмжүүр.')
    description_en = models.TextField(blank=True, default='Real performance metrics from Globus Financial, measuring our operational impact.')
    section_image = models.TextField(blank=True, null=True)
    value_color = models.CharField(max_length=20, blank=True, default='#1e293b')
    value_font_size = models.CharField(max_length=10, blank=True, default='2.6rem')
    label_color = models.CharField(max_length=20, blank=True, default='#94a3b8')
    label_font_size = models.CharField(max_length=10, blank=True, default='0.875rem')
    suffix_color = models.CharField(max_length=20, blank=True, default='#0048BA')
    title_color = models.CharField(max_length=20, blank=True, default='#ffffff')
    title_font_size = models.CharField(max_length=10, blank=True, default='1.75rem')
    description_color = models.CharField(max_length=50, blank=True, default='rgba(255,255,255,0.7)')
    description_font_size = models.CharField(max_length=10, blank=True, default='0.875rem')
    mobile_title_font_size = models.CharField(max_length=10, blank=True, default='1.25rem')
    mobile_description_font_size = models.CharField(max_length=10, blank=True, default='0.75rem')
    mobile_value_font_size = models.CharField(max_length=10, blank=True, default='1.75rem')
    mobile_label_font_size = models.CharField(max_length=10, blank=True, default='0.75rem')
    fontfamily = models.TextField(blank=True, null=True)
    text_active = models.BooleanField(default=True)
    image_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'stats_config'

    def __str__(self):
        return 'Stats Section Config'


class StatItem(models.Model):
    id = models.AutoField(primary_key=True)
    label_mn = models.CharField(max_length=255, blank=True, default='')
    label_en = models.CharField(max_length=255, blank=True, default='')
    value = models.CharField(max_length=100, blank=True, default='')
    prefix = models.CharField(max_length=50, blank=True, default='')
    suffix = models.CharField(max_length=50, blank=True, default='+')
    suffix_color = models.CharField(max_length=20, blank=True, default='')
    icon = models.TextField(blank=True, null=True)
    index = models.SmallIntegerField(default=0)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'stat_items'
        ordering = ['index', 'id']

    def __str__(self):
        return self.label_mn or f'Stat #{self.id}'


class LoanRequest(models.Model):
    id = models.BigAutoField(primary_key=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=8)
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True, related_name='loan_requests')
    status = models.CharField(max_length=20, default='new', choices=[
        ('new', 'Шинэ'),
        ('processing', 'Шийдвэрлэж байна'),
        ('approved', 'Зөвшөөрсөн'),
        ('rejected', 'Татгалзсан'),
    ])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'loan_requests'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.last_name} {self.first_name} - {self.phone}'


class LoanRequestPage(models.Model):
    id = models.BigAutoField(primary_key=True)
    banner_image = models.CharField(max_length=500, blank=True, default='')
    mobile_banner_image = models.CharField(max_length=500, blank=True, default='')
    title_mn = models.CharField(max_length=200, blank=True, default='')
    title_en = models.CharField(max_length=200, blank=True, default='')
    subtitle_mn = models.CharField(max_length=500, blank=True, default='')
    subtitle_en = models.CharField(max_length=500, blank=True, default='')
    disclaimer_mn = models.TextField(blank=True, default='')
    disclaimer_en = models.TextField(blank=True, default='')
    button_text_mn = models.CharField(max_length=100, blank=True, default='')
    button_text_en = models.CharField(max_length=100, blank=True, default='')
    # Success state texts
    success_title_mn = models.CharField(max_length=200, blank=True, default='')
    success_title_en = models.CharField(max_length=200, blank=True, default='')
    success_subtitle_mn = models.CharField(max_length=500, blank=True, default='')
    success_subtitle_en = models.CharField(max_length=500, blank=True, default='')
    success_description_mn = models.CharField(max_length=500, blank=True, default='')
    success_description_en = models.CharField(max_length=500, blank=True, default='')
    # Form header texts
    form_title_mn = models.CharField(max_length=200, blank=True, default='')
    form_title_en = models.CharField(max_length=200, blank=True, default='')
    form_subtitle_mn = models.CharField(max_length=500, blank=True, default='')
    form_subtitle_en = models.CharField(max_length=500, blank=True, default='')
    text_styles = models.JSONField(default=dict, blank=True)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'loan_request_page'

    def __str__(self):
        return self.title_mn or 'Зээлийн хүсэлт хуудас'


class AboutCategory(models.Model):
    id = models.BigAutoField(primary_key=True)
    slug = models.CharField(max_length=500, unique=True)
    icon = models.TextField(blank=True, default='')
    image = models.TextField(blank=True, default='')
    page_url = models.TextField(blank=True, default='', help_text='Link to page builder page URL')
    sort_order = models.IntegerField(default=0)
    active = models.BooleanField(default=True)
    content = models.JSONField(default=list, blank=True)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'about_category'
        ordering = ['sort_order', 'id']


class AboutCategoryTranslations(models.Model):
    id = models.BigAutoField(primary_key=True)
    category = models.ForeignKey(AboutCategory, models.CASCADE, db_column='category')
    language = models.ForeignKey(Language, models.CASCADE, db_column='language')
    label = models.TextField(blank=True, default='')
    description = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'about_category_translations'
        unique_together = [('category', 'language')]


# ─── Зар (Advertisement) ─────────────────────────────────────────
class Advertisement(models.Model):
    id = models.BigAutoField(primary_key=True)
    title = models.TextField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    image = models.TextField(blank=True, null=True)
    url = models.TextField(blank=True, null=True)
    button_text = models.TextField(default='Энд дарна уу', blank=True, null=True)
    button_font_family = models.TextField(default='', blank=True, null=True)
    button_text_color = models.TextField(default='#ffffff', blank=True, null=True)
    button_hover_text_color = models.TextField(default='#ef3f0a', blank=True, null=True)
    button_text_size = models.TextField(default='18px', blank=True, null=True)
    index = models.SmallIntegerField(default=0, blank=True, null=True)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'advertisement'
        ordering = ['index', 'id']


class AdConfig(models.Model):
    id = models.BigAutoField(primary_key=True)
    interval_seconds = models.IntegerField(default=60)

    class Meta:
        db_table = 'ad_config'


class ProductTutorial(models.Model):
    id = models.BigAutoField(primary_key=True)
    title_mn = models.CharField(max_length=255, blank=True, default='')
    title_en = models.CharField(max_length=255, blank=True, default='')
    video_url = models.TextField(blank=True, default='')
    thumbnail_url = models.TextField(blank=True, null=True)
    index = models.SmallIntegerField(default=0)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'product_tutorials'
        ordering = ['index', 'id']

    def __str__(self):
        return self.title_mn or f'Tutorial #{self.id}'


class ProductTutorialConfig(models.Model):
    id = models.AutoField(primary_key=True)
    title_mn = models.CharField(max_length=255, blank=True, default='Бүтээгдэхүүний заавар')
    title_en = models.CharField(max_length=255, blank=True, default='Product Instructions')
    title_color = models.CharField(max_length=20, blank=True, default='#0f172a')
    title_font_size = models.CharField(max_length=20, blank=True, default='1.875rem')
    title_font_family = models.CharField(max_length=100, blank=True, default='')
    title_align = models.CharField(max_length=10, blank=True, default='center')
    bg_color = models.CharField(max_length=20, blank=True, default='#ffffff')
    divider_width = models.CharField(max_length=20, blank=True, default='64px')
    divider_height = models.CharField(max_length=20, blank=True, default='4px')
    divider_color = models.CharField(max_length=20, blank=True, default='#0048BA')
    divider_margin_top = models.CharField(max_length=20, blank=True, default='12px')
    divider_margin_bottom = models.CharField(max_length=20, blank=True, default='32px')

    class Meta:
        db_table = 'product_tutorial_config'

    def __str__(self):
        return 'Product Tutorial Config'
