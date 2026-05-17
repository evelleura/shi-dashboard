# Tugas Lanjutan — Draft 15 Test Case

Saya minta kamu **draft konten 15 baris tabel testing** untuk sub-bab 5.2.3 di naskah Dian.

Naskah masih sama: `naskah/_dian_naskah_extracted.md`. Baca lagi kalau perlu refresh konteks.

## Konfirmasi yang sudah disetujui

- Sub-bab: **5.2.3 Pengujian Sistem** (di bawah 5.2 Pembahasan, sambung dari 5.2.2)
- Tabel: **Tabel 5.1 Skenario dan Hasil Pengujian Black Box**
- 6 kolom: **No | ID Pengujian | Deskripsi Skenario | Hasil Diharapkan | Hasil Aktual | Status**
- 15 skenario, terdistribusi: AUTH (3), MN (4), TK (4), SYS (4)
- Kode: `TC-AUTH-01`, `TC-MN-01`, `TC-TK-01`, `TC-SYS-01`, dst
- Status: semua **Sesuai** atau **Valid** (gunakan istilah akademik Indonesia, bukan PASS)
- Italic istilah asing (gunakan markdown `*...*` di output supaya gampang saya proses)

## Aturan wording (penting)

1. **Gunakan kosakata Dian** — kata kunci yang sering dia pakai di BAB I-V: komputasi, mengomputasi, agregasi, entitas, matriks, presisi, pemrosesan, perekaman, merender, validasi, mitigasi, swamonitoring, autentikasi, kredensial, otorisasi.
2. **Italic istilah asing**: *daily report, dashboard, Earned Value, Planned Value, Schedule Performance Index, SPI, Early Warning System, EWS, Role-Based Access Control, RBAC, kanban, task evidence, review gate, login, role, status, bug*.
3. **Review Gate** — JANGAN bikin skenario yang seakan Teknisi klik Done → SPI langsung berubah. Yang benar: Teknisi unggah bukti → Manajer review → Manajer set Done → SISTEM kalkulasi ulang SPI. Mirror Activity Diagram Gambar 4.6.
4. **Schedule clash validation** untuk test case Manajer Assign Teknisi — fitur unik Dian dari Sequence Diagram Gambar 4.5.
5. **No Admin test cases** — sesuai exclusion di BAB IV.
6. **Hasil Aktual = sama persis dengan Hasil Diharapkan** (karena memang semuanya berhasil), tapi PARAFRASE pakai kalimat singkat 5-10 kata. Jangan copy verbatim.
7. **Status** semua "Sesuai" atau "Valid". Pilih satu, konsisten.

## 15 Skenario yang harus didraft

### AUTH (3)
1. `TC-AUTH-01` Login Manajer dengan kredensial valid
2. `TC-AUTH-02` Login Teknisi dengan kredensial valid
3. `TC-AUTH-03` Validasi RBAC — Teknisi tidak bisa akses halaman Manajer

### MN (4) — Manajer
4. `TC-MN-01` Manajer menambah data proyek baru
5. `TC-MN-02` Manajer menugaskan Teknisi ke proyek (dengan validasi schedule clash)
6. `TC-MN-03` Manajer melakukan Review Gate — meninjau bukti task lalu set status Done
7. `TC-MN-04` Manajer menanggapi laporan eskalasi dari Teknisi dengan instruksi balasan

### TK (4) — Teknisi
8. `TC-TK-01` Teknisi memperbarui status task di Kanban (to_do → working_on_it)
9. `TC-TK-02` Teknisi mengunggah bukti pekerjaan (task evidence) pada task
10. `TC-TK-03` Teknisi mengirim laporan eskalasi kendala lapangan
11. `TC-TK-04` Teknisi mengakses Self-Performance Dashboard untuk melihat SPI pribadi

### SYS (4) — Automasi Sistem
12. `TC-SYS-01` Sistem mengomputasi Earned Value otomatis saat Manajer set task Done
13. `TC-SYS-02` Sistem mengomputasi SPI dan menentukan indikator warna RAG (Red/Amber/Green) berdasarkan threshold
14. `TC-SYS-03` Sistem mengurutkan daftar proyek di dashboard Manajer berdasarkan urgensi (kritis → teratas)
15. `TC-SYS-04` Sistem mencegah bentrok jadwal saat Manajer menugaskan Teknisi yang sudah punya alokasi

## Output yang saya butuhkan

Untuk SETIAP test case, kasih saya 4 field (selain No dan ID Pengujian yang sudah saya tentukan):

```
TC-AUTH-01
Deskripsi Skenario: [1 kalimat lengkap, sebutkan aksi pengguna + objek]
Hasil Diharapkan: [1-2 kalimat detail, sebutkan respons sistem secara presisi]
Hasil Aktual: [5-10 kata, parafrase hasil diharapkan]
Status: Sesuai
```

Lakukan untuk 15 test case. Jangan kasih intro atau penutup, langsung 15 blok.

Yang penting: **bahasanya alami untuk gaya Dian, bukan kaku terjemahan**. Bayangkan Dian sendiri yang menulis.
