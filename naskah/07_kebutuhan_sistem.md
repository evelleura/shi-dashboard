# 4.2 Analisa Kebutuhan

**Source:** Naskah TA 04-05-26.pdf, halaman 43-46
**Bab:** BAB IV - ANALISIS DAN PERANCANGAN
**Sections covered:**
- 4.2 Analisa Kebutuhan
- 4.2.1 Analisa Kebutuhan User
- 4.2.2 Analisa Kebutuhan Fungsional
- 4.2.3 Analisa Kebutuhan Non Fungsional

**Images (1):**
- `images/p43_img1.png`

---


## 4.2 Analisa Kebutuhan (Page 43)

Images: `images/p43_img1.png`

4.2 Analisa Kebutuhan
Pada tahap ini, analisis dilakukan untuk mengidentifikasi kebutuhan spesifik
dari PT Smart Home Inovasi Yogyakarta terkait pengembangan fitur dashboard

### Page 44 (cont.)

pemantauan proyek berbasis data daily report. Kebutuhan sistem ini dibagi menjadi
dua, yaitu analisa kebutuhan fungsional dan analisa kebutuhan non-fungsional.


## 4.2.1 Analisa Kebutuhan User (Page 44)

4.2.1 Analisa Kebutuhan User
Berdasarkan desentralisasi wewenang pelaporan dan alur proses bisnis yang
diusulkan pada PT Smart Home Inovasi Yogyakarta, terdapat dua kategori pengguna
utama yang akan berinteraksi langsung dengan sistem pemantauan ini, yaitu Teknisi
Lapangan dan Manajer Proyek. Peran Admin tidak dimasukkan karena bertindak
sebagai pengelola sistem (system administrator), bukan sebagai pengguna akhir (end-
user) operasional yang menjalankan fungsi harian proyek. Adapun rincian kebutuhan
dari masing-masing aktor adalah sebagai berikut:
1. Teknisi Lapangan
Teknisi Lapangan berperan sebagai pelaksana operasional di lokasi klien, seperti
melakukan instalasi perangkat IoT. Dalam sistem ini, teknisi bertindak sebagai
sumber utama pencatatan data faktual. Kebutuhan Teknisi Lapangan meliputi:
a. Teknisi dapat melakukan input Daily Report mandiri. Teknisi dapat mengisi
langsung formulir laporan progres harian segera setelah menyelesaikan
pengerjaan di lokasi klien, yang mencakup rincian tugas, persentase Earned
Value, dan catatan kendala operasional tanpa melalui perantara manajer.
b. Teknisi dapat mengakses Self-Performance Dashboard. Ini memungkinkan
teknisi untuk melihat visualisasi ringkas nilai Schedule Performance Index
(SPI) pribadi yang dikalkulasi secara otomatis dari akumulasi data laporan
harian mereka, guna melakukan swamonitoring status kinerja jadwal secara
mandiri (apakah sesuai target, mendahului, atau terlambat).
2. Manajer Proyek
Manajer Proyek berfungsi sebagai pengawas pada tingkat manajerial yang
bertanggung jawab atas kelancaran seluruh portofolio proyek perusahaan. Pada
pengembangan sistem ini, Manajer Proyek tidak lagi bertugas menginput laporan
secara manual, melainkan bertindak sebagai pengguna utama antarmuka visual.
Kebutuhan Manajer Proyek meliputi:

### Page 45 (cont.)

a. Mengakses halaman dashboard utama yang memvisualisasikan ringkasan
seluruh proyek aktif.
b. Memantau metrik Project Health Status yang direpresentasikan melalui
indikator visual kode warna (Red, Amber, Green) untuk setiap proyek.
c. Melihat perbandingan terperinci antara progres ideal (Planned Value)
berdasarkan durasi proyek, dengan progres aktual (Earned Value) hasil laporan
harian.
d. Mengidentifikasi nilai deviasi progres dan membaca catatan kendala teknis
terakhir yang dihadapi teknisi.
e. Menerima peringatan dini (Early Warning System) melalui penonjolan urutan
proyek berstatus kritis pada dashboard, sehingga dapat segera menentukan
prioritas penanganan secara objektif.
f. Hak akses Manajer Proyek dibatasi pada pemantauan dashboard dan evaluasi
kinerja operasional, tanpa wewenang atau kebutuhan untuk mengelola data di
luar lingkup daily report (seperti data keuangan atau pengadaan material).


## 4.2.2 Analisa Kebutuhan Fungsional (Page 45)

4.2.2 Analisa Kebutuhan Fungsional
Analisa kebutuhan fungsional mendefinisikan layanan, fitur, dan fungsi yang
harus disediakan oleh sistem agar dapat berjalan sesuai dengan alur bisnis perusahaan.
Kebutuhan fungsional pada sistem ini adalah sebagai berikut:
1. Sistem Penginputan Data Operasional
Sistem harus memfasilitasi Teknisi Lapangan untuk melakukan input data daily
report secara langsung, yang mencakup rincian persentase progres pekerjaan harian
(Earned Value) dan catatan kendala di lapangan.
2. Kalkulasi Matematis Otomatis
Sistem (backend) harus mampu mengakumulasi data mentah dari daily report dan
melakukan kalkulasi nilai deviasi progres atau Schedule Performance Index (SPI)
secara otomatis dengan membandingkan progres aktual terhadap target rencana
jadwal (Planned Value) (Radman dkk., 2025).
3. Pemicu Early Warning System (EWS)

### Page 46 (cont.)

Sistem harus mampu mengkategorikan status kesehatan proyek (Project Health
Status) secara otomatis ke dalam indikator kode warna Red-Amber-Green (RAG)
berdasarkan parameter perhitungan SPI (misalnya, berstatus Merah/Kritis jika nilai
SPI < 1).
4. Visualisasi Dashboard Sentral
Sistem harus dapat menampilkan antarmuka dashboard bagi Manajer Proyek yang
menyajikan ringkasan seluruh proyek aktif, mengurutkan proyek berdasarkan
tingkat urgensi/kekritisan, serta menampilkan detail berupa progres ideal, progres
aktual, deviasi, dan indikator EWS secara visual tanpa memerlukan penelusuran
dokumen tekstual.


## 4.2.3 Analisa Kebutuhan Non Fungsional (Page 46)

4.2.3 Analisa Kebutuhan Non Fungsional
Analisa kebutuhan non-fungsional mendefinisikan batasan, standar performa,
dan karakteristik operasional yang harus dimiliki oleh sistem. Kebutuhan non-
fungsional pada pengembangan sistem ini meliputi:
1. Kinerja (Performance):
Fitur dashboard harus mampu merender visualisasi data agregasi dan perubahan
status Early Warning System secara asinkronus dan real-time. Penggunaan
framework Next.js dengan fitur Server-Side Rendering (SSR) diwajibkan agar
pembaruan informasi pada dashboard dapat berjalan cepat tanpa harus memuat
ulang (refresh) keseluruhan halaman.
2. Keamanan (Security) dan Otorisasi:
Sistem harus membedakan hak akses secara ketat (role-based access control).
Teknisi Lapangan hanya memiliki wewenang untuk memasukkan data daily report,
sedangkan hak akses untuk memantau indikator dashboard secara menyeluruh
dikhususkan bagi Manajer Proyek.
3. Kegunaan (Usability):
Antarmuka dashboard harus dirancang dengan pendekatan visual yang intuitif,
sehingga Manajer Proyek dapat mengidentifikasi kondisi kesehatan suatu proyek
secara sekilas tanpa membutuhkan proses analitik manual.
