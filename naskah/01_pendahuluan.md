# BAB I - Pendahuluan

**Source:** Naskah TA 04-05-26.pdf, halaman 11-15
**Bab:** BAB I - PENDAHULUAN
**Sections covered:**
- 1.1 Latar Belakang
- 1.2 Rumusan Masalah
- 1.3 Batasan Masalah
- 1.4 Tujuan Penelitian
- 1.5 Manfaat Penelitian
- 1.6 Sistematika Penulisan

---


## (carry-over, Page 11)

BAB I
PENDAHULUAN


## 1.1 Latar Belakang (Page 11)

1.1 Latar Belakang
PT Smart Home Inovasi Yogyakarta (SHI), yang berlokasi di Kabupaten
Sleman, Daerah Istimewa Yogyakarta, merupakan perusahaan teknologi yang
mengkhususkan diri pada pengembangan solusi Smart Home dan Internet of Things
(IoT). Mengusung visi sebagai penyedia solusi hunian cerdas terdepan, SHI
menghadirkan inovasi perangkat otomasi—mulai dari sistem keamanan, pengaturan
suhu, hingga efisiensi energi—guna menciptakan ekosistem hunian yang aman,
nyaman, dan hemat energi. Secara operasional, proses bisnis perusahaan dimulai dari
penerimaan pesanan klien, dilanjutkan dengan survei lokasi, perencanaan desain
sistem, pelaksanaan instalasi perangkat, integrasi antar-komponen, hingga pengujian
dan serah terima proyek kepada pelanggan. Untuk menunjang kegiatan operasional
tersebut, SHI telah mengimplementasikan sebuah aplikasi manajemen proyek yang
mencakup fungsi pengelolaan data proyek, penjadwalan, penugasan teknisi, serta
pencatatan laporan harian (daily report) sebagai acuan utama dalam memantau
kemajuan fisik dan kondisi aktual proyek di lapangan.
Meskipun aplikasi manajemen proyek memiliki fitur daily report, sistem hanya
dapat diakses manajer sehingga teknisi lapangan harus melaporkan secara tidak
langsung. Selain itu, tidak ada visualisasi dashboard untuk ringkasan kondisi seluruh
proyek. Akibatnya, tanpa indikator risiko terukur, manajer sering mengabaikan proyek
kritis dan deteksi masalah menjadi lambat (reactive). Hal ini berdampak pada
penurunan efisiensi operasional dan kepuasan pelanggan.
Berdasarkan permasalahan tersebut, penelitian ini menawarkan solusi berupa
pengembangan fitur dashboard pada aplikasi manajemen proyek yang telah berjalan di
PT SHI. Pengembangan ini mencakup dua aspek utama, yaitu pemberian akses sistem
kepada teknisi lapangan untuk menginputkan data daily report secara langsung, serta
pembuatan fitur dashboard dengan kemampuan smart system.  Fitur dashboard yang

### Page 12 (cont.)

dikembangkan memiliki kemampuan otomasi berupa kategorisasi status kesehatan
proyek (Project Health Status) yang bekerja dengan cara sistem secara otomatis
menghitung persentase progres ideal berdasarkan posisi hari berjalan terhadap total
durasi proyek, kemudian membandingkannya dengan persentase realisasi aktual yang
diinputkan oleh teknisi. Hasil perbandingan tersebut secara otomatis divisualisasikan
dalam bentuk indikator kode warna pada tampilan dashboard, sehingga manajer dapat
mengidentifikasi kondisi kesehatan setiap proyek secara sekilas. Pendekatan serupa
telah dibuktikan efektivitasnya oleh Ernawan (2024) dalam penelitiannya pada
perusahaan konstruksi, di mana implementasi dashboard manajemen mampu
membantu eksekutif memantau indikator kinerja proyek secara real-time serta
meningkatkan akurasi data untuk keperluan pemantauan.
Melalui implementasi fitur dashboard ini, diharapkan alur pelaporan dari
teknisi lapangan ke manajer menjadi lebih lancar karena teknisi dapat menginputkan
data daily report secara langsung ke dalam sistem tanpa perantara. Dengan visualisasi
status kesehatan proyek, manajer dapat melakukan deteksi dini terhadap kondisi
keterlambatan secara sekilas tanpa harus memeriksa laporan satu per satu. Secara
keseluruhan, pengembangan ini diharapkan dapat membantu PT SHI memantau
jalannya proyek dengan lebih efisien serta meminimalisir risiko keterlambatan
penyelesaian proyek.


