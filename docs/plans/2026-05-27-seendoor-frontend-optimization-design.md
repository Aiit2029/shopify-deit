# Seendoor Frontend Optimization Design

## Goal

Optimize the Seendoor Shopify theme without a full redesign. The work should improve conversion clarity, mobile purchasing, visual consistency, accessibility, and page performance while preserving the current modern home lighting identity.

## Current Context

The project is a Shopify theme export. The active homepage is configured in `templates/index.json`, product pages in `templates/product.json` and `sections/product-template.liquid`, collection pages in `templates/collection.liquid` and `sections/collection-template.liquid`, and global assets are loaded through `layout/theme.liquid`, `snippets/header-styles.liquid`, and `snippets/header-javascript.liquid`.

The theme already has strong product imagery and a warm modern direction, but several areas dilute conversion:

- Homepage repeats the same large image banner pattern across multiple sections.
- Promotion logic is duplicated across the top bar, homepage coupon block, and product page coupon block.
- Product page purchase controls are pushed down by coupon text, variant blocks, floating chat, and mobile bottom navigation.
- Collection filters are functional but not self-explanatory enough for mobile shoppers.
- Global scripts are heavy and include duplicate or legacy loading patterns.
- Accessibility issues include disabled zooming, missing focus styles, unlabeled icon controls, and image alt gaps.

## Visual Direction

Use a restrained "warm modern lighting studio" direction.

- Warm white surfaces for editorial calm: `#F7F3EE` or existing white where layout requires it.
- Charcoal text for premium readability: `#1F1E1B`.
- Antique brass accent for brand continuity: existing `#AC8058` or nearby `#B8946D`.
- Terracotta red only for sale emphasis: around `#8A3A2F`.
- Soft olive or muted green only for trust and stock states.

Why: Seendoor sells lighting, hardware, and home atmosphere. Warm whites, brass, and charcoal align with product materials and interior photography. Red should remain a conversion signal, not become the dominant brand color.

## Homepage Design

### 1. Header And Announcement

Keep the desktop logo-centered header, but reduce promotion duplication.

Optimization:

- Keep one concise announcement message in the top bar.
- Avoid a second long scrolling announcement unless it appears only on product pages and does not repeat the same copy.
- Keep search visible on desktop and mobile.
- On mobile, leave room for cart and search, and avoid crowding with too many fixed controls.

Reason:

The top bar should communicate immediate commercial value. Long messages and repeated sale banners make the site feel more promotional than curated.

### 2. Hero Section

Keep the high-quality lifestyle hero image, but shift copy from seasonal campaign copy toward a longer-lived brand promise.

Optimization:

- Use a brand-led headline such as "Modern Lighting for Warm, Lived-In Homes".
- Keep a smaller campaign label for Mother's Day or current promotions.
- Use two clear CTAs: "Shop Lighting" and "Shop Quick Ship".
- Improve text contrast with a subtle overlay or text placement away from bright image areas.
- Use purpose-cropped mobile imagery rather than relying only on desktop image scaling.

Reason:

The first viewport must quickly answer what the store sells, what style it represents, and where the user should go next. Seasonal campaigns help conversion but should not replace brand positioning.

### 3. Trust Bar

The trust bar should be compact and scannable.

Optimization:

- Desktop: four compact trust items in one row.
- Mobile: two-column grid instead of a carousel.
- Standardize icon sizing and text rhythm.
- Use copy such as "Free Shipping over €50", "14-Day Returns", "Secure Checkout", "Support in 1-2 Business Days".

Reason:

Trust points are not hero content. They should reduce friction quickly without taking excessive vertical space.

### 4. Coupon Section

Replace the current large background coupon banner with coupon tier cards.

Optimization:

- Three cards: `10% SD10`, `13% SD13`, `15% SD15`.
- Use one copy interaction with a single toast component.
- Avoid inline JavaScript in `templates/index.json`; move behavior to theme JavaScript or a small dedicated asset.
- On mobile, cards should be stacked or 1-column, but not overly tall.

Reason:

The purpose of this section is comprehension and code copying. A dramatic image makes the content harder to read, especially on mobile.

### 5. Shop By Category

Preserve the six category cards and improve decision support.

Optimization:

- Use consistent aspect ratio and spacing.
- Add a short use case under each title: dining rooms, hallways, bedside corners, living rooms, and so on.
- Mobile should use a clear 2-column grid rather than partially visible horizontal cards.

Reason:

Lighting shoppers often browse by room, use case, and fixture type. Category names alone are less helpful than category plus context.

### 6. Best Sellers And Product Tabs

Reduce repeated hero-banner patterns and make best-seller logic clearer.

Optimization:

- Keep one strong Best Sellers visual, but pair it with product selection reasons.
- Add short explanatory copy to series tabs when possible.
- Make active tabs use a refined brass or charcoal state, not a heavy visual treatment.
- Product cards should emphasize image, product title, reviews, price, and sale status.

Reason:

Best sellers should justify confidence. The current module looks polished but relies heavily on mood imagery rather than purchase reasons.

