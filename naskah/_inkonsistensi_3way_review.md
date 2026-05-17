# Inkonsistensi 3-Arah: Naskah ↔ Frontend ↔ Tabel 5.1 Black Box

**Untuk:** Dian Putri Iswandi
**Tujuan:** Membantu kurasi konsistensi gaya bahasa, klaim teknis, dan lingkup sistem
**Tanggal review:** 17 Mei 2026
**Sumber pembanding:**
- `naskah/Naskah TA 17-05-26.docx` (BAB I-V)
- `frontend/` (kode implementasi sebenarnya)
- `naskah/5.2.3 Pengujian Black Box.docx` (deliverable testing baru)

---

## RINGKASAN VERDICT

| Inkonsistensi | Severity | Saran |
|---|---|---|
| Naskah eksklusi Admin, tapi frontend punya Admin penuh (3 halaman dedicated) | TINGGI | Pilih: tambah Admin di naskah, ATAU hapus halaman Admin di frontend untuk demo |
| Naskah batasi Manajer hanya "pemantauan dashboard, tanpa CRUD finance/material", frontend Manajer punya CRUD lengkap (klien, budget, material, user) | TINGGI | Revisi narasi BAB IV — Manajer adalah doer, bukan observer |
| Naskah klaim ada "form daily report" mandiri, frontend tidak punya | TINGGI | Hapus klaim form, tegaskan progres diturunkan dari status task |
| Naskah klaim Self-Performance Dashboard dengan SPI pribadi, frontend tidak menampilkan SPI per-teknisi | SEDANG | Implementasi belum lengkap — atau ubah klaim ke "task summary + project health" |
| Naskah klaim "Review Gate" (Manajer-only validasi sebelum SPI dikomputasi), frontend tidak menerapkan gate | SEDANG | Implementasi tidak match desain Activity/Sequence Diagram — atau backend perlu enforce |
| Naskah klaim 3 status task (To Do / Working On It / Done), frontend punya 5 (+ in_progress, review) | RINGAN | Naskah understates — sebut 5 status atau jelaskan in_progress/review sebagai sub-state |
| Tabel 5.1 TC-MN-03 enforce Manajer-only Done, frontend tidak enforce | SEDANG | Test case mencerminkan desain naskah, bukan realita. Sesuaikan deskripsi atau benerin backend |
| Tabel 5.1 TC-TK-04 klaim Teknisi lihat SPI pribadi, frontend tidak menampilkan | SEDANG | Sama dengan poin Self-Performance — revisi deskripsi atau bangun fitur |
| Tabel 5.1 TC-AUTH-03 klaim RBAC blokir URL manipulation, frontend layout hanya cek auth (bukan role) | SEDANG | Tambah role guard di frontend layout, atau revisi klaim test case |
| Tabel 5.1 TC-TK-01 lompat to_do → working_on_it, lewati in_progress | RINGAN | Realistis: to_do → in_progress → working_on_it. Sesuaikan deskripsi |

---

## A. NASKAH BAB IV-V vs FRONTEND (klaim Dian vs realita)

### A.1. Lingkup aktor — naskah eksklusi Admin, frontend punya Admin lengkap

**Naskah BAB IV (line 232):**
> "Terdapat dua kategori pengguna utama yang akan berinteraksi langsung dengan sistem pemantauan ini, yaitu Teknisi dan Manajer. Peran Admin tidak dimasukkan karena bertindak sebagai pengelola sistem (system administrator), bukan sebagai pengguna akhir (end-user) operasional."

**Frontend reality:**
- 3 role enum: `technician`, `manager`, `admin`
- 3 halaman EXCLUSIVE untuk Admin:
  - `/users` (UserManagementPage): CRUD user, reset password, deactivate/activate
  - `/technicians` (TechnicianManagementPage): manage technician assignments
  - `/audit-log` (AuditLogPage): audit trail semua perubahan entitas
- Backend `authorizeRoles(['admin'])` guard di routes user management

**Implikasi:** Penguji yang baca naskah akan ekspektasi 2 aktor, tapi demo sistem tampil 3 aktor + Admin punya UI sendiri. **Pertanyaan jebakan**: "Kalau Admin bukan end-user, kenapa ada halaman User Management?"

