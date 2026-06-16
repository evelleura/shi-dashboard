# BAB I PENDAHULUAN

_Pages 14-17 of Naskah TA Final 4.pdf_


<!-- page 14 -->

 
 
 
1 
 
BAB I 
PENDAHULUAN 
 
1.1 Latar Belakang 
PT Smart Home Inovasi Yogyakarta (PT SHI) yang berlokasi di Kabupaten 
Sleman, Daerah Istimewa Yogyakarta, merupakan perusahaan teknologi yang 
mengkhususkan layanannya pada inovasi dan pengembangan sistem Smart Home serta 
Internet of Things (IoT). PT SHI menghadirkan inovasi perangkat otomasi—mulai dari 
sistem keamanan, pengaturan suhu, hingga efisiensi energi—guna menciptakan 
ekosistem hunian cerdas yang aman, nyaman, dan hemat energi. Secara operasional, 
proses bisnis perusahaan dimulai dari penerimaan pesanan klien, dilanjutkan dengan 
survei lokasi, perencanaan desain sistem, pelaksanaan instalasi perangkat, integrasi 
antar-komponen, hingga pengujian dan serah terima proyek kepada pelanggan. Untuk 
menunjang kegiatan operasional tersebut, PT SHI telah mengimplementasikan sebuah 
aplikasi manajemen proyek yang mencakup fungsi pengelolaan data proyek, 
penjadwalan, penugasan teknisi, serta pencatatan laporan harian sebagai acuan utama 
dalam memantau kemajuan fisik dan kondisi aktual proyek di lapangan. 
Meskipun aplikasi manajemen proyek memiliki fitur laporan harian, sistem 
hanya dapat diakses manajer sehingga teknisi harus melaporkan secara tidak langsung. 
Selain itu, tidak ada visualisasi dashboard untuk ringkasan kondisi seluruh proyek. 
Akibatnya, tanpa indikator risiko terukur, manajer sering mengabaikan proyek kritis 
dan deteksi masalah menjadi lambat. Hal ini berdampak pada penurunan efisiensi 
operasional dan kepuasan pelanggan. 
Berdasarkan permasalahan tersebut, penelitian ini menawarkan solusi berupa 
pengembangan fitur dashboard pada aplikasi manajemen proyek yang telah berjalan di 
PT SHI. Pengembangan ini mencakup dua aspek utama, yaitu pemberian akses sistem 
kepada teknisi untuk menginputkan data laporan harian secara langsung, serta  
pembuatan fitur dashboard dengan kemampuan sistem cerdas. Fitur dashboard usulan

<!-- page 15 -->

 
 
2 
 
 
dilengkapi otomasi kategorisasi status kesehatan proyek, di mana sistem mengalkulasi 
progres ideal berdasarkan proporsi waktu berjalan, lalu mengomparasikannya dengan 
realisasi aktual teknisi. Hasil perbandingan tersebut secara otomatis divisualisasikan 
dalam bentuk indikator kode warna pada tampilan dashboard, sehingga manajer dapat 
mengidentifikasi kondisi kesehatan setiap proyek secara sekilas. Pendekatan serupa 
telah dibuktikan efektivitasnya oleh Ernawan (2024) dalam penelitiannya pada 
perusahaan konstruksi, di mana implementasi dashboard manajemen mampu 
membantu eksekutif memantau indikator kinerja proyek secara real-time serta 
meningkatkan akurasi data untuk keperluan pemantauan. 
Melalui implementasi fitur dashboard ini, diharapkan alur pelaporan dari 
teknisi ke manajer menjadi lebih lancar karena teknisi dapat menginputkan data laporan 
harian secara langsung ke dalam sistem tanpa perantara. Dengan visualisasi status 
kesehatan proyek, manajer dapat melakukan deteksi dini terhadap kondisi 
keterlambatan secara sekilas tanpa harus memeriksa laporan satu per satu. Secara 
keseluruhan, pengembangan ini diharapkan dapat membantu PT SHI memantau 
jalannya proyek dengan lebih efisien serta meminimalisir risiko keterlambatan 
penyelesaian proyek. 
1.2 Rumusan Masalah 
Bagaimana mengembangkan fitur dashboard pada sistem manajemen proyek 
yang mampu memvisualisasikan indikator kesehatan proyek berdasarkan data laporan 
harian di PT SHI? 
1.3 Batasan Masalah 
1. Data yang diolah terbatas pada laporan proyek harian dan jadwal baseline proyek. 
2. Performa jadwal proyek diukur kemajuannya murni menggunakan perhitungan 
Schedule Performance Index (SPI), tanpa melibatkan machine learning atau AI. 
3. Sistem secara otomatis menentukan status proyek dan mengurutkan prioritas 
penanganannya di dashboard berdasarkan ambang batas nilai SPI. 
4. Output sistem berupa dashboard yang menampilkan ringkasan status proyek, 
perbandingan progres aktual dan rencana, nilai SPI, serta catatan kendala.

