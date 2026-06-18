# BAB IV  ANALISIS DAN PERANCANGAN

_Pages 36-76 of Naskah TA Final.pdf_


<!-- page 36 -->

 
 
 
23 
 
 
BAB IV  
ANALISIS DAN PERANCANGAN 
 
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
4.1.1 Analisa Sistem yang Berjalan 
Berdasarkan flowchart pada Gambar 4.1, proses bisnis dimulai ketika manajer 
membuat data proyek pada ScriptSheet dan menugaskan teknisi ke lapangan. Setelah 
pekerjaan dilaksanakan, teknisi melaporkan progres proyek melalui WhatsApp. 
Selanjutnya, manajer memasukkan laporan tersebut secara manual ke dalam 
spreadsheet untuk melengkapi data proyek. Apabila data belum lengkap, manajer akan 
meminta tambahan informasi kepada teknisi. Setelah data dinyatakan lengkap, manajer 
melakukan analisis progres proyek dan perhitungan SPI secara manual untuk 
mengetahui kondisi proyek. Jika proyek terindikasi terlambat, manajer akan 
menghubungi teknisi melalui WhatsApp guna melakukan tindak lanjut. Apabila tidak 
terdapat keterlambatan, status proyek diperbarui pada ScriptSheet hingga proses 
selesai.

<!-- page 37 -->

 
 
 
24 
 
 
 
Gambar 4.1 Bagan Alur Sistem yang Berjalan

<!-- page 38 -->

 
 
 
25 
 
 
4.1.2 Analisa Sistem yang Diusulkan 
Pada sistem operasional yang berjalan sebelumnya, manajemen menghadapi 
keterbatasan visibilitas dalam melacak metrik performa masing-masing teknisi, serta 
proses evaluasi yang bergantung pada metode manual sehingga mengakibatkan deteksi 
kendala sering kali terlambat. Keterlambatan mitigasi ini sering menimbulkan efek 
domino yang mengganggu linimasa proyek selanjutnya dan berpotensi menurunkan 
kepercayaan pelanggan. Oleh karena itu, implementasi dashboard pemantauan 
diusulkan sebagai solusi strategis untuk mentransformasikan manajemen proyek 
menjadi lebih efektif. Sistem yang mengintegrasikan otomasi kalkulasi kinerja ini akan 
meningkatkan otomatisasi alur proses bisnis, meminimalisasi risiko human error 
dalam rekapitulasi, serta memastikan manajer dapat melakukan pengawasan dan 
evaluasi secara real-time demi menjaga mutu penyelesaian proyek. 
Untuk mewujudkan solusi tersebut, alur sistem usulan pada gambar 4.2 
dirancang secara terpusat yang dimulai dari proses validasi login untuk mendeteksi hak 
akses (role) pengguna. Setelah autentikasi berhasil, sistem akan mengarahkan 
pengguna ke ruang kerja spesifik; Admin diarahkan ke Dashboard Umum untuk 
mengelola data master pengguna dan keseluruhan data proyek, Manajer diarahkan ke 
Dashboard pemantauan untuk mengawasi visualisasi grafis operasional dan 
menindaklanjuti eskalasi, sedangkan Teknisi mengakses Dashboard Performa untuk 
melaporkan progres tugas harian yang dikunci otomatis secara real-time serta untuk 
melaporkan kendala lapangan. Seluruh aktivitas dari ketiga role ini kemudian didukung 
oleh fitur komentar global pada detail proyek untuk komunikasi terpadu, dan siklus 
proses bisnis ini akan berakhir ketika pengguna melakukan logout dari sistem.

<!-- page 39 -->

 
 
 
26 
 
 
 
Gambar 4.2 Bagan Alur Sistem yang Diusulkan

<!-- page 40 -->

 
 
 
27 
 
 
4.2 Analisa Kebutuhan 
Pada tahap ini, analisis dilakukan untuk mengidentifikasi kebutuhan spesifik 
dari PT SHI terkait pengembangan fitur dashboard pemantauan proyek berbasis data 
laporan harian. Kebutuhan sistem ini dibagi menjadi dua, yaitu analisa kebutuhan 
fungsional dan analisa kebutuhan non-fungsional. 
4.2.1 Analisa Kebutuhan User 
Berdasarkan desentralisasi wewenang pelaporan dan alur proses bisnis yang 
diusulkan pada PT SHI, terdapat dua kategori pengguna utama yang akan berinteraksi 
langsung dengan sistem pemantauan ini, yaitu Teknisi dan Manajer. Adapun rincian 
kebutuhan dari masing-masing aktor adalah sebagai berikut: 
1. Teknisi  
Teknisi berperan sebagai pelaksana operasional di lokasi klien, seperti melakukan 
instalasi perangkat IoT. Dalam sistem ini, teknisi bertindak sebagai sumber utama 
pencatatan data faktual. Kebutuhan Teknisi meliputi: 
a. Teknisi dapat melakukan input laporan harian mandiri.  
b. Teknisi dapat mengakses Self-Performance Dashboard.  
2. Manajer  
Manajer berfungsi sebagai pengawas pada tingkat manajerial yang bertanggung 
jawab atas kelancaran seluruh portofolio proyek perusahaan. Kebutuhan Manajer 
meliputi: 
a. Mengakses halaman dashboard utama yang memvisualisasikan ringkasan 
seluruh proyek aktif. 
b. Memantau metrik status kesehatan proyek yang direpresentasikan melalui 
indikator visual kode warna RAG. 
c. Melihat perbandingan terperinci antara progres ideal (PV) berdasarkan durasi 
proyek, dengan progres aktual (EV) hasil laporan harian.

<!-- page 41 -->

 
 
 
28 
 
 
d. Menerima peringatan dini melalui penonjolan urutan proyek berstatus kritis 
pada dashboard, sehingga dapat segera menentukan prioritas penanganan 
secara objektif. 
e. Hak akses Manajer dibatasi pada pemantauan dashboard dan evaluasi kinerja 
operasional, tanpa wewenang atau kebutuhan untuk mengelola data di luar 
lingkup laporan harian. 
4.2.2 Analisa Kebutuhan Fungsional 
Analisa kebutuhan fungsional mendefinisikan layanan, fitur, dan fungsi yang 
harus disediakan oleh sistem agar dapat berjalan sesuai dengan alur bisnis perusahaan. 
Kebutuhan fungsional pada sistem ini adalah sebagai berikut: 
1. Sistem Penginputan Data Laporan Harian 
Sistem harus memfasilitasi Teknisi untuk melakukan input data laporan harian 
secara langsung, yang mencakup rincian persentase progres pekerjaan harian (EV) 
dan catatan kendala di lapangan. 
2. Kalkulasi Matematis Otomatis 
Sistem secara otomatis mengakumulasi data laporan harian untuk menghitung 
metrik SPI dengan membandingkan progres aktual terhadap target rencana jadwal 
(PV) (Radman dkk., 2025). 
3. Pemicu EWS 
Sistem harus mampu mengkategorikan status kesehatan proyek secara otomatis ke 
dalam indikator kode warna RAG berdasarkan parameter perhitungan SPI. 
4. Visualisasi Dashboard Sentral 
Sistem menampilkan dashboard bagi Manajer yang merangkum proyek aktif, 
mengurutkan prioritas berdasarkan urgensi, serta menyajikan perbandingan progres 
ideal, aktual, dan nilai SPI secara visual. 
4.2.3 Analisa Kebutuhan Non Fungsional 
Analisa kebutuhan non-fungsional mendefinisikan batasan, standar performa, 
dan karakteristik operasional yang harus dimiliki oleh sistem. Kebutuhan non-
fungsional pada pengembangan sistem ini meliputi:

