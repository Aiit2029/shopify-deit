# Seendoor Frontend Optimization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve the Seendoor Shopify theme's conversion clarity, mobile purchase path, visual consistency, accessibility, and script loading without a full redesign.

**Architecture:** Use scoped Shopify theme overrides instead of rewriting the theme framework. Add one small optimization stylesheet and one small optimization script, then connect them through the existing theme layout. Keep JSON template changes focused on section settings and custom block HTML that currently contains inline code.

**Tech Stack:** Shopify Liquid, JSON theme templates, CSS, vanilla JavaScript, Node.js static regression checks.

---

## Context

Design spec: `docs/plans/2026-05-27-seendoor-frontend-optimization-design.md`

Key files:

- `layout/theme.liquid`
- `snippets/header-styles.liquid`
- `snippets/header-javascript.liquid`
- `templates/index.json`
- `templates/product.json`
- `templates/collection.liquid`
- `sections/collection-template.liquid`
- `sections/product-template.liquid`
- `snippets/sticky-cart.liquid`
- `assets/css-site.css`
- `assets/css-product.css`
- `assets/css-collection.css`

Important existing facts:

- `settings.show_menu_bottom` is enabled in `config/settings_data.json`.
- `product-template` has `show_sticky_cart: false` in `templates/product.json`.
- `templates/index.json` contains a large Mother's Day coupon block with inline CSS and JavaScript.
- `templates/product.json` contains a custom product coupon block with inline style and JavaScript.
- `layout/theme.liquid` includes `user-scalable=no` in the viewport meta tag.
- `layout/theme.liquid` loads Smartsupp chat immediately inside the header.
- `snippets/header-javascript.liquid` loads both jQuery `1.9.1` from CDN and `jquery-3.5.1.min.js`.

## Task 1: Static Regression Test Harness

**Files:**

- Create: `tests/theme-frontend-optimization.test.js`
- Modify: `docs/plans/2026-05-27-seendoor-frontend-optimization-implementation.md` only if test commands need adjustment

**Step 1: Write the failing test**

Create a Node.js test that checks for the desired final theme state:

```js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const checks = [
  {
    name: 'viewport allows user zoom',
    run() {
      const theme = read('layout/theme.liquid');
      assert(!theme.includes('user-scalable=no'));
      assert(theme.includes('width=device-width,initial-scale=1,shrink-to-fit=no'));
    },
  },
  {
    name: 'optimization assets are loaded',
    run() {
      const styles = read('snippets/header-styles.liquid');
      const theme = read('layout/theme.liquid');
      assert(styles.includes("seendoor-optimization.css"));
      assert(theme.includes("seendoor-optimization.js"));
    },
  },
  {
    name: 'Smartsupp chat is delayed through optimization script',
    run() {
      const theme = read('layout/theme.liquid');
      const script = read('assets/seendoor-optimization.js');
      assert(!theme.includes('www.smartsuppchat.com/loader.js?'));
      assert(script.includes('loadSeendoorChat'));
      assert(script.includes('smartsuppchat.com/loader.js'));
    },
  },
  {
    name: 'homepage coupon block no longer owns inline behavior',
    run() {
      const index = read('templates/index.json');
      assert(!index.includes('function copyCode(code)'));
      assert(!index.includes('navigator.clipboard.writeText(code)'));
    },
  },
  {
    name: 'product coupon block no longer owns inline behavior',
    run() {
      const product = read('templates/product.json');
      assert(!product.includes('function copyToClipboard(str)'));
      assert(!product.includes('document.execCommand'));
      assert(product.includes('sd-coupon-panel'));
      assert(product.includes('sd-trust-points'));
    },
  },
  {
    name: 'product sticky cart is enabled',
    run() {
      const product = JSON.parse(read('templates/product.json'));
      assert.equal(product.sections['product-template'].settings.show_sticky_cart, true);
    },
  },
];

let failed = 0;
for (const check of checks) {
  try {
    check.run();
    console.log(`ok - ${check.name}`);
  } catch (error) {
    failed += 1;
    console.error(`not ok - ${check.name}`);
    console.error(error.message);
  }
}

if (failed) process.exit(1);
```

