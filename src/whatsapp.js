// WhatsApp Cloud API: approved message templates, sending them, and verifying webhooks.
import crypto from 'node:crypto';

const GRAPH = () => `${process.env.META_GRAPH_URL || 'https://graph.facebook.com'}/${process.env.META_GRAPH_VERSION || 'v23.0'}`;

async function graph(path, token, init = {}) {
  const res = await fetch(`${GRAPH()}${path}`, { ...init, headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', ...(init.headers || {}) }, signal: AbortSignal.timeout(20_000) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = new Error(data.error?.error_user_msg || data.error?.message || `WhatsApp answered HTTP ${res.status}`);
    e.code = data.error?.code;
    e.status = res.status;
    throw e;
  }
  return data;
}

/** Approved templates of the WhatsApp Business Account, with the number of {{n}} fields in the body. */
export async function fetchTemplates({ wabaId, token }) {
  const out = [];
  let url = `/${wabaId}/message_templates?limit=100&fields=name,language,status,category,components`;
  for (let i = 0; i < 10 && url; i++) {
    const page = await graph(url, token);
    for (const t of page.data || []) {
      if (t.status !== 'APPROVED') continue;
      const body = (t.components || []).find((c) => c.type === 'BODY');
      const header = (t.components || []).find((c) => c.type === 'HEADER');
      const text = body?.text || '';
      const vars = new Set((text.match(/\{\{(\d+)\}\}/g) || []).map((x) => Number(x.slice(2, -2))));
      out.push({ name: t.name, language: t.language, category: t.category, text, vars: vars.size ? Math.max(...vars) : 0, header: header ? { format: header.format, text: header.text || '' } : null });
    }
    const next = page.paging?.next;
    url = next ? next.replace(/^https?:\/\/[^/]+\/v[\d.]+/, '') : '';
  }
  return out;
}

/** Sends one template message. `values` fill {{1}}, {{2}}… in order. */
export async function sendTemplate({ phoneNumberId, token }, { to, template, language, values = [], headerImage }) {
  const components = [];
  if (headerImage) components.push({ type: 'header', parameters: [{ type: 'image', image: { link: headerImage } }] });
  if (values.length) components.push({ type: 'body', parameters: values.map((v) => ({ type: 'text', text: String(v || '-').slice(0, 1000) })) });
  const data = await graph(`/${phoneNumberId}/messages`, token, {
    method: 'POST',
    body: JSON.stringify({ messaging_product: 'whatsapp', to: String(to).replace(/\D/g, ''), type: 'template', template: { name: template, language: { code: language }, ...(components.length ? { components } : {}) } }),
  });
  return data.messages?.[0]?.id || '';
}

export function verifySignature(raw, header, appSecret) {
  if (!appSecret) return false; // without the app secret nobody can be trusted to report statuses or opt-outs
  if (!header || !header.startsWith('sha256=')) return false;
  const expected = crypto.createHmac('sha256', appSecret).update(raw).digest('hex');
  const got = header.slice(7);
  return got.length === expected.length && crypto.timingSafeEqual(Buffer.from(got), Buffer.from(expected));
}

/** Words that unsubscribe someone, in Arabic and English. */
export const STOP_WORDS = ['stop', 'unsubscribe', 'cancel', 'الغاء', 'إلغاء', 'الغي', 'إلغي', 'وقف', 'ايقاف', 'إيقاف', 'بطل', 'لا شكرا', 'لا شكراً'];
export const isStop = (text) => { const t = String(text || '').trim().toLowerCase().replace(/[.!؟?]/g, ''); return STOP_WORDS.includes(t); };
