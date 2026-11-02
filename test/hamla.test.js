import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { createApp } from '../src/app.js';
import { isStop, verifySignature } from '../src/whatsapp.js';

// A fake WhatsApp Cloud API that records what Hamla sends.
const sent = [];
let failToken = false;
const graph = http.createServer((req, res) => {
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    const reply = (status, obj) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(obj)); };
    if (req.headers.authorization !== 'Bearer tok-123') return reply(401, { error: { message: 'Invalid OAuth access token', code: 190 } });
    if (req.method === 'GET' && req.url.startsWith('/v23.0/555/message_templates')) {
      return reply(200, { data: [
        { name: 'offer', language: 'en', status: 'APPROVED', category: 'MARKETING', components: [{ type: 'BODY', text: 'Hi {{1}}, {{2}} this week.' }] },
        { name: 'draft_one', language: 'en', status: 'PENDING', category: 'MARKETING', components: [{ type: 'BODY', text: 'x' }] },
        { name: 'promo_img', language: 'en', status: 'APPROVED', category: 'MARKETING', components: [{ type: 'HEADER', format: 'IMAGE' }, { type: 'BODY', text: 'New in {{1}}' }] },
      ] });
    }
    if (req.method === 'POST' && req.url === '/v23.0/777/messages') {
      if (failToken) return reply(401, { error: { message: 'Session has expired', code: 190 } });
      const b = JSON.parse(body);
      if (b.to === '201000000099') return reply(400, { error: { message: 'Recipient not on WhatsApp', code: 131026 } });
      sent.push(b);
      return reply(200, { messages: [{ id: 'wamid.' + sent.length }] });
    }
    reply(404, { error: { message: 'no route ' + req.url } });
  });
});

let app, base, jar, dataDir;
before(async () => {
  await new Promise((r) => graph.listen(0, r));
  process.env.META_GRAPH_URL = `http://127.0.0.1:${graph.address().port}`;
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hamla-'));
  app = createApp({ dataDir, env: {}, tickMs: 60_000 });
  base = `http://127.0.0.1:${await app.start(0)}`;
});
after(async () => {
  await app.stop();
  graph.close();
  fs.rmSync(dataDir, { recursive: true, force: true });
});
async function call(p, { method = 'GET', body, raw, headers = {}, auth = true } = {}) {
  const res = await fetch(base + p, { method, headers: { ...(raw !== undefined ? { 'content-type': 'text/plain' } : body !== undefined ? { 'content-type': 'application/json' } : {}), ...(auth && jar ? { cookie: jar } : {}), ...headers }, body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined) });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, body: json };
}
const hook = (obj, secret = 'app-secret') => {
  const raw = JSON.stringify(obj);
  return call('/webhook', { method: 'POST', raw, headers: { 'content-type': 'application/json', 'x-hub-signature-256': 'sha256=' + crypto.createHmac('sha256', secret).update(raw).digest('hex') }, auth: false });
};

test('setup, connect WhatsApp and sync only approved templates', async () => {
  const r = await fetch(base + '/api/setup', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ businessName: 'Bean', password: 'owner-pass-1', lang: 'en', timezone: 'Africa/Cairo' }) });
  assert.equal(r.status, 200);
  jar = r.headers.get('set-cookie').split(';')[0];
  assert.equal((await call('/api/templates/sync', { method: 'POST', body: {} })).status, 400, 'not connected yet');
  await call('/api/settings', { method: 'PUT', body: { settings: { phoneNumberId: '777', wabaId: '555', accessToken: 'tok-123', appSecret: 'app-secret', countryCode: '20', quietFrom: '', quietTo: '', perMinute: 2 } } });
  const st = await call('/api/settings');
  assert.match(st.body.settings.accessToken, /•+-123$|-123$/);
  assert.ok(!JSON.stringify(st.body).includes('tok-123'), 'the token is never sent back');
  assert.ok(!JSON.stringify(st.body).includes('app-secret'));
  const t = await call('/api/templates/sync', { method: 'POST', body: {} });
  assert.equal(t.status, 200);
  assert.deepEqual(t.body.templates.map((x) => [x.name, x.vars]), [['offer', 2], ['promo_img', 1]]);
  // Saving the masked value back must not overwrite the real token.
  await call('/api/settings', { method: 'PUT', body: { settings: { accessToken: st.body.settings.accessToken } } });
  assert.equal(app.data.settings.accessToken, 'tok-123');
});