<!-- page 42 -->

 
 
 
29 
 
 
1. Kinerja: 
Fitur dashboard harus mampu merender visualisasi data agregasi dan perubahan 
status EWS secara asinkronus dan real-time.  
2. Keamanan dan Otorisasi:  
Sistem harus membedakan hak akses secara ketat RBAC. Teknisi hanya memiliki 
wewenang untuk memasukkan data laporan harian, sedangkan hak akses untuk 
memantau indikator dashboard secara menyeluruh dikhususkan bagi Manajer. 
3. Kegunaan:  
Antarmuka dashboard harus dirancang dengan pendekatan visual yang intuitif, 
sehingga Manajer dapat mengidentifikasi kondisi kesehatan suatu proyek secara 
sekilas tanpa membutuhkan proses analitik manual. 
4.3 Perancangan Sistem  
Tahap perancangan sistem disusun untuk memberikan gambaran menyeluruh 
terkait model proses menggunakan UML, model data, struktur fisik basis data, relasi 
antar tabel, hingga perancangan antarmuka visual yang akan dikembangkan pada fitur 
dashboard pemantauan proyek ini.  
4.3.1 Perancangan Model Proses 
Perancangan 
model 
proses 
sistem 
ini 
menggunakan 
UML 
guna 
memvisualisasikan interaksi antara pengguna, sistem, serta basis data. Pemodelan ini 
memetakan alur transformasi data laporan harian menjadi indikator visual pada 
dashboard guna meminimalkan kesalahan implementasi, memperjelas logika EWS, 
dan memastikan seluruh fungsionalitas terintegrasi sesuai kebutuhan operasional PT 
SHI. 
4.3.1.1 Model Use Case Diagram 
Gambar 4.3 menunjukkan diagram use case Dashboard Laporan Harian Proyek 
PT SHI yang melibatkan dua aktor, yaitu Teknisi dan Manajer. Teknisi memiliki hak 
akses untuk meninjau dashboard performa, melihat detail tugas dan proyek, mengisi 
laporan harian, serta mengajukan eskalasi atau kendala lapangan. Selain itu, Teknisi

<!-- page 43 -->

 
 
 
30 
 
 
dapat melihat riwayat proyek dan riwayat laporan harian melalui relasi extend pada 
fungsi terkait. Sementara itu, Manajer memiliki hak akses untuk meninjau dashboard 
proyek, mengelola data proyek, mengelola laporan harian, menindaklanjuti eskalasi, 
serta mengelola penugasan teknisi. Pada proses pengelolaan proyek, Manajer juga 
dapat melihat detail dan progres proyek melalui relasi extend. Diagram ini juga 
menunjukkan bahwa beberapa fungsi memerlukan proses autentikasi melalui use case 
Login dengan relasi include. Selain itu, terdapat batasan akses yang dimodelkan 
melalui relasi exclude, yaitu Manajer tidak memiliki kewenangan untuk menghapus 
data pelanggan. Dengan pembagian hak akses tersebut, sistem dapat mendukung proses 
monitoring proyek, pelaporan harian, serta pengelolaan tugas dan eskalasi secara 
terstruktur sesuai peran pengguna. 
 
 
Gambar 4.3 Diagram Use Case

<!-- page 44 -->

 
 
 
31 
 
 
4.3.1.2 Model Activity Diagram 
Subbab ini memaparkan Activity Diagram yang memvisualisasikan alur kerja 
dinamis dan rangkaian aktivitas operasional dari sistem dashboard yang diusulkan. 
Pemodelan ini berfungsi sebagai penjabaran langkah demi langkah dari Diagram Use 
Case sebelumnya, guna memperjelas bagaimana setiap proses bisnis dieksekusi di 
dalam sistem. 
1) Activity Diagram Autentikasi (Login dan Logout) 
Gambar 4.4 menunjukkan alur autentikasi pengguna pada sistem. Proses 
diawali dengan pengguna memasukkan email dan kata sandi pada halaman login. 
Selanjutnya, sistem melakukan validasi dengan mencocokkan data pengguna pada 
tabel tb_user di basis data. Jika data yang dimasukkan valid, sistem memberikan akses 
kepada pengguna untuk masuk ke dalam sistem. Sebaliknya, apabila validasi gagal, 
pengguna diminta untuk memasukkan kembali data login yang benar. Setelah selesai 
menggunakan sistem, pengguna dapat melakukan logout untuk mengakhiri sesi 
penggunaan.  
 
 
Gambar 4.4 Activity Diagram Autentikasi

<!-- page 45 -->

 
 
 
32 
 
 
2) Activity Diagram Pengelolaan Proyek 
Gambar 4.5 mendeskripsikan alur penambahan proyek baru oleh Manajer. 
Proses diinisiasi dengan menginputkan data serta rentang waktu proyek, yang memicu 
sistem untuk menampilkan daftar teknisi berdasarkan ketersediaannya pada basis data. 
Setelah Manajer menetapkan penugasan proyek dan rincian tugas sebagai penentu 
parameter dasar dalam mengevaluasi status kesehatan proyek, data tersebut disimpan 
ke dalam basis data. Alur ini berakhir saat sistem mendistribusikan notifikasi 
penugasan baru kepada Teknisi dan menampilkan pesan konfirmasi keberhasilan 
sebagai penanda bahwa entitas proyek telah terintegrasi utuh ke dalam sistem. 
3) Activity Diagram Pelaporan Progres Harian, Validasi Tugas, & Kalkulasi SPI 
(Review Gate) 
Gambar 4.6 ini mengilustrasikan siklus penugasan, pelaporan, dan validasi 
pekerjaan. Proses diawali oleh Manajer yang membuat data proyek berdasarkan jadwal 
Gambar 4.5 Activity Diagram Pengelolaan Proyek

