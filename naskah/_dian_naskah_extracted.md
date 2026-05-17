PENGEMBANGAN FITUR DASHBOARD PADA SISTEM PROJECT MANAGEMENT BERDASARKAN

DATA DAILY REPORT

(Studi Kasus : PT Smart Home Inovasi Yogyakarta)

LAPORAN TUGAS AKHIR

DIAN PUTRI ISWANDI

5220311118

PROGRAM STUDI SISTEM INFORMASI PROGRAM SARJANA

FAKULTAS SAINS & TEKNOLOGI

UNIVERSITAS TEKNOLOGI YOGYAKARTA

2026

PENGEMBANGAN FITUR DASHBOARD PADA SISTEM PROJECT MANAGEMENT BERDASARKAN DATA DAILY REPORT

(Studi Kasus : PT Smart Home Inovasi Yogyakarta)

Disusun oleh

DIAN PUTRI ISWANDI

5220311118

Telah dipertahankan di depan Dewan Penguji

pada tanggal …………………………

DEWAN PENGUJI

Yogyakarta, …………………………

Ketua Program Studi Sistem Informasi Program Sarjana

Fakultas Sains & Teknologi, Universitas Teknologi Yogyakarta

LEMBAR PERNYATAAN

SURAT KETERANGAN TUGAS AKHIR

KATA PENGANTAR

ABSTRAK

ABSTRACT

DAFTAR ISI

DAFTAR TABEL

DAFTAR GAMBAR

## [JUDUL BAB] BAB I
PENDAHULUAN

## [1.n] Latar Belakang

PT Smart Home Inovasi Yogyakarta (SHI), yang berlokasi di Kabupaten Sleman, Daerah Istimewa Yogyakarta, merupakan perusahaan teknologi yang mengkhususkan diri pada pengembangan solusi Smart Home dan Internet of Things (IoT). Mengusung visi sebagai penyedia solusi hunian cerdas terdepan, SHI menghadirkan inovasi perangkat otomasi—mulai dari sistem keamanan, pengaturan suhu, hingga efisiensi energi—guna menciptakan ekosistem hunian yang aman, nyaman, dan hemat energi. Secara operasional, proses bisnis perusahaan dimulai dari penerimaan pesanan klien, dilanjutkan dengan survei lokasi, perencanaan desain sistem, pelaksanaan instalasi perangkat, integrasi antar-komponen, hingga pengujian dan serah terima proyek kepada pelanggan. Untuk menunjang kegiatan operasional tersebut, SHI telah mengimplementasikan sebuah aplikasi manajemen proyek yang mencakup fungsi pengelolaan data proyek, penjadwalan, penugasan teknisi, serta pencatatan laporan harian (daily report) sebagai acuan utama dalam memantau kemajuan fisik dan kondisi aktual proyek di lapangan.

Meskipun aplikasi manajemen proyek memiliki fitur daily report, sistem hanya dapat diakses manajer sehingga teknisi harus melaporkan secara tidak langsung. Selain itu, tidak ada visualisasi dashboard untuk ringkasan kondisi seluruh proyek. Akibatnya, tanpa indikator risiko terukur, manajer sering mengabaikan proyek kritis dan deteksi masalah menjadi lambat (reactive). Hal ini berdampak pada penurunan efisiensi operasional dan kepuasan pelanggan.

Berdasarkan permasalahan tersebut, penelitian ini menawarkan solusi berupa pengembangan fitur dashboard pada aplikasi manajemen proyek yang telah berjalan di PT SHI. Pengembangan ini mencakup dua aspek utama, yaitu pemberian akses sistem kepada teknisi untuk menginputkan data daily report secara langsung, serta pembuatan fitur dashboard dengan kemampuan smart system.  Fitur dashboard yang

dikembangkan memiliki kemampuan otomasi berupa kategorisasi status kesehatan proyek (Project Health Status) yang bekerja dengan cara sistem secara otomatis menghitung persentase progres ideal berdasarkan posisi hari berjalan terhadap total durasi proyek, kemudian membandingkannya dengan persentase realisasi aktual yang diinputkan oleh teknisi. Hasil perbandingan tersebut secara otomatis divisualisasikan dalam bentuk indikator kode warna pada tampilan dashboard, sehingga manajer dapat mengidentifikasi kondisi kesehatan setiap proyek secara sekilas. Pendekatan serupa telah dibuktikan efektivitasnya oleh Ernawan (2024) dalam penelitiannya pada perusahaan konstruksi, di mana implementasi dashboard manajemen mampu membantu eksekutif memantau indikator kinerja proyek secara real-time serta meningkatkan akurasi data untuk keperluan pemantauan.

Melalui implementasi fitur dashboard ini, diharapkan alur pelaporan dari teknisi ke manajer menjadi lebih lancar karena teknisi dapat menginputkan data daily report secara langsung ke dalam sistem tanpa perantara. Dengan visualisasi status kesehatan proyek, manajer dapat melakukan deteksi dini terhadap kondisi keterlambatan secara sekilas tanpa harus memeriksa laporan satu per satu. Secara keseluruhan, pengembangan ini diharapkan dapat membantu PT SHI memantau jalannya proyek dengan lebih efisien serta meminimalisir risiko keterlambatan penyelesaian proyek.

## [1.n] Rumusan Masalah

Bagaimana merancang fitur dashboard yang mampu mengolah data daily report menjadi visualisasi status proyek yang mudah dipahami guna membantu manajer dalam menentukan prioritas penanganan masalah secara objektif di PT Smart Home Inovasi Yogyakarta?

## [1.n] Batasan Masalah

Data yang diolah terbatas pada daily report (nama proyek, tanggal, progres harian, kendala) dan jadwal baseline proyek (tanggal mulai dan selesai).

Performa jadwal proyek diukur kemajuannya murni menggunakan perhitungan Schedule Performance Index (SPI), tanpa melibatkan machine learning atau AI.

Sistem secara otomatis menentukan status proyek (indikator warna) dan mengurutkan prioritas penanganannya di dashboard berdasarkan ambang batas nilai SPI.

Output sistem berupa dashboard yang menampilkan ringkasan status proyek, perbandingan progres aktual dan rencana, nilai SPI, serta catatan kendala.

Hak akses sistem dibagi menjadi dua: Manajer (pemantau dashboard) dan Teknisi (penginput daily report).

Sistem tidak mengelola entitas di luar daily report, seperti laporan keuangan, pengadaan material, atau manajemen sumber daya manusia.

## [1.n] Tujuan Penelitian

Merancang dan mengembangkan fitur dashboard pada sistem project management yang mampu mengolah data daily report secara otomatis menjadi indikator visual status kesehatan proyek (Project Health Status) di PT SHI.

## [1.n] Manfaat Penelitian

Meningkatkan objektivitas pengambilan keputusan di PT SHI, di mana manajer dapat menentukan prioritas penanganan proyek berdasarkan indikator visual yang terukur, bukan lagi berdasarkan intuisi atau penilaian subjektif.

Mempercepat identifikasi proyek bermasalah di PT SHI, karena sistem secara otomatis menonjolkan proyek dengan status kritis ke urutan teratas dashboard, sehingga potensi keterlambatan fatal pada proyek instalasi dan integrasi sistem Smart Home dapat dideteksi lebih dini dan ditangani secara preventif.

## [1.n] Sistematika Penulisan

BAB  I 	PENDAHULUAN

Bab ini menguraikan latar belakang masalah yang mendasari penelitian, rumusan masalah, batasan masalah yang menjadi lingkup pengembangan sistem, tujuan penelitian, manfaat penelitian bagi PT SHI, serta sistematika penulisan laporan.

BAB II	KAJIAN HASIL PENELITIAN DAN LANDASAN TEORI

Bab ini memuat kajian hasil penelitian terdahulu yang relevan dengan topik pengembangan dashboard dan sistem manajemen proyek sebagai referensi perbandingan, serta landasan teori yang digunakan sebagai dasar dalam perancangan dan pengembangan sistem.

BAB III	METODE PENELITIAN

Bab ini menjelaskan metode penelitian yang digunakan dalam proses pengembangan sistem, termasuk tahapan-tahapan pengembangan perangkat lunak yang diterapkan, serta gambaran obyek penelitian yaitu PT SHI.

BAB  IV 	ANALISIS DAN PERANCANGAN

Bab ini membahas analisis kebutuhan sistem serta perancangan sistem yang meliputi perancangan model proses, perancangan model data, perancangan fisik basis data, perancangan relasi antar tabel, dan perancangan antarmuka pengguna (user interface).

BAB V 	IMPLEMENTASI DAN PEMBAHASAN SISTEM

Bab ini menyajikan hasil implementasi sistem yang mencakup implementasi basis data dan implementasi antarmuka, dilanjutkan dengan pembahasan hasil sistem yang meliputi pembahasan basis data, pembahasan fungsionalitas sistem, pengujian sistem, serta inovasi sistem yang dikembangkan.

BAB VI	PENUTUP

Bab ini berisi kesimpulan dari keseluruhan hasil penelitian yang menjawab rumusan masalah serta saran untuk pengembangan sistem di masa mendatang.

## [JUDUL BAB] BAB II
KAJIAN HASIL PENELITIAN DAN LANDASAN TEORI

## [2.x] Kajian Hasil Penelitian

Kajian hasil penelitian ini memuat tinjauan terhadap beberapa penelitian terdahulu yang relevan dengan topik pengembangan fitur dashboard pada sistem project management. Penelitian-penelitian tersebut dijadikan sebagai bahan referensi dan perbandingan untuk memahami pendekatan, metode, serta hasil yang telah dicapai oleh peneliti sebelumnya. Melalui kajian ini, dapat diidentifikasi persamaan dan perbedaan antara penelitian terdahulu dengan penelitian yang dilakukan penulis, sehingga dapat diketahui posisi dan kontribusi penelitian ini terhadap pengembangan keilmuan di bidang sistem informasi manajemen proyek.

Penelitian yang dilakukan oleh Azkia dkk. (2024) dengan judul "Perancangan Dashboard Monitoring dan Controlling Kinerja Proyek pada PT. XYZ Menggunakan Metode Agile and Lean Development" menyoroti permasalahan keterlambatan dan pembengkakan anggaran pada proyek konstruksi telekomunikasi yang disebabkan oleh tidak adanya alat monitoring dan kontrol informasi yang efektif. Penelitian ini bertujuan merancang dashboard monitoring dan controlling kinerja proyek menggunakan metode Agile and Lean Development dengan mengintegrasikan konsep Earned Value Management (EVM) sebagai alat pengukuran kinerja. Dashboard yang dihasilkan mencakup tujuh fitur utama yaitu Project Overview, Financial Tracking, Timeline, Milestone, Resource, Performance, dan Risk, yang dikembangkan menggunakan Google Looker Studio dengan sumber data dari Google Sheets. Hasil pengujian melalui Black Box Testing menunjukkan seluruh fitur berfungsi sesuai spesifikasi, sementara User Acceptance Test (UAT) memperoleh skor 86% yang termasuk kategori sangat baik. Perbedaan utama dengan penelitian proyek tugas akhir ini terletak pada cakupan dan kompleksitas dashboard, di mana penelitian Azkia dkk. mencakup aspek yang lebih luas meliputi keuangan, sumber daya, dan manajemen risiko dengan metode EVM, sementara penelitian ini berfokus secara spesifik pada

pengembangan fitur dashboard berbasis data daily report dengan mekanisme otomasi kategorisasi status kesehatan proyek (Project Health Status) menggunakan perhitungan deviasi progres sederhana.

Penelitian yang dilakukan oleh Luthan dkk. (2023) dengan judul "Reinventing Formulas for Construction Project Delay Index Due to Management and Production" menyoroti permasalahan ketidakadilan dalam pembebanan sanksi keterlambatan proyek konstruksi, di mana selama ini pihak produksi (kontraktor) selalu menjadi satu-satunya pihak yang dikenai denda, sementara pihak manajemen (konsultan) tidak pernah dikenai sanksi meskipun turut berkontribusi terhadap keterlambatan. Penelitian ini bertujuan membangun formula yang akurat untuk menghitung Management Delay Index (MDI) dan Production Delay Index (PDI) yang diintegrasikan ke dalam dashboard Ms. Project. Hasil penelitian menunjukkan bahwa formula yang diintegrasikan ke dashboard mampu menyajikan informasi yang lebih rinci dibandingkan perhitungan manual, meliputi nilai kontrak, progres aktual, progres rencana, deviasi progres, penyebab keterlambatan, serta indeks keterlambatan dari aspek manajemen dan produksi. Uji kelayakan menggunakan metode TELOS memperoleh skor rata-rata 8,26 dari skala 10 yang menunjukkan formula tersebut sangat layak dan akurat. Perbedaan utama dengan penelitian proyek tugas akhir ini terletak pada fokus dan kompleksitas formula, di mana penelitian Luthan dkk. mengembangkan formula indeks keterlambatan yang melibatkan variabel free float, pending, waktu mulai aktual, dan waktu selesai aktual untuk menentukan pihak yang bertanggung jawab atas keterlambatan, sementara penelitian ini menggunakan perhitungan deviasi progres sederhana berupa selisih antara progres ideal dan progres realisasi dari data daily report untuk mengkategorikan status kesehatan proyek ke dalam indikator kode warna pada dashboard.

Penelitian yang dilakukan oleh Ernawan (2024) dengan judul "Pemanfaatan Management Dashboard dalam Pengambilan Keputusan Strategis pada Perusahaan Bisnis Konstruksi (Studi Kasus PT. XYZ)" menyoroti permasalahan kurang optimalnya pengambilan keputusan strategis akibat keterbatasan akses data kinerja proyek yang akurat dan real-time. Penelitian ini bertujuan menganalisis peran dashboard manajemen sebagai sistem pendukung keputusan strategis dalam memantau indikator kinerja utama (KPI) perusahaan konstruksi. Hasil penelitian menunjukkan bahwa dashboard manajemen mampu meningkatkan akurasi data, mempercepat identifikasi masalah proyek, serta memperkuat koordinasi lintas divisi. Perbedaan utama dengan penelitian proyek tugas akhir ini adalah penelitian Ernawan berorientasi pada evaluasi dashboard sebagai alat pengambilan keputusan strategis tingkat perusahaan, sementara penelitian ini menekankan pengembangan fitur dashboard operasional berbasis daily report dalam sistem project management.

Penelitian yang dilakukan oleh Gledson dkk. (2024) dengan judul "Reporting on the Development of a Web-Based Prototype Dashboard for Construction Design Managers, Achieved through Design Science Research Methodology (DSRM)" menyoroti permasalahan inefisiensi dalam proses manajemen desain konstruksi, khususnya terkait koordinasi yang terfragmentasi, pemantauan kinerja desainer yang tidak memadai, serta pengelolaan arus informasi yang masih bersifat manual dan "analogue". Penelitian ini bertujuan mengembangkan purwarupa dashboard manajemen desain berbasis web untuk mendigitalisasi proses-proses tersebut dengan fokus pada pemantauan koordinasi desain, prioritas tugas, dan pelacakan kinerja desainer melalui analisis data Technical Queries (TQs) dan Requests for Information (RFIs). Hasil penelitian menunjukkan bahwa dashboard yang dikembangkan mampu meningkatkan efisiensi dan produktivitas dengan menyediakan visualisasi data real-time, seperti analisis RFI, pemantauan jadwal produksi desain (Information Release Schedule), serta tren kinerja desainer di tingkat proyek maupun portofolio. Umpan balik dari praktisi mengonfirmasi bahwa fitur-fitur tersebut memberikan manfaat signifikan dalam peran manajemen desain. Perbedaan utama dengan penelitian tugas akhir ini terletak pada fokus dan pengguna akhir dashboard. Penelitian Gledson dkk. berfokus pada dukungan keputusan untuk Manajer Desain dengan memanfaatkan data dari proses desain (seperti TQ dan RFI) untuk mengoptimalkan koordinasi dan alur kerja desain, sementara penelitian ini berfokus pada pemantauan kesehatan proyek secara umum dari sudut pandang kemajuan waktu dengan menggunakan data daily report dari teknisi. Perhitungan yang digunakan juga berbeda, di mana penelitian Gledson dkk. mengandalkan analisis tren dan beban kerja berdasarkan data kueri teknis, sedangkan penelitian ini menggunakan perhitungan deviasi progres sederhana berupa selisih antara progres ideal (berdasarkan durasi proyek) dan progres realisasi dari daily report untuk mengkategorikan status kesehatan proyek ke dalam indikator kode warna pada dashboard.

Penelitian yang dilakukan oleh Hakim dan Pradibta (2025) dengan judul "Pengembangan Fitur Dashboard dan Report pada Aplikasi Project Management PT Intelix untuk Optimalisasi Pemantauan Proyek" membahas pengembangan fitur dashboard dan report pada aplikasi manajemen proyek di PT Intelix untuk mengatasi permasalahan pemantauan proyek yang tidak terintegrasi dan pembuatan laporan manual menggunakan Microsoft Excel. Menggunakan metode Agile Kanban, penelitian ini menambahkan tiga tabel proyek (High Priority Project, Milestone Project, dan Implementation Project) pada menu Dashboard serta beberapa sub-menu pada menu Report. Hasil pengujian menunjukkan seluruh fungsi berjalan baik, mendapatkan respons "sangat sesuai" dari pengguna, dan sistem dinilai baik melalui evaluasi SUS. Penelitian Hakim & Pradiba mendukung penelitian ini karena sama-sama membuktikan bahwa pengembangan fitur dashboard mampu menyajikan informasi proyek secara lebih terperinci dan memudahkan pemantauan progres proyek secara real-time.

Penelitian yang dilakukan oleh Auliansyah dkk. (2023) dengan judul "Rancang Bangun Sistem Monitoring Manajemen Proyek Konstruksi Menggunakan Kurva-S" membahas pengembangan sistem monitoring berbasis website untuk proyek konstruksi di CV. Cahya Grafika menggunakan metode Kurva-S. Penelitian ini dilatarbelakangi oleh permasalahan keterbatasan sumber daya perusahaan dalam mengelola banyak proyek konstruksi secara simultan, serta kebutuhan untuk mengontrol kesesuaian antara rencana dan realisasi pekerjaan guna menghindari keterlambatan proyek. Tujuan penelitian ini adalah membangun sistem yang dapat membuat rencana anggaran biaya (RAB), schedule rencana, laporan mingguan proyek, dan rekapitulasi laporan proyek dengan output berupa Gantt Chart dan Kurva-S yang menampilkan perbandingan antara kurva rencana dan kurva realisasi. Sistem yang dikembangkan memiliki fitur multi-user dengan empat hak akses berbeda (admin, manajer, manajer lapangan, dan direktur). Hasil penelitian menunjukkan bahwa sistem berhasil menghitung nilai deviasi keterlambatan proyek, dengan studi kasus pada proyek peningkatan jalan Wadungasri-Tambaksumur menunjukkan nilai deviasi -0,17% pada minggu ke-1 dan -1,19% pada minggu ke-2 yang mengindikasikan keterlambatan. Pengujian black-box pada seluruh hak akses menunjukkan sistem berfungsi sesuai harapan. Penelitian Auliansyah dkk. mendukung penelitian ini karena sama-sama mengembangkan sistem monitoring proyek dengan membandingkan progres rencana dan progres aktual, serta menggunakan perhitungan deviasi untuk mendeteksi keterlambatan proyek. Namun demikian, penelitian ini juga menjadi pembanding karena terdapat perbedaan pada metode dan fokus pengembangan. Penelitian Auliansyah dkk. (2023) menggunakan metode Kurva-S yang memerlukan perhitungan bobot kontrak dan bobot rencana komulatif yang kompleks, serta mencakup fitur RAB, Gantt Chart, dan multi-user dengan empat level akses. Sementara itu, penelitian ini lebih sederhana dengan fokus pada pengembangan smart system berupa kategorisasi otomatis status kesehatan proyek menggunakan perhitungan deviasi sederhana antara progres ideal (berdasarkan durasi proyek) dan progres aktual dari data daily report yang diinputkan langsung oleh teknisi, yang kemudian divisualisasikan dalam bentuk indikator kode warna untuk memudahkan deteksi dini proyek bermasalah.