**Step 2: Run test to verify it fails**

Run: `node tests/theme-frontend-optimization.test.js`

Expected: FAIL because the new optimization assets do not exist, zoom is disabled, chat loads immediately, coupon blocks still contain inline JavaScript, and sticky cart is disabled.

**Step 3: Commit test**

Run:

```bash
git add tests/theme-frontend-optimization.test.js
git commit -m "test: add Seendoor frontend optimization checks"
```

## Task 2: Global Assets, Accessibility, And Chat Loading

**Files:**

- Create: `assets/seendoor-optimization.css`
- Create: `assets/seendoor-optimization.js`
- Modify: `snippets/header-styles.liquid`
- Modify: `layout/theme.liquid`

**Step 1: Confirm test is red**

Run: `node tests/theme-frontend-optimization.test.js`

Expected: FAIL on the checks listed in Task 1.

**Step 2: Add stylesheet include**

Modify `snippets/header-styles.liquid` after `css-site.css`:

```liquid
{{ 'seendoor-optimization.css' | asset_url | stylesheet_tag }}
```

**Step 3: Add script include**

Modify `layout/theme.liquid` near footer scripts, after `{% include 'footer-javascript' %}`:

```liquid
<script src="{{ 'seendoor-optimization.js' | asset_url }}" defer="defer"></script>
```

**Step 4: Allow zoom**

Modify the viewport meta tag in `layout/theme.liquid` from:

```liquid
<meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no, user-scalable=no">
```

to:

```liquid
<meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no">
```

**Step 5: Replace immediate Smartsupp load**

Remove the inline script that inserts `https://www.smartsuppchat.com/loader.js?` immediately.

Replace it with only the key configuration:

```liquid
<script>
  window._smartsupp = window._smartsupp || {};
  window._smartsupp.key = 'ed264771a60ef8a56489734df8027cbe343e7a99';
  window._smartsupp.orientation = 'right';
  window._smartsupp.offsetY = 220;
  window._smartsupp.offsetX = 0;
</script>
```

**Step 6: Implement delayed chat loader**

Add to `assets/seendoor-optimization.js`:

```js
(function () {
  var chatLoaded = false;

  function loadSeendoorChat() {
    if (chatLoaded || window.smartsupp) return;
    chatLoaded = true;

    var firstScript = document.getElementsByTagName('script')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.charset = 'utf-8';
    script.async = true;
    script.src = 'https://www.smartsuppchat.com/loader.js?';
    firstScript.parentNode.insertBefore(script, firstScript);
  }

  window.loadSeendoorChat = loadSeendoorChat;

  ['pointerdown', 'keydown', 'touchstart', 'scroll'].forEach(function (eventName) {
    window.addEventListener(eventName, loadSeendoorChat, { once: true, passive: true });
  });

  window.addEventListener('load', function () {
    window.setTimeout(loadSeendoorChat, 5000);
  });
})();
```

**Step 7: Add base CSS tokens and focus styles**

Add to `assets/seendoor-optimization.css`:

```css
:root {
  --sd-warm-surface: #f7f3ee;
  --sd-charcoal: #1f1e1b;
  --sd-brass: #ac8058;
  --sd-brass-dark: #8f6846;
  --sd-terracotta: #8a3a2f;
  --sd-border: #e7dfd6;
}

a:focus-visible,
button:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible,
[tabindex]:focus-visible {
  outline: 2px solid var(--sd-brass);
  outline-offset: 3px;
}

@media (max-width: 767px) {
  .smartsupp-widget,
  #smartsupp-widget-container {
    bottom: 86px !important;
  }
}
```

**Step 8: Run test**

Run: `node tests/theme-frontend-optimization.test.js`

Expected: Still FAIL until coupon and sticky-cart tasks are complete, but the viewport, asset, and delayed chat checks should pass.

**Step 9: Commit**

Run:

```bash
git add layout/theme.liquid snippets/header-styles.liquid assets/seendoor-optimization.css assets/seendoor-optimization.js
git commit -m "perf: add global Seendoor optimization assets"
```