<!-- page 46 -->

 
 
 
33 
 
 
tertentu. Sistem kemudian secara otomatis memfilter dan menampilkan rekomendasi 
teknisi yang tersedia pada jadwal tersebut. Setelah Manajer mengalokasikan teknisi 
dan tugas, sistem akan mengirimkan notifikasi. Teknisi merespons penugasan melalui 
papan kanban dengan mengubah status dan mengunggah foto bukti pekerjaan. 
Pelaporan ini menginisiasi fase validasi (Review Gate), di mana Manajer meninjau 
bukti tersebut. Jika belum sesuai, Manajer mengirimkan catatan revisi. Sebaliknya, jika 
valid, Manajer menyetujui tugas menjadi "Done". Persetujuan ini memicu sistem untuk 
mengkalkulasi ulang SPI dan status kesehatan proyek, yang langsung memperbarui 
tampilan dashboard Manajer maupun Teknisi secara real-time. 
Gambar 4.6 Activity Diagram Pelaporan Progres Harian, Validasi Tugas, & Kalkukasi 
SPI (Review Gate)

<!-- page 47 -->

 
 
 
34 
 
 
4) Activity Diagram Dashboard Early Warning System  
Gambar 4.7 memvisualisasikan alur sistematis dalam proses pemantauan EWS. 
Alur komputasi ini diinisiasi ketika Manajer mengakses halaman utama dashboard, 
yang kemudian direspons oleh sistem dengan meneruskan permintaan ekstraksi data ke 
basis data. Selanjutnya, basis data memproses permintaan tersebut dan mengembalikan 
sekumpulan data metrik proyek secara komprehensif, mencakup nilai SPI beserta status 
tugas masing-masing proyek. Berdasarkan data yang diterima, sistem melakukan 
pemrosesan analitik lanjutan dengan memetakan status kesehatan ke dalam indikator 
warna EWS disesuaikan dengan parameter rentang nilai SPI. Kemudian sistem secara 
cerdas mengurutkan daftar proyek berdasarkan tingkat urgensi, sehingga proyek 
dengan status kritis (merah) secara otomatis ditempatkan pada urutan teratas. Alur ini 
berakhir ketika antarmuka dashboard berhasil ditampilkan secara utuh, sehingga 
Manajer dapat langsung mengevaluasi status kesehatan seluruh proyek. 
 
Gambar 4.7 Activity Diagram Dashboard EWS

<!-- page 48 -->

 
 
 
35 
 
 
5) Activity Diagram Pengajuan & Penanganan Eskalasi 
Gambar 4.8 menjelaskan alur komunikasi dua arah dalam proses pengajuan dan 
penanganan eskalasi kendala. Proses diawali oleh Teknisi yang melaporkan detail 
kendala lapangan melalui form eskalasi. Laporan ini kemudian diproses oleh sistem 
untuk memunculkan indikator peringatan pada dashboard Manajer. Selanjutnya, 
Manajer meninjau detail masalah tersebut dan mengirimkan instruksi penanganan 
sebagai solusi. Tindakan ini memicu sistem untuk secara otomatis memperbarui status 
tiket eskalasi menjadi "Ditangani" dan meneruskan instruksi balasan tersebut kembali 
kepada Teknisi. Alur ini berakhir setelah Teknisi menerima notifikasi instruksi dari 
Manajer dan melihat bahwa status penanganan kendala tersebut telah selesai. 
Gambar 4.8 Activity Diagram Pengajuan & Penanganan Eskalasi

<!-- page 49 -->

 
 
 
36 
 
 
4.3.1.3 Model Sequence Diagram 
Sequence diagram adalah salah satu jenis diagram dalam UML yang digunakan 
untuk menggambarkan urutan interaksi antar objek dalam sistem berdasarkan waktu. 
Diagram ini berfokus pada urutan pesan yang dikirim antar objek untuk menjalankan 
suatu proses tertentu. 
1) Sequence Diagram Autentikasi (Login dan Logout) 
Gambar 4.9 memodelkan alur kronologis proses autentikasi pengguna pada 
sistem. Aktor pengguna menginisiasi interaksi dengan mengirimkan pesan sinkron 
berupa surel dan kata sandi ke antarmuka Formulir Masuk. Sistem kemudian 
meneruskan permintaan verifikasi kredensial ini ke objek basis data, yang akan 
mencari dan mengirimkan pesan balasan berisi data rekaman kembali ke antarmuka. 
Setelah itu, sistem mengeksekusi pemrosesan internal yang mencakup dua tahap 
krusial: memvalidasi kecocokan kredensial dan memeriksa atribut peran (role) untuk 
menerapkan hierarki hak akses RBAC. Sebagai akhir siklus, sistem merespons 
pengguna dengan menampilkan antarmuka dashboard utama yang disesuaikan secara 
dinamis berdasarkan perannya. 
 
Gambar 4.9 Sequence Diagram Autentikasi

<!-- page 50 -->

 
 
 
37 
 
 
2) Sequence Diagram Pengelolaan Proyek 
Gambar 4.10 memodelkan alur kronologis penambahan proyek baru beserta 
alokasi penugasannya. Aktor manajer menginisiasi siklus dengan mengirimkan pesan 
sinkron ke antarmuka Formulir Proyek berisi spesifikasi dan rentang waktu pengerjaan. 
Input jadwal ini memicu sistem untuk meneruskan permintaan ke objek basis data, 
yang mengeksekusi pemrosesan internal berupa kueri penyaringan guna mengeliminasi 
teknisi dengan jadwal berbenturan. Basis data kemudian mengirimkan pesan balasan 
berisi daftar teknisi yang tersedia sebagai rekomendasi. Selanjutnya, manajer 
menyusun penugasan dan mengeksekusi instruksi penyimpanan untuk direkam secara 
permanen. Siklus diakhiri dengan konfirmasi dari basis data ke antarmuka, yang 
langsung menampilkan pesan keberhasilan kepada manajer sekaligus memicu 
distribusi notifikasi penugasan. 
 
 
Gambar 4.10 Sequence Diagram Pengelolaan Proyek

<!-- page 51 -->

 
 
 
38 
 
 
3) Sequence Diagram Pelaporan Progres Harian, Validasi Tugas, & Kalkulasi 
SPI (Review Gate) 
Gambar 4.11 mendeskripsikan alur sistematis pelaporan progres harian dan 
validasi tugas. Siklus dimulai saat Teknisi memperbarui status tugas menjadi "Working 
On It" dan mengunggah foto bukti pengerjaan melalui antarmuka papan Kanban. 
Pembaruan data ini secara otomatis memicu pengiriman notifikasi peninjauan kepada 
Manajer. Setelah Manajer memvalidasi bukti dan mengotorisasi status tugas menjadi 
"Done", sistem langsung mencatat transisi tersebut ke basis data, yang sekaligus 
memicu komputasi ulang untuk memperbarui nilai SPI dan indikator kesehatan proyek. 
Siklus berakhir ketika metrik analitik terbaru ditampilkan pada dashboard Manajer, 
bersamaan dengan pengiriman notifikasi penyelesaian tugas kepada Teknisi. 
 
Gambar 4.11 Sequence Diagram Pelaporan Progres Harian, Validasi Tugas, & 
Kalkulasi SPI (Review Gate)