test('consent is required for every way a contact gets in', async () => {
  assert.equal((await call('/api/contacts', { method: 'POST', body: { phone: '01001234567', name: 'Mona' } })).status, 400);
  assert.equal((await call('/api/contacts', { method: 'POST', body: { phone: '01001234567', name: 'Mona Ahmed', tags: ['VIP'], consent: true } })).status, 200);
  assert.equal(app.normPhone('0100 123 4567'), '201001234567');
  assert.equal(app.normPhone('+44 7700 900123'), '447700900123');
  assert.equal(app.normPhone('٠١٠٠١٢٣٤٥٦٧'), '201001234567');
  assert.equal(app.normPhone('123'), '');
  assert.equal((await call('/api/contacts/import', { method: 'POST', raw: '01001112223, Karim' })).status, 400, 'import without consent is refused');
  const im = await call('/api/contacts/import?consent=1&tag=Online', { method: 'POST', raw: '﻿phone,name,tags\n01001112223, Karim, Regulars|VIP\n01001234567, Mona\nnot-a-number, X\n01000000099, Ghost' });
  assert.deepEqual(im.body, { added: 2, updated: 1, invalid: 1 });
  // Public sign-up page: honeypot, consent box, then success.
  assert.equal((await call('/api/join', { method: 'POST', body: { phone: '01005556667', consent: true, website: 'spam.example' }, auth: false })).status, 400);
  assert.equal((await call('/api/join', { method: 'POST', body: { phone: '01005556667' }, auth: false })).body.error, 'consent_required');
  assert.equal((await call('/api/join', { method: 'POST', body: { phone: '01005556667', name: 'Sara', consent: true, tag: 'Downtown' }, auth: false })).status, 200);
  const all = await call('/api/contacts');
  assert.equal(all.body.total, 4);
  assert.ok(all.body.contacts.every((c) => c.consent));
  assert.equal(all.body.contacts.find((c) => c.name === 'Sara').consent.source, 'form');
  const qr = await fetch(base + '/qr.svg');
  assert.match(await qr.text(), /<svg/);
});

test('webhook verification and signatures', async () => {
  assert.equal((await call('/webhook?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=42', { auth: false })).status, 403);
  const vt = app.data.settings.verifyToken;
  const ok = await call(`/webhook?hub.mode=subscribe&hub.verify_token=${vt}&hub.challenge=42`, { auth: false });
  assert.equal(ok.status, 200);
  assert.equal(String(ok.body), '42');
  assert.equal((await hook({ entry: [] }, 'wrong-secret')).status, 401);
  assert.equal(verifySignature(Buffer.from('x'), 'sha256=00', ''), false, 'no app secret: nothing is trusted');
  assert.ok(isStop('STOP') && isStop(' إلغاء ') && isStop('الغاء.') && !isStop('stop by later'));
});

test('a campaign sends paced, personalised template messages and tracks statuses', async () => {
  assert.equal((await call('/api/campaigns', { method: 'POST', body: { template: 'offer', values: ['{first}'] } })).status, 400, 'all fields need values');
  assert.equal((await call('/api/campaigns', { method: 'POST', body: { template: 'promo_img', values: ['Giza'] } })).status, 400, 'image header needs a link');
  assert.equal((await call('/api/campaigns', { method: 'POST', body: { template: 'offer', values: ['{first}', 'x'], audience: { tags: ['Nobody'] } } })).status, 400);
  assert.equal((await call('/api/audience', { method: 'POST', body: { audience: { tags: ['VIP', 'Online'], match: 'all' } } })).body.count, 2);
  const c = (await call('/api/campaigns', { method: 'POST', body: { name: 'Week', template: 'offer', values: ['{first}', 'cake is half price'] } })).body.campaign;
  assert.equal(c.status, 'draft');
  assert.equal((await call(`/api/campaigns/${c.id}/start`, { method: 'POST', body: {} })).body.campaign.stats.queued, 4);
  await app.tick();
  assert.equal(sent.length, 2, 'perMinute=2 limits each minute');
  assert.equal(sent[0].template.name, 'offer');
  assert.deepEqual(sent[0].template.components[0].parameters.map((p) => p.text), ['Mona', 'cake is half price']);
  assert.equal(sent[0].to, '201001234567');
  await app.tick();
  await app.tick();
  const r = (await call('/api/campaigns/' + c.id)).body;
  assert.equal(r.campaign.status, 'done');
  assert.equal(r.campaign.stats.failed, 1, 'the number that is not on WhatsApp');
  assert.match(r.messages.find((m) => m.status === 'failed').error, /not on WhatsApp/);
  assert.equal(sent.length, 3);
  // Statuses only move forward; a late "delivered" does not undo "read".
  await hook({ entry: [{ changes: [{ value: { statuses: [{ id: 'wamid.1', status: 'read', timestamp: '1700000000' }, { id: 'wamid.1', status: 'delivered' }, { id: 'wamid.2', status: 'delivered' }] } }] }] });
  const s2 = (await call('/api/campaigns/' + c.id)).body.campaign.stats;
  assert.equal(s2.read, 1);
  assert.equal(s2.delivered, 2);
});