## Task 3: Homepage Coupon And Visual Hierarchy

**Files:**

- Modify: `templates/index.json`
- Modify: `assets/seendoor-optimization.css`
- Modify: `assets/seendoor-optimization.js`

**Step 1: Confirm test is red for homepage coupon**

Run: `node tests/theme-frontend-optimization.test.js`

Expected: FAIL on homepage coupon inline behavior.

**Step 2: Move coupon copy behavior to JavaScript asset**

Append event delegation to `assets/seendoor-optimization.js`:

```js
(function () {
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }

    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return Promise.resolve();
  }

  document.addEventListener('click', function (event) {
    var trigger = event.target.closest('[data-sd-copy-code]');
    if (!trigger) return;

    var code = trigger.getAttribute('data-sd-copy-code');
    if (!code) return;

    copyText(code).then(function () {
      var original = trigger.textContent;
      trigger.textContent = 'Copied';
      trigger.classList.add('is-copied');
      window.setTimeout(function () {
        trigger.textContent = original;
        trigger.classList.remove('is-copied');
      }, 1500);
    });
  });
})();
```

**Step 3: Replace inline homepage coupon script**

Use a JSON-aware edit to remove the `<script>function copyCode...` block from `templates/index.json`.

Also change coupon buttons from:

```html
<button class="card-code" onclick="copyCode('SD10')">SD10</button>
```

to:

```html
<button class="card-code" type="button" data-sd-copy-code="SD10">SD10</button>
```

Repeat for `SD13` and `SD15`.

**Step 4: Add homepage coupon CSS overrides**

Add to `assets/seendoor-optimization.css`:

```css
.mothers-day-banner {
  background-color: var(--sd-warm-surface);
}

.mothers-day-card .card-code,
.sd-coupon-panel__copy {
  transition: background-color 180ms ease, color 180ms ease, border-color 180ms ease;
}

.mothers-day-card .card-code.is-copied,
.sd-coupon-panel__copy.is-copied {
  background: var(--sd-brass) !important;
  border-color: var(--sd-brass) !important;
  color: #fff !important;
}

@media (max-width: 767px) {
  .mothers-day-banner {
    padding: 34px 14px;
  }

  .mothers-day-title {
    font-size: 26px;
    letter-spacing: 1px;
    margin-bottom: 22px;
  }

  .mothers-day-cards {
    gap: 18px;
  }

  .mothers-day-card {
    padding: 14px 10px;
    border: 1px solid rgba(255, 255, 255, 0.42);
    background: rgba(31, 30, 27, 0.18);
  }
}
```

**Step 5: Run test**

Run: `node tests/theme-frontend-optimization.test.js`

Expected: Homepage coupon inline behavior check should pass.

**Step 6: Commit**

Run:

```bash
git add templates/index.json assets/seendoor-optimization.css assets/seendoor-optimization.js
git commit -m "refactor: move homepage coupon behavior into theme assets"
```

## Task 4: Collection Page And Product Card Polish

**Files:**

- Modify: `assets/seendoor-optimization.css`
- Optional Modify: `sections/collection-template.liquid`

**Step 1: Add a static check if Liquid changes are made**

If changing `sections/collection-template.liquid`, extend `tests/theme-frontend-optimization.test.js` with a check for the new filter label text.

Run: `node tests/theme-frontend-optimization.test.js`

Expected: FAIL until the label exists.

**Step 2: Improve product card readability**

Add to `assets/seendoor-optimization.css`:

```css
.product-card__name a {
  color: var(--sd-charcoal);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  min-height: 2.8em;
  overflow: hidden;
}

.product-card__price {
  margin-top: 6px;
}

.product-card .product-price.price-sale,
.product-card .price-sale {
  color: #b01818;
  font-weight: 500;
}

.product-card .product-price--regular,
.product-card .price-regular {
  color: rgba(31, 30, 27, 0.56);
}

.product-card__image-wrapper {
  background: #f6f3ef;
}

.product-card__image-wrapper img {
  transition: transform 260ms ease;
}

@media (hover: hover) {
  .product-card:hover .product-card__image-wrapper img {
    transform: scale(1.025);
  }
}
```

