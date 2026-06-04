const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const parse = (file) => JSON.parse(read(file));

const oldBlueValues = ['#2f5d8c', '#9eb7d3', '#e8eef5'];
const warmLegacyValues = ['#ac8058', '#835e39', '#aa7d4f', '#fdf6e8', '#963f32', '#71816f'];

const homepageSectionIds = [
  'sd_home_hero',
  'sd_home_nav_paths',
  'sd_home_room_menu',
  'sd_home_best_sellers',
  'sd_home_type_grid',
  'sd_home_new_arrivals',
  'sd_home_quick_ship',
  'sd_home_homeware_grid',
  'sd_home_style_grid',
  'sd_home_offer',
  'sd_home_trust',
];

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
    name: 'optimization and homepage assets are loaded',
    run() {
      const styles = read('snippets/header-styles.liquid');
      const theme = read('layout/theme.liquid');
      assert(styles.includes('seendoor-optimization.css'));
      assert(styles.includes('sd-home-sections.css'));
      assert(styles.includes('moulin-light-app.woff2'));
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
    name: 'homepage is split into separate editable Shopify sections',
    run() {
      const index = parse('templates/index.json');
      assert.deepEqual(index.order, homepageSectionIds);
      assert(!index.sections.sd_homepage_rebuild);
      assert(!exists('sections/sd-homepage-rebuild.liquid'));

      const expectedTypes = {
        sd_home_hero: 'sd-home-hero',
        sd_home_nav_paths: 'sd-home-nav-paths',
        sd_home_room_menu: 'sd-home-room-menu',
        sd_home_best_sellers: 'sd-home-product-carousel',
        sd_home_type_grid: 'sd-home-card-grid',
        sd_home_new_arrivals: 'sd-home-product-carousel',
        sd_home_quick_ship: 'sd-home-product-carousel',
        sd_home_homeware_grid: 'sd-home-card-grid',
        sd_home_style_grid: 'sd-home-card-grid',
        sd_home_offer: 'sd-home-offer-panel',
        sd_home_trust: 'sd-home-trust',
      };

      for (const [id, type] of Object.entries(expectedTypes)) {
        assert.equal(index.sections[id].type, type, id);
        assert(exists(`sections/${type}.liquid`), type);
      }
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
    name: 'product sections are carousel sections with visible arrow controls',
    run() {
      const index = parse('templates/index.json');
      const carouselSection = read('sections/sd-home-product-carousel.liquid');
      assert(carouselSection.includes('data-sdh-carousel-prev'));
      assert(carouselSection.includes('data-sdh-carousel-next'));
      assert(carouselSection.includes('scrollBy'));
      assert(carouselSection.includes("{% render 'sd-home-product-card', product: product %}"));

      for (const id of ['sd_home_best_sellers', 'sd_home_new_arrivals', 'sd_home_quick_ship']) {
        assert.equal(index.sections[id].type, 'sd-home-product-carousel', id);
        assert.equal(index.sections[id].settings.show_arrows, true, id);
        assert.equal(index.sections[id].settings.product_limit, 10, id);
      }
    },
  },
  {
    name: 'required quick ship surface is its own editable carousel section',
    run() {
      const index = parse('templates/index.json');
      const quick = index.sections.sd_home_quick_ship;
      const encoded = JSON.stringify(quick);
      assert.equal(quick.type, 'sd-home-product-carousel');
      assert.equal(quick.settings.collection, 'in-stock-quick-ship-lighting');
      assert.equal(quick.settings.theme, 'dark');
      assert(encoded.includes('Quick Ship'));
      assert(encoded.includes('Ready when the project is.'));
      assert(encoded.includes('/collections/in-stock-quick-ship-lighting'));
    },
  },
  {
    name: 'type grid uses five desktop columns to avoid orphan layout',
    run() {
      const index = parse('templates/index.json');
      const typeGrid = index.sections.sd_home_type_grid;
      assert.equal(typeGrid.type, 'sd-home-card-grid');
      assert.equal(typeGrid.settings.columns, '5');
      assert.equal(typeGrid.block_order.length, 5);
      assert(read('assets/sd-home-sections.css').includes('.sdh-card-grid--5'));
      assert(read('assets/sd-home-sections.css').includes('grid-template-columns: repeat(5, minmax(0, 1fr))'));
    },
  },
  {
    name: 'offer section keeps approved codes and supports click-to-copy',
    run() {
      const index = parse('templates/index.json');
      const offer = index.sections.sd_home_offer;
      const codes = offer.block_order.map((id) => offer.blocks[id].settings.code);
      const offerSection = read('sections/sd-home-offer-panel.liquid');

      assert.deepEqual(codes, ['SD10', 'SD13', 'SD15']);
      assert(offerSection.includes('data-sdh-copy-code'));
      assert(offerSection.includes('navigator.clipboard.writeText'));
      assert(offerSection.includes('document.execCommand'));
      assert(offerSection.includes('sdh-copy-toast'));
      assert(read('templates/index.json').includes('Click a code to copy it.'));
    },
  },
  {
    name: 'Moulin font is bundled and applied to homepage sections',
    run() {
      assert(exists('assets/moulin-light-app.woff2'));
      const styles = read('snippets/header-styles.liquid');
      const css = read('assets/sd-home-sections.css');
      assert(styles.includes('@font-face'));
      assert(styles.includes('Moulin Seendoor'));
      assert(styles.includes("{{ 'moulin-light-app.woff2' | asset_url }}"));
      assert(css.includes('font-family: "Moulin Seendoor"'));
    },
  },
  {
    name: 'homepage color system avoids blue text palette and old brass system',
    run() {
      const css = read('assets/seendoor-optimization.css');
      const homeCss = read('assets/sd-home-sections.css');
      const variablesLiquid = read('assets/css-variables.css.liquid');
      const settings = read('config/settings_data.json');
      const index = read('templates/index.json');

      assert(css.includes('--sd-canvas: #f3f2ef'));
      assert(css.includes('--sd-graphite: #181816'));
      assert(css.includes('--sd-sale: #6e2638'));
      assert(homeCss.includes('--sdh-canvas: #f3f2ef'));
      assert(homeCss.includes('--sdh-forest: #26352b'));
      assert(homeCss.includes('--sdh-oxblood: #6e2638'));
      assert(variablesLiquid.includes('--theme-color:{{ settings.theme-color }}'));
      assert(variablesLiquid.includes('--body-bg-color:{{ settings.color_body_bg }}'));
      assert(settings.includes('"theme-color":"#26352b"'));
      assert(settings.includes('"color_body_bg":"#f3f2ef"'));

      for (const value of oldBlueValues) {
        assert(!css.includes(value), value);
        assert(!homeCss.includes(value), value);
        assert(!settings.includes(value), value);
        assert(!index.includes(value), value);
      }

      for (const value of warmLegacyValues) {
        assert(!css.includes(value), value);
        assert(!homeCss.includes(value), value);
        assert(!settings.includes(value), value);
        assert(!index.includes(value), value);
      }
    },
  },
  {
    name: 'approved coupon codes stay fixed across homepage and product page',
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
    },
  },
  {
    name: 'new homepage product cards avoid old product-list button dependency',
    run() {
      const section = read('sections/sd-home-product-carousel.liquid');
      const card = read('snippets/sd-home-product-card.liquid');
      assert(section.includes("{% render 'sd-home-product-card', product: product %}"));
      assert(card.includes('sdh-product-card__price'));
      assert(card.includes('sdh-product-card__link'));
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
    name: 'homepage sections use consistent 1750px content width',
    run() {
      const index = parse('templates/index.json');
      for (const id of homepageSectionIds) {
        assert.equal(index.sections[id].settings.max_width, '1750px', id);
      }
    },
  },
  {
    name: 'all new homepage section schemas are valid',
    run() {
      for (const file of [
        'sections/sd-home-hero.liquid',
        'sections/sd-home-nav-paths.liquid',
        'sections/sd-home-room-menu.liquid',
        'sections/sd-home-card-grid.liquid',
        'sections/sd-home-product-carousel.liquid',
        'sections/sd-home-offer-panel.liquid',
        'sections/sd-home-trust.liquid',
      ]) {
        const text = read(file);
        const match = text.match(/{% schema %}([\s\S]*?){% endschema %}/);
        assert(match, `${file} schema missing`);
        JSON.parse(match[1]);
      }
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