<!-- page 52 -->

 
 
 
39 
 
 
4) Sequence Diagram Dashboard Early Warning System 
Gambar 4.12 mengilustrasikan alur interaksi sistematis dalam memuat 
Dashboard EWS. Proses diinisiasi saat aktor Manajer mengakses halaman utama, yang 
secara otomatis memicu objek Dashboard untuk meminta ekstraksi data metrik kepada 
lapisan basis data (Data Proyek). Setelah Data Proyek selesai memproses kueri nilai 
SPI dan status tugas, himpunan data tersebut dikembalikan ke Dashboard. Selanjutnya, 
objek Dashboard melakukan dua tahapan pemrosesan algoritmik internal: memetakan 
status kesehatan proyek ke dalam indikator warna EWS secara dinamis, lalu 
mengurutkan daftar proyek tersebut berdasarkan tingkat urgensi. Alur komputasi ini 
ditutup dengan Dashboard merender antarmuka visual secara utuh yang menampilkan 
indikator peringatan dini kepada Manajer. 
 
5) Sequence Diagram Pengajuan & Penanganan Eskalasi 
Gambar 4.13 mengilustrasikan alur komunikasi sistematis dua arah dalam 
proses pelaporan dan penanganan eskalasi kendala operasional. Proses ini diinisiasi 
oleh aktor Teknisi yang mengirimkan rincian kendala lapangan melalui antarmuka 
Form Eskalasi, untuk kemudian direkam secara permanen oleh lapisan basis data (Data 
Eskalasi). Sistem secara proaktif mendistribusikan peringatan berupa indikator flag 
merah ke dashboard Manajer guna memicu atensi visual secara real-time. Sebagai 
Gambar 4.12 Sequence Diagram Dashboard Early Warning System

<!-- page 53 -->

 
 
 
40 
 
 
respons, Manajer meninjau tiket eskalasi tersebut dan memberikan instruksi 
penanganan sebagai solusi. Siklus komputasi ini ditutup dengan pembaruan status tiket 
menjadi "Ditangani" di basis data, yang secara otomatis memicu antarmuka sistem 
untuk meneruskan instruksi balasan dari Manajer beserta notifikasi penyelesaian 
kembali kepada Teknisi. 
 
Gambar 4.13 Sequence Diagram Pengajuan & Penanganan Eskalasi 
 
4.3.1.4 Model Class Diagram 
Class diagram merupakan salah satu instrumen pemodelan dalam UML yang 
berfungsi untuk mendeskripsikan struktur statis sebuah sistem dengan menjabarkan 
entitas kelas, atribut, metode, serta arsitektur relasi antarobjek di dalamnya. Diagram 
ini merepresentasikan implementasi kode program yang membangun logika komputasi 
pada sistem manajemen proyek. Mengingat sistem ini difokuskan pada pengembangan 
fitur dashboard analitik yang bersumber dari data laporan harian, maka arsitektur kelas-
kelas utama dirancang secara spesifik untuk mengakomodasi hierarki manajemen 
pengguna, pengelolaan entitas proyek, perekaman data pelaporan tugas harian dari 
lapangan, hingga pemrosesan logika metrik EWS. Class diagram dapat dilihat pada 
Gambar 4.14.

<!-- page 54 -->

 
 
 
41 
Gambar 4.14 Class Diagram

<!-- page 55 -->

 
 
 
42 
 
Sebagai penjabaran lebih lanjut dari rancangan Class Diagram yang telah 
diuraikan sebelumnya, berikut adalah pemaparan mengenai fungsi spesifik dari 
masing-masing kelas utama: 
1. Kelas User 
Kelas User (pengguna) berfungsi sebagai lapisan autentikasi dan otorisasi pada 
sistem. Kelas ini merepresentasikan entitas pengguna serta mengelola hak akses 
berdasarkan peran pengguna, seperti Manajer dan Teknisi. Deskripsi fungsi pada kelas 
User dapat dilihat pada Tabel 4.1. 
Tabel 4.1 Kelas User 
No. 
Fungsi 
Deskripsi 
1. 
login 
Memvalidasi kredensial berupa email dan kata sandi untuk 
memberikan akses masuk ke dalam sistem. 
2. 
hasRole Memeriksa dan memastikan hak akses atau peran pengguna dalam 
sistem. 
 
2. Kelas Klien 
Kelas Klien merepresentasikan entitas pelanggan atau instansi pemilik proyek. 
Kelas ini digunakan untuk mengelola data klien yang terdaftar dalam sistem. Deskripsi 
fungsi pada kelas Klien dapat dilihat pada Tabel 4.2. 
Tabel 4.2 Kelas Klien 
No. Fungsi 
Deskripsi 
1. 
create 
Menambahkan dan menyimpan data profil klien baru ke dalam 
basis data. 
2. 
update 
Memperbarui informasi klien yang telah terdaftar dalam sistem. 
3. 
delete 
Menghapus data klien dari sistem. 
 
3. Kelas Proyek 
Kelas Proyek merupakan inti utama sistem karena berfungsi untuk mengelola 
koordinasi proyek, penjadwalan, fase pekerjaan, serta hubungan antar tugas. Deskripsi 
fungsi pada kelas Proyek dapat dilihat pada Tabel 4.3.

<!-- page 56 -->

 
 
 
43 
 
Tabel 4.3 Kelas Proyek 
No. 
Fungsi 
Deskripsi 
1. 
create 
Membuat dan merekam data proyek baru ke dalam 
sistem. 
2. 
approveSurvey 
Mengubah status fase proyek setelah proses survei 
lapangan disetujui. 
3. 
calculateSPI 
Melakukan perhitungan nilai SPI pada proyek. 
4. 
assignTechnician Mengalokasikan teknisi ke dalam operasional proyek. 
5. 
getHealth 
Mengambil informasi status kesehatan proyek dari kelas 
ProjectHealth. 
 
4. Kelas PenugasanProyek 
Kelas Penugasan Proyek berfungsi sebagai kelas asosiasi yang menghubungkan 
pengguna dengan proyek tertentu secara terstruktur. Deskripsi fungsi pada kelas 
Penugasan Proyek dapat dilihat pada Tabel 4.4. 
Tabel 4.4 Kelas Penugasan Proyek 
No. 
Fungsi 
Deskripsi 
1. 
assign 
Menetapkan relasi penugasan pengguna ke dalam suatu 
proyek. 
2. 
unassign 
Menghapus relasi penugasan pengguna dari proyek. 
3. 
getByProject Mengambil daftar pengguna atau teknisi yang ditugaskan 
pada proyek tertentu. 
 
5. Kelas Kesehatan Proyek 
Kelas Kesehatan Proyek berfungsi untuk mengelola proses komputasi EWS 
serta menghitung indikator kesehatan proyek. Dengan adanya pemisahan ini, proses 
analisis tidak membebani kelas utama Proyek. Deskripsi fungsi pada kelas Kesehatan 
Proyek dapat dilihat pada Tabel 4.5.

