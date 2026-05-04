# 2.2 Landasan Teori

**Source:** Naskah TA 04-05-26.pdf, halaman 22-36
**Bab:** BAB II - KAJIAN HASIL PENELITIAN DAN LANDASAN TEORI
**Sections covered:**
- 2.2 Landasan Teori
- 2.2.1 Manajemen Proyek dan Sistem Monitoring
- 2.2.2 Dashboard Manajemen Proyek
- 2.2.3 Sistem Informasi Daily Report Proyek
- 2.2.4 Project Health Status
- 2.2.5 Early Warning System (EWS) Berbasis Schedule Performance Index
- 2.2.6 Framework Next.js
- 2.2.7 Unified Modeling Language
- 2.2.8 Entity Relationship Diagram
- 2.2.9 Basis Data
- 2.2.10 Structure Query Language

**Images (6):**
- `images/p25_img1.png`
- `images/p33_img1.png`
- `images/p33_img2.png`
- `images/p33_img3.png`
- `images/p33_img4.png`
- `images/p33_img5.png`

---


## 2.2 Landasan Teori (Page 22)

2.2 Landasan Teori
Dalam pengerjaan penelitian Tugas Akhir ini penulis menggunakan beberapa
landasan teori yang menjadi acuan diantaranya sebagai berikut:


## 2.2.1 Manajemen Proyek dan Sistem Monitoring (Page 22)

2.2.1 Manajemen Proyek dan Sistem Monitoring
Manajemen proyek merupakan disiplin ilmu yang mencakup proses
perencanaan, pelaksanaan, dan pengendalian untuk memastikan tujuan proyek tercapai
sesuai batasan waktu, biaya, dan ruang lingkup. Dalam proses pengendalian, manajer
memerlukan informasi akurat sebagai dasar evaluasi dan pengambilan keputusan.
Sistem monitoring berperan sebagai salah satu instrumen yang menyediakan informasi
tersebut melalui pelacakan data aktivitas lapangan (Chaerul dkk., 2021). Praktik
konvensional yang menggunakan alat tidak terintegrasi seperti spreadsheet terpisah
sering menghambat aliran informasi dan mempersulit proses pengendalian. Oleh
karena itu, penerapan project management system terpadu menjadi solusi untuk
mengintegrasikan seluruh proses manajemen proyek, mulai dari pencatatan data harian
hingga penyajian informasi bagi manajemen. Pengembangan fitur seperti dashboard

### Page 23 (cont.)

berbasis data daily report bertujuan untuk mendukung efektivitas pengelolaan proyek
secara menyeluruh, termasuk koordinasi tim, evaluasi kemajuan, dan pengambilan
keputusan strategis.


## 2.2.2 Dashboard Manajemen Proyek (Page 23)

2.2.2 Dashboard Manajemen Proyek
Dalam project management system, dashboard berfungsi sebagai antarmuka
pengguna grafis yang memvisualisasikan data operasional secara terpusat. Berbeda
dengan sistem analitik prediktif, dashboard memfasilitasi transparansi informasi
dengan mengubah rekapitulasi data daily report tekstual yang diinput oleh teknisi
lapangan menjadi representasi visual terstruktur, seperti grafik kemajuan fisik dan
indikator ketepatan waktu terhadap rencana awal atau baseline (Silmina & Azmi,
2025). Melalui transformasi visual ini, manajer proyek dapat memahami kondisi
portofolio proyek secara komprehensif, mengevaluasi kinerja operasional berdasarkan
fakta aktual, serta merumuskan keputusan tindak lanjut dengan jauh lebih efisien tanpa
harus membaca laporan secara manual (Reddy, 2025).


## 2.2.3 Sistem Informasi Daily Report Proyek (Page 23)