**Saran kurasi:**
1. (Opsi konservatif) Hapus implementasi Admin dari demo final. Tambah catatan "feature scoped out for thesis demo".
2. (Opsi inklusif) Tambah Admin sebagai aktor ke-3 di BAB IV dengan justifikasi "diperlukan untuk onboarding pengguna sistem ke lingkungan operasional".

### A.2. Lingkup Manajer — naskah batasi observer, frontend Manajer adalah doer

**Naskah BAB IV (line 245):**
> "Hak akses Manajer dibatasi pada pemantauan dashboard dan evaluasi kinerja operasional, tanpa wewenang atau kebutuhan untuk mengelola data di luar lingkup daily report (seperti data keuangan atau pengadaan material)."

**Frontend reality:**
- Manager DAPAT: create/update/delete projects, create clients (dengan G Maps coordinate resolution), CRUD task lengkap, approve/reject survey, assign technicians, export reports XLSX, dan **menurut class diagram BAB IV-mu sendiri (Tabel 4.8 Class Escalation): resolve eskalasi + send instruction**
- Class diagram juga punya `budget_items` + `materials` tables (line 430-431)
- Frontend punya inline edit untuk `project_value`, `phase`, `category`

**Implikasi:** Narasi BAB IV memposisikan Manajer sebagai "pengawas pasif", padahal implementasi-nya Manajer adalah aktor paling aktif (CRUD penuh). Inkonsistensi narasi internal: Manajer punya budget+material tabel di class diagram, tapi di narasi user "tanpa wewenang kelola finance/material".

**Saran kurasi:**
- Update BAB IV: "Manajer berperan sebagai operator utama backbone sistem, dengan tanggung jawab penuh atas tata kelola data master (proyek, klien) dan operasional (penugasan, validasi, eskalasi)."
- Atau: hapus klaim "tanpa wewenang kelola finance/material" jika fitur budget/material memang dipakai di demo.

### A.3. Daily Report — naskah klaim ada form, frontend tidak punya

**Naskah BAB IV (line 235):**
> "Teknisi dapat melakukan input Daily Report mandiri. Teknisi dapat mengisi langsung formulir laporan progres harian segera setelah menyelesaikan pengerjaan di lokasi klien, yang mencakup rincian tugas, persentase Earned Value, dan catatan kendala operasional tanpa melalui perantara manajer."

**Naskah BAB IV Gambar 4.19 (line 448):**
> "Rancangan antarmuka halaman 'Tambah Daily Report' yang secara spesifik diakses oleh pengguna dengan hak otorisasi Teknisi."

**Frontend reality:**
- TIDAK ADA halaman/form bernama "Tambah Daily Report" atau "Daily Report"
- Progres turun otomatis dari perubahan status task pada Kanban
- Backend `recalculateSPI()` query `daily_reports` table — tapi pengisian baris `daily_reports` tidak via form user, mungkin via trigger backend atau script

**Implikasi:** Penguji yang lihat rancangan UI Gambar 4.19 akan mencari form Daily Report di demo. Tidak ada. **Inkonsistensi paling kritikal** karena daily report adalah core feature di judul TA.

**Saran kurasi:**
- Pilih satu narasi konsisten:
  - **A.** Naskah dipertahankan, frontend tambahkan form Daily Report sebagai screen baru (Teknisi)
  - **B.** Frontend dipertahankan, naskah direvisi: "progres harian diturunkan dari perubahan status tugas pada Kanban — Teknisi tidak perlu mengisi form terpisah, sistem mengakumulasi progres dari aktivitas operasional yang dicatat".
- Opsi B lebih elegan (no double-entry), tapi requires rewrite Gambar 4.19 + paragraf-paragraf terkait.

### A.4. Self-Performance Dashboard — naskah klaim ada SPI pribadi, frontend tidak

**Naskah BAB IV (line 236):**
> "Teknisi dapat mengakses Self-Performance Dashboard. Ini memungkinkan teknisi untuk melihat visualisasi ringkas nilai Schedule Performance Index (SPI) pribadi yang dikalkulasi secara otomatis dari akumulasi data laporan harian mereka."

**Naskah BAB IV Gambar 4.24 (line 470):**
> "Rancangan antarmuka 'Dashboard Performa Saya' yang secara eksklusif dialokasikan bagi pengguna dengan hak akses Teknisi."

