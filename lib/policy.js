// Deterministic policy engine. The LLM proposes; this code decides. No model output can change a mandate.
const INJECTION = /(ignore (all|your|previous|the)|system\s*(override|:)|raise (the|your) limit|new limit|increase (the )?budget|disregard|you are now)/i;
export const looksLikeInjection = (t) => INJECTION.test(String(t || ''));

export function makeMandate({ item, maxTotal, askAbove, ttlMinutes = 30 }) {
  maxTotal = Number(maxTotal); askAbove = Number(askAbove);
  if (!item || !(maxTotal > 0)) throw new Error('Mandate needs an item and a positive max total.');
  if (!(askAbove > 0 && askAbove <= maxTotal)) throw new Error('"Ask me above" must be between 0 and the max total.');
  return Object.freeze({ item: String(item).slice(0, 80), maxTotal, askAbove, expiresAt: Date.now() + ttlMinutes * 60000 });
}

export function checkOffer(mandate, price, now = Date.now()) {
  const violations = [];
  if (!Number.isFinite(price) || price <= 0) violations.push('invalid_price');
  if (price > mandate.maxTotal) violations.push(`exceeds_max_total_${mandate.maxTotal}`);
  if (now > mandate.expiresAt) violations.push('mandate_expired');
  return { allowed: violations.length === 0, violations, needsApproval: price > mandate.askAbove };
}