Penelitian yang dilakukan oleh Iqbal dkk. (2024) dengan judul "Sistem Manajemen Proyek pada Startup Jasa Pembuatan Aplikasi" membahas perancangan dan pengembangan sistem manajemen proyek berbasis web untuk penyedia layanan pengembangan aplikasi di lingkungan startup teknologi. Penelitian ini dilatarbelakangi oleh permasalahan umum yang sering muncul dalam manajemen proyek di startup, seperti keterlambatan, pembengkakan biaya, dan kualitas produk di bawah standar akibat ketidakmampuan dalam mengatur proyek secara efisien. Tujuan penelitian ini adalah merancang sistem yang dapat memfasilitasi kerja tim, manajemen tugas, pelaporan waktu nyata (real-time), dan pelacakan kemajuan proyek. Metode pengembangan yang digunakan adalah Waterfall dengan tahapan communication, planning, modelling, construction, dan deployment. Hasil penelitian menunjukkan bahwa sistem yang dikembangkan mampu mengelola berbagai aspek proyek meliputi manajemen tugas, kolaborasi tim, pelacakan anggaran, serta menampilkan dashboard ringkasan proyek, Gantt chart, dan log aktivitas. Pengujian menggunakan metode Black Box pada seluruh fitur menunjukkan sistem beroperasi dengan stabilitas baik dan sesuai harapan pengguna. Penelitian ini mendukung penelitian tugas akhir karena sama-sama mengembangkan sistem manajemen proyek berbasis web yang memudahkan pemantauan proyek melalui dashboard dengan ringkasan informasi proyek, progres tugas, dan kolaborasi tim. Namun demikian, penelitian ini juga menjadi pembanding karena terdapat perbedaan pada fokus dan mekanisme pemantauan. Penelitian Iqbal dkk. (2024) berfokus pada pengembangan sistem manajemen proyek komprehensif untuk startup jasa pembuatan aplikasi dengan cakupan fitur yang luas meliputi manajemen tugas, tim, anggaran, serta Gantt chart, dan menggunakan metode Waterfall dalam pengembangannya. Sementara itu, penelitian ini lebih spesifik pada pengembangan fitur dashboard dengan kemampuan smart system berupa kategorisasi otomatis status kesehatan proyek menggunakan perhitungan deviasi sederhana antara progres ideal (berdasarkan durasi proyek) dan progres aktual dari data daily report yang diinputkan langsung oleh teknisi, yang kemudian divisualisasikan dalam bentuk indikator kode warna untuk memudahkan deteksi dini proyek bermasalah tanpa mencakup fitur manajemen anggaran dan Gantt chart secara mendalam.

*Tabel 2.1 Perbandingan Penelitian Terdahulu*

## [2.x] Landasan Teori

Dalam pengerjaan penelitian Tugas Akhir ini penulis menggunakan beberapa landasan teori yang menjadi acuan diantaranya sebagai berikut:

## [2.2.a] Manajemen Proyek dan Sistem Monitoring

Manajemen proyek merupakan disiplin ilmu yang mencakup proses perencanaan, pelaksanaan, dan pengendalian untuk memastikan tujuan proyek tercapai sesuai batasan waktu, biaya, dan ruang lingkup. Dalam proses pengendalian, manajer memerlukan informasi akurat sebagai dasar evaluasi dan pengambilan keputusan. Sistem monitoring berperan sebagai salah satu instrumen yang menyediakan informasi tersebut melalui pelacakan data aktivitas lapangan (Chaerul dkk., 2021). Praktik konvensional yang menggunakan alat tidak terintegrasi seperti spreadsheet terpisah sering menghambat aliran informasi dan mempersulit proses pengendalian. Oleh karena itu, penerapan project management system terpadu menjadi solusi untuk mengintegrasikan seluruh proses manajemen proyek, mulai dari pencatatan data harian hingga penyajian informasi bagi manajemen. Pengembangan fitur seperti dashboard berbasis data daily report bertujuan untuk mendukung efektivitas pengelolaan proyek secara menyeluruh, termasuk koordinasi tim, evaluasi kemajuan, dan pengambilan keputusan strategis.

## [2.2.a] Dashboard Manajemen Proyek

Dalam project management system, dashboard berfungsi sebagai antarmuka pengguna grafis yang memvisualisasikan data operasional secara terpusat. Berbeda dengan sistem analitik prediktif, dashboard memfasilitasi transparansi informasi dengan mengubah rekapitulasi data daily report tekstual yang diinput oleh teknisi menjadi representasi visual terstruktur, seperti grafik kemajuan fisik dan indikator ketepatan waktu terhadap rencana awal atau baseline (Silmina & Azmi, 2025). Melalui transformasi visual ini, manajer dapat memahami kondisi portofolio proyek secara komprehensif, mengevaluasi kinerja operasional berdasarkan fakta aktual, serta merumuskan keputusan tindak lanjut dengan jauh lebih efisien tanpa harus membaca laporan secara manual (Reddy, 2025).

## [2.2.a] Sistem Informasi Daily Report Proyek

Sistem Informasi Daily Report Proyek merupakan sebuah modul esensial di dalam ekosistem Sistem Manajemen Proyek (Project Management System) yang berfungsi untuk merekam aktivitas operasional harian secara terstruktur. Dalam siklus pelaksanaan proyek, pelaporan harian bertindak sebagai sumber data utama yang mendokumentasikan rincian progres pekerjaan, alokasi waktu, status penyelesaian tugas, serta kendala teknis di lapangan. Integrasi pelaporan harian ke dalam sistem manajemen proyek bertujuan untuk melakukan sentralisasi data historis, memastikan bahwa seluruh rekam jejak operasional dapat dilacak (traceable) secara aktual dan terhindar dari risiko kehilangan atau ketidakkonsistenan data akibat pencatatan manual (Alawiyah dkk. 2022).

Untuk memaksimalkan nilai dari himpunan data laporan harian tersebut, diperlukan pengembangan fitur antarmuka visual berupa dashboard pemantauan (monitoring). Fitur dashboard ini secara teknis akan mengekstrak, mengolah, dan menerjemahkan data daily report yang mentah menjadi informasi visual yang komprehensif, seperti grafik progres, metrik capaian, maupun rekapitulasi status proyek. Dengan terintegrasinya data daily report ke dalam fitur dashboard berbasis web, proses pengawasan administrasi dan evaluasi proyek oleh pihak manajemen menjadi jauh lebih efisien, terpusat, dan dapat dipantau secara langsung (real-time) berdasarkan data faktual dari lapangan.

## [2.2.a] Project Health Status

Status kesehatan proyek (Project Health Status) merupakan indikator evaluatif faktual yang membandingkan progres aktual di lapangan dengan rencana awal (baseline). Alih-alih menggunakan analitik prediktif yang kompleks, indikator ini berfungsi sebagai instrumen audit visual untuk mendeteksi penyimpangan jadwal sedini mungkin. Pada implementasi dashboard, status kesehatan direpresentasikan melalui metode Red-Amber-Green (RAG) yang secara otomatis mengagregasi data mentah dari daily report. Melalui visualisasi warna yang intuitif ini—seperti indikator "Hijau" untuk operasional yang linear dengan jadwal dan "Merah" untuk kondisi kritis—pihak manajemen memperoleh transparansi informasi tingkat tinggi guna memantau kelancaran proyek secara real-time tanpa harus menelusuri tumpukan laporan manual (Fonseca dkk., 2025).

## [2.2.a] Early Warning System (EWS) Berbasis Schedule Performance Index

Dalam manajemen proyek operasional yang dinamis, Early Warning System (EWS) atau Sistem Peringatan Dini merupakan mekanisme proaktif yang diintegrasikan ke dalam perangkat lunak pemantauan untuk mendeteksi potensi penyimpangan jadwal secara otomatis. Dalam ranah sistem informasi operasional, EWS tidak dirancang menggunakan algoritma analitik prediktif yang kompleks, melainkan mengandalkan kemampuan sistem dalam mengotomatisasi pemrosesan data faktual secara real-time. Tujuan utama implementasi EWS adalah memangkas jeda waktu (information lag) antara terjadinya kendala progres di lapangan dengan sampainya peringatan tersebut kepada manajer, sehingga mitigasi keterlambatan dapat dilakukan sedini mungkin berdasarkan data yang valid.

Sebagai parameter pemicu (trigger), EWS pada sistem ini mengadopsi metrik Schedule Performance Index (SPI). SPI bertindak sebagai indikator matematis pasti yang dihitung menggunakan rasio perbandingan antara persentase pekerjaan aktual yang telah dilaporkan selesai (Earned Value) dengan persentase target rencana awal proyek (Planned Value). Secara matematis, SPI dirumuskan pada Persamaan 1 berikut:

Keterangan Variabel:

SPI (Schedule Performance Index) : Nilai indeks efisiensi waktu pelaksanaan proyek.

EV (Earned Value / Nilai Hasil) : Persentase bobot pekerjaan aktual yang secara faktual telah diselesaikan di lapangan. Dalam sistem ini, nilai EV diakumulasikan secara otomatis dari progres tugas yang diinputkan oleh pekerja melalui formulir daily report.

PV (Planned Value / Nilai Rencana) : Persentase bobot target pekerjaan yang seharusnya telah diselesaikan pada titik waktu pemantauan tertentu berdasarkan jadwal rencana awal (baseline).

Di dalam arsitektur sistem ini, sumber data aktual diekstraksi secara berkelanjutan dari input daily report para pelaksana lapangan. Kecerdasan sistem (smart system capability) bekerja di latar belakang dengan mengakumulasi data mentah dari laporan harian tersebut dan secara otomatis mengkalkulasi rasio SPI tanpa memerlukan intervensi manual dari pihak administrator.

Otomatisasi ini kemudian terintegrasi langsung dengan antarmuka dashboard monitoring. Apabila hasil kalkulasi sistem memenuhi parameter kondisi seperti pada Persamaan 2 berikut:

Kondisi tersebut mengindikasikan bahwa progres aktual tertinggal dari target rencana. Ketika parameter ini terpenuhi, EWS akan seketika memicu indikator peringatan visual—seperti perubahan warna status menjadi merah atau flagging kondisi "Kritis"—pada layar dashboard. Melalui pendekatan pengawasan proaktif ini, sistem mentransformasikan tumpukan data rekapitulasi daily report menjadi wawasan visual yang instan, membebaskan manajer dari beban perhitungan manual, serta memastikan bahwa evaluasi kinerja operasional dapat berjalan secara presisi, terpusat, dan sangat responsif (Umana dkk., 2022).

Melalui hasil komparasi matematis tersebut, sistem dashboard dirancang untuk menerjemahkan nilai numerik SPI menjadi status visibilitas proyek dengan parameter sebagai berikut:

Proyek berjalan tepat waktu sesuai dengan target jadwal (On Schedule). Indikator visual umumnya menampilkan status normal atau warna hijau.

Proyek berjalan lebih cepat dari target jadwal yang direncanakan (Ahead of Schedule).

Proyek mengalami keterlambatan operasional (Behind Schedule). Kondisi matematis inilah yang bertindak sebagai pemicu utama (trigger) bagi Early Warning System untuk secara otomatis menampilkan notifikasi kritis atau merubah indikator visual dashboard menjadi peringatan warna merah.

## [2.2.a] Framework Next.js

Next.js merupakan kerangka kerja (framework) front-end berbasis React yang dirancang untuk membangun antarmuka web berskala enterprise dengan performa tinggi. Keunggulan utamanya terletak pada dukungan Server-Side Rendering (SSR) dan arsitektur berbasis komponen (component-based), yang sangat ideal untuk memvisualisasikan elemen dashboard secara modular, seperti grafik progres kerja dan indikator warna Red-Amber-Green (RAG). Dalam implementasi Early Warning System (EWS) pada manajemen proyek, Next.js berperan krusial melalui mekanisme penarikan data asinkron. Framework ini mampu mengonsumsi akumulasi data daily report dan hasil kalkulasi Schedule Performance Index (SPI) dari backend secara real-time. Ketika terdeteksi perubahan status proyek menjadi kritis (misalnya ), antarmuka dashboard dapat merefleksikan peringatan visual tersebut secara instan tanpa perlu memuat ulang (refresh) keseluruhan halaman, sehingga manajer dapat memperoleh informasi operasional yang faktual secara cepat dan interaktif (Genne, 2025).

## [2.2.a] Unified Modeling Language

UML (Unified Modeling Language) adalah bahasa pemodelan standar yang digunakan untuk memvisualisasikan, merancang, dan mendokumentasikan sistem perangkat lunak yang berorientasi objek. UML sangat berguna dalam menggambarkan kebutuhan pengguna dan alur sistem melalui berbagai diagram dan tabel data. UML menggunakan konsep desain berorientasi objek dan tidak bergantung pada bahasa pemrograman tertentu. Ini memungkinkan pemodelan sistem yang kompleks dan besar dengan cara yang terstruktur (Maggi dkk., 2020). UML mencakup berbagai jenis diagram yang dibagi menjadi diagram struktural dan diagram perilaku. Diagram kelas adalah salah satu yang paling umum digunakan untuk memodelkan tampilan desain statis dari system (Al-Fedaghi, 2021). Terdapat beberapa jenis diagram pada uml diantaranya yaitu, Use Case Diagram, Sequence Diagram, Class Diagram, dan Activity Diagram.

Use Case Diagram

Use case adalah abstraksi dari interaksi antara sistem dan aktor. Use case bekerja dengan cara mendeskripsikan tipe interaksi antara user sebuah sistem dengan sistemnya sendiri melalui sebuah cerita bagaimana sebuah sistem dipakai. Use case merupakan konstruksi untuk mendeskripsikan bagaimana sistem akan terlihat di mata user. Sedangkan use case diagram memfasilitasi komunikasi diantara analis dan pengguna serta antara analis dan klien (Ahmad, 2022).

Tabel 2.2 Simbol Use Case Diagram

Sumber: (Suriya & Nivetha, 2023)

Sequence Diagram

Sequence diagram menunjukkan bagaimana sekelompok objek dapat berkolaborasi dalam beberapa behavior atau kebiasaan. Sequence diagram menggambarkan perilaku pada sebuah skenario. Kegunaan dari sequence diagram adalah menunjukkan serangkaian proses yang dikirim antara objek yang berinteraksi dengan objek, sesuatu terjadi pada titik tertentu pada saat eksekusi sistem.

Tabel 2.3 Simbol Sequence Diagram

Sumber: (Suriya & Nivetha, 2023)

Class Diagram

Class adalah dekripsi kelompok obyek-obyek dengan properti, perilaku (operasi) dan relasi yang sama. Sehingga dengan adanya class diagram dapat memberikan pandangan global atas sebuah sistem. Hal tersebut tercermin dari class-class yang ada dan relasinya satu dengan yang lainnya. Sebuah sistem biasanya mempunyai beberapa class diagram. Class diagram sangat membantu dalam visualisasi struktur kelas dari suatu sistem.

Tabel 2.4 Simbol Class Diagram

Sumber: (Suriya & Nivetha, 2023)

Activity Diagram

Activity diagram merupakan gambaran dari rangkaian aliran dari aktivitas. Tujuan dari activity diagram adalah mendeskripsikan aktivitas yang dibentuk dalam suatu operasi sehingga dapat digunakan aktivitas lain.

Tabel 2.5 Simbol Activity Diagram

Sumber: (Khomokhoana dkk., 2025)

## [2.2.a] Entity Relationship Diagram

Entity Relationship Diagram (ERD) merupakan alat pemodelan konseptual tahap awal untuk merepresentasikan entitas, atribut, dan hubungan dalam basis data secara grafis. ERD bermanfaat untuk memvisualisasikan struktur data sebelum tahap implementasi teknis dilakukan (Pulungan dkk., 2023), meminimalisir berbagai kesalahan desain, serta menjadi alat komunikasi visual yang efektif antara pengembang dan pemangku kepentingan. Secara struktural, komponen utama ERD terdiri dari entitas (objek data unik), atribut yang mendeskripsikan properti entitas beserta kunci primernya (’Afiifah dkk., 2022), dan hubungan yang menggambarkan interaksi antar entitas dalam sistem.

*Tabel 2.6 Entity Relationship Diagram*

Sumber: (Pulungan dkk., 2023)

## [2.2.a] Basis Data

Data base atau basis data merupakan kumpulan data yang memiliki format dan struktur-struktur tertentu sehingga memungkinkan sistem berbasis komputer dapat melakukan penyimpanan, pengelolaan, dan pengambilan data secara cepat. Dalam basis data juga terdapat sebuah sistem basis data, terdiri dari data secara logis saling terkait dan biasanya disimpan dalam sebuah repositori data. Karena pada sistem basis data penyimpanan data bersifat satu tempat, maka memungkinkan dalam saat bersamaan beberapa pengguna mengakses dan memperbarui basis data tersebut. Tempat untuk mengakses dan mengolah basis data ini dikenal sebagai DBMS (Basis data Management System). Sebuah sistem basis data sendiri terdiri dari 5 komponen yaitu: perangkat keras, perangkat lunak, data, prosedur, dan manusia (Hadiprakoso, 2021).

Perangkat Keras

DBMS membutuhkan hardware (perangkat keras) untuk dapat diinstal. Perangkat keras dapat berupa sebuah komputer pribadi sampai jaringan komputer tergantung pada kebutuhan organisasi dan DBMS yang digunakan. Beberapa DBMS hanya berjalan pada perangkat keras atau sistem operasi tertentu, sementara yang lain dapat dijalankan pada berbagai macam perangkat keras dan sistem operasi. Lebih lanjut lagi perangkat keras di sini dapat mengacu pada semua perangkat fisik sistem, termasuk komputer.

Perangkat Lunak

Dalam DBMS terdapat 3 jenis perangkat lunak yaitu sistem operasi, DBMS, dan program aplikasi lainnya. Sistem operasi mengelola semua komponen perangkat keras dan memungkinkan semua perangkat lunak lain untuk diinstal dan berjalan di komputer, contoh perangkat lunak sistem operasi termasuk Microsoft, Linux, dan Mac OS. Selanjutnya DBMS sebagai pengelola basis data seperti, Microsoft SQL Server, Oracle, MySQL. Program aplikasi lainnya digunakan untuk mengakses data yang terdapat didalam basis data untuk menghasilkan laporan dan informasi lainnya.

Data

Komponen yang paling penting dari sistem basis data dari sudut pandang pengguna adalah data. Data di sini meliputi pengumpulan fakta yang tersimpan dalam basis data. Karena data adalah bahan baku dari mana informasi yang dihasilkan, menentukan data yang masuk ke dalam basis data dan bagaimana mengatur data menjadi informasi yang berharga merupakan bagian penting dari sebuah sistem basis data.

Prosedur

Prosedur merupakan sebuah aturan yang mengatur desain dan penggunaan sistem basis data.

Manusia

Komponen ini mencakup semua pengguna dari sistem basis data. Berdasarkan fungsi pekerjaan utama masing-masing terdapat empat jenis pengguna yang dapat diidentifikasi dalam sistem basis data yakni: administrator basis data, perancang basis data, analis sistem, programmer, dan pengguna akhir.

## [2.2.a] Structure Query Language

Structured Query Language (SQL) merupakan bahasa pemrograman standar yang dirancang secara spesifik untuk mengelola, memanipulasi, dan mengekstraksi informasi dari Sistem Manajemen Basis Data Relasional (RDBMS). Secara fungsional, SQL memfasilitasi interaksi tingkat tinggi antara aplikasi perangkat lunak dan repositori data melalui eksekusi kueri (query) terstruktur. Instruksi dalam SQL umumnya diklasifikasikan ke dalam beberapa kategori utama, di antaranya Data Definition Language (DDL) untuk merancang skema atau struktur tabel, serta Data Manipulation Language (DML) seperti perintah SELECT, INSERT, UPDATE, dan DELETE yang bertugas memproses data operasional. Keunggulan utama SQL terletak pada kemampuannya mengeksekusi fungsi agregasi komputasional, memfilter informasi spesifik, serta mengonsolidasikan entitas dari berbagai tabel yang saling berelasi melalui operasi JOIN, sehingga memungkinkan pengambilan maupun pengolahan data berskala besar secara cepat, akurat, dan terpusat di tingkat database (Khan dkk., 2023).

## [JUDUL BAB] BAB III
METODE PENELITIAN

## [3.n] Metode Penelitian

