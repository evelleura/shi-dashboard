Daftar Use Case Aktor: Teknisi Lapangan

1. Melakukan Login (Login)

Teknisi masuk ke dalam sistem menggunakan akun yang sah. (Semua aktivitas di bawah ini memerlukan relasi <<include>> ke Login).

2. Melihat Dashboard "My Work" (View My Work Dashboard)

Deskripsi: Begitu masuk, ini adalah halaman pertama. Teknisi melihat ringkasan performa pribadinya (Nilai SPI) dan daftar tugas harian (Task Management) yang berstatus To Do atau In Progress pada shift hari itu.

3. Melihat Detail Tugas & Proyek (View Task & Project Details)

Deskripsi: Teknisi mengklik salah satu tugas di dashboard untuk melihat rincian pekerjaan, lokasi klien, instruksi spesifik dari Manajer, dan konteks proyek secara keseluruhan (agar mereka paham sedang mengerjakan bagian apa dari proyek besar tersebut).

4. Mengisi Daily Report & Pembaruan Progres (Submit Daily Report)

Deskripsi: Di penghujung shift, teknisi wajib mengisi laporan ini pada tugas yang dikerjakan.

Fitur di dalamnya (bisa digambar sebagai <<include>> atau dijelaskan di narasi):

Input Persentase (Earned Value): Memasukkan angka penyelesaian (misal: 60%).

Unggah Dokumentasi Lapangan (Fitur Tambahan): Best practice untuk instalasi Smart Home/IoT! Teknisi wajib mengunggah foto (evidence) hasil pemasangan hari itu sebagai bukti validasi progres.

Logika Rollover (Otomasi Sistem): Jika teknisi menginput progres < 100% pada akhir shift, sistem secara otomatis mengubah status tugas menjadi "Carried Over" atau "In Progress (Day 2)" agar muncul kembali di dashboard keesokan harinya.

5. Mengajukan Eskalasi / Kendala Lapangan (Flag Issue / Request Assist)

Deskripsi: Mengakomodasi ide "ganti/tambah teknisi" yang kamu sebutkan. Jika ada masalah (misal: alat rusak, klien tidak di tempat, atau butuh bantuan teknisi lain dengan spesialisasi berbeda), teknisi dapat menekan tombol Flag Issue.

Efek: Ini akan memberikan notifikasi kritis (Alert) ke Manajer Proyek, sehingga Manajer bisa melakukan revisi jadwal atau mengalokasikan teknisi tambahan untuk shift berikutnya.

6. Melihat Riwayat Proyek Selesai (View Completed History)

Deskripsi: Teknisi dapat mengakses arsip seluruh tugas dan proyek yang sudah pernah ia selesaikan (mencapai progres 100%). Ini berfungsi sebagai rekam jejak (portfolio) kinerja mereka.

==============================================

Daftar Use Case Aktor: Manajer Proyek

1. Melakukan Login (Login)

Deskripsi: Manajer Proyek harus melakukan autentikasi dengan memasukkan kredensial (username dan password) untuk mendapatkan hak akses manajerial ke dalam sistem dashboard.

2. Melihat Dashboard Portofolio Proyek (View Portfolio Dashboard)

Deskripsi: Ini adalah layar utama (landing page) bagi Manajer. Sistem menyajikan ringkasan seluruh proyek yang sedang berjalan dalam bentuk tabel atau kartu (card view).

Fungsionalitas Kunci: * Manajer dapat melihat status kesehatan seluruh proyek secara sekilas yang dikategorikan secara otomatis oleh sistem ke dalam indikator warna RAG (Red-Amber-Green).

Manajer dapat melihat daftar proyek yang diurutkan berdasarkan tingkat urgensi (proyek berstatus "Merah" atau kritis akan otomatis berada di urutan teratas sebagai bentuk Early Warning System).

3. Melihat Detail Proyek (View Project Details)

Deskripsi: Manajer memilih salah satu proyek dari dashboard utama untuk melihat rincian performa dan metrik jadwal secara mendalam.

Fungsionalitas Kunci:

Melihat Indikator SPI (Speedometer/Gauge Chart) yang menunjukkan rasio efisiensi waktu proyek saat ini.

Melihat perbandingan linier antara target rencana (Planned Value) dengan realisasi aktual (Earned Value) melalui Progress Bar ganda.

Melihat rincian daftar tugas (Task List) beserta bobot persentase masing-masing tugas.

4. Meninjau Laporan Harian & Kendala (Review Daily Reports & Issues)

Deskripsi: Manajer meninjau data historis dan laporan harian yang telah di-input oleh Teknisi Lapangan untuk proyek tertentu.

Fungsionalitas Kunci:

Memeriksa bukti dokumentasi foto yang diunggah teknisi.

Membaca catatan kendala operasional (log masalah) yang terjadi di lapangan tanpa harus menanyakan secara manual kepada teknisi, sehingga Manajer bisa memahami penyebab mengapa sebuah proyek mendapat status "Merah".

5. Menindaklanjuti Eskalasi / Status Tugas (Manage Task Escalation)

Deskripsi: Merespons logika operasional lapangan di mana tugas belum selesai 100% di akhir shiftteknisi.

Fungsionalitas Kunci:

Manajer melihat tugas yang dilaporkan terkendala atau belum selesai. Berbekal visualisasi dashboard dan catatan kendala dari teknisi, Manajer secara kognitif (bukan sistem SPK) mengambil keputusan operasional, seperti menyetujui tugas dilanjutkan ke shift berikutnya atau mengalokasikan teknisi tambahan.