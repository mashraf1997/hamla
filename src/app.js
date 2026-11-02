// Hamla server: WhatsApp campaigns through the official Cloud API. Contacts with recorded consent,
// a sign-up page, approved templates, paced sending outside quiet hours, delivery and read tracking,
// replies, and automatic unsubscribe when someone writes "stop".
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import QRCode from 'qrcode';
import { hashPassword, verifyPassword, createSession, checkSession, parseCookies, RateLimiter } from './auth.js';
import { send, readJson, readBody, clientIp, originOf, serveStatic, cookie, VERSION } from './http.js';
import { demoConfig, resetData } from './demo-mode.js';
import { buildDemo } from './demo-data.js';
import { fetchTemplates, sendTemplate, verifySignature, isStop } from './whatsapp.js';

export function defaultData(lang = 'ar') {
  return {
    version: 1,
    meta: { secret: crypto.randomBytes(32).toString('hex'), createdAt: new Date().toISOString() },
    admin: null,
    settings: {
      businessName: '', lang, timezone: '', countryCode: lang === 'ar' ? '20' : '',
      phoneNumberId: '', wabaId: '', accessToken: '', appSecret: '', verifyToken: crypto.randomBytes(12).toString('hex'),
      perMinute: 30, quietFrom: '22:00', quietTo: '09:00',
      joinTitle: '', joinText: lang === 'ar' ? 'اشترك عشان يوصلك جديدنا وعروضنا على واتساب. تقدر تلغي في أي وقت بإنك تبعت «إلغاء».' : 'Join to get our news and offers on WhatsApp. You can leave any time by sending "stop".',
      tags: [],
    },
    contacts: [], // { id, phone, name, tags, consent: { source, at, note }, optedOut, optedOutAt, lastMessageAt, createdAt }
    templates: [], templatesAt: null,
    campaigns: [], // { id, name, template, language, values, headerImage, audience: { tags, match }, status, scheduledAt, createdAt, startedAt, finishedAt }
    messages: [], // { id, campaignId, contactId, phone, waId, status, error, at, updatedAt, replied }
    replies: [], // { id, contactId, phone, text, at, stop }
  };
}

const clean = (s, n = 200) => String(s ?? '').trim().slice(0, n);
const MASK = '••••••';
const SECRETS = ['accessToken', 'appSecret'];
const isHm = (s) => /^\d{2}:\d{2}$/.test(String(s || ''));
const STATUS_RANK = { queued: 0, sent: 1, delivered: 2, read: 3, failed: 4, skipped: 4 };

