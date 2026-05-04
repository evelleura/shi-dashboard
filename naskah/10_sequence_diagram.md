# 4.3.1.3 Sequence Diagram

**Source:** Naskah TA 04-05-26.pdf, halaman 55
**Bab:** BAB IV — ANALISIS DAN PERANCANGAN
**Reference standard:** Raharja KKP `widuri.raharja.info/index.php?title=KP1122469850`
**Sections covered:** 4.3.1.3 Model Sequence Diagram

---

## 4.3.1.3 Model Sequence Diagram

Sequence diagram menggambarkan urutan interaksi antara aktor dengan objek-objek bisnis pada sistem dashboard manajemen proyek PT Smart Home Inovasi. Setiap diagram menampilkan alur happy-path secara linear dari atas ke bawah, mengikuti konvensi UML akademik.

---

### 1) Sequence Diagram Autentikasi

![Gambar 4.10 Sequence Diagram Autentikasi](../diagram/ai/Sequence/SD_AUTENTIKASI.drawio)

**Gambar 4.10 Sequence Diagram Autentikasi.**

Berdasarkan gambar 4.10 Sequence Diagram di atas terdapat: 1). 2 Lifeline, yaitu: Form Login dan Data Pengguna. 2). 1 Aktor, yaitu: Pengguna. 3). 7 Message yang memuat informasi-informasi tentang aktivitas yang terjadi, kegiatan yang biasa dilakukan oleh aktor tersebut.

---

### 2) Sequence Diagram Pengelolaan Proyek

![Gambar 4.11 Sequence Diagram Pengelolaan Proyek](../diagram/ai/Sequence/SD_PENGELOLAAN_PROYEK.drawio)

**Gambar 4.11 Sequence Diagram Pengelolaan Proyek.**

Berdasarkan gambar 4.11 Sequence Diagram di atas terdapat: 1). 3 Lifeline, yaitu: Form Proyek, Data Klien dan Data Proyek. 2). 1 Aktor, yaitu: Manajer. 3). 10 Message yang memuat informasi-informasi tentang aktivitas yang terjadi, kegiatan yang biasa dilakukan oleh aktor tersebut.

---

### 3) Sequence Diagram Dashboard Early Warning System

![Gambar 4.12 Sequence Diagram Dashboard Early Warning System](../diagram/ai/Sequence/SD_DASHBOARD_EWS.drawio)

**Gambar 4.12 Sequence Diagram Dashboard Early Warning System.**

Berdasarkan gambar 4.12 Sequence Diagram di atas terdapat: 1). 2 Lifeline, yaitu: Dashboard dan Data Proyek. 2). 1 Aktor, yaitu: Manajer. 3). 7 Message yang memuat informasi-informasi tentang aktivitas yang terjadi, kegiatan yang biasa dilakukan oleh aktor tersebut.

---

### 4) Sequence Diagram Upload Bukti Pekerjaan

![Gambar 4.13 Sequence Diagram Upload Bukti Pekerjaan](../diagram/ai/Sequence/SD_UPLOAD_EVIDENCE.drawio)

**Gambar 4.13 Sequence Diagram Upload Bukti Pekerjaan.**

Berdasarkan gambar 4.13 Sequence Diagram di atas terdapat: 1). 2 Lifeline, yaitu: Form Bukti dan Data Tugas. 2). 1 Aktor, yaitu: Teknisi. 3). 8 Message yang memuat informasi-informasi tentang aktivitas yang terjadi, kegiatan yang biasa dilakukan oleh aktor tersebut.