Penelitian ini menerapkan metode pengembangan System Development Life Cycle (SDLC) dengan model Waterfall sebagai kerangka kerja sistematis dalam membangun fitur dashboard pada sistem manajemen proyek di PT Smart Home Inovasi Yogyakarta. Model Waterfall dipilih karena menawarkan pendekatan yang linier dan berurutan—meliputi tahapan analisis kebutuhan, desain sistem, implementasi, hingga pengujian—yang memastikan setiap fase diselesaikan dengan matang sebelum beralih ke fase berikutnya. Keteraturan alur ini sangat krusial dalam menjamin proses ekstraksi dan integrasi data daily report dari keseluruhan proyek dapat ditransformasikan secara akurat menjadi indikator analitik visual. Melalui pendekatan SDLC model Waterfall, pengembangan tata kelola sistem dilakukan secara terukur untuk memastikan bahwa dashboard yang dihasilkan mampu memenuhi kebutuhan manajerial dalam memantau status kesehatan proyek secara real-time bagi Manajer dan Teknisi.

Berdasarkan model Waterfall yang digunakan dalam penelitian ini, proses pengembangan sistem dilakukan secara berurutan melalui lima tahapan utama. Berikut adalah penjabaran dari masing-masing tahapan dalam konteks pengembangan fitur dashboard di PT Smart Home Inovasi (SHI):

Analisa Kebutuhan (Requirement Analysis)

Tahap ini merupakan langkah awal untuk mengidentifikasi masalah dan mengumpulkan kebutuhan fungsional maupun non-fungsional dari sistem yang akan dibangun. Pada tahap ini, dilakukan observasi dan wawancara dengan pihak PT SHI untuk memahami alur pelaporan kerja yang ada. Fokus utama analisis adalah merumuskan kebutuhan aliran data daily report untuk proyek secara keseluruhan guna memastikan bahwa data mentah tersebut dapat diekstraksi menjadi informasi yang berguna bagi manajerial, tanpa menjadikannya sebagai sistem pendukung keputusan (SPK) prediktif, melainkan murni sebagai sistem manajemen dan pemantauan operasional.

Pemodelan (Design)

Setelah kebutuhan sistem terdefinisi dengan jelas, tahap selanjutnya adalah merancang arsitektur sistem dan tata letak antarmuka. Proses pemodelan ini mencakup perancangan struktur basis data menggunakan Entity Relationship Diagram (ERD), perancangan logika struktur kode menggunakan Class Diagram, serta pembuatan wireframe atau purwarupa antarmuka (User Interface) untuk halaman login, form daily report, matriks jadwal, hingga visualisasi akhir pada dashboard Early Warning System (EWS).

Implementasi (Implementation / Coding)

Pada tahap ini, hasil perancangan dari tahap pemodelan ditransformasikan ke dalam bentuk bahasa pemrograman agar menjadi perangkat lunak yang fungsional. Proses penulisan kode (coding) dalam penelitian ini mengimplementasikan kerangka kerja (framework) Next.js untuk membangun antarmuka web yang dinamis dan responsif. Logika komputasi untuk menghitung metrik Schedule Performance Index (SPI) dan status kesehatan proyek juga ditanamkan pada tahap ini, sehingga dashboard dapat merender data secara real-time.

Pengujian (Testing)

Setelah fitur dashboard dan fungsionalitas sistem selesai dibangun, tahap pengujian dilakukan untuk memastikan bahwa aplikasi berjalan sesuai dengan spesifikasi dan bebas dari kesalahan (bug). Pengujian difokuskan pada keakuratan integrasi data, memastikan bahwa daily report proyek keseluruhan yang diinputkan oleh teknisi dapat secara akurat mengubah indikator metrik dan visualisasi status pada dashboard Manajer.

Pemeliharaan (Maintenance)

Tahapan terakhir ini melibatkan operasional sistem secara langsung di lingkungan kerja PT SHI. Tahap pemeliharaan mencakup evaluasi kinerja sistem pasca-implementasi, perbaikan jika ditemukan masalah minor saat penggunaan langsung, serta penyesuaian atau optimasi sistem untuk memastikan fitur dashboard manajemen proyek dapat terus beroperasi dengan stabil dan relevan dengan kebutuhan perusahaan di masa mendatang.

## [3.n] Obyek Penelitian

## [3.2.1] Gambaran Umum

PT Smart Home Inovasi Yogyakarta (SHI) merupakan sebuah perusahaan teknologi yang berlokasi di Kabupaten Sleman, Daerah Istimewa Yogyakarta. Perusahaan ini mengkhususkan diri pada pengembangan dan implementasi solusi Smart Home serta Internet of Things (IoT). Mengusung visi sebagai penyedia solusi hunian cerdas terdepan, PT SHI menghadirkan berbagai inovasi otomasi perangkat—mulai dari sistem keamanan, pengaturan suhu, hingga efisiensi energi—guna menciptakan ekosistem hunian yang aman, nyaman, dan hemat energi bagi kliennya.

## [3.2.1] Proses Bisnis dan Aktor yang Terlibat

Dalam sistem manajemen proyek yang diusulkan pada penelitian ini, terdapat desentralisasi wewenang pelaporan untuk memangkas birokrasi administratif. Adapun aktor utama yang terlibat dan hak aksesnya dalam proses bisnis pencatatan daily report adalah sebagai berikut:

Teknisi: Aktor yang bertugas sebagai pelaksana operasional di lokasi klien (misalnya melakukan instalasi IoT). Dalam sistem ini, teknisi diberikan hak akses untuk menginputkan data daily report (berupa persentase progres pekerjaan harian) secara langsung ke dalam sistem, tanpa harus melaporkannya terlebih dahulu secara manual atau tekstual melalui perantara.

Manajer: Aktor pada tingkat manajerial yang bertanggung jawab mengawasi seluruh portofolio proyek. Manajer bertindak sebagai pengguna utama antarmuka dashboard. Aktor ini tidak lagi bertugas menginput data laporan dari teknisi, melainkan fokus pada mengevaluasi Project Health Status, memantau grafik kemajuan proyek, dan merespons peringatan dini (Early Warning System) yang dihasilkan oleh sistem.

## [JUDUL BAB] BAB IV 
ANALISIS DAN PERANCANGAN

## [4.n] Analisis Sistem

Analisis Sistem adalah suatu teknik atau metode pemecahan masalah dengan cara menguraikan sistem ke dalam komponen-komponen pembentuknya untuk mengetahui bagaimana komponen-komponen tersebut bekerja dan saling berinteraksi satu sama lain untuk mencapai tujuan sistem. Analisis sistem biasanya dilakukan dalam membuat System Design. System Design adalah salah satu langkah dalam teknik pemecahan masalah di mana komponen-komponen pembentuk sistem digabungkan sehingga membentuk satu kesatuan sistem yang utuh. Hasil dari System Design merupakan gambaran sistem yang sudah diperbaiki. Teknik dari System Design ini meliputi proses penambahan, penghilangan, dan pengubahan komponen-komponen dari sistem semula.

## [4.1.n] Analisa Sistem yang Berjalan

Berdasarkan flowchart pada Gambar 4.1, proses bisnis dimulai ketika manajer membuat data proyek pada ScriptSheet dan menugaskan teknisi ke lapangan. Setelah pekerjaan dilaksanakan, teknisi melaporkan progres proyek melalui WhatsApp. Selanjutnya, manajer memasukkan laporan tersebut secara manual ke dalam spreadsheet untuk melengkapi data proyek. Apabila data belum lengkap, manajer akan meminta tambahan informasi kepada teknisi. Setelah data dinyatakan lengkap, manajer melakukan analisis progres proyek dan perhitungan SPI secara manual untuk mengetahui kondisi proyek. Jika proyek terindikasi terlambat, manajer akan menghubungi teknisi melalui WhatsApp guna melakukan tindak lanjut. Apabila tidak terdapat keterlambatan, status proyek diperbarui pada ScriptSheet hingga proses selesai.

## [4.1.n] Analisa Sistem yang Diusulkan

Pada sistem operasional yang berjalan sebelumnya, manajemen menghadapi keterbatasan visibilitas dalam melacak metrik performa masing-masing teknisi, serta proses evaluasi yang bergantung pada metode manual sehingga mengakibatkan deteksi kendala sering kali terlambat (information lag). Keterlambatan mitigasi ini sering menimbulkan efek domino yang mengganggu linimasa proyek selanjutnya dan berpotensi menurunkan kepercayaan pelanggan. Oleh karena itu, implementasi dashboard pemantauan diusulkan sebagai solusi strategis untuk mentransformasikan manajemen proyek menjadi lebih efektif. Sistem yang mengintegrasikan otomasi kalkulasi kinerja ini akan meningkatkan otomatisasi alur proses bisnis, meminimalisasi risiko human error dalam rekapitulasi, serta memastikan manajer dapat melakukan pengawasan dan evaluasi secara real-time demi menjaga mutu penyelesaian proyek.

Untuk mewujudkan solusi tersebut, alur sistem usulan pada gambar 4.2 dirancang secara terpusat yang dimulai dari proses validasi login untuk mendeteksi hak akses (role) pengguna. Setelah autentikasi berhasil, sistem akan mengarahkan pengguna ke ruang kerja spesifik; Admin diarahkan ke Dashboard Umum untuk mengelola data master pengguna dan keseluruhan data proyek, Manajer diarahkan ke Dashboard pemantauan untuk mengawasi visualisasi grafis operasional dan menindaklanjuti eskalasi, sedangkan Teknisi mengakses Dashboard Performa untuk melaporkan progres tugas harian yang dikunci otomatis secara real-time serta untuk melaporkan kendala lapangan. Seluruh aktivitas dari ketiga role ini kemudian didukung oleh fitur komentar global pada detail proyek untuk komunikasi terpadu, dan siklus proses bisnis ini akan berakhir ketika pengguna melakukan logout dari sistem.

*Gambar 4.2 Bagan Alur Sistem yang Diusulkan*

## [4.n] Analisa Kebutuhan

Pada tahap ini, analisis dilakukan untuk mengidentifikasi kebutuhan spesifik dari PT Smart Home Inovasi Yogyakarta terkait pengembangan fitur dashboard pemantauan proyek berbasis data daily report. Kebutuhan sistem ini dibagi menjadi dua, yaitu analisa kebutuhan fungsional dan analisa kebutuhan non-fungsional.

## [4.2.n] Analisa Kebutuhan User

Berdasarkan desentralisasi wewenang pelaporan dan alur proses bisnis yang diusulkan pada PT Smart Home Inovasi Yogyakarta, terdapat dua kategori pengguna utama yang akan berinteraksi langsung dengan sistem pemantauan ini, yaitu Teknisi dan Manajer. Peran Admin tidak dimasukkan karena bertindak sebagai pengelola sistem (system administrator), bukan sebagai pengguna akhir (end-user) operasional yang menjalankan fungsi harian proyek. Adapun rincian kebutuhan dari masing-masing aktor adalah sebagai berikut:

Teknisi

Teknisi berperan sebagai pelaksana operasional di lokasi klien, seperti melakukan instalasi perangkat IoT. Dalam sistem ini, teknisi bertindak sebagai sumber utama pencatatan data faktual. Kebutuhan Teknisi meliputi:

Teknisi dapat melakukan input Daily Report mandiri. Teknisi dapat mengisi langsung formulir laporan progres harian segera setelah menyelesaikan pengerjaan di lokasi klien, yang mencakup rincian tugas, persentase Earned Value, dan catatan kendala operasional tanpa melalui perantara manajer.

Teknisi dapat mengakses Self-Performance Dashboard. Ini memungkinkan teknisi untuk melihat visualisasi ringkas nilai Schedule Performance Index (SPI) pribadi yang dikalkulasi secara otomatis dari akumulasi data laporan harian mereka, guna melakukan swamonitoring status kinerja jadwal secara mandiri (apakah sesuai target, mendahului, atau terlambat).

Manajer

Manajer berfungsi sebagai pengawas pada tingkat manajerial yang bertanggung jawab atas kelancaran seluruh portofolio proyek perusahaan. Pada pengembangan sistem ini, Manajer tidak lagi bertugas menginput laporan secara manual, melainkan bertindak sebagai pengguna utama antarmuka visual. Kebutuhan Manajer meliputi:

Mengakses halaman dashboard utama yang memvisualisasikan ringkasan seluruh proyek aktif.

Memantau metrik Project Health Status yang direpresentasikan melalui indikator visual kode warna (Red, Amber, Green) untuk setiap proyek.

Melihat perbandingan terperinci antara progres ideal (Planned Value) berdasarkan durasi proyek, dengan progres aktual (Earned Value) hasil laporan harian.

Menerima peringatan dini (Early Warning System) melalui penonjolan urutan proyek berstatus kritis pada dashboard, sehingga dapat segera menentukan prioritas penanganan secara objektif.

Hak akses Manajer dibatasi pada pemantauan dashboard dan evaluasi kinerja operasional, tanpa wewenang atau kebutuhan untuk mengelola data di luar lingkup daily report (seperti data keuangan atau pengadaan material).

## [4.2.n] Analisa Kebutuhan Fungsional

Analisa kebutuhan fungsional mendefinisikan layanan, fitur, dan fungsi yang harus disediakan oleh sistem agar dapat berjalan sesuai dengan alur bisnis perusahaan. Kebutuhan fungsional pada sistem ini adalah sebagai berikut:

Sistem Penginputan Data Operasional

Sistem harus memfasilitasi Teknisi untuk melakukan input data daily report secara langsung, yang mencakup rincian persentase progres pekerjaan harian (Earned Value) dan catatan kendala di lapangan.

Kalkulasi Matematis Otomatis

Sistem secara otomatis mengakumulasi data daily report untuk menghitung metrik Schedule Performance Index (SPI) dengan membandingkan progres aktual terhadap target rencana jadwal (Planned Value) (Radman dkk., 2025).

Pemicu Early Warning System (EWS)

Sistem harus mampu mengkategorikan status kesehatan proyek (Project Health Status) secara otomatis ke dalam indikator kode warna Red-Amber-Green (RAG) berdasarkan parameter perhitungan SPI (misalnya, berstatus Merah/Kritis jika nilai ).

Visualisasi Dashboard Sentral

Sistem menampilkan dashboard bagi Manajer yang merangkum proyek aktif, mengurutkan prioritas berdasarkan urgensi, serta menyajikan perbandingan progres ideal, aktual, dan nilai SPI secara visual tanpa perlu menelusuri laporan tekstual manual.

## [4.2.n] Analisa Kebutuhan Non Fungsional

Analisa kebutuhan non-fungsional mendefinisikan batasan, standar performa, dan karakteristik operasional yang harus dimiliki oleh sistem. Kebutuhan non-fungsional pada pengembangan sistem ini meliputi:

Kinerja (Performance):

Fitur dashboard harus mampu merender visualisasi data agregasi dan perubahan status Early Warning System secara asinkronus dan real-time. Penggunaan framework Next.js dengan fitur Server-Side Rendering (SSR) diwajibkan agar pembaruan informasi pada dashboard dapat berjalan cepat tanpa harus memuat ulang (refresh) keseluruhan halaman.

Keamanan (Security) dan Otorisasi:

Sistem harus membedakan hak akses secara ketat (role-based access control). Teknisi hanya memiliki wewenang untuk memasukkan data daily report, sedangkan hak akses untuk memantau indikator dashboard secara menyeluruh dikhususkan bagi Manajer.

Kegunaan (Usability):

Antarmuka dashboard harus dirancang dengan pendekatan visual yang intuitif, sehingga Manajer dapat mengidentifikasi kondisi kesehatan suatu proyek secara sekilas tanpa membutuhkan proses analitik manual.

## [4.n] Perancangan Sistem

Tahap perancangan sistem disusun untuk memberikan gambaran menyeluruh terkait model proses menggunakan Unified Modeling Language (UML), model data, struktur fisik basis data, relasi antar tabel, hingga perancangan antarmuka visual yang akan dikembangkan pada fitur dashboard pemantauan proyek ini. Proses perancangan dilakukan untuk memastikan bahwa seluruh komponen, mulai dari alur penginputan data daily report di lapangan hingga otomasi visualisasi Early Warning System (EWS), dapat saling terintegrasi dengan baik. Hal ini bertujuan agar sistem yang dibangun mampu beroperasi secara akurat dan memenuhi seluruh kebutuhan fungsional maupun non-fungsional dari Manajer dan Teknisi di PT Smart Home Inovasi Yogyakarta. Perancangan sistem ini diuraikan secara lebih rinci ke dalam beberapa sub-bagian berikut.

## [4.3.n] Perancangan Model Proses

Perancangan model proses pada pengembangan sistem ini menggunakan Unified Modeling Language (UML) untuk memvisualisasikan interaksi antara pengguna (Teknisi dan Manajer), sistem, dan basis data. Penggunaan UML bertujuan memetakan alur transformasi data daily report menjadi indikator visual pada dashboard secara terstruktur. Pendekatan ini dilakukan untuk meminimalisasi potensi kesalahan implementasi, mempermudah pemahaman logika Early Warning System (EWS), serta memastikan seluruh fungsionalitas terintegrasi secara efisien sesuai dengan kebutuhan operasional di PT Smart Home Inovasi Yogyakarta.

## [4.3.1.n] Model Use Case Diagram

Gambar 4.3 memodelkan interaksi fungsional antara dua aktor utama, yaitu Teknisi dan Manajer, terhadap sistem Dashboard Daily Report Proyek PT SHI. Sebagai fondasi keamanan, seluruh fungsionalitas inti dalam sistem ini diikat oleh relasi <<include>> terhadap use case Login, yang berarti proses autentikasi wajib dilakukan sebelum pengguna mengakses sistem. Aktor Teknisi sebagai pelaksana lapangan memiliki wewenang untuk Tinjau dashboard performa, Lihat detail tugas & proyek, Mengisi daily report, dan Mengajukan eskalasi/kendala lapangan. Saat berinteraksi dengan dashboard performa dan form laporan harian, sistem memberikan opsi fungsionalitas tambahan secara dinamis (relasi <<extend>>) bagi Teknisi untuk masing-masing Melihat riwayat proyek dan Lihat riwayat daily report.

Di sisi lain, aktor Manajer memiliki hak manajerial untuk mengeksekusi fungsi Tinjau dashboard proyek, Kelola data proyek, Kelola daily report, serta Menindaklanjuti eskalasi. Saat melakukan pengelolaan data proyek, Manajer diberikan opsi fungsionalitas perluasan (<<extend>>) untuk Lihat detail dan progres proyek, namun sistem membatasi wewenang pengelolaan tersebut melalui relasi <<exclude>> yang secara mutlak mencegah tindakan Menghapus data pelanggan. Lebih lanjut, ketika Manajer sedang berinteraksi dengan fungsi laporan (Kelola daily report), sistem mengakomodasi opsi lanjutan (<<extend>>) agar Manajer dapat secara langsung mengambil tindakan operasional berupa Kelola penugasan teknisi sehingga bisa diukur sebagai parameter kesehatan proyek.

## [4.3.1.n] Model Activity Diagram

Subbab ini memaparkan Activity Diagram yang memvisualisasikan alur kerja dinamis dan rangkaian aktivitas operasional dari sistem dashboard yang diusulkan. Pemodelan ini berfungsi sebagai penjabaran langkah demi langkah dari Use Case Diagram sebelumnya, guna memperjelas bagaimana setiap proses bisnis dieksekusi di dalam sistem—mulai dari tahap autentikasi pengguna, pengisian laporan harian oleh teknisi, hingga proses pengawasan dan validasi oleh manajer—beserta titik-titik pengambilan keputusan (decision node) yang terjadi di dalamnya.

Activity Diagram Autentikasi (Login dan Logout)

Gambar 4.4 mengilustrasikan proses autentikasi sistem, dimana proses dimulai ketika pengguna memasukkan data kredensial pada form login. Sistem kemudian melakukan validasi dengan mencocokkan data tersebut pada tabel tb_user di basis data. Jika data sesuai, sistem akan memberikan akses kepada pengguna untuk masuk ke dalam sistem. Namun, apabila data tidak valid, pengguna akan diminta untuk kembali mengisi ulang informasi yang benar. Setelah mendapatkan akses, pengguna dapat

menggunakan sistem hingga pada akhirnya mengirimkan permintaan logout sebagai tanda keluar dari sesi penggunaan.

Activity Diagram Pengelolaan Proyek

