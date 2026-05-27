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
