/**
 * SHI Dashboard – 12-step flow screenshotter
 *
 * Steps (verbatim from user's alur.md):
 *   1.  nambah client
 *   2.  nambah proyek
 *   3.  harus survei pilih teknisi
 *   4.  buat task detail survei
 *   5.  teknisi cek task real-time
 *   6.  teknisi survei trs update task
 *   7.  manager approved survei lanjut proyek; buat task proyek
 *   8.  teknisi cek; update task eskalasi
 *   9.  manager done the task til clear
 *   10. dashboard ews; spi; health stats updated
 *   11. cek report (manager)
 *   12. cek performa
 *
 * Auth: API login → inject token into localStorage. Manager and technician
 * each get their OWN browser context so localStorage doesn't collide.
 */
const { chromium } = require('playwright');
const path = require('path');
const fs   = require('fs');

const BASE = 'http://localhost:3000';
const OUT  = __dirname;
const W    = 1440;
const H    = 900;

const MANAGER = { email: 'budi@shi.co.id',  password: 'password123' };
const TECH    = { email: 'rizky@shi.co.id', password: 'password123' };

// ── helpers ────────────────────────────────────────────────────────────────
async function settle(page, extra = 500) {
  try { await page.waitForLoadState('networkidle', { timeout: 10000 }); } catch {}
  await page.evaluate(async () => {
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    const imgs = Array.from(document.images);
    await Promise.all(imgs.map(img => img.complete
      ? Promise.resolve()
      : new Promise(res => { img.onload = img.onerror = () => res(); })));
    const start = Date.now();
    const isLoading = () => document.querySelector(
      '.animate-pulse, [data-loading="true"], [aria-busy="true"]'
    );
    while (isLoading() && Date.now() - start < 3000) {
      await new Promise(r => setTimeout(r, 100));
    }
  });
  await page.waitForTimeout(extra);
}

async function ss(page, name, extra) {
  await settle(page, extra);
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, fullPage: false });
  console.log('  ✓', name);
}

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

async function apiForm(method, url, fields, token) {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined && v !== null) form.append(k, String(v));
  }
  const r = await fetch(BASE + url, {
    method,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: form,
  });
  if (!r.ok) {
    const txt = await r.text();
    throw new Error(`${method} ${url} → ${r.status}: ${txt.slice(0, 200)}`);
  }
  const json = await r.json();
  return json.data !== undefined ? json.data : json;
}

/**
 * Login via API → inject token+user into the page's localStorage → navigate.
 * The page's browser context is isolated so this does NOT touch any other
 * context's localStorage.
 */
async function login(page, cred, dest) {
  const data  = await api('POST', '/api/auth/login', cred, null);
  const token = data.token;
  const user  = data.user;

  await page.goto(BASE + '/login');
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(({ token, user }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }, { token, user });

  await page.goto(BASE + dest);
  return token;
}

// ── wipe slate ─────────────────────────────────────────────────────────────
async function resetDB() {
  const { Pool } = require('pg');
  const pool = new Pool({
    host: '127.0.0.1', port: 5432,
    database: 'shi_dashboard_new',
    user: 'postgres', password: '12345',
  });
  await pool.query(`
    TRUNCATE escalations, task_evidence, task_activities, tasks,
             project_health, project_assignments, materials, budget_items,
             projects, clients
    RESTART IDENTITY CASCADE
  `);
  await pool.end();
  console.log('DB reset done (users preserved)');
}

