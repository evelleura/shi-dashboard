# Bagan Alur Proses Bisnis Sebelum Pengembangan Dashboard
## PT Smart Home Inovasi — Kondisi Aplikasi Tanpa Dashboard dan Otomasi

> Perusahaan sudah memiliki aplikasi untuk pencatatan proyek dan tugas.
> Namun aplikasi tersebut belum dilengkapi fitur dashboard analitik maupun otomasi pemantauan.
> Node **oranye** = keterbatasan aplikasi yang ada. Node **merah** = dampak langsung yang mendorong dibangunnya sistem baru.

---

```mermaid
flowchart TD

    START([Klien Memesan Jasa Instalasi Smart Home\nkepada PT Smart Home Inovasi])

    START --> A

    %% ── Input Data — Sudah Berjalan di Aplikasi ──────────────
    A[Manajer Proyek Membuat Data Proyek Baru\ndi Aplikasi — Nama, Jadwal, Klien, Tim] --> B

    B[Manajer Menugaskan Teknisi Lapangan\nke Proyek melalui Aplikasi] --> C

    C[Teknisi Lapangan Menerima Penugasan\ndan Mulai Bekerja di Lokasi Klien] --> D

    D[Teknisi Menginput Laporan Harian\ndan Memperbarui Status Tugas di Aplikasi] --> DB

    DB[(Seluruh Data Proyek, Tugas,\ndan Laporan Tersimpan di Database)]

    %% ── Keterbatasan Aplikasi — Tidak Ada Dashboard/Otomasi ──
    DB --> F

    F[/"⚠️ Aplikasi Hanya Menampilkan\nData dalam Bentuk Tabel Statis\nTidak Ada Grafik, Ringkasan, atau Indikator Progres"/]

    F --> G

    G[/"⚠️ Untuk Menganalisis Progres Proyek,\nManajer Harus Export Data ke Excel\nDilakukan Secara Manual dan Tidak Rutin"/]

    G --> H

    H[/"⚠️ Manajer Menghitung Sendiri Persentase Progres\ndan Deviasi Jadwal di Excel\nProses Lambat, Rawan Salah, Tidak Real-Time"/]

    H --> I

    I[/"⚠️ Tidak Ada Notifikasi atau Peringatan Otomatis\nManajer Harus Membuka Tiap Proyek\nSatu per Satu untuk Mengetahui Kondisinya"/]

    I --> J

    %% ── Titik Keputusan ───────────────────────────────────────
    J{Status\nProyek?}

    J -->|Sedang Berjalan\nTidak Ada Masalah Terdeteksi| D

    J -->|Sedang Berjalan\nProyek Sudah Terlambat\nTetapi Tidak Ada yang Memberitahu Manajer| K

    J -->|Semua Tugas\nTelah Selesai| P

    %% ── Dampak Tidak Ada EWS ──────────────────────────────────
    K[/"TIDAK ADA SISTEM PERINGATAN DINI\nKlien Menghubungi Manajer Secara Langsung\nkarena Proyek Tidak Sesuai Target Jadwal\nManajer Baru Mengetahui Masalah dari Klien"/]

    K --> L

    L[Manajer Menghubungi Teknisi\nvia Telepon atau WhatsApp\nuntuk Tindakan Penanganan Segera] --> D

    %% ── Penyelesaian ──────────────────────────────────────────
    P[Manajer Memeriksa Penyelesaian Proyek\ndan Menyusun Laporan Akhir Secara Manual]

    P --> END

    END([Proyek Selesai\nNamun Proses Pemantauan Tidak Efisien\nKeterlambatan Sulit Dideteksi Lebih Awal\nBerisiko Menurunkan Kepuasan Klien])

    %% ── Styling ───────────────────────────────────────────────
    style DB  fill:#1e40af,color:#fff,stroke:#1e3a8a
    style F   fill:#f97316,color:#fff,stroke:#ea580c
    style G   fill:#f97316,color:#fff,stroke:#ea580c
    style H   fill:#f97316,color:#fff,stroke:#ea580c
    style I   fill:#f97316,color:#fff,stroke:#ea580c
    style K   fill:#dc2626,color:#fff,stroke:#991b1b
    style END fill:#7f1d1d,color:#fff,stroke:#450a0a
```

---

## Apa yang Sudah Ada vs Apa yang Belum Ada

| Komponen | Kondisi di Aplikasi Lama | Keterangan |
|---|---|---|
| Input data proyek | Sudah ada | Manajer bisa buat dan edit proyek |
| Penugasan teknisi | Sudah ada | Teknisi bisa ditugaskan ke proyek |
| Input laporan harian | Sudah ada | Teknisi bisa update status tugas |
| Penyimpanan data | Sudah ada | Data tersimpan di database |
| **Dashboard analitik** | **Belum ada** | Tidak ada grafik, ringkasan, atau indikator |
| **Kalkulasi SPI otomatis** | **Belum ada** | Manajer hitung manual di Excel |
| **Indikator kesehatan proyek** | **Belum ada** | Tidak ada status Hijau / Kuning / Merah |
| **Sistem peringatan dini (EWS)** | **Belum ada** | Keterlambatan baru diketahui dari klien |
| **Sorting prioritas proyek** | **Belum ada** | Tidak bisa langsung tahu proyek mana yang kritis |
| **Notifikasi otomatis** | **Belum ada** | Manajer harus cek manual satu per satu |

---

## Akar Masalah

Data proyek sudah masuk ke sistem secara digital, tetapi berhenti di sana.
Tidak ada lapisan analitik yang mengolah data tersebut menjadi informasi yang actionable bagi manajer.
Akibatnya, manajer tetap harus bekerja di luar aplikasi (Excel, telepon, WhatsApp) untuk melakukan
fungsi pemantauan yang seharusnya bisa diotomasi oleh sistem.
