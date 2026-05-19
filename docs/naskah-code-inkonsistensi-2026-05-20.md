# Naskah <-> Code Drift -- Action Items for the Code Side

**Tanggal:** 2026-05-20
**Sumber naskah (urut mtime DESC):**

| File | mtime | Size | Catatan |
|---|---|---|---|
| `naskah/Naskah TA 17-05-26.docx` | 2026-05-17 15:37 | 15 MB | Naskah utama BAB I-V |
| `naskah/_workflow_claude_gemini_dian.md` | 2026-05-17 15:31 | 16 KB | Workflow 3-pihak Dian+Claude+Gemini |
| `naskah/_inkonsistensi_3way_review.md` | 2026-05-17 15:28 | 22 KB | Audit 3-arah sebelumnya |
| `naskah/_dian_naskah_extracted.md` | 2026-05-17 15:18 | 149 KB | Ekstrak teks BAB I-V (1467 baris) |
| `naskah/5.2.3 Pengujian Black Box.docx` | 2026-05-17 15:17 | 41 KB | Tabel 5.1 Black Box (TC-* test cases) |
| `naskah/bab5_final/5.2.1 Pembahasan Basis Data.docx` | 2026-05-17 12:18 | 11.5 MB | BAB V.2.1 |
| `naskah/bab5_final/5.1.2 Implementasi Sistem.docx` | 2026-05-17 12:18 | 10.5 MB | BAB V.1.2 |
| `naskah/bab_split/BAB_V_*` + `BAB_IV_*.docx` | 2026-05-17 12:18 | ~10 MB | Split per bab |

Audit lama (`_inkonsistensi_3way_review.md`) sudah memetakan 12 inkonsistensi 3-arah. Laporan ini mempersempit ke **action di sisi kode** (option B / "frontend dipertahankan, naskah direvisi" tidak dibahas di sini -- itu pekerjaan Dian + Gemini).

---

## Ringkasan eksekutif

Naskah BAB IV-V mendesain sistem dengan: (a) 2 aktor (Teknisi + Manajer), (b) form Daily Report mandiri untuk Teknisi, (c) Review Gate yang membatasi transition `done` ke Manajer saja, (d) RBAC yang memblokir URL manipulation, (e) Self-Performance Dashboard menampilkan SPI per-teknisi, (f) 3 status task. Kode saat ini punya: 3 aktor (Admin penuh dengan 3 halaman dedicated), tidak ada form Daily Report (tabel `daily_reports` ada di schema tapi tidak diisi UI), tidak ada role check pada transition `done`, layout protected hanya cek token (bukan role), Tech Dashboard tidak menampilkan SPI personal, dan 5 status di enum.

Verifikasi: 2026-05-20.

---

## HIGH severity (4)

### H1. Daily Report form -- belum diimplementasi (naskah klaim ada)

**Naskah:** BAB IV par.235 "Teknisi dapat mengisi langsung formulir laporan progres harian...". BAB IV Gambar 4.19 "Antarmuka Tambah Daily Report" -- exclusive Teknisi. BAB V Gambar 5.11 "Implementasi Daily Report".

**Realita kode:**
- Schema: tabel `daily_reports` ada (`frontend/database/schema.sql`)
- Handler: hanya `SELECT` di `frontend/src/lib/handlers/dashboard.ts:38,89,379,680` dan `projects.ts:45,150`
- Insert: zero. Grep `INSERT INTO daily_reports` -> hanya muncul di `src/lib/__tests__/spiCalculator.test.ts:178` (test fixture)
- View: tidak ada page `TechnicianDailyReportPage.tsx` atau form `DailyReportForm.tsx`. Sidebar tidak punya menu "Tambah Daily Report"

**Action kode (jika pilih implementasi):**
1. Buat handler POST `frontend/src/lib/handlers/dashboard.ts` -> `createDailyReport`:
   ```ts
   export async function createDailyReport(request: NextRequest) {
     const auth = await requireAuth(request);
     if (!auth.ok) return auth.response;
     const { project_id, report_date, progress_percentage, constraints, notes } = await request.json();
     // Validate Teknisi assigned to project
     // INSERT INTO daily_reports (project_id, report_date, progress_percentage, constraints, notes, created_by)
     // Trigger recalculateSPI(project_id)
   }
   ```
