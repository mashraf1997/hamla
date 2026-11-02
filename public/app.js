/* Hamla: WhatsApp campaigns dashboard */
(function () {
  'use strict';
  const STR = {
    ar: {
      home: 'الرئيسية', campaigns: 'الحملات', contacts: 'المشتركين', replies: 'الردود', settings: 'الإعدادات', logout: 'خروج', lang: 'English',
      setupTitle: 'أهلاً بيك في حملة', setupLead: 'ابعت عروضك على واتساب بالطريقة الرسمية: مشتركين وافقوا، وقوالب معتمدة من ميتا، وإرسال هادي، ومتابعة مين استلم وقرا.', biz: 'اسم البيزنس', password: 'كلمة السر', pwHint: '8 حروف على الأقل', start: 'ابدأ', loginTitle: 'تسجيل الدخول', login: 'دخول',
      notConnected: 'لسه مربطتش حساب واتساب للأعمال. روح للإعدادات.', noWebhook: 'حط الـ App Secret في الإعدادات عشان توصلك حالات الرسايل والردود.', quiet: 'دلوقتي ساعات الهدوء: الإرسال هيكمّل بعدها.',
      subscribed: 'مشترك', optedOutN: 'لغوا الاشتراك', joins30: 'اشتركوا من الصفحة آخر 30 يوم', sent30: 'اتبعت آخر 30 يوم', delivered: 'وصلت', read: 'اتقرت', replied: 'ردّوا', active: 'حملات شغالة', recent: 'آخر الحملات', none: '—',
      newCampaign: '+ حملة جديدة', name: 'الاسم', template: 'القالب', audience: 'الجمهور', allSubs: 'كل المشتركين', noTagHint: 'لو مختارتش تاج هتتبعت لكل المشتركين.', anyTag: 'أي تاج من دول', allTags: 'كل التاجات دي', values: 'قيم الحقول', valueHint: 'اكتب {first} للاسم الأول أو {name} للاسم كامل', image: 'رابط الصورة (https)', preview: 'شكل الرسالة', reach: 'هتوصل لـ', people: 'مشترك', save: 'حفظ', saved: 'اتحفظ ✓', close: 'إغلاق', syncTemplates: 'تحديث القوالب من واتساب', noTemplates: 'مفيش قوالب معتمدة. اعمل قالب في WhatsApp Manager واستنى موافقة ميتا، وبعدين دوس «تحديث القوالب».', synced: 'آخر تحديث',
      st_draft: 'مسودة', st_scheduled: 'متجدولة', st_sending: 'بتتبعت', st_paused: 'متوقفة', st_done: 'خلصت', st_cancelled: 'ملغية', sendNow: 'ابعت دلوقتي', schedule: 'جدولة', scheduleAt: 'وقت الإرسال', pause: 'إيقاف مؤقت', resume: 'كمّل', cancel: 'إلغاء', cancelQ: 'تلغي الحملة؟ الرسايل اللي لسه ماتبعتتش مش هتتبعت.', startQ: 'هتتبعت لـ {n} مشترك. تأكيد؟', total: 'الكل', queued: 'في الطابور', failed: 'فشلت', skipped: 'اتشالت', optOuts: 'لغوا', status: 'الحالة', phone: 'الموبايل', error: 'السبب', open: 'فتح', testSend: 'رسالة تجربة', testTo: 'ابعت تجربة لـ', sentTest: 'اتبعتت ✓',
      search: 'دوّر', allTagsF: 'كل التاجات', s_subscribed: 'مشتركين', s_optedout: 'لغوا', s_noconsent: 'من غير موافقة', addContact: '+ مشترك', import: 'استيراد', importHint: 'سطر لكل شخص: الموبايل، الاسم، التاجات (مفصولة بـ |). أو الصق ملف CSV.', consentQ: 'الناس دي وافقت إنها يوصلها مننا رسايل على واتساب', tagForAll: 'تاج للكل (اختياري)', imported: 'اتضاف {a}، اتحدّث {u}، أرقام غلط {i}', exportCsv: 'تصدير CSV', tags: 'التاجات', consent: 'الموافقة', c_form: 'صفحة الاشتراك', c_import: 'استيراد', c_manual: 'يدوي', c_reply: 'رد', unsubscribe: 'إلغاء اشتراكه', del: 'حذف', joinPage: 'صفحة الاشتراك', joinHint: 'حط الكود ده على الكاشير أو في المنيو، أو ابعت الرابط. اللي يشترك بيوافق بنفسه.', copy: 'نسخ', copied: 'اتنسخ ✓',
      stop: 'إلغاء اشتراك', noReplies: 'لسه مفيش ردود.', replyWa: 'رد من واتساب',
      connection: 'ربط واتساب للأعمال (Cloud API)', steps: ['في developers.facebook.com اعمل App من نوع Business وضيف منتج WhatsApp.', 'من WhatsApp ← API Setup هات Phone number ID و WhatsApp Business Account ID.', 'اعمل System User في Business Settings وطلّعله Access Token دايم بصلاحيات whatsapp_business_messaging و whatsapp_business_management.', 'من App Settings ← Basic هات App Secret.', 'في WhatsApp ← Configuration حط رابط الـ Webhook والـ Verify token اللي تحت، واشترك في messages.'], phoneId: 'Phone number ID', wabaId: 'WhatsApp Business Account ID', token: 'Access token', appSecret: 'App secret', webhookUrl: 'رابط الـ Webhook', verifyToken: 'Verify token',
      sending: 'الإرسال', perMinute: 'عدد الرسايل في الدقيقة', quietFrom: 'ساعات الهدوء من', quietTo: 'لحد', countryCode: 'كود الدولة للأرقام المحلية', joinTitle: 'عنوان صفحة الاشتراك', joinText: 'نص صفحة الاشتراك', rules: 'قواعد ميتا: ابعت بس للناس اللي وافقت، واستخدم قوالب معتمدة، وخلي إلغاء الاشتراك سهل. حملة بتعمل ده كله، بس المسؤولية عليك في مين وافق.', pwTitle: 'تغيير كلمة السر', current: 'الحالية', next: 'الجديدة', changePw: 'تغيير',
    },
    en: {
      home: 'Home', campaigns: 'Campaigns', contacts: 'Subscribers', replies: 'Replies', settings: 'Settings', logout: 'Sign out', lang: 'العربية',
      setupTitle: 'Welcome to Hamla', setupLead: 'Send your offers on WhatsApp the official way: subscribers who agreed, templates approved by Meta, steady sending, and tracking of who received and read them.', biz: 'Business name', password: 'Password', pwHint: 'At least 8 characters', start: 'Get started', loginTitle: 'Sign in', login: 'Sign in',
      notConnected: 'WhatsApp Business is not connected yet. Go to Settings.', noWebhook: 'Add the App Secret in Settings to receive message statuses and replies.', quiet: 'It is quiet hours now: sending continues afterwards.',
      subscribed: 'subscribed', optedOutN: 'Unsubscribed', joins30: 'Joined from the page, last 30 days', sent30: 'Sent, last 30 days', delivered: 'Delivered', read: 'Read', replied: 'Replied', active: 'Running campaigns', recent: 'Recent campaigns', none: '—',
      newCampaign: '+ New campaign', name: 'Name', template: 'Template', audience: 'Audience', allSubs: 'All subscribers', noTagHint: 'Pick no tag to send to every subscriber.', anyTag: 'Any of these tags', allTags: 'All of these tags', values: 'Field values', valueHint: 'Type {first} for the first name or {name} for the full name', image: 'Image link (https)', preview: 'Preview', reach: 'Reaches', people: 'subscribers', save: 'Save', saved: 'Saved ✓', close: 'Close', syncTemplates: 'Refresh templates from WhatsApp', noTemplates: 'No approved templates. Create one in WhatsApp Manager, wait for Meta to approve it, then press “Refresh templates”.', synced: 'Last refreshed',
      st_draft: 'Draft', st_scheduled: 'Scheduled', st_sending: 'Sending', st_paused: 'Paused', st_done: 'Done', st_cancelled: 'Cancelled', sendNow: 'Send now', schedule: 'Schedule', scheduleAt: 'Send at', pause: 'Pause', resume: 'Resume', cancel: 'Cancel', cancelQ: 'Cancel this campaign? Messages not sent yet will not be sent.', startQ: 'This goes to {n} subscribers. Confirm?', total: 'Total', queued: 'Queued', failed: 'Failed', skipped: 'Skipped', optOuts: 'Unsubscribed', status: 'Status', phone: 'Mobile', error: 'Reason', open: 'Open', testSend: 'Test message', testTo: 'Send a test to', sentTest: 'Sent ✓',
      search: 'Search', allTagsF: 'All tags', s_subscribed: 'Subscribed', s_optedout: 'Unsubscribed', s_noconsent: 'No consent', addContact: '+ Subscriber', import: 'Import', importHint: 'One person per line: mobile, name, tags (separated by |). Or paste a CSV file.', consentQ: 'These people agreed to receive messages from us on WhatsApp', tagForAll: 'Tag for everyone (optional)', imported: '{a} added, {u} updated, {i} invalid numbers', exportCsv: 'Export CSV', tags: 'Tags', consent: 'Consent', c_form: 'Sign-up page', c_import: 'Import', c_manual: 'Manual', c_reply: 'Reply', unsubscribe: 'Unsubscribe', del: 'Delete', joinPage: 'Sign-up page', joinHint: 'Put this code at the till or on the menu, or share the link. People who join give consent themselves.', copy: 'Copy', copied: 'Copied ✓',
      stop: 'Unsubscribed', noReplies: 'No replies yet.', replyWa: 'Reply on WhatsApp',
      connection: 'Connect WhatsApp Business (Cloud API)', steps: ['At developers.facebook.com create a Business app and add the WhatsApp product.', 'From WhatsApp → API Setup copy the Phone number ID and the WhatsApp Business Account ID.', 'Create a System User in Business Settings and generate a permanent access token with whatsapp_business_messaging and whatsapp_business_management.', 'From App Settings → Basic copy the App Secret.', 'In WhatsApp → Configuration set the webhook URL and verify token below, and subscribe to messages.'], phoneId: 'Phone number ID', wabaId: 'WhatsApp Business Account ID', token: 'Access token', appSecret: 'App secret', webhookUrl: 'Webhook URL', verifyToken: 'Verify token',
      sending: 'Sending', perMinute: 'Messages per minute', quietFrom: 'Quiet hours from', quietTo: 'to', countryCode: 'Country code for local numbers', joinTitle: 'Sign-up page title', joinText: 'Sign-up page text', rules: 'Meta’s rules: only message people who agreed, use approved templates, and make it easy to leave. Hamla does all of this, but who agreed is your responsibility.', pwTitle: 'Change password', current: 'Current', next: 'New', changePw: 'Change',
    },
  };
  const get = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const set = (k, v) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };
  let lang = get('hamla_lang') || 'ar';
  const t = (k) => STR[lang][k] ?? k;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const app = $('#app');
  let session = null, refresh = null;
  async function api(p, opts = {}) {
    const res = await fetch(p, { method: opts.method || 'GET', headers: opts.raw ? { 'content-type': 'text/plain' } : opts.body !== undefined ? { 'content-type': 'application/json' } : {}, body: opts.raw ?? (opts.body !== undefined ? JSON.stringify(opts.body) : undefined) });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && p !== '/api/login' && p !== '/api/password') { boot(); throw new Error(data.error); }
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  }
  const toast = (m) => { const el = $('#toast'); el.textContent = m; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 2400); };
  const loc = () => (lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB');
  const num = (n) => Number(n || 0).toLocaleString(loc());
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  const when = (iso) => (iso ? new Date(iso).toLocaleString(loc(), { dateStyle: 'medium', timeStyle: 'short' }) : '—');
  const pill = (st) => `<span class="pill ${{ sending: 'good', scheduled: 'warn', paused: 'warn', done: '', draft: 'off', cancelled: 'off' }[st]}">${t('st_' + st)}</span>`;
  function dialog(html, wide) {
    const d = document.createElement('dialog');
    d.innerHTML = html;
    d.style.cssText = `border:1px solid var(--line);border-radius:16px;background:var(--surface);color:var(--ink);width:min(94vw,${wide ? 900 : 560}px)`;
    document.body.appendChild(d);
    d.showModal();
    d.addEventListener('close', () => d.remove());
    $$('[data-close]', d).forEach((b) => (b.onclick = () => d.close()));
    return d;
  }

  async function boot() {
    clearInterval(refresh);
    document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    session = await api('/api/session').catch(() => ({}));
    if (session.needsSetup) return auth(true);
    if (!session.authed) return auth(false);
    shell(); route();
  }
  function auth(setup) {
    app.innerHTML = `<div class="auth"><form class="card" id="f"><div class="brand"><img src="favicon.svg" alt="">Hamla <span class="muted small">حملة</span></div>
      <h1>${setup ? t('setupTitle') : t('loginTitle')}</h1>${setup ? `<p class="muted">${t('setupLead')}</p><label class="field" for="b">${t('biz')}<input type="text" id="b"></label>` : ''}
      <label class="field" for="pw">${t('password')} ${setup ? `<span class="hint">${t('pwHint')}</span>` : ''}<input type="password" id="pw" autocomplete="${setup ? 'new-password' : 'current-password'}"></label>
      ${setup && session.setupTokenRequired ? `<label class="field" for="st">Setup token<input type="password" id="st" class="ltr"></label>` : ''}
      <div class="err" id="err"></div><div class="row"><button class="btn primary" type="submit">${setup ? t('start') : t('login')}</button><span class="spacer"></span><button class="btn sm" type="button" id="lb">${t('lang')}</button></div></form></div>`;
    $('#lb').onclick = () => { lang = lang === 'ar' ? 'en' : 'ar'; set('hamla_lang', lang); boot(); };
    $('#f').onsubmit = async (e) => {
      e.preventDefault();
      try {
        if (setup) await api('/api/setup', { method: 'POST', body: { businessName: $('#b').value, password: $('#pw').value, lang, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, setupToken: $('#st')?.value } });
        else await api('/api/login', { method: 'POST', body: { password: $('#pw').value } });
        location.hash = '#home'; boot();
      } catch (err) { $('#err').textContent = err.message; }
    };
  }
  const PAGES = ['home', 'campaigns', 'contacts', 'replies', 'settings'];
  function shell() {
    const nav = PAGES.map((p) => `<a class="nav" href="#${p}" data-page="${p}">${t(p)}</a>`).join('');
    app.innerHTML = `<div class="shell"><nav class="rail"><div class="brand"><img src="favicon.svg" alt="">Hamla</div>${nav}
      <div class="rail-foot"><button class="nav" id="lb" type="button">${t('lang')}</button><button class="nav" id="lo" type="button">${t('logout')}</button></div></nav>
      <nav class="mobile-nav">${PAGES.slice(0, 4).map((p) => `<a class="nav" href="#${p}" data-page="${p}">${t(p)}</a>`).join('')}</nav><main class="main" id="main"></main></div>`;
    $('#lb').onclick = () => { lang = lang === 'ar' ? 'en' : 'ar'; set('hamla_lang', lang); boot(); };
    $('#lo').onclick = async () => { await api('/api/logout', { method: 'POST', body: {} }); boot(); };
  }
  const page = () => (PAGES.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'home');
  function route() {
    clearInterval(refresh);
    $$('.nav[data-page]').forEach((a) => a.setAttribute('aria-current', a.dataset.page === page() ? 'page' : 'false'));
    ({ home: pHome, campaigns: pCampaigns, contacts: pContacts, replies: pReplies, settings: pSettings }[page()])($('#main'));
  }
  window.addEventListener('hashchange', () => session?.authed && route());

  const funnel = (st) => { const base = Math.max(1, st.sent || st.total); return `<div class="funnel">${[['sent30', st.sent], ['delivered', st.delivered], ['read', st.read], ['replied', st.replied]].map(([k, v]) => `<div><span>${t(k === 'sent30' ? 'total' : k)}</span><i style="width:${Math.max(2, pct(v, base))}%"></i><b>${num(v)}</b></div>`).join('')}</div>`; };

  async function pHome(main) {
    const o = await api('/api/overview');
    main.innerHTML = `<div class="page"><div class="page-head"><h1>${esc(o.businessName || 'Hamla')}</h1><a class="btn primary" href="#campaigns">${t('newCampaign')}</a></div>
      ${o.connected ? '' : `<p class="notice">${t('notConnected')}</p>`}${o.connected && !o.webhookReady ? `<p class="notice">${t('noWebhook')}</p>` : ''}${o.quiet && o.active.length ? `<p class="notice">${t('quiet')}</p>` : ''}
      <div class="grid4"><div class="card stat"><b>${num(o.subscribed)}</b><span>${t('subscribed')} · ${t('optedOutN')} ${num(o.optedOut)}</span></div><div class="card stat"><b>${num(o.joins30)}</b><span>${t('joins30')}</span></div>
        <div class="card stat"><b>${num(o.sent30)}</b><span>${t('sent30')}</span></div><div class="card stat"><b>${pct(o.read30, o.sent30)}%</b><span>${t('read')} · ${t('replied')} ${num(o.replied30)}</span></div></div>
      ${o.active.length ? `<section class="card"><h2>${t('active')}</h2>${o.active.map((c) => `<div class="row"><b>${esc(c.name)}</b>${pill(c.status)}<span class="spacer"></span><span class="small">${num(c.stats.sent)} / ${num(c.stats.total)}</span><button class="btn sm" type="button" data-c="${c.id}">${t('open')}</button></div>`).join('')}</section>` : ''}
      <section class="card"><h2>${t('recent')}</h2>${o.recent.length ? `<div class="table-wrap" style="border:0"><table><thead><tr><th>${t('name')}</th><th>${t('status')}</th><th>${t('total')}</th><th>${t('delivered')}</th><th>${t('read')}</th><th>${t('replied')}</th><th>${t('optOuts')}</th></tr></thead><tbody>
        ${o.recent.map((c) => `<tr data-c="${c.id}" style="cursor:pointer"><td><b>${esc(c.name)}</b><br><span class="small muted">${when(c.startedAt || c.createdAt)}</span></td><td>${pill(c.status)}</td><td class="num">${num(c.stats.total)}</td><td class="num">${pct(c.stats.delivered, c.stats.sent)}%</td><td class="num">${pct(c.stats.read, c.stats.sent)}%</td><td class="num">${num(c.stats.replied)}</td><td class="num">${num(c.stats.optedOut)}</td></tr>`).join('')}</tbody></table></div>` : `<p class="muted">${t('none')}</p>`}</section></div>`;
    $$('[data-c]', main).forEach((b) => (b.onclick = () => openCampaign(b.dataset.c)));
    if (o.active.length) refresh = setInterval(() => { if (page() === 'home' && !document.hidden && !$('dialog')) pHome(main).catch(() => {}); }, 5000);
  }

  async function pCampaigns(main) {
    const [{ campaigns }, tp] = await Promise.all([api('/api/campaigns'), api('/api/templates')]);
    main.innerHTML = `<div class="page"><div class="page-head"><h1>${t('campaigns')}</h1><div class="row"><button class="btn" id="sy" type="button">${t('syncTemplates')}</button><button class="btn primary" id="nc" type="button">${t('newCampaign')}</button></div></div>
      ${tp.templates.length ? `<p class="small muted">${tp.templates.length} · ${t('synced')} ${when(tp.syncedAt)}</p>` : `<p class="notice">${t('noTemplates')}</p>`}
      ${campaigns.length ? `<div class="table-wrap"><table><thead><tr><th>${t('name')}</th><th>${t('template')}</th><th>${t('status')}</th><th>${t('total')}</th><th>${t('delivered')}</th><th>${t('read')}</th><th>${t('replied')}</th></tr></thead><tbody>
      ${campaigns.map((c) => `<tr data-c="${c.id}" style="cursor:pointer"><td><b>${esc(c.name)}</b><br><span class="small muted">${when(c.scheduledAt || c.startedAt || c.createdAt)}</span></td><td class="mono small">${esc(c.template)}</td><td>${pill(c.status)}</td><td class="num">${num(c.stats.total)}</td><td class="num">${num(c.stats.delivered)}</td><td class="num">${num(c.stats.read)}</td><td class="num">${num(c.stats.replied)}</td></tr>`).join('')}</tbody></table></div>` : ''}</div>`;
    $('#sy').onclick = async () => { try { await api('/api/templates/sync', { method: 'POST', body: {} }); toast(t('saved')); pCampaigns(main); } catch (err) { toast(err.message); } };
    $('#nc').onclick = () => newCampaign(tp.templates, () => pCampaigns(main));
    $$('[data-c]', main).forEach((r) => (r.onclick = () => openCampaign(r.dataset.c, () => pCampaigns(main))));
  }

  async function newCampaign(templates, done) {
    if (!templates.length) { toast(t('noTemplates')); return; }
    const { tags } = await api('/api/contacts?status=subscribed');
    const d = dialog(`<form id="cf" class="stack"><h2 style="margin:0">${t('newCampaign')}</h2>
      <div class="grid2"><label class="field">${t('name')}<input type="text" name="name"></label><label class="field">${t('template')}<select name="tpl">${templates.map((x, i) => `<option value="${i}">${esc(x.name)} · ${esc(x.language)} · ${esc(x.category)}</option>`).join('')}</select></label></div>
      <div id="vals" class="stack"></div>
      <div class="field">${t('audience')}<div class="row small"><label class="row"><input type="radio" name="match" value="any" checked> ${t('anyTag')}</label><label class="row"><input type="radio" name="match" value="all"> ${t('allTags')}</label></div><div class="tags">${tags.map((x) => `<label><input type="checkbox" name="tag" value="${esc(x)}"> ${esc(x)}</label>`).join('')}</div><span class="small muted">${t('noTagHint')}</span></div>
      <div class="row"><b>${t('reach')}: <span id="reach">…</span> ${t('people')}</b></div>
      <div class="field">${t('preview')}<div class="phone"><div class="bubble" id="pv"></div></div></div>
      <div class="err" id="ce"></div><div class="row"><button class="btn primary" type="submit">${t('save')}</button><span class="spacer"></span><button class="btn" type="button" data-close>${t('close')}</button></div></form>`, true);
    const f = $('#cf', d);
    const tpl = () => templates[Number(f.tpl.value)];
    const drawVals = () => {
      const x = tpl();
      $('#vals', d).innerHTML = `${x.header?.format === 'IMAGE' ? `<label class="field">${t('image')}<input type="url" name="img" class="ltr" placeholder="https://…"></label>` : ''}${x.vars ? `<p class="small muted" style="margin:0">${t('values')} · ${t('valueHint')}</p>${[...Array(x.vars)].map((_, i) => `<label class="field small">{{${i + 1}}}<input type="text" data-v="${i}" value="${i === 0 ? '{first}' : ''}"></label>`).join('')}` : ''}`;
      $$('[data-v]', d).forEach((i) => (i.oninput = preview));
      preview();
    };
    const preview = () => { const vals = $$('[data-v]', d).map((i) => i.value.replace('{first}', lang === 'ar' ? 'منى' : 'Mona').replace('{name}', lang === 'ar' ? 'منى أحمد' : 'Mona Ahmed')); $('#pv', d).textContent = tpl().text.replace(/\{\{(\d+)\}\}/g, (_, n) => vals[n - 1] || `{{${n}}}`); };
    const audience = () => ({ tags: $$('input[name=tag]:checked', d).map((i) => i.value), match: $('input[name=match]:checked', d).value });
    const reach = async () => { $('#reach', d).textContent = num((await api('/api/audience', { method: 'POST', body: { audience: audience() } })).count); };
    f.tpl.onchange = drawVals;
    $$('input[name=tag], input[name=match]', d).forEach((i) => (i.onchange = reach));
    drawVals(); reach();
    f.onsubmit = async (e) => {
      e.preventDefault();
      try {
        const r = await api('/api/campaigns', { method: 'POST', body: { name: f.name.value, template: tpl().name, language: tpl().language, values: $$('[data-v]', d).map((i) => i.value), headerImage: f.img?.value, audience: audience() } });
        d.close(); done(); openCampaign(r.campaign.id, done);
      } catch (err) { $('#ce', d).textContent = err.message; }
    };
  }

  async function openCampaign(id, done = () => {}) {
    const r = await api('/api/campaigns/' + id);
    const c = r.campaign, s = c.stats;
    const d = dialog(`<div class="stack"><div class="row"><h2 style="margin:0">${esc(c.name)}</h2>${pill(c.status)}<span class="spacer"></span><button class="btn sm" type="button" data-close>${t('close')}</button></div>
      ${c.pauseReason ? `<p class="notice">${esc(c.pauseReason)}</p>` : ''}
      <div class="grid2"><div class="phone"><div class="bubble">${esc(r.preview)}</div></div><div class="stack">${funnel(s)}<div class="row small"><span>${t('queued')} ${num(s.queued)}</span><span>${t('failed')} ${num(s.failed)}</span><span>${t('skipped')} ${num(s.skipped)}</span><span>${t('optOuts')} ${num(s.optedOut)}</span></div>
        <div class="row">${c.status === 'draft' ? `<button class="btn primary" type="button" data-a="start">${t('sendNow')}</button><input type="datetime-local" id="at" style="width:auto"><button class="btn" type="button" data-a="schedule">${t('schedule')}</button>` : ''}
          ${c.status === 'scheduled' ? `<span class="small">${t('scheduleAt')}: ${when(c.scheduledAt)}</span>` : ''}${c.status === 'sending' ? `<button class="btn" type="button" data-a="pause">${t('pause')}</button>` : ''}${c.status === 'paused' ? `<button class="btn primary" type="button" data-a="resume">${t('resume')}</button>` : ''}
          ${['draft', 'scheduled', 'sending', 'paused'].includes(c.status) ? `<button class="btn danger" type="button" data-a="cancel">${t('cancel')}</button>` : ''}</div>
        ${c.status === 'draft' ? `<form class="row" id="tf"><input type="tel" name="to" class="ltr" placeholder="${t('testTo')}" style="width:180px"><button class="btn sm" type="submit">${t('testSend')}</button></form>` : ''}</div></div>
      ${r.messages.length ? `<div class="table-wrap" style="max-height:40vh;overflow:auto"><table><thead><tr><th>${t('name')}</th><th>${t('phone')}</th><th>${t('status')}</th><th>${t('error')}</th></tr></thead><tbody>${r.messages.slice(0, 400).map((m) => `<tr><td>${esc(m.name)}</td><td dir="ltr" style="text-align:start" class="small mono">+${esc(m.phone)}</td><td>${t(m.status === 'sent' ? 'total' : m.status)}${m.replied ? ' 💬' : ''}${m.optedOut ? ' 🚫' : ''}</td><td class="small muted">${esc(m.error)}</td></tr>`).join('')}</tbody></table></div>` : ''}</div>`, true);
    $$('[data-a]', d).forEach((b) => (b.onclick = async () => {
      const a = b.dataset.a;
      if (a === 'cancel' && !confirm(t('cancelQ'))) return;
      if (a === 'start') { const n = (await api('/api/audience', { method: 'POST', body: { audience: c.audience } })).count; if (!confirm(t('startQ').replace('{n}', num(n)))) return; }
      try { await api(`/api/campaigns/${id}/${a}`, { method: 'POST', body: a === 'schedule' ? { at: new Date($('#at', d).value).toISOString() } : {} }); d.close(); done(); openCampaign(id, done); } catch (err) { toast(err.message); }
    }));
    if ($('#tf', d)) $('#tf', d).onsubmit = async (e) => { e.preventDefault(); try { await api('/api/test', { method: 'POST', body: { template: c.template, phone: e.target.to.value, values: c.values.map((v) => v.replace('{first}', 'Test').replace('{name}', 'Test')), headerImage: c.headerImage } }); toast(t('sentTest')); } catch (err) { toast(err.message); } };
    if (c.status === 'sending') { const iv = setInterval(async () => { if (!d.open) return clearInterval(iv); const x = await api('/api/campaigns/' + id); if (x.campaign.status !== 'sending' || x.campaign.stats.sent !== s.sent) { clearInterval(iv); d.close(); openCampaign(id, done); } }, 3000); }
  }

  const cq = { q: '', tag: '', status: '' };
  async function pContacts(main) {
    const r = await api('/api/contacts?' + new URLSearchParams(cq));
    const st = await api('/api/settings');
    main.innerHTML = `<div class="page"><div class="page-head"><h1>${t('contacts')} <span class="muted small">(${num(r.total)})</span></h1><div class="row"><button class="btn primary" id="ac" type="button">${t('addContact')}</button><button class="btn" id="im" type="button">${t('import')}</button><a class="btn" href="/api/contacts.csv">${t('exportCsv')}</a></div></div>
      <section class="card row qrbox"><img src="/qr.svg" alt="QR"><div class="stack" style="flex:1;min-width:220px"><b>${t('joinPage')}</b><span class="small muted">${t('joinHint')}</span><div class="copy"><pre>${esc(st.joinUrl)}</pre><button class="btn sm" type="button" id="cj">${t('copy')}</button></div></div></section>
      <div class="row"><input type="search" id="q" value="${esc(cq.q)}" placeholder="${t('search')}" style="flex:1;min-width:180px"><select id="tg" style="width:auto"><option value="">${t('allTagsF')}</option>${r.tags.map((x) => `<option ${cq.tag === x ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select><select id="st" style="width:auto"><option value="">${t('total')}</option>${['subscribed', 'optedout', 'noconsent'].map((x) => `<option value="${x}" ${cq.status === x ? 'selected' : ''}>${t('s_' + x)}</option>`).join('')}</select></div>
      <div class="table-wrap"><table><thead><tr><th>${t('name')}</th><th>${t('phone')}</th><th>${t('tags')}</th><th>${t('consent')}</th><th></th></tr></thead><tbody>
      ${r.contacts.map((c) => `<tr${c.optedOut ? ' style="opacity:.55"' : ''}><td><b>${esc(c.name || '—')}</b></td><td dir="ltr" style="text-align:start" class="mono small">+${esc(c.phone)}</td><td class="small">${c.tags.map(esc).join('، ')}</td><td class="small">${c.optedOut ? `<span class="pill bad">${t('stop')}</span>` : c.consent ? `${t('c_' + c.consent.source)} · ${esc(c.consent.at.slice(0, 10))}` : `<span class="pill warn">${t('s_noconsent')}</span>`}</td>
        <td><div class="row" style="gap:6px">${!c.optedOut ? `<button class="btn sm" type="button" data-u="${c.id}">${t('unsubscribe')}</button>` : ''}<button class="btn sm danger" type="button" data-d="${c.id}">${t('del')}</button></div></td></tr>`).join('')}</tbody></table></div></div>`;
    let tm;
    $('#q').oninput = () => { clearTimeout(tm); tm = setTimeout(() => { cq.q = $('#q').value; pContacts(main).then(() => { const i = $('#q'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }); }, 300); };
    $('#tg').onchange = () => { cq.tag = $('#tg').value; pContacts(main); };
    $('#st').onchange = () => { cq.status = $('#st').value; pContacts(main); };
    $('#cj').onclick = async () => { try { await navigator.clipboard.writeText(st.joinUrl); toast(t('copied')); } catch { toast(st.joinUrl); } };
    $$('[data-u]', main).forEach((b) => (b.onclick = async () => { await api('/api/contacts/' + b.dataset.u, { method: 'PUT', body: { optedOut: true } }); pContacts(main); }));
    $$('[data-d]', main).forEach((b) => (b.onclick = async () => { await api('/api/contacts/' + b.dataset.d, { method: 'DELETE', body: {} }); pContacts(main); }));
    $('#ac').onclick = () => {
      const d = dialog(`<form id="af" class="stack"><h2 style="margin:0">${t('addContact')}</h2><div class="grid2"><label class="field">${t('phone')}<input type="tel" name="phone" class="ltr" required></label><label class="field">${t('name')}<input type="text" name="name"></label></div><label class="field">${t('tags')}<input type="text" name="tags" placeholder="VIP, …"></label><label class="row small"><input type="checkbox" name="consent" required> ${t('consentQ')}</label><div class="row"><button class="btn primary" type="submit">${t('save')}</button><span class="spacer"></span><button class="btn" type="button" data-close>${t('close')}</button></div></form>`);
      $('#af', d).onsubmit = async (e) => { e.preventDefault(); const f = e.target; try { await api('/api/contacts', { method: 'POST', body: { phone: f.phone.value, name: f.name.value, tags: f.tags.value.split(/[,،]/), consent: f.consent.checked } }); d.close(); pContacts(main); } catch (err) { toast(err.message); } };
    };
    $('#im').onclick = () => {
      const d = dialog(`<form id="if" class="stack"><h2 style="margin:0">${t('import')}</h2><p class="small muted" style="margin:0">${t('importHint')}</p><textarea name="text" rows="8" class="ltr" placeholder="01001234567, Mona, VIP|Online"></textarea><input type="file" accept=".csv,.txt,text/csv" name="file"><label class="field">${t('tagForAll')}<input type="text" name="tag"></label><label class="row small"><input type="checkbox" name="consent" required> ${t('consentQ')}</label><div class="row"><button class="btn primary" type="submit">${t('import')}</button><span class="spacer"></span><button class="btn" type="button" data-close>${t('close')}</button></div></form>`, true);
      $('#if', d).onsubmit = async (e) => { e.preventDefault(); const f = e.target; const text = f.file.files[0] ? await f.file.files[0].text() : f.text.value; try { const r2 = await api(`/api/contacts/import?consent=${f.consent.checked ? 1 : 0}&tag=${encodeURIComponent(f.tag.value)}`, { method: 'POST', raw: text }); toast(t('imported').replace('{a}', r2.added).replace('{u}', r2.updated).replace('{i}', r2.invalid)); d.close(); pContacts(main); } catch (err) { toast(err.message); } };
    };
  }

  async function pReplies(main) {
    const { replies } = await api('/api/replies');
    main.innerHTML = `<div class="page"><div class="page-head"><h1>${t('replies')}</h1></div>${replies.length ? replies.map((r) => `<div class="card row"><b>${esc(r.name || '+' + r.phone)}</b><span class="small muted" dir="ltr">+${esc(r.phone)}</span><span class="small muted">${when(r.at)}</span>${r.stop ? `<span class="pill bad">${t('stop')}</span>` : ''}<span style="flex-basis:100%">${esc(r.text)}</span>${r.stop ? '' : `<a class="btn sm" target="_blank" rel="noopener" href="https://wa.me/${esc(r.phone)}">${t('replyWa')}</a>`}</div>`).join('') : `<div class="card empty">${t('noReplies')}</div>`}</div>`;
  }

  async function pSettings(main) {
    const { settings: s, webhookUrl } = await api('/api/settings');
    main.innerHTML = `<div class="page"><div class="page-head"><h1>${t('settings')}</h1></div><p class="notice small" style="max-width:780px">${t('rules')}</p>
      <form class="card" id="sf" style="max-width:780px"><h2>${t('connection')}</h2><div class="steps"><ol class="small">${t('steps').map((x) => `<li>${esc(x)}</li>`).join('')}</ol></div>
        <div class="grid2"><label class="field">${t('phoneId')}<input type="text" name="phoneNumberId" class="ltr" value="${esc(s.phoneNumberId)}"></label><label class="field">${t('wabaId')}<input type="text" name="wabaId" class="ltr" value="${esc(s.wabaId)}"></label></div>
        <div class="grid2"><label class="field">${t('token')}<input type="password" name="accessToken" class="ltr" value="${esc(s.accessToken)}" autocomplete="off"></label><label class="field">${t('appSecret')}<input type="password" name="appSecret" class="ltr" value="${esc(s.appSecret)}" autocomplete="off"></label></div>
        <div class="grid2"><div class="field">${t('webhookUrl')}<div class="copy"><pre>${esc(webhookUrl)}</pre></div></div><div class="field">${t('verifyToken')}<div class="copy"><pre>${esc(s.verifyToken)}</pre></div></div></div>
        <h2>${t('sending')}</h2><div class="grid4"><label class="field">${t('perMinute')}<input type="number" name="perMinute" min="1" max="600" value="${s.perMinute}"></label><label class="field">${t('quietFrom')}<input type="time" name="quietFrom" value="${esc(s.quietFrom)}"></label><label class="field">${t('quietTo')}<input type="time" name="quietTo" value="${esc(s.quietTo)}"></label><label class="field">${t('countryCode')}<input type="text" name="countryCode" class="ltr" value="${esc(s.countryCode)}"></label></div>
        <h2>${t('joinPage')}</h2><label class="field">${t('biz')}<input type="text" name="businessName" value="${esc(s.businessName)}"></label><label class="field">${t('joinTitle')}<input type="text" name="joinTitle" value="${esc(s.joinTitle)}"></label><label class="field">${t('joinText')}<textarea name="joinText" rows="3">${esc(s.joinText)}</textarea></label>
        <div class="row"><button class="btn primary" type="submit">${t('save')}</button></div></form>
      <form class="card" id="pf" style="max-width:480px"><h2>${t('pwTitle')}</h2><label class="field" for="pc">${t('current')}<input type="password" id="pc" autocomplete="current-password"></label><label class="field" for="pn">${t('next')}<input type="password" id="pn" autocomplete="new-password"></label><div class="err" id="pe"></div><div class="row"><button class="btn primary" type="submit">${t('changePw')}</button></div></form>
      <p class="muted small">Hamla · ${esc(session.version)} · MIT</p></div>`;
    const f = $('#sf');
    f.onsubmit = async (e) => {
      e.preventDefault();
      const body = {};
      for (const k of ['phoneNumberId', 'wabaId', 'accessToken', 'appSecret', 'quietFrom', 'quietTo', 'countryCode', 'businessName', 'joinTitle', 'joinText']) body[k] = f[k].value;
      body.perMinute = Number(f.perMinute.value);
      try { await api('/api/settings', { method: 'PUT', body: { settings: body } }); toast(t('saved')); } catch (err) { toast(err.message); }
    };
    $('#pf').onsubmit = async (e) => { e.preventDefault(); try { await api('/api/password', { method: 'POST', body: { current: $('#pc').value, next: $('#pn').value } }); toast(t('saved')); } catch (err) { $('#pe').textContent = err.message; } };
  }
  boot();
})();
