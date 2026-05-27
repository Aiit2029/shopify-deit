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
      assert(styles.includes('seendoor-optimization.css'));
      assert(theme.includes('seendoor-optimization.js'));
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
  {
    name: 'collection product cards have optimized browsing styles',
    run() {
      const css = read('assets/seendoor-optimization.css');
      assert(css.includes('.product-card__name a'));
      assert(css.includes('-webkit-line-clamp: 2'));
      assert(css.includes('.product-card:hover .product-card__image-wrapper img'));
      assert(css.includes('.page-collection .products__col'));
    },
  },
  {
    name: 'theme does not load legacy jQuery CDN globally',
    run() {
      const headerJs = read('snippets/header-javascript.liquid');
      assert(!headerJs.includes('code.jquery.com/jquery-1.9.1.min.js'));
    },
  },
  {
    name: 'seasonal campaign copy is current across homepage and product page',
    run() {
      const index = read('templates/index.json');
      const product = read('templates/product.json');
      const settings = read('config/settings_data.json');
      assert(!/Mother'?s Day|Black Friday|Ends 19 May/i.test(index));
      assert(!/Mother'?s Day|Black Friday|Ends 19 May/i.test(product));
      assert(!/Mother'?s Day|Black Friday|Ends 19 May/i.test(settings));
      assert(index.includes('Summer Home Refresh'));
      assert(product.includes('Summer Home Refresh'));
      assert(settings.includes('Summer Home Refresh'));
    },
  },
  {
    name: 'deep redesign tokens and editorial surfaces are present',
    run() {
      const css = read('assets/seendoor-optimization.css');
      assert(css.includes('--sd-gallery-ink'));
      assert(css.includes('--sd-gallery-paper'));
      assert(css.includes('.sd-seasonal-event'));
      assert(css.includes('.wpbingo-section--products'));
      assert(css.includes('.collection-content'));
    },
  },
  {
    name: 'collection filter dropdowns layer above sale badges',
    run() {
      const css = read('assets/seendoor-optimization.css');
      assert(css.includes('.page-collection.dropdown .FacetsWrapperDesktop'));
      assert(css.includes('.page-collection.dropdown .FacetsWrapperDesktop .facets__display'));
      assert(css.includes('z-index: 420'));
      assert(css.includes('.page-collection .product-card__label'));
      assert(css.includes('z-index: 20'));
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
