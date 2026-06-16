# BAB V IMPLEMENTASI DAN PEMBAHASAN SISTEM

_Pages 77-108 of Naskah TA Final 4.pdf_


<!-- page 77 -->

 
 
 
 
 
64 
BAB V 
IMPLEMENTASI DAN PEMBAHASAN SISTEM 
 
5.1 Implementasi 
Bab ini menguraikan tahapan implementasi dan pembahasan dari desain 
arsitektur sistem yang telah dirancang pada bab sebelumnya. Bagian ini membahas 
transformasi rancangan sistem menjadi perangkat lunak fungsional menggunakan 
framework Next.js guna memfasilitasi PT SHI dalam pemantauan proyek real-time. 
Pembahasan mencakup implementasi basis data, antarmuka, pengujian sistem, dan 
fitur inovatif. 
5.1.1 Implementasi Basis Data 
Subbab ini menjelaskan transformasi model logis menjadi skema fisik 
menggunakan DBMS PostgreSQL untuk menghasilkan struktur penyimpanan data 
yang efisien dan terintegrasi. 
1) Struktur Tabel Pengguna 
Gambar 5.1 menampilkan tabel pusat autentikasi yang menyimpan atribut 
esensial seperti id (primary key), name, email, password_hash, dan is_active. Tabel 
ini menerapkan RBAC pada kolom role: manajer mengakses dashboard pemantauan, 
sedangkan teknisi bertugas menginput laporan harian proyek keseluruhan dari 
lapangan. 
Gambar 5.1 Struktur Tabel Pengguna

<!-- page 78 -->

 
 
65 
 
 
 
 
 
 
 
2) Struktur Tabel Proyek 
Gambar 5.2 merepresentasikan struktur dari tabel proyek yang berfungsi 
sebagai pusat penyimpanan data baseline penjadwalan. Tabel ini memuat atribut 
identitas utama seperti id sebagai primary key, project_code, name, dan 
description, serta client_id sebagai foreign key yang merelasikan proyek dengan 
entitas pelanggan. Dalam konteks fitur dashboard pemantauan, peran paling krusial 
dari tabel ini terletak pada kolom start_date, end_date, dan duration. Ketiga 
atribut waktu tersebut bertindak sebagai patokan target jadwal ideal (PV) yang nantinya 
akan ditarik oleh sistem untuk dibandingkan dengan progres laporan harian (EV) guna 
menghasilkan metrik SPI. 
 
Gambar 5.2 Struktur Tabel Proyek 
3) Struktur Tabel Penugasan Proyek 
Gambar 5.3 menampilkan tabel relasi banyak-ke-banyak (M:N) antara entitas 
proyek dan pengguna. Tabel ini menggunakan project_id dan user_id sebagai 
composite primary key sekaligus foreign key, serta assigned_at untuk mencatat waktu 
penugasan. Tabel pemetaan ini krusial untuk otorisasi operasional, memastikan teknisi

<!-- page 79 -->

 
 
66 
 
 
 
 
 
 
 
hanya dapat mengakses dan menginput data laporan harian proyek keseluruhan yang 
secara spesifik ditugaskan kepadanya. Hal ini menjamin validitas capaian progres (EV) 
sebelum dikalkulasi menjadi metrik SPI pada dashboard manajer. 
 
4) Struktur Tabel Kesehatan Proyek 
Gambar 5.4 menampilkan tabel Kesehatan Proyek sebagai media penyimpanan 
hasil kalkulasi analitik performa operasional. Menggunakan project_id sebagai 
primary key, tabel ini memuat atribut actual_progress (EV), planned_progress 
(PV), dan spi_value. Nilai SPI ini menentukan status indikator Sistem Peringatan 
Dini serta mencatat statistik tugas (total_tasks, overdue_tasks). Tabel ini berperan 
vital sebagai cache metrik, memungkinkan dashboard manajer memuat dan 
memvisualisasikan status prioritas proyek secara instan tanpa membebani basis data 
dengan kalkulasi ulang dari data mentah. 
 
Gambar 5.4 Struktur Tabel Kesehatan Proyek 
5.1.2 Implementasi Sistem 
Tahap implementasi sistem berfokus pada penerjemahan desain menjadi kode 
program fungsional. Sistem ini dikembangkan menggunakan framework Next.js 
Gambar 5.3 Struktur Tabel Penugasan Proyek

<!-- page 80 -->

 
 
67 
 
 
 
 
 
 
 
dengan arsitektur routing API yang terpusat dan modular. Pada sisi pengolahan data, 
interaksi dengan basis data dieksekusi secara terstruktur melalui metode parameterized 
query guna menjaga integritas data sekaligus meminimalisasi celah keamanan sistem. 
1. Otentikasi Sistem 
Gambar 5.5 merepresentasikan implementasi logika autentikasi API. Sistem 
memvalidasi kredensial pengguna melalui parameterized query dan komparasi hash 
bcrypt guna memitigasi kerentanan keamanan. Pasca-validasi, algoritma secara 
otomatis mengenerasi JSON Web Token (JWT) sebagai instrumen untuk mengelola 
otorisasi sesi operasional di sisi klien. 
2. Input Data Proyek 
Gambar 5.6 mengilustrasikan logika API penambahan proyek baru. Eksekusi fungsi 
diawali validasi RBAC guna membatasi wewenang modifikasi eksklusif bagi manajer. 
Pasca-penyimpanan data operasional melalui parameterized query, algoritma secara  
Gambar 5.5 Otentikasi Sistem

