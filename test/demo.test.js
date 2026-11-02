import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createApp } from "../src/app.js";

let app, base, jar, dataDir;
before(async () => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'demo-'));
  app = createApp({ dataDir, env: { DEMO_MODE: 'true' } });
  base = `http://127.0.0.1:${await app.start(0)}`;
});
after(async () => {
  await app.stop();
  fs.rmSync(dataDir, { recursive: true, force: true });
});
async function call(p, { method = 'GET', body, auth = true } = {}) {
  const res = await fetch(base + p, { method, headers: { ...(body !== undefined ? { 'content-type': 'application/json' } : {}), ...(auth && jar ? { cookie: jar } : {}) }, body: body !== undefined ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, body: json, headers: res.headers };
}
async function signIn() {
  const s = await call('/api/session', { auth: false });
  assert.deepEqual(s.body.demo, { password: 'demo1234', resetMinutes: 60 });
  assert.equal(s.body.needsSetup, false, 'the demo is ready to use');
  assert.equal((await call('/api/setup', { method: 'POST', body: { password: 'takeover-123' }, auth: false })).status, 403);
  const r = await call('/api/login', { method: 'POST', body: { password: 'demo1234' }, auth: false });
  assert.equal(r.status, 200);
  jar = r.headers.get('set-cookie').split(';')[0];
  assert.equal((await call('/api/password', { method: 'POST', body: { current: 'demo1234', next: 'changed-pass-1' } })).status, 403);
}

test('demo: a café with subscribers, approved templates and past campaigns, and nothing is ever sent', async () => {
  await signIn();
  const o = await call('/api/overview');
  assert.ok(o.body.subscribed > 200);
  assert.ok(o.body.sent30 > 200);
  assert.ok(o.body.read30 > 0);
  assert.equal(o.body.connected, true);
  const { campaigns } = (await call('/api/campaigns')).body;
  assert.equal(campaigns.length, 4);
  const draft = campaigns.find((c) => c.status === 'draft');
  assert.equal((await call(`/api/campaigns/${draft.id}/start`, { method: 'POST', body: {} })).status, 200);
  await app.tick();
  assert.ok(app.data.messages.filter((m) => m.campaignId === draft.id).every((m) => m.status === 'queued' || m.waId.startsWith('wamid.demo')));
  assert.equal((await call('/api/test', { method: 'POST', body: { template: 'weekly_offer', phone: '01001234567' } })).status, 403);
  await call('/api/settings', { method: 'PUT', body: { settings: { accessToken: 'stolen', phoneNumberId: '1' } } });
  assert.equal(app.data.settings.accessToken, '', 'the demo cannot be pointed at a real account');
  assert.ok((await call('/api/replies')).body.replies.length > 0);
  assert.ok(app.data.contacts.every((c) => /^1\d{3}55501\d\d$/.test(c.phone)), 'fictional numbers only');
});
