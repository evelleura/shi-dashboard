# 4.3.1.1 Use Case Diagram

**Source:** Naskah TA 04-05-26.pdf, halaman 47-49
**Bab:** BAB IV - ANALISIS DAN PERANCANGAN
**Sections covered:**
- 4.3 Perancangan Sistem
- 4.3.1 Perancangan Model Proses
- 4.3.1.1 Model Use Case Diagram

---


## 4.3 Perancangan Sistem (Page 47)

4.3 Perancangan Sistem
Tahap perancangan sistem disusun untuk memberikan gambaran menyeluruh
terkait model proses menggunakan Unified Modeling Language (UML), model data,
struktur fisik basis data, relasi antar tabel, hingga perancangan antarmuka visual yang
akan dikembangkan pada fitur dashboard pemantauan proyek ini. Proses perancangan
dilakukan untuk memastikan bahwa seluruh komponen, mulai dari alur penginputan
data daily report di lapangan hingga otomasi visualisasi Early Warning System (EWS),
dapat saling terintegrasi dengan baik. Hal ini bertujuan agar sistem yang dibangun
mampu beroperasi secara akurat dan memenuhi seluruh kebutuhan fungsional maupun
non-fungsional dari Manajer Proyek dan Teknisi Lapangan di PT Smart Home Inovasi
Yogyakarta. Perancangan sistem ini diuraikan secara lebih rinci ke dalam beberapa
sub-bagian berikut.


## 4.3.1 Perancangan Model Proses (Page 47)

4.3.1  Perancangan Model Proses
Perancangan model proses pada pengembangan sistem ini menggunakan
Unified Modeling Language (UML) untuk memvisualisasikan interaksi antara
pengguna (Teknisi Lapangan dan Manajer Proyek), sistem, dan basis data. Penggunaan
UML bertujuan memetakan alur transformasi data daily report menjadi indikator visual
pada dashboard secara terstruktur. Pendekatan ini dilakukan untuk meminimalisasi
potensi kesalahan implementasi, mempermudah pemahaman logika Early Warning
System (EWS), serta memastikan seluruh fungsionalitas terintegrasi secara efisien
sesuai dengan kebutuhan operasional di PT Smart Home Inovasi Yogyakarta.


## 4.3.1.1 Model Use Case Diagram (Page 47)

4.3.1.1 Model Use Case Diagram
Gambar 4.4 mengilustrasikan interaksi fungsional antara pengguna dengan
sistem Dashboard Daily Report berbasis web. Sistem ini melibatkan dua aktor utama
dengan wewenang yang berbeda, yaitu Teknisi dan Manajer Proyek. Sebagai syarat
keamanan dasar, kedua aktor tersebut diwajibkan untuk melakukan proses autentikasi
(Login) sebelum dapat mengakses menu apa pun di dalam sistem, yang
direpresentasikan melalui relasi <<include>>.

### Page 48 (cont.)

Aktor Teknisi berperan sebagai pelaksana tugas operasional di lapangan. Hak
akses yang dimiliki Teknisi difokuskan pada pembaruan data dan swamonitoring.
Melalui antarmuka sistem, Teknisi dapat melihat dashboard performa kerjanya,
mengecek detail proyek, serta melihat riwayat pekerjaan yang telah selesai. Fungsi
utama aktor ini adalah melakukan pengisian daily report untuk melaporkan progres
pekerjaan harian. Selain itu, Teknisi juga dapat menggunakan fitur eskalasi untuk
melaporkan kendala teknis yang terjadi di lokasi klien.
Di sisi lain, aktor Manajer Proyek bertindak sebagai pihak manajemen yang
melakukan pengawasan operasional. Manajer memiliki wewenang untuk melihat
dashboard ringkasan proyek secara keseluruhan dan menindaklanjuti laporan eskalasi
kendala dari Teknisi. Manajer juga bertugas meninjau laporan harian (daily report)
yang masuk; di mana saat melakukan peninjauan ini, Manajer memiliki opsi lanjutan
(relasi <<extend>>) untuk mengelola atau menyesuaikan ulang penugasan teknisi.
Dalam hal pengelolaan data, Manajer dapat mengelola data proyek dengan batasan
keamanan tertentu (relasi <<exclude>>), yaitu tidak diberikan wewenang untuk
menghapus data pelanggan.

### Page 49 (cont.)

Gambar 4.4 Diagram Use Case