Gambar 4.5 merepresentasikan alur komputasi penambahan proyek baru yang diinisiasi oleh Manajer melalui penginputan detail spesifikasi dan rentang waktu pengerjaan. Input jadwal tersebut memicu sistem untuk melakukan validasi silang pada basis data guna menyaring dan mengeliminasi teknisi yang jadwalnya berbenturan, sehingga antarmuka hanya akan merender daftar teknisi yang berstatus tersedia (available). Berbekal data yang tervalidasi tersebut, Manajer dapat menetapkan penugasan dan menyusun dekomposisi pekerjaan (task breakdown), yang nantinya akan berfungsi sebagai parameter dasar yang krusial dalam mengevaluasi status kesehatan proyek. Alur operasional ini diselesaikan ketika Manajer mengonfirmasi penyimpanan; sistem kemudian memproses penyimpanan data proyek secara permanen di basis data, mendistribusikan notifikasi penugasan baru kepada teknisi, serta menampilkan pesan konfirmasi keberhasilan sebagai penanda bahwa entitas proyek telah terintegrasi utuh ke dalam sistem.

Activity Diagram Pelaporan Progres Harian, Validasi Tugas, & Kalkulasi SPI (Review Gate)

Gambar 4.6 ini mengilustrasikan siklus penugasan, pelaporan, dan validasi pekerjaan. Proses diawali oleh Manajer yang membuat data proyek berdasarkan jadwal tertentu. Sistem kemudian secara otomatis memfilter dan menampilkan rekomendasi teknisi yang tersedia pada jadwal tersebut untuk mencegah terjadinya tumpang tindih (bentrok) penugasan. Setelah Manajer mengalokasikan teknisi dan tugas, sistem akan mengirimkan notifikasi. Teknisi merespons penugasan melalui papan kanban dengan menggeser status tugas menjadi "Working On It" dan mengunggah foto bukti pekerjaan. Pelaporan ini menginisiasi fase validasi (Review Gate), di mana Manajer meninjau bukti tersebut. Jika belum sesuai, Manajer mengirimkan catatan revisi. Sebaliknya, jika valid, Manajer menyetujui tugas menjadi "Done". Persetujuan ini memicu sistem untuk mengkalkulasi ulang indikator kinerja (SPI) dan Health Status proyek, yang langsung memperbarui tampilan dashboard Manajer maupun Teknisi secara real-time.

Activity Diagram Dashboard Early Warning System

Gambar 4.7 memvisualisasikan alur sistematis dalam proses pemantauan Dashboard Early Warning System (EWS). Alur komputasi ini diinisiasi ketika Manajer mengakses halaman utama dashboard, yang kemudian direspons oleh sistem dengan meneruskan permintaan ekstraksi data ke database. Selanjutnya, database memproses permintaan tersebut dan mengembalikan sekumpulan data metrik proyek secara komprehensif, mencakup nilai Schedule Performance Index (SPI) beserta status tugas masing-masing proyek. Berdasarkan data yang diterima, sistem melakukan pemrosesan analitik lanjutan dengan memetakan status kesehatan proyek (Health Status) ke dalam indikator warna EWS—yakni merah, kuning, atau hijau—yang disesuaikan dengan parameter rentang nilai SPI. Kemudian sistem secara cerdas mengurutkan daftar proyek berdasarkan tingkat urgensi, sehingga proyek dengan status kritis (merah) secara otomatis ditempatkan pada urutan teratas. Alur ini berakhir ketika antarmuka dashboard berhasil ditampilkan secara utuh, sehingga Manajer dapat langsung mengevaluasi status kesehatan seluruh proyek.

Activity Diagram Pengajuan & Penanganan Eskalasi

Gambar 4.8 menjelaskan alur komunikasi dua arah dalam proses pengajuan dan penanganan eskalasi kendala. Proses diawali oleh Teknisi yang melaporkan detail kendala lapangan melalui form eskalasi. Laporan ini kemudian diproses oleh sistem untuk memunculkan indikator peringatan (flag merah) pada dashboard Manajer. Selanjutnya, Manajer meninjau detail masalah tersebut dan mengirimkan instruksi penanganan sebagai solusi. Tindakan ini memicu sistem untuk secara otomatis memperbarui status tiket eskalasi menjadi "Ditangani" dan meneruskan instruksi balasan tersebut kembali kepada Teknisi. Alur ini berakhir setelah Teknisi menerima notifikasi instruksi dari Manajer dan melihat bahwa status penanganan kendala tersebut telah selesai.

## [4.3.1.n] Model Sequence Diagram

Sequence diagram adalah salah satu jenis diagram dalam Unified Modeling Language (UML) yang digunakan untuk menggambarkan urutan interaksi antar objek dalam sistem berdasarkan waktu. Diagram ini berfokus pada urutan pesan yang dikirim antar objek untuk menjalankan suatu proses tertentu.

Sequence Diagram Autentikasi (Login dan Logout)

Gambar 4.9 memodelkan alur interaksi antarentitas secara kronologis dalam proses autentikasi pengguna pada sistem. Siklus interaksi diinisiasi oleh aktor User yang mengirimkan pesan sinkron (synchronous message) ke objek antarmuka Form Login untuk meminta akses halaman dan mendistribusikan input kredensial, yang terdiri dari alamat surel (email) dan kata sandi (password). Setelah input diterima, objek Form Login meneruskan proses dengan mengirimkan permintaan verifikasi kredensial ke objek Data User yang merepresentasikan lapisan basis data (database). Objek Data User kemudian melakukan pencarian rekaman data (data record) dan mengirimkan pesan balasan (return message) berupa pengembalian data pengguna yang bersangkutan kembali kepada objek antarmuka.

Setelah data diterima dari lapisan basis data, sistem mengeksekusi serangkaian pemrosesan internal komputasi (self-message) di dalam Form Login. Pemrosesan internal ini mencakup dua tahapan validasi krusial: pertama, memvalidasi kesesuaian kredensial yang diinputkan dengan data yang tersimpan (proses autentikasi); kedua, memeriksa atribut peran (role) dari pengguna tersebut untuk menerapkan hierarki hak akses (Role-Based Access Control/RBAC). Sebagai penutup siklus operasional, sistem merespons ke aktor User melalui return message dengan merender dan menampilkan antarmuka dashboard utama yang secara dinamis disesuaikan dengan peran fungsional pengguna (seperti Manajer atau Teknisi).

*Gambar 4.9 Sequence Diagram Autentikasi*

Sequence Diagram Pengelolaan Proyek

Gambar 4.10 memodelkan alur interaksi antarentitas secara kronologis dalam proses penambahan proyek baru beserta mekanisme alokasi penugasannya. Siklus diinisiasi saat aktor Manajer mengirimkan pesan sinkron (synchronous message) ke objek antarmuka Form Proyek untuk menginputkan spesifikasi dan rentang waktu kalender pengerjaan. Input jadwal ini memicu Form Proyek meneruskan permintaan pengecekan ketersediaan ke objek Data Proyek, di mana terjadi eksekusi pemrosesan internal (self-message) berupa kueri penyaringan untuk memfilter teknisi yang jadwalnya berbenturan. Setelah komputasi selesai, Data Proyek mengirimkan pesan balasan (return message) berisi himpunan teknisi yang tervalidasi tersedia untuk dirender oleh Form Proyek sebagai rekomendasi. Berbekal daftar tersebut, Manajer menyusun dekomposisi tugas dan mengeksekusi instruksi penyimpanan secara definitif melalui antarmuka. Form Proyek kemudian mentransmisikan kompilasi data tersebut ke Data Proyek guna direkam secara permanen (persistent storage). Sebagai penutup siklus, Data Proyek mengirimkan konfirmasi penyimpanan kembali ke antarmuka, yang langsung merespons dengan memberikan umpan balik (system feedback) kepada Manajer berupa tampilan pesan keberhasilan sekaligus memicu distribusi notifikasi penugasan baru.

Sequence Diagram Pelaporan Progres Harian, Validasi Tugas, & Kalkulasi SPI (Review Gate)

Gambar 4.11 mendeskripsikan alur interaksi sistematis dalam pelaporan progres kerja harian dan proses validasi penyelesaian tugas. Siklus operasional diinisiasi oleh aktor Teknisi yang mengakses objek antarmuka Papan Kanban untuk menggeser status tugas menjadi "Working On It" serta mengunggah foto sebagai bukti empiris pengerjaan. Instruksi pembaruan ini diteruskan ke objek Data Tugas untuk disimpan secara permanen (persistent storage), yang kemudian secara otomatis memicu sistem untuk mendistribusikan notifikasi lintas aktor kepada Manajer bahwa tugas siap ditinjau. Merespons notifikasi tersebut, Manajer mengakses antarmuka yang sama untuk memvalidasi bukti pekerjaan dan mengeksekusi otorisasi persetujuan tugas menjadi "Done". Transisi status final ini segera dicatat oleh lapisan basis data, sementara objek Papan Kanban langsung mengeksekusi pemrosesan komputasi internal (self-message) yang sangat krusial, yakni menghitung ulang nilai Schedule Performance Index (SPI) dan memperbarui Health Status proyek secara otomatis. Siklus ini mencapai titik akhir ketika sistem mengembalikan rekaman entitas terbaru untuk memperbarui metrik pada dashboard Manajer secara real-time, yang diiringi dengan pengiriman notifikasi penutupan tugas kepada Teknisi.

*Gambar 4.11 Sequence Diagram Pelaporan Progres Harian, Validasi Tugas, & Kalkulasi SPI (Review Gate)*

Sequence Diagram Dashboard Early Warning System

Gambar 4.12 mengilustrasikan alur interaksi sistematis dalam memuat Dashboard Early Warning System (EWS). Proses diinisiasi saat aktor Manajer mengakses halaman utama, yang secara otomatis memicu objek Dashboard untuk meminta ekstraksi data metrik kepada lapisan basis data (Data Proyek). Setelah Data Proyek selesai memproses kueri nilai SPI dan status tugas, himpunan data tersebut dikembalikan ke Dashboard. Selanjutnya, objek Dashboard melakukan dua tahapan pemrosesan algoritmik internal: memetakan status kesehatan proyek ke dalam indikator warna EWS secara dinamis, lalu mengurutkan daftar proyek tersebut berdasarkan tingkat urgensi. Alur komputasi ini ditutup dengan Dashboard merender antarmuka visual secara utuh yang menampilkan indikator peringatan dini kepada Manajer.

Sequence Diagram Pengajuan & Penanganan Eskalasi

Gambar 4.13 mengilustrasikan alur komunikasi sistematis dua arah dalam proses pelaporan dan penanganan eskalasi kendala operasional. Proses ini diinisiasi oleh aktor Teknisi yang mengirimkan rincian kendala lapangan melalui antarmuka Form Eskalasi, untuk kemudian direkam secara permanen oleh lapisan basis data (Data Eskalasi). Sistem secara proaktif mendistribusikan peringatan berupa indikator flag merah ke dashboard Manajer guna memicu atensi visual secara real-time. Sebagai respons, Manajer meninjau tiket eskalasi tersebut dan memberikan instruksi penanganan sebagai solusi. Siklus komputasi ini ditutup dengan pembaruan status tiket menjadi "Ditangani" di basis data, yang secara otomatis memicu antarmuka sistem untuk meneruskan instruksi balasan dari Manajer beserta notifikasi penyelesaian kembali kepada Teknisi.

*Gambar 4.13 Sequence Diagram Pengajuan & Penanganan Eskalasi*

## [4.3.1.n] Model Class Diagram

Class diagram merupakan salah satu instrumen pemodelan dalam Unified Modeling Language (UML) yang berfungsi untuk mendeskripsikan struktur statis sebuah sistem dengan menjabarkan entitas kelas, atribut, metode, serta arsitektur relasi antarobjek di dalamnya. Diagram ini merepresentasikan implementasi kode program yang membangun logika komputasi pada sistem project management. Mengingat sistem ini difokuskan pada pengembangan fitur dashboard analitik yang bersumber dari data daily report, maka arsitektur kelas-kelas utama dirancang secara spesifik untuk mengakomodasi hierarki manajemen pengguna, pengelolaan entitas proyek, perekaman data pelaporan tugas harian dari lapangan, hingga pemrosesan logika metrik Early Warning System (EWS). Class diagram dapat dilihat pada Gambar 4.14

.

Sebagai penjabaran lebih lanjut dari rancangan Class Diagram yang telah diuraikan sebelumnya, berikut adalah pemaparan mengenai fungsi spesifik dari masing-masing kelas utama:

Class User

Kelas User berfungsi sebagai lapisan autentikasi dan otorisasi pada sistem. Kelas ini merepresentasikan entitas pengguna serta mengelola hak akses berdasarkan peran pengguna, seperti Manajer, Teknisi, dan Admin. Deskripsi fungsi pada kelas User dapat dilihat pada Tabel 4.1.

*Tabel 4.1 Class User*

Class Client

Kelas Client merepresentasikan entitas pelanggan atau instansi pemilik proyek. Kelas ini digunakan untuk mengelola data klien yang terdaftar dalam sistem. Deskripsi fungsi pada kelas Client dapat dilihat pada Tabel 4.2.

*Tabel 4.2 Class Client*

Class Project

Kelas Project merupakan inti utama sistem karena berfungsi untuk mengelola koordinasi proyek, penjadwalan, fase pekerjaan, serta hubungan antar tugas. Deskripsi fungsi pada kelas Project dapat dilihat pada Tabel 4.3.

*Tabel 4.3 Class Project*

Class ProjectAssignment

Kelas ProjectAssignment berfungsi sebagai kelas asosiasi (association class) yang menghubungkan pengguna dengan proyek tertentu secara terstruktur. Deskripsi fungsi pada kelas ProjectAssignment dapat dilihat pada Tabel 4.4.

*Tabel 4.4 Class ProjectAssignment*

Class ProjectHealth

Kelas ProjectHealth berfungsi untuk mengelola proses komputasi Early Warning System (EWS) serta menghitung indikator kesehatan proyek. Dengan adanya pemisahan ini, proses analisis tidak membebani kelas utama Project. Deskripsi fungsi pada kelas ProjectHealth dapat dilihat pada Tabel 4.5.

*Tabel 4.5 Class ProjectHealth*

Class Task

Kelas Task merepresentasikan unit pekerjaan atau tugas lapangan yang harus diselesaikan dalam periode waktu tertentu. Deskripsi fungsi pada kelas Task dapat dilihat pada Tabel 4.6.

*Tabel 4.6 Class Task*

Class TaskEvidence

Kelas TaskEvidence digunakan untuk mengelola dokumen atau lampiran bukti pekerjaan yang dikirimkan oleh teknisi. Deskripsi fungsi pada kelas TaskEvidence dapat dilihat pada Tabel 4.7.

*Tabel 4.7 Class TaskEvidence*

Class Escalation

Kelas Escalation berfungsi untuk mencatat, mengelola prioritas, dan memantau proses komunikasi terkait kendala lapangan yang terjadi selama pelaksanaan proyek. Deskripsi fungsi pada kelas Escalation dapat dilihat pada Tabel 4.8.

*Tabel 4.8 Class Escalation*

## [4.3.n] Perancangan Model Data

Dalam pengembangan fitur dashboard pada sistem project management berdasarkan data daily report untuk PT Smart Home Inovasi (SHI), penerapan Entity Relationship Diagram (ERD) menjadi fondasi utama dalam membangun struktur basis data yang solid. Diagram ini memetakan hubungan relasional antara entitas-entitas vital dalam sistem, meliputi Klien, Proyek, User, Tugas, Bukti, dan Eskalasi. Struktur data ini dirancang secara spesifik untuk mengakomodasi alur kerja operasional, mulai dari inisiasi proyek klien, manajemen peran pengguna, dekomposisi pekerjaan lapangan, pengumpulan data pelaporan harian (daily report), hingga penanganan kendala sistematis. Melalui implementasi desain ERD ini, sistem mampu mensentralisasi data operasional lapangan, menjamin integritas referensi antar data, serta menyuplai kompilasi data yang akurat secara real-time untuk dikomputasi menjadi metrik analitik pada dashboard pemantauan.

Entitas dan Hubungannya:

Tabel Klien (tb_klien)

Tabel ini menyimpan data fundamental mengenai entitas pelanggan atau pemilik proyek, mencakup informasi seperti ID klien, nama klien, nomor telepon, dan alamat. Setiap klien dapat memiliki banyak proyek yang terdaftar di dalam sistem, yang tercermin dari hubungan satu-ke-banyak (1:N) melalui relasi "memiliki" antara tb_klien dan tb_proyek. Artinya, satu klien dapat memiliki lebih dari satu proyek, namun setiap proyek secara eksklusif hanya dimiliki oleh satu klien.

Tabel Proyek (tb_proyek)

Tabel ini menyimpan informasi inti terkait pelaksanaan proyek operasional, seperti ID proyek, nama proyek, nilai proyek (project value), fase (phase), status, serta kunci tamu (ID klien). Sebagai pusat operasional, setiap entitas proyek menjadi induk dari berbagai rincian kerja. Tabel ini memiliki hubungan satu-ke-banyak (1:N) dengan tb_tugas dan tb_eskalasi, yang berarti satu proyek dapat memiliki banyak rincian tugas serta laporan eskalasi kendala.

Tabel User (tb_user)

Tabel ini berisi data kredensial dan identitas mengenai pengguna sistem, yang mencakup ID user, nama, email, dan peran fungsional (role seperti Manajer atau Teknisi). Relasi banyak-ke-banyak (M:N) antara tb_user dan tb_proyek melalui relasi "mengelola" menggambarkan bahwa pengguna dengan hak akses manajerial dapat mengelola banyak proyek secara bersamaan, dan satu proyek dapat dikelola oleh banyak manajer. Selain itu, terdapat relasi satu-ke-banyak (1:N) terhadap tb_tugas (melalui relasi "mengerjakan") dan tb_eskalasi (melalui relasi "melaporkan"), yang menunjukkan bahwa satu teknisi dapat mengerjakan banyak rincian tugas dan melaporkan berbagai eskalasi dari lapangan.

Tabel Tugas (tb_tugas)

Tabel ini berfungsi sebagai wadah utama untuk pencatatan daily report teknisi. Entitas ini menyimpan informasi mengenai rincian pekerjaan lapangan, mencakup ID tugas, ID proyek, status pengerjaan, dan tenggat waktu (due date). Setiap entitas tugas terhubung dengan satu proyek dan dikerjakan oleh satu teknisi. Untuk mengakomodasi pelaporan visual, tabel ini memiliki relasi satu-ke-banyak (1:N) dengan tb_bukti, yang berarti satu tugas pekerjaan dapat memiliki banyak file bukti lampiran yang diunggah oleh teknisi.

Tabel Bukti (tb_bukti)

Tabel ini menyimpan path atau direktori lokasi dari berkas lampiran visual yang membuktikan progres penyelesaian pekerjaan di lapangan. Atributnya mencakup ID bukti, ID tugas, dan lokasi file (file path). Keberadaan tabel ini secara spesifik memfasilitasi arsip pelaporan daily report agar terpusat dan mudah diverifikasi oleh manajer melalui dashboard.

Tabel Eskalasi (tb_eskalasi)

Tabel ini menyimpan data mengenai pelaporan kendala atau masalah yang terjadi selama operasional proyek berlangsung, mencakup atribut ID eskalasi, ID proyek, tingkat prioritas (priority), dan status penanganan. Setiap tiket eskalasi dilaporkan oleh satu teknisi (terhubung ke tb_user) dan merujuk pada satu proyek spesifik (terhubung ke tb_proyek). Struktur ini memastikan setiap hambatan di lapangan terekam dengan jelas dan dapat segera ditindaklanjuti oleh manajemen.

## [4.3.n] Perancangan Fisik Basis Data

Perancangan model fisik basis data merupakan tahap akhir dalam proses desain basis data. Pada tahap ini, skema logis atau model Entity Relationship Diagram (ERD) yang telah dirancang sebelumnya diwujudkan menjadi basis data nyata menggunakan perangkat lunak manajemen basis data (DBMS) yang dipilih. Tujuan utama dari perancangan fisik ini adalah untuk mencapai efisiensi dalam pemrosesan dan pengelolaan data. Berikut adalah perancangan model fisik basis data untuk sistem manajemen proyek di PT Smart Home Inovasi (SHI).

Tabel User

Nama Tabel: tb_user

Primary Key: id_user

*Tabel 4.9 Tabel User*

Tabel Klien

Nama Tabel: tb_klien

Primary Key: id_klien

*Tabel 4.10 Tabel Klien*

Tabel Proyek

Nama Tabel: tb_proyek

Primary Key: id_proyek

Foreign Key: id_klien (terhubung dengan tb_klien)

Foreign Key: created_by (terhubung dengan tb_user)

*Tabel 4.11 Tabel Proyek*

Tabel Penugasan Proyek

Nama Tabel: tb_penugasan_proyek

Primary Key: (id_proyek, id_user)