**Frontend reality:**
- `/my-dashboard` (TechnicianDashboard) menampilkan: task count per status (to_do, in_progress, working_on_it, review, done, overtime, over_deadline), project list dengan health dot RAG, task list, productivity chart, time-spent chart, escalation summary
- **TIDAK menampilkan nilai SPI per-teknisi** — SPI di sistem hanya per-project, bukan per-user

**Implikasi:** Klaim BAB IV tidak tervalidasi oleh implementasi. Test case TC-TK-04 yang saya bikin juga ikut salah (lihat C.2).

**Saran kurasi:**
- (A) Backend tambahkan endpoint `/api/dashboard/technician-spi/:userId` yang aggregate SPI dari semua project teknisi tersebut. Frontend tampilkan.
- (B) Revisi BAB IV: "Self-Performance Dashboard menampilkan ringkasan task pribadi, status overtime/over-deadline, dan health indicator proyek-proyek yang diikuti — sebagai bentuk swamonitoring tanpa perlu metrik agregat SPI per-individu."

### A.5. Review Gate — naskah desain Manajer-validates-first, frontend any-role-can-done

**Naskah BAB IV Gambar 4.6 caption (line 283):**
> "Activity Diagram Pelaporan Progres Harian, Validasi Tugas, & Kalkulasi SPI (Review Gate)"

**Narasi (line 284):**
> "Proses diawali oleh Manajer yang membuat data proyek berdasarkan jadwal tertentu. Sistem kemudian secara otomatis... [diagram menggambarkan Manajer-only validation gate sebelum SPI dikomputasi]"

**Frontend reality:**
- `frontend/src/lib/handlers/tasks.ts:287-388` `updateTaskStatus()` — TIDAK ada role check untuk transition ke `done`. Teknisi bisa langsung mark done sendiri.
- `recalculateSPI()` dipanggil pada SETIAP status change, bukan hanya saat Manajer set Done.
- Status `review` ada di enum (between `working_on_it` dan `done`), tapi tidak di-enforce sebagai gate.

**Implikasi:** Penguji yang teliti baca Activity Diagram 4.6 + Sequence Diagram 4.11 akan tanya "mana Review Gate-nya di demo?". Tidak terlihat sebagai mekanisme yang berbeda dari status biasa.

**Saran kurasi:**
- (A) Backend enforcement: tambah role check di `updateTaskStatus()` — hanya `manager` + `admin` yang boleh transition ke `done` dari `review`. Backend reject dengan HTTP 403 jika Teknisi coba.
- (B) Revisi BAB IV: Review Gate diturunkan menjadi "alur disiplin operasional" bukan "hard enforcement" — Teknisi mark Done, tapi Manajer punya hak revisi via update status balik ke `working_on_it` jika evidence kurang.

### A.6. Status task — naskah 3 fase, frontend 5 status

**Naskah BAB IV Gambar 4.22 (line 463):**
> "Rincian tugas divisualisasikan ke dalam tiga fase progres (To Do, Working On It, Done)."

**Frontend reality:**
- Status enum: `to_do | in_progress | working_on_it | review | done`
- Kanban board menampilkan 5 kolom

**Implikasi:** Ringan, tapi pengamat detail akan notice.

**Saran kurasi:**
- Revisi BAB IV: "Rincian tugas divisualisasikan ke dalam lima fase progres (To Do, In Progress, Working On It, Review, Done) yang merepresentasikan tahap dekomposisi pengerjaan dari belum dimulai, sedang berlangsung, hingga selesai dan tertinjau."
- Atau: tutup 2 status (in_progress, review) di UI demo agar match dengan 3 fase yang ditulis.

### A.7. Yang KONSISTEN ✓ (no action)
- Schedule clash detection (Gambar 4.5 → frontend handlers/tasks.ts:47-66)
- RAG indicator dengan threshold SPI (Gambar 4.7 → spiCalculator.ts:46-51)
- Project sort by urgency kritis→top (Gambar 4.7 → handlers/projects.ts:49-51)
- Task Evidence upload (Tabel 4.7 → EvidenceUploader.tsx)
- Eskalasi flow (Tabel 4.8 + Gambar 4.8/4.13 → /escalations + /my-escalations)
- Earned Value chart (Gambar 4.7 + 4.12 → EarnedValueChart.tsx + spiCalculator.ts:94-100)

---

## B. NASKAH BAB IV vs BAB V — Konsistensi internal Dian

### B.1. Class diagram (BAB IV) menyebut entitas yang lingkup user (BAB IV) tidak butuhkan