<!-- page 57 -->

 
 
 
44 
 
Tabel 4.5 Kelas Kesehatan Proyek 
No. 
Fungsi 
Deskripsi 
1. 
recalculate 
Menghitung ulang metrik SPI proyek secara 
otomatis berdasarkan pembaruan data laporan harian 
terbaru. 
2. 
getStatus 
Mengonversi hasil perhitungan metrik menjadi 
indikator status peringatan, seperti hijau, kuning, 
atau merah. 
3. 
computePlannedValue Menghitung nilai progres rencana berdasarkan 
jadwal proyek. 
4. 
sortByUrgency 
Mengurutkan prioritas tampilan proyek pada 
dashboard berdasarkan tingkat urgensi. 
5. 
computeEarnedValue 
Menghitung nilai progres aktual berdasarkan tugas 
yang telah selesai. 
 
6. Kelas Tugas 
Kelas Tugas merepresentasikan unit pekerjaan atau tugas lapangan yang harus 
diselesaikan dalam periode waktu tertentu. Deskripsi fungsi pada kelas Tugas dapat 
dilihat pada Tabel 4.6. 
Tabel 4.6 Kelas Tugas 
No. 
Fungsi 
Deskripsi 
1. 
create 
Membuat rincian tugas baru dalam suatu proyek. 
2. 
changeStatus 
Memperbarui status pengerjaan tugas, seperti to_do, 
working_on, atau done. 
3. 
markDone 
Menandai bahwa tugas telah selesai secara permanen. 
4. 
isOvertime 
Mengevaluasi apakah durasi pengerjaan melebihi estimasi 
waktu yang ditentukan. 
5. 
isOverDeadline Mengidentifikasi tugas yang melewati batas waktu 
penyelesaian (due date).

<!-- page 58 -->

 
 
 
45 
 
7. Kelas BuktiTugas 
Kelas Bukti Tugas digunakan untuk mengelola dokumen atau lampiran bukti 
pekerjaan yang dikirimkan oleh teknisi. Deskripsi fungsi pada kelas BuktiTugas dapat 
dilihat pada Tabel 4.7. 
Tabel 4.7 Kelas BuktiTugas 
No. 
Fungsi 
Deskripsi 
1. 
upload 
Menyimpan berkas gambar atau dokumen bukti pekerjaan ke 
dalam sistem. 
2. 
download Mengambil berkas bukti pekerjaan untuk ditinjau atau diunduh. 
3. 
delete 
Menghapus berkas bukti pekerjaan dari sistem penyimpanan. 
 
8. Kelas Eskalasi 
Kelas Eskalasi berfungsi untuk mencatat, mengelola prioritas, dan memantau 
proses komunikasi terkait kendala lapangan yang terjadi selama pelaksanaan proyek. 
Deskripsi fungsi pada kelas Eskalasi dapat dilihat pada Tabel 4.8. 
Tabel 4.8 Kelas Eskalasi 
No. 
Fungsi 
Deskripsi 
1. 
create 
Mencatat laporan eskalasi atau kendala baru yang 
dikirimkan oleh teknisi. 
2. 
resolve 
Memperbarui status kendala menjadi selesai atau telah 
ditangani. 
3. 
sendInstruction Mengirimkan instruksi atau solusi dari manajer kepada 
teknisi pelapor. 
 
4.3.2 Perancangan Model Data  
Dalam pengembangan fitur dashboard pada sistem manajemen proyek 
berdasarkan data laporan harian untuk PT SHI, penerapan ERD menjadi fondasi utama 
dalam membangun struktur basis data yang solid. Diagram ini memetakan hubungan 
relasional antara entitas-entitas vital dalam sistem, meliputi User, Klien, Penugasan 
Proyek, Proyek, Tugas, Bukti Tugas, Eskalasi, Kesehatan Proyek. Struktur data ini 
dirancang secara spesifik untuk mengakomodasi alur kerja operasional, mulai dari

<!-- page 59 -->

 
 
 
46 
 
inisiasi proyek klien, manajemen peran pengguna, dekomposisi pekerjaan lapangan, 
pengumpulan data pelaporan harian, hingga penanganan kendala sistematis. 
Perancangan model data sistem ini dapat dilihat pada gambar 4.15.  
 
Hubungan Antar Entitas: 
1) tb_user memiliki hubungan one-to-many (1:M) dengan tb_klien, yaitu satu 
Manajer dapat mengelola banyak klien, sedangkan setiap klien hanya dikelola oleh 
satu Manajer. 
2) tb_klien memiliki hubungan one-to-many (1:M) dengan tb_proyek, yaitu satu 
klien dapat memiliki banyak proyek, sedangkan setiap proyek hanya dimiliki oleh 
satu klien. 
Gambar 4.15 Entity Relationship Diagram

<!-- page 60 -->

 
 
 
47 
 
3) tb_user memiliki hubungan one-to-many (1:M) dengan tb_proyek, yaitu satu 
Manajer dapat mengelola beberapa proyek, sedangkan setiap proyek hanya dikelola 
oleh satu Manajer. 
4) tb_user dan tb_proyek memiliki hubungan many-to-many (M:N) yang 
direalisasikan melalui entitas tb_penugasan_proyek, sehingga satu proyek dapat 
melibatkan beberapa Teknisi dan satu Teknisi dapat ditugaskan pada beberapa 
proyek. 
5) tb_proyek memiliki hubungan one-to-many (1:M) dengan tb_tugas, yaitu satu 
proyek dapat terdiri atas banyak tugas, sedangkan setiap tugas hanya terkait dengan 
satu proyek. 
6) tb_user memiliki hubungan one-to-many (1:M) dengan tb_tugas, yaitu satu 
Teknisi dapat menerima dan mengerjakan banyak tugas, sedangkan setiap tugas 
hanya diberikan kepada satu Teknisi. 
7) tb_tugas memiliki hubungan one-to-many (1:M) dengan tb_bukti, yaitu satu 
tugas dapat memiliki lebih dari satu bukti pekerjaan, sedangkan setiap bukti hanya 
terkait dengan satu tugas. 
8) tb_tugas memiliki hubungan one-to-many (1:M) dengan tb_eskalasi, yaitu satu 
tugas dapat memiliki beberapa data eskalasi, sedangkan setiap eskalasi hanya 
berhubungan dengan satu tugas. 
9) tb_proyek memiliki hubungan one-to-one (1:1) dengan tb_kesehatan_proyek, 
yaitu setiap proyek memiliki satu data kesehatan proyek yang digunakan sebagai 
dasar penyajian informasi pada dashboard. 
4.3.3 Perancangan Fisik Basis Data 
Perancangan model fisik merupakan tahap akhir desain basis data, di mana 
skema logis atau ERD diimplementasikan menjadi basis data nyata menggunakan 
Sistem Manajemen Basis Data (DBMS). Tahapan ini bertujuan untuk mengoptimalkan 
efisiensi pemrosesan dan pengelolaan data. Berikut adalah rincian perancangan model 
fisik basis data pada sistem manajemen proyek di PT SHI.