2.2.3 Sistem Informasi Daily Report Proyek
Sistem Informasi Daily Report Proyek merupakan sebuah modul esensial di
dalam ekosistem Sistem Manajemen Proyek (Project Management System) yang
berfungsi untuk merekam aktivitas operasional harian secara terstruktur. Dalam siklus
pelaksanaan proyek, pelaporan harian bertindak sebagai sumber data utama yang
mendokumentasikan rincian progres pekerjaan, alokasi waktu, status penyelesaian
tugas, serta kendala teknis di lapangan. Integrasi pelaporan harian ke dalam sistem
manajemen proyek bertujuan untuk melakukan sentralisasi data historis, memastikan
bahwa seluruh rekam jejak operasional dapat dilacak (traceable) secara aktual dan
terhindar dari risiko kehilangan atau ketidakkonsistenan data akibat pencatatan manual
(Alawiyah dkk. 2022).
Untuk memaksimalkan nilai dari himpunan data laporan harian tersebut,
diperlukan pengembangan fitur antarmuka visual berupa dashboard pemantauan
(monitoring). Fitur dashboard ini secara teknis akan mengekstrak, mengolah, dan
menerjemahkan data daily report yang mentah menjadi informasi visual yang

### Page 24 (cont.)

komprehensif, seperti grafik progres, metrik capaian, maupun rekapitulasi status
proyek. Dengan terintegrasinya data daily report ke dalam fitur dashboard berbasis
web, proses pengawasan administrasi dan evaluasi proyek oleh pihak manajemen
menjadi jauh lebih efisien, terpusat, dan dapat dipantau secara langsung (real-time)
berdasarkan data faktual dari lapangan.


## 2.2.4 Project Health Status (Page 24)

2.2.4 Project Health Status
Status kesehatan proyek (Project Health Status) merupakan indikator evaluatif
faktual yang membandingkan progres aktual di lapangan dengan rencana awal
(baseline). Alih-alih menggunakan analitik prediktif yang kompleks, indikator ini
berfungsi sebagai instrumen audit visual untuk mendeteksi penyimpangan jadwal
sedini mungkin. Pada implementasi dashboard, status kesehatan direpresentasikan
melalui metode Red-Amber-Green (RAG) yang secara otomatis mengagregasi data
mentah dari daily report. Melalui visualisasi warna yang intuitif ini—seperti indikator
"Hijau" untuk operasional yang linear dengan jadwal dan "Merah" untuk kondisi
kritis—pihak manajemen memperoleh transparansi informasi tingkat tinggi guna
memantau kelancaran proyek secara real-time tanpa harus menelusuri tumpukan
laporan manual (Fonseca dkk., 2025).


## 2.2.5 Early Warning System (EWS) Berbasis Schedule Performance Index (Page 24)

2.2.5 Early Warning System (EWS) Berbasis Schedule Performance Index
Dalam manajemen proyek operasional yang dinamis, Early Warning System
(EWS) atau Sistem Peringatan Dini merupakan mekanisme proaktif yang
diintegrasikan ke dalam perangkat lunak pemantauan untuk mendeteksi potensi
penyimpangan jadwal secara otomatis. Dalam ranah sistem informasi operasional,
EWS tidak dirancang menggunakan algoritma analitik prediktif yang kompleks,
melainkan mengandalkan kemampuan sistem dalam mengotomatisasi pemrosesan data
faktual secara real-time. Tujuan utama implementasi EWS adalah memangkas jeda
waktu (information lag) antara terjadinya kendala progres di lapangan dengan
sampainya peringatan tersebut kepada manajer proyek, sehingga mitigasi
keterlambatan dapat dilakukan sedini mungkin berdasarkan data yang valid.

### Page 25 (cont.)

Images: `images/p25_img1.png`

