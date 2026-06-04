const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const parse = (file) => JSON.parse(read(file));

const oldBlueValues = ['#2f5d8c', '#9eb7d3', '#e8eef5'];
const warmLegacyValues = ['#ac8058', '#835e39', '#aa7d4f', '#fdf6e8', '#963f32', '#71816f'];

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
    name: 'theme does not load legacy jQuery CDN globally',
    run() {
      const headerJs = read('snippets/header-javascript.liquid');
      assert(!headerJs.includes('code.jquery.com/jquery-1.9.1.min.js'));
    },
  },
  {
    name: 'homepage is rebuilt as one editable Shopify section',
    run() {
      const index = parse('templates/index.json');
      assert.deepEqual(index.order, ['sd_homepage_rebuild']);
      assert.equal(index.sections.sd_homepage_rebuild.type, 'sd-homepage-rebuild');

      const section = read('sections/sd-homepage-rebuild.liquid');
      assert(section.includes('"name": "SD Homepage Rebuild"'));
      assert(section.includes('"type": "collection"'));
      assert(section.includes('"type": "image_picker"'));
      assert(section.includes('"type": "url"'));
      assert(!read('templates/index.json').includes('sd-editorial-heading'));
      assert(!read('templates/index.json').includes('function copyCode(code)'));
      assert(!read('templates/index.json').includes('navigator.clipboard.writeText(code)'));
    },
  },
  {
    name: 'homepage follows the Seendoor menu plan',
    run() {
      const index = read('templates/index.json');
      for (const text of [
        'Lighting',
        'Best Sellers',
        'New Arrivals',
        'Homeware',
        'Quick Ship',
        'Living Room',
        'Dining Room',
        'Bedroom',
        'Kitchen',
        'Bathroom',
        'Hallway & Entryway',
        'Pendant Lights',
        'Ceiling Lights',
        'Wall Lights',
        'Table Lamps',
        'Floor Lamps',
        'Modern',
        'Scandinavian',
        'Minimalist',
        'Industrial',
        'Colorful Lighting',
        'Door Handles',
        'Cabinet Handles',
        'Decorative Ornaments',
        'Candle Holders',
      ]) {
        assert(index.includes(text), text);
      }
    },
  },
  {
    name: 'required quick ship surface is prominent and editable',
    run() {
      const index = parse('templates/index.json');
      const homepage = index.sections.sd_homepage_rebuild;
      const encoded = JSON.stringify(homepage);
      assert.equal(homepage.settings.quick_ship_collection, 'in-stock-quick-ship-lighting');
      assert(encoded.includes('Quick Ship'));
      assert(encoded.includes('Ready when the project is.'));
      assert(encoded.includes('/collections/in-stock-quick-ship-lighting'));
      assert(read('sections/sd-homepage-rebuild.liquid').includes('quick_ship_collection'));
    },
  },
  {
    name: 'Moulin font is bundled and applied to homepage',
    run() {
      assert(exists('assets/moulin-light-app.woff2'));
      const section = read('sections/sd-homepage-rebuild.liquid');
      assert(section.includes('@font-face'));
      assert(section.includes('Moulin Seendoor'));
      assert(section.includes("{{ 'moulin-light-app.woff2' | asset_url }}"));
      assert(section.includes('font-family: "Moulin Seendoor"'));
    },
  },
  {
    name: 'homepage color system avoids blue text palette and old brass system',
    run() {
      const css = read('assets/seendoor-optimization.css');
      const variables = read('assets/css-variables.css');
      const settings = read('config/settings_data.json');
      const section = read('sections/sd-homepage-rebuild.liquid');
      const index = read('templates/index.json');

      assert(css.includes('--sd-canvas: #f3f2ef'));
      assert(css.includes('--sd-graphite: #181816'));
      assert(css.includes('--sd-sale: #6e2638'));
      assert(variables.includes('--theme-color:#26352b'));
      assert(variables.includes('--body-bg-color:#f3f2ef'));
      assert(settings.includes('"theme-color":"#26352b"'));
      assert(settings.includes('"color_body_bg":"#f3f2ef"'));
      assert(section.includes('--sdr-forest: #26352b'));
      assert(section.includes('--sdr-oxblood: #6e2638'));

      for (const value of oldBlueValues) {
        assert(!css.includes(value), value);
        assert(!variables.includes(value), value);
        assert(!settings.includes(value), value);
        assert(!section.includes(value), value);
        assert(!index.includes(value), value);
      }

      for (const value of warmLegacyValues) {
        assert(!css.includes(value), value);
        assert(!settings.includes(value), value);
        assert(!section.includes(value), value);
        assert(!index.includes(value), value);
      }
    },
  },
  {
    name: 'approved coupon codes stay fixed',
    run() {
      const indexRaw = read('templates/index.json');
      const productRaw = read('templates/product.json');
      const settings = read('config/settings_data.json');

      for (const code of ['SD10', 'SD13', 'SD15']) {
        assert(indexRaw.includes(code), code);
        assert(productRaw.includes(code), code);
      }

      assert(!indexRaw.includes('LIGHT10'));
      assert(!productRaw.includes('LIGHT10'));
      assert(!settings.includes('LIGHT10'));
      assert(indexRaw.includes('Use SD10, SD13, or SD15 at checkout'));
    },
  },
  {
    name: 'new homepage product cards avoid old product-list button dependency',
    run() {
      const section = read('sections/sd-homepage-rebuild.liquid');
      const card = read('snippets/sd-home-product-card.liquid');
      assert(section.includes("{% render 'sd-home-product-card', product: product %}"));
      assert(card.includes('sdr-product-card__price'));
      assert(card.includes('sdr-product-card__link'));
      assert(card.includes('View product'));
      assert(!section.includes('wpbingo-section--products'));
      assert(!section.includes('button_view'));
    },
  },
  {
    name: 'legacy product list view-all buttons keep readable contrast',
    run() {
      const css = read('assets/seendoor-optimization.css');
      assert(css.includes('.wpbingo-section--products .button_view a::before'));
      assert(css.includes('content: none'));
      assert(css.includes('.wpbingo-section--products .button_view a {'));
      assert(css.includes('background: var(--sd-graphite) !important'));
      assert(css.includes('color: #fff !important'));
      assert(css.includes('.wpbingo-section--products .button_view a span'));
      assert(css.includes('fill: currentColor !important'));
      assert(css.includes('.wpbingo-section--products .button_view a:hover'));
      assert(css.includes('background: var(--sd-slate) !important'));
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
  {
    name: 'homepage JSON template sections are all ordered for Shopify sync',
    run() {
      const index = parse('templates/index.json');
      const order = index.order || [];
      const missingFromOrder = Object.keys(index.sections || {}).filter((id) => !order.includes(id));
      const unknownInOrder = order.filter((id) => !index.sections[id]);
      assert.deepEqual(missingFromOrder, []);
      assert.deepEqual(unknownInOrder, []);
    },
  },
  {
    name: 'homepage uses consistent 1750px content width',
    run() {
      const index = parse('templates/index.json');
      assert.equal(index.sections.sd_homepage_rebuild.settings.max_width, '1750px');
      const section = read('sections/sd-homepage-rebuild.liquid');
      assert(section.includes('--sdr-max: {{ max_width | escape }}'));
    },
  },
  {
    name: 'product sticky cart is enabled',
    run() {
      const product = parse('templates/product.json');
      assert.equal(product.sections['product-template'].settings.show_sticky_cart, true);
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
    name: 'collection page keeps editable scene category rail before product grid',
    run() {
      const collection = read('templates/collection.liquid');
      const section = read('sections/sd-collection-quick-links.liquid');
      const settings = read('config/settings_data.json');
      const css = read('assets/seendoor-optimization.css');

      assert(collection.includes("{% section 'sd-collection-quick-links' %}"));
      assert(section.includes('"name": "SD Collection Quick Links"'));
      assert(section.includes('"type": "collection"'));
      assert(section.includes('"type": "image_picker"'));
      assert(settings.includes('"sd-collection-quick-links"'));
      assert(settings.includes('Shop by room'));
      assert(css.includes('.sd-collection-quick-links__rail'));
      assert(css.includes('grid-auto-flow: column'));
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
