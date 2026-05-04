# 3.1 Metode Penelitian (Prototyping)

**Source:** Naskah TA 04-05-26.pdf, halaman 36-37
**Bab:** BAB III - METODE PENELITIAN
**Sections covered:**
- 3.1 Metode Penelitian

**Images (1):**
- `images/p36_img1.png`

---


## 3.1 Metode Penelitian (Page 36)

Images: `images/p36_img1.png`

3.1 Metode Penelitian
Penelitian ini menggunakan metode pengembangan prototyping yang
merupakan salah satu pendekatan dalam System Development Life Cycle (SDLC).
Metode ini dipilih karena sesuai dengan tujuan penelitian untuk mengembangkan fitur
dashboard pada project management system yang sudah berjalan di PT Smart Home
Inovasi Yogyakarta, di mana diperlukan pemahaman kebutuhan pengguna secara
mendalam serta umpan balik berulang untuk menyempurnakan antarmuka dan
fungsionalitas dashboard berbasis data daily report. Pendekatan prototyping
memungkinkan pengembang untuk membuat model awal sistem (prototype) yang
kemudian dievaluasi langsung oleh pengguna—dalam hal ini Manajer Proyek dan
Teknisi Lapangan—sehingga perbaikan dapat dilakukan secara bertahap hingga
diperoleh fitur dashboard yang benar-benar sesuai dengan kebutuhan manajemen
proyek.



Gambar 3.1 Metode Penelitian

### Page 37 (cont.)

Adapun tahapan dalam metode prototyping meliputi:
1. Identifikasi Kebutuhan User: Menganalisis kebutuhan manajer dan admin PT
SHI untuk mengubah tumpukan daily report yang berupa teks menjadi informasi
visual, seperti status kesehatan proyek dan target vs aktual.
2. Prototyping: Membuat rancangan desain awal (mockup) antarmuka dashboard,
termasuk tata letak grafik, progress bar, dan indikator warna Red-Amber-Green
(RAG).
3. Uji Prototype: Mempresentasikan desain awal tersebut kepada pengguna (manajer
PT SHI) untuk dinilai apakah tampilannya sudah intuitif dan mempermudah
pemantauan.
4. Fixing Prototype / Customize: Merevisi dan menyesuaikan desain dashboard (tata
letak, jenis grafik, warna) berdasarkan masukan dari manajer pada tahap pengujian
awal.
5. Create Dashboard: Membangun antarmuka dashboard secara nyata menggunakan
framework Next.js. Pada tahap ini, komponen visual dikembangkan dan logika
otomatisasi perhitungan (SPI) ditanamkan agar sistem dapat merender ekstraksi
data daily report secara cepat dan asinkronus.
6. Uji Integritas Data: Menguji sistem menggunakan data laporan harian asli milik
PT SHI untuk memastikan perhitungan agregasi kemajuan proyek dan perubahan
warna peringatan dini (EWS) berjalan akurat.
7. Perbaikan Dashboard / Re-customize: Memperbaiki bug pada baris kode jika
masih terdapat kesalahan dalam kalkulasi agregasi data atau tampilan visual saat
pengujian.
8. Release Dashboard: Meluncurkan fitur dashboard pemantauan yang sudah stabil
ke dalam aplikasi manajemen proyek PT SHI agar siap digunakan secara
operasional.