### 7. New Arrivals And Quick Ship

Separate discovery and urgency.

Optimization:

- New Arrivals should feel editorial and exploratory.
- Quick Ship should be more conversion-focused, with clear "In Stock", "Ready to Ship", or delivery reassurance copy.
- Reduce repeated "Explore Now" banner language across sections.

Reason:

New products and fast-shipping products answer different user needs. Treating them with the same layout weakens both.

### 8. Blog

Turn the blog section into a guidance module.

Optimization:

- Use 3-4 articles instead of a dense 5-column row where possible.
- Add labels such as "Lighting Guide", "Room Ideas", and "Hardware Tips".
- Include short summaries when layout allows.

Reason:

The blog should support SEO and purchase confidence, not merely fill the bottom of the homepage.

## Collection Page Design

### 1. Filter And Sort

Make filtering easier to understand, especially on mobile.

Optimization:

- Rename the mobile filter icon area visually to include "Filter".
- Keep sorting visible but subordinate to filtering.
- Prefer lighting-oriented filters when available: room, fixture type, finish, material, size, price, availability.
- Keep the product grid stable during filtering.

Reason:

Collection pages are comparison pages. Shoppers need to narrow options by practical criteria, not just scroll.

### 2. Product Cards

Standardize product-card hierarchy.

Optimization:

- Image first, with sale badge in a consistent brass or terracotta style.
- Title should allow two lines before truncating.
- Rating and review count should remain visible if available.
- Price hierarchy should distinguish sale price and compare-at price clearly.
- Quick view and wishlist buttons should not visually compete with the product image.

Reason:

Product cards should support fast comparison. Overlaid icons and aggressive truncation make mobile browsing feel cramped.

## Product Page Design

### 1. Purchase Panel Order

Reorder and tighten the purchase content.

Recommended order:

1. Product title
2. Rating/review signal
3. Price
4. Stock status
5. Coupon tier block
6. Variant options
7. Quantity
8. Add to Cart
9. Express payment
10. Trust points
11. Checkout icons

Reason:

The purchase panel should answer confidence, price, availability, choice, and action in that order.

### 2. Coupon Block

Replace inline coupon paragraphs with a dedicated coupon component.

Optimization:

- Use a compact block with three coupon rows.
- Make copy buttons consistent and accessible.
- Avoid repeated inline functions in JSON.

Reason:

The current product coupon code is hard to maintain and consumes too much vertical space.

### 3. Mobile Purchase Path

Enable or implement a mobile sticky add-to-cart pattern.

Optimization:

- Use the existing product sticky cart capability if feasible.
- If not feasible, add a restrained sticky mobile purchase bar.
- Offset floating chat so it does not cover variants or CTA.
- Add mobile bottom spacing only where needed.

Reason:

On mobile, the user should never lose the ability to continue purchase after selecting options.

### 4. Trust And Payment

Convert the inline trust table into a styled component.

Optimization:

- Use CSS classes rather than inline table styles.
- Keep icons small and consistent.
- Make copy concise.

Reason:

Trust content should look native to the theme and remain responsive without table layout issues.

### 5. Recommendations

Reduce repeated recommendation blocks.

Optimization:

- Keep the strongest recommendation section.
- Avoid showing multiple "recently viewed" or similar carousels in succession.

Reason:

Recommendation clutter after product details weakens the page and increases scroll fatigue.

## Global Performance And Accessibility

### Performance

Optimization:

- Delay chat script loading until user interaction or after initial page load.
- Remove duplicate legacy jQuery loading if theme behavior allows.
- Load product-only scripts only on product pages and collection-only scripts only on collection pages.
- Avoid placing large inline CSS/JS blocks inside JSON templates.
- Use responsive image sizing and avoid oversized hero payloads.

Reason:

The current theme loads several heavy global assets. Reducing blocking scripts and deferring third-party tools should improve perceived speed and mobile interaction.

### Accessibility

Optimization:

- Remove `user-scalable=no` from the viewport meta tag.
- Restore visible focus styles for keyboard users.
- Ensure icon-only buttons have accessible names.
- Add or improve alt text for key images.
- Improve text contrast on image overlays.

Reason:

Accessibility improvements also improve usability and SEO. The current viewport and focus behavior reduce usability on mobile and keyboard navigation.

## Implementation Boundaries

This optimization should avoid a full theme migration. Prefer scoped Liquid, CSS, and minimal JavaScript edits.

Do not rewrite Foxify, PageFly, SMI, or Shopify app-generated systems unless necessary. Use theme-level overrides and existing section settings where possible.

## Success Criteria

- Mobile product page has a clearer path to Add to Cart.
- Homepage promotion and category sections are easier to scan.
- Collection filtering is easier to understand on mobile.
- Product cards have consistent hierarchy and spacing.
- Chat no longer covers the primary purchase path.
- Large inline promotional code is moved out of JSON or isolated.
- Accessibility issues around viewport zoom and focus states are improved.
- Global script loading is less intrusive where safely possible.