<!-- page 16 -->

 
 
3 
 
 
5. Hak akses sistem dibagi menjadi Manajer dan Teknisi. 
6. Sistem tidak mengelola entitas di luar laporan harian, seperti laporan keuangan, 
pengadaan material, atau manajemen sumber daya manusia. 
1.4 Tujuan Penelitian 
Mengembangkan fitur dashboard pada sistem manajemen proyek yang mampu 
mengolah data laporan harian secara otomatis menjadi indikator visual status kesehatan 
proyek di PT SHI. 
1.5 Manfaat Penelitian 
1. Meningkatkan objektivitas pengambilan keputusan di PT SHI, di mana manajer 
dapat menentukan prioritas penanganan proyek berdasarkan indikator visual yang 
terukur, bukan lagi berdasarkan intuisi atau penilaian subjektif. 
2. Mempercepat identifikasi proyek bermasalah di PT SHI, karena sistem secara 
otomatis menonjolkan proyek dengan status kritis ke urutan teratas dashboard. 
1.6 Sistematika Penulisan 
BAB  I  
PENDAHULUAN 
Bab ini menguraikan latar belakang masalah yang mendasari penelitian, 
rumusan masalah, batasan masalah yang menjadi lingkup pengembangan 
sistem, tujuan penelitian, manfaat penelitian bagi PT SHI, serta sistematika 
penulisan laporan. 
BAB II 
KAJIAN HASIL PENELITIAN DAN LANDASAN TEORI 
Bab ini memuat kajian hasil penelitian terdahulu yang relevan dengan topik 
pengembangan dashboard dan sistem manajemen proyek sebagai referensi 
perbandingan, serta landasan teori yang digunakan sebagai dasar dalam 
perancangan dan pengembangan sistem. 
BAB III 
METODE PENELITIAN 
Bab ini menjelaskan metode penelitian yang digunakan dalam proses 
pengembangan 
sistem, 
termasuk 
tahapan-tahapan 
pengembangan 
perangkat lunak yang diterapkan, serta gambaran obyek penelitian yaitu PT 
SHI.

<!-- page 17 -->

 
 
4 
 
 
BAB  IV  ANALISIS DAN PERANCANGAN 
Bab ini membahas analisis kebutuhan sistem serta perancangan sistem 
yang meliputi perancangan model proses, perancangan model data, 
perancangan fisik basis data, perancangan relasi antar tabel, dan 
perancangan antarmuka pengguna. 
BAB V  
IMPLEMENTASI DAN PEMBAHASAN SISTEM 
Bab ini menyajikan hasil implementasi sistem yang mencakup 
implementasi basis data dan implementasi antarmuka, dilanjutkan dengan 
pembahasan hasil sistem yang meliputi pembahasan basis data, 
pembahasan fungsionalitas sistem, pengujian sistem, serta inovasi sistem 
yang dikembangkan. 
BAB VI 
PENUTUP 
Bab ini berisi kesimpulan dari keseluruhan hasil penelitian yang menjawab 
rumusan masalah serta saran untuk pengembangan sistem di masa 
mendatang.