Foreign Key: id_proyek (terhubung dengan tb_proyek)

Foreign Key: id_user (terhubung dengan tb_user)

*Tabel 4.12 Tabel Penugasan Proyek*

Tabel Tugas

Nama Tabel: tb_tugas

Primary Key: id_tugas

Foreign Key: id_proyek (terhubung dengan tb_proyek)

Foreign Key: assigned_to (terhubung dengan tb_user)

Foreign Key: created_by (terhubung dengan tb_user)

*Tabel 4.13 Tabel Tugas*

Tabel Bukti

Nama Tabel: tb_bukti

Primary Key: id_bukti

Foreign Key: id_tugas (terhubung dengan tb_tugas)

Foreign Key: uploaded_by (terhubung dengan tb_user)

*Tabel 4.14 Tabel Bukti*

Tabel Eskalasi

Nama Tabel: tb_eskalasi

Primary Key: id_eskalasi

Foreign Key: id_proyek (terhubung dengan tb_proyek)

Foreign Key: id_tugas (terhubung dengan tb_tugas)

Foreign Key: reported_by (terhubung dengan tb_user)

*Tabel 4.15 Tabel Eskalasi*

## [4.3.n] Perancangan Relasi Antar Tabel

Pada bagian perancangan relasi antar tabel, gambar 4.16 menggambarkan hubungan antara berbagai tabel yang ada dalam basis data. Relasi antar tabel ini dirancang untuk memastikan integritas data dan kemudahan dalam pengelolaan informasi yang saling terkait.

Tabel shi_clients berelasi dengan shi_projects sebagai sumber utama data profil pelanggan atau pemilik proyek.

Tabel shi_projects menjadi sentral operasional yang berelasi dengan seluruh entitas lainnya (shi_clients, shi_users, shi_project_health, shi_tasks, shi_project_assignments, shi_budget_items, shi_materials).

Tabel shi_users berelasi dengan shi_projects, shi_project_assignments, shi_tasks, dan shi_task_evidence untuk autentikasi sistem, identifikasi pembuat data, dan alokasi peran (manajer/teknisi).

Tabel shi_project_assignments berelasi dengan shi_projects dan shi_users guna memetakan penugasan teknisi pada suatu proyek.

Tabel shi_project_health berelasi (1:1) dengan shi_projects untuk mengisolasi data kalkulasi Early Warning System (EWS) agar tidak membebani tabel utama.

Tabel shi_tasks berelasi dengan shi_projects, shi_users, dan shi_task_evidence sebagai penyimpanan rincian dekomposisi pekerjaan dan basis data daily report lapangan.

Tabel shi_task_evidence berelasi dengan shi_tasks dan shi_users untuk mengelola lampiran berkas visual sebagai bukti penyelesaian pekerjaan lapangan.

Tabel shi_budget_items berelasi dengan shi_projects untuk merekam rincian anggaran pengeluaran yang dialokasikan pada sebuah proyek.

Tabel shi_materials berelasi dengan shi_projects untuk menyimpan data rincian spesifikasi dan kuantitas material yang dibutuhkan dalam instalasi proyek.

## [4.3.n] Perancangan Antarmuka

## [4.3.5.n] Antarmuka Data Input

Halaman Login

Gambar 4.17 merepresentasikan rancangan antarmuka halaman Login yang berfungsi sebagai gerbang autentikasi dan lapis keamanan utama pada Sistem Manajemen Proyek PT Smart Home Inovasi. Desain antarmuka ini dirancang secara minimalis dan fungsional, memuat elemen form esensial berupa kolom input email, password (kata sandi), serta tombol "Masuk" untuk memvalidasi kredensial pengguna. Halaman autentikasi ini terintegrasi langsung dengan basis data untuk menjalankan sistem Role-Based Access Control (RBAC), di mana sistem akan secara otomatis mengidentifikasi hak akses pengguna—baik sebagai Teknisi, Manajer, maupun Admin—sesaat setelah validasi berhasil, guna mengarahkan mereka ke tampilan dashboard yang spesifik sesuai dengan tingkat otoritas dan kebutuhan operasional masing-masing.

*Gambar 4.17 Halaman Login*

Halaman Tambah Proyek

Gambar 4.18 merepresentasikan rancangan antarmuka halaman "Tambah Proyek Baru" yang secara khusus dapat diakses oleh pengguna dengan hak otorisasi manajerial. Halaman ini berfungsi sebagai modul entri data fundamental untuk menginisiasi entitas proyek ke dalam sistem basis data. Secara hierarkis, antarmuka ini mendekomposisi proses input menjadi tiga seksi operasional utama: pengisian atribut dasar proyek (seperti nama, klien, rentang jadwal, dan nilai proyek), panel penugasan teknisi yang terintegrasi dengan fitur rekomendasi ketersediaan jadwal secara dinamis guna mencegah bentrok (schedule clash), serta seksi dekomposisi daftar tugas (Work Breakdown Structure) untuk merincikan beban kerja lapangan. Struktur form yang terpadu ini dirancang untuk memastikan bahwa setiap proyek baru yang dieksekusi telah memiliki perencanaan alokasi sumber daya dan rincian tugas yang matang, yang nantinya akan menjadi rujukan utama bagi teknisi dalam mengunggah daily report harian mereka.

*Gambar 4.18 Halaman Tambah Proyek*

Halaman Tambah Daily Report

Gambar 4.19 merepresentasikan rancangan antarmuka halaman "Tambah Daily Report" yang secara spesifik diakses oleh pengguna dengan hak otorisasi Teknisi. Halaman ini bertindak sebagai titik tumpu (focal point) dalam mekanisme pengumpulan data operasional lapangan, di mana teknisi melaporkan rincian progres pengerjaan mereka secara terstruktur. Antarmuka ini memuat parameter input yang krusial, meliputi pemilihan proyek dan tugas spesifik, pembaruan persentase progres aktual harian, catatan eskalasi kendala lapangan, serta modul unggahan berkas untuk melampirkan bukti visual pekerjaan (task evidence). Kumpulan data mentah faktual yang diinputkan melalui form ini merupakan sumber variabel utama (Earned Value) yang nantinya akan diekstraksi dan dikomputasi oleh sistem untuk merender metrik Early Warning System (EWS) pada dashboard analitik Manajer.

*Gambar 4.19 Halaman Tambah Daily Report*

## [4.3.5.n] Antarmuka Data Proses

Halaman Dashboard Early Warning System (EWS)

Gambar 4.20 merepresentasikan rancangan antarmuka utama Dashboard Early Warning System (EWS) yang merupakan luaran inti (core output) dari pengembangan sistem aplikasi manajemen proyek ini. Dikhususkan bagi pengguna dengan hak akses manajerial, halaman ini menyajikan visualisasi analitik komprehensif yang dikomputasi secara real-time dari akumulasi data pelaporan daily report lapangan. Antarmuka ini mendekomposisi wawasan operasional ke dalam tiga segmen strategis: panel rekapitulasi kuantitatif status kesehatan proyek secara makro (indikator EWS berwarna merah, kuning, dan hijau), matriks tabel rincian proyek yang secara algoritmik diurutkan berdasarkan tingkat urgensi (metrik rasio SPI terendah), serta panel notifikasi eskalasi kendala teknis terbaru. Melalui sentralisasi informasi visual ini, manajer dapat secara proaktif mengidentifikasi proyek yang berisiko kritis dan mengeksekusi tindakan mitigasi keterlambatan jadwal secara presisi, tanpa harus meninjau dan menghitung tumpukan laporan harian teknisi secara manual.

*Gambar 4.20 Halaman Dashboard Early Warning System (EWS)*

Halaman Data Proyek

Gambar 4.2 merepresentasikan rancangan antarmuka halaman "Data Proyek" yang berfungsi sebagai modul Master Data Management (MDM) sentral untuk seluruh entitas portofolio operasional di dalam sistem. Dikhususkan bagi pengguna manajerial, antarmuka ini menyajikan rekapan komprehensif dari seluruh proyek dalam format tabel terstruktur, mencakup atribut esensial seperti identitas proyek, entitas klien, status berjalan, fase pengerjaan (survey/execution), hingga rentang jadwal kalender. Untuk mengoptimalkan efisiensi ekstraksi informasi pada himpunan data yang berskala besar, halaman ini dilengkapi dengan instrumen penapisan (filtering) berbasis status, fase, dan klien, serta kolom pencarian dinamis. Selain fungsi inventarisasi visual, antarmuka ini juga mengintegrasikan kontrol eksekusi CRUD (Create, Read, Update, Delete) secara langsung pada setiap baris data—meliputi tinjauan detail, pembaruan data, penghapusan, serta pintasan ke formulir inisiasi proyek baru—yang memastikan fleksibilitas dan integritas tata kelola administrasi proyek sebelum rincian tugasnya didelegasikan kepada teknisi di lapangan.

*Gambar 4.21 Halaman Data Proyek*

Halaman Kanban Penugasan Proyek

Gambar 4.22 merepresentasikan antarmuka Kanban Penugasan Proyek yang berfungsi sebagai modul pelacakan operasional lapangan. Rincian tugas divisualisasikan ke dalam tiga fase progres (To Do, Working On It, Done), dengan setiap kartu memuat atribut esensial seperti tenggat waktu, delegasi teknisi, dan lampiran bukti pekerjaan. Pergerakan status tugas ini terintegrasi secara langsung dengan siklus penginputan daily report oleh teknisi secara keseluruhan. Melalui konsolidasi visual terpusat ini, Manajer dapat mendeteksi hambatan alur kerja (bottleneck) secara real-time dan granular, sebelum keseluruhan data pengerjaan tersebut diagregasi untuk mengkalkulasi metrik SPI pada dashboard EWS utama.

Halaman Jadwal Proyek

Gambar 4.23 merepresentasikan rancangan antarmuka halaman "Jadwal Proyek - Linimasa Penugasan" yang berfungsi sebagai modul tata kelola alokasi sumber daya manusia. Mengadopsi metode visualisasi matriks waktu (timeline matrix), antarmuka ini memetakan distribusi beban kerja masing-masing teknisi secara komprehensif terhadap rentang kalender operasional. Fitur analitik krusial pada halaman ini terletak pada kemampuannya untuk mengidentifikasi dan memvisualisasikan tumpang tindih penugasan (schedule clash) secara otomatis melalui indikator blok warna kontras. Fasilitas ini sangat esensial bagi pengguna manajerial untuk melakukan pemerataan kapasitas kerja (resource leveling) guna menghindari kelebihan beban kerja (overload) pada teknisi tertentu. Alokasi jadwal yang presisi dan bebas konflik pada modul ini akan bertindak sebagai parameter rencana dasar (Planned Value), yang nantinya menjadi variabel pembanding mutlak ketika sistem mengkomputasi input daily report aktual untuk merender matriks peringatan dini pada dashboard EWS.

*Gambar 4.23 Halaman Jadwal Proyek*

## [4.3.5.n] Antarmuka Data Output

Halaman Dashboard Performa Teknisi

Gambar 4.24 merepresentasikan rancangan antarmuka "Dashboard Performa Saya" yang secara eksklusif dialokasikan bagi pengguna dengan hak akses Teknisi. Berbeda dengan dashboard manajerial yang berfokus pada evaluasi kesehatan proyek secara makro, halaman ini berfungsi sebagai modul analitik personal (personal performance tracker). Antarmuka ini menyajikan umpan balik kuantitatif secara instan berdasarkan akumulasi data daily report yang telah diunggah oleh teknisi tersebut, mencakup indikator kinerja utama seperti rasio SPI individu, total penyelesaian tugas, hingga peringatan beban kerja yang melewati tenggat waktu (overdue). Dilengkapi dengan visualisasi grafik tren performa mingguan serta rincian matriks tugas yang sedang berjalan, halaman ini dirancang untuk menciptakan transparansi data bagi pelaksana lapangan. Melalui fitur dashboard personal ini, teknisi difasilitasi untuk melakukan evaluasi mandiri (self-assessment) terhadap tingkat produktivitas dan kepatuhan jadwal mereka, yang pada gilirannya akan meningkatkan kedisiplinan dan akurasi dalam pelaporan operasional harian.

Halaman Detail Proyek

Gambar 4.25 merepresentasikan rancangan antarmuka halaman "Detail Proyek" yang bertindak sebagai pusat komando pengawasan (monitoring hub) spesifik untuk satu entitas proyek tunggal. Dikhususkan bagi pengguna tingkat manajerial, antarmuka ini mengonsolidasikan seluruh aliran data operasional ke dalam satu tampilan analitik terpusat. Pada panel utama "Ringkasan", sistem memvisualisasikan komparasi langsung antara target rencana (Planned Value) dengan progres aktual di lapangan (Earned Value)—yang secara otomatis diekstraksi dan diagregasi dari akumulasi daily report beserta unggahan bukti pekerjaan teknisi. Hasil komputasi dari kedua variabel tersebut secara instan merender nilai metrik Schedule Performance Index (SPI), yang kemudian memicu indikator visual Early Warning System (EWS) pada sudut atas halaman. Dilengkapi dengan rincian statistik status penyelesaian tugas, panel pelacakan tiket eskalasi aktif, serta fitur komunikasi log terpusat untuk pemberian instruksi tindak lanjut, halaman ini memberikan granulitas informasi yang mendalam bagi manajer untuk mengevaluasi akar masalah hambatan operasional dan mengeksekusi langkah mitigasi secara presisi.

Halaman Laporan Kesehatan Proyek

Gambar 4.26 merepresentasikan rancangan antarmuka halaman "Laporan Kesehatan Proyek" yang berfungsi sebagai modul pelaporan analitik komprehensif sekaligus instrumen dokumentasi performa operasional. Dikhususkan bagi pengguna tingkat manajerial, halaman ini mensintesis akumulasi data daily report dari lapangan menjadi luaran evaluatif yang siap dipertanggungjawabkan kepada stakeholder atau klien. Antarmuka ini mengintegrasikan beberapa panel visual yang krusial, meliputi ringkasan metrik kesehatan utama (nilai SPI dan indikator warna peringatan/RAG), grafik tren komparasi historis antara target rencana (Planned Value) dengan progres aktual (Earned Value), serta rincian statistik penyelesaian tugas. Nilai tambah dari halaman ini terletak pada panel "Rekomendasi Tindakan" yang secara sistematis merumuskan saran mitigasi berdasarkan nilai SPI dan eskalasi yang sedang aktif. Dilengkapi dengan kapabilitas cetak dan ekspor berformat PDF, modul ini memastikan bahwa wawasan proaktif yang dihasilkan oleh komputasi Early Warning System (EWS) dapat diekstrak menjadi dokumen formal sebagai landasan pengambilan keputusan strategis yang berbasis data valid.

## [4.3.5.n] Antarmuka Navigasi Struktur Data

Gambar 4.27 merepresentasikan rancangan bilah navigasi utama (sidebar navigation) yang berfungsi sebagai tulang punggung sirkulasi antarmuka pada Sistem Manajemen Proyek. Ditempatkan secara vertikal pada sisi kiri layar, komponen ini menyediakan aksesibilitas terpusat dan statis menuju seluruh modul fungsional aplikasi. Menu navigasi ini menstrukturkan hierarki alur kerja melalui direktori tautan langsung, mencakup akses ke halaman Dashboard analitik EWS, pengelola entitas "Proyek", manajemen basis data "Klien", pemetaan linimasa pada "Jadwal", ekstraksi "Laporan" kesehatan proyek, hingga konfigurasi "Pengaturan" sistem dan terminasi sesi autentikasi melalui opsi "Keluar". Tata letak yang minimalis dan terintegrasi ini dirancang secara ergonomis untuk mengoptimalkan pengalaman pengguna (user experience), memungkinkan pengguna untuk melakukan transisi secara cepat dan mulus antarmodul operasional tanpa kehilangan orientasi konteks saat mengelola tata kelola proyek maupun memproses data daily report.

## [4.n] Rancangan Anggaran Pengembangan Sistem

Rancangan Anggaran Biaya (RAB) merupakan dokumen yang berisi rincian estimasi biaya yang diperlukan selama proses pengembangan sistem. Penyusunan anggaran ini mencakup berbagai kebutuhan yang mendukung implementasi sistem manajemen proyek berbasis web, mulai dari sumber daya manusia, perangkat keras (hardware), hingga perangkat lunak (software) dan infrastruktur pendukung. Rancangan anggaran berfungsi sebagai acuan dalam mengendalikan penggunaan biaya selama proses pengembangan sistem agar pelaksanaan proyek dapat berjalan secara efektif dan efisien. Estimasi biaya pengembangan fitur dashboard pada sistem project management di PT Smart Home Inovasi Yogyakarta dapat dilihat pada Tabel 4.7.

*Tabel 4.7 Rancangan Anggaran Pengembangan Sistem*

## [JUDUL BAB] BAB V
IMPLEMENTASI DAN PEMBAHASAN SISTEM

## [5.n] Implementasi

Bab ini menguraikan tahapan implementasi dan pembahasan dari desain arsitektur sistem yang telah dirancang pada bab sebelumnya. Selaras dengan fokus penelitian mengenai pengembangan fitur dashboard pada sistem project management berdasarkan data daily report, bab ini mendemonstrasikan proses transformasi rancangan basis data dan antarmuka menjadi sebuah perangkat lunak yang fungsional menggunakan framework Next.js. Aplikasi ini diimplementasikan untuk memudahkan PT Smart Home Inovasi Yogyakarta dalam memantau operasional proyek secara real-time melalui pengolahan data daily report. Bab ini akan membahas jalannya pembuatan basis data dan antarmuka aplikasi, proses pengujian sistem, hingga penjelasan mengenai fitur inovatif yang ada di dalamnya.

## [5.1.n] Implementasi Basis Data

Pada subbab ini, implementasi basis data merupakan tahap transformasi dari model data logis ke dalam skema fisik pada Database Management System (DBMS) yang digunakan, yaitu PostgreSQL. Tahap ini bertujuan untuk mewujudkan struktur penyimpanan data yang efisien, konsisten, dan terintegrasi guna mendukung seluruh fungsionalitas sistem.

Tabel User

Gambar 5.1 menunjukkan implementasi fisik tabel users yang berfungsi mengelola data autentikasi dan otorisasi pengguna. Tabel ini menyimpan atribut utama seperti id (primary key), name, email sebagai identitas unik, dan password_hash yang telah dienkripsi untuk keamanan akun. Peran paling krusial terletak pada kolom role yang menerapkan Role-Based Access Control (RBAC), di mana sistem secara otomatis membedakan hak akses pengguna: role 'manager' diberikan wewenang untuk mengakses fitur dashboard pemantauan proyek, sementara role 'technician' diarahkan khusus untuk melakukan penginputan data daily report dari lapang.

Tabel Client

Gambar 5.2 menampilkan implementasi fisik tabel klien (misalnya clients atau customers) yang berfungsi sebagai media penyimpanan data master pelanggan. Tabel ini merekam atribut profil identitas klien secara komprehensif, meliputi id sebagai primary key, nama entitas atau instansi (name), informasi kontak (phone, email), alamat geografis beserta detail titik koordinat (latitude, longitude), serta catatan pelengkap (notes). Selain itu, tabel ini memuat kolom created_by yang bertindak sebagai foreign key untuk mengidentifikasi ID pengguna yang melakukan input data. Keberadaan tabel ini memastikan bahwa setiap entitas proyek yang dipantau melalui dashboard memiliki relasi data klien yang valid, terpusat, dan terstruktur dengan baik.

*Gambar 5.2 Implementasi Tabel Client*

Tabel Project

Gambar 5.3 merepresentasikan implementasi fisik dari tabel proyek yang berfungsi sebagai pusat penyimpanan data baseline penjadwalan. Tabel ini memuat atribut identitas utama seperti id sebagai primary key, project_code, name, dan description, serta client_id sebagai foreign key yang merelasikan proyek dengan entitas pelanggan. Dalam konteks fitur dashboard pemantauan, peran paling krusial dari tabel ini terletak pada kolom start_date, end_date, dan duration. Ketiga atribut waktu tersebut bertindak sebagai patokan target jadwal ideal (Planned Value) yang nantinya akan ditarik oleh sistem untuk dibandingkan dengan progres laporan harian (Earned Value) guna menghasilkan metrik Schedule Performance Index (SPI). Selain itu, tabel ini juga dilengkapi dengan atribut manajerial pendukung seperti klasifikasi operasional (status, phase, category), rekam jejak survei, hingga kolom pencatatan waktu sistem (created_at dan updated_at).