2. Route di `frontend/src/app/api/[...route]/route.ts` POST `/api/daily-reports`
3. UI: tambah `frontend/src/views/DailyReportFormPage.tsx` + hook `useDailyReports.ts`
4. Sidebar entry untuk role technician: "Tambah Daily Report"

**Effort:** ~4 jam (1 handler + 1 page + 1 hook + sidebar wire-up + test)

**Alternatif (option B):** Hapus klaim form di BAB IV par.235, hapus Gambar 4.19 + Gambar 5.11, jelaskan "progres harian diturunkan otomatis dari perubahan status task pada Kanban". Lebih sedikit pekerjaan tapi merevisi narasi cukup banyak.

### H2. Admin role bocor ke demo (naskah eksklusi Admin)

**Naskah:** BAB IV par.232 "Peran Admin tidak dimasukkan karena bertindak sebagai pengelola sistem... bukan pengguna akhir operasional."

**Realita kode:**
- `frontend/database/schema.sql` users.role enum mencakup `'admin'`
- 3 halaman exclusive: `/users` (`UserManagementPage.tsx`), `/technicians` (`TechnicianManagementPage.tsx`), `/audit-log` (`AuditLogPage.tsx`)
- Sidebar (`src/components/ui/Layout.tsx`) menampilkan menu-menu ini untuk role admin

**Action kode (jika pilih sembunyikan):**
1. Layout sidebar: hapus 3 menu admin atau ganti `if (role === 'admin')` -> `if (false)` untuk demo
2. Route halaman tetap di codebase (tidak hapus -- code-on-disk ok, hanya UI gate)
3. Seed: ubah `'Admin SHI'` role dari `'admin'` -> tidak diseed sama sekali (atau hapus dari `database/seed.sql`)
4. Auth handler `register` sudah benar (line 52-53) -- `allowedRoles = ['technician', 'manager']`, admin tidak bisa registrasi

**Effort:** ~30 menit (toggle UI + edit seed)

**Alternatif:** Tambah Admin ke BAB IV sebagai aktor ke-3 dengan justifikasi "diperlukan untuk onboarding pengguna".

### H3. Review Gate tidak ter-enforce (naskah desain Manajer-only `done`)

**Naskah:** BAB IV Gambar 4.6 "Activity Diagram Pelaporan Progres Harian, Validasi Tugas, & Kalkulasi SPI (Review Gate)". Sequence 4.11 "Pelaporan ReviewGate".

**Realita kode:**
- `frontend/src/lib/handlers/tasks.ts:280-345` `updateTaskStatus()` -- TIDAK ada check `if (newStatus === 'done' && auth.user.role === 'technician')`
- Teknisi bisa drag card ke kolom "Done" langsung dari Kanban
- `recalculateSPI()` (line 346) dipanggil pada SETIAP status change, bukan hanya saat Manager set Done
- Schema CHECK constraint (`schema.sql:127`) mengizinkan transition apa saja antar 5 status, tidak enforce alur

**Action kode:**
1. Edit `frontend/src/lib/handlers/tasks.ts` di sekitar baris 308 (sebelum UPDATE):
   ```ts
   const newStatus = status !== undefined ? status : (row.status as string);
   const oldStatus = row.status as string;
   // Review Gate: only manager/admin can transition any task -> done
   if (newStatus === 'done' && oldStatus !== 'done' && auth.user.role === 'technician') {
     return NextResponse.json({
       success: false,
       error: 'Hanya Manajer yang dapat menandai tugas sebagai Done (Review Gate).',
     }, { status: 403 });
   }
   ```
2. Frontend: di `TaskStatusSelect.tsx` + `KanbanBoard.tsx`, sembunyikan opsi "Done" untuk role technician (preventif UX, error 403 tetap jadi fallback).
3. Tambah test di `frontend/src/lib/handlers/__tests__/tasks.test.ts`: teknisi POST status=done -> 403.