Sebagai parameter pemicu (trigger), EWS pada sistem ini mengadopsi metrik
Schedule Performance Index (SPI). SPI bertindak sebagai indikator matematis pasti
yang membandingkan persentase pekerjaan aktual yang telah dilaporkan selesai
(Earned Value) dengan persentase target rencana awal proyek (Planned Value). Di
dalam arsitektur sistem ini, sumber data aktual diekstraksi secara berkelanjutan dari
input daily report para pelaksana lapangan. Kecerdasan sistem (smart system
capability) bekerja di latar belakang dengan mengakumulasi data mentah dari laporan
harian tersebut dan secara otomatis mengkalkulasi rasio SPI tanpa memerlukan
intervensi manual dari pihak administrator.
Otomatisasi ini kemudian terintegrasi langsung dengan antarmuka dashboard
monitoring. Apabila hasil kalkulasi sistem menunjukkan nilai SPI < 1 (yang berarti
progres aktual tertinggal dari target rencana), EWS akan seketika memicu indikator
peringatan visual—seperti perubahan warna status menjadi merah atau flagging
kondisi "Kritis"—pada layar dashboard. Melalui pendekatan pengawasan proaktif ini,
sistem mentransformasikan tumpukan data rekapitulasi daily report menjadi wawasan
visual yang instan, membebaskan manajer proyek dari beban perhitungan manual, serta
memastikan bahwa evaluasi kinerja operasional dapat berjalan secara presisi, terpusat,
dan sangat responsif (Umana dkk., 2022).
Secara matematis, perhitungan metrik indikator kinerja jadwal dalam sistem ini
merujuk pada standar Earned Value Management (EVM). Rumus dasar komparasi
yang diotomatisasi oleh sistem adalah sebagai berikut:


Gambar 2.1 Schedule Performance Index (SPI)

### Page 26 (cont.)

Keterangan Variabel:
a. SPI (Schedule Performance Index) : Nilai indeks efisiensi waktu pelaksanaan
proyek.
b. EV (Earned Value / Nilai Hasil) : Persentase bobot pekerjaan aktual yang secara
faktual telah diselesaikan di lapangan. Dalam sistem ini, nilai EV
diakumulasikan secara otomatis dari progres tugas yang diinputkan oleh
pekerja melalui formulir daily report.
c. PV (Planned Value / Nilai Rencana) : Persentase bobot target pekerjaan yang
seharusnya telah diselesaikan pada titik waktu pemantauan tertentu berdasarkan
jadwal rencana awal (baseline).

Melalui hasil komparasi matematis tersebut, sistem dashboard dirancang untuk
menerjemahkan nilai numerik SPI menjadi status visibilitas proyek dengan parameter
sebagai berikut:
a. SPI = 1 : Proyek berjalan tepat waktu sesuai dengan target jadwal (On
Schedule). Indikator visual umumnya menampilkan status normal atau warna
hijau.
b. SPI > 1 : Proyek berjalan lebih cepat dari target jadwal yang direncanakan
(Ahead of Schedule).
c. SPI < 1 : Proyek mengalami keterlambatan operasional (Behind Schedule).
Kondisi matematis inilah yang bertindak sebagai pemicu utama (trigger) bagi
Early Warning System untuk secara otomatis menampilkan notifikasi kritis atau
merubah indikator visual dashboard menjadi peringatan warna merah.


## 2.2.6 Framework Next.js (Page 26)

2.2.6 Framework Next.js
Next.js merupakan kerangka kerja (framework) front-end berbasis React yang
dirancang untuk membangun antarmuka web berskala enterprise dengan performa
tinggi. Keunggulan utamanya terletak pada dukungan Server-Side Rendering (SSR)
dan arsitektur berbasis komponen (component-based), yang sangat ideal untuk
memvisualisasikan elemen dashboard secara modular, seperti grafik progres kerja dan

### Page 27 (cont.)

indikator warna Red-Amber-Green (RAG). Dalam implementasi Early Warning
System (EWS) pada manajemen proyek, Next.js berperan krusial melalui mekanisme
penarikan data asinkron. Framework ini mampu mengonsumsi akumulasi data daily
report dan hasil kalkulasi Schedule Performance Index (SPI) dari backend secara real-
time. Ketika terdeteksi perubahan status proyek menjadi kritis (misalnya SPI < 1),
antarmuka dashboard dapat merefleksikan peringatan visual tersebut secara instan
tanpa perlu memuat ulang (refresh) keseluruhan halaman, sehingga manajer proyek
dapat memperoleh informasi operasional yang faktual secara cepat dan interaktif
(Genne, 2025).


## 2.2.7 Unified Modeling Language (Page 27)