<!-- page 81 -->

 
 
68 
 
 
 
 
 
 
 
otomatis memicu komputasi SPI untuk menginisialisasi metrik performa dasar proyek 
sebelum mengembalikan respons keberhasilan ke sisi klien. 
 
3. Transaksi Input Data Laporan Harian 
Bagian ini memuat dua transaksi tulis yang berfungsi sebagai laporan harian di 
sisi teknisi. Transaksi pertama mencatat aktivitas pada sebuah tugas (foto, catatan, atau 
penanda waktu), sedangkan transaksi kedua mengubah status tugas dan secara tidak 
langsung menjadi pemicu utama pemutakhiran dashboard EWS. 
a. Pencatatan Aktivitas Tugas Harian  
Fungsi createActivity() merekam pembaruan aktivitas harian tugas. 
Algoritma ini menerapkan row-level authorization untuk memastikan teknisi hanya 
dapat memodifikasi tugas delegasinya. Setelah otorisasi tervalidasi, data operasional 
beserta lampiran dokumen langsung disimpan ke basis data secara persisten. Rincian 
sintaks disajikan pada Gambar 5.7. 
Gambar 5.6 Input Data Proyek

<!-- page 82 -->

 
 
69 
 
 
 
 
 
 
 
b. Perubahan Status Tugas sebagai Pemicu Rekalkulasi 
Fungsi changeTaskStatus() merupakan penggerak utama alur EWS.. Setiap 
transisi status akan mengakumulasi durasi pengerjaan aktual (time_spent_seconds) 
dan secara otomatis memicu fungsi recalculateSPI() guna memutakhirkan indikator 
dashboard secara dinamis. Rekam jejak transisi ini turut diintegrasikan ke dalam log 
aktivitas secara persisten. Rincian sintaks disajikan pada Gambar 5.8. 
Gambar 5.7 Pencatatan Laporan Harian

<!-- page 83 -->

 
 
70 
 
 
 
 
 
 
 
 
4. Transaksi Proses Rekalkulasi dan Penanda Aman / Terlambat 
a. Perhitungan SPI dan UPSERT  
Fungsi recalculateSPI() bertindak sebagai mesin komputasi utama EWS. 
Algoritma ini mengkalkulasi PV berdasarkan proporsi waktu berjalan dan EV dari rasio 
penyelesaian tugas—dengan skema fallback menggunakan persentase laporan harian 
apabila struktur tugas belum dikonfigurasi. Hasil komparasi EV dan PV membentuk 
metrik SPI penentu status kesehatan proyek. Nilai akhir ini kemudian direkam melalui 
mekanisme UPSERT guna memastikan konsistensi pembaruan data tunggal pada 
dashboard. Sintaks implementasinya disajikan pada Gambar 5.9. 
 
Gambar 5.8 Perubahan Statur Tugas & Pemicu SPI

<!-- page 84 -->

 
 
71 
 
 
 
 
 
 
 
b. Klasifikasi Kesehatan Proyek 
Fungsi categorizeHealth() memetakan nilai SPI ke tiga label warna yang dipakai 
Gambar 5.9 Perhitungan SPI

<!-- page 85 -->

 
 
72 
 
 
 
 
 
 
 
dashboard. Proyek dengan SPI lebih dari atau sama dengan 0,95 dikategorikan green 
(aman), proyek dengan SPI antara 0,85 dan 0,95 dikategorikan amber (peringatan), dan 
proyek dengan SPI di bawah 0,85 dikategorikan red (terlambat). Threshold ini menjadi 
acuan tunggal yang dipakai baik di sisi basis data (kolom status pada project_health) 
maupun di sisi antarmuka (komponen StatusBadge yang merender lingkaran hijau, 
kuning, atau merah). Sintaks implementasi disajikan pada Gambar 5.10. 
 
5. Implementasi Dashboard EWS 
a. Pengurutan Berdasarkan Kekritisan 
Fungsi getDashboard() menyusun tampilan EWS dengan dua tahap. Pertama, 
melakukan JOIN antara tabel proyek dengan baris project_health dan laporan harian 
terakhir (subquery LATERAL pada daily_reports). Kedua, mengurutkan hasil JOIN 
dengan klausa ORDER BY CASE ph.status sehingga proyek berkategori red menempati 
urutan teratas, disusul amber, lalu green. Di dalam satu kategori warna, proyek 
diurutkan menurut nilai SPI menaik supaya proyek yang paling kritis (SPI terkecil) 
muncul lebih dahulu; sebagai tie-breaker terakhir, tanggal akhir terdekat didahulukan. 
Pola pengurutan inilah yang membuat manajer langsung melihat proyek terlambat di 
pucuk dashboard tanpa perlu memilah daftar secara manual. Sintaks implementasi 
disajikan pada Gambar 5.11. 
Gambar 5.10 Klasifikasi Kesehatan Proyek

<!-- page 86 -->

 
 
