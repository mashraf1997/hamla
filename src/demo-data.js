import crypto from 'node:crypto';
import { defaultData } from './app.js';

// A café with a few hundred subscribers, approved templates and three past campaigns.
// Phone numbers are in the 555-01xx range reserved for fiction; the demo never sends anything.
export function buildDemo(demo) {
  const ar = demo.lang === 'ar';
  const d = defaultData(demo.lang);
  Object.assign(d.settings, { businessName: ar ? 'بين كافيه' : 'Bean Café', countryCode: '20', joinTitle: ar ? 'عروض بين كافيه على واتساب ☕' : 'Bean Café offers on WhatsApp ☕', tags: ar ? ['عملاء دائمين', 'أونلاين', 'VIP', 'المعادي', 'الزمالك'] : ['Regulars', 'Online', 'VIP', 'Downtown', 'Riverside'] });
  const tags = d.settings.tags;
  d.templates = ar
    ? [{ name: 'weekly_offer', language: 'ar', category: 'MARKETING', text: 'أهلاً {{1}} ☕ عرض الأسبوع في بين كافيه: {{2}}. العرض لحد {{3}}. لو مش عايز رسايل تانية ابعت «إلغاء».', vars: 3, header: null },
       { name: 'new_branch', language: 'ar', category: 'MARKETING', text: 'أهلاً {{1}}! افتتحنا فرع جديد في {{2}} 🎉 أول مشروب علينا لما تزورنا.', vars: 2, header: { format: 'IMAGE', text: '' } },
       { name: 'order_ready', language: 'ar', category: 'UTILITY', text: 'طلبك رقم {{1}} جاهز للاستلام. شكراً يا {{2}}!', vars: 2, header: null }]
    : [{ name: 'weekly_offer', language: 'en', category: 'MARKETING', text: 'Hi {{1}} ☕ This week at Bean Café: {{2}}. Valid until {{3}}. Reply STOP to unsubscribe.', vars: 3, header: null },
       { name: 'new_branch', language: 'en', category: 'MARKETING', text: 'Hi {{1}}! We opened a new branch in {{2}} 🎉 Your first drink is on us.', vars: 2, header: { format: 'IMAGE', text: '' } },
       { name: 'order_ready', language: 'en', category: 'UTILITY', text: 'Your order {{1}} is ready to collect. Thank you, {{2}}!', vars: 2, header: null }];
  d.templatesAt = new Date().toISOString();
  const first = ar ? ['منى', 'كريم', 'سارة', 'يوسف', 'نور', 'هدى', 'عمر', 'ليلى', 'آدم', 'جنى', 'مريم', 'زياد', 'فرح', 'حسن', 'دينا'] : ['Mona', 'Karim', 'Sara', 'Youssef', 'Nour', 'Hoda', 'Omar', 'Layla', 'Adam', 'Jana', 'Mariam', 'Ziad', 'Farah', 'Hassan', 'Dina'];
  const last = ar ? ['أحمد', 'عادل', 'محمود', 'علي', 'حسن', 'سمير', 'خالد', 'طارق'] : ['Ahmed', 'Adel', 'Mahmoud', 'Ali', 'Hassan', 'Samir', 'Khaled', 'Tarek'];
  let seed = 21;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const sources = ['form', 'form', 'import', 'manual'];
  for (let i = 0; i < 260; i++) {
    const created = new Date(Date.now() - Math.floor(rnd() * 120) * 864e5).toISOString();
    const t = [tags[Math.floor(rnd() * 2)], rnd() < 0.15 ? tags[2] : '', rnd() < 0.5 ? tags[3] : tags[4]].filter(Boolean);
    d.contacts.push({ id: crypto.randomUUID(), phone: '1' + ['202', '212', '312', '415', '617'][i % 5] + '55501' + String(Math.floor(i / 5) % 100).padStart(2, '0'), name: rnd() < 0.85 ? `${first[i % first.length]} ${last[Math.floor(rnd() * last.length)]}` : '', tags: [...new Set(t)], consent: rnd() < 0.96 ? { source: sources[Math.floor(rnd() * sources.length)], at: created, note: '' } : null, optedOut: false, optedOutAt: null, lastMessageAt: null, createdAt: created });
  }
  const camp = (name, tpl, values, daysAgo, audTags) => {
    const at = new Date(Date.now() - daysAgo * 864e5);
    const c = { id: crypto.randomUUID(), name, template: tpl, language: demo.lang, values, headerImage: '', audience: { tags: audTags, match: 'any' }, status: 'done', scheduledAt: null, createdAt: at.toISOString(), startedAt: at.toISOString(), finishedAt: new Date(at.getTime() + 20 * 60_000).toISOString() };
    d.campaigns.push(c);
    for (const ct of d.contacts.filter((x) => x.consent && !x.optedOut && (!audTags.length || audTags.some((t) => x.tags.includes(t))) && Date.parse(x.createdAt) < at.getTime())) {
      const r = rnd();
      const status = r < 0.04 ? 'failed' : r < 0.12 ? 'sent' : r < 0.42 ? 'delivered' : 'read';
      const m = { id: crypto.randomUUID(), campaignId: c.id, contactId: ct.id, phone: ct.phone, waId: 'wamid.demo.' + crypto.randomBytes(5).toString('hex'), status, error: status === 'failed' ? (ar ? 'الرقم مش على واتساب' : 'Not a WhatsApp number') : '', at: c.startedAt, updatedAt: c.finishedAt, replied: status === 'read' && rnd() < 0.14, optedOut: false };
      if (status === 'read' && rnd() < 0.025) { m.replied = true; m.optedOut = true; ct.optedOut = true; ct.optedOutAt = c.finishedAt; }
      ct.lastMessageAt = c.startedAt;
      d.messages.push(m);
      if (m.replied) d.replies.push({ id: crypto.randomUUID(), contactId: ct.id, phone: ct.phone, text: m.optedOut ? (ar ? 'إلغاء' : 'STOP') : (ar ? ['تمام شكراً 🙏', 'العرض ده متاح في فرع الزمالك؟', 'ممكن أحجز ترابيزة يوم الجمعة؟', '❤️', 'الأسعار كام؟'] : ['Thanks 🙏', 'Is this at the Riverside branch?', 'Can I book a table on Friday?', '❤️', 'How much?'])[Math.floor(rnd() * 5)], at: new Date(Date.parse(c.finishedAt) + Math.floor(rnd() * 600) * 60_000).toISOString(), stop: m.optedOut });
    }
  };
  camp(ar ? 'عرض الويك إند' : 'Weekend offer', 'weekly_offer', ar ? ['{first}', 'أي مشروب ساقع + كيك بـ 99 جنيه', 'الأحد'] : ['{first}', 'any iced drink + cake for $6', 'Sunday'], 24, []);
  camp(ar ? 'افتتاح فرع الزمالك' : 'Riverside opening', 'new_branch', ar ? ['{first}', 'الزمالك'] : ['{first}', 'Riverside'], 12, [tags[4], tags[2]]);
  camp(ar ? 'عرض الأسبوع' : 'This week', 'weekly_offer', ar ? ['{first}', 'تاني قهوة بنص التمن', 'الخميس'] : ['{first}', 'second coffee half price', 'Thursday'], 3, [tags[0]]);
  d.campaigns.push({ id: crypto.randomUUID(), name: ar ? 'عرض رمضان' : 'Holiday offer', template: 'weekly_offer', language: demo.lang, values: ar ? ['{first}', 'سحور لاتنين بـ 250 جنيه', 'آخر الشهر'] : ['{first}', 'brunch for two at $25', 'month end'], headerImage: '', audience: { tags: [], match: 'any' }, status: 'draft', scheduledAt: null, createdAt: new Date().toISOString(), startedAt: null, finishedAt: null });
  return d;
}
