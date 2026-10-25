// Stage 2b: the food search function, tested against a pretend internet (no real service is called).
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

process.env.USDA_API_KEY = 'test-key';
const foods = (await import(pathToFileURL(path.resolve(import.meta.dirname, '../netlify/functions/foods.mjs')).href)).default;

const usdaFood = (id, description, dataType, nutrients, extra = {}) => ({ fdcId: id, description, dataType, foodNutrients: Object.entries(nutrients).map(([nutrientId, value]) => ({ nutrientId: +nutrientId, value })), ...extra });
const offHit = (code, name, brands, kcal, nz) => ({ code, product_name: name, brands, nutriments: { 'energy-kcal_100g': kcal, proteins_100g: 10, carbohydrates_100g: 50, fat_100g: 5 }, countries_tags: nz ? ['en:new-zealand'] : ['en:united-states'] });

// replace fetch for one test: routes[...] decide the reply for a URL that contains the text
function pretend(routes) {
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(String(url));
    for (const [match, reply] of Object.entries(routes)) if (String(url).includes(match)) {
      if (reply instanceof Error) throw reply;
      return { ok: reply.ok !== false, status: reply.status || 200, json: async () => reply.body };
    }
    throw new Error('unexpected request: ' + url);
  };
  return calls;
}
const ask = async (qs) => { const r = await foods(new Request('http://x/api/foods?' + qs)); return { status: r.status, body: await r.json(), cache: r.headers.get('cache-control') }; };

test('search merges both databases: everyday USDA foods first, then New Zealand products', async () => {
  pretend({
    'dataType=Foundation': { body: { foods: [usdaFood(1, 'Bananas, raw', 'SR Legacy', { 1008: 89, 1003: 1.1, 1005: 22.8, 1004: 0.3 })] } },
    'dataType=Branded': { body: { foods: [usdaFood(2, 'BANANA CHIPS', 'Branded', { 1008: 519, 1003: 2, 1005: 58, 1004: 34 }, { brandOwner: 'SOME BRAND', servingSize: 28, servingSizeUnit: 'g', householdServingFullText: 'None' })] } },
    'search.openfoodfacts.org': { body: { hits: [offHit('111', 'Banana Bread', 'Pams', 300, true), offHit('222', 'Banana Split', 'US Co', 250, false)] } },
  });
  const { status, body } = await ask('q=banana');
  assert.equal(status, 200); assert.equal(body.partial, false);
  const names = body.items.map((i) => i.name);
  assert.equal(names[0], 'Bananas, raw', 'everyday food comes first');
  assert.ok(names.indexOf('Banana Bread') < names.indexOf('Banana Chips'), 'New Zealand products come before packaged USDA foods');
  const chips = body.items.find((i) => i.name === 'Banana Chips');
  assert.equal(chips.brand, 'Some Brand', 'ALL CAPS brand names are tidied'); assert.equal(chips.serving.label, '1 serving (28 g)', '"None" household serving becomes "1 serving"');
  const bread = body.items.find((i) => i.id === 'off:111'); assert.equal(bread.nz, true); assert.equal(bread.per100.kcal, 300);
});

test('New Zealand words are searched as their US names, and the page is told', async () => {
  const calls = pretend({ 'api.nal.usda.gov': { body: { foods: [] } }, 'search.openfoodfacts.org': { body: { hits: [] } } });
  const { body } = await ask('q=mince');
  assert.equal(body.searchedAs, 'ground beef');
  assert.ok(calls.some((u) => u.includes('api.nal.usda.gov') && u.includes('query=ground%20beef')), 'USDA should be asked for "ground beef"');
  assert.ok(calls.some((u) => u.includes('search.openfoodfacts.org') && u.includes('q=mince')), 'Open Food Facts keeps the original word');
  const kumara = (await ask('q=kumara')).body; assert.equal(kumara.searchedAs, 'sweet potato');
  assert.equal((await ask('q=banana')).body.searchedAs, '');
});