73 
 
 
 
 
 
 
 
 
Gambar 5.11 Pengurutan Berdasarkan Kekritisan 
b. Statistik Ringkasan Proyek per Kategori RAG 
Selain daftar proyek, dashboard juga menampilkan panel statistik ringkas 
berupa jumlah proyek pada masing-masing kategori RAG. Query menggunakan 
beberapa klausa COUNT FILTER untuk menghitung total_red, total_amber, 
total_green, dan total_no_health (proyek tanpa baris project_health), serta avg_spi 
sebagai rerata kesehatan secara keseluruhan. Kolom overdue_projects menambah 
dimensi keterlambatan pada level proyek dengan membandingkan end_date dengan 
tanggal sistem. Sintaks implementasi disajikan pada Gambar 5.12.

<!-- page 87 -->

 
 
74 
 
 
 
 
 
 
 
 
Gambar 5.12 COUNT FILTER per kategori RAG 
5.2 Pembahasan 
5.2.1 Pembahasan Basis Data 
Pada subbab ini, dipaparkan hasil evaluasi arsitektur basis data fisik yang 
menopang operasional sistem. Fokus utama dari pembahasan ini adalah untuk 
memvalidasi integritas relasional antarentitas serta mengevaluasi keandalan skema 
penyimpanan dalam mengakomodasi beban transaksi data operasional. Analisis ini 
secara khusus menyoroti kapabilitas basis data dalam memfasilitasi aliran informasi 
yang berkesinambungan—mulai dari perekaman pelaporan harian, pemeliharaan 
rekam jejak status penugasan secara historis, hingga penyediaan suplai data terstruktur 
yang sangat krusial untuk menunjang komputasi analitik SPI pada dashboard 
manajerial. 
1. Transaksi Tabel tb_proyek 
Kueri INSERT pada tabel tb_proyek dieksekusi pasca-persetujuan manajer 
untuk menginisiasi fase proyek. Sistem merekam parameter operasional, termasuk 
rentang waktu yang menjadi acuan komputasi PV pada metrik SPI. Implementasi 
klausa RETURNING dimanfaatkan untuk mengekstrak id_proyek secara langsung guna 
memicu inisialisasi status kesehatan proyek. Sintaks dan hasil eksekusinya disajikan 
berturut-turut pada Gambar 5.13 dan Gambar 5.14.

<!-- page 88 -->

 
 
75 
 
 
 
 
 
 
 
 
Gambar 5.13 Kueri INSERT — Transaksi Tabel tb_proyek 
 
Gambar 5.14 Hasil eksekusi INSERT — Transaksi Tabel tb_proyek 
 
2. Transaksi Laporan Harian 
 
Kueri SELECT pada tabel task_activities dengan klausa JOIN ke tabel 
tb_tugas dan tb_proyek mengekstrak histori laporan harian seorang teknisi dalam 
rentang waktu tiga puluh hari terakhir. Hasil pengambilan data ini menjadi suplai utama 
bagi komponen "Aktivitas Hari Ini" pada Dashboard Performa Teknisi, serta linimasa 
aktivitas pada halaman detail tugas. Implementasi pengurutan pada kolom created_at 
secara descending memastikan catatan terbaru muncul lebih awal, sehingga manajer 
dapat memverifikasi progres lapangan secara langsung. Sintaks dan hasil eksekusinya 
diilustrasikan berturut-turut pada Gambar 5.15 dan Gambar 5.16. 
 
Gambar 5.15 Kueri SELECT — Transaksi Laporan Harian

<!-- page 89 -->

 
 
76 
 
 
 
 
 
 
 
 
Gambar 5.16 Hasil eksekusi SELECT — Transaksi Laporan Harian 
 
3. Rekalkulasi SPI dan project_health 
Kueri UPSERT pada tabel project_health merupakan transaksi utama pasca-
rekalkulasi SPI. Klausa ON CONFLICT (project_id) mengeksekusi pemutakhiran 
data tunggal untuk setiap proyek secara konsisten. Selanjutnya, atribut status 
berfungsi sebagai landasan kategorisasi peringatan EWS pada dashboard, sementara 
kolom last_updated menyuplai informasi keterkinian data di sisi antarmuka. Sintaks 
dan hasil eksekusinya diilustrasikan berturut-turut pada Gambar 5.17 dan Gambar 5.18. 
 
Gambar 5.18 Hasil eksekusi UPSERT — Rekalkulasi SPI dan project_health 
Gambar 5.17 Kueri UPSERT — Rekalkulasi SPI dan project_health

<!-- page 90 -->

 
 
77 
 
 
 
 
 
 
 
Kueri SELECT pada entitas project_health mengekstrak metrik performa 
proyek secara komprehensif, meliputi kalkulasi SPI, rasio progres, hingga agregasi 
status penugasan. Luaran kueri ini menghasilkan snapshot data terstruktur yang secara 
langsung menyuplai komponen antarmuka ProjectCard guna memvisualisasikan 
indikator EWS pada dashboard manajerial. Sintaks dan hasil eksekusinya diilustrasikan 
berturut-turut pada Gambar 5.19 dan Gambar 5.20. 
 
Gambar 5.19 Kueri SELECT — Rekalkulasi SPI dan project_health 
 