2.2.7 Unified Modeling Language
UML (Unified Modeling Language) adalah bahasa pemodelan standar yang
digunakan untuk memvisualisasikan, merancang, dan mendokumentasikan sistem
perangkat lunak yang berorientasi objek. UML sangat berguna dalam menggambarkan
kebutuhan pengguna dan alur sistem melalui berbagai diagram dan tabel data. UML
menggunakan konsep desain berorientasi objek dan tidak bergantung pada bahasa
pemrograman tertentu. Ini memungkinkan pemodelan sistem yang kompleks dan besar
dengan cara yang terstruktur (Maggi dkk., 2020). UML mencakup berbagai jenis
diagram yang dibagi menjadi diagram struktural dan diagram perilaku. Diagram kelas
adalah salah satu yang paling umum digunakan untuk memodelkan tampilan desain
statis dari system (Al-Fedaghi, 2021). Terdapat beberapa jenis diagram pada uml
diantaranya yaitu, Use Case Diagram, Sequence Diagram, Class Diagram, dan Activity
Diagram.
1) Use Case Diagram
Use case adalah abstraksi dari interaksi antara sistem dan aktor. Use case
bekerja dengan cara mendeskripsikan tipe interaksi antara user sebuah sistem dengan
sistemnya sendiri melalui sebuah cerita bagaimana sebuah sistem dipakai. Use case
merupakan konstruksi untuk mendeskripsikan bagaimana sistem akan terlihat di mata
user. Sedangkan use case diagram memfasilitasi komunikasi diantara analis dan
pengguna serta antara analis dan klien (Ahmad, 2022).

### Page 28 (cont.)

Tabel 2.2 Simbol Use Case Diagram

Sumber: (Suriya & Nivetha, 2023)
2) Sequence Diagram
Sequence diagram menunjukkan bagaimana sekelompok objek dapat
berkolaborasi dalam beberapa behavior atau kebiasaan. Sequence diagram
menggambarkan perilaku pada sebuah skenario. Kegunaan dari sequence diagram
Simbol
Nama
Keterangan

Aktor
Mewakili peran orang atau pengguna,
sistem yang lain dan alat ketika
berkomunikasi dengan use case

Use case
Abstraksi dan interaksi sistem dan
aktor

Association
Abstraksi dari penghubung antara aktor
dan use case

Generalisasi
Menunjukan spealisasi aktor untuk
dapat berpartisipasi dengan use case

<<include>>
Include
Menunjukan bahwa suatu use case
seluruhnya merupakan fungsional dari
use case lain

<<extend>>
Extend
Menunjukan bahwa suatu use case
merupakan tambahan fungsionalitas
dari use case lainnya jika suatu kondisi
terpenuhi

### Page 29 (cont.)

adalah menunjukkan serangkaian proses yang dikirim antara objek yang berinteraksi
dengan objek, sesuatu terjadi pada titik tertentu pada saat eksekusi sistem.

Tabel 2.3 Simbol Sequence Diagram




Sumber: (Suriya & Nivetha, 2023)


Simbol
Nama
Keterangan

Aktor
Menggambarkan orang yang
sedang berinteraksi dengan
sistem.

Entity Class
Menggambarkan hubungan yang
akan dilakukan.




Boundary Class
Menggambarkan sebuah
gambaran dari form

Control Class
Mengambarkan penghubung
antara boundary dengan tabel

A focus of control
& A life line
Mengambarkan tempat mulai
dan berakhirnya message

A message
Menggambarkan pengiriman
pesan

### Page 30 (cont.)

3) Class Diagram
Class adalah dekripsi kelompok obyek-obyek dengan properti, perilaku
(operasi) dan relasi yang sama. Sehingga dengan adanya class diagram dapat
memberikan pandangan global atas sebuah sistem. Hal tersebut tercermin dari class-
class yang ada dan relasinya satu dengan yang lainnya. Sebuah sistem biasanya
mempunyai beberapa class diagram. Class diagram sangat membantu dalam
visualisasi struktur kelas dari suatu sistem.
Tabel 2.4 Simbol Class Diagram
Simbol
Nama
Keterangan

Generalization
Hubungan dimana objek anak
berbagi perilaku dan struktur data
dari objek yang ada di atasnya
objek induk

Nary
Association
Upaya untuk menghidari asosiasi
dengan lebih dari 2 objek

