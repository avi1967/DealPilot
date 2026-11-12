import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

let reply = {}; let sawImage = false;
const srv = http.createServer((q, r) => { let b = ''; q.on('data', (d) => (b += d)).on('end', () => {
  const j = JSON.parse(b); const u = j.messages.at(-1).content;
  if (Array.isArray(u) && u.some((p) => p.type === 'image_url' && p.image_url.url.startsWith('data:image/jpeg;base64,'))) { sawImage = true; reply = global.__vision; } else reply = { verdict: 'release', reasoning: 'ok' };
  r.setHeader('content-type', 'application/json'); r.end(JSON.stringify({ choices: [{ message: { content: JSON.stringify(reply) } }] })); }); });
await new Promise((ok) => srv.listen(4020, ok));
process.env.LLM_BASE_URL = 'http://localhost:4020/v1'; process.env.LLM_API_KEY = 'x'; process.env.LLM_MODEL = 'm';
const { mediate } = await import('../lib/mediator.js');
const { SELLERS } = await import('../lib/sellers.js');
const deal = { mandate: { item: 'standing desk' }, seller: SELLERS[0] };
const img = { mime: 'image/jpeg', base64: 'AAAA' };

test('real-looking photo + real tracking -> release', async () => {
  global.__vision = { showsItemOrPackage: true, looksLikeStockOrCatalogImage: false, confidence: 0.9, notes: 'Parcel on a doorstep.' };
  const m = await mediate(deal, SELLERS[0].evidence, img);
  assert.ok(sawImage); assert.equal(m.verdict, 'release'); assert.match(m.photoSource, /vision/);
});
test('stock photo + real tracking -> escalate, never release', async () => {
  global.__vision = { showsItemOrPackage: true, looksLikeStockOrCatalogImage: true, confidence: 0.95, notes: 'Studio render.' };
  assert.equal((await mediate(deal, SELLERS[0].evidence, img)).verdict, 'escalate');
});
test('low confidence is not enough', async () => {
  global.__vision = { showsItemOrPackage: true, looksLikeStockOrCatalogImage: false, confidence: 0.3, notes: 'Blurry.' };
  assert.equal((await mediate(deal, SELLERS[0].evidence, img)).verdict, 'escalate');
});
test.after(() => srv.close());