Gambar 5.20 Hasil eksekusi SELECT — Rekalkulasi SPI dan project_health 
4. Menampilkan Dashboard EWS 
Kueri SELECT ini mengonstruksi tampilan utama Dashboard EWS melalui 
agregasi JOIN antara entitas proyek dan metrik kesehatan (SPI). Logika pengurutan 
berlapis pada klausa ORDER BY dirancang untuk memprioritaskan proyek dengan status 
kritis, nilai SPI terendah, dan tenggat waktu terdekat secara berurutan guna 
memaksimalkan fungsi mitigasi risiko. Sintaks dan hasil eksekusinya diilustrasikan 
berturut-turut pada Gambar 5.21 dan Gambar 5.22.

<!-- page 91 -->

 
 
78 
 
 
 
 
 
 
 
 
Gambar 5.21 Kueri SELECT — Penayangan Dashboard EWS 
 
Gambar 5.22 Hasil eksekusi SELECT — Penayangan Dashboard EWS 
 
5.2.2 Pembahasan Sistem 
Pada subbab ini, pembahasan sistem merupakan tahap penerjemahan rancangan 
wireframe ke dalam bentuk visual fungsional yang menjadi titik interaksi utama antara 
pengguna dengan sistem manajemen proyek. Seluruh elemen antarmuka—mulai dari 
halaman login, dashboard analitik manajer dengan metrik SPI, modul laporan harian 
proyek keseluruhan, hingga manajemen eskalasi—diwujudkan dengan mengutamakan 
konsistensi visual dan kemudahan navigasi guna mendukung efisiensi operasional.

<!-- page 92 -->

 
 
79 
 
 
 
 
 
 
 
1. Halaman Autentikasi 
Halaman Autentikasi merupakan titik masuk seluruh pengguna sebelum dapat 
mengakses fitur sistem. Halaman ini terdiri dari halaman pembuka publik dan halaman 
login yang memvalidasi kredensial. 
a. Halaman Beranda 
Gambar 5.23 menampilkan halaman beranda sebagai gerbang akses utama 
aplikasi. Antarmuka ini mengadopsi desain minimalis yang mendukung tema terang 
maupun gelap, dengan aksen gradien pada tipografi dan tombol "Sign In" sebagai fokus 
visual. Halaman ini memfasilitasi tahap awal autentikasi yang secara otomatis 
mengarahkan pengguna menuju dashboard manajer atau halaman input operasional 
proyek keseluruhan bagi teknisi, sesuai dengan konfigurasi RBAC sistem. 
b. Halaman Login  
Gambar 5.24 mengilustrasikan implementasi antarmuka halaman autentikasi 
yang difungsikan sebagai gerbang keamanan utama sistem. Dirancang menggunakan 
pola tata letak split-screen, sisi kiri antarmuka menonjolkan identitas visual aplikasi 
beserta ringkasan kapabilitas komputasinya, sementara sisi kanan secara spesifik 
Gambar 5.23 Halaman Beranda

<!-- page 93 -->

 
 
80 
 
 
 
 
 
 
 
memfasilitasi modul masukan kredensial. Secara sistemik, halaman ini mengeksekusi 
proses verifikasi identitas pengguna untuk memastikan bahwa setiap sesi yang berhasil 
masuk akan langsung diarahkan ke ruang kerja yang relevan sesuai dengan parameter 
hak akses yang telah dikonfigurasi. 
 
2. Halaman Manajer  
Halaman-halaman ini ditujukan untuk manajer proyek dan administrator 
sistem. Menyediakan kapabilitas pengawasan penuh terhadap proyek, klien, anggaran, 
dan eskalasi 
a. Halaman Dashboard Manajer 
Gambar 5.25 menampilkan Dashboard Manajer sebagai pusat pemantauan 
proyek berjalan. Antarmuka ini memvisualisasikan metrik analitik utama—seperti rata-
rata SPI, indikator peringatan dini (EWS), spanduk eskalasi aktif, serta statistik tugas—
guna mempercepat pengambilan keputusan manajerial. Halaman ini juga dilengkapi 
dengan grafik interaktif dan dukungan peralihan tema terang atau gelap pada bilah 
navigasi. Dashboard ini bertindak sebagai muara informasi yang mengonversi 
Gambar 5.24 Halaman Login

<!-- page 94 -->

 
 
81 
 
 
 
 
 
 
 
akumulasi data laporan harian proyek menjadi metrik performa yang siap dianalisis. 
Melalui visualisasi SPI dan EWS yang terpusat ini, manajer dapat langsung 
mengevaluasi kesehatan proyek dan mempercepat proses pengambilan keputusan 
manajerial, sehingga kendala operasional di lapangan dapat tertangani dengan cepat 
dan tepat sasaran. 
 
b. Halaman Proyek 
Gambar 5.26 menampilkan halaman "Proyek" berformat tabel interaktif yang 
memusatkan informasi profil, metrik SPI, dan indikator kesehatan proyek. Antarmuka 
ini dilengkapi pencarian adaptif, penyaringan kategori, dan pelabelan warna peringatan 
real-time guna mempermudah manajer mengevaluasi portofolio, melacak progres dari 
akumulasi laporan, serta merespons anomali jadwal. Tabel ini juga didukung fitur 
paginasi untuk menjaga stabilitas performa saat memuat banyak data. Selain itu, setiap 
baris data dapat langsung diakses untuk melihat rincian spesifik, sehingga pengawasan 
operasional PT SHI berjalan lebih komprehensif. 
Gambar 5.25 Halaman Dashboard Manajer