**BAB IV Class diagram (line 320-355):**
- Class User, Client, Project, ProjectAssignment, ProjectHealth, Task, TaskEvidence, **Escalation**

**BAB IV User scope (line 232):**
- Cuma 2 user: Teknisi + Manajer
- Manajer "tanpa wewenang kelola finance/material"

**BAB IV Physical DB (line 430-431):**
- `shi_budget_items` tabel ada
- `shi_materials` tabel ada

**Inkonsistensi internal:** Kalau Manajer tidak kelola budget/material, kenapa class + tabel-nya didesain di BAB IV? Class diagram seharusnya derivative dari user requirements, bukan dari implementasi yang lebih luas.

**Saran:** Hapus `shi_budget_items` + `shi_materials` dari class diagram + ERD BAB IV jika scope-nya benar-benar dibatasi. ATAU tambah user-requirement bullet untuk Manajer: "mengelola anggaran dan material proyek sebagai bagian dari tata kelola pengadaan".

### B.2. BAB V Implementasi tidak match urutan BAB IV Perancangan

**BAB IV punya:**
- 4.3.5.1 Antarmuka Data Input → Login, Tambah Proyek, Tambah Daily Report
- 4.3.5.2 Antarmuka Data Proses → Dashboard EWS, Data Proyek, Kanban Penugasan, Jadwal Proyek
- 4.3.5.3 Antarmuka Data Output → Dashboard Performa Saya, Detail Proyek, Laporan Kesehatan Proyek

**BAB V 5.1.2 Implementasi Sistem (line 521-545):**
- Gambar 5.9 Implementasi autentikasi (Login) ✓
- Gambar 5.10 Implementasi tambah proyek ✓
- Gambar 5.11 Implementasi Daily Report (← klaim ada, padahal frontend tidak punya — lihat A.3)
- Gambar 5.12 Implementasi Kanban Penugasan ✓
- Gambar 5.13 Implementasi Dashboard EWS ✓
- Gambar 5.14 Implementasi EVM chart ✓
- TIDAK ada: "Implementasi Dashboard Performa Saya" (Self-Performance) — gap

**Saran:** Tambah Gambar 5.X Implementasi Dashboard Performa Saya di BAB V. Atau jika fitur tidak diimplementasi, hapus Gambar 4.24 dari BAB IV.

---

## C. TABEL 5.1 BLACK BOX (DOCX SAYA) vs FRONTEND

### C.1. TC-MN-03 — Klaim Manajer-only Review Gate, tidak di-enforce

**Test case saya:**
> "Manajer mengeksekusi mekanisme review gate dengan meninjau task evidence dari Teknisi dan memperbarui status menjadi Done. Hasil Diharapkan: Sistem merekam persetujuan Manajer secara presisi dan mengubah status tugas dari sedang ditinjau menjadi Done di basis data."

**Realita frontend:** Tak ada role enforcement. Teknisi bisa langsung mark done.

**Saran:** Salah satu:
- Tambah role guard di backend handlers/tasks.ts updateTaskStatus (`if newStatus === 'done' && currentUser.role === 'technician' → reject`)
- Atau ubah deskripsi test case: "Manajer meninjau task evidence dari Teknisi (yang berstatus review) dan secara manual memperbarui status menjadi Done sebagai bentuk persetujuan operasional."

### C.2. TC-TK-04 — Klaim Self-Performance Dashboard menampilkan SPI pribadi

**Test case saya:**
> "Sistem merender matriks kinerja individu dengan menyajikan kalkulasi SPI berdasarkan agregasi penugasan yang ditangani oleh Teknisi bersangkutan."

**Realita frontend:** `/my-dashboard` tidak menampilkan SPI per-teknisi.

**Saran:** Revisi deskripsi:
> "Sistem merender ringkasan kinerja individu Teknisi yang menyajikan agregasi status task pribadi, indikator overtime/over-deadline, serta visualisasi produktivitas berbasis waktu."

### C.3. TC-AUTH-03 — RBAC blokir URL manipulation

**Test case saya:**
> "Teknisi menginisiasi upaya untuk mengakses halaman dashboard Manajer melalui manipulasi URL langsung. Hasil Diharapkan: Sistem mengeksekusi validasi RBAC dan memblokir akses tersebut."