**Step 3: Improve mobile collection controls**

Add to `assets/seendoor-optimization.css`:

```css
@media (max-width: 767px) {
  .page-collection #main-collection-filters {
    margin-bottom: 20px;
  }

  .page-collection .collection-sidebar__close span,
  .page-collection .js-sidebar-toggle span {
    font-size: 14px;
    letter-spacing: 0;
  }

  .page-collection .collection-toolbar,
  .page-collection .filter-sortby {
    gap: 10px;
  }

  .page-collection .products__col {
    margin-bottom: 28px;
  }
}
```

If the existing filter button has no visible text, modify the relevant collection filter snippet to include a visible `Filter` label next to the icon.

**Step 4: Run test**

Run: `node tests/theme-frontend-optimization.test.js`

Expected: Any added collection static check should pass.

**Step 5: Commit**

Run:

```bash
git add assets/seendoor-optimization.css sections/collection-template.liquid tests/theme-frontend-optimization.test.js
git commit -m "style: improve collection browsing hierarchy"
```

Only include `sections/collection-template.liquid` and the test file if they were changed.

## Task 5: Product Page Coupon, Trust Points, And Sticky Cart

**Files:**

- Modify: `templates/product.json`
- Modify: `assets/seendoor-optimization.css`
- Optional Modify: `snippets/sticky-cart.liquid`

**Step 1: Confirm test is red for product page**

Run: `node tests/theme-frontend-optimization.test.js`

Expected: FAIL for product inline coupon behavior, missing `sd-coupon-panel`, missing `sd-trust-points`, and disabled sticky cart.

**Step 2: Enable sticky cart**

In `templates/product.json`, set:

```json
"show_sticky_cart": true
```

inside `sections.product-template.settings`.

**Step 3: Replace product coupon custom block HTML**

Replace the current `custom_code_block_JBLzLY.settings.custom_code` value with compact markup:

```html
<div class="sd-coupon-panel" aria-label="Current offers">
  <div class="sd-coupon-panel__row">
    <span>Buy 1</span>
    <strong>10% Off</strong>
    <button type="button" class="sd-coupon-panel__copy" data-sd-copy-code="SD10">SD10</button>
  </div>
  <div class="sd-coupon-panel__row">
    <span>Buy 2</span>
    <strong>13% Off</strong>
    <button type="button" class="sd-coupon-panel__copy" data-sd-copy-code="SD13">SD13</button>
  </div>
  <div class="sd-coupon-panel__row">
    <span>Buy 3</span>
    <strong>15% Off</strong>
    <button type="button" class="sd-coupon-panel__copy" data-sd-copy-code="SD15">SD15</button>
  </div>
</div>
```

Use JSON serialization instead of manually escaping the string.

**Step 4: Replace product trust custom block HTML**

Replace `custom_code_block_ikBVBE.settings.custom_code` with:

```html
<div class="sd-trust-points" aria-label="Store benefits">
  <div class="sd-trust-points__item">
    <span class="sd-trust-points__icon">✓</span>
    <span>€50+ Free Shipping</span>
  </div>
  <div class="sd-trust-points__item">
    <span class="sd-trust-points__icon">↺</span>
    <span>14-Day Returns</span>
  </div>
  <div class="sd-trust-points__item">
    <span class="sd-trust-points__icon">?</span>
    <span>Customer Support</span>
  </div>
</div>
```

Use JSON serialization instead of manually escaping the string.

**Step 5: Style product coupon and trust blocks**

Add to `assets/seendoor-optimization.css`:

