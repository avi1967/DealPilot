// PayPal Orders v2 (sandbox): AUTHORIZE reserves funds; capture releases them; void cancels.
const BASE = process.env.PAYPAL_BASE || 'https://api-m.sandbox.paypal.com';
let tok = { v: null, exp: 0 };

async function token() {
  if (tok.v && Date.now() < tok.exp) return tok.v;
  const id = process.env.PAYPAL_CLIENT_ID, sec = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !sec) throw new Error('Missing PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET (use sandbox credentials).');
  const r = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: 'Basic ' + Buffer.from(`${id}:${sec}`).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  if (!r.ok) throw new Error(`PayPal auth failed (${r.status})`);
  const d = await r.json();
  tok = { v: d.access_token, exp: Date.now() + (d.expires_in - 60) * 1000 };
  return tok.v;
}

async function pp(method, path, body) {
  const r = await fetch(BASE + path, {
    method,
    headers: { Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (r.status === 204) return {};
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`PayPal ${method} ${path} -> ${r.status}: ${d.message || d.name || 'error'} ${JSON.stringify(d.details || [])}`);
  return d;
}

export async function createAuthorizeOrder({ amount, description, ref, returnUrl, cancelUrl }) {
  const o = await pp('POST', '/v2/checkout/orders', {
    intent: 'AUTHORIZE',
    purchase_units: [{ reference_id: ref, description: description.slice(0, 120), amount: { currency_code: 'USD', value: Number(amount).toFixed(2) } }],
    payment_source: { paypal: { experience_context: { return_url: returnUrl, cancel_url: cancelUrl, user_action: 'PAY_NOW', brand_name: 'DealPilot', shipping_preference: 'NO_SHIPPING' } } },
  });
  const link = o.links.find((l) => l.rel === 'payer-action' || l.rel === 'approve');
  return { id: o.id, approveUrl: link?.href };
}
export async function authorizeOrder(orderId) {
  const o = await pp('POST', `/v2/checkout/orders/${orderId}/authorize`, {});
  const a = o.purchase_units[0].payments.authorizations[0];
  return { authId: a.id, status: a.status, expires: a.expiration_time };
}
export const capture = (authId) => pp('POST', `/v2/payments/authorizations/${authId}/capture`, { final_capture: true });
export const voidAuth = (authId) => pp('POST', `/v2/payments/authorizations/${authId}/void`);