test('STOP unsubscribes, is skipped by later campaigns, and the sign-up page brings them back', async () => {
  await hook({ entry: [{ changes: [{ value: { contacts: [{ profile: { name: 'Mona' } }], messages: [{ from: '201001234567', type: 'text', text: { body: 'Stop' } }] } }] }] });
  const mona = app.data.contacts.find((x) => x.phone === '201001234567');
  assert.equal(mona.optedOut, true);
  const replies = (await call('/api/replies')).body.replies;
  assert.equal(replies[0].stop, true);
  assert.equal((await call('/api/campaigns')).body.campaigns[0].stats.optedOut, 1);
  const c = (await call('/api/campaigns', { method: 'POST', body: { template: 'offer', values: ['{name}', 'two for one'] } })).body.campaign;
  await call(`/api/campaigns/${c.id}/start`, { method: 'POST', body: {} });
  const before = sent.length;
  await app.tick(); await app.tick(); await app.tick();
  assert.ok(sent.slice(before).every((m) => m.to !== '201001234567'), 'nothing goes to someone who said stop');
  // Re-joining through the page is fresh consent.
  await call('/api/join', { method: 'POST', body: { phone: '+201001234567', consent: true }, auth: false });
  assert.equal(mona.optedOut, false);
});

test('an expired token pauses the campaign instead of failing everyone; quiet hours hold sending', async () => {
  const c = (await call('/api/campaigns', { method: 'POST', body: { template: 'offer', values: ['{first}', 'x'] } })).body.campaign;
  await call(`/api/campaigns/${c.id}/start`, { method: 'POST', body: {} });
  failToken = true;
  await app.tick();
  let r = (await call('/api/campaigns/' + c.id)).body.campaign;
  assert.equal(r.status, 'paused');
  assert.match(r.pauseReason, /expired/);
  assert.equal(r.stats.failed, 0);
  failToken = false;
  await call('/api/settings', { method: 'PUT', body: { settings: { quietFrom: '00:00', quietTo: '23:59' } } });
  await call(`/api/campaigns/${c.id}/resume`, { method: 'POST', body: {} });
  const before = sent.length;
  await app.tick();
  assert.equal(sent.length, before, 'nothing is sent in quiet hours');
  await call('/api/settings', { method: 'PUT', body: { settings: { quietFrom: '', quietTo: '' } } });
  await app.tick();
  assert.ok(sent.length > before);
  await call(`/api/campaigns/${c.id}/cancel`, { method: 'POST', body: {} });
  r = (await call('/api/campaigns/' + c.id)).body.campaign;
  assert.equal(r.status, 'cancelled');
  assert.equal(r.stats.queued, 0);
  const sch = (await call('/api/campaigns', { method: 'POST', body: { template: 'offer', values: ['{first}', 'x'] } })).body.campaign;
  assert.equal((await call(`/api/campaigns/${sch.id}/schedule`, { method: 'POST', body: { at: '2001-01-01T00:00:00Z' } })).status, 400);
  assert.equal((await call(`/api/campaigns/${sch.id}/schedule`, { method: 'POST', body: { at: new Date(Date.now() + 1000).toISOString() } })).body.campaign.status, 'scheduled');
  await app.tick(Date.now() + 5000);
  assert.equal(app.data.campaigns.find((x) => x.id === sch.id).status, 'sending');
});