test('plain foods rank above unusual ones, and negative carbs are clamped to zero', async () => {
  pretend({
    'dataType=Foundation': { body: { foods: [
      usdaFood(10, 'Egg, whole, dried', 'SR Legacy', { 1008: 592, 1003: 48, 1005: 1, 1004: 43 }),
      usdaFood(11, 'Egg, whole, raw, fresh', 'SR Legacy', { 1008: 143, 1003: 12.6, 1005: -0.4, 1004: 9.5 }),
    ] } },
    'dataType=Branded': { body: { foods: [] } }, 'search.openfoodfacts.org': { body: { hits: [] } },
  });
  const { body } = await ask('q=egg');
  assert.equal(body.items[0].name, 'Egg, whole, raw, fresh', 'the plain fresh egg ranks first');
  assert.equal(body.items[0].per100.carbs, 0, 'carbs of -0.4 become 0');
  assert.equal(body.items.at(-1).name, 'Egg, whole, dried');
});

test('if one database is down the other still answers and the page is told', async () => {
  pretend({ 'api.nal.usda.gov': { body: { foods: [usdaFood(5, 'Rice, white, cooked', 'SR Legacy', { 1008: 130, 1003: 2.7, 1005: 28, 1004: 0.3 })] } }, 'search.openfoodfacts.org': { ok: false, status: 503, body: {} } });
  const r = await ask('q=rice');
  assert.equal(r.status, 200); assert.equal(r.body.partial, true); assert.equal(r.body.items[0].name, 'Rice, white, cooked');
  assert.equal(r.cache, 'no-store', 'a partial answer must not be cached');
  pretend({ 'api.nal.usda.gov': new Error('network down'), 'search.openfoodfacts.org': { body: { hits: [offHit('9', 'Rice Cakes', 'Sunrice', 380, true)] } } });
  const r2 = await ask('q=rice'); assert.equal(r2.body.partial, true); assert.equal(r2.body.items[0].name, 'Rice Cakes');
});

test('a full answer is cached for a day, short searches and bad input are refused', async () => {
  pretend({ 'api.nal.usda.gov': { body: { foods: [] } }, 'search.openfoodfacts.org': { body: { hits: [] } } });
  assert.match((await ask('q=chicken')).cache, /s-maxage=86400/);
  assert.deepEqual((await ask('q=a')).body, { items: [] });
  assert.equal((await ask('barcode=abc')).status, 400);
  assert.equal((await ask('usda=../etc')).status, 400);
});

test('a barcode returns one product, or null when it is unknown', async () => {
  pretend({ 'api/v2/product/9400000000017.json': { body: { status: 1, product: { product_name: 'Weet-Bix', brands: 'Sanitarium', nutriments: { 'energy-kcal_100g': 339, proteins_100g: 11, carbohydrates_100g: 67, fat_100g: 1.3 }, serving_quantity: 30, serving_size: '2 biscuits (30 g)', countries_tags: ['en:new-zealand'] } } } });
  const { body } = await ask('barcode=9400000000017');
  assert.equal(body.item.name, 'Weet-Bix'); assert.equal(body.item.nz, true); assert.deepEqual(body.item.serving, { label: '2 biscuits (30 g)', grams: 30 });
  pretend({ 'api/v2/product/': { body: { status: 0 } } });
  assert.equal((await ask('barcode=1234567890123')).body.item, null);
});

test('serving sizes for an everyday food come from the USDA record', async () => {
  pretend({ 'api.nal.usda.gov/fdc/v1/food/173944': { body: { foodPortions: [
    { amount: 1, measureUnit: { name: 'undetermined' }, modifier: 'large (8" to 8-7/8" long)', gramWeight: 136 },
    { amount: 1, measureUnit: { name: 'cup' }, modifier: 'mashed', gramWeight: 225 },
    { amount: 1, measureUnit: { name: 'undetermined' }, modifier: 'large (8" to 8-7/8" long)', gramWeight: 136 },
  ] } } });
  const { body } = await ask('usda=173944');
  assert.deepEqual(body.servings.map((s) => s.grams), [136, 225], 'duplicates are removed');
  assert.match(body.servings[0].label, /large/);
});

test('without a USDA key the search still works from Open Food Facts', async () => {
  const key = process.env.USDA_API_KEY; delete process.env.USDA_API_KEY;
  try {
    pretend({ 'search.openfoodfacts.org': { body: { hits: [offHit('5', 'Oat Milk', 'Oatly', 45, true)] } } });
    const { body } = await ask('q=oat milk'); assert.equal(body.items[0].name, 'Oat Milk');
  } finally { process.env.USDA_API_KEY = key; }
});