<!-- page 95 -->

 
 
82 
 
 
 
 
 
 
 
 
c. Halaman Detail Proyek 
Gambar 5.27 menampilkan halaman Detail Proyek yang berfungsi sebagai 
pusat evaluasi performa operasional guna mengilustrasikan keberhasilan sistem dalam 
mengonversi data mentah menjadi informasi manajerial. Antarmuka ini menyajikan 
komparasi antara PV dengan EV yang ditarik dari akumulasi laporan harian proyek 
keseluruhan, sekaligus menampilkan luaran perhitungan metrik SPI beserta status 
peringatannya secara presisi untuk memvalidasi alur komputasi. Selain kalkulasi 
metrik utama, sistem turut memecah indikator performa ke tingkat tugas yang lebih 
terperinci melalui representasi papan Kanban dan matriks beban kerja teknisi. Melalui 
integrasi data yang terpusat ini, sistem memfasilitasi manajer untuk melacak sumber 
anomali secara akurat—seperti mendeteksi tugas yang telah melewati tenggat atau 
yang membutuhkan lembur—sehingga pengambilan keputusan teknis di PT SHI dapat 
dieksekusi secara lebih cepat dan terukur. 
Gambar 5.26 Halaman Proyek

<!-- page 96 -->

 
 
83 
 
 
 
 
 
 
 
 
d. Halaman Laporan Keseluruhan Proyek 
Gambar 5.28 menampilkan halaman antarmuka Halaman Laporan Keseluruhan 
Proyek yang difungsikan sebagai modul agregasi dan rekapitulasi data operasional 
secara komprehensif. Antarmuka ini menyajikan ringkasan keseluruhan portofolio 
proyek dalam format tabular, mengintegrasikan parameter administratif dengan hasil 
kalkulasi metrik SPI dan indikator peringatan dini. Selain memfasilitasi pembaruan 
status pengerjaan secara cepat melalui fitur inline dropdown, halaman ini juga 
dilengkapi dengan instrumen ekstraksi data ke dalam format cetak (PDF) maupun 
spreadsheet (Excel). Keberadaan modul pelaporan ini sangat esensial untuk 
mengakomodasi kebutuhan Manajer dalam mendokumentasikan performa riil proyek 
dan menyusun laporan pertanggungjawaban berdasarkan akumulasi data lapangan 
secara efisien. 
Gambar 5.27 Halaman Detail Proyek

<!-- page 97 -->

 
 
84 
 
 
 
 
 
 
 
 
 
3. Halaman Teknisi 
Halaman-halaman teknisi dirancang untuk pemakaian di lapangan, 
memprioritaskan kecepatan input data tugas, unggah bukti, dan pelaporan kendala 
melalui eskalasi. 
a. Halaman Dashboard Teknisi 
Gambar 5.29 menampilkan antarmuka dashboard khusus untuk pengguna 
dengan hak akses Teknisi. Berbeda dengan dashboard manajerial yang berfokus pada 
seluruh proyek, halaman ini dirancang khusus untuk merangkum beban kerja 
operasional individu. Antarmuka ini menyajikan metrik visual mengenai status 
penyelesaian tugas harian, alokasi waktu pengerjaan, serta eskalasi isu yang sedang 
ditangani. Fitur ini membantu Teknisi memantau produktivitas pribadinya agar lebih 
terorganisasi, sekaligus mempermudah mereka dalam menyusun pelaporan harian yang 
menjadi sumber data utama bagi sistem. 
Gambar 5.28 Halaman Laporan Keseluruhan Proyek

<!-- page 98 -->

 
 
85 
 
 
 
 
 
 
 
 
Gambar 5.29 Halaman Dashboard Teknisi 
b. Halaman Proyek Teknisi  
Gambar 5.30 menampilkan halaman antarmuka "Proyek Saya" yang diakses 
melalui otorisasi tingkat Teknisi. Halaman ini mengadopsi tata letak berbasis kartu 
untuk menyaring dan menampilkan entitas proyek secara spesifik berdasarkan 
penugasan individu. Setiap kartu menyajikan konteks operasional lapangan secara 
ringkas, seperti detail klien dan lokasi pengerjaan, serta dilengkapi dengan progress bar 
yang mengukur persentase penyelesaian tugas khusus teknisi tersebut. Fungsionalitas 
pemilahan data ini dirancang secara ergonomis untuk meminimalisasi distraksi 
informasi, sehingga Teknisi dapat berfokus penuh pada penyelesaian porsi kerja 
spesifik mereka di setiap proyek.

<!-- page 99 -->

 
 
