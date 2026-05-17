# Perancangan BAB V Final — v2 (Ringkas + Akademik)

## Prinsip

1. **Sumber tunggal**: hanya rancangan yang ada di BAB IV `Naskah TA 15-05-26.docx`. Tidak menambah modul/tabel di luar itu.
2. **Ringkas tapi akademik**: tiap item = 1 paragraf naratif (3–5 kalimat). Tidak ada bullet di body, tidak ada filler "demikianlah".
3. **Bukti nyata**: 5.2.1 wajib query + screenshot SQL + screenshot hasil → bukti operasi berhasil dijalankan.
4. **Kode utuh tapi terfokus**: 5.1.2 tampilkan fungsi handler asli, namun kalau lebih dari ~40 baris, potong helper/validasi & beri penanda `// ... validasi & error handling`.

---

## 5.1.2 Implementasi Sistem — Kode yang dibahas

Total 10 modul (sesuai BAB IV §4.3.5). Untuk tiap modul: 1 paragraf narasi (≤5 kalimat) + 1 listing kode handler TypeScript dari `frontend/src/lib/handlers/`.

| # | Modul (BAB IV) | File | Fungsi | Inti yang ditonjolkan | Target baris listing |
|---|---|---|---|---|---|
| 1 | Halaman Login                              | `auth.ts`       | `login`                  | Validasi kredensial via `tb_user`, bandingkan bcrypt, terbitkan JWT cookie | 25–35 |
| 2 | Halaman Tambah Proyek                      | `projects.ts`   | `createProject`          | INSERT `tb_proyek` + init baris kesehatan proyek, dalam satu transaksi    | 25–35 |
| 3 | Halaman Tambah Daily Report                | `activities.ts` | `createActivity`         | Validasi otorisasi teknisi, INSERT activity, update `time_spent`          | 30–40 |
| 4 | Halaman Dashboard EWS                      | `dashboard.ts`  | `getDashboard`           | Agregasi RAG (SPI thresholds), urutan kritikal, ringkasan metrik          | 30–45 |
| 5 | Halaman Data Proyek                        | `projects.ts`   | `listProjects`           | SELECT tb_proyek JOIN tb_klien + filter status/fase/kategori              | 25–30 |
| 6 | Halaman Kanban Penugasan Proyek            | `tasks.ts`      | `changeTaskStatus`       | Validasi gate "done" (manajer-only), trigger rekalkulasi SPI              | 35–45 (POTONG dari 119 baris) |
| 7 | Halaman Jadwal Proyek                      | `tasks.ts`      | `getScheduleTasks`       | Range query timeline + grouping per teknisi                                | 20–28 |
| 8 | Halaman Dashboard Performa Teknisi         | `dashboard.ts`  | `getTechnicianDashboard` | Agregasi per-teknisi: distribusi status, overdue, ringkasan eskalasi      | 30–45 |
| 9 | Halaman Detail Proyek                      | `projects.ts`   | `getProject`             | Proyek + JOIN klien + kesehatan proyek + tim teknisi                       | 30–40 |
| 10| Halaman Laporan Kesehatan Proyek           | `dashboard.ts`  | `chartEarnedValue`       | Hitung PV/EV/AC sepanjang rentang proyek                                  | 35–45 |

**Strategi potong**: untuk fungsi 60+ baris (`getDashboard`, `changeTaskStatus`, `getTechnicianDashboard`), tampilkan blok inti & ganti bagian repetitif dengan komentar `// ... (validasi & error handling)`. Tujuan: pembaca melihat alur logika, bukan boilerplate.

**Output 5.1.2**: 1 heading + 1 paragraf pembuka + 1 catatan pemetaan tb_*→base tables + 10 entri × (heading modul + 1 paragraf + 1 code listing + 1 caption). Estimasi 8–12 halaman A4.

---

## 5.2.1 Pembahasan Basis Data — Tabel yang dibahas

7 tabel (sesuai BAB IV §4.3 Perancangan Fisik Basis Data). Untuk tiap tabel: heading + loop 4 op CRUD. Tiap op: 1 paragraf narasi (3–5 kalimat) + 2 screenshot (SQL pane + hasil eksekusi) + 2 caption.

| # | Tabel | Operasi yang ditampilkan | Bukti hasil |
|---|---|---|---|
| 1 | tb_user             | INSERT, SELECT, UPDATE, DELETE | INSERT 0 1 / n rows / UPDATE 1 / DELETE 1 |
| 2 | tb_klien            | INSERT, SELECT, UPDATE, DELETE | idem |
| 3 | tb_proyek           | INSERT, SELECT, UPDATE, DELETE | idem |
| 4 | tb_penugasan_proyek | INSERT, SELECT, UPDATE, DELETE | idem |
| 5 | tb_tugas            | INSERT, SELECT, UPDATE, DELETE | idem |
| 6 | tb_bukti            | INSERT, SELECT, UPDATE, DELETE | idem |
| 7 | tb_eskalasi         | INSERT, SELECT, UPDATE, DELETE | idem |

**Output 5.2.1**: 1 heading + 1 paragraf pembuka + 7 tabel × 4 op × (1 paragraf + 2 SS + 2 caption) = **28 paragraf + 56 SS**. Estimasi 14–18 halaman A4.

**Anti-bertele-tele**:
- Paragraf SELECT/UPDATE/DELETE TIDAK mengulang frasa pembuka yang identik antar tabel. Variasi pembuka: "Query SELECT pada tabel X berfungsi…", "Pengambilan data dari tabel X dilakukan…", "Pada tabel X, perintah SELECT diimplementasikan untuk…".
- Tiap paragraf wajib menyebut: (a) tujuan operasi, (b) kapan dieksekusi di sistem, (c) hasil/efek pada basis data atau modul terkait.
- Tidak ada paragraf "filler" antar tabel.

---

## Pembagian Kerja Gemini ↔ Claude (Orchestrator)

| Tugas | Pelaku |
|---|---|
| Briefing & rules | Claude (sudah dikirim ke Gemini via `gemini_briefing.md`) |
| Generate paragraf narasi (5.1.2 & 5.2.1) | Gemini (dipanggil per item via `gemini_ask.sh`) |
| Extract code dari handler TS | Claude (Python regex) |
| Eksekusi SQL & capture SS | Claude (psycopg2 + Pillow) |
| Assemble docx | Claude (python-docx) |
| Review konsistensi gaya antar paragraf | Gemini (batch review akhir) |

Setiap panggilan Gemini pakai `gemini_ask.sh` → `--resume <SESSION_ID>` agar chain context terjaga. Log tiap panggilan disimpan di `_build/gemini_log/`.

---

## Pertanyaan untuk dikonfirmasi sebelum eksekusi v2

1. **Potong fungsi panjang di 5.1.2** (terutama `changeTaskStatus` 119 baris, `getDashboard` 108 baris, `getTechnicianDashboard` 91 baris) — setuju? Atau tetap tampilkan utuh meski jadi lebih panjang?
2. **Narasi 5.2.1 di-regenerasi seluruhnya via Gemini** (28 paragraf baru) atau cukup beberapa yang terasa repetitif?
3. **Code listing 5.1.2: pakai SQL dengan `tb_*` view atau biarkan apa adanya dengan catatan pemetaan?** Saat ini v1 pakai catatan pemetaan. Refactor handler menyentuh runtime app — perlu konfirmasi sebelum dieksekusi.