<!-- page 61 -->

 
 
 
48 
 
1) Tabel User 
Nama Tabel: tb_user 
Primary Key: id_user 
Tabel 4.9 Tabel User 
No 
Nama Field 
Tipe Data 
Panjang Karakter 
Constraint 
1 
id_user 
BIGINT 
20 
PK 
2 
nama 
VARCHAR 
255 
 
3 
email 
VARCHAR 
255 
Unique 
4 
password 
VARCHAR 
255 
 
5 
role 
ENUM 
'technician','manager' 
 
2) Tabel Klien 
Nama Tabel: tb_klien 
Primary Key: id_klien 
Foreign Key: id_user (terhubung dengan tb_user) 
Tabel 4.10 Tabel Klien 
No 
Nama Field 
Tipe Data 
Panjang Karakter 
Constraint 
1 
id_klien 
BIGINT 
20 
PK 
2 
nama_klien 
VARCHAR 
255 
 
3 
alamat 
VARCHAR 
255 
 
4 
no_telp 
VARCHAR 
20 
 
5 
email 
VARCHAR 
255 
Unique 
6 
id_user 
BIGINT 
20 
FK 
3) Tabel Proyek 
Nama Tabel: tb_proyek 
Primary Key: id_proyek 
Foreign Key: id_klien (terhubung dengan tb_klien) 
Foreign Key: id_user (terhubung dengan tb_user) 
Tabel 4.11 Tabel Proyek 
No 
Nama Field 
Tipe Data 
Panjang Karakter 
Constraint 
1 
id_proyek 
BIGINT 
20 
PK 
2 
nama_proyek 
VARCHAR 
255 
 
3 
id_klien 
BIGINT 
20 
FK

<!-- page 62 -->

 
 
 
49 
 
No 
Nama Field 
Tipe Data 
Panjang Karakter 
Constraint 
4 
start_date 
DATE 
- 
 
5 
end_date 
DATE 
- 
 
6 
status 
ENUM 
'active','completed','on-hold' 
Default: 
active 
7 
phase 
ENUM 
'survey','execution' 
Default: 
survey 
8 
id_user 
BIGINT 
20 
FK 
 
4) Tabel Penugasan Proyek 
Nama Tabel: tb_penugasan_proyek 
Primary Key: id_tugas 
Foreign Key: id_proyek (terhubung dengan tb_proyek) 
Foreign Key: assigned_to (terhubung dengan tb_user)  
Tabel 4.12 Tabel Penugasan Proyek 
No 
Nama Field 
Tipe Data 
Panjang Karakter 
Constraint 
1 
id_tugas 
BIGINT 
20 
PK 
2 
id_proyek 
BIGINT 
20 
FK 
3 
id_user 
BIGINT 
20 
FK 
4 
assigned_at 
TIMESTAMP 
- 
 
 
5) Tabel Tugas 
Nama Tabel: tb_tugas 
Primary Key: id_tugas 
Foreign Key: id_proyek (terhubung dengan tb_proyek) 
Foreign Key: id_user (terhubung dengan tb_user) 
Tabel 4.13 Tabel Tugas 
No 
Nama Field 
Tipe Data 
Panjang Karakter 
Constraint 
1 
id_tugas 
BIGINT 
20 
PK 
2 
id_proyek 
BIGINT 
20 
FK 
3 
id_user 
BIGINT 
20 
FK 
4 
nama_tugas 
VARCHAR 
255 
 
5 
due_date 
DATE 
 
 
6 
status 
ENUM 
'to_do','working_on_it','done' 
Default: to_do

<!-- page 63 -->

 
 
 
50 
 
No 
Nama Field 
Tipe Data 
Panjang Karakter 
Constraint 
7 
assigned_to 
BIGINT 
20 
FK 
 
6) Tabel Bukti 
Nama Tabel: tb_bukti 
Primary Key: id_bukti 
Foreign Key: id_tugas (terhubung dengan tb_tugas) 
Foreign Key: id_user (terhubung dengan tb_user) 
Tabel 4.14 Tabel Bukti 
No 
Nama Field 
Tipe Data 
Panjang Karakter 
Constraint 
1 
id_bukti 
BIGINT 
20 
PK 
2 
id_tugas 
BIGINT 
20 
FK 
3 
file_path 
VARCHAR 
500 
 
4 
id_user 
BIGINT 
20 
FK 
 
7) Tabel Eskalasi 
Nama Tabel: tb_eskalasi 
Primary Key: id_eskalasi 
Foreign Key: id_proyek (terhubung dengan tb_proyek) 
Foreign Key: id_tugas (terhubung dengan tb_tugas) 
Foreign Key: reported_by (terhubung dengan tb_user) 
Tabel 4.15 Tabel Eskalasi 
No 
Nama Field 
Tipe Data 
Panjang Karakter 
Constraint 
1 
id_eskalasi 
BIGINT 
20 
PK 
2 
id_user 
BIGINT 
20 
FK 
3 
id_tugas 
BIGINT 
20 
FK 
4 
title 
VARCHAR 
255 
 
5 
priority 
ENUM 
'low','medium','high' 
Default: medium 
6 
status 
ENUM 
'open','handled','closed' 
Default: open

<!-- page 64 -->

 
 
 
51 
 
4.3.4 Perancangan Relasi Antar Tabel  
Pada bagian perancangan relasi antar tabel, gambar 4.16 menggambarkan 
hubungan antara berbagai tabel yang ada dalam basis data.  
1) Tabel tb_klien berelasi dengan tb_proyek, di mana satu klien dapat memiliki lebih 
dari satu proyek yang dikelola oleh perusahaan. 
2) Tabel tb_user berelasi dengan tb_klien, di mana seorang Manajer dapat 
mengelola beberapa data klien, sedangkan setiap klien hanya dikelola oleh satu 
Manajer. 
3) Tabel tb_user berelasi dengan tb_proyek, di mana seorang Manajer dapat 
membuat dan mengelola beberapa proyek, sedangkan setiap proyek hanya dikelola 
oleh satu Manajer. 
4) Tabel tb_penugasan_proyek berelasi dengan tb_user dan tb_proyek untuk 
menyimpan data penugasan Teknisi pada suatu proyek. Satu proyek dapat 
melibatkan beberapa Teknisi dan satu Teknisi dapat ditugaskan pada beberapa 
proyek. 
5) Tabel tb_proyek berelasi dengan tb_tugas, di mana satu proyek dapat memiliki 
beberapa tugas yang harus diselesaikan selama pelaksanaan proyek. 
6) Tabel tb_user berelasi dengan tb_tugas, di mana seorang Teknisi dapat menerima 
dan mengerjakan beberapa tugas, sedangkan setiap tugas hanya diberikan kepada 
satu Teknisi. 
7) Tabel tb_tugas berelasi dengan tb_bukti, di mana satu tugas dapat memiliki 
beberapa bukti pekerjaan yang diunggah sebagai dokumentasi pelaksanaan 
pekerjaan. 
8) Tabel tb_user berelasi dengan tb_bukti, di mana seorang Teknisi dapat 
mengunggah beberapa bukti pekerjaan pada tugas yang dikerjakannya. 
9) Tabel tb_tugas berelasi dengan tb_eskalasi, di mana satu tugas dapat memiliki 
beberapa data eskalasi yang berkaitan dengan kendala selama pelaksanaan 
pekerjaan.