Class
Himpunan dari objek-objek yang
berbagi atribut serta operasi yang
sama

Collaboration
Deskripsi dari urutan aksi-aksi
yang menghasilkan suatu hasil
yang terukur bagi suatu aktor

Realization
Operasi yang benar-benar
dilakukan oleh suatu objek

Dependency
Hubungan dimana perubahan yang
terjadi pada suatu elemen mandiri
akan mempengaruhi elemen yang

### Page 31 (cont.)

Simbol
Nama
Keterangan
bergantung padanya elemen yang
tidak mandiri

Association
Apa yang menghubungkan antara
objek satu dengan objek lainnya
Sumber: (Suriya & Nivetha, 2023)

4) Activity Diagram
Activity diagram merupakan gambaran dari rangkaian aliran dari aktivitas.
Tujuan dari activity diagram adalah mendeskripsikan aktivitas yang dibentuk dalam
suatu operasi sehingga dapat digunakan aktivitas lain.
Tabel 2.5 Simbol Activity Diagram
Simbol
Nama
Keterangan

Start point
Diletakkan pada pojok kiri atas
penanda awal aktivitas

End point
Akhir aktivitas

Activities
Menggambar kan suatu proses
atau kegiatan bisnis

### Page 32 (cont.)

Simbol
Nama
Keterangan

Fork/percabangan
Digunakan untuk menunjukan
kegiatan yang dilakukan secara
pararel atau untuk
mengabungkan dua kegiatan
yang pararel menjadi satu

Join/penggabungan
Digunakan untuk menunjukan
adanya dekomposisi
Sumber: (Khomokhoana dkk., 2025)


## 2.2.8 Entity Relationship Diagram (Page 32)

2.2.8 Entity Relationship Diagram
Entity Relationship Diagram (ERD) merupakan alat pemodelan konseptual
tahap awal untuk merepresentasikan entitas, atribut, dan hubungan dalam basis data
secara grafis. ERD bermanfaat untuk memvisualisasikan struktur data sebelum tahap
implementasi teknis dilakukan (Pulungan dkk., 2023), meminimalisir berbagai
kesalahan desain, serta menjadi alat komunikasi visual yang efektif antara pengembang
dan pemangku kepentingan. Secara struktural, komponen utama ERD terdiri dari
entitas (objek data unik), atribut yang mendeskripsikan properti entitas beserta kunci
primernya (’Afiifah dkk., 2022), dan hubungan yang menggambarkan interaksi antar
entitas dalam sistem.
Tabel 2.6 Entity Relationship Diagram
No.
Simbol
Keterangan

### Page 33 (cont.)

1.

Entitas, yaitu representasi objek data
diskrit yang memiliki identitas unik di
dalam sistem.
2.

Relasi, yaitu keterkaitan hubungan
yang mengikat antar-entitas dalam basis
data. Relasi ini dapat diklasifikasikan ke
dalam pemetaan one-to-one (satu ke
satu), one-to-many (satu ke banyak), atau
many-to-many (banyak ke banyak).
3.

Atribut, yaitu properti atau
karakteristik spesifik yang
menjabarkan informasi mendetail
dari sebuah entitas maupun relasi.
4.

Garis, merupakan penghubung visual
yang merangkai entitas dengan
atributnya, serta menyambungkan
himpunan entitas dengan relasinya.
5.

Input/output, yaitu indikator visual
yang merepresentasikan alur keluar-
masuknya data, parameter
operasional, maupun informasi di
dalam sistem.
Sumber: (Pulungan dkk., 2023)


## 2.2.9 Basis Data (Page 33)

Images: `images/p33_img1.png`, `images/p33_img2.png`, `images/p33_img3.png`, `images/p33_img4.png`, `images/p33_img5.png`