**Effort:** ~1 jam (handler + UI gate + test).

**Catatan terkait:** TC-MN-03 dan TC-SYS-01 di Tabel 5.1 saat ini sudah mengklaim Review Gate berfungsi. Setelah enforcement ini ditambah, test case-nya pass beneran.

### H4. RBAC URL guard absen di layout (TC-AUTH-03 fails)

**Naskah:** Tabel 5.1 TC-AUTH-03 "Sistem mengeksekusi validasi RBAC dan memblokir akses (URL manipulation)".

**Realita kode:** `frontend/src/app/(protected)/layout.tsx:23-34` hanya cek `token` + `user` di localStorage. Tidak cek role. Technician yang sudah login bisa navigate ke `/dashboard` (manager-only page), halaman tetap render walaupun API call balas 403.

**Action kode:** Tambah role-based redirect di `(protected)/layout.tsx`:
```ts
const MANAGER_PATHS = ['/dashboard', '/projects', '/clients', '/reports', '/timeline', '/schedule', '/escalations', '/audit-log'];
const ADMIN_PATHS = ['/users', '/technicians', '/audit-log'];

useEffect(() => {
  const token = localStorage.getItem('token');
  const user = getStoredUser();
  const pathname = window.location.pathname;

  if (!token || !user) { router.replace('/login'); return; }

  if (user.role === 'technician' && MANAGER_PATHS.some(p => pathname.startsWith(p))) {
    router.replace('/my-dashboard');
    return;
  }
  if (user.role !== 'admin' && ADMIN_PATHS.some(p => pathname.startsWith(p))) {
    router.replace(user.role === 'manager' ? '/dashboard' : '/my-dashboard');
    return;
  }

  setAuthorized(true);
  setChecked(true);
}, [router]);
```

**Effort:** ~30 menit. Sekaligus selesaikan TC-AUTH-03 dan H2 (admin URL juga tertutup untuk non-admin).

---

## MEDIUM severity (3)

### M1. Self-Performance SPI tidak ditampilkan (naskah klaim ada)

**Naskah:** BAB IV par.236 + Gambar 4.24 "Dashboard Performa Saya" -- eksklusif Teknisi, menampilkan SPI pribadi.

**Realita kode:** `frontend/src/views/TechnicianDashboard.tsx` -- grep `SPI` => 0 hit (1 false positive di className `border-b-2`). Yang ada: task count by status, project health dot, productivity chart, time-spent chart. Tidak ada nilai SPI per-teknisi.

**Action kode:**
1. Backend: tambah handler `getTechnicianSPI(userId)` di `frontend/src/lib/handlers/dashboard.ts` -- aggregate weighted SPI dari semua project teknisi tersebut, formula: `sum(spi_value * task_count_assigned_to_user) / sum(task_count_assigned_to_user)`.
2. Route: GET `/api/dashboard/technician/spi`
3. Hook: `useTechnicianSPI()` di `useDashboard.ts`
4. UI: tambah card "SPI Pribadi" di top `TechnicianDashboard.tsx` -- big number + RAG color (>=0.95 hijau, >=0.85 amber, <0.85 merah).

**Effort:** ~2 jam.

**Alternatif:** Revisi BAB IV par.236 + Tabel 5.1 TC-TK-04 -> "ringkasan task pribadi tanpa metrik SPI agregat".

### M2. Manajer scope -- naskah klaim observer, kode = doer penuh

**Naskah:** BAB IV par.245 "Manajer dibatasi pada pemantauan dashboard... tanpa wewenang mengelola data finance/material".

**Realita kode:** Manager bisa CRUD project, client, task, budget_items, materials, assignments, escalations. Class diagram (BAB IV par.430-431) juga menyebut budget_items + materials, kontradiksi internal naskah.

**Action kode (jika pilih batasi manager seperti naskah):**
1. Tambah role check di handler `materials.ts` (jika ada) dan `budget.ts` -- reject jika `role === 'manager'`, allow `admin` saja
2. UI: sembunyikan menu/section budget+material untuk manager