// ══════════════════════════════════════════════════════════════════════════
async function main() {
  await resetDB();

  const browser = await chromium.launch({ headless: false, slowMo: 80 });

  // Two ISOLATED browser contexts — separate localStorage per role.
  const mCtx = await browser.newContext({ viewport: { width: W, height: H } });
  const tCtx = await browser.newContext({ viewport: { width: W, height: H } });
  const mPage = await mCtx.newPage();
  const tPage = await tCtx.newPage();

  // Pre-auth both pages (silently — no screenshot for login).
  console.log('\n[auth] Manager + Teknisi');
  const mToken = await login(mPage, MANAGER, '/dashboard');
  const tToken = await login(tPage, TECH, '/my-dashboard');
  await settle(mPage);
  await settle(tPage);

  // ── STEP 1 – Nambah client ─────────────────────────────────────────────
  console.log('\n[1] Nambah client');
  const client = await api('POST', '/api/clients', {
    name: 'PT Maju Jaya Sejahtera',
    address: 'Jl. Raya Cihanjuang No. 45, Bandung',
    phone: '022-8812345',
    email: 'info@majujaya.co.id',
    notes: 'Klien prioritas – instalasi smart home 3 lantai',
  }, mToken);
  console.log('  Client ID:', client.id);

  await mPage.goto(`${BASE}/clients`);
  await ss(mPage, '01-nambah-client.png', 800);

  // ── STEP 2 – Nambah proyek (fase survei) ───────────────────────────────
  console.log('\n[2] Nambah proyek (fase survei)');
  const startDate = new Date(); startDate.setDate(startDate.getDate() + 1);
  const endDate   = new Date(); endDate.setDate(endDate.getDate() + 30);
  const fmt = d => d.toISOString().split('T')[0];

  const project = await api('POST', '/api/projects', {
    name: 'Instalasi Smart Home – PT Maju Jaya',
    description: 'Pemasangan sistem smart home lengkap 3 lantai: lighting, security, HVAC automation',
    client_id: client.id,
    start_date: fmt(startDate),
    end_date: fmt(endDate),
    status: 'active',
    phase: 'survey',
    project_value: 125000000,
    survey_approved: false,
  }, mToken);
  console.log('  Project ID:', project.id);

  await mPage.goto(`${BASE}/projects`);
  await ss(mPage, '02-nambah-proyek.png', 800);

  // ── STEP 3 – Harus survei + pilih teknisi ──────────────────────────────
  console.log('\n[3] Survei phase + pilih teknisi');
  const users = await api('GET', '/api/users/technicians', null, mToken);
  const tech  = users.find(u => u.email === TECH.email);
  console.log('  Tech ID:', tech.id);

  await api('POST', `/api/projects/${project.id}/assignments`, {
    user_id: tech.id, role: 'technician',
  }, mToken);

  // navigate, then a reload to pick up the freshly-saved assignment
  await mPage.goto(`${BASE}/projects/${project.id}`);
  await mPage.reload();
  await ss(mPage, '03-pilih-teknisi.png', 1000);

  // ── STEP 4 – Buat task detail survei ───────────────────────────────────
  console.log('\n[4] Buat task survei');
  const surveyTasks = [
    'Survei kondisi bangunan & layout instalasi',
    'Identifikasi titik instalasi sensor & panel',
    'Estimasi kebutuhan kabel & material',
  ];
  const dueDate = new Date(); dueDate.setDate(dueDate.getDate() + 5);
  const tIds = [];
  for (const name of surveyTasks) {
    const t = await api('POST', '/api/tasks', {
      project_id: project.id,
      name,
      description: `Detail survei: ${name}`,
      assigned_to: tech.id,
      status: 'to_do',
      due_date: fmt(dueDate),
      is_survey_task: true,
    }, mToken);
    tIds.push(t.id);
  }

  await mPage.reload();
  await ss(mPage, '04-task-survei-dibuat.png', 1000);

  // ── STEP 5 – Teknisi cek task real-time ────────────────────────────────
  console.log('\n[5] Teknisi cek task real-time');
  await tPage.goto(`${BASE}/my-tasks`);
  await ss(tPage, '05-teknisi-cek-task.png', 1000);

  // ── STEP 6 – Teknisi survei → update task ──────────────────────────────
  console.log('\n[6] Teknisi update task survei');
  await api('PATCH', `/api/tasks/${tIds[0]}/status`, { status: 'in_progress' }, tToken);
  await api('PATCH', `/api/tasks/${tIds[1]}/status`, { status: 'in_progress' }, tToken);
  await api('PATCH', `/api/tasks/${tIds[2]}/status`, { status: 'in_progress' }, tToken);

  await tPage.reload();
  await ss(tPage, '06-teknisi-update-task.png', 1000);

  // ── STEP 7 – Manager approve survei + buat task proyek ─────────────────
  console.log('\n[7] Manager approve survei + buat task proyek');
  // Manager marks all survey tasks done, then approves
  for (const id of tIds) {
    await api('PATCH', `/api/tasks/${id}/status`, { status: 'done' }, mToken);
  }
  await api('POST', `/api/projects/${project.id}/approve-survey`, {}, mToken);

  const projectTasks = [
    'Pemasangan panel kontrol utama lantai 1',
    'Instalasi sensor gerak & pencahayaan otomatis',
    'Konfigurasi sistem HVAC automation',
    'Pemasangan kamera keamanan & NVR',
    'Pengujian integrasi seluruh sistem',
    'Pelatihan operasional kepada pengguna',
  ];
  const projDue = new Date(); projDue.setDate(projDue.getDate() + 20);
  const projTIds = [];
  for (const name of projectTasks) {
    const t = await api('POST', '/api/tasks', {
      project_id: project.id,
      name,
      description: `Pekerjaan utama: ${name}`,
      assigned_to: tech.id,
      status: 'to_do',
      due_date: fmt(projDue),
    }, mToken);
    projTIds.push(t.id);
  }

  // materials & budget
  await api('POST', `/api/materials`, {
    project_id: project.id, name: 'Kabel NYM 2.5mm²',
    quantity: 200, unit: 'meter', unit_price: 8500, notes: 'Kabel utama instalasi',
  }, mToken);
  await api('POST', `/api/materials`, {
    project_id: project.id, name: 'Smart Switch Zigbee',
    quantity: 24, unit: 'unit', unit_price: 350000, notes: 'Switch otomatis per ruangan',
  }, mToken);
  await api('POST', `/api/budget`, {
    project_id: project.id,
    description: 'Material & komponen smart home', category: 'material', amount: 45000000,
  }, mToken);
  await api('POST', `/api/budget`, {
    project_id: project.id,
    description: 'Biaya tenaga kerja instalasi', category: 'labor', amount: 35000000,
  }, mToken);

  await mPage.goto(`${BASE}/projects/${project.id}`);
  await ss(mPage, '07-manager-approve-task-proyek.png', 1000);

  // ── STEP 8 – Teknisi cek + update task + eskalasi ──────────────────────
  console.log('\n[8] Teknisi update task + eskalasi');
  await api('PATCH', `/api/tasks/${projTIds[0]}/status`, { status: 'in_progress' }, tToken);
  await api('PATCH', `/api/tasks/${projTIds[1]}/status`, { status: 'in_progress' }, tToken);
  await api('PATCH', `/api/tasks/${projTIds[2]}/status`, { status: 'in_progress' }, tToken);

  // eskalasi (per user's flow this belongs in step 8, not 6)
  const esc = await apiForm('POST', '/api/escalations', {
    task_id: projTIds[0],
    title: 'Temuan kendala kabel existing tidak sesuai spesifikasi',
    description: 'Kabel listrik existing menggunakan ukuran 1.5mm², perlu upgrade ke 2.5mm² untuk beban smart home.',
    priority: 'high',
  }, tToken);
  console.log('  Escalation ID:', esc.id);

  await tPage.goto(`${BASE}/my-tasks`);
  await ss(tPage, '08-teknisi-update-eskalasi.png', 1000);

  // ── STEP 9 – Manager selesaikan semua task & resolve eskalasi ──────────
  console.log('\n[9] Manager selesaikan semua task');
  for (const id of projTIds.slice(0, 5)) {
    await api('PATCH', `/api/tasks/${id}/status`, { status: 'done' }, mToken);
  }
  await api('PATCH', `/api/escalations/${esc.id}/resolve`, {
    resolution_notes: 'Upgrade kabel 2.5mm² disetujui & sudah dilaksanakan',
  }, mToken);

  await mPage.goto(`${BASE}/projects/${project.id}`);
  await ss(mPage, '09-manager-task-selesai.png', 1200);

  // ── STEP 10 – Dashboard EWS / SPI / Health ─────────────────────────────
  console.log('\n[10] Dashboard EWS / SPI / Health');
  await mPage.goto(`${BASE}/dashboard`);
  await ss(mPage, '10-dashboard-ews-spi-health.png', 1500);

  await mPage.evaluate(() => window.scrollBy(0, 500));
  await ss(mPage, '10b-dashboard-charts.png', 1200);

  // ── STEP 11 – Cek report (Manager) ─────────────────────────────────────
  console.log('\n[11] Manager cek report');
  await mPage.goto(`${BASE}/projects/${project.id}`);
  await ss(mPage, '11-report-proyek.png', 1000);

  await mPage.evaluate(() => window.scrollBy(0, 600));
  await ss(mPage, '11b-report-budget-material.png', 800);

  // ── STEP 12 – Cek performa ─────────────────────────────────────────────
  console.log('\n[12] Cek performa');
  await mPage.goto(`${BASE}/dashboard`);
  await mPage.evaluate(() => window.scrollBy(0, 1000));
  await ss(mPage, '12-performa-teknisi-manager.png', 1200);

  await tPage.goto(`${BASE}/my-dashboard`);
  await ss(tPage, '12b-performa-teknisi-self.png', 1200);

  // ── done ───────────────────────────────────────────────────────────────
  await browser.close();
  console.log('\n✅ Semua screenshot tersimpan di:', OUT);
  const files = fs.readdirSync(OUT).filter(f => f.endsWith('.png')).sort();
  files.forEach(f => console.log('  ', f));
}

main().catch(e => { console.error(e); process.exit(1); });