**Realita frontend:** `(protected)/layout.tsx:24-34` hanya cek `token` + `user` di localStorage, **tidak cek role**. Teknisi yang sudah login bisa navigate ke `/dashboard` URL — halaman mungkin tetap render, tapi API call yang membutuhkan manager role akan 403.

**Saran:** Salah satu:
- Tambah role guard di `(protected)/layout.tsx`: jika `user.role === 'technician'` dan pathname dimulai dengan `/dashboard | /projects | /clients | /reports | /timeline | /schedule | /escalations`, redirect ke `/my-dashboard`.
- Atau ubah deskripsi test case: "Sistem menampilkan halaman dashboard secara terbatas, namun seluruh permintaan API dari Teknisi diblokir oleh backend dengan respons HTTP 403 Forbidden, sehingga data Manajer tidak terekspos."

### C.4. TC-TK-01 — Skip in_progress status

**Test case saya:**
> "Teknisi melakukan pembaruan status pada papan kanban operasional dengan memindahkan tugas dari to_do menuju working_on_it."

**Realita frontend:** Status enum punya `in_progress` antara `to_do` dan `working_on_it`. Transisi langsung kemungkinan tetap di-allow, tapi tidak merepresentasikan flow normal.

**Saran:** Ubah jadi:
> "Teknisi melakukan pembaruan status pada papan kanban operasional dengan memindahkan tugas dari to_do menuju in_progress hingga working_on_it sebagai bentuk eskalasi tahap pekerjaan lapangan."

### C.5. TC-SYS-01 — EV computed on Manager review-gate Done

**Test case saya:**
> "Sistem merespons aksi persetujuan review gate dari Manajer yang merubah status penugasan menjadi Done. Hasil Diharapkan: Sistem mengomputasi nilai Earned Value secara otomatis berdasarkan bobot penugasan yang telah disetujui penyelesaiannya oleh Manajer."

**Realita frontend:** Recompute SPI/EV terjadi pada SETIAP status change (bukan khusus Manager set Done).

**Saran:** Revisi:
> "Sistem merespons aksi perubahan status penugasan menjadi Done. Hasil Diharapkan: Sistem mengomputasi nilai Earned Value secara otomatis dengan menambahkan bobot kontribusi penugasan tersebut ke dalam matriks agregasi progres proyek."

### C.6. TC-MN-04 — "real-time" claim

**Test case saya:**
> "Sistem memproses instruksi balasan tersebut dan meneruskannya kembali ke halaman antarmuka Teknisi yang bersangkutan secara real-time."

**Realita frontend:** Pakai TanStack Query (refetch interval / manual invalidate). Bukan WebSocket push. "Real-time" terlalu strong claim.

**Saran:** Ganti "secara real-time" → "secara asinkronus" atau "pada permintaan pembaruan data berikutnya".

---

## D. GAYA BAHASA / KONSISTENSI ITALIC

### D.1. Italic istilah asing — naskah Dian tidak konsisten

**Inkonsistensi terdeteksi:**
- "daily report" kadang italic, kadang tidak (sebagian besar tidak)
- "Earned Value" / "Planned Value" tidak italic di BAB IV-V
- "Schedule Performance Index" kadang italic, kadang tidak
- "dashboard" hampir tidak pernah italic (sangat sering muncul, jadi mungkin sengaja di-naturalisasi)
- "Early Warning System" / "EWS" tidak italic di mayoritas tempat
- "Role-Based Access Control" / "RBAC" tidak italic
- "Review Gate" italic di caption gambar (Gambar 4.6, 4.11) tapi tidak di body text

**Saran:** Buat keputusan editorial:
- (A) **Italic ketat untuk semua istilah asing teknis** — pastikan setiap kemunculan italic. Pakai Find/Replace di Word.
- (B) **Naturalisasi istilah** — istilah yang sangat sering muncul (dashboard, daily report, SPI, EWS) di-treat sebagai loanword, tidak italic. Istilah yang jarang (Review Gate, RBAC, Earned Value) tetap italic.

Untuk Tabel 5.1 docx saya, saat ini pakai italic ketat. **Disinkronisasi dengan keputusan di atas.**

### D.2. Istilah Bahasa Inggris vs Indonesia — perlu glosarium

**Pasangan yang sering muncul, kadang campur:**
- "task" vs "tugas"
- "evidence" vs "bukti"
- "kanban" vs "papan kerja"
- "review" vs "tinjauan"
- "submit" vs "mengirim" / "mengajukan"
- "approve" vs "menyetujui"
- "manager" (UI label) vs "Manajer" (naskah)