**Tapi:** ini bertentangan dengan kebutuhan operasional aktual. Manager memang seharusnya doer di sistem PM. Lebih realistis: revisi naskah par.245 saja.

**Rekomendasi:** OPTION B (revisi naskah). Tidak ada action kode.

### M3. Status enum 5 vs naskah 3

**Naskah:** BAB IV Gambar 4.22 "tiga fase progres (To Do, Working On It, Done)".

**Realita kode:** Schema CHECK constraint 5 status. Kanban 5 kolom.

**Action kode (jika pilih kollapse ke 3):**
1. Migration `frontend/database/migration.sql`:
   ```sql
   UPDATE tasks SET status = 'working_on_it' WHERE status IN ('in_progress', 'review');
   ALTER TABLE tasks DROP CONSTRAINT task_status_check;
   ALTER TABLE tasks ADD CONSTRAINT task_status_check CHECK (status IN ('to_do', 'working_on_it', 'done'));
   ```
2. Frontend: hapus 2 kolom Kanban (`in_progress`, `review`), update `TaskStatusSelect.tsx` options
3. Seed: ubah seed.sql untuk hilangkan 2 status tersebut
4. Test: update test fixtures

**Effort:** ~2 jam. Risk: kehilangan in_progress/review semantics.

**Alternatif (rekomendasi):** Revisi BAB IV Gambar 4.22 caption -> "lima fase progres". Lebih jujur, no code change.

---

## LOW severity (1)

### L1. Real-time claim (TC-MN-04) over-claims

**Naskah:** Tabel 5.1 TC-MN-04 "Sistem... meneruskannya kembali ke halaman antarmuka Teknisi yang bersangkutan secara real-time."

**Realita kode:** TanStack Query polling (`useNotifications.ts` likely 30s refetch). Bukan WebSocket push.

**Action kode (jika pilih beneran real-time):** Tambah WebSocket / Server-Sent Events. Effort tinggi (~1-2 hari) untuk demo TA.

**Rekomendasi:** Revisi Tabel 5.1 TC-MN-04 string "secara real-time" -> "pada permintaan pembaruan data berikutnya" atau "secara asinkronus".

---

## Prioritas eksekusi (jika code-side)

Urutan rekomendasi, paling cepat first dan rasio value/effort tertinggi:

1. **H4 RBAC layout guard** (~30 min) -- one file edit, langsung close TC-AUTH-03 + memperkuat H2
2. **H2 Admin hide** (~30 min) -- sidebar toggle + seed edit
3. **H3 Review Gate enforcement** (~1 jam) -- handler edit + 1 UI gate + 1 test, menutup TC-MN-03 dan TC-SYS-01
4. **M1 Self-Performance SPI** (~2 jam) -- handler + UI + hook, menutup TC-TK-04
5. **H1 Daily Report form** (~4 jam) -- full feature build. Atau revisi naskah (option B).

Total quick wins (1-4): ~4 jam. H1 sendiri ~4 jam tergantung pilihan.

**M2 dan M3 dan L1:** rekomendasikan revisi naskah saja (option B), tidak ada code change worth it untuk demo TA.

---

## Konsisten (no action)

Diambil dari audit sebelumnya, masih valid per verifikasi 2026-05-20:

- Schedule clash detection (`handlers/tasks.ts:findConflicts`)
- RAG indicator threshold SPI (`lib/spiCalculator.ts`)
- Project sort by criticality (`handlers/projects.ts`)
- Task Evidence upload (`components/evidence/EvidenceUploader.tsx`)
- Eskalasi flow (`handlers/escalations.ts` + `views/EscalationsPage.tsx`)
- Earned Value chart (`components/charts/EarnedValueChart.tsx`)

---

## Catatan

- Tidak ada perubahan pada file naskah `.docx` -- naskah READ-ONLY per project memory.
- Audit lama (`_inkonsistensi_3way_review.md` 2026-05-17) tetap valid dan lebih lengkap untuk pilihan B (revisi naskah).
- Verifikasi semua finding ulang sebelum eksekusi -- pace pengembangan cepat, code state berubah harian.
