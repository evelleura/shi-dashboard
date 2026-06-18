# BAB III METODE PENELITIAN

_Pages 33-35 of Naskah TA Final.pdf_


<!-- page 33 -->

 
 
 
 
20 
BAB III 
METODE PENELITIAN 
 
3.1 Metode Penelitian 
Penelitian ini menerapkan metode pengembangan System Development Life 
Cycle (SDLC) dengan model Waterfall sebagai kerangka kerja sistematis dalam 
membangun fitur dashboard pada sistem manajemen proyek di PT SHI. Model 
Waterfall dipilih karena menawarkan pendekatan yang linier dan berurutan—meliputi 
tahapan analisis kebutuhan, desain sistem, implementasi, hingga pengujian—yang 
memastikan setiap fase diselesaikan dengan matang sebelum beralih ke fase 
berikutnya. Keteraturan alur ini sangat krusial dalam menjamin proses ekstraksi dan 
integrasi data laporan harian dari keseluruhan proyek dapat ditransformasikan secara 
akurat menjadi indikator analitik visual. Melalui pendekatan SDLC model Waterfall, 
pengembangan tata kelola sistem dilakukan secara terukur untuk memastikan bahwa 
dashboard yang dihasilkan mampu memenuhi kebutuhan manajerial dalam memantau 
status kesehatan proyek secara real-time bagi Manajer dan Teknisi. 
 
 
 
  
 
 
 
 
Berdasarkan model Waterfall yang digunakan dalam penelitian ini, proses 
pengembangan sistem dilakukan secara berurutan melalui lima tahapan utama. Berikut  
Adalah penjabaran dari masing-masing tahapan dalam konteks pengembangan fitur 
dashboard di PT SHI:
Gambar 3.1 Metode Penelitian

<!-- page 34 -->

 
 
 
21 
 
 
1) Analisa Kebutuhan (Requirement Analysis)  
Tahap awal ini bertujuan mengidentifikasi masalah sekaligus mengumpulkan 
kebutuhan fungsional dan nonfungsional sistem melalui observasi serta wawancara 
dengan pihak PT SHI. Fokus utamanya adalah merumuskan aliran data laporan harian 
proyek secara keseluruhan untuk memastikan data mentah dapat diekstraksi menjadi 
informasi manajerial.  
2) Pemodelan (Design)  
Setelah kebutuhan sistem terdefinisi dengan jelas, tahap selanjutnya adalah 
merancang arsitektur sistem dan tata letak antarmuka. Proses pemodelan ini mencakup 
perancangan struktur basis data menggunakan ERD, pemodelan logika dan alur sistem 
menggunakan UML, serta pembuatan wireframe sebagai purwarupa desain antarmuka.  
3) Implementasi (Implementation / Coding)  
Pada tahap ini, hasil perancangan ditransformasikan menjadi kode sumber 
fungsional. Proses konstruksi menggunakan framework Next.js untuk membangun 
antarmuka web yang dinamis dan responsif. Algoritma komputasi untuk kalkulasi 
metrik SPI dan status kesehatan proyek diintegrasikan pada fase ini, sehingga sistem 
dapat mengolah data laporan harian secara otomatis pada fitur dashboard Manajer. 
4) Pengujian (Testing)  
Setelah fitur dashboard dan fungsionalitas sistem selesai dibangun, tahap 
pengujian dilakukan untuk memastikan bahwa aplikasi berjalan sesuai dengan 
spesifikasi dan bebas dari kesalahan. Pengujian difokuskan pada keakuratan integrasi 
data, memastikan bahwa laporan harian proyek keseluruhan yang diinputkan oleh 
teknisi dapat secara akurat mengubah indikator metrik dan visualisasi status pada 
dashboard Manajer. 
5) Pemeliharaan (Maintenance)  
Tahapan terakhir ini melibatkan operasional sistem secara langsung di 
lingkungan kerja PT SHI. Tahap pemeliharaan mencakup evaluasi kinerja sistem 
pasca-implementasi, perbaikan jika ditemukan masalah minor saat penggunaan 
langsung, serta penyesuaian atau optimasi sistem untuk memastikan fitur dashboard

<!-- page 35 -->

 
 
 
22 
 
 
manajemen proyek dapat terus beroperasi dengan stabil dan relevan dengan kebutuhan 
perusahaan di masa mendatang. 
3.2 Obyek Penelitian 
3.2.1 Gambaran Umum 
PT Smart Home Inovasi Yogyakarta (SHI) merupakan sebuah perusahaan 
teknologi yang berlokasi di Kabupaten Sleman, Daerah Istimewa Yogyakarta. 
Perusahaan ini mengkhususkan diri pada pengembangan dan implementasi solusi 
Smart Home serta IoT. Mengusung visi sebagai penyedia solusi hunian cerdas 
terdepan, PT SHI menghadirkan berbagai inovasi otomasi perangkat—mulai dari 
sistem keamanan, pengaturan suhu, hingga efisiensi energi—guna menciptakan 
ekosistem hunian yang aman, nyaman, dan hemat energi bagi kliennya. Selain layanan 
jasa instalasi, PT SHI juga menyediakan berbagai produk perangkat keras pintar secara 
eceran, mulai dari lampu pintar, sensor gerak, hingga perangkat pemantau penggunaan 
daya listrik. 
3.2.2 Proses Bisnis dan Aktor yang Terlibat 
Dalam sistem manajemen proyek yang diusulkan pada penelitian ini, terdapat 
desentralisasi wewenang pelaporan untuk memangkas birokrasi administratif. Adapun 
aktor utama yang terlibat dan hak aksesnya dalam proses bisnis pencatatan laporan 
harian adalah sebagai berikut: 
1. Teknisi: Aktor yang bertugas sebagai pelaksana operasional di lokasi klien. Dalam 
sistem ini, teknisi diberikan hak akses untuk menginputkan data laporan harian 
secara langsung ke dalam sistem, tanpa harus melaporkannya terlebih dahulu secara 
manual atau tekstual melalui perantara.  
2. Manajer: Aktor pada tingkat manajerial yang bertanggung jawab mengawasi 
seluruh portofolio proyek. Manajer bertindak sebagai pengguna utama antarmuka 
dashboard. Aktor ini tidak lagi bertugas menginput data laporan dari teknisi, 
melainkan fokus pada mengevaluasi status kesehatan proyek, memantau grafik 
kemajuan proyek, dan merespons peringatan dini (EWS) yang dihasilkan oleh 
sistem.