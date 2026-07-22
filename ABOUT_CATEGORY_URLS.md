# About Category URL Links Feature

## Overview

This feature allows you to link "About Us" categories to specific page builder pages. When a user clicks on a category, they are automatically navigated to the linked page.

## Features

✅ Link categories to page builder pages  
✅ Automatic navigation when clicking categories  
✅ Easy management in admin panel  
✅ Support for both new and existing categories  
✅ Optional linking (categories can exist without links)  

## How to Use in Admin Panel

### 1. Create a New Category with a Link

1. Go to **Бидний тухай → Ангилал** (About → Categories)
2. Click **Нэмэх** (Add) button
3. Fill in category details:
   - **Нэр (Монгол)** - Category name in Mongolian
   - **Нэр (Англи)** - Category name in English
   - **Slug (URL)** - Auto-generated from name (optional to customize)

4. **Important:** Select a page in the **"Холбогдох хуудас"** (Link to Page) dropdown
5. You'll see the linked page URL displayed below
6. Click **Нэмэх** (Add) to save

### 2. Edit an Existing Category

1. Go to **Бидний тухай → Ангилал** (About → Categories)
2. Find the category you want to edit
3. Click the **Нэмэлт** (Edit) button
4. To link a page:
   - Select a page from the **"Холбогдох хуудас"** dropdown
   - Click the **Холбоо тасрах** (Unlink) button to remove a previous link
5. Click **Шинэчлэх** (Update) to save changes

### 3. How It Works

#### Category with a Linked Page:
```
User clicks on category → Automatically navigated to linked page URL
```

#### Category without a Link:
```
User clicks on category → Shows category content (if any)
```

## Frontend User Experience

### On the About Us Page

1. User sees tabs including both built-in sections and custom categories
2. Built-in tabs:
   - Бидний тухай (About Us)
   - Үнэт зүйлс (Values)
   - Засаглал (Governance)
   - Бүтэц (Structure)

3. Custom category tabs appear below built-in tabs
4. **If category has a linked page:**
   - Clicking it acts as a navigation button
   - User is taken directly to that page
   - Page content is displayed

5. **If category has NO linked page:**
   - User sees the category content
   - Can view custom content blocks if defined

## API Information

### Category Data Structure

```json
{
  "id": 1,
  "slug": "history",
  "icon": "icon-url",
  "image": "image-url",
  "page_url": "/company-history",
  "sort_order": 1,
  "active": true,
  "translations": [
    {
      "language": 1,
      "label": "History",
      "description": "Company history"
    },
    {
      "language": 2,
      "label": "Түүх",
      "description": "Компанийн түүх"
    }
  ]
}
```

### Key Fields

- **slug**: URL identifier (auto-generated from name)
- **page_url**: Path to linked page builder page (e.g., "/company-history")
- **active**: Whether category is visible
- **translations**: Multilingual names and descriptions

## Backend API Endpoints

```
GET    /api/v1/about-category/              List all categories
POST   /api/v1/about-category/              Create new category
GET    /api/v1/about-category/{id}/         Get specific category
PUT    /api/v1/about-category/{id}/         Update category
DELETE /api/v1/about-category/{id}/         Delete category
GET    /api/v1/about-category/by-slug/slug/ Get category by slug
POST   /api/v1/about-category/reorder/      Reorder categories
```

## Technical Details

### How Page URL Navigation Works

1. **Admin sets up**: Selects page from dropdown in admin panel
2. **Backend stores**: URL is saved in `page_url` field
3. **Frontend loads**: Category data includes `page_url`
4. **On click**: Frontend checks if `page_url` exists
5. **Navigation**: If exists, calls `router.push()` to navigate to page

### URL Normalization

The system automatically normalizes URLs:
- Removes leading slashes: `/history` → `history`
- Removes query strings: `/page?id=1` → `/page`
- Removes hash fragments: `/page#section` → `/page`

## Examples

### Example 1: Company History

**Admin Setup:**
- Category Name: "История компании" / "Company History"
- Link to Page: Select "Company History" page
- Result: `/company-history`

**User Experience:**
- User clicks on "История компании" tab
- Browser navigates to `/company-history`
- Company history page loads

### Example 2: Team Structure

**Admin Setup:**
- Category Name: "Organizational structure" / "Байгууллагын бүтэц"
- Link to Page: Select "Team" page
- Result: `/team`

**User Experience:**
- User clicks on "Байгууллагын бүтэц" tab
- Browser navigates to `/team`
- Team page loads

## Troubleshooting

### Category not redirecting when clicked

1. **Check if page_url is set:**
   - Edit the category and verify a page is selected in "Холбогдох хуудас"

2. **Check if selected page is active:**
   - Go to Pages section and verify the linked page is marked as "Active"

3. **Clear browser cache:**
   - Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)

### Page URL not showing correctly

1. **Verify URL format:**
   - URLs should start with `/` 
   - Example: `/about-company`, not `about-company`

2. **Check spelling:**
   - Make sure the page URL exactly matches the page in page builder

## FAQ

**Q: Can I link a category to an external URL?**  
A: Currently, categories link to page builder pages only. To link to external sites, consider using a Button block on the page instead.

**Q: What if I remove the page link?**  
A: The category will display its own content (if any) instead of redirecting. Click the "Холбоо тасрах" (Unlink) button to remove a link.

**Q: Can the same page be linked to multiple categories?**  
A: Yes, multiple categories can link to the same page.

**Q: How do I change the order of categories?**  
A: Use the up/down arrow buttons next to each category in the list view to reorder them.

**Q: Are linked categories visible on the frontend?**  
A: Yes, they appear as tabs just like other categories. The link only affects what happens when clicked.

## Related Features

- **Page Builder**: Create custom pages to link to categories
- **Page Translations**: Each page supports Mongolian and English
- **Category Ordering**: Use arrow buttons to reorder categories
- **Category Activity**: Toggle categories on/off without deleting them

---

For more help, see the main README.md or admin panel documentation.
