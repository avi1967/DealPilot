// One JSON-in/JSON-out helper. Works with any OpenAI-compatible chat API (Gemini, Groq, OpenRouter, ...)
// when LLM_BASE_URL is set; otherwise falls back to the Anthropic Messages API.
const BASE_URL = process.env.LLM_BASE_URL;
const KEY = process.env.LLM_API_KEY || process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.LLM_MODEL || process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';
export const llmEnabled = Boolean(KEY);
export const llmLabel = MODEL;

async function post(url, headers, body, tries = 4) {
  for (let i = 0; i < tries; i++) {
    const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });
    if (r.status === 429 || r.status >= 500) { await new Promise((ok) => setTimeout(ok, 2500 * (i + 1))); continue; } // free tiers rate-limit: back off and retry
    if (!r.ok) throw new Error(`LLM ${r.status}: ${await r.text()}`);
    return r.json();
  }
  throw new Error('LLM is rate-limited or unavailable. Wait a minute and try again.');
}

export async function askJSON(system, user, image) { // image: { mime, base64 } (optional)
  const sys = system + '\nRespond with ONLY one JSON object. No prose, no code fences.';
  let text = '';
  if (BASE_URL) {
    const body = { model: MODEL, max_tokens: 2000, temperature: 0.3, messages: [{ role: 'system', content: sys }, { role: 'user', content: image ? [{ type: 'text', text: user }, { type: 'image_url', image_url: { url: `data:${image.mime};base64,${image.base64}` } }] : user }] };
    if (process.env.LLM_REASONING_EFFORT) body.reasoning_effort = process.env.LLM_REASONING_EFFORT;
    const d = await post(`${BASE_URL.replace(/\/$/, '')}/chat/completions`, { Authorization: `Bearer ${KEY}` }, body);
    text = d.choices?.[0]?.message?.content || '';
  } else {
    const d = await post('https://api.anthropic.com/v1/messages', { 'x-api-key': KEY, 'anthropic-version': '2023-06-01' },
      { model: MODEL, max_tokens: 500, system: sys, messages: [{ role: 'user', content: image ? [{ type: 'image', source: { type: 'base64', media_type: image.mime, data: image.base64 } }, { type: 'text', text: user }] : user }] });
    text = d.content.filter((c) => c.type === 'text').map((c) => c.text).join('');
  }
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('LLM returned no JSON');
  return JSON.parse(m[0]);
}
