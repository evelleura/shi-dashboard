# 4.1 Analisis Sistem (As-Is + Diusulkan)

**Source:** Naskah TA 04-05-26.pdf, halaman 40-43
**Bab:** BAB IV - ANALISIS DAN PERANCANGAN
**Sections covered:**
- 4.1 Analisis Sistem
- 4.1.1 Analisa Sistem yang Berjalan
- 4.1.2 Analisa Sistem yang Diusulkan

**Images (1):**
- `images/p41_img1.png`

---


## 4.1 Analisis Sistem (Page 40)

4.1 Analisis Sistem
Analisis Sistem adalah suatu teknik atau metode pemecahan masalah dengan
cara menguraikan sistem ke dalam komponen-komponen pembentuknya untuk
mengetahui bagaimana komponen-komponen tersebut bekerja dan saling berinteraksi
satu sama lain untuk mencapai tujuan sistem. Analisis sistem biasanya dilakukan dalam
membuat System Design. System Design adalah salah satu langkah dalam teknik
pemecahan masalah di mana komponen-komponen pembentuk sistem digabungkan
sehingga membentuk satu kesatuan sistem yang utuh. Hasil dari System Design
merupakan gambaran sistem yang sudah diperbaiki. Teknik dari System Design ini
meliputi proses penambahan, penghilangan, dan pengubahan komponen-komponen
dari sistem semula.


## 4.1.1 Analisa Sistem yang Berjalan (Page 40)

4.1.1 Analisa Sistem yang Berjalan
Berdasarkan pengamatan terhadap proses bisnis di PT Smart Home Inovasi
Yogyakarta, sistem pemantauan proyek saat ini masih bersifat manual dan
terdesentralisasi. Alur operasional dimulai ketika Manajer Proyek menyusun data
penugasan melalui aplikasi spreadsheet (ScriptSheet). Setelah teknisi menyelesaikan
pekerjaan di lapangan, proses pelaporan progres harian beserta bukti dokumentasi
hanya dikirimkan melalui aplikasi WhatsApp. Manajer harus memindahkan data
pelaporan tersebut secara manual dari WhatsApp ke dalam rekapitulasi spreadsheet.
Lebih lanjut, proses evaluasi kinerja jadwal berjalan dengan cara manajer menganalisis
persentase progres proyek secara manual untuk mendeteksi status keterlambatan
masing-masing proyek. Sistem yang konvensional ini sangat rentan terhadap human
error dan menciptakan information lag (jeda waktu informasi) yang signifikan,
sehingga tindakan mitigasi proyek menjadi lambat akibat waktu manajer yang terkuras
habis untuk mengurus administrasi data alih-alih melakukan pemantauan proaktif.


## 4.1.2 Analisa Sistem yang Diusulkan (Page 41)

Images: `images/p41_img1.png`

4.1.2 Analisa Sistem yang Diusulkan
Pada sistem operasional yang berjalan sebelumnya, manajemen
menghadapi keterbatasan visibilitas dalam melacak metrik performa masing-
Gambar 4.2 Bagan Alur Sistem yang Berjalan

### Page 42 (cont.)

masing teknisi, serta proses evaluasi yang bergantung pada metode manual
sehingga mengakibatkan deteksi kendala sering kali terlambat (information lag).
Keterlambatan mitigasi ini sering menimbulkan efek domino yang mengganggu
linimasa proyek selanjutnya dan berpotensi menurunkan kepercayaan pelanggan.
Oleh karena itu, implementasi dashboard pemantauan diusulkan sebagai solusi
strategis untuk mentransformasikan manajemen proyek menjadi lebih efektif.
Sistem yang mengintegrasikan otomasi kalkulasi kinerja ini akan meningkatkan
otomatisasi alur proses bisnis, meminimalisasi risiko human error dalam
rekapitulasi, serta memastikan manajer dapat melakukan pengawasan dan evaluasi
secara real-time demi menjaga mutu penyelesaian proyek.
Untuk mewujudkan solusi tersebut, alur sistem usulan dirancang secara
terpusat yang dimulai dari proses validasi login untuk mendeteksi hak akses (role)
pengguna. Setelah autentikasi berhasil, sistem akan mengarahkan pengguna ke
ruang kerja spesifik; Admin diarahkan ke Dashboard Umum untuk mengelola data
master pengguna dan keseluruhan data proyek, Manajer Proyek diarahkan ke
Dashboard pemantauan untuk mengawasi visualisasi grafis operasional dan
menindaklanjuti eskalasi, sedangkan Teknisi mengakses Dashboard Performa
untuk melaporkan progres tugas harian yang dikunci otomatis secara real-time serta
untuk melaporkan kendala lapangan. Seluruh aktivitas dari ketiga role ini kemudian
didukung oleh fitur komentar global pada detail proyek untuk komunikasi terpadu,
dan siklus proses bisnis ini akan berakhir ketika pengguna melakukan logout dari
sistem.

### Page 43 (cont.)

Gambar 4.3 Bagan Alur Sistem yang Diusulkan
