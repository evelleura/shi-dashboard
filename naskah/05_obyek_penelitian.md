# 3.2 Obyek Penelitian (PT SHI)

**Source:** Naskah TA 04-05-26.pdf, halaman 38-40
**Bab:** BAB III - METODE PENELITIAN
**Sections covered:**
- 3.2 Obyek Penelitian
- 3.2.1 Gambaran Umum
- 3.2.2 Proses Bisnis dan Aktor yang Terlibat

**Images (1):**
- `images/p38_img1.png`

---


## 3.2 Obyek Penelitian (Page 38)

3.2 Obyek Penelitian


## 3.2.1 Gambaran Umum (Page 38)

3.2.1 Gambaran Umum
PT Smart Home Inovasi Yogyakarta (SHI) merupakan sebuah perusahaan
teknologi yang berlokasi di Kabupaten Sleman, Daerah Istimewa Yogyakarta.
Perusahaan ini mengkhususkan diri pada pengembangan dan implementasi solusi
Smart Home serta Internet of Things (IoT). Mengusung visi sebagai penyedia solusi
hunian cerdas terdepan, PT SHI menghadirkan berbagai inovasi otomasi perangkat—
mulai dari sistem keamanan, pengaturan suhu, hingga efisiensi energi—guna
menciptakan ekosistem hunian yang aman, nyaman, dan hemat energi bagi kliennya.


## 3.2.2 Proses Bisnis dan Aktor yang Terlibat (Page 38)

Images: `images/p38_img1.png`

3.2.2 Proses Bisnis dan Aktor yang Terlibat
Dalam sistem manajemen proyek yang diusulkan pada penelitian ini, terdapat
desentralisasi wewenang pelaporan untuk memangkas birokrasi administratif. Adapun
aktor utama yang terlibat dan hak aksesnya dalam proses bisnis pencatatan daily report
adalah sebagai berikut:
1. Teknisi Lapangan: Aktor yang bertugas sebagai pelaksana operasional di lokasi
klien (misalnya melakukan instalasi IoT). Dalam sistem ini, teknisi diberikan hak
akses untuk menginputkan data daily report (berupa persentase progres pekerjaan
Gambar 3.2 Gambaran Umum

### Page 39 (cont.)

harian) secara langsung ke dalam sistem, tanpa harus melaporkannya terlebih
dahulu secara manual atau tekstual melalui perantara.
2. Manajer Proyek: Aktor pada tingkat manajerial yang bertanggung jawab
mengawasi seluruh portofolio proyek. Manajer bertindak sebagai pengguna utama
antarmuka dashboard. Aktor ini tidak lagi bertugas menginput data laporan dari
teknisi, melainkan fokus pada mengevaluasi Project Health Status, memantau
grafik kemajuan proyek, dan merespons peringatan dini (Early Warning System)
yang dihasilkan oleh sistem.

Alur Proses Bisnis Pemantauan Proyek (Setelah Pengembangan):
Proses bisnis pemantauan proyek melalui dashboard ini dirancang untuk
bekerja secara otomatis dan real-time dengan tahapan operasional sebagai berikut:
1. Pencatatan Progres Aktual: Setelah menyelesaikan pekerjaan harian di lokasi klien,
Teknisi Lapangan membuka aplikasi dan langsung mengisi form daily report yang
mencakup rincian tugas dan persentase penyelesaian (sebagai Earned Value).
2. Kalkulasi Data Asinkronus: Data yang disubmit oleh teknisi secara otomatis masuk
ke dalam database. Di latar belakang, sistem (backend) menghitung rasio
komparasi Schedule Performance Index (SPI) dengan membandingkan progres
aktual teknisi terhadap target rencana jadwal (Planned Value).
3. Visualisasi Dashboard dan EWS: Hasil kalkulasi dari sistem langsung dirender
secara visual pada dashboard manajer menggunakan framework Next.js. Data
tekstual diubah menjadi grafik progres dan metrik warna status (EWS).
4. Evaluasi Manajerial: Manajer Proyek membuka dashboard dan langsung dapat
melihat proyek mana yang berstatus aman (hijau) dan mana yang mengalami
keterlambatan atau kritis (merah) secara sekilas, memungkinkan pengambilan
tindakan penanganan sedini mungkin.

### Page 40 (cont.)

BAB IV
ANALISIS DAN PERANCANGAN
