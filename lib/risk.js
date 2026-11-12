// TrustLayer pre-deal risk check: deterministic signals + a plain-language explanation (LLM when available).
import { BENCHMARK } from './sellers.js';
import { askJSON, llmEnabled } from './llm.js';
const PRESSURE = /(only today|last one|act now|hurry|wire transfer|outside paypal|gift card|western union)/i;

export async function scoreRisk(seller, item) {
  const signals = [];
  const bench = BENCHMARK[item.toLowerCase()] || BENCHMARK['standing desk'];
  const ratio = seller.listPrice / bench;
  if (ratio < 0.5) signals.push({ name: 'price_far_below_market', points: 45, detail: `Listed at ${Math.round(ratio * 100)}% of the $${bench} market price` });
  else if (ratio < 0.75) signals.push({ name: 'price_below_market', points: 15, detail: `Listed at ${Math.round(ratio * 100)}% of market price` });
  if (seller.accountAgeDays < 14) signals.push({ name: 'new_account', points: 25, detail: `Account is ${seller.accountAgeDays} days old` });
  else if (seller.accountAgeDays < 60) signals.push({ name: 'young_account', points: 10, detail: `Account is ${seller.accountAgeDays} days old` });
  if (seller.stockPhotos) signals.push({ name: 'stock_photos', points: 15, detail: 'Listing photos match stock imagery' });
  if (PRESSURE.test(seller.description)) signals.push({ name: 'pressure_or_off_platform', points: 15, detail: 'Urgency or off-platform payment language' });

  const score = Math.min(100, signals.reduce((a, s) => a + s.points, 0));
  const level = score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low';
  let explanation = signals.length
    ? `Risk ${score}/100. ` + signals.map((s) => s.detail).join('; ') + '.'
    : `Risk ${score}/100. No warning signs found in price, account age, photos or wording.`;
  if (llmEnabled) {
    try {
      const r = await askJSON('You explain marketplace risk to a non-expert in 2 short sentences. Use only the given signals. JSON: {"explanation": string}', JSON.stringify({ seller: seller.name, score, level, signals }));
      if (r.explanation) explanation = r.explanation;
    } catch {}
  }
  return { score, level, blocked: level === 'high', signals, explanation };
}
