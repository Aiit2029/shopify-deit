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
  {
    name: 'homepage narrative order follows room-first lighting journey',
    run() {
      const index = JSON.parse(read('templates/index.json'));
      const order = index.order;
      const position = (id) => order.indexOf(id);
      assert(position('sd_room_selector') > position('slideshow_4PmnVM'));
      assert(position('sd_room_selector') < position('featured_title_yBA3WE'));
      assert(position('featured_image_with_text_Kr6QBJ') < position('sd_offer_panel'));
      assert(position('sd_offer_panel') < position('slideshow_pCwUPy'));
      assert(position('featured_blog_post_L7cwnj') < position('sd_footer_trust'));
      assert(!order.includes('featured_policy_LCEaXC'));
    },
  },
  {
    name: 'homepage editable redesign uses native Shopify sections',
    run() {
      const index = JSON.parse(read('templates/index.json'));
      assert.equal(index.sections.sd_room_selector.type, 'sd-room-selector');
      assert.equal(index.sections.sd_offer_panel.type, 'sd-offer-panel');
      assert.equal(index.sections.sd_footer_trust.type, 'sd-footer-trust');

      const roomSection = read('sections/sd-room-selector.liquid');
      const offerSection = read('sections/sd-offer-panel.liquid');
      const trustSection = read('sections/sd-footer-trust.liquid');
      assert(roomSection.includes('"type": "collection"'));
      assert(roomSection.includes('"type": "image_picker"'));
      assert(offerSection.includes('data-sd-copy-code'));
      assert(trustSection.includes('"type": "select"'));

      for (const section of Object.values(index.sections)) {
        if (section.type !== 'featured-title') continue;
        const encodedSection = JSON.stringify(section);
        assert(!encodedSection.includes('<div class=\\"sd-'));
      }
    },
  },
  {
    name: 'homepage custom URL settings use relative fallback links',
    run() {
      const index = JSON.parse(read('templates/index.json'));
      for (const sectionId of ['sd_room_selector', 'sd_footer_trust']) {
        const section = index.sections[sectionId];
        const encoded = JSON.stringify(section);
        assert(!encoded.includes('shopify://policies/'));
        assert(!encoded.includes('shopify://pages/'));
        assert(!encoded.includes('shopify://collections/'));
      }
    },
  },
  {
    name: 'homepage JSON template sections are all ordered for Shopify sync',
    run() {
      const index = JSON.parse(read('templates/index.json'));
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
      const index = JSON.parse(read('templates/index.json'));
      for (const id of index.order) {
        const settings = index.sections[id].settings || {};
        if (Object.hasOwn(settings, 'max_width')) {
          assert.equal(settings.max_width, '1750px', id);
        }
        if (Object.hasOwn(settings, 'fullwidth')) {
          assert.equal(settings.fullwidth, false, id);
        }
        assert.notEqual(settings.container_full_width, true, id);
      }
    },
  },
  {
    name: 'homepage has room selector and footer trust bar copy',
    run() {
      const index = read('templates/index.json');
      assert(index.includes('sd-room-selector'));
      assert(index.includes('Shop by room'));
      assert(index.includes('Start with the room'));
      assert(index.includes('Living Room'));
      assert(index.includes('Dining Room'));
      assert(index.includes('sd-footer-trust'));
      assert(index.includes('Lighting Support'));
    },
  },
  {
    name: 'approved coupon codes stay fixed across campaign surfaces',
    run() {
      const indexRaw = read('templates/index.json');
      const index = JSON.parse(indexRaw);
      const productRaw = read('templates/product.json');
      const product = JSON.parse(productRaw);
      const settings = read('config/settings_data.json');
      const productCoupon = product.sections['product-template'].blocks.custom_code_block_JBLzLY.settings.custom_code;

      const offer = index.sections.sd_offer_panel;
      const codes = offer.block_order.map((id) => offer.blocks[id].settings.code);
      assert.deepEqual(codes, ['SD10', 'SD13', 'SD15']);
      assert(indexRaw.includes('Layer your summer light, save more'));
      assert(indexRaw.includes('Use SD10, SD13, or SD15'));
      assert(productCoupon.includes('data-sd-copy-code="SD10"'));
      assert(productCoupon.includes('data-sd-copy-code="SD13"'));
      assert(productCoupon.includes('data-sd-copy-code="SD15"'));
      assert(!indexRaw.includes('LIGHT10'));
      assert(!productRaw.includes('LIGHT10'));
      assert(!settings.includes('LIGHT10'));
    },
  },
  {
    name: 'homepage copy follows competitor-informed lighting journey',
    run() {
      const index = read('templates/index.json');
      assert(index.includes('Lighting that shapes the room'));
      assert(index.includes('Discover refined fixtures for warm dinners, quiet corners, and beautifully layered homes.'));
      assert(index.includes('Start with the room'));
      assert(index.includes('Then choose the fixture type'));
      assert(index.includes('Designed around atmosphere'));
      assert(index.includes('Every fixture is selected for the way it changes a room'));
      assert(index.includes('Support within 24 hours'));
    },
  },
  {
    name: 'collection page has editable scene category rail before product grid',
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
      assert(settings.includes('Shop lighting by room'));
      assert(css.includes('.sd-collection-quick-links__rail'));
      assert(css.includes('grid-auto-flow: column'));
    },
  },
  {
    name: 'homepage color system removes isolated promo and sage colors',
    run() {
      const css = read('assets/seendoor-optimization.css');
      const index = read('templates/index.json');
      const settings = read('config/settings_data.json');
      assert(css.includes('--sd-gallery-glow: #fdf6e8'));
      assert(css.includes('--sd-gallery-muted: #574e44'));
      assert(css.includes('--sd-gallery-clay: #835e39'));
      assert(!css.includes('#963f32'));
      assert(!css.includes('#71816f'));
      assert(!css.includes('#b01818'));
      assert(!index.includes('#963f32'));
      assert(!settings.includes('Use SD10 / SD13 / SD15'));
    },
  },
  {
    name: 'homepage buttons include stronger hover feedback',
    run() {
      const css = read('assets/seendoor-optimization.css');
      assert(css.includes('.sd-button--light:hover'));
      assert(css.includes('.sd-button--outline:hover'));
      assert(css.includes('.sd-room-card:hover img'));
      assert(css.includes('background: var(--sd-gallery-glow)'));
    },
  },
  {
    name: 'product list view-all buttons keep readable contrast',
    run() {
      const css = read('assets/seendoor-optimization.css');
      assert(css.includes('.wpbingo-section--products .button_view a::before'));
      assert(css.includes('background: var(--sd-gallery-ink)'));
      assert(css.includes('color: #fff'));
      assert(css.includes('content: none'));
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