<!-- page 65 -->

 
 
 
52 
 
10) Tabel tb_user berelasi dengan tb_eskalasi, di mana seorang Teknisi dapat 
membuat laporan eskalasi apabila ditemukan kendala pada tugas yang sedang 
dikerjakan. 
11) Tabel tb_proyek berelasi dengan tb_kesehatan_proyek dengan hubungan satu 
banding satu (1:1), di mana setiap proyek memiliki satu data kesehatan proyek yang 
digunakan sebagai dasar penyajian informasi pada dashboard. 
 
4.3.5 Perancangan Antarmuka 
4.3.5.1 Antarmuka Data Input 
1) Halaman Login 
Gambar 4.17 merepresentasikan rancangan antarmuka halaman masuk sebagai 
gerbang autentikasi dan lapis keamanan utama sistem. Desain antarmuka dirancang 
Gambar 4.16 Perancangan Relasi Antar Tabel

<!-- page 66 -->

 
 
 
53 
 
dengan estetika minimalis dan profesional, hanya memuat elemen formulir esensial 
berupa kolom input surel, kata sandi, dan tombol "Masuk". Halaman ini terintegrasi 
langsung dengan basis data untuk menjalankan sistem RBAC. Pascavalidasi, sistem 
otomatis mengidentifikasi peran pengguna lalu mengarahkan mereka ke tampilan 
dashboard spesifik sesuai otoritas dan kebutuhan operasional masing-masing. 
 
Gambar 4.17 Halaman Login 
2) Halaman Tambah Proyek 
Gambar 4.18 merepresentasikan rancangan antarmuka penambahan proyek 
yang khusus diakses oleh pengguna berotoritas manajerial. Halaman ini berfungsi 
sebagai modul entri data utama untuk menginisiasi proyek ke dalam basis data. 
Antarmuka ini membagi proses pengisian menjadi tiga bagian operasional: atribut 
dasar, panel penugasan teknisi yang dilengkapi rekomendasi jadwal dinamis guna 
mencegah benturan, serta daftar rincian tugas untuk mendekomposisi beban kerja 
lapangan.

<!-- page 67 -->

 
 
 
54 
 
3) Halaman Tambah Laporan Harian 
Gambar 4.19 merepresentasikan rancangan antarmuka halaman penambahan 
laporan harian yang diakses khusus oleh pengguna dengan otoritas teknisi. Halaman 
ini menjadi pusat pengumpulan data operasional lapangan, tempat teknisi melaporkan 
rincian progres pekerjaan secara terstruktur. Antarmuka ini memuat parameter input 
krusial, meliputi pemilihan proyek dan tugas spesifik, pembaruan persentase progres 
aktual, catatan kendala lapangan, serta modul unggahan berkas sebagai bukti visual. 
Data faktual dari formulir ini menjadi variabel utama (EV) yang kelak dikomputasi 
sistem untuk menghasilkan indikator Sistem Peringatan Dini (EWS) pada dashboard 
manajer. 
Gambar 4.18 Halaman Tambah Proyek

<!-- page 68 -->

 
 
 
55 
 
 
4.3.5.2 Antarmuka Data Proses 
1) Halaman Dashboard Early Warning System  
Gambar 4.20 merepresentasikan rancangan antarmuka utama Dashboard EWS 
yang merupakan luaran inti dari pengembangan sistem aplikasi manajemen proyek ini. 
Dikhususkan bagi pengguna dengan hak akses manajerial, halaman ini menyajikan 
visualisasi analitik komprehensif yang dikomputasi secara real-time dari akumulasi 
data pelaporan laporan harian lapangan. Antarmuka ini mendekomposisi wawasan 
operasional ke dalam tiga segmen strategis: panel rekapitulasi kuantitatif status 
kesehatan proyek secara makro, matriks tabel rincian proyek yang secara algoritmik 
diurutkan berdasarkan tingkat urgensi (metrik rasio SPI terendah), serta panel notifikasi 
eskalasi kendala teknis terbaru. Melalui sentralisasi informasi visual ini, manajer dapat 
secara proaktif mengidentifikasi proyek yang berisiko kritis dan mengeksekusi 
tindakan mitigasi keterlambatan jadwal secara presisi, tanpa harus meninjau dan 
menghitung tumpukan laporan harian teknisi secara manual. 
Gambar 4.19 Halaman Tambah Laporan Proyek

<!-- page 69 -->

 
 
 
56 
 
 
Gambar 4.20 Halaman Dashboard Early Warning System 
2) Halaman Data Proyek 
Gambar 4.21 merepresentasikan rancangan antarmuka halaman Data Proyek 
sebagai modul sentral portofolio operasional sistem. Khusus bagi manajer, antarmuka 
ini menyajikan rekapitulasi komprehensif seluruh proyek dalam format tabel 
terstruktur, mencakup atribut identitas proyek, klien, status berjalan, fase pengerjaan 
(survei/proyek), dan jadwal kalender. Guna mengoptimalkan efisiensi pada himpunan 
data besar, halaman ini dilengkapi fitur penyaringan berdasarkan status, fase, klien, 
serta kolom pencarian dinamis. Selain inventarisasi visual, antarmuka ini 
mengintegrasikan fungsi CRUD (Create, Read, Update, Delete) pada setiap baris 
data—meliputi tinjauan detail, pembaruan, penghapusan, dan pintasan formulir proyek 
baru—untuk memastikan integritas tata kelola administrasi sebelum penugasan 
didelegasikan ke teknisi lapangan.

<!-- page 70 -->

 
 
 
57 
 
 
Gambar 4.21 Halaman Data Proyek 
3) Halaman Kanban Penugasan Proyek 
Gambar 4.22 merepresentasikan antarmuka Kanban Penugasan Proyek yang 
berfungsi 
sebagai 
modul 
pelacakan 
operasional 
lapangan. 
Rincian 
tugas 
divisualisasikan ke dalam tiga fase progress, dengan setiap kartu memuat atribut 
esensial seperti tenggat waktu, delegasi teknisi, dan lampiran bukti pekerjaan. 
Pergerakan status tugas ini terintegrasi secara langsung dengan siklus penginputan 
laporan harian oleh teknisi secara keseluruhan. Melalui konsolidasi visual terpusat ini, 
Manajer dapat mendeteksi hambatan alur kerja secara real-time dan granular, sebelum 
keseluruhan data pengerjaan tersebut diagregasi untuk mengkalkulasi metrik SPI pada 
dashboard EWS utama.

