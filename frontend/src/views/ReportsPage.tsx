import { useState, useCallback, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useDashboard } from '../hooks/useDashboard';
import { useProjects, useUpdateProject, useDeleteProject } from '../hooks/useProjects';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import * as XLSX from 'xlsx';
import { getReportActivity, type ReportActivityData, type ReportActivityProject } from '../services/api';
import type { DashboardProject, DashboardSummary, UpdateProjectData } from '../types';

type ReportType = 'summary' | 'health' | 'tasks' | 'activity';

const REPORT_TABS: { key: ReportType; label: string; icon: string }[] = [
  { key: 'summary', label: 'Project Summary', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { key: 'health', label: 'Health Status', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  { key: 'tasks', label: 'Task Completion', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { key: 'activity', label: 'Aktivitas (Periode)', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatRupiah(n: number) {
  return `Rp ${n.toLocaleString('id-ID')}`;
}

function HealthBadge({ status }: { status: string | null }) {
  const cls = status === 'red' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
    : status === 'amber' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
    : status === 'green' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400';
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${cls}`}>{status ?? 'N/A'}</span>;
}

function StatusSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => { e.stopPropagation(); onChange(e.target.value); }}
      onClick={(e) => e.stopPropagation()}
      className="text-[11px] border border-gray-300 dark:border-gray-600 rounded px-1.5 py-0.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
    >
      <option value="active">Active</option>
      <option value="completed">Completed</option>
      <option value="on-hold">On Hold</option>
      <option value="cancelled">Cancelled</option>
    </select>
  );
}

function PhaseSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => { e.stopPropagation(); onChange(e.target.value); }}
      onClick={(e) => e.stopPropagation()}
      className="text-[11px] border border-gray-300 dark:border-gray-600 rounded px-1.5 py-0.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
    >
      <option value="survey">Survey</option>
      <option value="execution">Execution</option>
    </select>
  );
}

function ActionButtons({ project, onView, onEdit, onDelete }: { project: DashboardProject; onView: () => void; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <button onClick={onView} title="View Detail" className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      </button>
      <button onClick={onEdit} title="Quick Edit" className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>
      <button onClick={onDelete} title="Hapus" className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}

// ── Formal company report ────────────────────────────────────────────────────
// Company identity for the letterhead (kop surat). Domain matches the app's
// seed emails (*@shi.co.id); address is the case-study HQ in Yogyakarta.
const COMPANY = {
  name: 'PT SMART HOME INOVASI',
  tagline: 'Smart Home & IoT Solutions',
  address: 'Jl. Ringroad Utara No. 88, Condongcatur, Depok, Sleman, Yogyakarta 55281',
  phone: '(0274) 884-200',
  email: 'info@shi.co.id',
  web: 'www.shi.co.id',
};

const HEALTH_LABEL: Record<string, string> = { green: 'Sehat', amber: 'Waspada', red: 'Kritis' };
const STATUS_LABEL: Record<string, string> = { active: 'Aktif', completed: 'Selesai', 'on-hold': 'Tertunda', cancelled: 'Dibatalkan' };
const PHASE_LABEL: Record<string, string> = { survey: 'Survei', execution: 'Pengerjaan' };

function escapeHtml(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

type PeriodWindow = { startYmd: string; endYmd: string; range: string; label: string };

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function ymdToDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

const fmtId = (d: Date) => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

const lastOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();

/**
 * Build a report window straight from a free [start, end] date range and derive
 * a friendly label: a single day -> "Harian", a Mon–Sun span -> "Mingguan",
 * a full calendar month -> "Bulanan", anything else -> "Rentang Kustom".
 */
function computeRangeWindow(startYmd: string, endYmd: string): PeriodWindow {
  let a = ymdToDate(startYmd), b = ymdToDate(endYmd);
  if (a > b) { const t = a; a = b; b = t; }
  const diffDays = Math.round((b.getTime() - a.getTime()) / 86400000);
  const sameDay = diffDays === 0;
  const isWeek = a.getDay() === 1 && diffDays === 6;
  const isMonth = a.getDate() === 1 && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear() && b.getDate() === lastOfMonth(b);

  let label: string, range: string;
  if (sameDay) {
    label = 'Harian';
    range = a.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  } else if (isWeek) {
    label = 'Mingguan'; range = `${fmtId(a)} – ${fmtId(b)}`;
  } else if (isMonth) {
    label = 'Bulanan'; range = a.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  } else {
    label = 'Rentang Kustom'; range = `${fmtId(a)} – ${fmtId(b)}`;
  }
  return { startYmd: ymd(a), endYmd: ymd(b), range, label };
}

function reportHealthBadge(h: string | null): string {
  const label = h ? (HEALTH_LABEL[h] ?? h) : 'N/A';
  const color = h === 'red' ? '#b91c1c' : h === 'amber' ? '#b45309' : h === 'green' ? '#15803d' : '#6b7280';
  const bg = h === 'red' ? '#fee2e2' : h === 'amber' ? '#fef3c7' : h === 'green' ? '#dcfce7' : '#f3f4f6';
  return `<span class="badge" style="color:${color};background:${bg}">${label}</span>`;
}

// Shared formal-report skeleton: kop surat (letterhead) + title/subtitle + caller
// body + signature block + footer. Every PDF report (ringkasan, kesehatan,
// tugas, aktivitas) is built on top of this so the letterhead stays consistent.
function reportShell(opts: { title: string; subtitle: string; introHTML: string; bodyHTML: string; legendHTML?: string }): string {
  const now = new Date();
  const tanggal = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const waktu = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  return `<!doctype html><html lang="id"><head><meta charset="utf-8">
<title>${escapeHtml(opts.title)} - ${COMPANY.name}</title>
<style>
  * { box-sizing: border-box; }
  @page { size: A4 portrait; margin: 14mm 12mm; }
  html, body { margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; color: #1f2937; font-size: 11px; line-height: 1.45; }
  .badge { display: inline-block; padding: 1px 7px; border-radius: 9px; font-size: 9px; font-weight: 700; }
  /* Kop surat */
  .kop { display: flex; align-items: center; gap: 14px; padding-bottom: 10px; }
  .logo { width: 58px; height: 58px; border-radius: 12px; background: #2563eb; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 20px; letter-spacing: 1px; flex: 0 0 auto; }
  .kop .co { line-height: 1.3; }
  .kop .co .nm { font-size: 19px; font-weight: 800; color: #111827; letter-spacing: .5px; }
  .kop .co .tg { font-size: 10px; color: #2563eb; font-weight: 600; margin-bottom: 2px; }
  .kop .co .ad { font-size: 9.5px; color: #4b5563; }
  .rule { border: 0; border-top: 3px solid #1e3a8a; margin: 0; }
  .rule2 { border: 0; border-top: 1px solid #1e3a8a; margin: 2px 0 16px; }
  /* Title */
  .title { text-align: center; margin: 6px 0 2px; font-size: 15px; font-weight: 800; text-decoration: underline; text-underline-offset: 3px; letter-spacing: .5px; }
  .subtitle { text-align: center; font-size: 10.5px; color: #4b5563; margin-bottom: 14px; }
  .intro { margin: 0 0 12px; text-align: justify; }
  /* Summary */
  .sech { font-size: 12px; font-weight: 700; margin: 16px 0 7px; color: #1e3a8a; }
  .cards { display: flex; gap: 8px; margin-bottom: 4px; }
  .card { flex: 1; border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px 6px; text-align: center; }
  .card .v { font-size: 17px; font-weight: 800; }
  .card .l { font-size: 8.5px; color: #6b7280; text-transform: uppercase; letter-spacing: .3px; margin-top: 1px; }
  /* Table */
  table { width: 100%; border-collapse: collapse; margin-top: 4px; }
  thead { display: table-header-group; }
  th { background: #1e3a8a; color: #fff; font-size: 9.5px; font-weight: 700; padding: 6px 5px; text-align: left; border: 1px solid #1e3a8a; text-transform: uppercase; }
  td { padding: 5px; border: 1px solid #d1d5db; vertical-align: top; font-size: 10px; }
  tbody tr:nth-child(even) { background: #f8fafc; }
  tr { page-break-inside: avoid; }
  .c { text-align: center; } .r { text-align: right; } .mono { font-family: 'Courier New', monospace; }
  .nowrap { white-space: nowrap; } .sub { font-size: 8.5px; color: #6b7280; }
  tfoot td { background: #eef2ff; font-weight: 800; border: 1px solid #c7d2fe; }
  /* Legend + signature */
  .legend { font-size: 9px; color: #4b5563; margin-top: 8px; }
  .legend b { color: #1f2937; }
  .ttd { margin-top: 34px; display: flex; justify-content: flex-end; }
  .ttd .box { text-align: center; width: 220px; font-size: 10.5px; }
  .ttd .sp { height: 58px; }
  .ttd .nm { font-weight: 700; text-decoration: underline; }
  .foot { margin-top: 26px; border-top: 1px solid #e5e7eb; padding-top: 6px; font-size: 8.5px; color: #9ca3af; display: flex; justify-content: space-between; }
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
</style></head>
<body>
  <div class="kop">
    <div class="logo">SHI</div>
    <div class="co">
      <div class="tg">${escapeHtml(COMPANY.tagline)}</div>
      <div class="nm">${escapeHtml(COMPANY.name)}</div>
      <div class="ad">${escapeHtml(COMPANY.address)}</div>
      <div class="ad">Telp: ${escapeHtml(COMPANY.phone)} &nbsp;|&nbsp; Email: ${escapeHtml(COMPANY.email)} &nbsp;|&nbsp; ${escapeHtml(COMPANY.web)}</div>
    </div>
  </div>
  <hr class="rule"><hr class="rule2">

  <div class="title">${opts.title}</div>
  <div class="subtitle">${opts.subtitle} &middot; Dicetak ${tanggal} pukul ${waktu} WIB</div>

  ${opts.introHTML}
  ${opts.bodyHTML}
  ${opts.legendHTML ?? ''}

  <div class="ttd">
    <div class="box">
      Yogyakarta, ${tanggal}<br>Dibuat oleh,
      <div class="sp"></div>
      <div class="nm">( Manajer Proyek )</div>
      <div class="sub">PT Smart Home Inovasi</div>
    </div>
  </div>

  <div class="foot">
    <span>${escapeHtml(COMPANY.name)} &mdash; Dokumen Internal / Rahasia</span>
    <span>Dicetak otomatis oleh Sistem Dashboard SHI pada ${tanggal} ${waktu} WIB</span>
  </div>
</body></html>`;
}

function buildReportHTML(data: ReportActivityData, periodLabel: string, periodRange: string): string {
  const projects = data.projects;
  const s = data.summary;
  let spiSum = 0, spiCount = 0;
  for (const p of projects) {
    if (p.spi_value != null) { spiSum += Number(p.spi_value); spiCount++; }
  }
  const avgSpi = spiCount > 0 ? (spiSum / spiCount).toFixed(2) : '-';

  const rows = projects.length
    ? projects.map((p: ReportActivityProject, i: number) => `<tr>
      <td class="c">${i + 1}</td>
      <td class="mono">${escapeHtml(p.project_code)}</td>
      <td><strong>${escapeHtml(p.name)}</strong><div class="sub">${escapeHtml(p.client_name ?? '-')}</div></td>
      <td>${escapeHtml(STATUS_LABEL[p.status] ?? p.status)}<div class="sub">${escapeHtml(PHASE_LABEL[p.phase] ?? p.phase)}</div></td>
      <td class="c">${reportHealthBadge(p.health_status)}</td>
      <td class="c mono">${p.spi_value != null ? Number(p.spi_value).toFixed(2) : '-'}</td>
      <td class="c"><strong>${p.activity_count}</strong></td>
      <td class="c">${p.tasks_worked}</td>
      <td class="c">${p.tasks_completed}</td>
    </tr>`).join('')
    : `<tr><td colspan="9" style="text-align:center;padding:22px;color:#6b7280">Tidak ada aktivitas tugas pada periode ini.</td></tr>`;

  const introHTML = `<p class="intro">Bersama ini kami sampaikan laporan ${periodLabel.toLowerCase()} aktivitas pengerjaan proyek
  PT Smart Home Inovasi untuk periode <strong>${periodRange}</strong>. Pada periode ini tercatat aktivitas pada
  <strong>${s.project_count} proyek</strong>, dengan <strong>${s.total_activities} catatan aktivitas</strong>,
  <strong>${s.tasks_worked} tugas</strong> dikerjakan, dan <strong>${s.tasks_completed} tugas</strong> diselesaikan,
  sebagai bahan evaluasi dan pengambilan keputusan manajemen.</p>`;

  const bodyHTML = `<div class="sech">Ringkasan Eksekutif</div>
  <div class="cards">
    <div class="card"><div class="v" style="color:#1e3a8a">${s.project_count}</div><div class="l">Proyek Aktif</div></div>
    <div class="card"><div class="v" style="color:#2563eb">${s.total_activities}</div><div class="l">Catatan Aktivitas</div></div>
    <div class="card"><div class="v" style="color:#b45309">${s.tasks_worked}</div><div class="l">Tugas Dikerjakan</div></div>
    <div class="card"><div class="v" style="color:#15803d">${s.tasks_completed}</div><div class="l">Tugas Selesai</div></div>
    <div class="card"><div class="v" style="color:#1f2937">${avgSpi}</div><div class="l">Rata-rata SPI</div></div>
  </div>

  <div class="sech">Rincian Aktivitas per Proyek</div>
  <table>
    <thead><tr>
      <th class="c">No</th><th>Kode</th><th>Proyek / Klien</th><th>Status / Fase</th>
      <th class="c">Kesehatan</th><th class="c">SPI</th><th class="c">Aktivitas</th><th class="c">Dikerjakan</th><th class="c">Selesai</th>
    </tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr>
      <td colspan="6" class="r">TOTAL</td>
      <td class="c">${s.total_activities}</td><td class="c">${s.tasks_worked}</td><td class="c">${s.tasks_completed}</td>
    </tr></tfoot>
  </table>`;

  const legendHTML = `<div class="legend">
    <b>Catatan:</b> Aktivitas = jumlah catatan kerja teknisi pada periode; Dikerjakan = tugas yang berubah status;
    Selesai = tugas yang diselesaikan pada periode. &nbsp;&middot;&nbsp;
    <b>SPI:</b> &ge; 0,95 <b style="color:#15803d">Sehat</b>, 0,85&ndash;0,94 <b style="color:#b45309">Waspada</b>, &lt; 0,85 <b style="color:#b91c1c">Kritis</b>.
  </div>`;

  return reportShell({
    title: 'LAPORAN AKTIVITAS PROYEK',
    subtitle: `Laporan ${periodLabel} &middot; Periode: ${periodRange}`,
    introHTML, bodyHTML, legendHTML,
  });
}

const spiLegendHTML = `<div class="legend"><b>Keterangan SPI</b> (Schedule Performance Index = Earned Value / Planned Value):
  &ge; 0,95 <b style="color:#15803d">Sehat</b> (sesuai/lebih cepat dari jadwal),
  0,85&ndash;0,94 <b style="color:#b45309">Waspada</b> (sedikit terlambat),
  &lt; 0,85 <b style="color:#b91c1c">Kritis</b> (terlambat signifikan).</div>`;

// Build a formal snapshot report (kop surat + tidy table) for the active tab:
// ringkasan seluruh proyek, status kesehatan, atau progres penyelesaian tugas.
// Uses the data already loaded on the page (no period filter -> potret terkini).
function buildProjectsReportHTML(tab: ReportType, projects: DashboardProject[], summary?: DashboardSummary): string {
  const tgl = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const spi = (v: unknown) => (v != null ? Number(v).toFixed(3) : '-');
  const rupiah = (v: unknown) => (Number(v) > 0 ? `Rp ${Number(v).toLocaleString('id-ID')}` : '-');
  const tasksCell = (p: DashboardProject) => (p.total_tasks > 0 ? `${p.completed_tasks}/${p.total_tasks}` : '-');
  const greens = projects.filter((p) => p.health_status === 'green').length;
  const ambers = projects.filter((p) => p.health_status === 'amber').length;
  const reds = projects.filter((p) => p.health_status === 'red').length;
  const avgSpi = summary?.avg_spi != null ? Number(summary.avg_spi).toFixed(3) : '-';

  if (tab === 'health') {
    const active = projects.filter((p) => p.status === 'active').sort((a, b) => {
      const order: Record<string, number> = { red: 0, amber: 1, green: 2 };
      return (order[a.health_status ?? ''] ?? 3) - (order[b.health_status ?? ''] ?? 3);
    });
    const aGreen = active.filter((p) => p.health_status === 'green').length;
    const aAmber = active.filter((p) => p.health_status === 'amber').length;
    const aRed = active.filter((p) => p.health_status === 'red').length;
    const rows = active.map((p, i) => `<tr>
      <td class="c">${i + 1}</td>
      <td class="mono">${escapeHtml(p.project_code)}</td>
      <td><strong>${escapeHtml(p.name)}</strong><div class="sub">${escapeHtml(p.client_name ?? '-')}</div></td>
      <td class="c">${reportHealthBadge(p.health_status)}</td>
      <td class="c mono">${spi(p.spi_value)}</td>
      <td class="c">${p.actual_progress != null ? `${Number(p.actual_progress).toFixed(1)}%` : '-'}</td>
      <td class="c">${p.planned_progress != null ? `${Number(p.planned_progress).toFixed(1)}%` : '-'}</td>
      <td class="c">${tasksCell(p)}</td>
    </tr>`).join('') || `<tr><td colspan="8" style="text-align:center;padding:22px;color:#6b7280">Tidak ada proyek aktif.</td></tr>`;
    const body = `<div class="sech">Ringkasan Eksekutif</div>
      <div class="cards">
        <div class="card"><div class="v" style="color:#1e3a8a">${active.length}</div><div class="l">Proyek Aktif</div></div>
        <div class="card"><div class="v" style="color:#15803d">${aGreen}</div><div class="l">Sehat</div></div>
        <div class="card"><div class="v" style="color:#b45309">${aAmber}</div><div class="l">Waspada</div></div>
        <div class="card"><div class="v" style="color:#b91c1c">${aRed}</div><div class="l">Kritis</div></div>
        <div class="card"><div class="v" style="color:#1f2937">${avgSpi}</div><div class="l">Rata-rata SPI</div></div>
      </div>
      <div class="sech">Status Kesehatan per Proyek (urut prioritas)</div>
      <table>
        <thead><tr><th class="c">No</th><th>Kode</th><th>Proyek / Klien</th><th class="c">Kesehatan</th><th class="c">SPI</th><th class="c">Aktual</th><th class="c">Rencana</th><th class="c">Tugas</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
    return reportShell({
      title: 'LAPORAN STATUS KESEHATAN PROYEK',
      subtitle: 'Potret kesehatan jadwal seluruh proyek aktif',
      introHTML: `<p class="intro">Bersama ini kami sampaikan laporan status kesehatan jadwal seluruh proyek aktif PT Smart Home Inovasi per <strong>${tgl}</strong>, diurutkan berdasarkan prioritas penanganan (Kritis &rarr; Waspada &rarr; Sehat), sebagai bahan evaluasi dan pengambilan keputusan manajemen.</p>`,
      bodyHTML: body, legendHTML: spiLegendHTML,
    });
  }

  if (tab === 'tasks') {
    const withTasks = projects.filter((p) => p.total_tasks > 0);
    const rows = withTasks.map((p, i) => {
      const pct = Math.round((p.completed_tasks / p.total_tasks) * 100);
      return `<tr>
        <td class="c">${i + 1}</td>
        <td class="mono">${escapeHtml(p.project_code)}</td>
        <td><strong>${escapeHtml(p.name)}</strong><div class="sub">${escapeHtml(p.client_name ?? '-')}</div></td>
        <td class="c">${reportHealthBadge(p.health_status)}</td>
        <td class="c">${p.completed_tasks}</td>
        <td class="c">${p.total_tasks}</td>
        <td class="c"><strong>${pct}%</strong></td>
      </tr>`;
    }).join('') || `<tr><td colspan="7" style="text-align:center;padding:22px;color:#6b7280">Belum ada tugas tercatat.</td></tr>`;
    const body = `<div class="sech">Ringkasan Eksekutif</div>
      <div class="cards">
        <div class="card"><div class="v" style="color:#1e3a8a">${summary?.total_tasks ?? 0}</div><div class="l">Total Tugas</div></div>
        <div class="card"><div class="v" style="color:#15803d">${summary?.completed_tasks ?? 0}</div><div class="l">Selesai</div></div>
        <div class="card"><div class="v" style="color:#2563eb">${(summary?.in_progress_tasks ?? 0) + (summary?.working_tasks ?? 0)}</div><div class="l">Dikerjakan</div></div>
        <div class="card"><div class="v" style="color:#b91c1c">${summary?.overtime_tasks ?? 0}</div><div class="l">Lewat Tenggat</div></div>
      </div>
      <div class="sech">Progres Penyelesaian Tugas per Proyek</div>
      <table>
        <thead><tr><th class="c">No</th><th>Kode</th><th>Proyek / Klien</th><th class="c">Kesehatan</th><th class="c">Selesai</th><th class="c">Total</th><th class="c">Persentase</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
    return reportShell({
      title: 'LAPORAN PROGRES PENYELESAIAN TUGAS',
      subtitle: 'Potret penyelesaian tugas seluruh proyek',
      introHTML: `<p class="intro">Bersama ini kami sampaikan laporan progres penyelesaian tugas seluruh proyek PT Smart Home Inovasi per <strong>${tgl}</strong>, sebagai bahan pemantauan beban kerja dan capaian tim teknisi.</p>`,
      bodyHTML: body, legendHTML: spiLegendHTML,
    });
  }

  // default: summary (semua proyek)
  const totalValue = projects.reduce((acc, p) => acc + (Number(p.project_value) || 0), 0);
  const rows = projects.map((p, i) => `<tr>
    <td class="c">${i + 1}</td>
    <td class="mono">${escapeHtml(p.project_code)}</td>
    <td><strong>${escapeHtml(p.name)}</strong><div class="sub">${escapeHtml(p.client_name ?? '-')}</div></td>
    <td>${escapeHtml(STATUS_LABEL[p.status] ?? p.status)}<div class="sub">${escapeHtml(PHASE_LABEL[p.phase] ?? p.phase)}</div></td>
    <td class="c">${reportHealthBadge(p.health_status)}</td>
    <td class="c mono">${spi(p.spi_value)}</td>
    <td class="c">${tasksCell(p)}</td>
    <td class="nowrap">${formatDate(p.start_date)} &ndash; ${formatDate(p.end_date)}</td>
    <td class="r mono">${rupiah(p.project_value)}</td>
  </tr>`).join('') || `<tr><td colspan="9" style="text-align:center;padding:22px;color:#6b7280">Belum ada proyek.</td></tr>`;
  const body = `<div class="sech">Ringkasan Eksekutif</div>
    <div class="cards">
      <div class="card"><div class="v" style="color:#1e3a8a">${projects.length}</div><div class="l">Total Proyek</div></div>
      <div class="card"><div class="v" style="color:#15803d">${greens}</div><div class="l">Sehat</div></div>
      <div class="card"><div class="v" style="color:#b45309">${ambers}</div><div class="l">Waspada</div></div>
      <div class="card"><div class="v" style="color:#b91c1c">${reds}</div><div class="l">Kritis</div></div>
      <div class="card"><div class="v" style="color:#1f2937">${avgSpi}</div><div class="l">Rata-rata SPI</div></div>
    </div>
    <div class="sech">Rincian Seluruh Proyek</div>
    <table>
      <thead><tr><th class="c">No</th><th>Kode</th><th>Proyek / Klien</th><th>Status / Fase</th><th class="c">Kesehatan</th><th class="c">SPI</th><th class="c">Tugas</th><th>Jadwal</th><th class="r">Nilai Kontrak</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><td colspan="8" class="r">TOTAL NILAI KONTRAK</td><td class="r mono">Rp ${totalValue.toLocaleString('id-ID')}</td></tr></tfoot>
    </table>`;
  return reportShell({
    title: 'LAPORAN RINGKASAN PROYEK',
    subtitle: 'Potret seluruh proyek PT Smart Home Inovasi',
    introHTML: `<p class="intro">Bersama ini kami sampaikan laporan ringkasan seluruh proyek PT Smart Home Inovasi per <strong>${tgl}</strong>, mencakup <strong>${projects.length} proyek</strong> beserta status, kesehatan jadwal (SPI), capaian tugas, dan nilai kontrak, sebagai bahan evaluasi dan pengambilan keputusan manajemen.</p>`,
    bodyHTML: body, legendHTML: spiLegendHTML,
  });
}

function PrintButton({ tab, win, projects, summary }: { tab: ReportType; win: PeriodWindow; projects: DashboardProject[]; summary?: DashboardSummary }) {
  const [loading, setLoading] = useState(false);
  const handlePrint = async () => {
    // Open the window synchronously (popup-blocker friendly), then fill it.
    const w = window.open('', '_blank');
    if (!w) return;
    const finish = (html: string) => {
      w.document.open();
      w.document.write(html);
      w.document.close();
      w.focus();
      setTimeout(() => { try { w.print(); } catch { /* ignore */ } }, 350);
    };

    // Snapshot tabs render synchronously from data already loaded on the page.
    if (tab !== 'activity') {
      finish(buildProjectsReportHTML(tab, projects, summary));
      return;
    }

    // Activity tab needs the period data fetched first.
    w.document.write('<!doctype html><meta charset="utf-8"><body style="font-family:Arial,sans-serif;padding:48px;color:#374151">Menyiapkan laporan…</body>');
    const { startYmd, endYmd, range, label } = win;
    setLoading(true);
    try {
      const data = await getReportActivity(startYmd, endYmd);
      finish(buildReportHTML(data, label, range));
    } catch {
      w.document.open();
      w.document.write('<!doctype html><meta charset="utf-8"><body style="font-family:Arial,sans-serif;padding:48px;color:#b91c1c">Gagal memuat data laporan. Tutup jendela ini lalu coba lagi.</body>');
      w.document.close();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handlePrint} disabled={loading} className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-60">
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      </svg>
      {loading ? 'Menyiapkan…' : 'Print / PDF'}
    </button>
  );
}

export default function ReportsPage() {
  const { data: dashData, isLoading: dashLoading } = useDashboard();
  const { data: projects = [], isLoading: projLoading } = useProjects();
  const updateMutation = useUpdateProject();
  const deleteMutation = useDeleteProject();
  const router = useRouter();
  const [tab, setTab] = useState<ReportType>('summary');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>(() => ymd(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
  const [endDate, setEndDate] = useState<string>(() => ymd(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)));
  const reportWindow = useMemo(() => computeRangeWindow(startDate, endDate), [startDate, endDate]);
  const { data: activityData, isFetching: activityLoading } = useQuery({
    queryKey: ['report-activity', reportWindow.startYmd, reportWindow.endYmd],
    queryFn: () => getReportActivity(reportWindow.startYmd, reportWindow.endYmd),
    enabled: tab === 'activity',
  });
  const applyPreset = (p: 'hari' | 'minggu' | 'bulan') => {
    const now = new Date();
    if (p === 'hari') {
      const d = ymd(now); setStartDate(d); setEndDate(d);
    } else if (p === 'minggu') {
      const s = new Date(now); const dow = s.getDay(); s.setDate(now.getDate() + (dow === 0 ? -6 : 1 - dow));
      const e = new Date(s); e.setDate(s.getDate() + 6);
      setStartDate(ymd(s)); setEndDate(ymd(e));
    } else {
      setStartDate(ymd(new Date(now.getFullYear(), now.getMonth(), 1)));
      setEndDate(ymd(new Date(now.getFullYear(), now.getMonth() + 1, 0)));
    }
  };
  const contentRef = useRef<HTMLDivElement>(null);

  // Edit modal state
  const [editProject, setEditProject] = useState<DashboardProject | null>(null);
  const [editForm, setEditForm] = useState({ name: '', status: '', phase: '', category: '', project_value: '' });

  // Urutkan KRONOLOGIS (terbaru dulu) untuk laporan ringkasan -- BUKAN merah-dulu.
  // API /projects meng-ORDER BY kesehatan (merah->amber->hijau) demi triase Dashboard;
  // kalau dipakai apa adanya di sini, semua proyek MERAH menumpuk di atas tabel ->
  // laporan "terlihat merah semua" padahal ~73% hijau (cuma 19% selesai-telat). Laporan
  // seluruh proyek harus netral (kronologis), bukan triase. Sort pada array hasil filter
  // (salinan baru) -> cache react-query tidak ikut termutasi.
  const allProjects = (projects as DashboardProject[])
    .filter((p) => categoryFilter === 'all' || (p as unknown as Record<string, string>).category === categoryFilter)
    .sort((a, b) => {
      const dt = new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
      return dt !== 0 ? dt : (b.project_code ?? '').localeCompare(a.project_code ?? '');
    });

  const openEdit = (p: DashboardProject) => {
    setEditProject(p);
    setEditForm({
      name: p.name,
      status: p.status,
      phase: p.phase,
      category: (p as unknown as Record<string, string>).category ?? 'instalasi',
      project_value: String(Number(p.project_value) || 0),
    });
  };

  const saveEdit = () => {
    if (!editProject) return;
    const data: UpdateProjectData = {};
    if (editForm.name !== editProject.name) data.name = editForm.name;
    if (editForm.status !== editProject.status) data.status = editForm.status as UpdateProjectData['status'];
    if (editForm.phase !== editProject.phase) data.phase = editForm.phase as UpdateProjectData['phase'];
    if (editForm.category !== ((editProject as unknown as Record<string, string>).category ?? 'instalasi')) data.category = editForm.category as UpdateProjectData['category'];
    if (editForm.project_value !== String(Number(editProject.project_value) || 0)) data.project_value = Number(editForm.project_value);
    if (Object.keys(data).length > 0) {
      updateMutation.mutate({ id: editProject.id, data });
    }
    setEditProject(null);
  };

  const handleInlineStatusChange = (p: DashboardProject, newStatus: string) => {
    updateMutation.mutate({ id: p.id, data: { status: newStatus as UpdateProjectData['status'] } });
  };

  const handleInlinePhaseChange = (p: DashboardProject, newPhase: string) => {
    updateMutation.mutate({ id: p.id, data: { phase: newPhase as UpdateProjectData['phase'] } });
  };

  const handleDelete = async () => {
    if (deleteId == null) return;
    await deleteMutation.mutateAsync(deleteId);
    setDeleteId(null);
  };

  const handleExcelExport = useCallback(() => {
    const wb = XLSX.utils.book_new();
    const summaryRows = allProjects.map((p) => ({
      'Project Code': p.project_code,
      'Project Name': p.name,
      'Client': p.client_name ?? '',
      'Status': p.status,
      'Phase': p.phase,
      'Health': p.health_status ?? 'N/A',
      'SPI': p.spi_value != null ? Number(p.spi_value).toFixed(3) : '',
      'Tasks Done': p.total_tasks > 0 ? `${p.completed_tasks}/${p.total_tasks}` : '',
      'Start Date': p.start_date,
      'End Date': p.end_date,
      'Value (Rp)': Number(p.project_value) || 0,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), 'Projects');
    if (dashData) {
      const healthRows = [
        { Metric: 'Total Active Projects', Value: dashData.summary.active_projects },
        { Metric: 'On Track (Green)', Value: dashData.summary.total_green },
        { Metric: 'Warning (Amber)', Value: dashData.summary.total_amber },
        { Metric: 'Critical (Red)', Value: dashData.summary.total_red },
        { Metric: 'Average SPI', Value: dashData.summary.avg_spi != null ? Number(dashData.summary.avg_spi).toFixed(4) : 'N/A' },
        { Metric: 'Total Tasks', Value: dashData.summary.total_tasks },
        { Metric: 'Completed Tasks', Value: dashData.summary.completed_tasks },
        { Metric: 'Overtime Tasks', Value: dashData.summary.overtime_tasks },
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(healthRows), 'Health Summary');
    }
    XLSX.writeFile(wb, `SHI_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  }, [allProjects, dashData]);

  if (dashLoading || projLoading) {
    return (
      <div className="flex items-center justify-center h-64" role="status">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const summary = dashData?.summary;
  const inputClass = "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Laporan</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Klik data di bawah</p>
        </div>
        <div className="flex items-center gap-2">
          {updateMutation.isPending && (
            <span className="text-xs text-blue-500 dark:text-blue-400 flex items-center gap-1">
              <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
              Saving...
            </span>
          )}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Pemilih rentang tanggal hanya relevan untuk laporan Aktivitas (berbasis periode).
                Tab lain adalah potret terkini sehingga langsung dicetak. */}
            {tab === 'activity' && (
              <>
                {/* Preset cepat -> mengisi kedua tanggal */}
                <div className="flex items-center rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
                  {([['hari', 'Hari Ini'], ['minggu', 'Minggu Ini'], ['bulan', 'Bulan Ini']] as const).map(([k, lbl]) => (
                    <button
                      key={k}
                      onClick={() => applyPreset(k)}
                      className="text-[11px] font-medium px-2 py-1.5 text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 border-r border-gray-200 dark:border-gray-700 last:border-r-0 transition-colors"
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
                {/* Rentang tanggal bebas (selalu bisa pilih 2 tanggal) */}
                <label className="text-[11px] text-gray-500 dark:text-gray-400">Dari</label>
                <input
                  type="date" value={startDate} max={endDate} onChange={(e) => setStartDate(e.target.value)}
                  className="text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Tanggal mulai laporan"
                />
                <label className="text-[11px] text-gray-500 dark:text-gray-400">Sampai</label>
                <input
                  type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)}
                  className="text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Tanggal akhir laporan"
                />
                <span className="text-[11px] font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 rounded px-2 py-1 whitespace-nowrap" title="Rentang & jenis laporan terpilih">
                  {reportWindow.label} · {reportWindow.range}
                </span>
              </>
            )}
            <PrintButton tab={tab} win={reportWindow} projects={allProjects} summary={summary} />
          </div>
          <button onClick={handleExcelExport} className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 border border-green-200 dark:border-green-800 rounded-lg px-3 py-1.5 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Export Excel
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {REPORT_TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-colors flex-1 justify-center ${tab === t.key ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d={t.icon} /></svg>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">Category:</span>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Filter by category"
        >
          <option value="all">All Category</option>
          <option value="instalasi">Instalasi</option>
          <option value="maintenance">Maintenance</option>
          <option value="perbaikan">Perbaikan</option>
          <option value="upgrade">Upgrade</option>
          <option value="monitoring">Monitoring</option>
          <option value="security">Security</option>
          <option value="networking">Networking</option>
          <option value="lainnya">Lainnya</option>
        </select>
        <span className="text-xs text-gray-400 dark:text-gray-500">{allProjects.length} project{allProjects.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Report content */}
      <div ref={contentRef}>
        {/* ── SUMMARY TAB ──────────────────────────────────────────────── */}
        {tab === 'summary' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Laporan Seluruh Proyek</h2>
              <span className="text-[10px] text-gray-400 dark:text-gray-500">{allProjects.length} projects</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    {['Code', 'Project', 'Client', 'Status', 'Phase', 'Health', 'SPI', 'Tasks', 'Timeline', 'Value', ''].map((h) => (
                      <th key={h} className={`px-3 py-2 font-medium text-gray-500 dark:text-gray-400 uppercase ${h === 'Value' ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {allProjects.map((p) => (
                    <tr key={p.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 cursor-pointer transition-colors group" onClick={() => router.push(`/projects/${p.id}`)}>
                      <td className="px-3 py-2.5 font-mono text-gray-500 dark:text-gray-400">{p.project_code}</td>
                      <td className="px-3 py-2.5 font-medium text-blue-600 dark:text-blue-400 max-w-[200px] truncate group-hover:underline">{p.name}</td>
                      <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400">{p.client_name ?? '-'}</td>
                      <td className="px-3 py-2.5"><StatusSelect value={p.status} onChange={(v) => handleInlineStatusChange(p, v)} /></td>
                      <td className="px-3 py-2.5"><PhaseSelect value={p.phase} onChange={(v) => handleInlinePhaseChange(p, v)} /></td>
                      <td className="px-3 py-2.5"><HealthBadge status={p.health_status} /></td>
                      <td className="px-3 py-2.5 text-gray-700 dark:text-gray-300 font-mono">{p.spi_value != null ? Number(p.spi_value).toFixed(3) : '-'}</td>
                      <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400">{p.total_tasks > 0 ? `${p.completed_tasks}/${p.total_tasks}` : '-'}</td>
                      <td className="px-3 py-2.5 text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(p.start_date)} — {formatDate(p.end_date)}</td>
                      <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400 text-right font-mono">{Number(p.project_value) > 0 ? formatRupiah(Number(p.project_value)) : '-'}</td>
                      <td className="px-3 py-2.5"><ActionButtons project={p} onView={() => router.push(`/projects/${p.id}`)} onEdit={() => openEdit(p)} onDelete={() => setDeleteId(p.id)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── HEALTH TAB ───────────────────────────────────────────────── */}
        {tab === 'health' && summary && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: 'Active', value: summary.active_projects, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30' },
                { label: 'On Track', value: summary.total_green, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
                { label: 'Warning', value: summary.total_amber, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/30' },
                { label: 'Critical', value: summary.total_red, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/30' },
                { label: 'Avg SPI', value: summary.avg_spi != null ? Number(summary.avg_spi).toFixed(3) : 'N/A', color: 'text-gray-900 dark:text-gray-100', bg: 'bg-gray-50 dark:bg-gray-800' },
              ].map((c) => (
                <div key={c.label} className={`${c.bg} rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center`}>
                  <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{c.label}</p>
                </div>
              ))}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Health Status per Project</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      {['Project', 'Health', 'SPI', 'Actual', 'Planned', 'Tasks', ''].map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {allProjects
                      .filter((p) => p.status === 'active')
                      .sort((a, b) => {
                        const order: Record<string, number> = { red: 0, amber: 1, green: 2 };
                        return (order[a.health_status ?? ''] ?? 3) - (order[b.health_status ?? ''] ?? 3);
                      })
                      .map((p) => (
                        <tr key={p.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 cursor-pointer transition-colors group" onClick={() => router.push(`/projects/${p.id}`)}>
                          <td className="px-3 py-2.5 font-medium text-blue-600 dark:text-blue-400 group-hover:underline">{p.name}</td>
                          <td className="px-3 py-2.5"><HealthBadge status={p.health_status} /></td>
                          <td className="px-3 py-2.5 text-gray-700 dark:text-gray-300 font-mono">{p.spi_value != null ? Number(p.spi_value).toFixed(3) : '-'}</td>
                          <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400">{p.actual_progress != null ? `${Number(p.actual_progress).toFixed(1)}%` : '-'}</td>
                          <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400">{p.planned_progress != null ? `${Number(p.planned_progress).toFixed(1)}%` : '-'}</td>
                          <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400">{p.total_tasks > 0 ? `${p.completed_tasks}/${p.total_tasks}` : '-'}</td>
                          <td className="px-3 py-2.5"><ActionButtons project={p} onView={() => router.push(`/projects/${p.id}`)} onEdit={() => openEdit(p)} onDelete={() => setDeleteId(p.id)} /></td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TASKS TAB ────────────────────────────────────────────────── */}
        {tab === 'tasks' && summary && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total Tasks', value: summary.total_tasks, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30' },
                { label: 'Completed', value: summary.completed_tasks, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/30' },
                { label: 'In Progress', value: summary.in_progress_tasks + summary.working_tasks, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30' },
                { label: 'Overtime', value: summary.overtime_tasks, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/30' },
              ].map((c) => (
                <div key={c.label} className={`${c.bg} rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center`}>
                  <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{c.label}</p>
                </div>
              ))}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Task Completion per Project</h2>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {allProjects.filter((p) => p.total_tasks > 0).map((p) => {
                  const pct = Math.round((p.completed_tasks / p.total_tasks) * 100);
                  return (
                    <div key={p.id} className="px-4 py-3 flex items-center gap-4 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 cursor-pointer transition-colors group" onClick={() => router.push(`/projects/${p.id}`)}>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-blue-600 dark:text-blue-400 truncate group-hover:underline">{p.name}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">{p.completed_tasks} of {p.total_tasks} tasks</p>
                      </div>
                      <HealthBadge status={p.health_status} />
                      <div className="w-32 shrink-0">
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-green-500' : pct >= 50 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-10 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── ACTIVITY TAB (periode) ───────────────────────────────────── */}
        {tab === 'activity' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Aktivitas Proyek &middot; {reportWindow.label}</h2>
              <span className="text-[10px] text-gray-400 dark:text-gray-500">{reportWindow.range}</span>
            </div>
            {activityLoading ? (
              <div className="px-4 py-10 text-center text-xs text-gray-400">Memuat aktivitas…</div>
            ) : !activityData || activityData.projects.length === 0 ? (
              <div className="px-4 py-10 text-center text-xs text-gray-400">Tidak ada aktivitas tugas pada rentang tanggal ini. Pilih rentang lain di atas.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      {['Code', 'Project', 'Client', 'Health', 'SPI', 'Activities', 'Worked', 'Done'].map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {activityData.projects.map((p) => (
                      <tr key={p.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 cursor-pointer transition-colors group" onClick={() => router.push(`/projects/${p.id}`)}>
                        <td className="px-3 py-2.5 font-mono text-gray-500 dark:text-gray-400">{p.project_code}</td>
                        <td className="px-3 py-2.5 font-medium text-blue-600 dark:text-blue-400 max-w-[200px] truncate group-hover:underline">{p.name}</td>
                        <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400">{p.client_name ?? '-'}</td>
                        <td className="px-3 py-2.5"><HealthBadge status={p.health_status} /></td>
                        <td className="px-3 py-2.5 text-gray-700 dark:text-gray-300 font-mono">{p.spi_value != null ? Number(p.spi_value).toFixed(3) : '-'}</td>
                        <td className="px-3 py-2.5 font-semibold text-gray-700 dark:text-gray-300">{p.activity_count}</td>
                        <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400">{p.tasks_worked}</td>
                        <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400">{p.tasks_completed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── EDIT MODAL ───────────────────────────────────────────────── */}
      <Modal open={!!editProject} onClose={() => setEditProject(null)} title={`Edit: ${editProject?.name ?? ''}`}>
        {editProject && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Name</label>
              <input type="text" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select value={editForm.status} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))} className={inputClass}>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="on-hold">On Hold</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phase</label>
                <select value={editForm.phase} onChange={(e) => setEditForm((f) => ({ ...f, phase: e.target.value }))} className={inputClass}>
                  <option value="survey">Survey</option>
                  <option value="execution">Execution</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Value (Rp)</label>
              <input type="number" value={editForm.project_value} onChange={(e) => setEditForm((f) => ({ ...f, project_value: e.target.value }))} className={inputClass} />
            </div>
            <div className="flex justify-between pt-2">
              <button onClick={() => router.push(`/projects/${editProject.id}`)} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                Open Full Detail
              </button>
              <div className="flex gap-2">
                <button onClick={() => setEditProject(null)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">Cancel</button>
                <button onClick={saveEdit} disabled={updateMutation.isPending} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {updateMutation.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ── DELETE CONFIRM ───────────────────────────────────────────── */}
      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Hapus Proyek"
        message="Apakah Anda yakin ingin menghapus proyek ini? Semua tugas, bukti, laporan, dan eskalasi terkait akan ikut terhapus permanen. Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
