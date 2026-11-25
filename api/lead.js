// Заявка з форми → контакт-центр 3333.
// Куди саме передавати (CRM, бот, пошта) вирішує проєкт розробки: див. HANDOFF.md.
// Поки LEAD_WEBHOOK_URL не задано, функція відповідає 503, і сторінка показує
// стан «Не вдалося надіслати заявку… телефонуй 3333» зі збереженими даними.
const DIRS = ['Інструктори', 'Дрілл-сержанти', 'Офіцерські посади', 'Забезпечення', 'Потрібна консультація'];
const STATUS = ['Військовий', 'Цивільний'];

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ ok: false }); }
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = null; } }
  if (!b || typeof b !== 'object') return res.status(400).json({ ok: false, error: 'bad_json' });
  if (b.company) return res.status(200).json({ ok: true }); // пастка для ботів

  const name = String(b.name || '').trim().slice(0, 120);
  const phone = '+' + String(b.phone || '').replace(/\D/g, '');
  const email = String(b.email || '').trim().slice(0, 200);
  const direction = DIRS.includes(b.direction) ? b.direction : 'Потрібна консультація';
  const status = STATUS.includes(b.status) ? b.status : '';
  const errors = [];
  if (name.length < 2) errors.push('name');
  if (phone.length !== 13) errors.push('phone');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('email');
  if (b.consent !== true) errors.push('consent');
  if (errors.length) return res.status(422).json({ ok: false, errors });

  const url = process.env.LEAD_WEBHOOK_URL;
  if (!url) return res.status(503).json({ ok: false, error: 'not_configured' });

  const lead = { name, phone, email, direction, status, page: b.page === 'mobile' ? 'mobile' : 'desktop', at: new Date().toISOString(), source: 'kapa-landing' };
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, process.env.LEAD_WEBHOOK_TOKEN ? { Authorization: 'Bearer ' + process.env.LEAD_WEBHOOK_TOKEN } : {}),
      body: JSON.stringify(lead),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) throw new Error('upstream ' + r.status);
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('lead forward failed', e.message); // без персональних даних у логах
    return res.status(502).json({ ok: false, error: 'upstream' });
  }
};
