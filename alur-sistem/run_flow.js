/**
 * SHI Dashboard – Full 12-step flow screenshotter
 * Usage: node run_flow.js
 * Output: ./01-login.png … ./12-performa.png
 */
const { chromium } = require('playwright');
const path = require('path');
const fs   = require('fs');

const BASE   = 'http://localhost:3000';
const OUT    = __dirname;
const W      = 1440;
const H      = 900;

const MANAGER  = { email: 'budi@shi.co.id',   password: 'password123' };
const TECH     = { email: 'rizky@shi.co.id',  password: 'password123' };

// ── helpers ────────────────────────────────────────────────────────────────
async function ss(page, name) {
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, fullPage: false });
  console.log('  ✓', name);
}

async function api(method, url, body, cookies) {
  const r = await fetch(BASE + url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(cookies ? { Cookie: cookies } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) {
    const txt = await r.text();
    throw new Error(`${method} ${url} → ${r.status}: ${txt.slice(0, 200)}`);
  }
  return r.json();
}

async function login(page, cred) {
  await page.goto(`${BASE}/login`);
  await page.waitForLoadState('networkidle');
  // React controlled inputs – use type() so onChange fires
  const emailInput = page.locator('input[name="email"]');
  const passInput  = page.locator('input[name="password"]');
  await emailInput.click();
  await emailInput.type(cred.email);
  await passInput.click();
  await passInput.type(cred.password);
  await Promise.all([
    page.waitForURL(u => !u.toString().includes('/login'), { timeout: 20000 }),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForLoadState('networkidle');
}

async function getCookies(page) {
  const cookies = await page.context().cookies();
  return cookies.map(c => `${c.name}=${c.value}`).join('; ');
}

// ── wipe slate ─────────────────────────────────────────────────────────────
async function resetDB() {
  const { Pool } = require('pg');
  const pool = new Pool({
    host: '127.0.0.1', port: 5432,
    database: 'shi_dashboard_new',
    user: 'postgres', password: '12345',
  });
  // only wipe project-related data, keep users intact
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

  const browser = await chromium.launch({ headless: false, slowMo: 120 });
  const ctx     = await browser.newContext({ viewport: { width: W, height: H } });
  const page    = await ctx.newPage();

  // ── STEP 1 – Login sebagai Manager ─────────────────────────────────────
  console.log('\n[1] Login Manager');
  await login(page, MANAGER);
  await ss(page, '01-login-manager.png');

  const mCookies = await getCookies(page);

  // ── STEP 2 – Tambah Client ─────────────────────────────────────────────
  console.log('\n[2] Tambah Client');
  const client = await api('POST', '/api/clients', {
    name: 'PT Maju Jaya Sejahtera',
    address: 'Jl. Raya Cihanjuang No. 45, Bandung',
    phone: '022-8812345',
    email: 'info@majujaya.co.id',
    notes: 'Klien prioritas – instalasi smart home 3 lantai',
  }, mCookies);
  console.log('  Client ID:', client.id);

  await page.goto(`${BASE}/clients`);
  await page.waitForLoadState('networkidle');
  await ss(page, '02-tambah-client.png');

  // ── STEP 3 – Tambah Proyek (fase survei) & pilih teknisi ──────────────
  console.log('\n[3] Tambah Proyek + assign teknisi');
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
  }, mCookies);
  console.log('  Project ID:', project.id);

  // get technician id
  const users = await api('GET', '/api/users/technicians', null, mCookies);
  const tech  = users.find(u => u.email === TECH.email);
  console.log('  Tech ID:', tech.id);

  // assign technician
  await api('POST', `/api/projects/${project.id}/assignments`, {
    user_id: tech.id, role: 'technician',
  }, mCookies);

  await page.goto(`${BASE}/projects/${project.id}`);
  await page.waitForLoadState('networkidle');
  await ss(page, '03-proyek-survei-teknisi.png');

  // ── STEP 4 – Buat task detail survei ──────────────────────────────────
  console.log('\n[4] Buat task survei');
  const surveyTasks = [
    'Survei kondisi bangunan & layout instalasi',
    'Identifikasi titik instalasi sensor & panel',
    'Estimasi kebutuhan kabel & material',
  ];
  const dueDate = new Date(); dueDate.setDate(dueDate.getDate() + 5);
  const tIds = [];
  for (const title of surveyTasks) {
    const t = await api('POST', '/api/tasks', {
      project_id: project.id,
      title,
      description: `Detail survei: ${title}`,
      assigned_to: tech.id,
      status: 'to_do',
      due_date: fmt(dueDate),
    }, mCookies);
    tIds.push(t.id);
  }

  await page.reload();
  await page.waitForLoadState('networkidle');
  await ss(page, '04-task-survei-dibuat.png');

  // ── STEP 5 – Teknisi login, cek task real-time ─────────────────────────
  console.log('\n[5] Teknisi cek task');
  const techPage = await ctx.newPage();
  await login(techPage, TECH);
  await techPage.waitForLoadState('networkidle');
  await ss(techPage, '05-teknisi-dashboard.png');

  await techPage.goto(`${BASE}/technician/tasks`);
  await techPage.waitForLoadState('networkidle');
  await ss(techPage, '05b-teknisi-cek-task.png');

  const tCookies = await getCookies(techPage);

  // ── STEP 6 – Teknisi update task (working_on_it → done) ────────────────
  console.log('\n[6] Teknisi update task survei');
  // mark all survey tasks working_on_it then the first done
  await api('PATCH', `/api/tasks/${tIds[0]}/status`, { status: 'working_on_it' }, tCookies);
  await api('PATCH', `/api/tasks/${tIds[1]}/status`, { status: 'working_on_it' }, tCookies);
  await api('PATCH', `/api/tasks/${tIds[2]}/status`, { status: 'working_on_it' }, tCookies);

  await techPage.reload();
  await techPage.waitForLoadState('networkidle');
  await ss(techPage, '06-teknisi-update-task.png');

  // Buat eskalasi
  const esc = await api('POST', '/api/escalations', {
    project_id: project.id,
    task_id: tIds[0],
    title: 'Temuan kendala kabel existing tidak sesuai spesifikasi',
    description: 'Kabel listrik existing menggunakan ukuran 1.5mm², perlu upgrade ke 2.5mm² untuk beban smart home.',
    priority: 'high',
  }, tCookies);
  console.log('  Escalation ID:', esc.id);

  await techPage.goto(`${BASE}/technician/projects`);
  await techPage.waitForLoadState('networkidle');
  await ss(techPage, '06b-eskalasi-dibuat.png');

  // ── STEP 7 – Manager approved survei & buat task proyek ─────────────────
  console.log('\n[7] Manager approve survei + buat task proyek');
  await api('POST', `/api/projects/${project.id}/approve-survey`, {}, mCookies);

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
  for (const title of projectTasks) {
    const t = await api('POST', '/api/tasks', {
      project_id: project.id,
      title,
      description: `Pekerjaan utama: ${title}`,
      assigned_to: tech.id,
      status: 'to_do',
      due_date: fmt(projDue),
    }, mCookies);
    projTIds.push(t.id);
  }

  // Add materials & budget
  await api('POST', `/api/materials`, {
    project_id: project.id,
    name: 'Kabel NYM 2.5mm²', quantity: 200, unit: 'meter', unit_price: 8500, notes: 'Kabel utama instalasi',
  }, mCookies);
  await api('POST', `/api/materials`, {
    project_id: project.id,
    name: 'Smart Switch Zigbee', quantity: 24, unit: 'unit', unit_price: 350000, notes: 'Switch otomatis per ruangan',
  }, mCookies);
  await api('POST', `/api/budget`, {
    project_id: project.id,
    description: 'Material & komponen smart home', category: 'material', amount: 45000000,
  }, mCookies);
  await api('POST', `/api/budget`, {
    project_id: project.id,
    description: 'Biaya tenaga kerja instalasi', category: 'labor', amount: 35000000,
  }, mCookies);

  await page.goto(`${BASE}/projects/${project.id}`);
  await page.waitForLoadState('networkidle');
  await ss(page, '07-survei-approved-task-proyek.png');

  // ── STEP 8 – Teknisi cek + update task proyek + eskalasi ────────────────
  console.log('\n[8] Teknisi update task proyek & eskalasi');
  await api('PATCH', `/api/tasks/${projTIds[0]}/status`, { status: 'working_on_it' }, tCookies);
  await api('PATCH', `/api/tasks/${projTIds[1]}/status`, { status: 'working_on_it' }, tCookies);
  await api('PATCH', `/api/tasks/${projTIds[2]}/status`, { status: 'working_on_it' }, tCookies);

  await techPage.goto(`${BASE}/technician/tasks`);
  await techPage.waitForLoadState('networkidle');
  await ss(techPage, '08-teknisi-update-task-proyek.png');

  // ── STEP 9 – Manager done all tasks ────────────────────────────────────
  console.log('\n[9] Manager selesaikan semua task');
  // survey tasks done
  for (const id of tIds) {
    await api('PATCH', `/api/tasks/${id}/status`, { status: 'done' }, mCookies);
  }
  // project tasks: mark most done
  for (const id of projTIds.slice(0, 5)) {
    await api('PATCH', `/api/tasks/${id}/status`, { status: 'working_on_it' }, tCookies);
    await api('PATCH', `/api/tasks/${id}/status`, { status: 'done' }, mCookies);
  }
  // resolve escalation
  await api('PATCH', `/api/escalations/${esc.id}/resolve`, {
    resolution: 'Upgrade kabel 2.5mm² disetujui & sudah dilaksanakan',
  }, mCookies);

  await page.goto(`${BASE}/projects/${project.id}`);
  await page.waitForLoadState('networkidle');
  await ss(page, '09-task-selesai-manager.png');

  // ── STEP 10 – Dashboard EWS + SPI + Health ─────────────────────────────
  console.log('\n[10] Dashboard EWS / SPI / Health');
  await page.goto(`${BASE}/dashboard`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500); // let charts render
  await ss(page, '10-dashboard-ews-spi-health.png');

  // scroll down to see charts
  await page.evaluate(() => window.scrollBy(0, 500));
  await page.waitForTimeout(600);
  await ss(page, '10b-dashboard-charts.png');

  // ── STEP 11 – Cek report (Manager) ─────────────────────────────────────
  console.log('\n[11] Manager cek report proyek');
  await page.goto(`${BASE}/projects/${project.id}`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  await ss(page, '11-report-proyek.png');

  // scroll to budget/materials section
  await page.evaluate(() => window.scrollBy(0, 600));
  await page.waitForTimeout(400);
  await ss(page, '11b-report-budget-material.png');

  // ── STEP 12 – Performa teknisi ──────────────────────────────────────────
  console.log('\n[12] Dashboard performa teknisi');
  await page.goto(`${BASE}/dashboard`);
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => window.scrollBy(0, 1000));
  await page.waitForTimeout(800);
  await ss(page, '12-performa-teknisi.png');

  // Technician view
  await techPage.goto(`${BASE}/technician`);
  await techPage.waitForLoadState('networkidle');
  await techPage.waitForTimeout(800);
  await ss(techPage, '12b-teknisi-performa.png');

  // ── done ───────────────────────────────────────────────────────────────
  await browser.close();
  console.log('\n✅ Semua screenshot tersimpan di:', OUT);
  const files = fs.readdirSync(OUT).filter(f => f.endsWith('.png')).sort();
  files.forEach(f => console.log('  ', f));
}

main().catch(e => { console.error(e); process.exit(1); });