86 
 
 
 
 
 
 
 
 
c. Halaman Tugas Teknisi 
Gambar 5.31 menampilkan antarmuka "Tugas Saya" yang dirancang untuk 
memfasilitasi alur kerja operasional teknisi melalui visualisasi papan Kanban. 
Halaman ini secara dinamis mengategorikan rincian penugasan berdasarkan status 
pengerjaan aktual, mulai dari belum mulai, dalam proses, hingga selesai atau lembur. 
Antarmuka ini bertindak sebagai titik data entry krusial dalam ekosistem pelaporan 
sistem manajemen; setiap pembaruan status tugas oleh teknisi akan langsung 
terakumulasi sebagai penyusun data laporan harian untuk proyek secara keseluruhan. 
Masukan primer inilah yang kemudian dikalkulasi secara real-time menjadi nilai EV 
guna menghasilkan metrik analitik SPI secara presisi pada dashboard manajer. 
Gambar 5.30 Halaman Proyek per Teknisi

<!-- page 100 -->

 
 
87 
 
 
 
 
 
 
 
 
Gambar 5.31 Halaman Tugas Teknisi 
5.2.3 Pengujian 
Metode yang digunakan pada tahap ini adalah pengujian Black Box. Pendekatan 
ini dipilih karena evaluasi difokuskan pada fungsionalitas input dan output perangkat 
lunak—seperti akurasi perekaman laporan harian, ketepatan kalkulasi SPI, dan respons 
pemicu indikator EWS pada dashboard—tanpa perlu meninjau struktur internal dari 
kode program. Pengujian dilakukan berdasarkan skenario interaksi langsung antara 
aktor (Manajer dan Teknisi) dengan sistem. 
 
Tabel 5.1 Pengujian Black Box Sistem 
No 
ID 
Pengujian 
Deskripsi 
Skenario 
Hasil 
Diharapkan 
Hasil Aktual 
Status 
1 
TC-
AUTH-01 
Manajer 
melakukan 
login ke dalam 
sistem 
menggunakan 
kredensial 
Sistem berhasil 
melakukan 
autentikasi 
kredensial dan 
merender 
dashboard utama 
Autentikasi 
berhasil dan 
dashboard 
Manajer 
dirender 
dengan tepat. 
Valid

<!-- page 101 -->

 
 
88 
 
 
 
 
 
 
 
No 
ID 
Pengujian 
Deskripsi 
Skenario 
Hasil 
Diharapkan 
Hasil Aktual 
Status 
otorisasi yang 
valid. 
dengan RBAC 
tingkat Manajer 
secara presisi. 
2 
TC-
AUTH-02 
Teknisi 
melakukan 
login ke dalam 
sistem 
operasional 
menggunakan 
kredensial 
yang terdaftar. 
Sistem 
memproses 
autentikasi 
secara valid dan 
mengarahkan 
pengguna ke 
halaman kanban 
khusus Teknisi 
sesuai 
konfigurasi role. 
Autentikasi 
Teknisi 
berhasil 
diproses dan 
halaman 
kanban 
ditampilkan. 
Valid 
3 
TC-
AUTH-03 
Teknisi 
menginisiasi 
upaya untuk 
mengakses 
halaman 
dashboard 
Manajer 
melalui 
manipulasi 
URL langsung. 
Sistem 
mengeksekusi 
validasi RBAC 
dan memblokir 
akses tersebut 
sebagai bentuk 
mitigasi 
otorisasi. 
Validasi 
RBAC berhasil 
mencegah 
akses ilegal 
dari Teknisi. 
Valid 
4 
TC-MN-
01 
Manajer 
memasukkan 
entitas data 
proyek 
instalasi baru 
ke dalam 
matriks sistem 
perencanaan. 
Sistem 
melakukan 
perekaman data 
entitas secara 
presisi ke dalam 
basis data dan 
merender proyek 
baru pada daftar 
proyek. 
Perekaman 
entitas proyek 
baru pada basis 
data tervalidasi 
sukses. 
Valid 
5 
TC-MN-
02 
Manajer 
menugaskan 
Teknisi ke 
sebuah proyek 
baru dengan 
menginputkan 
rentang jadwal 
pelaksanaan. 
Sistem 
memvalidasi 
ketersediaan 
jadwal Teknisi 
terhadap matriks 
alokasi 
sebelumnya dan 
menyimpan 
Validasi 
jadwal berhasil 
dan penugasan 
Teknisi 
direkam ke 
sistem. 
Valid

<!-- page 102 -->

 
 
89 
 
 
 
 
 
 
 
