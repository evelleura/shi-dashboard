# 4.3.1.2 Activity Diagram (5 diagrams)

**Source:** Naskah TA 04-05-26.pdf, halaman 49-54
**Bab:** BAB IV - ANALISIS DAN PERANCANGAN
**Sections covered:**
- 4.3.1.2 Model Activity Diagram

**Images (6):**
- `images/p49_img1.png`
- `images/p50_img1.png`
- `images/p51_img1.png`
- `images/p52_img1.png`
- `images/p53_img1.png`
- `images/p54_img1.png`

---


## 4.3.1.2 Model Activity Diagram (Page 49)

Images: `images/p49_img1.png`

4.3.1.2 Model Activity Diagram
Subbab ini memaparkan Activity Diagram yang memvisualisasikan alur kerja
dinamis dan rangkaian aktivitas operasional dari sistem dashboard yang diusulkan.
Pemodelan ini berfungsi sebagai penjabaran langkah demi langkah dari Use Case
Diagram sebelumnya, guna memperjelas bagaimana setiap proses bisnis dieksekusi di
dalam sistem—mulai dari tahap autentikasi pengguna, pengisian laporan harian oleh
teknisi, hingga proses pengawasan dan validasi oleh manajer proyek—beserta titik-titik
pengambilan keputusan (decision node) yang terjadi di dalamnya.
1) Activity Diagram Autentikasi (Login dan Logout)
Gambar 4.5 mengilustrasikan proses autentikasi sistem, dimana proses dimulai
ketika pengguna memasukkan data kredensial pada form login. Sistem kemudian
melakukan validasi dengan mencocokkan data tersebut pada tabel tb_user di basis data.
Jika data sesuai, sistem akan memberikan akses kepada pengguna untuk masuk ke
dalam sistem. Namun, apabila data tidak valid, pengguna akan diminta untuk kembali

### Page 50 (cont.)

Images: `images/p50_img1.png`

mengisi ulang informasi yang benar. Setelah mendapatkan akses, pengguna dapat
menggunakan sistem hingga pada akhirnya mengirimkan permintaan logout sebagai
tanda keluar dari sesi penggunaan.
2) Activity Diagram Pelaporan Progres Harian, Validasi Tugas, & Kalkulasi SPI
(Review Gate)
Gambar 4.6 ini mengilustrasikan siklus penugasan, pelaporan, dan validasi
pekerjaan. Proses diawali oleh Manajer Proyek yang membuat data proyek berdasarkan
jadwal tertentu. Sistem kemudian secara otomatis memfilter dan menampilkan
rekomendasi teknisi yang tersedia pada jadwal tersebut untuk mencegah terjadinya
tumpang tindih (bentrok) penugasan. Setelah Manajer mengalokasikan teknisi dan
tugas, sistem akan mengirimkan notifikasi. Teknisi merespons penugasan melalui
papan kanban dengan menggeser status tugas menjadi "Working On It" dan
mengunggah foto bukti pekerjaan. Pelaporan ini menginisiasi fase validasi (Review
Gate), di mana Manajer meninjau bukti tersebut. Jika belum sesuai, Manajer
mengirimkan catatan revisi. Sebaliknya, jika valid, Manajer menyetujui tugas menjadi
"Done". Persetujuan ini memicu sistem untuk mengkalkulasi ulang indikator kinerja
Gambar 4.5 Activity Diagram Autentikasi

### Page 51 (cont.)

Images: `images/p51_img1.png`

(SPI) dan Health Status proyek, yang langsung memperbarui tampilan dashboard
Manajer maupun Teknisi secara real-time.

3) Activity Diagram Pengelolaan Proyek
Gambar 4.7 mengilustrasikan alur operasional pengelolaan data proyek dan
sistem alokasi penugasan cerdas (smart scheduling). Proses bisnis diawali oleh
Manajer yang mengakses menu penambahan proyek baru, kemudian menginputkan
Gambar 4.6 Activity Diagram Pelaporan Progres Harian

### Page 52 (cont.)

Images: `images/p52_img1.png`

detail informasi proyek beserta rentang waktu pengerjaannya. Berdasarkan input
jadwal tersebut, sistem secara otomatis meneruskan permintaan ke dalam database
untuk mengecek ketersediaan teknisi. Di dalam database, terjadi proses penyaringan
(filter) untuk menyeleksi teknisi yang jadwalnya sudah penuh agar tidak terjadi bentrok
penugasan. Database kemudian mengembalikan daftar teknisi yang berstatus tersedia
(available) untuk ditampilkan oleh sistem sebagai rekomendasi di layar Manajer.
Berbekal rekomendasi tersebut, Manajer dapat secara akurat memilih teknisi,
menyusun daftar tugas kerja, dan menyimpan proyek. Sistem kemudian memproses
penyimpanan akhir ke dalam database secara permanen. Sebagai penutup siklus
operasional, sistem menampilkan pesan sukses di layar Manajer dan secara bersamaan
mendistribusikan notifikasi penugasan baru kepada teknisi terkait, menandakan bahwa
proyek telah berhasil diintegrasikan ke dalam sistem.

Gambar 4.7 Activity Diagram Pengelolaan Proyek

### Page 53 (cont.)

Images: `images/p53_img1.png`

4) Activity Diagram Dashboard Early Warning System
Gambar 4.8 memvisualisasikan alur sistematis dalam proses pemantauan
Dashboard Early Warning System (EWS). Alur komputasi ini diinisiasi ketika Manajer
mengakses halaman utama dashboard, yang kemudian direspons oleh sistem dengan
meneruskan permintaan ekstraksi data ke database. Selanjutnya, database memproses
permintaan tersebut dan mengembalikan sekumpulan data metrik proyek secara
komprehensif, mencakup nilai Schedule Performance Index (SPI) beserta status tugas
masing-masing proyek. Berdasarkan data yang diterima, sistem melakukan
pemrosesan analitik lanjutan dengan memetakan status kesehatan proyek (Health
Status) ke dalam indikator warna EWS—yakni merah, kuning, atau hijau—yang
disesuaikan dengan parameter rentang nilai SPI. Kemudian sistem secara cerdas
mengurutkan daftar proyek berdasarkan tingkat urgensi, sehingga proyek dengan status
kritis (merah) secara otomatis ditempatkan pada urutan teratas. Alur ini berakhir ketika
antarmuka dashboard berhasil ditampilkan secara utuh, sehingga Manajer dapat
langsung mengevaluasi status kesehatan seluruh proyek.
Gambar 4.8 Activity Diagram Dashboard Early Warning System

### Page 54 (cont.)

Images: `images/p54_img1.png`

5) Activity Diagram Pengajuan & Penanganan Eskalasi
Gambar 4.9 menjelaskan alur komunikasi dua arah dalam proses pengajuan dan
penanganan eskalasi kendala. Proses diawali oleh Teknisi yang melaporkan detail
kendala lapangan melalui form eskalasi. Laporan ini kemudian diproses oleh sistem
untuk memunculkan indikator peringatan (flag merah) pada dashboard Manajer.
Selanjutnya, Manajer meninjau detail masalah tersebut dan mengirimkan instruksi
penanganan sebagai solusi. Tindakan ini memicu sistem untuk secara otomatis
memperbarui status tiket eskalasi menjadi "Ditangani" dan meneruskan instruksi
balasan tersebut kembali kepada Teknisi. Alur ini berakhir setelah Teknisi menerima
notifikasi instruksi dari Manajer dan melihat bahwa status penanganan kendala tersebut
telah selesai.


Gambar 4.9 Activity Diagram Pengajuan & Penanganan Eskalasi