**Saran:** Tambah Glosarium di BAB I atau setelah Daftar Isi. Catat keputusan: "Istilah X dipertahankan dalam Bahasa Inggris karena... ; istilah Y diterjemahkan menjadi ... untuk konsistensi."

### D.3. Penomoran tabel — Tabel 5.1 saya bertabrakan dengan tabel-tabel yang sudah ada di BAB IV

**Cek naskah:** Tabel terakhir di naskah = Tabel 4.15 (Tabel Eskalasi). Tidak ada Tabel 5.X yang sudah eksis (Bab V cuma punya gambar).

**Tabel 5.1 saya:** "Tabel 5.1 Skenario dan Hasil Pengujian Black Box"

**Status:** Aman. Tabel 5.1 belum dipakai.

**Tapi:** Kalau nanti Bab V 5.1 Implementasi Basis Data juga butuh tabel (misal komparasi DBMS), perlu re-number. Saran: pakai `Tabel 5.X` dengan X = nomor sub-bab + sequence (5.2.3-1 atau 5.3-1) agar fleksibel.

### D.4. Caption gambar di Bab V — penomoran inkonsisten

**Cek dari extract:**
- Line 505: "Gambar 5.2 merepresentasikan implementasi fisik dari tabel relasi..."
- Line 507: "Gambar 5.5 menampilkan implementasi fisik dari tabel metrik kesehatan proyek..."
- Line 514: "Gambar 5.7 Implementasi Tabel Task Evidence" — caption-nya
- Line 459: "Gambar 4.2 merepresentasikan rancangan antarmuka halaman 'Data Proyek'"

Beberapa narasi mention Gambar X.X tapi caption-nya beda. Misal narasi sebut Gambar 5.5, tapi caption gambar berikutnya 5.7. **Auto-numbering Word kemungkinan broken di beberapa tempat.**

**Saran:** Cek manual setiap "Gambar X.X" di body text vs caption-nya. Word Cross-Reference Update (Ctrl+A → F9) bisa rebuild numbering.

---

## E. PRIORITAS AKSI UNTUK DIAN

### Wajib sebelum sidang
1. **A.3 (Daily Report mismatch)** — Pilih narasi konsisten, revisi BAB IV + BAB V. Ini core feature, dosen pasti tanya.
2. **A.1 (Admin scope)** — Putuskan: tambah Admin di naskah atau sembunyikan di demo. Halaman /users sangat terlihat.
3. **A.2 (Manajer scope)** — Revisi narasi: Manajer adalah doer bukan observer.
4. **C.3 (RBAC URL guard)** — Implementasi mudah (5 menit edit layout.tsx). Kalau tidak, revisi test case TC-AUTH-03.

### Sangat disarankan
5. **A.5 (Review Gate)** — Implementasi backend enforcement atau revisi Activity/Sequence Diagram di BAB IV.
6. **A.4 + C.2 (Self-Performance SPI)** — Tambah SPI pribadi di /my-dashboard atau revisi klaim.
7. **D.1 (Italic konsisten)** — Editorial pass setelah revisi selesai.
8. **D.4 (Caption number broken)** — Word cross-reference rebuild.

### Bagus untuk dipertimbangkan
9. **A.6 (3 vs 5 status)** — Revisi BAB IV atau filter UI demo.
10. **B.1 (Class diagram extra entities)** — Hapus budget/material atau tambah ke user requirements.
11. **D.2 (Glosarium)** — Tambah ke BAB I.

### Untuk Tabel 5.1 saya (Pengujian Black Box)
12. Revisi 5 test case: TC-AUTH-03, TC-MN-03, TC-MN-04, TC-TK-01, TC-TK-04, TC-SYS-01 (cek detail di Section C).
13. Setelah revisi naskah selesai, rebuild docx via `naskah/_build_blackbox_docx.py`.

---

## CATATAN PROSES

- Frontend recon dilakukan dengan Explore agent → 20 routes, 12 features di-cross-check, evidence ke file:line spesifik.
- Naskah extract: `naskah/_dian_naskah_extracted.md` (1467 lines).
- Tabel 5.1 docx: `naskah/5.2.3 Pengujian Black Box.docx`.
- Tidak ada perubahan pada `naskah/Naskah TA 17-05-26.docx` saat review ini.