*Gambar 5.3 Implementasi Tabel Project*

Tabel Project Assignment

Gambar 5.2 merepresentasikan implementasi fisik dari tabel relasi (junction table) yang berfungsi menjembatani hubungan banyak-ke-banyak (many-to-many) antara entitas proyek dan pengguna. Tabel ini menggunakan kombinasi project_id dan user_id yang bertindak sebagai composite primary key sekaligus foreign key, serta dilengkapi dengan atribut assigned_at untuk mencatat rekam waktu penugasan. Dalam arsitektur sistem pelaporan, keberadaan tabel pemetaan ini sangat krusial untuk mengelola otorisasi operasional lapangan. Melalui relasi ini, sistem dapat melakukan validasi akses sehingga seorang Teknisi hanya diizinkan untuk melihat form dan menginputkan data daily report khusus pada proyek yang secara spesifik ditugaskan kepadanya. Hal ini menjamin bahwa data capaian progres (Earned Value) yang masuk ke dalam basis data selalu valid dan terintegrasi dengan tepat sebelum dikalkulasi menjadi metrik SPI pada dashboard Manajer.

Tabel Project Health

Gambar 5.5 menampilkan implementasi fisik dari tabel metrik kesehatan proyek (misalnya project_health atau project_metrics) yang berfungsi sebagai tempat penyimpanan hasil kalkulasi analitik performa operasional. Tabel ini menggunakan project_id sebagai primary key sekaligus penghubung ke entitas proyek utama, serta memuat atribut krusial seperti actual_progress (Earned Value), planned_progress (Planned Value), dan hasil komputasi rasio penjadwalan pada kolom spi_value. Nilai metrik tersebut kemudian menentukan atribut status yang berisi indikator warna peringatan Early Warning System (EWS) seperti merah, kuning, atau hijau. Selain itu, tabel ini merekam rincian statistik pengerjaan melalui kolom seperti total_tasks dan overdue_tasks. Dalam arsitektur dashboard, tabel ini berperan sangat vital sebagai tabel rekapitulasi (cache metrik); dengan menyimpan hasil perhitungan SPI secara terpusat, antarmuka sistem Manajer dapat memuat, memvisualisasikan, dan mengurutkan status prioritas proyek secara instan tanpa perlu membebani basis data dengan kalkulasi ulang dari data mentah setiap kali halaman diakses.

*Gambar 5.5 Implementasi Tabel Project Health*

Tabel Task

Gambar 5.6 menunjukkan implementasi fisik dari tabel rincian tugas proyek (misalnya tasks atau project_tasks) yang berfungsi mendekomposisi pekerjaan utama menjadi unit yang lebih kecil. Tabel ini berelasi dengan tabel proyek utama melalui project_id sebagai foreign key, dan menyimpan rincian seperti nama tugas (name), batas waktu penyelesaian (due_date), serta penanggung jawab (assigned_to). Dalam kaitannya dengan pelaporan, tabel ini memegang peran krusial melalui atribut status (seperti to_do, in_progress, atau done) dan estimated_hours. Ketika Teknisi melakukan update status pada tugas-tugas ini di lapangan, sistem akan merekamnya sebagai daily report. Akumulasi dari status penyelesaian dan waktu yang dihabiskan pada tugas-tugas individual inilah yang nantinya dikonversi oleh sistem menjadi total persentase Earned Value sebuah proyek, yang kemudian diolah lebih lanjut untuk menghasilkan metrik SPI pada dashboard Manajer.

*Gambar 5.6 Implementasi Tabel Task*

Tabel Task Evidence

Gambar 5.7 merepresentasikan instansiasi data pada tabel tugas yang berfungsi sebagai landasan operasional dalam modul pelaporan harian (daily report). Sampel data tersebut mengilustrasikan proses dekomposisi dari suatu entitas proyek utama (yang direlasikan melalui project_id) menjadi unit-unit pekerjaan teknis yang lebih granular dan terukur. Parameter fungsional utama pada tabel ini terletak pada atribut status, yang mencatat dinamika progres aktual operasional (seperti done atau in_progress) berdasarkan masukan data dari Teknisi. Transisi status penyelesaian tugas ini merupakan variabel esensial dalam pembentukan nilai Earned Value. Sistem kemudian mengakumulasi data status tersebut secara terprogram dan mengomparasikannya dengan parameter tenggat waktu pada atribut due_date guna menghasilkan luaran metrik Schedule Performance Index (SPI) yang divisualisasikan secara presisi pada antarmuka dashboard manajerial.

*Gambar 5.7 Implementasi Tabel Task Evidence*

Tabel Escalation

Gambar 5.8 merepresentasikan implementasi fisik dari tabel pelaporan kendala atau eskalasi isu operasional (seperti issues atau tickets). Tabel ini terintegrasi secara relasional dengan entitas utama melalui atribut project_id dan task_id sebagai foreign key. Atribut inti pada tabel ini meliputi title dan description untuk menjabarkan detail masalah teknis di lapangan, serta klasifikasi status (open, in_review, resolved) dan priority (medium, high, critical). Dalam arsitektur pelaporan harian (daily report), tabel ini berfungsi krusial untuk mengakomodasi pencatatan data kualitatif berupa hambatan atau anomali pekerjaan yang dilaporkan oleh Teknisi (reported_by). Keberadaan data ini memberikan konteks analitik yang mendalam pada dashboard manajerial; ketika indikator Early Warning System (EWS) menunjukkan penurunan performa jadwal (SPI), Manajer dapat menelusuri data pada tabel ini untuk mengidentifikasi akar permasalahan penyebab keterlambatan secara instan dan memantau riwayat penyelesaiannya melalui kolom resolution_notes.

*Gambar 5.8 Implementasi Tabel Escalation*

## [5.1.n] Implementasi Sistem

Tahap implementasi sistem berfokus pada penerjemahan rancangan desain ke dalam bentuk kode program yang siap dieksekusi. Sistem ini dikembangkan menggunakan framework Next.js dengan menerapkan arsitektur pengelolaan routing API secara terpusat dan modular. Pada aspek pengolahan data, interaksi dengan basis data dieksekusi secara terstruktur menggunakan metode parameterized query. Pendekatan ini diterapkan untuk menjaga integritas basis data sekaligus meminimalisasi celah keamanan pada saat sistem beroperasi.

Implementasi Otentikasi

Gambar 5.9 merepresentasikan potongan kode implementasi logika autentikasi pada endpoint API sistem. Fungsi ini mengekstrak masukan klien, lalu memvalidasi data pengguna di basis data menggunakan parameterized query guna mencegah risiko injeksi SQL. Selanjutnya, sistem memverifikasi kecocokan kata sandi melalui metode komparasi hash bcrypt. Apabila kredensial terbukti valid, sistem akan mengenerasi JSON Web Token (JWT) yang kemudian ditransmisikan kembali sebagai respons JSON untuk keperluan otorisasi sesi di sisi klien.

*Gambar 5.9 Implementasi Otentikasi*

Implementasi Proses Pengelolaan Data Proyek

Gambar 5.10 merepresentasikan implementasi logika antarmuka pemrograman aplikasi (API) untuk modul penambahan entitas proyek baru. Eksekusi fungsi ini diawali dengan mekanisme kontrol akses berbasis peran (Role-Based Access Control), guna memastikan bahwa operasi modifikasi data hanya dapat dilakukan oleh pengguna dengan hak otorisasi manajerial. Setelah mengekstrak parameter masukan dari klien dan menggenerasi kode identitas proyek secara otomatis, sistem mengeksekusi instruksi penulisan ke basis data menggunakan metode parameterized query untuk memitigasi risiko keamanan. Secara arsitektural, segera setelah rekaman data berhasil disimpan, fungsi ini secara langsung memicu modul komputasi Schedule Performance Index (SPI) untuk menginisialisasi parameter pengukuran performa awal proyek sebelum mengirimkan respons keberhasilan ke sisi antarmuka.

Implementasi Proses Pengelolaan Data Daily Report

Gambar 5.11 merepresentasikan implementasi logika antarmuka pemrograman aplikasi (API) pada modul pelaporan progres kerja harian (daily report). Fungsi ini menerapkan mekanisme validasi keamanan berlapis yang mencakup autentikasi pengguna dan pembatasan hak akses berbasis kepemilikan data (row-level authorization). Secara spesifik, algoritma sistem memvalidasi agar aktor Teknisi hanya diizinkan untuk mengunggah detail pembaruan aktivitas dan lampiran bukti pekerjaan (file metadata) pada entitas tugas yang telah didelegasikan secara eksklusif kepadanya. Apabila lolos proses validasi, sistem mengeksekusi instruksi penulisan menggunakan parameterized query guna merekam jejak aktivitas secara persisten ke dalam basis data sebelum mentransmisikan respons konfirmasi keberhasilan ke antarmuka klien.

*Gambar 5.11 Implementasi Proses Pengelolaan Data Daily Report*

Implementasi Kanban Penugasan Proyek

Gambar 5.12 merepresentasikan implementasi logika antarmuka pemrograman aplikasi (API) untuk modul pembaruan progres status penugasan. Pada lapisan otorisasi, fungsi ini menerapkan pembatasan hak akses tingkat baris (row-level authorization) untuk memastikan modifikasi hanya dapat dieksekusi oleh teknisi yang secara spesifik didelegasikan pada tugas tersebut. Secara algoritmik, selain mengelola transisi status operasional, sistem juga merumuskan komputasi dinamis di tingkat basis data untuk mengakumulasi durasi pengerjaan aktual (time tracking). Poin yang paling krusial secara arsitektural pada modul ini adalah implementasi mekanisme event-driven, di mana setiap transisi status tugas akan secara otomatis memicu pemanggilan fungsi komputasi ulang Schedule Performance Index (SPI). Rangkaian proses ini kemudian ditutup dengan pencatatan rekam jejak operasional ke dalam log aktivitas guna memastikan transparansi dan akuntabilitas data historis pengerjaan.

*Gambar 5.12 Implementasi Kanban Penugasan Proyek*

Implementasi Dashboard Early Warning System (EWS)

Gambar 5.13 merepresentasikan implementasi antarmuka pemrograman aplikasi (API) yang berfungsi sebagai mesin agregator data (data aggregator) untuk dashboard utama manajerial. Logika komputasi pada modul ini bertugas mengekstrak dan mengonsolidasikan informasi lintas entitas secara komprehensif, mencakup rekapitulasi status tugas, pemantauan pelaporan harian (daily report), hingga pemuatan metrik Schedule Performance Index (SPI) beserta status kesehatan proyek (health status). Guna mengoptimalkan efisiensi beban kerja server saat memproses kueri yang kompleks, sistem menerapkan metode eksekusi konkuren dalam pengambilan data ke basis data. Lebih lanjut, algoritma sistem memuat aturan penyortiran khusus yang memprioritaskan penampilan data proyek dengan indikator kritis (berskala Red atau Amber) pada urutan teratas, sehingga secara arsitektural sangat mendukung fungsionalitas pengawasan preventif bagi Manajer.

*Gambar 5.13 Implementasi Dashboard Early Warning System (EWS)*

Implementasi Laporan Kesehatan Proyek

Gambar 5.14 merepresentasikan implementasi antarmuka pemrograman aplikasi (API) yang bertindak sebagai mesin komputasi (computational engine) untuk memvisualisasikan grafik analitik Earned Value Management (EVM). Secara arsitektural, setelah melewati lapisan autentikasi keamanan, modul ini menginisialisasi ekstraksi parameter dasar proyek dari basis data, mencakup kalender rentang waktu pengerjaan serta total keseluruhan volume penugasan. Parameter-parameter fundamental inilah yang kemudian dijadikan sebagai landasan (baseline) komputasi oleh sistem untuk memetakan target jadwal secara objektif.

Pada inti pemrosesannya, algoritma mengeksekusi komputasi data runtun waktu (time-series) melalui skema iterasi periodik mingguan sepanjang umur proyek. Di dalam setiap putaran iterasi, sistem secara dinamis mengakumulasi nilai pencapaian aktual atau Earned Value (EV)—yang secara cerdas mengambil sumber data dari kalkulasi persentase penyelesaian status tugas, atau langsung dari konsolidasi daily report apabila struktur tugas belum didefinisikan. Nilai EV tersebut kemudian dikomparasikan dengan target Planned Value (PV) untuk menghasilkan rasio Schedule Performance Index (SPI) yang presisi pada setiap titik waktu. Hasil kalkulasi metrik historis ini diagregasi ke dalam struktur array, yang selanjutnya ditransmisikan ke antarmuka klien untuk dirender menjadi representasi visual grafik tren performa proyek.

*Gambar 5.14 Implementasi Laporan Kesehatan Proyek*

## [5.n] Pembahasan

## [5.2.n] Pembahasan Basis Data

Pada subbab ini, dipaparkan hasil evaluasi arsitektur basis data fisik yang menopang operasional sistem. Fokus utama dari pembahasan ini adalah untuk memvalidasi integritas relasional antarentitas serta mengevaluasi keandalan skema penyimpanan dalam mengakomodasi beban transaksi data operasional. Analisis ini secara khusus menyoroti kapabilitas basis data dalam memfasilitasi aliran informasi yang berkesinambungan—mulai dari perekaman pelaporan harian (daily report), pemeliharaan rekam jejak status penugasan secara historis, hingga penyediaan suplai data terstruktur yang sangat krusial untuk menunjang komputasi analitik Schedule Performance Index (SPI) pada dashboard manajerial.

Tabel User

Operasi penambahan data pada tabel tb_user dilakukan menggunakan perintah INSERT untuk mendaftarkan akun pengguna baru pada sistem Project Management. Proses ini dijalankan oleh administrator saat mengelola hak akses manajer maupun teknisi lapangan. Data yang disimpan meliputi nama, surel, peran pengguna, dan kata sandi terenkripsi bcrypt untuk menjaga keamanan sistem. Keberhasilan query ditandai dengan terbentuknya id_user baru sehingga pengguna dapat melakukan autentikasi sesuai otoritasnya. Eksekusi query ditunjukkan pada Gambar 5.15 dan hasilnya pada Gambar 5.16.

*Gambar 5.15 Query Insert Tabel User*

*Gambar 5.16 Hasil Eksekusi Query Insert Tabel User*

Proses pembacaan baris data pada tabel tb_user dilakukan dengan perintah SELECT untuk menampilkan daftar pengguna yang telah terdaftar di dalam sistem. Operasi ini dieksekusi saat sistem perlu melakukan validasi kredensial login atau ketika manajer mendistribusikan penugasan kepada teknisi berdasarkan kriteria tertentu. Eksekusi query disajikan pada Gambar 5.17 dan hasil eksekusinya pada Gambar 5.18.

*Gambar 5.17 Query Update Tabel User*

*Gambar 5.18 Hasil Eksekusi Query Update Tabel User*

Pemutakhiran rekaman data pada tabel tb_user diimplementasikan melalui perintah UPDATE untuk memodifikasi informasi pengguna yang sudah tersimpan sebelumnya. Tindakan ini umumnya dijalankan oleh administrator apabila terdapat perubahan status kepegawaian, seperti promosi peran dari teknisi menjadi manajer, atau saat dilakukan penyesuaian kredensial akun. Berdasarkan kueri yang dieksekusi, sistem melakukan perubahan pada atribut peran berdasarkan filter identitas yang unik dan mengonfirmasi pembaruan satu baris data secara presisi. Dampak dari perubahan tersebut secara otomatis memengaruhi hak akses serta otoritas navigasi pengguna di dalam modul sistem sesuai dengan peran baru yang telah ditetapkan. Eksekusi query disajikan pada Gambar 5.19 dan hasil eksekusinya pada Gambar 5.20.

*Gambar 5.19 Query Update Tabel User*

*Gambar 5.20 Hasil Eksekusi Query Update Tabel User*

Eksekusi penghapusan baris data pada tabel tb_user dilakukan menggunakan perintah DELETE untuk mengeliminasi akun pengguna yang sudah tidak aktif atau tidak lagi memiliki otoritas akses. Operasi ini biasanya dijalankan oleh administrator sistem ketika terjadi perubahan status kepegawaian atau penghapusan akun yang sudah tidak relevan di dalam lingkungan PT Smart Home Inovasi. Dengan terhapusnya data tersebut berdasarkan kriteria identitas yang spesifik, seluruh hak akses pengguna bersangkutan ke dalam sistem manajemen proyek akan terhenti secara permanen. Langkah ini menjamin keamanan serta efisiensi penyimpanan informasi dengan memastikan hanya data personel aktif yang tersimpan di dalam basis data. Eksekusi query disajikan pada Gambar 5.21 dan hasil eksekusinya pada Gambar 5.22.

*Gambar 5.21 Query Delete Tabel User*

*Gambar 5.22 Hasil Eksekusi Query Delete Tabel User*

Tabel Klien

Penyimpanan entitas baru pada tabel tb_klien diimplementasikan melalui perintah INSERT guna mencatat profil pelanggan yang akan melakukan kerja sama proyek. Operasi ini dieksekusi oleh pengguna dengan peran manajer atau administrator saat memasukkan informasi dasar seperti nama perusahaan, alamat, nomor telepon, dan surat elektronik ke dalam basis data. Pengisian kolom created_by berfungsi untuk memetakan tanggung jawab administratif atas pendataan relasi bisnis tersebut di lingkungan PT Smart Home Inovasi. Setelah baris data berhasil ditambahkan, sistem secara otomatis menerbitkan id_klien baru yang akan digunakan sebagai referensi utama dalam proses pembukaan proyek pada tahap selanjutnya. Eksekusi query disajikan pada Gambar 5.23 dan hasil eksekusinya pada Gambar 5.24.

*Gambar 5.23 Query Insert Tabel Klien*

*Gambar 5.24 Hasil Eksekusi Query Insert Tabel Klien*

Pengambilan informasi dari tabel tb_klien dijalankan dengan perintah SELECT untuk menyajikan daftar seluruh pelanggan yang dikelola oleh sistem. Operasi ini berlangsung saat pengguna perlu melakukan identifikasi klien dalam modul pendaftaran proyek atau ketika ingin melihat profil kontak pelanggan secara mendetail melalui antarmuka dasbor. Melalui penerapan kueri dengan filter pencarian dan batas tampilan, sistem dapat menyediakan data klien secara efisien serta terorganisir berdasarkan urutan identitasnya. Informasi yang dikembalikan oleh basis data ini berfungsi sebagai sumber utama dalam menyediakan daftar pilihan bagi pengguna saat melakukan pengisian formulir kerja sama yang baru. Eksekusi query disajikan pada Gambar 5.25 dan hasil eksekusinya pada Gambar 5.26.

*Gambar 5.25 Query Select Tabel Klien*

*Gambar 5.26 Hasil Eksekusi Query Select Tabel Klien*

Penyesuaian informasi pada tabel tb_klien dilakukan menggunakan perintah UPDATE untuk memastikan data profil pelanggan tetap relevan dan akurat di dalam sistem. Operasi ini umumnya dipicu oleh staf administrasi apabila terjadi perubahan alamat operasional atau nomor kontak darurat dari pihak klien yang bersangkutan. Dengan memperbarui baris data berdasarkan kriteria nama klien yang spesifik, integritas data dalam basis data dapat terjaga sehingga meminimalisir kesalahan komunikasi selama periode kerja sama berlangsung. Keberhasilan pembaruan ini menjamin bahwa seluruh dokumen proyek dan korespondensi selanjutnya akan menggunakan informasi terbaru yang telah tersimpan secara resmi. Eksekusi query disajikan pada Gambar 5.27 dan hasil eksekusinya pada Gambar 5.28.

*Gambar 5.27 Query Update Tabel Klien*

*Gambar 5.28 Hasil Eksekusi Query Update Tabel Klien*

Penghapusan rekaman pada tabel tb_klien diimplementasikan melalui perintah DELETE untuk membersihkan entitas pelanggan yang sudah tidak aktif atau bersifat duplikat. Tindakan ini dieksekusi oleh pengguna tingkat administrator dalam rangka pemeliharaan integritas basis data serta optimalisasi kapasitas penyimpanan informasi. Proses eliminasi satu baris data dilakukan dengan merujuk pada identitas unik klien untuk mencegah kesalahan penghapusan pada entitas yang masih memiliki relasi proyek. Dengan demikian, basis data PT Smart Home Inovasi hanya akan menyimpan data klien yang valid dan memiliki relevansi operasional terhadap kegiatan bisnis yang sedang berjalan. Eksekusi query disajikan pada Gambar 5.29 dan hasil eksekusinya pada Gambar 5.30.