No 
ID 
Pengujian 
Deskripsi 
Skenario 
Hasil 
Diharapkan 
Hasil Aktual 
Status 
penugasan jika 
tidak terjadi 
bentrok jadwal. 
6 
TC-MN-
03 
Manajer 
mengeksekusi 
mekanisme 
review gate 
dengan 
meninjau task 
evidence dari 
Teknisi dan 
memperbarui 
status menjadi 
Done. 
Sistem merekam 
persetujuan 
Manajer secara 
presisi dan 
mengubah status 
tugas dari sedang 
ditinjau menjadi 
Done di basis 
data. 
Perekaman 
mekanisme 
review gate 
dan pembaruan 
status berhasil 
dieksekusi. 
Valid 
7 
TC-MN-
04 
Manajer 
menyetujui 
penyelesaian 
tugas (review 
gate) dan 
menekan 
tombol 
konfirmasi 
untuk 
menyetujui 
bukti 
pekerjaan dari 
Teknisi. 
Framework 
Next.js 
memproses data 
secara 
asynchronous 
dan langsung 
memperbarui 
metrik SPI 
beserta indikator 
warna EWS 
tanpa perlu 
memuat ulang 
halaman (real-
time). 
Indikator 
warna EWS 
dan nilai SPI 
pada 
dashboard 
Manajer tidak 
berubah 
sampai 
halaman 
dimuat ulang 
(refresh) 
secara manual. 
Tidak 
Valid 
8 
TC-MN-
05 
Manajer 
menginputkan 
instruksi 
balasan 
sebagai 
mitigasi atas 
laporan 
eskalasi 
kendala yang 
dikirimkan 
oleh Teknisi. 
Sistem 
memproses 
instruksi balasan 
tersebut dan 
meneruskannya 
kembali ke 
halaman 
antarmuka 
Teknisi yang 
bersangkutan 
secara real-time. 
Pemrosesan 
balasan 
eskalasi 
Manajer 
berhasil 
diteruskan 
kepada 
Teknisi. 
Valid

<!-- page 103 -->

 
 
90 
 
 
 
 
 
 
 
No 
ID 
Pengujian 
Deskripsi 
Skenario 
Hasil 
Diharapkan 
Hasil Aktual 
Status 
9 
TC-TK-01 Teknisi 
melakukan 
pembaruan 
status pada 
papan kanban 
operasional 
dengan 
memindahkan 
tugas dari 
to_do menuju 
working_on_it. 
Sistem merender 
perpindahan 
status secara 
dinamis pada 
antarmuka 
kanban dan 
merekam 
perubahan 
tersebut untuk 
pemantauan 
Manajer. 
Pembaruan 
status pada 
kanban 
terekam secara 
presisi. 
Valid 
10 
TC-TK-02 Teknisi 
mengunggah 
dokumentasi 
visual sebagai 
task evidence 
untuk tugas 
operasional 
lapangan yang 
telah 
diselesaikan. 
Sistem 
memvalidasi 
format dokumen 
dan menyimpan 
task evidence 
secara presisi 
agar dapat 
ditinjau melalui 
review gate. 
Penyimpanan 
task evidence 
dari Teknisi ke 
sistem 
tervalidasi 
sukses. 
Valid 
11 
TC-TK-03 Teknisi 
mengunggah 
berkas task 
evidence 
dengan 
ekstensi file 
yang tidak 
didukung 
(misalnya .exe 
atau .zip). 
Sistem menolak 
unggahan dan 
menampilkan 
pesan peringatan 
bahwa hanya 
format 
gambar/dokumen 
yang diizinkan. 
Sistem 
menerima 
unggahan file 
.exe dan 
menyimpannya 
ke dalam 
database. 
Tidak 
Valid 
12 
TC-TK-04 Teknisi 
mengirimkan 
formulir 
laporan 
eskalasi terkait 
kendala teknis 
atau bug yang 
ditemukan di 
lapangan kerja. 
Sistem merekam 
agregasi kendala 
lapangan dan 
secara otomatis 
menampilkan 
indikator 
peringatan 
eskalasi pada 
Perekaman 
laporan 
eskalasi dan 
notifikasi ke 
Manajer 
berhasil. 
Valid

<!-- page 104 -->

 
 
91 
 
 
 
 
 
 
 
No 
ID 
Pengujian 
Deskripsi 
Skenario 
Hasil 
Diharapkan 
Hasil Aktual 
Status 
dashboard 
Manajer. 
13 
TC-TK-05 Teknisi 
mengakses 
menu Self-
Performance 
Dashboard 
sebagai bentuk 
swamonitoring 
atas capaian 
SPI 
pribadinya. 
Sistem merender 
matriks kinerja 
individu dengan 
menyajikan 
kalkulasi SPI 
berdasarkan 
agregasi 
penugasan yang 
ditangani oleh 
Teknisi 
bersangkutan. 
Matriks 
swamonitoring 
kinerja Teknisi 
berhasil 
dirender secara 
presisi. 
Valid 
14 
TC-TK-06 Teknisi 
menekan 
tombol "Kirim 
Laporan" 
berkali-kali 
secara cepat 
saat koneksi 
internet sedang 
lambat. 
Sistem secara 
otomatis 
menonaktifkan 
tombol setelah 
klik pertama 
untuk mencegah 
pengiriman data 
ganda. 
Sistem 
memproses 
setiap klik 
sebagai 
permintaan 
terpisah, 
sehingga 
menghasilkan 
rekaman 
laporan harian 
ganda di basis 
data. 
Tidak 
Valid 
15 
TC-SYS-
01 
Sistem 
merespons aksi 
persetujuan 
review gate 
dari Manajer 
yang merubah 
status 
penugasan 
menjadi Done. 
Sistem 
mengomputasi 
nilai EV secara 
otomatis 
berdasarkan 
bobot penugasan 
yang telah 
disetujui 
penyelesaiannya 
oleh Manajer. 
Komputasi EV 
oleh sistem 
berjalan secara 
akurat. 
Valid 
16 
TC-SYS-
02 
Sistem 
mengeksekusi 
mekanisme 
EWS pada saat 
periode 
Sistem 
mengomputasi 
SPI dengan 
membandingkan 
EV terhadap PV, 
Komputasi SPI 
dan penentuan 
indikator 
warna 
Valid

