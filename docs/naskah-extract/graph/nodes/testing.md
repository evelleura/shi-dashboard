---
name: testing
description: Black Box testing results - 18 cases, 15 valid, 3 invalid (83.33%), with the 3 documented failures
metadata:
  type: reference
---

# Pengujian (Black Box)

`[[test:blackbox]]` Tabel 5.1 (BAB V 5.2.3, `../text/page-100.txt` .. `page-104.txt`). Fokus input/output tanpa lihat struktur kode. Skenario interaksi Manajer + Teknisi.

**Hasil: 18 skenario -> 15 valid, 3 tidak valid = 83.33%.**

Kategori: TC-AUTH (3), TC-MN (5, manajer), TC-TK (6, teknisi), TC-SYS (4, sistem).

## summary

| ID | Deskripsi | Status |
|----|-----------|--------|
| TC-AUTH-01 | Manajer login -> dashboard (RBAC manajer) | Valid |
| TC-AUTH-02 | Teknisi login -> halaman kanban | Valid |
| TC-AUTH-03 | Teknisi coba akses dashboard manajer via URL -> diblokir RBAC | Valid |
| TC-MN-01 | Manajer input data proyek baru | Valid |
| TC-MN-02 | Manajer tugaskan teknisi + validasi jadwal (anti-bentrok) | Valid |
| TC-MN-03 | Manajer review gate: tinjau bukti -> status Done | Valid |
| TC-MN-04 | Approve done -> SPI/EWS update real-time tanpa refresh | **Tidak Valid** |
| TC-MN-05 | Manajer kirim instruksi balasan eskalasi -> teruskan ke teknisi | Valid |
| TC-TK-01 | Teknisi geser kanban to_do -> working_on_it | Valid |
| TC-TK-02 | Teknisi unggah bukti (format valid) | Valid |
| TC-TK-03 | Tolak upload ekstensi tak didukung (.exe/.zip) | **Tidak Valid** |
| TC-TK-04 | Teknisi kirim laporan eskalasi -> notifikasi manajer | Valid |
| TC-TK-05 | Teknisi akses Self-Performance Dashboard (SPI pribadi) | Valid |
| TC-TK-06 | Cegah double-submit klik cepat "Kirim Laporan" | **Tidak Valid** |
| TC-SYS-01 | Hitung EV otomatis dari bobot penugasan disetujui | Valid |
| TC-SYS-02 | Hitung SPI (EV vs PV) -> render warna RAG saat periode lapor berakhir | Valid |
| TC-SYS-03 | Agregasi + urut proyek kritis ke atas | Valid |
| TC-SYS-04 | Validasi jadwal anti-bentrok saat alokasi teknisi | Valid |

## failures

3 skenario gagal = bug terdokumentasi di naskah. Relevan untuk perbaikan kode:

### TC-MN-04
`[[test:tc-mn-04]]` **EWS tidak real-time.** Diharapkan: setelah manajer approve done (review gate), Next.js proses async dan langsung update metrik SPI + warna EWS tanpa reload. Aktual: indikator + nilai SPI di dashboard manajer TIDAK berubah sampai halaman di-refresh manual. Menyentuh `[[concept:ews]]`, `[[concept:review-gate]]`. Catatan: naskah menyebut "Framework Next.js" di sini -> `[[div:tech-stack]]`.

### TC-TK-03
`[[test:tc-tk-03]]` **Validasi upload lemah (security).** Diharapkan: sistem tolak `.exe`/`.zip`, tampilkan peringatan hanya gambar/dokumen. Aktual: sistem MENERIMA file `.exe` dan menyimpannya ke database. Menyentuh `[[class:bukti]]`.

### TC-TK-06
`[[test:tc-tk-06]]` **Double-submit duplikasi.** Diharapkan: tombol nonaktif setelah klik pertama (cegah kirim ganda saat koneksi lambat). Aktual: tiap klik diproses terpisah -> rekaman laporan harian ganda di DB. Menyentuh `[[concept:daily-report]]` (tak ada debounce/idempotency).
