'use strict';
const products = {
  bottle: { name: 'The Everyday Bottle', price: 28, image: 'bottle', line: 'A fresh start. Refill after refill.', description: 'An easy companion for the commute, the desk, and the walk home. This concept pairs a simple metal body with a carry-loop lid in a soft sage finish. Keep the bottle you already love; choose a new one only when you need it.', specs: [['Concept capacity', '750 ml'], ['Concept finish', 'Sage green'], ['Intended material', 'Metal body'], ['Testing and sourcing', 'Not yet verified']] },
  tote: { name: 'The Anywhere Tote', price: 22, image: 'tote', line: 'For market mornings. And everything after.', description: 'A familiar shape for the small adventures of ordinary life. This canvas tote concept has long handles and a roomy base for your daily carry. Fold a bag you already own by the door so it is ready when you are.', specs: [['Concept color', 'Natural'], ['Intended fabric', 'Cotton canvas'], ['Concept use', 'Everyday carry'], ['Dimensions and load test', 'To be confirmed']] },
  cloths: { name: 'The Daily Cloths', price: 18, image: 'cloths', line: 'A softer side to your daily clean-up.', description: 'A small reset for the kitchen counter. This three-cloth concept brings a soft waffle texture and an earthy palette to everyday wiping and drying. Check the final care label and surface guidance before using any cleaning cloth.', specs: [['Concept set', '3 cloths'], ['Concept colors', 'Cream, sage, clay'], ['Intended fabric', 'Cotton waffle weave'], ['Composition and care tests', 'To be confirmed']] }
};
const sourceEpa = 'https://www.epa.gov/climate-change/what-you-can-do-about-climate-change-waste';
const sourceFtc = 'https://www.ftc.gov/news-events/topics/truth-advertising/green-guides';
const sourceCase = 'https://cleanwaterfund.org/publications/rethink-disposable-case-study-palo-alto-unified-school-district';
const articles = {
  own: { title: 'Before you buy, start with what you own.', category: 'EVERYDAY HABITS', image: 'tote', source: sourceEpa, sourceTitle: 'U.S. EPA: What You Can Do About Climate Change — Waste', body: `
    <p>It is easy to imagine a more thoughtful home as a collection of new things: matching jars, a beautiful bottle, a basket of fresh cloths. But a useful first step is less photogenic and often much simpler. Open a cupboard. Look at what already works. The item you reach for tomorrow may not need to be a new purchase at all.</p>
    <p>The U.S. Environmental Protection Agency puts preventing waste ahead of managing it after it has been created. That is a helpful starting point, not a reason to feel guilty about every possession. You do not need to replace your whole routine. You can start by noticing which parts already serve you well.</p>
    <h3>Take a five-minute inventory</h3>
    <p>Choose one small area, rather than the entire house. Check the drawer where shopping bags gather, the shelf of food containers, or the space beneath your kitchen sink. Pull out the items you regularly use. Notice which ones are clean, functional, and easy to reach. Give those things the best spots.</p>
    <p>Then look at what gets overlooked. Is a reusable bag hidden behind coats? Is your bottle difficult to clean? Is a container missing its lid? These are different problems, and buying another item will not solve all of them. Moving a bag, washing a bottle according to its instructions, or matching lids may be enough.</p>
    <h3>Make the useful choice the easy choice</h3>
    <p>A small change in where something lives can make a large difference to whether you remember it. Keep a shopping bag with your keys. Put a clean bottle beside your work bag. Store suitable cleaning cloths where you actually clean, with a separate place for used ones. The aim is convenience, not a perfectly styled shelf.</p>
    <p>Use items only for purposes they can safely handle. An old food container is not automatically suitable for microwaving, freezing, or holding hot liquids. Check its markings and original instructions. Reuse should not mean guessing about food contact, electrical safety, or a product that has become damaged.</p>
    <h3>Care is part of using less</h3>
    <p>Follow the maker's cleaning and maintenance advice. Give washable items time to dry before storing them. Look for replacement parts or a repair option when that is appropriate. If a repair needs specialist knowledge, ask a qualified person rather than taking a risk to avoid replacing something.</p>
    <p>Not everything can or should be kept forever. Worn-out items, changing needs, and safety issues are real. The goal is to avoid discarding a functional thing simply because a newer one has a more appealing environmental label. Thoughtful living should support your life, not turn every practical decision into a moral test.</p>
    <h3>When it really is time to buy</h3>
    <p>Write down what the replacement needs to do. Consider size, comfort, cleaning, available parts, and how often you expect to use it. Ask specific questions about materials and manufacturing instead of relying on a broad promise. Choose a quantity you can realistically keep in use.</p>
    <p>For this week, try one small experiment: find an overlooked item you already own and place it where it will be useful. Notice whether that change helps. If it does not, adjust it. The best routine is not the most impressive one; it is the one that works on an ordinary Tuesday.</p>` },
  labels: { title: 'A good label tells the whole story.', category: 'BUYING THOUGHTFULLY', image: 'cloths', source: sourceFtc, sourceTitle: 'Federal Trade Commission: Green Guides', body: `
    <p>A leaf on a label can catch your eye. A phrase like “earth-friendly” can feel reassuring. Neither tells you much about the product on its own. When you want to make an informed choice, the useful information is usually more specific: what a claim refers to, how it was checked, and which limitations still apply.</p>
    <p>You do not need to become a materials expert to ask sensible questions. The U.S. Federal Trade Commission's Green Guides explain how environmental marketing can mislead and why claims need support. They are a U.S. marketing reference, not a certification for any product, and rules in other places can differ.</p>
    <h3>Start with what the claim actually covers</h3>
    <p>Look for the subject of the sentence. Is “recycled” describing the bottle, its lid, a paper sleeve, or the shipping box? Is a percentage given? A precise claim makes it easier to understand what has changed. It also helps you avoid assuming that a fact about one component applies to the whole item.</p>
    <p>For example, a statement about recycled content should make clear which material or part it covers. A statement about packaging should not quietly become a statement about the product inside. If that distinction is missing, ask the seller for clarification rather than filling in the gaps yourself.</p>
    <h3>Recyclable is not the same as recycled</h3>
    <p>Recycled content describes material that has already been recovered and used again. Recyclability concerns what may happen after you are finished with an item. Those are different claims. A product can contain recycled material without being accepted by the collection service where you live.</p>
    <p>Before putting something in a recycling bin, check current guidance from your local collection provider. The answer may depend on the material, its form, separate components, and whether special drop-off is required. A familiar symbol alone does not establish that your local program can handle the item.</p>
    <h3>Read the conditions, not just the headline</h3>
    <p>A claim about compostability may depend on specific facilities and conditions. It should not be read as permission to leave an item outdoors or put it into any garden compost pile. Likewise, “reusable” describes the possibility of repeated use; it does not by itself prove a lower environmental impact than every alternative.</p>
    <p>Manufacturing, transport, cleaning, use, and disposal all help shape a product's footprint. Be cautious about a simple savings number if the assumptions are not available. Ask what the comparison includes, what it leaves out, and whether the estimate describes the product and usage pattern relevant to you.</p>
    <h3>Ask for the evidence behind the badge</h3>
    <p>If a certification appears, check its name, what it assesses, which products it covers, and whether the listing is current. A supplier assessment, a material certification, and a whole-business certification are not interchangeable. A helpful brand should explain the scope in language you can understand.</p>
    <p>It is also reasonable for a brand to say that something is not yet verified. A clearly labeled goal is more informative than a confident statement with nothing behind it. Look for dated information and visible limits. Transparency is not a claim of perfection; it is a way to let you judge the facts.</p>
    <p>Your next purchase does not need to pass an impossible test. Start with whether you need the item and whether it works for you. Then use a few specific questions to move beyond the label. Clear answers make it easier to choose with confidence and harder for vague promises to do the choosing for you.</p>` },
  habit: { title: 'Small habits are the ones that stick.', category: 'CARE & REPEAT', image: 'hero', source: sourceCase, sourceTitle: 'Clean Water Fund: Palo Alto Unified School District case study, December 2019', body: `
    <p>You remembered the shopping list but forgot the bag. Your reusable bottle is clean, but it is still sitting beside the sink. This is ordinary life, not a personal failure. A routine has to compete with rushing out the door, changing plans, and everything else on your mind. Make it easier before you try to make it perfect.</p>
    <p>Instead of promising to change five things at once, choose one item and one repeatable moment. That might be packing a bottle after breakfast or putting a bag back by the door when the groceries are away. Treat the first week as a small experiment in what fits your day.</p>
    <h3>Give the habit a visible home</h3>
    <p>Look for the point where you usually remember too late. If the bag stays at home, keep it with something you always take out. If a cloth is inconvenient, put clean ones within reach of the relevant task and make space for used ones. Think about accessibility and the people who share that space.</p>
    <p>You do not need a special storage system. A hook, an existing drawer, or a spot beside your keys may be enough. The purpose is to reduce the number of decisions between needing something and using it. Keep the setup simple enough that another person could understand it without a long explanation.</p>
    <h3>Make cleaning part of the loop</h3>
    <p>A reusable item needs to be ready for its next use. Follow its own care instructions rather than assuming every bottle or cloth can go in the same wash. Pay attention to lids, seals, and other parts that may need separate cleaning. Let items dry as directed before putting them away.</p>
    <p>If you discover that the care routine does not suit your household, that is useful information. When a replacement is genuinely needed, consider cleaning access and maintenance alongside appearance and price. An item that is awkward for your routine may spend more time in a cupboard than in use.</p>
    <h3>Learn from a shared routine</h3>
    <p>Reuse can also involve groups rather than individual purchases. A December 2019 Clean Water Fund case study describes a Palo Alto Unified School District project that phased out seven single-use foodware items across 12 elementary schools serving more than 3,400 students.</p>
    <p>That is an example of changing a familiar setting, not a promise about every household or product. The project is unrelated to everkind. Its reported outcomes do not establish the impact of this concept collection, and its figures should not be used to calculate personal savings without an appropriate method and evidence.</p>
    <h3>Make room for the imperfect day</h3>
    <p>When you forget, look for the practical reason. Was the item still wet? Was it in another bag? Did your plans change? Adjust one part of the setup if it would help. Buying several replacements every time something is forgotten may create a new problem instead of solving the original one.</p>
    <p>If other people share the routine, ask what would make it easier for them. A household system works best when it reflects actual needs, including mobility, time, and available space. A choice that is simple for one person may be inconvenient for another. There is room for different approaches.</p>
    <p>Start small this evening. Clean one item according to its instructions, let it dry, and put it where tomorrow's version of you will find it. Repeat when it works. Adjust when it does not. The point is not to prove that you are good at sustainable living. It is to give useful things a useful place in your life.</p>` }
};
const info = {
  story: { label: 'OUR STORY, HONESTLY', title: 'A considered beginning.', body: `<p>Everkind is a working brand concept for useful household essentials and a more considered everyday. Its starting question is simple: what will you actually use, care for, and keep?</p><p>We have not invented a founder, a factory visit, or a dramatic origin story. The real founder's experience belongs here when it is available and approved. For now, this website demonstrates the experience and values the brand could bring to life.</p><h3>Useful before fashionable</h3><p>The collection focuses on ordinary routines: carrying a drink, bringing home groceries, and cleaning up. A good choice should work in your hands and your home, not just look good on a screen.</p><h3>Evidence before broad promises</h3><p>Product specifications, supplier documentation, testing, and any certifications need verification before a commercial launch. Where that evidence is missing, we say so.</p><h3>Progress with clear boundaries</h3><p>Future commitments should name an owner, a target date, and a measurable outcome. Until those decisions are made, this site does not claim completed environmental or labor improvements.</p>` },
  materials: { label: 'MATERIALS & MAKING', title: 'The details matter.', body: `<p>This is a concept collection. Product images are generated illustrations, dimensions and prices are examples, and intended materials are not verified composition claims.</p><h3>What needs verification before launch</h3><ul><li>Exact material composition for each component and packaging item.</li><li>Supplier and manufacturing locations, with permission to disclose them.</li><li>Product safety, performance, cleaning, and durability tests relevant to intended use.</li><li>Certification names, current records, and the exact products they cover.</li><li>Any assessment supporting claims about working conditions or ethical production.</li><li>Local end-of-life options and any environmental comparison's methods and assumptions.</li></ul><h3>What we are not claiming</h3><p>We do not currently claim that these concepts are certified, carbon neutral, plastic free, fully recyclable, or lower impact by a particular percentage. Repeated use, care, and local disposal systems affect outcomes.</p><p>For background on environmental marketing, see the <a href="${sourceFtc}" target="_blank" rel="noopener noreferrer">FTC Green Guides</a>. These guides are not a certification of everkind products.</p>` },
  reviews: { label: 'OUR COMMUNITY', title: 'Honesty belongs here.', body: `<p>There are no customer reviews for this concept collection yet. We have deliberately left out invented names, star ratings, and quotations.</p><h3>Our review standard</h3><p>Future reviews should come from real experiences. A “verified purchase” label should only appear where a transaction has actually been checked. Gifted items and incentives must be disclosed, and rewards should never depend on a positive rating.</p><p>Useful reviews describe fit, everyday use, care, and what could be improved. They should not be treated as proof of environmental performance that a customer cannot verify.</p><h3>A wider story</h3><p>The school reuse case study on this site is attributed to Clean Water Fund. It is an external example, not a customer endorsement, brand partnership, or statement about this collection's impact.</p>` },
  shipping: { label: 'BEFORE YOU BUY', title: 'No surprises at checkout.', body: `<p>This concept store is not accepting orders. Prices are illustrative USD amounts; delivery costs, taxes, inventory, and return policies have not been configured.</p><h3>For a commercial launch</h3><p>Shipping regions, dispatch times, delivery estimates, total costs, return eligibility, refund timing, and the business's contact details should be clearly available before payment.</p><p>Your bag here is a device-local preview. It does not reserve stock, submit an order, or charge a card. You can adjust quantities or clear the bag at any time.</p>` },
  contact: { label: 'SAY HELLO', title: 'Good questions are welcome.', body: `<p>This is a concept website, and the brand's real support email, business address, support hours, and social profiles have not been supplied yet. We will not direct you to a made-up address or collect a message that cannot be delivered.</p><h3>Looking for an answer?</h3><p>Explore the questions on the homepage, product details, and transparency notes. They explain what is illustrative, what is known, and what needs verification before launch.</p><h3>Before the brand goes live</h3><p>This contact area needs a verified support channel, a realistic response-time commitment, any required business details, and links to active social accounts. An accessibility feedback route should be available through the same support channel.</p><p>No message or email address is collected by this preview.</p>` },
  privacy: { label: 'YOUR PRIVACY', title: 'Simple and transparent.', body: `<p>This concept website does not collect contact messages, newsletter subscriptions, payment information, or account details. It does not include analytics or advertising scripts.</p><h3>Your shopping bag</h3><p>The bag stores product identifiers and quantities in your browser's local storage so they remain after a reload on this device. Nothing is submitted as an order. Clear the bag below or use your browser settings to remove this local data.</p><h3>External services</h3><p>The page requests fonts from Google Fonts, which receives technical request information such as your IP address. Hosting may also process standard request logs. External source links open third-party websites with their own privacy practices.</p><p>A commercial launch needs a privacy notice reflecting its actual business, jurisdiction, checkout provider, and support processes.</p><button class="button button-dark" id="clear-bag">Clear saved bag</button>` }
};
const detailDialog = document.querySelector('#detail-dialog');
const detailContent = document.querySelector('#detail-content');
const cartDialog = document.querySelector('#cart-dialog');
let cart = {};
try {
  const stored = JSON.parse(localStorage.getItem('everkind-bag') || '{}');
  if (stored && typeof stored === 'object' && !Array.isArray(stored)) {
    for (const id of Object.keys(products)) if (Number.isInteger(stored[id]) && stored[id] > 0 && stored[id] <= 99) cart[id] = stored[id];
  }
} catch {}
const money = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
const icon = name => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
let toastTimer;
function notify(message) {
  const toast = document.querySelector('#toast');
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 3000);
}
function updateCart() {
  try { localStorage.setItem('everkind-bag', JSON.stringify(cart)); } catch {}
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  document.querySelector('#cart-count').textContent = count;
  document.querySelector('#bag-title-count').textContent = count ? `(${count})` : '';
  document.querySelector('#open-cart').setAttribute('aria-label', `Open shopping bag, ${count} ${count === 1 ? 'item' : 'items'}`);
  const items = document.querySelector('#cart-items');
  const summary = document.querySelector('#cart-summary');
  if (!count) {
    items.innerHTML = `<div class="cart-empty"><svg class="feature-icon" aria-hidden="true"><use href="#i-bag"/></svg><h3>A thoughtful beginning.</h3><p>Your bag is empty. Start with something you need, not everything at once.</p><button class="button button-dark" data-shop>Explore the essentials ${icon('arrow')}</button></div>`;
    summary.hidden = true;
    return;
  }
  summary.hidden = false;
  items.innerHTML = Object.entries(cart).map(([id, quantity]) => {
    const p = products[id];
    return `<article class="cart-item"><img src="/assets/${p.image}.png" alt="${p.name}"><div><h3>${p.name}</h3><p class="cart-item-price">${money(p.price)} each</p><div class="cart-item-bottom"><div class="quantity-controls"><button data-quantity="${id}" data-delta="-1" aria-label="Decrease ${p.name} quantity">−</button><span aria-label="Quantity">${quantity}</span><button data-quantity="${id}" data-delta="1" aria-label="Increase ${p.name} quantity" ${quantity >= 99 ? 'disabled' : ''}>+</button></div><button class="remove-item" data-remove="${id}" aria-label="Remove ${p.name}">Remove</button></div></div></article>`;
  }).join('');
  const subtotal = Object.entries(cart).reduce((sum, [id, count]) => sum + products[id].price * count, 0);
  summary.innerHTML = `<div class="subtotal-row"><span>Sample subtotal</span><strong>${money(subtotal)}</strong></div><p>Concept storefront · USD sample prices. Shipping and taxes are not calculated. No payment or order will be taken.</p><button class="button button-dark" id="checkout-info">Review this concept bag ${icon('arrow')}</button>`;
}
function addItem(id) {
  if (!Object.hasOwn(products, id)) return;
  if ((cart[id] || 0) >= 99) { notify('The preview supports up to 99 of each item.'); return; }
  cart[id] = (cart[id] || 0) + 1;
  updateCart();
  notify(`${products[id].name} added to your bag`);
}
function openDetail(html) {
  if (cartDialog.open) cartDialog.close();
  detailContent.innerHTML = html;
  detailDialog.setAttribute('aria-labelledby', 'detail-title');
  if (!detailDialog.open) detailDialog.showModal();
  detailDialog.scrollTop = 0;
}
function openProduct(id) {
  const p = products[id];
  if (!p) return;
  openDetail(`<div class="product-detail"><div class="product-detail-image"><img src="/assets/${p.image}.png" alt="${p.name}"></div><div class="product-detail-content"><p class="eyebrow">THE CONCEPT COLLECTION</p><h2 id="detail-title">${p.name}</h2><p class="detail-price">${money(p.price)} <small>USD · sample price</small></p><p class="detail-description">${p.description}</p><ul class="detail-specs">${p.specs.map(([label, value]) => `<li><span>${label}</span><strong>${value}</strong></li>`).join('')}</ul><button class="button button-dark detail-add" data-add="${id}">Add to bag ${icon('plus')}</button><p class="concept-disclaimer">Illustrative product and generated image. Final materials, safety, care instructions, and sourcing are not verified. This preview does not accept orders.</p></div></div>`);
}
function openArticle(id) {
  const a = articles[id];
  if (!a) return;
  openDetail(`<article class="article-view"><p class="eyebrow">${a.category} · 5 MIN READ</p><h2 id="detail-title">${a.title}</h2><img class="article-hero" src="/assets/${a.image}.png" alt="Everyday essentials, thoughtfully considered"><div class="article-body">${a.body}</div><div class="article-source">By the everkind concept editorial team · Reviewed September 27, 2026<br>Background source: <a href="${a.source}" target="_blank" rel="noopener noreferrer">${a.sourceTitle}</a>. General education, not evidence of this collection's environmental performance.</div><button class="button button-dark" data-shop>Explore thoughtfully ${icon('arrow')}</button></article>`);
}
function openInfo(id) {
  const page = info[id];
  if (!page) return;
  openDetail(`<article class="info-view"><p class="eyebrow">${page.label}</p><h2 id="detail-title">${page.title}</h2>${page.body}</article>`);
}
function goShop() {
  document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
  document.querySelector('#shop').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
}
document.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.hasAttribute('data-product')) openProduct(button.dataset.product);
  if (button.hasAttribute('data-add')) addItem(button.dataset.add);
  if (button.hasAttribute('data-article')) openArticle(button.dataset.article);
  if (button.hasAttribute('data-info')) openInfo(button.dataset.info);
  if (button.hasAttribute('data-close')) button.closest('dialog').close();
  if (button.hasAttribute('data-shop')) goShop();
  if (button.hasAttribute('data-filter')) {
    document.querySelectorAll('.filter').forEach(filter => {
      const active = filter === button;
      filter.classList.toggle('active', active);
      filter.setAttribute('aria-pressed', String(active));
    });
    document.querySelectorAll('.product-card').forEach(card => { card.hidden = button.dataset.filter !== 'all' && card.dataset.category !== button.dataset.filter; });
  }
  if (button.hasAttribute('data-quantity')) {
    const id = button.dataset.quantity;
    if (!Object.hasOwn(cart, id)) return;
    const delta = Number(button.dataset.delta);
    cart[id] = Math.max(0, Math.min(99, cart[id] + delta));
    if (cart[id] === 0) delete cart[id];
    updateCart();
    const next = document.querySelector(`[data-quantity="${id}"][data-delta="${delta}"]`);
    (next || document.querySelector('#cart-dialog [data-close]')).focus();
  }
  if (button.hasAttribute('data-remove')) {
    delete cart[button.dataset.remove];
    updateCart();
    document.querySelector('#cart-dialog [data-close]').focus();
  }
  if (button.id === 'open-cart') { updateCart(); cartDialog.showModal(); }
  if (button.id === 'checkout-info') {
    openDetail(`<article class="info-view"><p class="eyebrow">YOUR CONCEPT BAG</p><h2 id="detail-title">Good choices, no checkout.</h2><p>You have explored the collection and built a sample bag. This storefront is a brand concept, so no order has been placed and no payment is required.</p><p>Your selection stays in this browser for your next visit. Real checkout, confirmed stock, shipping, taxes, and returns can be connected once the business details and payment provider are ready.</p><button class="button button-dark" data-shop>Keep exploring ${icon('arrow')}</button></article>`);
  }
  if (button.id === 'clear-bag') { cart = {}; updateCart(); notify('Your saved bag has been cleared.'); }
});
for (const dialog of document.querySelectorAll('dialog')) {
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
}
const menuToggle = document.querySelector('#menu-toggle');
const mobileNav = document.querySelector('#mobile-nav');
function closeMenu() { mobileNav.hidden = true; menuToggle.setAttribute('aria-expanded', 'false'); menuToggle.setAttribute('aria-label', 'Open navigation'); }
menuToggle.addEventListener('click', () => {
  const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
  mobileNav.hidden = expanded;
  menuToggle.setAttribute('aria-expanded', String(!expanded));
  menuToggle.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
});
mobileNav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !mobileNav.hidden) { closeMenu(); menuToggle.focus(); } });
matchMedia('(min-width: 761px)').addEventListener('change', event => { if (event.matches) closeMenu(); });
updateCart();