*Gambar 5.29 Query Delete Tabel Klien*

*Gambar 5.30 Hasil Eksekusi Query Delete Tabel Klien*

Tabel Proyek

Pencatatan rincian proyek baru ke dalam tabel tb_proyek dieksekusi guna memulai siklus manajemen proyek di dalam sistem. Operasi ini dijalankan oleh manajer proyek saat menetapkan jadwal, kategori, serta nilai kontrak setelah terjadi kesepakatan dengan pihak klien yang dirujuk melalui id_klien. Melalui kueri ini, sistem mengalokasikan kode proyek yang unik dan mengatur fase awal proyek, baik survei maupun eksekusi, secara otomatis ke dalam basis data. Keberhasilan penyimpanan data proyek tersebut menjadi prasyarat mutlak agar modul penugasan teknisi dan pemantauan Early Warning System dapat berfungsi secara sinkron. Eksekusi query disajikan pada Gambar 5.31 dan hasil eksekusinya pada Gambar 5.32.

*Gambar 5.31 Query Insert Tabel Proyek*

*Gambar 5.32 Hasil Eksekusi Query Insert Tabel Proyek*

Identifikasi dan pemantauan data pada tabel tb_proyek dilakukan melalui perintah SELECT untuk menyajikan daftar proyek yang sedang berjalan di bawah pengelolaan PT Smart Home Inovasi. Operasi ini dieksekusi oleh manajer untuk mengawasi status dan fase setiap pekerjaan dengan melakukan penggabungan data antara identitas proyek serta nama pelanggan yang tersimpan pada tabel tb_klien. Melalui penerapan filter pada kolom status, sistem secara otomatis hanya menampilkan proyek dengan kategori aktif guna memastikan fokus pengawasan pada proyek yang membutuhkan perhatian segera. Data yang dikembalikan menjadi sumber informasi vital bagi antarmuka dasbor Early Warning System dalam memetakan kesehatan portofolio perusahaan berdasarkan urutan tanggal dimulainya proyek. Eksekusi query disajikan pada Gambar 5.33 dan hasil eksekusinya pada Gambar 5.34.

*Gambar 5.33 Query Select Tabel Proyek*

*Gambar 5.34 Hasil Eksekusi Query Select Tabel Proyek*

Modifikasi status dan siklus hidup pada tabel tb_proyek diimplementasikan melalui perintah UPDATE untuk merekam transisi kemajuan setiap pekerjaan yang ditangani. Fungsi ini dijalankan ketika sebuah proyek telah mencapai fase penyelesaian akhir atau jika terdapat penyesuaian tenggat waktu yang disepakati dengan pihak pelanggan. Melalui kueri ini, sistem melakukan pembaruan pada baris data proyek yang spesifik berdasarkan kode proyek yang unik sehingga seluruh catatan riwayat pekerjaan tetap konsisten. Hasil dari pembaruan tersebut secara otomatis akan memicu sistem untuk mengubah indikator kesehatan proyek pada modul pelaporan performa perusahaan. Eksekusi query disajikan pada Gambar 5.35 dan hasil eksekusinya pada Gambar 5.36.

*Gambar 5.35 Query Select Tabel Proyek*

*Gambar 5.36 Hasil Eksekusi Query Select Tabel Proyek*

Penghapusan entitas pada tabel tb_proyek dilakukan dengan perintah DELETE guna mengeliminasi data proyek yang bersifat uji coba atau yang dibatalkan sebelum masa pengerjaan dimulai. Operasi ini bersifat terbatas dan hanya dapat dieksekusi oleh administrator sistem untuk menjaga agar riwayat pengerjaan proyek di masa lalu tidak hilang secara tidak sengaja. Melalui identifikasi kode proyek yang presisi, sistem menghapus baris data yang ditargetkan sehingga integritas relasi antartabel tetap terjaga dari anomali data yatim (orphaned data). Dengan demikian, struktur penyimpanan basis data tetap bersih dan hanya menyajikan portofolio pekerjaan yang valid bagi kebutuhan audit perusahaan. Eksekusi query disajikan pada Gambar 5.37 dan hasil eksekusinya pada Gambar 5.38.

*Gambar 5.37 Query Delete Tabel Proyek*

*Gambar 5.38 Hasil Eksekusi Query Delete Tabel Proyek*

Tabel Penugasan Proyek

Pembentukan struktur tim pada tabel tb_penugasan_proyek diimplementasikan melalui perintah INSERT untuk menghubungkan personel teknis dengan proyek yang akan dikerjakan. Operasi ini dijalankan oleh manajer operasional guna memetakan ketersediaan sumber daya manusia terhadap kebutuhan instalasi atau perbaikan di lapangan melalui referensi id_proyek dan id_user. Dengan terdaftarnya baris data baru, sistem secara otomatis memberikan otorisasi kepada teknisi yang bersangkutan untuk mengakses detail pekerjaan serta modul pelaporan harian terkait. Langkah ini menjadi dasar bagi akuntabilitas kinerja setiap individu dalam memastikan target penyelesaian proyek tercapai sesuai dengan jadwal yang telah ditetapkan. Eksekusi query disajikan pada Gambar 5.39 dan hasil eksekusinya pada Gambar 5.40.

*Gambar 5.39 Query Insert Tabel Penugasan Proyek*

*Gambar 5.40 Hasil Eksekusi Query Insert Tabel Penugasan Proyek*

Penayangan komposisi tim kerja dari tabel tb_penugasan_proyek dilakukan dengan perintah SELECT untuk menampilkan seluruh personel yang bertanggung jawab pada suatu proyek tertentu. Proses ini mengeksekusi penggabungan data antara tabel proyek dan tabel pengguna sehingga sistem dapat menyajikan nama teknisi beserta waktu penugasannya secara transparan. Melalui filter berdasarkan id_proyek, manajer dapat dengan mudah melakukan verifikasi terhadap distribusi beban kerja tim untuk menghindari tumpang tindih penugasan di lapangan. Informasi yang dihasilkan oleh kueri ini menjadi komponen utama dalam antarmuka rincian proyek guna memfasilitasi koordinasi antarlini selama masa pengerjaan berlangsung. Eksekusi query disajikan pada Gambar 5.41 dan hasil eksekusinya pada Gambar 5.42.

*Gambar 5.41 Query Select Tabel Penugasan Proyek*

*Gambar 5.42 Hasil Eksekusi Query Select Tabel Penugasan Proyek*

Pembaruan data pada tabel tb_penugasan_proyek diimplementasikan melalui perintah UPDATE guna melakukan penyesuaian waktu penugasan personel yang telah terdaftar sebelumnya. Tindakan ini dijalankan apabila terdapat koreksi administratif atau penjadwalan ulang waktu keberangkatan teknisi ke lokasi proyek PT Smart Home Inovasi. Dengan mengeksekusi kueri pada kombinasi id_proyek dan id_user yang spesifik, sistem memastikan bahwa catatan keterlibatan setiap individu tetap akurat dan mutakhir. Hasil dari pembaruan ini sangat penting bagi manajer operasional dalam menghitung durasi pengerjaan aktual serta menilai efektivitas alokasi teknisi pada setiap penugasan. Eksekusi query disajikan pada Gambar 5.43 dan hasil eksekusinya pada Gambar 5.44.

*Gambar 5.43 Query Update Tabel Penugasan Proyek*

*Gambar 5.44 Query Update Tabel Penugasan Proyek*

## [5.2.n] Pembahasan Sistem

Pada subbab ini, implementasi antarmuka sistem merupakan tahap penerjemahan rancangan wireframe ke dalam bentuk visual fungsional yang menjadi titik interaksi utama antara pengguna dengan sistem manajemen proyek. Pada tahap ini, seluruh elemen desain mulai dari halaman autentikasi login, dashboard analitik manajerial yang memuat metrik Schedule Performance Index (SPI), modul pelaporan harian (daily report) teknisi, hingga manajemen eskalasi diwujudkan dengan mengutamakan konsistensi visual serta kemudahan navigasi guna mendukung efisiensi operasional

Halaman Autentikasi

Halaman Autentikasi merupakan titik masuk seluruh pengguna sebelum dapat mengakses fitur sistem. Halaman ini terdiri dari halaman pembuka publik dan halaman login yang memvalidasi kredensial.

Landing Page

Gambar 5.45 menampilkan implementasi antarmuka halaman beranda (landing page) yang bertindak sebagai gerbang akses utama aplikasi. Secara visual, rancangan antarmuka ini mengadopsi pendekatan desain minimalis dengan penerapan tema gelap (dark mode) yang profesional. Penggunaan aksen warna gradien diterapkan secara strategis pada elemen tipografi utama dan tombol aksi (Call to Action) "Sign In" guna menciptakan titik fokus visual (focal point) yang tegas bagi pengguna. Secara fungsional, halaman ini memfasilitasi tahap awal proses autentikasi. Interaksi pada tombol masuk tersebut akan menginisiasi alur validasi kredensial, yang selanjutnya akan mengarahkan pengguna secara otomatis menuju dashboard analitik Manajer atau halaman input operasional Teknisi berdasarkan konfigurasi Role-Based Access Control (RBAC) di dalam sistem.

Login Page

Gambar 5.46 mengilustrasikan implementasi antarmuka halaman autentikasi yang difungsikan sebagai gerbang keamanan utama sistem. Dirancang menggunakan pola tata letak split-screen, sisi kiri antarmuka menonjolkan identitas visual aplikasi beserta ringkasan kapabilitas komputasinya, sementara sisi kanan secara spesifik memfasilitasi modul masukan kredensial (surel dan kata sandi). Secara sistemik, halaman ini mengeksekusi proses verifikasi identitas pengguna untuk memastikan bahwa setiap sesi yang berhasil masuk akan langsung diarahkan ke ruang kerja yang relevan (seperti dashboard manajerial atau form teknisi), sesuai dengan parameter hak akses yang telah dikonfigurasi.

Halaman Manajer

Halaman-halaman ini ditujukan untuk manajer proyek dan administrator sistem. Menyediakan kapabilitas pengawasan penuh terhadap proyek, klien, anggaran, dan eskalasi

Dashboard Page

Gambar 5.47 merepresentasikan implementasi antarmuka halaman autentikasi (login). Tata letak halaman dirancang dengan pendekatan split-screen yang fungsional; panel sisi kiri menampilkan identitas sistem manajemen proyek beserta sorotan fitur analitiknya (seperti metrik SPI dan indikator EWS), sedangkan panel sisi kanan secara spesifik memuat formulir masukan kredensial pengguna (surel dan kata sandi). Halaman ini bertindak sebagai titik verifikasi keamanan awal yang akan memvalidasi data masukan dan memfilter rute akses pengguna ke dalam aplikasi sesuai dengan hak otorisasi (role) masing-masing.

Projects Page

Gambar 5.48 menampilkan implementasi halaman "Proyek" yang dikemas dalam bentuk tabel interaktif (data grid). Antarmuka ini mengonsolidasikan informasi profil proyek secara terpusat dan menyandingkannya dengan luaran kalkulasi metrik Schedule Performance Index (SPI) serta indikator kesehatan (Health). Kehadiran fitur pencarian adaptif, penyaringan kategori, dan pelabelan warna peringatan secara real-time ini dirancang secara khusus untuk mempermudah Manajer dalam mengevaluasi seluruh portofolio proyek, melacak progres operasional berbasis akumulasi pelaporan, serta merespons anomali jadwal dengan lebih terarah.

Project Detail Page

Gambar 5.49 merepresentasikan implementasi antarmuka Detail Proyek yang berfungsi untuk membedah performa operasional suatu proyek secara spesifik dan mendalam. Halaman ini menyajikan visualisasi komparatif antara target penjadwalan (Planned Value) dengan progres pengerjaan aktual (Earned Value) yang diakumulasikan dari data daily report lapangan. Selain menonjolkan hasil presisi dari metrik Schedule Performance Index (SPI) beserta status peringatannya (seperti indikator Critical), antarmuka ini juga memuat matriks beban kerja teknisi dan representasi status rincian tugas dalam format Kanban board. Melalui visualisasi terpusat ini, Manajer dapat melacak sumber anomali secara presisi—seperti tugas yang melewati tenggat atau membutuhkan lembur—untuk mendukung pengambilan keputusan teknis yang lebih cepat.

Project Timeline Page

Gambar 5.50 menampilkan implementasi antarmuka Project Timeline yang berfungsi untuk memvisualisasikan tata waktu penjadwalan proyek secara komprehensif. Antarmuka ini mengadopsi representasi grafis serupa Gantt chart yang secara langsung diintegrasikan dengan logika pemetaan Early Warning System (EWS). Rentang pengerjaan setiap proyek tidak hanya ditampilkan sebagai batas waktu konvensional, melainkan divisualisasikan melalui balok warna peringatan (hijau, kuning, atau merah) yang secara dinamis merender kalkulasi nilai Schedule Performance Index (SPI) terkini. Dilengkapi dengan garis penanda waktu aktual (Today) dan detail ringkasan penyelesaian tugas di dalam grafik, halaman ini memungkinkan Manajer untuk mengawasi rasio perbandingan antara target jadwal dengan realisasi progres secara spasial dan intuitif.

Clients Page

Gambar 5.51 merepresentasikan implementasi antarmuka halaman pengelola data Klien (Client Management). Halaman ini difungsikan sebagai direktori administratif terpusat (master data) untuk mengakomodasi entitas pelanggan yang terhubung dengan portofolio proyek. Disajikan dalam format data grid yang interaktif, antarmuka ini mengonsolidasikan profil esensial seperti nama instansi, informasi kontak, dan alamat geografis, serta secara otomatis menampilkan agregasi jumlah proyek yang terasosiasi dengan masing-masing klien. Keberadaan modul fungsional ini sangat krusial untuk menjaga integritas relasional sistem, sehingga memfasilitasi Manajer dalam mengidentifikasi pemangku kepentingan (stakeholder) dari setiap proyek yang dipantau serta mempermudah koordinasi atau eskalasi terkait laporan operasional lapangan.

Client Detail Page

Gambar 5.52 merepresentasikan implementasi antarmuka Detail Klien yang menyajikan profil komprehensif dari suatu entitas pelanggan secara spesifik. Halaman ini tidak hanya menampilkan informasi administratif dasar seperti kontak dan catatan, tetapi juga mengintegrasikan visualisasi spasial berupa pemetaan lokasi interaktif berdasarkan titik koordinat geografis. Secara fungsional, antarmuka ini menyediakan panel relasional di bagian bawah yang memuat daftar portofolio proyek milik klien yang bersangkutan, lengkap dengan indikator metrik Schedule Performance Index (SPI) dan status kesehatan operasionalnya. Integrasi data spasial dan metrik analitik ini secara efektif memfasilitasi pengguna manajerial dalam melakukan tinjauan kontekstual antara lokasi fisik klien dengan performa lapangan dari setiap proyek yang sedang berjalan.

*Gambar 5.52 Clients Detail Page*

Reports Page

Gambar 5.53 menampilkan implementasi antarmuka halaman Laporan (Reports) yang difungsikan sebagai modul agregasi dan rekapitulasi data operasional secara komprehensif. Antarmuka ini menyajikan ringkasan keseluruhan portofolio proyek dalam format tabular, mengintegrasikan parameter administratif dengan hasil kalkulasi metrik Schedule Performance Index (SPI) dan indikator peringatan dini (Health). Selain memfasilitasi pembaruan status pengerjaan secara cepat melalui fitur inline dropdown, halaman ini juga dilengkapi dengan instrumen ekstraksi data ke dalam format cetak (PDF) maupun spreadsheet (Excel). Keberadaan modul pelaporan ini sangat esensial untuk mengakomodasi kebutuhan Manajer dalam mendokumentasikan performa riil proyek dan menyusun laporan pertanggungjawaban berdasarkan akumulasi data lapangan secara efisien.

Schedule Page

Gambar 5.54 menampilkan implementasi antarmuka Jadwal Proyek yang difungsikan sebagai instrumen pengawasan operasional pada tingkat rincian pekerjaan (task-level). Dirancang dengan tata letak akordeon interaktif (expand/collapse), halaman ini menyajikan dekomposisi setiap proyek secara hierarkis, lengkap dengan representasi persentase capaian penyelesaian tugas melalui elemen progress bar dan pelabelan indikator peringatan dini (Red, Amber, Green). Adanya instrumen penyaringan data (filtering) yang komprehensif—seperti berdasarkan kategori pengerjaan, status tugas, hingga alokasi Teknisi penanggung jawab—memungkinkan Manajer untuk melacak distribusi beban kerja secara presisi dan memvalidasi kepatuhan tenggat waktu dari setiap unit pekerjaan yang dilaporkan dari lapangan.

Escalations Page

Gambar 5.55 merepresentasikan implementasi antarmuka Manajemen Eskalasi yang berfungsi sebagai modul pelacakan isu (issue tracking) untuk menindaklanjuti kendala operasional teknis dari lapangan. Halaman ini secara terstruktur menyajikan rekapitulasi laporan anomali pengerjaan yang diklasifikasikan berdasarkan status penyelesaian (Open, In Review, Resolved) serta tingkat prioritas penanganannya (Critical, High, Medium). Dalam arsitektur sistem pemantauan ini, antarmuka eskalasi bertindak sebagai pelengkap data kualitatif bagi metrik kuantitatif SPI; memberikan visibilitas langsung kepada Manajer terhadap akar masalah yang dilaporkan melalui daily report Teknisi. Hal ini memungkinkan proses mitigasi dan intervensi manajerial dieksekusi secara responsif guna mencegah dampak keterlambatan penjadwalan proyek yang lebih fatal.

Technician Management Page

Gambar 5.56 menampilkan implementasi antarmuka Technician Management yang berfungsi sebagai modul administratif terpusat untuk mengelola data sumber daya manusia operasional lapangan. Halaman ini disajikan dalam format data grid yang secara komprehensif mengekstraksi dan merangkum beban kerja setiap Teknisi, meliputi total keterlibatan proyek, rasio penyelesaian tugas, jumlah pekerjaan aktif, hingga indikator penundaan (Overdue). Selain menyediakan fungsi pengelolaan akun dasar (seperti penambahan, pembaruan, dan penghapusan akses), antarmuka ini berperan krusial dalam ekosistem pelaporan sistem. Melalui pemantauan akumulasi rekam waktu pengerjaan (Time Logged) dan kuantitas lampiran bukti (Evidence), Manajer dapat mengevaluasi produktivitas individu secara transparan guna memastikan kedisiplinan input daily report, yang menjadi bahan baku utama dalam komputasi metrik SPI.

Settings Page

Gambar 5.57 merepresentasikan implementasi antarmuka Pengaturan (Settings) yang difungsikan sebagai modul personalisasi pengalaman pengguna (User Experience). Halaman ini mengakomodasi fungsionalitas adaptasi sistem terhadap preferensi individual pengguna melalui dua parameter konfigurasi utama: lokalisasi bahasa (bilingual: Bahasa Indonesia dan Bahasa Inggris) serta penyesuaian tema antarmuka (Light atau Dark mode). Meskipun bersifat utilitas pendukung di luar fungsi analitik utama, keberadaan fitur ini berperan penting dalam meningkatkan ergonomi perangkat lunak dan aksesibilitas operasional, sehingga pengguna dapat berinteraksi dengan dashboard pemantauan secara lebih nyaman dan optimal sesuai dengan kondisi lingkungan kerja visual mereka.

Profile Page

Gambar 5.58 menampilkan antarmuka Profil dan Pengaturan yang berfungsi sebagai halaman pengelolaan akun. Melalui antarmuka ini, pengguna dapat memperbarui data identitas dasar, seperti nama dan email, serta mengubah kata sandi untuk menjaga keamanan akun. Fitur ini dirancang agar hak akses pengguna tetap aman dan seluruh riwayat aktivitasnya di dalam sistem dapat dipertanggungjawabkan dengan baik.

Halaman Teknisi

Halaman-halaman teknisi dirancang untuk pemakaian di lapangan, memprioritaskan kecepatan input data tugas, unggah bukti, dan pelaporan kendala melalui eskalasi.

Technician Dashboard