```css
.sd-coupon-panel {
  display: grid;
  gap: 8px;
  margin: 0 0 18px;
  padding: 12px;
  border: 1px solid var(--sd-border);
  background: #fbf8f4;
}

.sd-coupon-panel__row {
  display: grid;
  grid-template-columns: 64px 1fr auto;
  align-items: center;
  gap: 10px;
  color: var(--sd-charcoal);
  font-size: 14px;
}

.sd-coupon-panel__row strong {
  color: var(--sd-terracotta);
  font-weight: 600;
}

.sd-coupon-panel__copy {
  min-width: 58px;
  min-height: 32px;
  border: 1px solid var(--sd-brass);
  background: #fff;
  color: var(--sd-brass-dark);
  font-weight: 600;
}

.sd-trust-points {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin: 16px 0;
  text-align: center;
}

.sd-trust-points__item {
  display: grid;
  gap: 6px;
  align-content: center;
  min-height: 76px;
  padding: 10px 6px;
  border: 1px solid var(--sd-border);
  background: #fff;
  color: var(--sd-charcoal);
  font-size: 13px;
}

.sd-trust-points__icon {
  color: var(--sd-brass);
  font-size: 18px;
  line-height: 1;
}

@media (max-width: 767px) {
  .product-single__title {
    font-size: 22px !important;
    line-height: 1.25;
  }

  .sd-coupon-panel__row {
    grid-template-columns: 54px 1fr auto;
    font-size: 13px;
  }

  .sd-trust-points {
    grid-template-columns: 1fr;
  }

  .sticky-cart-single {
    z-index: 1010;
  }

  .bwp-footer.have-menu-bottom,
  body.template-product .main-content {
    padding-bottom: 84px;
  }
}
```

**Step 6: Adjust sticky cart if needed**

If mobile sticky cart overlaps bottom navigation, add CSS overrides to make the sticky cart sit above the bottom menu or hide nonessential thumbnail/title content on small screens.

**Step 7: Run test**

Run: `node tests/theme-frontend-optimization.test.js`

Expected: PASS for product coupon, trust, and sticky cart checks.

**Step 8: Commit**

Run:

```bash
git add templates/product.json assets/seendoor-optimization.css snippets/sticky-cart.liquid
git commit -m "feat: improve product purchase path"
```

Only include `snippets/sticky-cart.liquid` if it was changed.

## Task 6: Script Loading Review

**Files:**

- Modify: `snippets/header-javascript.liquid`
- Modify: `tests/theme-frontend-optimization.test.js`

**Step 1: Add failing check for duplicate jQuery**

Extend the test with:

```js
{
  name: 'theme does not load legacy jQuery CDN globally',
  run() {
    const headerJs = read('snippets/header-javascript.liquid');
    assert(!headerJs.includes('code.jquery.com/jquery-1.9.1.min.js'));
  },
}
```

Run: `node tests/theme-frontend-optimization.test.js`

Expected: FAIL because the legacy CDN jQuery is still loaded.

**Step 2: Remove legacy jQuery CDN line**

Remove:

```liquid
<script src="https://code.jquery.com/jquery-1.9.1.min.js"></script>
```

Keep the theme asset:

```liquid
<script src="{{ 'jquery-3.5.1.min.js' | asset_url }}" defer="defer"></script>
```

**Step 3: Run static test**

Run: `node tests/theme-frontend-optimization.test.js`

Expected: PASS.

**Step 4: Commit**

Run:

```bash
git add snippets/header-javascript.liquid tests/theme-frontend-optimization.test.js
git commit -m "perf: remove legacy jquery cdn load"
```

## Task 7: Final Verification

**Files:**

- No planned edits

**Step 1: Run static regression checks**

Run: `node tests/theme-frontend-optimization.test.js`

Expected: PASS with all checks reporting `ok`.

**Step 2: Check JSON validity**

Run:

```bash
node -e "for (const f of ['templates/index.json','templates/product.json','config/settings_data.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')"
```

Expected: `json ok`

**Step 3: Inspect git diff**

Run: `git diff --stat HEAD~6..HEAD`

Expected: Changes should be limited to docs, tests, theme layout/assets, homepage/product JSON, and optional collection/sticky-cart edits.

**Step 4: Manual browser verification if a Shopify preview is available**

If a Shopify preview URL or local theme preview is available, verify:

- Mobile homepage coupon cards copy codes.
- Mobile product page sticky purchase path does not overlap chat or bottom navigation.
- Collection grid remains two columns on mobile.
- Keyboard focus is visible on links and buttons.

**Step 5: Final status**

Report:

- Files changed.
- Verification commands run.
- Any checks not run because no Shopify preview URL was available.
