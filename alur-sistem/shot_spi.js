/**
 * Focused screenshotter untuk inovasi #1 (SPI dari rasio penyelesaian tugas).
 * Login manager → /projects/1 → screenshot full page (header + metrics + EVM chart).
 *
 *   node shot_spi.js
 *
 * Output: alur-sistem/13-projectdetail-spi.png
 */
const { chromium } = require('playwright');
const path = require('path');

const BASE = 'http://localhost:3000';
const OUT  = path.join(__dirname, '13-projectdetail-spi.png');
const W    = 1440;
const H    = 900;

const MANAGER = { email: 'budi@shi.co.id', password: 'password123' };

async function api(method, url, body, token) {
  const r = await fetch(BASE + url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) {
    const txt = await r.text();
    throw new Error(`${method} ${url} → ${r.status}: ${txt.slice(0, 200)}`);
  }
  const json = await r.json();
  return json.data !== undefined ? json.data : json;
}

async function settle(page, extra = 800) {
  try { await page.waitForLoadState('networkidle', { timeout: 10000 }); } catch {}
  await page.evaluate(async () => {
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    const imgs = Array.from(document.images);
    await Promise.all(imgs.map(img => img.complete
      ? Promise.resolve()
      : new Promise(res => { img.onload = img.onerror = () => res(); })));
  });
  await page.waitForTimeout(extra);
}

(async () => {
  // Pilih proyek yang punya tasks (id=1 atau id=2)
  const PROJECT_ID = parseInt(process.argv[2] || '1', 10);

  console.log(`[*] Login as ${MANAGER.email}`);
  const data = await api('POST', '/api/auth/login', MANAGER, null);
  const token = data.token;
  const user  = data.user;
  console.log(`    token len=${token.length}, role=${user.role}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: 2,  // retina-quality screenshot
  });
  const page = await context.newPage();

  await page.goto(BASE + '/login');
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(({ token, user }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }, { token, user });

  console.log(`[*] goto /projects/${PROJECT_ID}`);
  // First-hit compile can take 60-180s on cold Next.js dev. Tolerate it.
  await page.goto(`${BASE}/projects/${PROJECT_ID}`, {
    waitUntil: 'domcontentloaded',
    timeout: 240000,
  });
  await settle(page, 3000);

  // Tunggu sampai chart EVM render
  try {
    await page.waitForSelector('.recharts-surface, svg.recharts-surface',
                               { timeout: 8000 });
  } catch {
    console.log('    [warn] recharts svg not detected, screenshotting anyway');
  }
  await settle(page, 1500);

  await page.screenshot({ path: OUT, fullPage: true });
  console.log(`[ok] saved: ${OUT}`);

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