## 1.2 Rumusan Masalah (Page 12)

1.2 Rumusan Masalah
Bagaimana merancang fitur dashboard yang mampu mengolah data daily
report menjadi visualisasi status proyek yang mudah dipahami guna membantu
manajer proyek dalam menentukan prioritas penanganan masalah secara objektif di PT
Smart Home Inovasi Yogyakarta?


## 1.3 Batasan Masalah (Page 12)

1.3 Batasan Masalah
1. Data yang diolah dalam sistem terbatas pada data daily report yang mencakup nama
proyek, tanggal laporan, persentase progres harian, dan catatan kendala, serta data
baseline jadwal proyek (tanggal mulai dan target selesai).

### Page 13 (cont.)

2. Sistem menghitung deviasi progres dengan membandingkan persentase realisasi
aktual dari daily report terhadap progres ideal berdasarkan baseline jadwal, tanpa
menggunakan metode prediksi berbasis machine learning atau kecerdasan buatan.
3. Sistem secara otomatis mengkategorikan status kesehatan proyek (Project Health
Status) ke dalam beberapa kategori berdasarkan nilai deviasi, serta mengurutkan
proyek berdasarkan tingkat urgensi pada tampilan dashboard.
4. Output sistem berupa fitur dashboard yang menampilkan ringkasan proyek aktif
dengan indikator kode warna (hijau, kuning, merah), serta detail progres aktual,
progres ideal, deviasi, dan catatan kendala terakhir.
5. Pengguna sistem terdiri dari Manajer Proyek sebagai pemantau dashboard dan
Teknisi Lapangan sebagai penginput data daily report.
6. Sistem tidak mencakup pengelolaan data di luar lingkup daily report, seperti data
keuangan, pengadaan material, atau manajemen sumber daya manusia.


## 1.4 Tujuan Penelitian (Page 13)

1.4 Tujuan Penelitian
Merancang dan mengembangkan fitur dashboard pada sistem project
management yang mampu mengolah data daily report secara otomatis menjadi
indikator visual status kesehatan proyek (Project Health Status) di PT SHI.


## 1.5 Manfaat Penelitian (Page 13)

1.5 Manfaat Penelitian
1. Meningkatkan objektivitas pengambilan keputusan di PT SHI, di mana manajer
proyek dapat menentukan prioritas penanganan proyek berdasarkan indikator
visual yang terukur, bukan lagi berdasarkan intuisi atau penilaian subjektif.
2. Mempercepat identifikasi proyek bermasalah di PT SHI, karena sistem secara
otomatis menonjolkan proyek dengan status kritis ke urutan teratas dashboard,
sehingga potensi keterlambatan fatal pada proyek instalasi dan integrasi sistem
Smart Home dapat dideteksi lebih dini dan ditangani secara preventif.


## 1.6 Sistematika Penulisan (Page 13)

1.6 Sistematika Penulisan
BAB  I
PENDAHULUAN
Bab ini menguraikan latar belakang masalah yang mendasari penelitian,
rumusan masalah, batasan masalah yang menjadi lingkup pengembangan

### Page 14 (cont.)

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
BAB  IV  ANALISIS DAN PERANCANGAN
Bab ini membahas analisis kebutuhan sistem serta perancangan sistem
yang meliputi perancangan model proses, perancangan model data,
perancangan fisik basis data, perancangan relasi antar tabel, dan
perancangan antarmuka pengguna (user interface).
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

### Page 15 (cont.)

BAB II
KAJIAN HASIL PENELITIAN DAN LANDASAN TEORI