Gambar 5.59 menampilkan antarmuka Dashboard khusus untuk pengguna dengan hak akses Teknisi. Berbeda dengan dashboard manajerial yang berfokus pada seluruh proyek, halaman ini dirancang khusus untuk merangkum beban kerja operasional individu. Antarmuka ini menyajikan metrik visual mengenai status penyelesaian tugas harian, alokasi waktu pengerjaan, serta eskalasi isu yang sedang ditangani. Fitur ini membantu Teknisi memantau produktivitas pribadinya agar lebih terorganisasi, sekaligus mempermudah mereka dalam menyusun pelaporan harian (daily report) yang menjadi sumber data utama bagi sistem.

*Gambar 5.59 Technician Dashboard*

Technician Projects Page

Gambar 5.60 menampilkan implementasi antarmuka "Proyek Saya" yang diakses melalui otorisasi tingkat Teknisi. Halaman ini mengadopsi tata letak berbasis kartu (card-based UI) untuk menyaring dan menampilkan entitas proyek secara spesifik berdasarkan penugasan individu. Setiap kartu menyajikan konteks operasional lapangan secara ringkas, seperti detail klien dan lokasi pengerjaan, serta dilengkapi dengan progress bar yang mengukur persentase penyelesaian tugas khusus teknisi tersebut. Fungsionalitas pemilahan data ini dirancang secara ergonomis untuk meminimalisasi distraksi informasi, sehingga Teknisi dapat berfokus penuh pada penyelesaian porsi kerja spesifik mereka di setiap proyek.

Technician Tasks Page

Gambar 5.61 merepresentasikan implementasi antarmuka "Tugas Saya" yang dirancang khusus untuk memfasilitasi alur kerja operasional Teknisi. Mengadopsi visualisasi berbasis Kanban board, halaman ini secara dinamis mengkategorikan rincian penugasan individu berdasarkan status progres aktual (mulai dari Belum Mulai, Dalam Proses, hingga Selesai atau Lembur). Antarmuka ini bertindak sebagai titik interaksi (data entry) paling krusial dalam ekosistem pelaporan sistem; setiap pembaruan status pengerjaan yang diinputkan oleh Teknisi pada panel ini akan langsung direkam sebagai daily report elektronik. Data masukan primer inilah yang kemudian diakumulasikan secara real-time oleh backend sistem menjadi Earned Value guna mengkalkulasi metrik analitik Schedule Performance Index (SPI) pada dashboard manajerial.

*Gambar 5.61 Technician Tasks Page*

Technician Escalations Page

Gambar 5.62 menampilkan implementasi antarmuka "Eskalasi Saya" yang diakses secara khusus melalui hak otorisasi Teknisi. Halaman ini berfungsi sebagai saluran komunikasi interaktif (feedback loop) yang memfasilitasi Teknisi untuk mendokumentasikan kendala teknis atau anomali pengerjaan di lapangan secara real-time. Melalui modul ini, Teknisi tidak hanya dapat menginputkan laporan permasalahan baru, tetapi juga memantau riwayat serta status tindak lanjut (Terbuka, Direview, Selesai) dari isu yang telah mereka eskalasikan ke pihak manajemen. Sebagai pendamping data daily report, ketersediaan fitur ini sangat krusial untuk memberikan justifikasi kualitatif atas potensi deviasi atau keterlambatan jadwal pengerjaan, sehingga koordinasi operasional dari lapangan ke tingkat manajerial menjadi lebih transparan.

## [5.2.n] Pengujian

## [5.n] Inovasi Sistem

## [JUDUL BAB] BAB VI
PENUTUP

Simpulan

Saran

## [JUDUL BAB] DAFTAR PUSTAKA

## [JUDUL BAB] LAMPIRAN

## [JUDUL BAB] LOGBOOK TUGAS AKHIR



## === TABEL-TABEL ===


### Tabel #0

| Nama & Gelar | Jabatan | Tanda Tangan | Tanggal |

| ………………………………………. / NIK. | Ketua Penguji | ………………………. | …………….… |

| ……………………………………… / NIK. | Penguji I | ………………………. | …………….… |

| Adityo Permana Wibowo, S.Kom., M.Cs. / NIK. 110116079 | Penguji II / (Dosen Pembimbing) | ………………………. | …………….… |


### Tabel #1

| No | Judul | Penulis | Tahun | Hasil |

| 1 | Perancangan Dashboard Monitoring dan Controlling Kinerja Proyek pada PT. XYZ Menggunakan Metode Agile and Lean Development | Rifan Azkia, Yusuf Nugroho Doyo Yekti, Dino Caesaron | 2024 | Menghasilkan dashboard dengan fitur Project Overview, Financial Tracking, Timeline, Milestone, Logistic, Performance, dan Risk. Hasil validasi menunjukkan dashboard relevan dengan tingkat kepuasan pengguna 86%. |

| 2 | Pemanfaatan Management Dashboard dalam Pengambilan Keputusan Strategis pada Perusahaan Bisnis Konstruksi (Studi Kasus PT. XYZ) | Ernawan | 2024 | Dashboard manajemen membantu eksekutif memantau KPI secara real-time, meningkatkan akurasi data, memfasilitasi komunikasi antar departemen, serta memberikan dampak positif pada biaya, mutu, dan waktu. |

| 3 | Reporting on the Development of a Web-Based Prototype Dashboard for Construction Design Managers | Barry Gledson, Kay Rogage, Anna Thompson, Hazel Ponton | 2024 | Mengembangkan purwarupa dashboard berbasis web untuk manajer desain konstruksi dengan fokus pada pemantauan koordinasi desain, prioritas tugas, dan pelacakan kinerja desainer melalui analisis data TQ dan RFI. |

| 4 | Pengembangan Fitur Dashboard dan Report pada Aplikasi Project Management PT Intelix untuk Optimalisasi Pemantauan Proyek | Afif Lukmanul Hakim, Hendra Pradibta | 2025 | Menambahkan fitur High Priority Project, Milestone Project, dan Implementation Project pada menu Dashboard serta sub-menu pada menu Report. Pengujian Black Box dan UAT menunjukkan seluruh fungsi berjalan baik dengan respons "sangat sesuai". |

| 5 | Rancang Bangun Sistem Monitoring Manajemen Proyek Konstruksi Menggunakan Kurva-S | Cindia Rama Auliansyah, Joseph Dedy Irawan, Fransiscus Xaverius Ariwibisono | 2023 | Membangun sistem monitoring berbasis website dengan metode Kurva-S yang dapat membuat RAB, schedule rencana, laporan mingguan, dan rekapitulasi laporan dengan output Gantt Chart dan Kurva-S. Sistem berhasil menghitung deviasi keterlambatan proyek. |

| 6 | Sistem Manajemen Proyek pada Startup Jasa Pembuatan Aplikasi | Muhammad Iqbal, Emilia Emilia, Zahra Ramadhani, Dempi Ariska, Sri Rahayu, Serly Oktarina | 2024 | Mengembangkan sistem manajemen proyek berbasis web dengan metode Waterfall yang memfasilitasi kerja tim, manajemen tugas, pelaporan real-time, dan pelacakan kemajuan proyek. Pengujian Black Box menunjukkan sistem beroperasi dengan stabilitas baik. |

| 7 | Reinventing Formulas for Construction Project Delay Index Due to Management and Production | Putri Lynna A. Luthan, Nathanael Sitanggang, Syafriandi Syafriandi | 2023 | Membangun formula indeks keterlambatan proyek konstruksi dari aspek manajemen dan produksi yang diintegrasikan ke dalam dashboard Ms. Project. Formula mampu menyajikan informasi nilai kontrak, progres aktual, progres rencana, deviasi progres, penyebab keterlambatan, serta indeks keterlambatan manajemen dan produksi. |


### Tabel #2

|  | [1] |


### Tabel #3

| Simbol | Nama | Keterangan |

|  | Aktor | Mewakili peran orang atau pengguna, sistem yang lain dan alat ketika berkomunikasi dengan use case |

|  | Use case | Abstraksi dan interaksi sistem dan aktor |

|  | Association | Abstraksi dari penghubung antara aktor dan use case |

|  | Generalisasi | Menunjukan spealisasi aktor untuk dapat berpartisipasi dengan use case |

| <<include>> | Include | Menunjukan bahwa suatu use case seluruhnya merupakan fungsional dari use case lain |

| <<extend>> | Extend | Menunjukan bahwa suatu use case merupakan tambahan fungsionalitas dari use case lainnya jika suatu kondisi terpenuhi |


### Tabel #4

| Simbol | Nama | Keterangan |

|  | Aktor | Menggambarkan orang yang sedang berinteraksi dengan sistem. |

|  | Entity Class | Menggambarkan hubungan yang akan dilakukan. |

|  | Boundary Class | Menggambarkan sebuah gambaran dari form |

|  | Control Class | Mengambarkan penghubung antara boundary dengan tabel |

|  | A focus of control & A life line | Mengambarkan tempat mulai dan berakhirnya message |

|  | A message | Menggambarkan pengiriman pesan |


### Tabel #5

| Simbol | Nama | Keterangan |

|  | Generalization | Hubungan dimana objek anak berbagi perilaku dan struktur data dari objek yang ada di atasnya objek induk |

|  | Nary Association | Upaya untuk menghidari asosiasi dengan lebih dari 2 objek |

|  | Class | Himpunan dari objek-objek yang berbagi atribut serta operasi yang sama |

|  | Collaboration | Deskripsi dari urutan aksi-aksi yang menghasilkan suatu hasil yang terukur bagi suatu aktor |

|  | Realization | Operasi yang benar-benar  dilakukan oleh suatu objek |

|  | Dependency | Hubungan dimana perubahan yang terjadi pada suatu elemen mandiri akan mempengaruhi elemen yang bergantung padanya elemen yang tidak mandiri |

|  | Association | Apa yang menghubungkan antara objek satu dengan objek lainnya |


### Tabel #6

| Simbol | Nama | Keterangan |

|  | Start point | Diletakkan pada pojok kiri atas penanda awal aktivitas |

|  | End point | Akhir aktivitas |

|  | Activities | Menggambar kan suatu proses atau kegiatan bisnis |

|  | Fork/percabangan | Digunakan untuk menunjukan kegiatan yang dilakukan secara pararel atau untuk mengabungkan dua kegiatan yang pararel menjadi satu |

|  | Join/penggabungan | Digunakan untuk menunjukan adanya dekomposisi |


### Tabel #7

| No. | Simbol | Keterangan |

| 1. |  | Entitas, yaitu representasi objek data diskrit yang memiliki identitas unik di dalam sistem. |

| 2. |  | Relasi, yaitu keterkaitan hubungan yang mengikat antar-entitas dalam basis data. Relasi ini dapat diklasifikasikan ke dalam pemetaan one-to-one (satu ke satu), one-to-many (satu ke banyak), atau many-to-many (banyak ke banyak). |

| 3. |  | Atribut, yaitu properti atau karakteristik spesifik yang menjabarkan informasi mendetail dari sebuah entitas maupun relasi. |

| 4. |  | Garis, merupakan penghubung visual yang merangkai entitas dengan atributnya, serta menyambungkan himpunan entitas dengan relasinya. |

| 5. |  | Input/output, yaitu indikator visual yang merepresentasikan alur keluar-masuknya data, parameter operasional, maupun informasi di dalam sistem. |


### Tabel #8

| No. | Fungsi | Deskripsi |

| 1. | login | Memvalidasi kredensial berupa email dan kata sandi untuk memberikan akses masuk ke dalam sistem. |

| 2. | hasRole | Memeriksa dan memastikan hak akses atau peran pengguna dalam sistem. |


### Tabel #9

| No. | Fungsi | Deskripsi |

| 1. | create | Menambahkan dan menyimpan data profil klien baru ke dalam basis data. |

| 2. | update | Memperbarui informasi klien yang telah terdaftar dalam sistem. |

| 3. | delete | Menghapus data klien dari sistem. |


### Tabel #10

| No. | Fungsi | Deskripsi |

| 1. | create | Membuat dan merekam data proyek baru ke dalam sistem. |

| 2. | approveSurvey | Mengubah status fase proyek setelah proses survei lapangan disetujui. |

| 3. | calculateSPI | Melakukan perhitungan nilai Schedule Performance Index (SPI) pada proyek. |

| 4. | assignTechnician | Mengalokasikan teknisi ke dalam operasional proyek. |

| 5. | getHealth | Mengambil informasi status kesehatan proyek dari kelas ProjectHealth. |


### Tabel #11

| No. | Fungsi | Deskripsi |

| 1. | assign | Menetapkan relasi penugasan pengguna ke dalam suatu proyek. |

| 2. | unassign | Menghapus relasi penugasan pengguna dari proyek. |

| 3. | getByProject | Mengambil daftar pengguna atau teknisi yang ditugaskan pada proyek tertentu. |


### Tabel #12

| No. | Fungsi | Deskripsi |

| 1. | recalculate | Menghitung ulang metrik Schedule Performance Index (SPI) proyek secara otomatis berdasarkan pembaruan data daily report terbaru. |

| 2. | getStatus | Mengonversi hasil perhitungan metrik menjadi indikator status peringatan, seperti hijau, kuning, atau merah. |

| 3. | computePlannedValue | Menghitung nilai progres rencana berdasarkan jadwal proyek. |

| 4. | sortByUrgency | Mengurutkan prioritas tampilan proyek pada dashboard berdasarkan tingkat urgensi. |

| 5. | computeEarnedValue | Menghitung nilai progres aktual berdasarkan tugas yang telah selesai. |


### Tabel #13

| No. | Fungsi | Deskripsi |

| 1. | create | Membuat rincian tugas baru dalam suatu proyek. |

| 2. | changeStatus | Memperbarui status pengerjaan tugas, seperti to_do, working_on, atau done. |

| 3. | markDone | Menandai bahwa tugas telah selesai secara permanen. |

| 4. | isOvertime | Mengevaluasi apakah durasi pengerjaan melebihi estimasi waktu yang ditentukan. |

| 5. | isOverDeadline | Mengidentifikasi tugas yang melewati batas waktu penyelesaian (due date). |


### Tabel #14

| No. | Fungsi | Deskripsi |

| 1. | upload | Menyimpan berkas gambar atau dokumen bukti pekerjaan ke dalam sistem. |

| 2. | download | Mengambil berkas bukti pekerjaan untuk ditinjau atau diunduh. |

| 3. | delete | Menghapus berkas bukti pekerjaan dari sistem penyimpanan. |


### Tabel #15

| No. | Fungsi | Deskripsi |

| 1. | create | Mencatat laporan eskalasi atau kendala baru yang dikirimkan oleh teknisi. |

| 2. | resolve | Memperbarui status kendala menjadi selesai atau telah ditangani. |

| 3. | sendInstruction | Mengirimkan instruksi atau solusi dari manajer kepada teknisi pelapor. |


### Tabel #16

| No | Nama Field | Tipe Data | Panjang Karakter | Constraint |

| 1 | id_user | BIGINT | 20 | PK |

| 2 | name | VARCHAR | 255 |  |

| 3 | email | VARCHAR | 255 | Unique |

| 4 | password_hash | VARCHAR | 255 |  |

| 5 | role | ENUM | 'technician','manager','admin' |  |

| 6 | is_active | TINYINT | 1 | Default: 1 |

| 7 | created_at | TIMESTAMP | - |  |


### Tabel #17

| No | Nama Field | Tipe Data | Panjang Karakter | Constraint |

| 1 | id_klien | BIGINT | 20 | PK |

| 2 | nama_klien | VARCHAR | 255 |  |

| 3 | alamat | VARCHAR | 255 |  |

| 4 | no_telp | VARCHAR | 20 |  |

| 5 | email | VARCHAR | 255 |  |

| 6 | created_at | TIMESTAMP | - |  |


### Tabel #18

| No | Nama Field | Tipe Data | Panjang Karakter | Constraint |

| 1 | id_proyek | BIGINT | 20 | PK |

| 2 | nama_proyek | VARCHAR | 255 |  |

| 3 | id_klien | BIGINT | 20 | FK |

| 4 | start_date | DATE | - |  |

| 5 | end_date | DATE | - |  |

| 6 | status | ENUM | 'active','completed','on-hold' | Default: active |

| 7 | phase | ENUM | 'survey','execution' | Default: survey |

| 8 | project_value | DECIMAL | 15,2 |  |

| 9 | survey_approved | TINYINT | 1 | Default: 0 |

| 10 | created_by | BIGINT | 20 | FK |

| 11 | created_at | TIMESTAMP | - |  |


### Tabel #19

| No | Nama Field | Tipe Data | Panjang Karakter | Constraint |

| 1 | id_proyek | BIGINT | 20 | PK, FK |

| 2 | id_user | BIGINT | 20 | PK, FK |

| 3 | assigned_at | TIMESTAMP | - |  |


### Tabel #20

| No | Nama Field | Tipe Data | Panjang Karakter | Constraint |

| 1 | id_tugas | BIGINT | 20 | PK |

| 2 | id_proyek | BIGINT | 20 | FK |

| 3 | nama_tugas | VARCHAR | 255 |  |

| 4 | assigned_to | BIGINT | 20 | FK |

| 5 | status | ENUM | 'to_do','working_on_it','done' | Default: to_do |

| 6 | due_date | DATE | - |  |

| 7 | sort_order | INT | 11 |  |

| 8 | created_by | BIGINT | 20 | FK |

| 9 | created_at | TIMESTAMP | - |  |

| 10 | updated_at | TIMESTAMP | - |  |


### Tabel #21

| No | Nama Field | Tipe Data | Panjang Karakter | Constraint |

| 1 | id_bukti | BIGINT | 20 | PK |

| 2 | id_tugas | BIGINT | 20 | FK |

| 3 | file_path | VARCHAR | 500 |  |

| 4 | file_name | VARCHAR | 255 |  |

| 5 | file_type | ENUM | 'image','document','video' |  |

| 6 | file_size | INT | 11 |  |

| 7 | uploaded_by | BIGINT | 20 | FK |

| 8 | uploaded_at | TIMESTAMP | - |  |


### Tabel #22

| No | Nama Field | Tipe Data | Panjang Karakter | Constraint |

| 1 | id_eskalasi | BIGINT | 20 | PK |

| 2 | id_proyek | BIGINT | 20 | FK |

| 3 | id_tugas | BIGINT | 20 | FK |

| 4 | reported_by | BIGINT | 20 | FK |

| 5 | title | VARCHAR | 255 |  |

| 6 | description | TEXT | - |  |

| 7 | priority | ENUM | 'low','medium','high' | Default: medium |

| 8 | status | ENUM | 'open','handled','closed' | Default: open |

| 9 | created_at | TIMESTAMP | - |  |


### Tabel #23

| No. | Kebutuhan | Uraian Aspek | Uraian Aspek | Uraian Aspek | Uraian Aspek |

| No. | Kebutuhan | Jumlah | Satuan | Harga | Subtotal |

| Anggaran Pengembangan Sistem | Anggaran Pengembangan Sistem | Anggaran Pengembangan Sistem | Anggaran Pengembangan Sistem | Anggaran Pengembangan Sistem | Anggaran Pengembangan Sistem |

| 1 | Analis Sistem | 1 | 3 Bulan | Rp 1.500.000,00 | Rp 4.500.000,00 |

| 2 | Web Developer (Framework Next.js) | 1 | 3 Bulan | Rp 8.000.000,00 | Rp 8.000.000,00 |

| Anggaran Perangkat Keras (Hardware) | Anggaran Perangkat Keras (Hardware) | Anggaran Perangkat Keras (Hardware) | Anggaran Perangkat Keras (Hardware) | Anggaran Perangkat Keras (Hardware) | Anggaran Perangkat Keras (Hardware) |

| 1 | Komputer Personal/Laptop | 1 | Unit | Rp 12.000.000,00 | Rp 12.000.000,00 |

| Anggaran Perangkat Lunak (Software) dan Infrastruktur | Anggaran Perangkat Lunak (Software) dan Infrastruktur | Anggaran Perangkat Lunak (Software) dan Infrastruktur | Anggaran Perangkat Lunak (Software) dan Infrastruktur | Anggaran Perangkat Lunak (Software) dan Infrastruktur | Anggaran Perangkat Lunak (Software) dan Infrastruktur |

| 1 | Internet Provider | 1 | 3 Bulan | Rp 350.000,00 | Rp 1.050.000,00 |

| 2 | Hosting dan Domain | 1 | 1 Tahun | Rp 550.000,00 | Rp 450.000,00 |

| Total | Total | Total | Total | Total | Rp 26.100.000,00 |


### Tabel #24

|  |


### Tabel #25

|  |


### Tabel #26

|  |


### Tabel #27

|  |


### Tabel #28

|  |


### Tabel #29

|  |
