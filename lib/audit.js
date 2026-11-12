// Append-only, hash-chained audit log. Editing any past entry breaks every later hash.
import crypto from 'node:crypto';
import fs from 'node:fs';
const FILE = 'data/audit.json';
let chain = [];
try { chain = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch {}

const digest = (prev, e) =>
  crypto.createHash('sha256').update(prev + JSON.stringify([e.seq, e.ts, e.dealId, e.type, e.detail])).digest('hex');

export function log(dealId, type, detail = {}) {
  const prev = chain.length ? chain[chain.length - 1].hash : 'GENESIS';
  const e = { seq: chain.length + 1, ts: new Date().toISOString(), dealId, type, detail, prev };
  e.hash = digest(prev, e);
  chain.push(e);
  try { fs.mkdirSync('data', { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(chain)); } catch {}
  return e;
}
export const all = () => chain;
export function verify(entries = chain) {
  let prev = 'GENESIS';
  for (const e of entries) {
    if (e.prev !== prev || e.hash !== digest(prev, e)) return { ok: false, brokenAt: e.seq };
    prev = e.hash;
  }
  return { ok: true, length: entries.length };
}
