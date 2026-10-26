// GET /api/foods?q=chicken+breast    search foods
// GET /api/foods?barcode=9400...     one packaged product by barcode
// GET /api/foods?usda=173944         the serving sizes for one USDA food (1 large banana = 136 g, and so on)
// Two free food databases, so there is nothing to type in by hand:
//   USDA FoodData Central (US government, public domain)  everyday foods, with some packaged ones (key: USDA_API_KEY, kept here and never sent to the page)
//   Open Food Facts (open data, ODbL licence)             packaged products with barcodes. New Zealand products are asked for first and listed first.
// Every food comes back in one shape: { id, source, generic, name, brand, per100: {kcal, protein, carbs, fat, fibre, sugar, sodium_mg}, serving: {label, grams} | null, nz }
// with the nutrients per 100 g, so the page works out any amount from them.
const USDA = 'https://api.nal.usda.gov/fdc/v1';
const OFF_SEARCH = 'https://search.openfoodfacts.org/search';
const OFF_PRODUCT = 'https://world.openfoodfacts.org/api/v2/product';
const OFF_FIELDS = 'code,product_name,brands,nutriments,serving_size,serving_quantity,quantity,countries_tags';
const UA = 'BoxingFlow/1.0 (boxing training app; contact via the site)';

const n = (v) => (v == null || v === '' || isNaN(+v) ? null : +v);
const r1 = (v) => (v == null ? null : Math.max(0, Math.round(v * 10) / 10));   // never negative (USDA's carbs-by-difference can dip just below zero)
const title = (s) => (s && s === s.toUpperCase() && /[A-Z]{3}/.test(s) ? s.toLowerCase().replace(/(^|[\s(\/-])([a-z])/g, (m, a, b) => a + b.toUpperCase()) : s);
const tidy = (per100) => Object.fromEntries(Object.entries(per100).map(([k, v]) => [k, r1(v)]));
// the ways to pick an amount read plainly: "1 medium (118 g)", not "1 medium (7" to 7-7/8" long) (118 g)"
const tidyLabel = (s) => String(s).replace(/\s*\([^)]*["″][^)]*\)/g, '').replace(/\s+/g, ' ').trim();
// a whole pack as grams, from "500 g", "1 L", "330ml", "6 x 100 g" or "10 OZ (283 g)" (a millilitre counts as a gram)
function packOf(q) {
  if (!q) return null;
  const s = String(q).toLowerCase().replace(/,/g, '.'), paren = s.match(/\((\d+(?:\.\d+)?)\s*g\)/);
  let g = paren ? +paren[1] : null;
  if (g == null) {
    const m = s.match(/(?:(\d+)\s*[x×]\s*)?(\d+(?:\.\d+)?)\s*(kg|g|ml|cl|l|oz)\b/); if (!m) return null;
    g = (m[1] ? +m[1] : 1) * +m[2] * { kg: 1000, g: 1, ml: 1, cl: 10, l: 1000, oz: 28.3495 }[m[3]];
  }
  return g >= 5 && g <= 5000 ? { label: `Whole pack (${Math.round(g)} g)`, grams: Math.round(g * 10) / 10 } : null;
}

async function getJson(url, ms = 8000) {
  const res = await fetch(url, { headers: { 'user-agent': UA, accept: 'application/json' }, signal: AbortSignal.timeout(ms) });
  if (!res.ok) throw new Error(`${res.status} ${url.split('?')[0]}`);
  return res.json();
}

/* ---------- New Zealand words the US database calls something else: "mince" finds ground beef, "kumara" finds sweet potato ---------- */
const NZ_TERMS = [['mince', 'ground beef'], ['kumara', 'sweet potato'], ['capsicum', 'bell pepper'], ['courgette', 'zucchini'], ['coriander', 'cilantro'], ['rocket', 'arugula'],
  ['prawns', 'shrimp'], ['prawn', 'shrimp'], ['biscuits', 'cookies'], ['biscuit', 'cookie'], ['crisps', 'potato chips'], ['silverbeet', 'swiss chard'], ['spring onion', 'scallion'],
  ['beetroot', 'beets'], ['yoghurt', 'yogurt'], ['porridge', 'oatmeal'], ['lollies', 'candy'], ['sultanas', 'raisins'], ['tomato sauce', 'ketchup'], ['cos lettuce', 'romaine lettuce'],
  ['muesli', 'granola'], ['aubergine', 'eggplant'], ['rockmelon', 'cantaloupe']];
function usdaTerm(q) {
  let out = q.toLowerCase();
  for (const [nz, us] of NZ_TERMS) out = out.replace(new RegExp('\\b' + nz + '\\b', 'g'), us);
  return out;
}
// the best matches first: every search word in the name, a name that starts with the first word, then the shorter name (usually the plainer food)
function rank(items, q) {
  const words = q.split(/\s+/).filter(Boolean);
  const unusual = /\b(dried|dehydrated|powder|formulated|imitation|babyfood|baby food|substitute)\b/;   // plain food first: "egg, whole, raw" before "egg, yolk, dried"
  const score = (i) => { const nm = i.name.toLowerCase(); return [-words.filter((w) => nm.includes(w)).length, unusual.test(nm) ? 1 : 0, nm.startsWith(words[0]) ? 0 : 1, nm.length]; };
  return items.sort((a, b) => { const x = score(a), y = score(b); return x[0] - y[0] || x[1] - y[1] || x[2] - y[2] || x[3] - y[3]; });
}

/* ---------- USDA ---------- */
const NUT = { kcal: [1008, 2047, 2048], protein: [1003], fat: [1004], carbs: [1005], fibre: [1079], sugar: [2000, 1063], sodium_mg: [1093] };
function usdaPer100(list) {
  const by = new Map((list || []).map((x) => [x.nutrientId ?? x.nutrient?.id, x.value ?? x.amount]));
  const pick = (ids) => { for (const id of ids) if (by.get(id) != null) return n(by.get(id)); return null; };
  return { kcal: pick(NUT.kcal), protein: pick(NUT.protein), carbs: pick(NUT.carbs), fat: pick(NUT.fat), fibre: pick(NUT.fibre), sugar: pick(NUT.sugar), sodium_mg: pick(NUT.sodium_mg) };
}
function usdaItem(f) {
  const per100 = usdaPer100(f.foodNutrients);
  if (per100.kcal == null && per100.protein == null && per100.carbs == null && per100.fat == null) return null;
  per100.kcal ??= Math.round((per100.protein || 0) * 4 + (per100.carbs || 0) * 4 + (per100.fat || 0) * 9);
  const branded = f.dataType === 'Branded', size = n(f.servingSize), unit = (f.servingSizeUnit || '').toLowerCase();
  const house = f.householdServingFullText && !/^none$/i.test(f.householdServingFullText) ? tidyLabel(title(f.householdServingFullText)) : '1 serving';
  return {
    id: 'usda:' + f.fdcId, source: 'usda', generic: !branded, name: title(f.description || ''), brand: branded ? title(f.brandName || f.brandOwner || '') : '',
    per100: tidy(per100),
    serving: branded && size && (unit === 'g' || unit === 'ml') ? { label: `${house} (${Math.round(size * 10) / 10} ${unit})`, grams: Math.round(size * 10) / 10 } : null,
    pack: branded ? packOf(f.packageWeight) : null,
    nz: false,
  };
}
async function usdaSearch(q) {
  const key = process.env.USDA_API_KEY; if (!key) return [];
  const term = usdaTerm(q);
  // everyday foods and packaged foods are searched separately, or the many packaged ones would crowd out plain ones like "beef, ground, raw"
  const ask = (types, size) => getJson(`${USDA}/foods/search?api_key=${key}&query=${encodeURIComponent(term)}&pageSize=${size}&dataType=${types}`).then((j) => (j.foods || []).map(usdaItem).filter(Boolean));
  const [generic, branded] = await Promise.allSettled([ask('Foundation,SR%20Legacy', 25), ask('Branded', 15)]);
  if (generic.status === 'rejected' && branded.status === 'rejected') throw generic.reason;
  return [...rank(generic.status === 'fulfilled' ? generic.value : [], term), ...(branded.status === 'fulfilled' ? branded.value : [])];
}
async function usdaPortions(id) {
  const key = process.env.USDA_API_KEY; if (!key) return [];
  const j = await getJson(`${USDA}/food/${id}?api_key=${key}`);
  const out = [];
  for (const p of j.foodPortions || []) {
    const g = n(p.gramWeight); if (!g) continue;
    const unit = p.measureUnit?.name && p.measureUnit.name !== 'undetermined' ? p.measureUnit.name : '';
    const label = p.portionDescription && p.portionDescription !== 'Quantity not specified' ? p.portionDescription : `${p.amount || 1} ${unit} ${p.modifier || ''}`.replace(/\s+/g, ' ').trim();
    if (label) out.push({ label: `${tidyLabel(label)} (${Math.round(g)} g)`, grams: g });
  }
  if (j.servingSize && (j.servingSizeUnit || '').toLowerCase() === 'g') out.unshift({ label: `${j.householdServingFullText || '1 serving'} (${j.servingSize} g)`, grams: +j.servingSize });
  const seen = new Set();
  return out.filter((s) => (seen.has(s.grams + s.label) ? false : seen.add(s.grams + s.label))).slice(0, 12);
}

/* ---------- Open Food Facts ---------- */
function offItem(p) {
  const m = p.nutriments || {};
  let kcal = n(m['energy-kcal_100g']); if (kcal == null && n(m['energy_100g']) != null) kcal = n(m['energy_100g']) / 4.184;   // some products only list kilojoules
  const per100 = { kcal, protein: n(m['proteins_100g']), carbs: n(m['carbohydrates_100g']), fat: n(m['fat_100g']), fibre: n(m['fiber_100g']), sugar: n(m['sugars_100g']), sodium_mg: n(m['sodium_100g']) != null ? n(m['sodium_100g']) * 1000 : null };
  if (!p.product_name || (per100.kcal == null && per100.protein == null && per100.carbs == null && per100.fat == null)) return null;
  per100.kcal ??= Math.round((per100.protein || 0) * 4 + (per100.carbs || 0) * 4 + (per100.fat || 0) * 9);
  const sg = n(p.serving_quantity), brands = Array.isArray(p.brands) ? p.brands.join(',') : p.brands || '';
  return {
    id: 'off:' + p.code, source: 'off', generic: false, name: String(p.product_name).trim(), brand: brands.split(',')[0].trim(),
    per100: tidy(per100),
    serving: sg ? { label: `${p.serving_size || '1 serving'}`.replace(/\s+/g, ' ').trim(), grams: sg } : null,
    pack: packOf(p.quantity),
    nz: (p.countries_tags || []).includes('en:new-zealand'),
  };
}
async function offQuery(q, nzOnly, size) {
  const query = nzOnly ? `${q} countries_tags:"en:new-zealand"` : q;
  const j = await getJson(`${OFF_SEARCH}?q=${encodeURIComponent(query)}&page_size=${size}&langs=en&fields=${OFF_FIELDS}`, 9000);
  return (j.hits || []).map(offItem).filter(Boolean);
}
// New Zealand products are asked for on their own, so they are always found and listed first
async function offSearch(q) {
  const [nz, any] = await Promise.allSettled([offQuery(q, true, 10), offQuery(q, false, 10)]);
  if (nz.status === 'rejected' && any.status === 'rejected') throw nz.reason;
  const seen = new Set();
  return [...(nz.status === 'fulfilled' ? nz.value : []), ...(any.status === 'fulfilled' ? any.value : [])]
    .filter((x) => (seen.has(x.id) ? false : seen.add(x.id))).sort((a, b) => b.nz - a.nz);
}
async function offBarcode(code) {
  const j = await getJson(`${OFF_PRODUCT}/${code}.json?fields=${OFF_FIELDS}`, 9000);
  return j.status === 1 && j.product ? offItem({ ...j.product, code }) : null;
}

const json = (body, cache) => new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json', 'cache-control': cache || 'no-store' } });
const fail = (status, error) => new Response(JSON.stringify({ error }), { status, headers: { 'content-type': 'application/json' } });

export default async (req) => {
  const u = new URL(req.url), q = (u.searchParams.get('q') || '').trim().slice(0, 80), barcode = u.searchParams.get('barcode'), usda = u.searchParams.get('usda');
  try {
    if (barcode) {
      if (!/^\d{8,14}$/.test(barcode)) return fail(400, 'That doesn\'t look like a barcode.');
      return json({ item: await offBarcode(barcode).catch(() => null) }, 'public, max-age=3600, s-maxage=86400');
    }
    if (usda) {
      if (!/^\d{3,9}$/.test(usda)) return fail(400, 'Bad food id.');
      return json({ servings: await usdaPortions(usda).catch(() => []) }, 'public, max-age=3600, s-maxage=604800');
    }
    if (q.length < 2) return json({ items: [] });
    // both databases at once; if one is down or slow the other still answers, and the page is told that part of the search failed
    const [u1, o1] = await Promise.allSettled([usdaSearch(q), offSearch(q)]);
    for (const [name, r] of [['usda', u1], ['openfoodfacts', o1]]) if (r.status === 'rejected') console.error('foods search failed:', name, String(r.reason));
    const us = u1.status === 'fulfilled' ? u1.value : [], off = o1.status === 'fulfilled' ? o1.value : [];
    const seen = new Set(), items = [
      ...us.filter((x) => x.generic).slice(0, 7),
      ...off.filter((x) => x.nz).slice(0, 8),
      ...us.filter((x) => !x.generic).slice(0, 5),
      ...off.filter((x) => !x.nz).slice(0, 5),
    ].filter((x) => (seen.has(x.id) ? false : seen.add(x.id)));
    const mapped = usdaTerm(q) !== q.toLowerCase() ? usdaTerm(q) : '';
    const partial = u1.status === 'rejected' || o1.status === 'rejected';
    return json({ items, partial, searchedAs: mapped }, partial ? 'no-store' : 'public, max-age=300, s-maxage=86400');
  } catch (e) {
    console.error('foods', e);
    return fail(502, 'The food database isn\'t answering. Try again in a moment.');
  }
};

export const config = { path: '/api/foods' };