<!-- page 105 -->

 
 
92 
 
 
 
 
 
 
 
No 
ID 
Pengujian 
Deskripsi 
Skenario 
Hasil 
Diharapkan 
Hasil Aktual 
Status 
pelaporan 
harian 
berakhir. 
lalu merender 
indikator warna 
RAG secara 
presisi. 
berfungsi 
tepat. 
17 
TC-SYS-
03 
Sistem 
mengelola 
representasi 
daftar proyek 
pada halaman 
dashboard 
pemantauan 
Manajer. 
Sistem 
melakukan 
agregasi nilai 
SPI dan 
merender urutan 
proyek dengan 
mengutamakan 
entitas proyek 
berstatus kritis 
pada posisi 
teratas matriks. 
Agregasi 
prioritas 
proyek pada 
dashboard 
dirender 
dengan valid. 
Valid 
18 
TC-SYS-
04 
Sistem 
memproses 
input data 
alokasi 
penugasan 
Teknisi baru 
dari form entri 
yang diakses 
oleh Manajer. 
Sistem 
mengomputasi 
validasi jadwal 
untuk mencegah 
presensi jadwal 
yang bentrok 
antar proyek 
pada matriks 
penugasan 
Teknisi. 
Validasi sistem 
untuk mitigasi 
bentrok jadwal 
berfungsi 
sempurna. 
Valid 
 
5.3 Inovasi Sistem 
Subbab ini memaparkan nilai tambah dan solusi praktis yang ditawarkan oleh 
sistem dalam mengoptimalkan tata kelola proyek.  
1) Perhitungan SPI Otomatis dari Rasio Penyelesaian Tugas 
Sistem yang dikembangkan mengautomasi kalkulasi SPI melalui komparasi 
rasio antara persentase penyelesaian tugas terhadap proporsi durasi waktu berjalan. 
Pendekatan ini menghasilkan metrik SPI yang objektif, faktual, dan bebas dari 
manipulasi manual, yang kemudian ditransformasikan secara langsung menjadi grafik 
EVM. Implementasi fitur ini berfungsi sebagai instrumen bagi pihak manajemen untuk

<!-- page 106 -->

 
 
93 
 
 
 
 
 
 
 
mendeteksi deviasi jadwal secara dini tanpa bergantung pada estimasi subjektif 
pelaksana, dengan visualisasi perbandingan kurva PV dan EV dari waktu ke waktu 
yang disajikan pada Gambar 5.32. 
 
2) Gerbang Persetujuan Manajer pada Penyelesaian Tugas (Review Gate) 
Aplikasi manajemen proyek konvensional umumnya memberikan otorisasi 
penuh kepada pelaksana untuk memanipulasi penyelesaian tugas, sehingga rentan 
terhadap penutupan tugas secara prematur tanpa validasi aktual dari lapangan. Untuk 
mengatasi celah tersebut, sistem yang dikembangkan mengimplementasikan 
pemisahan wewenang secara tegas melalui mekanisme RBAC. Teknisi hanya diizinkan 
untuk memperbarui status tugas pada fase To Do dan Working on It. Sebaliknya, 
otorisasi finalisasi status Done mutlak dipegang oleh manajer setelah proses verifikasi 
terhadap lampiran bukti pekerjaan selesai dilakukan. Mekanisme review gate 
berjenjang ini menjamin bahwa setiap tugas yang dinyatakan selesai telah dievaluasi 
secara objektif oleh otoritas terkait, sehingga secara langsung meningkatkan validitas 
Gambar 5.32 Halaman Schedule Performance Index (SPI)

<!-- page 107 -->

 
 
94 
 
 
 
 
 
 
 
dan keandalan rekam data progres yang diolah oleh sistem, seperti alur validasi yang 
disajikan pada Gambar 5.33. 
 
 
3) Dashboard Performa Teknisi Berbasis Beban Kerja Aktual 
Aplikasi manajemen proyek konvensional umumnya sebatas visualisasi makro 
tanpa evaluasi performa individu, sehingga manajer sulit mengukur kapasitas dan 
distribusi beban kerja teknisi secara objektif. Mengatasi hal tersebut, sistem ini 
menghadirkan dashboard terintegrasi dengan empat dimensi visualisasi simultan: 
komposisi proyek per kategori, distribusi beban kerja teknisi, sebaran status 
penugasan, dan agregasi tenggat waktu bulanan. Pendekatan multidimensional ini 
menjadi keunggulan sistem karena memungkinkan manajer melakukan analisis 
korelasi silang antarvariabel—seperti mengidentifikasi tingkat keterlambatan 
teknisi pada kategori proyek tertentu—yang tidak diakomodasi oleh aplikasi 
konvensional. Seluruh metrik tersebut dikomputasi secara otomatis dari basis data 
Gambar 5.33 Halaman Review Gate

<!-- page 108 -->

 
 
95 
 
 
 
 
 
 
 
guna memberikan visibilitas manajerial utuh dalam satu antarmuka terpusat, 
sebagaimana diilustrasikan pada Gambar 5.34. 
Gambar 5.34 Halaman Dashboard Performa Teknisi