2.2.9 Basis Data
Data base atau basis data merupakan kumpulan data yang memiliki format dan
struktur-struktur tertentu sehingga memungkinkan sistem berbasis komputer dapat
melakukan penyimpanan, pengelolaan, dan pengambilan data secara cepat. Dalam
basis data juga terdapat sebuah sistem basis data, terdiri dari data secara logis saling
terkait dan biasanya disimpan dalam sebuah repositori data. Karena pada sistem basis
data penyimpanan data bersifat satu tempat, maka memungkinkan dalam saat
bersamaan beberapa pengguna mengakses dan memperbarui basis data tersebut.
Tempat untuk mengakses dan mengolah basis data ini dikenal sebagai DBMS (Basis

### Page 34 (cont.)

data Management System). Sebuah sistem basis data sendiri terdiri dari 5 komponen
yaitu: perangkat keras, perangkat lunak, data, prosedur, dan manusia (Hadiprakoso,
2021).
1) Perangkat Keras
DBMS membutuhkan hardware (perangkat keras) untuk dapat diinstal. Perangkat
keras dapat berupa sebuah komputer pribadi sampai jaringan komputer tergantung
pada kebutuhan organisasi dan DBMS yang digunakan. Beberapa DBMS hanya
berjalan pada perangkat keras atau sistem operasi tertentu, sementara yang lain
dapat dijalankan pada berbagai macam perangkat keras dan sistem operasi. Lebih
lanjut lagi perangkat keras di sini dapat mengacu pada semua perangkat fisik
sistem, termasuk komputer.
2) Perangkat Lunak
Dalam DBMS terdapat 3 jenis perangkat lunak yaitu sistem operasi, DBMS, dan
program aplikasi lainnya. Sistem operasi mengelola semua komponen perangkat
keras dan memungkinkan semua perangkat lunak lain untuk diinstal dan berjalan
di komputer, contoh perangkat lunak sistem operasi termasuk Microsoft, Linux,
dan Mac OS. Selanjutnya DBMS sebagai pengelola basis data seperti, Microsoft
SQL Server, Oracle, MySQL. Program aplikasi lainnya digunakan untuk
mengakses data yang terdapat didalam basis data untuk menghasilkan laporan dan
informasi lainnya.
3) Data
Komponen yang paling penting dari sistem basis data dari sudut pandang pengguna
adalah data. Data di sini meliputi pengumpulan fakta yang tersimpan dalam basis
data. Karena data adalah bahan baku dari mana informasi yang dihasilkan,
menentukan data yang masuk ke dalam basis data dan bagaimana mengatur data
menjadi informasi yang berharga merupakan bagian penting dari sebuah sistem
basis data.

### Page 35 (cont.)

4) Prosedur
Prosedur merupakan sebuah aturan yang mengatur desain dan penggunaan sistem
basis data.
5) Manusia
Komponen ini mencakup semua pengguna dari sistem basis data. Berdasarkan
fungsi pekerjaan utama masing-masing terdapat empat jenis pengguna yang dapat
diidentifikasi dalam sistem basis data yakni: administrator basis data, perancang
basis data, analis sistem, programmer, dan pengguna akhir.


## 2.2.10 Structure Query Language (Page 35)

2.2.10 Structure Query Language
Structured Query Language (SQL) merupakan bahasa pemrograman standar
yang dirancang secara spesifik untuk mengelola, memanipulasi, dan mengekstraksi
informasi dari Sistem Manajemen Basis Data Relasional (RDBMS). Secara fungsional,
SQL memfasilitasi interaksi tingkat tinggi antara aplikasi perangkat lunak dan
repositori data melalui eksekusi kueri (query) terstruktur. Instruksi dalam SQL
umumnya diklasifikasikan ke dalam beberapa kategori utama, di antaranya Data
Definition Language (DDL) untuk merancang skema atau struktur tabel, serta Data
Manipulation Language (DML) seperti perintah SELECT, INSERT, UPDATE, dan DELETE
yang bertugas memproses data operasional. Keunggulan utama SQL terletak pada
kemampuannya mengeksekusi fungsi agregasi komputasional, memfilter informasi
spesifik, serta mengonsolidasikan entitas dari berbagai tabel yang saling berelasi
melalui operasi JOIN, sehingga memungkinkan pengambilan maupun pengolahan data
berskala besar secara cepat, akurat, dan terpusat di tingkat database (Khan dkk., 2023).

### Page 36 (cont.)

BAB III
METODE PENELITIAN