<!-- page 71 -->

 
 
 
58 
 
 
4.3.5.3 Antarmuka Data Output 
1) Halaman Dashboard Performa Teknisi 
Gambar 4.23 merepresentasikan rancangan antarmuka "Dashboard Performa 
Saya" yang dialokasikan khusus bagi teknisi. Berbeda dengan dashboard manajerial 
yang mengevaluasi proyek secara makro, halaman ini berfungsi sebagai modul analitik 
personal. Antarmuka ini menyajikan umpan balik kuantitatif secara instan berdasarkan 
akumulasi data laporan harian yang diunggah teknisi, mencakup indikator kinerja 
utama seperti rasio SPI individu, total penyelesaian tugas, dan peringatan tenggat 
waktu beban kerja. Dilengkapi visualisasi grafik tren performa mingguan dan rincian 
matriks tugas berjalan, halaman ini bertujuan menciptakan transparansi data. Melalui 
fitur ini, teknisi dapat mengevaluasi produktivitas dan kepatuhan jadwalnya secara 
mandiri guna meningkatkan kedisiplinan serta akurasi pelaporan operasional harian. 
Gambar 4.22 Halaman Kanban Penugasan Proyek

<!-- page 72 -->

 
 
 
59 
 
2) Halaman Detail Proyek 
Gambar 4.24 menampilkan rancangan antarmuka halaman "Detail Proyek" 
yang berfungsi untuk menyajikan informasi pemantauan dari satu entitas proyek secara 
terpusat. Antarmuka ini dirancang untuk memfasilitasi peran Manajer dalam meninjau 
akumulasi data operasional lapangan. Pada komponen utama ringkasan, sistem 
memvisualisasikan perbandingan antara target rencana (planned progress) dan capaian 
riil (actual progress) yang bersumber dari agregasi data laporan harian teknisi. Hasil 
komputasi dari kedua variabel tersebut menghasilkan nilai Schedule Performance 
Index (SPI) yang menjadi dasar penentuan indikator warna Early Warning System 
(EWS). Selain itu, halaman ini juga menyediakan informasi statistik penyelesaian 
tugas, daftar tiket eskalasi aktif, serta log instruksi manajerial untuk mendukung fungsi 
evaluasi operasional oleh Manajer. 
Gambar 4.23 Halaman Dashboard Performa Teknisi

<!-- page 73 -->

 
 
 
60 
 
 
3) Halaman Laporan Kesehatan Proyek 
Gambar 4.25 merepresentasikan antarmuka halaman "Laporan Kesehatan 
Proyek" yang berfungsi sebagai modul pelaporan analitik dan dokumentasi performa 
operasional bagi tingkat manajerial. Halaman ini mensintesis akumulasi laporan harian 
menjadi luaran evaluatif yang siap disajikan kepada stakeholder. Antarmuka 
mengintegrasikan panel visual krusial, meliputi ringkasan metrik kesehatan (SPI dan 
indikator RAG), grafik komparasi historis antara PV dan EV, serta statistik 
penyelesaian tugas. Nilai tambah sistem ini terletak pada fitur "Rekomendasi 
Tindakan" yang otomatis merumuskan saran mitigasi berbasis nilai SPI dan status 
eskalasi. Didukung kapabilitas ekspor PDF, modul ini memastikan wawasan proaktif 
dari komputasi EWS dapat diekstraksi menjadi dokumen formal sebagai landasan 
keputusan strategis. 
Gambar 4.24 Halaman Detail Proyek

<!-- page 74 -->

 
 
 
61 
 
 
4.3.5.4 Antarmuka Navigasi Struktur Data 
Gambar 4.26 merepresentasikan rancangan bilah navigasi utama (sidebar 
navigation) yang berfungsi sebagai jalur sirkulasi utama antarmuka pada Sistem 
Manajemen Proyek. Ditempatkan secara vertikal di sisi kiri layar, komponen ini 
menyediakan aksesibilitas terpusat dan statis menuju seluruh modul fungsional 
aplikasi. Navigasi ini menyusun hierarki alur kerja melalui tautan langsung ke halaman 
Dashboard analitik EWS, pengelola "Proyek", basis data "Klien", pemetaan "Jadwal", 
ekstraksi "Laporan", konfigurasi "Pengaturan", hingga opsi "Keluar" untuk mengakhiri 
sesi. Tata letaknya yang minimalis dan terintegrasi dirancang secara ergonomis guna 
mengoptimalkan pengalaman pengguna, sehingga transisi antarmodul operasional 
dapat dilakukan dengan cepat dan mulus tanpa kehilangan konteks saat mengelola 
proyek maupun laporan harian. 
Gambar 4.25 Halaman Laporan Kesehatan Proyek

<!-- page 75 -->

 
 
 
62 
 
 
4.4 Rancangan Anggaran Pengembangan Sistem 
Rancangan Anggaran Biaya (RAB) merupakan dokumen yang berisi rincian 
estimasi biaya yang diperlukan selama proses pengembangan sistem. Penyusunan 
anggaran ini mencakup berbagai kebutuhan yang mendukung implementasi sistem 
manajemen proyek berbasis web, mulai dari sumber daya manusia, perangkat keras, 
hingga perangkat lunak dan infrastruktur pendukung. Rancangan anggaran berfungsi 
sebagai acuan dalam mengendalikan penggunaan biaya selama proses pengembangan 
sistem agar pelaksanaan proyek dapat berjalan secara efektif dan efisien. Estimasi 
biaya pengembangan fitur dashboard pada sistem manajemen proyekdi PT SHI dapat 
dilihat pada Tabel 4.7. 
 
 
Gambar 4.26 Bilah Navigasi Struktur Data

<!-- page 76 -->

 
 
 
63 
 
Tabel 4.7 Rancangan Anggaran Pengembangan Sistem 
No. 
Kebutuhan 
Uraian Aspek 
Jumlah 
Satuan 
Harga 
Subtotal 
A. Anggaran Pengembangan Sistem 
1 
Analis Sistem 
1 
3 Bulan 
Rp 1.000.000,00 
Rp 3.000.000,00 
2 
Web Developer 
(Framework Next.js) 
1 
3 Bulan 
Rp 5.500.000,00 
Rp 5.500.000,00 
B. Anggaran Perangkat Keras (Hardware) 
1 
Komputer 
Personal/Laptop 
1 
Unit 
Rp 11.000.000,00 Rp 11.000.000,00 
C. Anggaran Perangkat Lunak (Software) dan Infrastruktur 
1 
Internet Provider 
1 
3 Bulan 
Rp 300.000,00 
Rp 900.000,00 
2 
Hosting dan Domain 
1 
1 Tahun 
Rp 600.000,00 
Rp 600.000,00 
Total 
Rp 21.000.000,00