export function createApp({ dataDir, setupToken = process.env.SETUP_TOKEN || '', env = process.env, tickMs = 5000 } = {}) {
  fs.mkdirSync(dataDir, { recursive: true });
  const file = path.join(dataDir, 'hamla.json');
  const def = defaultData();
  const loaded = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
  const data = loaded ? { ...def, ...loaded, settings: { ...def.settings, ...loaded.settings } } : def;
  let timer;
  const flush = () => { clearTimeout(timer); fs.writeFileSync(file + '.tmp', JSON.stringify(data)); fs.renameSync(file + '.tmp', file); };
  const save = () => { clearTimeout(timer); timer = setTimeout(flush, 300); };
  if (!loaded) flush();
  const demo = demoConfig(env);
  const resetDemo = () => { resetData(data, () => buildDemo(demo), demo); flush(); };
  let demoTimer = null;
  if (demo) { resetDemo(); demoTimer = setInterval(resetDemo, demo.resetMinutes * 60_000); demoTimer.unref?.(); }

  const s = () => data.settings;
  const tz = () => s().timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const loginLimiter = new RateLimiter(10, 15 * 60_000);
  const joinLimiter = new RateLimiter(10, 60 * 60_000);
  const hashFor = (uid) => (uid === 'owner' ? data.admin?.hash : null);
  const isOwner = (req) => checkSession(data.meta.secret, parseCookies(req.headers.cookie).hamla_session, hashFor) === 'owner';
  const ownerCookie = (req) => cookie(req, 'hamla_session', createSession(data.meta.secret, data.admin.hash), 30 * 86400);
  const cfg = () => ({ phoneNumberId: s().phoneNumberId, wabaId: s().wabaId, token: s().accessToken });
  const connected = () => Boolean(s().phoneNumberId && s().wabaId && s().accessToken);

  /** International digits for a number typed in local or international form. */
  function normPhone(raw) {
    let p = String(raw || '').replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[^\d+]/g, '');
    if (p.startsWith('+')) p = p.slice(1);
    else if (p.startsWith('00')) p = p.slice(2);
    else if (p.startsWith('0') && s().countryCode) p = s().countryCode + p.slice(1);
    return /^\d{8,15}$/.test(p) ? p : '';
  }
  const contactByPhone = (p) => data.contacts.find((c) => c.phone === p);
  function upsertContact({ phone, name, tags = [], consent }) {
    const p = normPhone(phone);
    if (!p) return null;
    let c = contactByPhone(p);
    if (!c) { c = { id: crypto.randomUUID(), phone: p, name: '', tags: [], consent: null, optedOut: false, optedOutAt: null, lastMessageAt: null, createdAt: new Date().toISOString() }; data.contacts.push(c); }
    if (name && !c.name) c.name = clean(name, 80);
    for (const t of tags.map((x) => clean(x, 30)).filter(Boolean)) { if (!c.tags.includes(t)) c.tags.push(t); if (!s().tags.includes(t)) s().tags.push(t); }
    if (consent && !c.consent) c.consent = { ...consent, at: new Date().toISOString() };
    return c;
  }
  const reachable = (c) => c.consent && !c.optedOut;
  function audienceOf(a) {
    const tags = (a?.tags || []).filter(Boolean);
    return data.contacts.filter((c) => reachable(c) && (!tags.length || (a.match === 'all' ? tags.every((t) => c.tags.includes(t)) : tags.some((t) => c.tags.includes(t)))));
  }

  function inQuietHours(now = Date.now()) {
    const { quietFrom: f, quietTo: t } = s();
    if (!isHm(f) || !isHm(t) || f === t) return false;
    const hm = new Intl.DateTimeFormat('en-GB', { timeZone: tz(), hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(now));
    return f < t ? hm >= f && hm < t : hm >= f || hm < t;
  }

  function campaignStats(c) {
    const ms = data.messages.filter((m) => m.campaignId === c.id);
    const n = (st) => ms.filter((m) => m.status === st).length;
    const reached = ms.filter((m) => STATUS_RANK[m.status] >= 1 && STATUS_RANK[m.status] <= 3).length;
    return { total: ms.length, queued: n('queued'), sent: reached, delivered: n('delivered') + n('read'), read: n('read'), failed: n('failed'), skipped: n('skipped'), replied: ms.filter((m) => m.replied).length, optedOut: ms.filter((m) => m.optedOut).length };
  }
  const campaignView = (c) => ({ ...c, stats: campaignStats(c) });

  function valuesFor(c, contact) {
    return (c.values || []).map((v) => String(v).replace(/\{name\}/g, contact.name || (s().lang === 'ar' ? 'عميلنا العزيز' : 'there')).replace(/\{first\}/g, (contact.name || '').split(' ')[0] || (s().lang === 'ar' ? 'عميلنا العزيز' : 'there')));
  }

  // ---------- sender ----------
  let sending = false;
  let budget = 0;
  async function tick(now = Date.now()) {
    if (sending) return;
    sending = true;
    try {
      for (const c of data.campaigns) if (c.status === 'scheduled' && Date.parse(c.scheduledAt) <= now) startCampaign(c);
      const active = data.campaigns.filter((c) => c.status === 'sending');
      if (!active.length || inQuietHours(now)) return;
      if (!demo && !connected()) return;
      budget = Math.min(s().perMinute, budget + (s().perMinute * tickMs) / 60_000);
      for (const c of active) {
        const queue = data.messages.filter((m) => m.campaignId === c.id && m.status === 'queued');
        if (!queue.length) { c.status = 'done'; c.finishedAt = new Date().toISOString(); save(); continue; }
        for (const m of queue) {
          if (budget < 1) break;
          budget -= 1;
          const contact = data.contacts.find((x) => x.id === m.contactId);
          if (!contact || !reachable(contact)) { m.status = 'skipped'; m.error = 'unsubscribed'; continue; }
          try {
            m.waId = demo ? 'wamid.demo.' + crypto.randomBytes(6).toString('hex') : await sendTemplate(cfg(), { to: contact.phone, template: c.template, language: c.language, values: valuesFor(c, contact), headerImage: c.headerImage });
            m.status = 'sent';
            contact.lastMessageAt = new Date().toISOString();
          } catch (err) {
            m.status = 'failed';
            m.error = clean(err.message, 200);
            // A bad token or a paused account stops the whole campaign instead of failing every message.
            if (err.status === 401 || err.code === 190 || err.code === 131031) { c.status = 'paused'; c.pauseReason = m.error; m.status = 'queued'; m.error = ''; break; }
          }
          m.updatedAt = new Date().toISOString();
        }
        save();
      }
    } finally {
      sending = false;
    }
  }

  function startCampaign(c) {
    if (!data.messages.some((m) => m.campaignId === c.id)) {
      const seen = new Set();
      for (const contact of audienceOf(c.audience)) {
        if (seen.has(contact.phone)) continue;
        seen.add(contact.phone);
        data.messages.push({ id: crypto.randomUUID(), campaignId: c.id, contactId: contact.id, phone: contact.phone, waId: '', status: 'queued', error: '', at: new Date().toISOString(), updatedAt: null, replied: false, optedOut: false });
      }
      if (data.messages.length > 300_000) data.messages.splice(0, 30_000);
    }
    c.status = 'sending';
    c.startedAt ||= new Date().toISOString();
    save();
  }

  // ---------- webhook ----------
  function handleWebhook(body) {
    for (const entry of body.entry || []) for (const ch of entry.changes || []) {
      const v = ch.value || {};
      for (const st of v.statuses || []) {
        const m = data.messages.find((x) => x.waId === st.id);
        if (!m) continue;
        const next = st.status === 'failed' ? 'failed' : st.status;
        if (STATUS_RANK[next] != null && (next === 'failed' || STATUS_RANK[next] > STATUS_RANK[m.status])) {
          m.status = next;
          m.updatedAt = new Date((Number(st.timestamp) || Date.now() / 1000) * 1000).toISOString();
          if (next === 'failed') m.error = clean(st.errors?.[0]?.title || st.errors?.[0]?.message || 'failed', 200);
        }
      }
      for (const msg of v.messages || []) {
        const phone = normPhone('+' + msg.from);
        const text = msg.text?.body || msg.button?.text || msg.interactive?.button_reply?.title || '';
        const contact = contactByPhone(phone) || upsertContact({ phone: '+' + msg.from, name: v.contacts?.[0]?.profile?.name });
        const stop = isStop(text);
        data.replies.push({ id: crypto.randomUUID(), contactId: contact?.id || '', phone, text: clean(text, 1000), at: new Date().toISOString(), stop });
        if (data.replies.length > 50_000) data.replies.splice(0, 5000);
        const last = data.messages.filter((m) => m.phone === phone && m.waId).sort((a, b) => b.at.localeCompare(a.at))[0];
        if (last) last.replied = true;
        if (contact && stop) { contact.optedOut = true; contact.optedOutAt = new Date().toISOString(); if (last) last.optedOut = true; }
        if (contact && !stop && contact.optedOut && /^(start|اشتراك|ابدأ)$/i.test(text.trim())) { contact.optedOut = false; contact.consent ||= { source: 'reply', at: new Date().toISOString(), note: text }; }
      }
    }
    save();
  }

  async function route(req, res) {
    const url = new URL(req.url, 'http://localhost');
    const p = url.pathname;
    const method = req.method;
    let m;
    if (p === '/health') return send(res, 200, { ok: true, version: VERSION });
    if (method === 'GET') {
      if (p === '/' || p === '/index.html') return serveStatic(res, 'index.html');
      if (p === '/join') return serveStatic(res, 'join.html');
      if (/^\/[\w.-]+\.(js|css|svg|png|ico)$/.test(p) && p !== '/qr.svg') return serveStatic(res, p.slice(1));
      if (p === '/qr.svg') return send(res, 200, await QRCode.toString(`${originOf(req)}/join${url.searchParams.get('tag') ? '?tag=' + encodeURIComponent(clean(url.searchParams.get('tag'), 30)) : ''}`, { type: 'svg', margin: 1 }), { 'content-type': 'image/svg+xml' });
    }

    // ----- Meta webhook -----
    if (p === '/webhook' && method === 'GET') {
      if (url.searchParams.get('hub.mode') === 'subscribe' && url.searchParams.get('hub.verify_token') === s().verifyToken) return send(res, 200, url.searchParams.get('hub.challenge') || '');
      return send(res, 403, 'Forbidden');
    }
    if (p === '/webhook' && method === 'POST') {
      const raw = await readBody(req, 2 * 1024 * 1024);
      if (!verifySignature(raw, req.headers['x-hub-signature-256'], s().appSecret)) return send(res, 401, 'Bad signature');
      try { handleWebhook(JSON.parse(raw.toString('utf8'))); } catch { /* malformed: ignore */ }
      return send(res, 200, 'OK');
    }

    // ----- public sign-up -----
    if (p === '/api/join' && method === 'GET') { const x = s(); return send(res, 200, { businessName: x.businessName, title: x.joinTitle, text: x.joinText, lang: x.lang, countryCode: x.countryCode }); }
    if (p === '/api/join' && method === 'POST') {
      if (!joinLimiter.allow(clientIp(req))) return send(res, 429, { error: 'too_many' });
      const b = await readJson(req);
      if (b.website) return send(res, 400, { error: 'bad_request' });
      if (b.consent !== true) return send(res, 400, { error: 'consent_required' });
      const c = upsertContact({ phone: b.phone, name: b.name, tags: b.tag ? [b.tag] : [], consent: { source: 'form', note: clean(b.tag, 30) } });
      if (!c) return send(res, 400, { error: 'bad_phone' });
      if (c.optedOut) { c.optedOut = false; c.optedOutAt = null; c.consent = { source: 'form', at: new Date().toISOString(), note: 'rejoined' }; }
      save();
      return send(res, 200, { ok: true });
    }

    if (demo && method === 'POST' && (p === '/api/setup' || p === '/api/password')) return send(res, 403, { error: 'Not available in the demo' });
    if (p === '/api/session' && method === 'GET') return send(res, 200, { needsSetup: !data.admin, authed: isOwner(req), setupTokenRequired: Boolean(setupToken), version: VERSION, demo: demo ? { password: demo.password, resetMinutes: demo.resetMinutes } : null });
    if (p === '/api/setup' && method === 'POST') {
      if (data.admin) return send(res, 409, { error: 'Already set up' });
      const b = await readJson(req);
      if (setupToken && b.setupToken !== setupToken) return send(res, 403, { error: 'Wrong setup token' });
      if (String(b.password || '').length < 8) return send(res, 400, { error: 'Password must be at least 8 characters' });
      const lang = b.lang === 'en' ? 'en' : 'ar';
      Object.assign(data.settings, defaultData(lang).settings, { verifyToken: data.settings.verifyToken, businessName: clean(b.businessName, 80), timezone: clean(b.timezone, 60) });
      data.admin = hashPassword(String(b.password));
      flush();
      return send(res, 200, { ok: true }, { 'set-cookie': ownerCookie(req) });
    }
    if (p === '/api/login' && method === 'POST') {
      if (!loginLimiter.allow(clientIp(req))) return send(res, 429, { error: 'Too many attempts. Try again in 15 minutes.' });
      const b = await readJson(req);
      if (!verifyPassword(String(b.password || ''), data.admin)) return send(res, 401, { error: 'Wrong password' });
      return send(res, 200, { ok: true }, { 'set-cookie': ownerCookie(req) });
    }
    if (p === '/api/logout' && method === 'POST') return send(res, 200, { ok: true }, { 'set-cookie': cookie(req, 'hamla_session', '', 0) });
    if (p.startsWith('/api/')) {
      if (!isOwner(req)) return send(res, 401, { error: 'Not signed in' });
      if (p === '/api/contacts/import' && method === 'POST') return importContacts(req, res, url);
      if (method !== 'GET' && !(req.headers['content-type'] || '').includes('application/json')) return send(res, 415, { error: 'Send JSON' });
      return api(req, res, url, p, method);
    }
    return send(res, 404, 'Not found');
  }

  async function importContacts(req, res, url) {
    // Plain text or CSV: one contact per line, "phone, name, tag; tag". Consent must be confirmed.
    if (url.searchParams.get('consent') !== '1') return send(res, 400, { error: 'Confirm that these people agreed to receive messages from you' });
    const text = (await readBody(req, 5 * 1024 * 1024)).toString('utf8').replace(/^﻿/, '');
    const extra = clean(url.searchParams.get('tag'), 30);
    let added = 0, updated = 0, invalid = 0;
    for (const line of text.split(/\r?\n/)) {
      const cells = line.split(/[,\t;]/).map((x) => x.trim().replace(/^"|"$/g, ''));
      if (!cells[0] || /phone|موبايل|رقم/i.test(cells[0])) continue;
      const before = contactByPhone(normPhone(cells[0]));
      const c = upsertContact({ phone: cells[0], name: cells[1], tags: [...(cells[2] ? cells[2].split(/[|،]/) : []), extra].filter(Boolean), consent: { source: 'import', note: extra } });
      if (!c) invalid++; else if (before) updated++; else added++;
    }
    save();
    return send(res, 200, { added, updated, invalid });
  }

  async function api(req, res, url, p, method) {
    const x = s();
    let m;
    if (p === '/api/overview' && method === 'GET') {
      const since = Date.now() - 30 * 864e5;
      const recent = data.campaigns.filter((c) => Date.parse(c.createdAt) >= since).map(campaignView);
      const sum = (k) => recent.reduce((a, c) => a + c.stats[k], 0);
      return send(res, 200, {
        businessName: x.businessName, connected: connected() || Boolean(demo), webhookReady: Boolean(x.appSecret) || Boolean(demo),
        contacts: data.contacts.length, subscribed: data.contacts.filter(reachable).length, optedOut: data.contacts.filter((c) => c.optedOut).length, noConsent: data.contacts.filter((c) => !c.consent).length,
        joins30: data.contacts.filter((c) => c.consent?.source === 'form' && Date.parse(c.consent.at) >= since).length,
        sent30: sum('sent'), delivered30: sum('delivered'), read30: sum('read'), replied30: sum('replied'), optOut30: sum('optedOut'),
        active: data.campaigns.filter((c) => ['sending', 'scheduled', 'paused'].includes(c.status)).map(campaignView),
        recent: recent.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6),
        quiet: inQuietHours(),
      });
    }

    // ----- contacts -----
    if (p === '/api/contacts' && method === 'GET') {
      const q = clean(url.searchParams.get('q'), 60).toLowerCase();
      const tag = url.searchParams.get('tag');
      const st = url.searchParams.get('status');
      let list = data.contacts;
      if (q) list = list.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q.replace(/\D/g, '') || '#'));
      if (tag) list = list.filter((c) => c.tags.includes(tag));
      if (st === 'subscribed') list = list.filter(reachable); else if (st === 'optedout') list = list.filter((c) => c.optedOut); else if (st === 'noconsent') list = list.filter((c) => !c.consent);
      return send(res, 200, { total: list.length, tags: x.tags, contacts: [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 500) });
    }
    if (p === '/api/contacts' && method === 'POST') {
      const b = await readJson(req);
      if (b.consent !== true) return send(res, 400, { error: 'Confirm that this person agreed to receive messages from you' });
      const c = upsertContact({ phone: b.phone, name: b.name, tags: b.tags || [], consent: { source: 'manual', note: clean(b.note, 120) } });
      if (!c) return send(res, 400, { error: 'Enter a valid mobile number' });
      save();
      return send(res, 200, { contact: c });
    }
    if ((m = p.match(/^\/api\/contacts\/([\w-]+)$/))) {
      const c = data.contacts.find((y) => y.id === m[1]);
      if (!c) return send(res, 404, { error: 'Not found' });
      if (method === 'PUT') {
        const b = await readJson(req);
        if (typeof b.name === 'string') c.name = clean(b.name, 80);
        if (Array.isArray(b.tags)) { c.tags = [...new Set(b.tags.map((t) => clean(t, 30)).filter(Boolean))]; for (const t of c.tags) if (!x.tags.includes(t)) x.tags.push(t); }
        if (b.optedOut === true && !c.optedOut) { c.optedOut = true; c.optedOutAt = new Date().toISOString(); }
        save();
        return send(res, 200, { contact: c });
      }
      if (method === 'DELETE') { data.contacts = data.contacts.filter((y) => y.id !== c.id); save(); return send(res, 200, { ok: true }); }
    }
    if (p === '/api/contacts.csv' && method === 'GET') {
      const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const rows = [['phone', 'name', 'tags', 'consent', 'consent_at', 'unsubscribed'].join(',')];
      for (const c of data.contacts) rows.push([`+${c.phone}`, c.name, c.tags.join('|'), c.consent?.source || '', c.consent?.at || '', c.optedOut ? c.optedOutAt : ''].map(q).join(','));
      return send(res, 200, '﻿' + rows.join('\n'), { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="hamla-contacts.csv"' });
    }
    if (p === '/api/audience' && method === 'POST') { const b = await readJson(req); return send(res, 200, { count: audienceOf(b.audience).length }); }

    // ----- templates -----
    if (p === '/api/templates' && method === 'GET') return send(res, 200, { templates: data.templates, syncedAt: data.templatesAt });
    if (p === '/api/templates/sync' && method === 'POST') {
      if (demo) return send(res, 200, { templates: data.templates, syncedAt: data.templatesAt });
      if (!connected()) return send(res, 400, { error: 'Connect your WhatsApp Business account in Settings first' });
      try { data.templates = await fetchTemplates(cfg()); data.templatesAt = new Date().toISOString(); save(); return send(res, 200, { templates: data.templates, syncedAt: data.templatesAt }); }
      catch (err) { return send(res, 502, { error: err.message }); }
    }

    // ----- campaigns -----
    if (p === '/api/campaigns' && method === 'GET') return send(res, 200, { campaigns: [...data.campaigns].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(campaignView) });
    if (p === '/api/campaigns' && method === 'POST') {
      const b = await readJson(req);
      const tpl = data.templates.find((t) => t.name === b.template && (!b.language || t.language === b.language));
      if (!tpl) return send(res, 400, { error: 'Choose an approved template' });
      const values = (Array.isArray(b.values) ? b.values : []).slice(0, tpl.vars).map((v) => clean(v, 300));
      if (values.length < tpl.vars || values.some((v) => !v)) return send(res, 400, { error: `This template needs ${tpl.vars} values` });
      if (tpl.header?.format === 'IMAGE' && !/^https:\/\//.test(b.headerImage || '')) return send(res, 400, { error: 'This template needs an image link (https)' });
      const c = { id: crypto.randomUUID(), name: clean(b.name, 80) || tpl.name, template: tpl.name, language: tpl.language, values, headerImage: tpl.header?.format === 'IMAGE' ? clean(b.headerImage, 500) : '', audience: { tags: (b.audience?.tags || []).map((t) => clean(t, 30)).filter(Boolean), match: b.audience?.match === 'all' ? 'all' : 'any' }, status: 'draft', scheduledAt: null, createdAt: new Date().toISOString(), startedAt: null, finishedAt: null };
      if (!audienceOf(c.audience).length) return send(res, 400, { error: 'Nobody subscribed matches this audience' });
      data.campaigns.push(c);
      save();
      return send(res, 200, { campaign: campaignView(c) });
    }
    if ((m = p.match(/^\/api\/campaigns\/([\w-]+)$/)) && method === 'GET') {
      const c = data.campaigns.find((y) => y.id === m[1]);
      if (!c) return send(res, 404, { error: 'Not found' });
      const sample = audienceOf(c.audience).find((y) => y.name) || { name: '' };
      const msgs = data.messages.filter((y) => y.campaignId === c.id).slice(0, 2000).map((y) => ({ ...y, name: data.contacts.find((z) => z.id === y.contactId)?.name || '' }));
      return send(res, 200, { campaign: campaignView(c), messages: msgs, preview: (data.templates.find((t) => t.name === c.template)?.text || '').replace(/\{\{(\d+)\}\}/g, (_, n) => valuesFor(c, sample)[n - 1] || '') });
    }
    if ((m = p.match(/^\/api\/campaigns\/([\w-]+)\/(start|schedule|pause|resume|cancel)$/)) && method === 'POST') {
      const c = data.campaigns.find((y) => y.id === m[1]);
      if (!c) return send(res, 404, { error: 'Not found' });
      const action = m[2];
      if (action === 'start' || action === 'schedule') {
        if (!['draft', 'scheduled'].includes(c.status)) return send(res, 409, { error: 'Already started' });
        if (!demo && !connected()) return send(res, 400, { error: 'Connect your WhatsApp Business account in Settings first' });
        if (action === 'schedule') {
          const b = await readJson(req);
          const at = Date.parse(b.at);
          if (!(at > Date.now())) return send(res, 400, { error: 'Pick a time in the future' });
          c.status = 'scheduled'; c.scheduledAt = new Date(at).toISOString();
        } else startCampaign(c);
      }
      if (action === 'pause' && c.status === 'sending') c.status = 'paused';
      if (action === 'resume' && c.status === 'paused') { c.status = 'sending'; c.pauseReason = ''; }
      if (action === 'cancel' && !['done', 'cancelled'].includes(c.status)) { c.status = 'cancelled'; for (const y of data.messages) if (y.campaignId === c.id && y.status === 'queued') { y.status = 'skipped'; y.error = 'cancelled'; } }
      save();
      return send(res, 200, { campaign: campaignView(c) });
    }
    if (p === '/api/test' && method === 'POST') {
      if (demo) return send(res, 403, { error: 'Not available in the demo' });
      const b = await readJson(req);
      const tpl = data.templates.find((t) => t.name === b.template);
      const to = normPhone(b.phone);
      if (!tpl || !to) return send(res, 400, { error: 'Choose a template and a valid number' });
      try { const id = await sendTemplate(cfg(), { to, template: tpl.name, language: tpl.language, values: (b.values || []).slice(0, tpl.vars), headerImage: b.headerImage }); return send(res, 200, { ok: true, id }); }
      catch (err) { return send(res, 502, { error: err.message }); }
    }
    if (p === '/api/replies' && method === 'GET') return send(res, 200, { replies: data.replies.slice(-300).reverse().map((r) => ({ ...r, name: data.contacts.find((c) => c.id === r.contactId)?.name || '' })) });

    if (p === '/api/settings' && method === 'GET') {
      const out = { ...x };
      for (const k of SECRETS) if (out[k]) out[k] = MASK + out[k].slice(-4);
      return send(res, 200, { settings: out, webhookUrl: `${originOf(req)}/webhook`, joinUrl: `${originOf(req)}/join` });
    }
    if (p === '/api/settings' && method === 'PUT') {
      const b = (await readJson(req)).settings || {};
      for (const k of ['businessName', 'timezone', 'joinTitle']) if (typeof b[k] === 'string') x[k] = clean(b[k], 120);
      if (typeof b.joinText === 'string') x.joinText = clean(b.joinText, 600);
      if (b.lang === 'ar' || b.lang === 'en') x.lang = b.lang;
      if (typeof b.countryCode === 'string') x.countryCode = b.countryCode.replace(/\D/g, '').slice(0, 4);
      if (b.perMinute != null) x.perMinute = Math.min(600, Math.max(1, Math.round(Number(b.perMinute) || 30)));
      for (const k of ['quietFrom', 'quietTo']) if (b[k] === '' || isHm(b[k])) x[k] = b[k];
      if (!demo) {
        for (const k of ['phoneNumberId', 'wabaId']) if (typeof b[k] === 'string') x[k] = b[k].replace(/\D/g, '');
        for (const k of SECRETS) if (typeof b[k] === 'string' && !b[k].startsWith(MASK)) x[k] = b[k].trim();
      }
      save();
      return send(res, 200, { ok: true });
    }
    if (p === '/api/password' && method === 'POST') {
      const b = await readJson(req);
      if (!verifyPassword(String(b.current || ''), data.admin)) return send(res, 401, { error: 'Current password is wrong' });
      if (String(b.next || '').length < 8) return send(res, 400, { error: 'New password must be at least 8 characters' });
      data.admin = hashPassword(String(b.next));
      flush();
      return send(res, 200, { ok: true }, { 'set-cookie': ownerCookie(req) });
    }
    return send(res, 404, { error: 'Not found' });
  }

  // Demo only: pretend WhatsApp reports deliveries and reads for messages "sent" by the demo.
  function demoStatuses() {
    if (!demo) return;
    const now = Date.now();
    for (const msg of data.messages) {
      if (!msg.waId?.startsWith('wamid.demo') || !msg.updatedAt) continue;
      const age = now - Date.parse(msg.updatedAt);
      if (msg.status === 'sent' && age > 4000) { msg.status = 'delivered'; msg.updatedAt = new Date().toISOString(); }
      else if (msg.status === 'delivered' && age > 6000 && msg.id.charCodeAt(0) % 3 !== 0) { msg.status = 'read'; msg.updatedAt = new Date().toISOString(); }
    }
  }

  const server = http.createServer((req, res) => {
    route(req, res).catch((err) => {
      const status = err.status || 500;
      if (status === 500) console.error('[http]', err);
      if (!res.headersSent) send(res, status, { error: status === 500 ? 'Internal error' : err.message });
    });
  });
  let loop = null;
  return {
    resetDemo, server, data, tick, normPhone,
    async start(port) {
      loop = setInterval(() => { demoStatuses(); tick().catch((e) => console.error('[send]', e.message)); }, tickMs);
      loop.unref?.();
      await new Promise((r) => server.listen(port, r));
      return server.address().port;
    },
    async stop() { clearInterval(loop); clearInterval(demoTimer); flush(); await new Promise((r) => server.close(r)); },
  };
}
