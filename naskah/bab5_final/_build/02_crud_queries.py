"""
CRUD query definitions for 5.2.1 Pembahasan Basis Data.
SQL uses BAB IV strict nomenclature: tb_* views with id_user/id_klien/
id_proyek/id_tugas/id_bukti/id_eskalasi columns.
Lifecycle per table: INSERT -> SELECT -> UPDATE -> DELETE.
"""

# ---------------------------------------------------------------------------
# tb_user
# ---------------------------------------------------------------------------
TB_USER = [
    {
        'op': 'INSERT',
        'sql': (
            "INSERT INTO tb_user (name, email, role, password_hash)\n"
            "VALUES ('Eko Prasetyo', 'demo.bab5@shi.co.id',\n"
            "        'technician', '$2b$10$hash...')\n"
            "RETURNING id_user, name, email, role;"
        ),
        'narr': (
            "Query INSERT pada tabel tb_user digunakan untuk menambahkan akun "
            "pengguna baru ke dalam sistem, baik berupa teknisi lapangan, "
            "manajer proyek, maupun administrator. Data yang disimpan "
            "mencakup nama lengkap, alamat surel sebagai identitas unik, "
            "peran (role) yang menentukan hak akses, serta hash kata sandi "
            "yang telah dienkripsi menggunakan bcrypt. Eksekusi perintah "
            "ini mengembalikan id_user yang dibangkitkan otomatis oleh "
            "basis data sebagai referensi pada operasi selanjutnya."
        ),
    },
    {
        'op': 'SELECT',
        'sql': (
            "SELECT id_user, name, email, role, created_at\n"
            "FROM tb_user\n"
            "WHERE role = 'technician'\n"
            "ORDER BY name;"
        ),
        'narr': (
            "Query SELECT pada tabel tb_user berfungsi untuk menarik daftar "
            "pengguna sesuai peran tertentu, dalam contoh ini seluruh "
            "teknisi lapangan. Perintah ini digunakan pada modul manajemen "
            "pengguna dan pada pemilihan teknisi saat penugasan proyek. "
            "Hasil yang ditampilkan mencakup identitas pengguna serta "
            "waktu pendaftaran sehingga manajer dapat melacak komposisi "
            "tim aktif di lapangan."
        ),
    },
    {
        'op': 'UPDATE',
        'sql': (
            "UPDATE tb_user\n"
            "SET role = 'manager'\n"
            "WHERE email = 'demo.bab5@shi.co.id'\n"
            "RETURNING id_user, name, role;"
        ),
        'narr': (
            "Query UPDATE pada tabel tb_user diimplementasikan untuk "
            "mengubah informasi pengguna yang telah terdaftar, misalnya "
            "saat terjadi promosi peran dari teknisi menjadi manajer atau "
            "pembaruan informasi profil. Klausa WHERE memastikan hanya "
            "baris yang ditargetkan yang berubah, sedangkan klausa "
            "RETURNING memberikan konfirmasi langsung atas data terbaru "
            "tanpa perlu kueri tambahan."
        ),
    },
    {
        'op': 'DELETE',
        'sql': (
            "DELETE FROM tb_user\n"
            "WHERE email = 'demo.bab5@shi.co.id'\n"
            "RETURNING id_user, name;"
        ),
        'narr': (
            "Query DELETE pada tabel tb_user digunakan untuk menghapus "
            "akun pengguna yang tidak lagi aktif, misalnya teknisi yang "
            "telah mengundurkan diri atau akun uji coba. Operasi ini "
            "dijalankan dengan klausa WHERE yang spesifik agar tidak "
            "menghapus akun lain, dan dilengkapi klausa RETURNING untuk "
            "mencatat identitas akun yang berhasil dihapus pada log audit."
        ),
    },
]

# ---------------------------------------------------------------------------
# tb_klien
# ---------------------------------------------------------------------------
TB_KLIEN = [
    {
        'op': 'INSERT',
        'sql': (
            "INSERT INTO tb_klien (name, address, phone, email, created_by)\n"
            "VALUES ('PT Demo Bab5',\n"
            "        'Jl. Demo No. 5, Yogyakarta',\n"
            "        '0274-555-0005', 'demo.bab5@klien.co.id', 3)\n"
            "RETURNING id_klien, name, phone;"
        ),
        'narr': (
            "Query INSERT pada tabel tb_klien dieksekusi setiap kali "
            "tercatat pelanggan baru yang menggunakan layanan PT Smart "
            "Home Inovasi. Data yang dimasukkan mencakup nama instansi, "
            "alamat operasional, kontak telepon, dan identifikasi "
            "pembuat data sebagai jejak audit. Eksekusi mengembalikan "
            "id_klien yang akan dijadikan referensi pada tabel tb_proyek."
        ),
    },
    {
        'op': 'SELECT',
        'sql': (
            "SELECT id_klien, name, phone, email\n"
            "FROM tb_klien\n"
            "WHERE name ILIKE '%PT%'\n"
            "ORDER BY id_klien\n"
            "LIMIT 5;"
        ),
        'narr': (
            "Query SELECT pada tabel tb_klien berfungsi untuk menarik "
            "data pelanggan beserta informasi kontak utama. Pada contoh "
            "ini, klausa ILIKE digunakan untuk mencari pelanggan korporat "
            "yang namanya diawali 'PT'. Perintah ini diimplementasikan "
            "pada modul manajemen klien serta sebagai sumber dropdown "
            "saat manajer melakukan input proyek baru."
        ),
    },
    {
        'op': 'UPDATE',
        'sql': (
            "UPDATE tb_klien\n"
            "SET phone = '0274-555-9999',\n"
            "    address = 'Jl. Demo Baru No. 99, Sleman'\n"
            "WHERE name = 'PT Demo Bab5'\n"
            "RETURNING id_klien, phone, address;"
        ),
        'narr': (
            "Query UPDATE pada tabel tb_klien dieksekusi ketika terdapat "
            "perubahan informasi pelanggan, seperti perpindahan alamat "
            "kantor atau pembaruan nomor telepon. Trigger updated_at "
            "memastikan kolom waktu pembaruan otomatis terisi, sehingga "
            "perusahaan memiliki jejak audit terhadap setiap modifikasi "
            "data pelanggan."
        ),
    },
    {
        'op': 'DELETE',
        'sql': (
            "DELETE FROM tb_klien\n"
            "WHERE name = 'PT Demo Bab5'\n"
            "RETURNING id_klien, name;"
        ),
        'narr': (
            "Query DELETE pada tabel tb_klien digunakan untuk menghapus "
            "data pelanggan yang sudah tidak aktif. Constraint ON DELETE "
            "SET NULL pada tabel tb_proyek menjaga integritas data "
            "historis—proyek lama tidak ikut terhapus, namun relasi "
            "pelanggan-nya dikosongkan agar tetap dapat ditelusuri."
        ),
    },
]

# ---------------------------------------------------------------------------
# tb_proyek
# ---------------------------------------------------------------------------
TB_PROYEK = [
    {
        'op': 'INSERT',
        'sql': (
            "INSERT INTO tb_proyek\n"
            "  (project_code, name, description, id_klien,\n"
            "   start_date, end_date, status, phase, category,\n"
            "   project_value, created_by)\n"
            "VALUES ('PRJ-DEMO-05', 'Proyek Demo Bab5',\n"
            "        'Instalasi smart lighting untuk demo bab 5',\n"
            "        1, '2026-05-15', '2026-07-15',\n"
            "        'active', 'execution', 'instalasi',\n"
            "        45000000, 3)\n"
            "RETURNING id_proyek, project_code, name, status;"
        ),
        'narr': (
            "Query INSERT pada tabel tb_proyek digunakan untuk merekam "
            "proyek baru setelah survey disetujui oleh manajer. Data "
            "mencakup kode proyek unik, nama, deskripsi pekerjaan, "
            "referensi id_klien, rentang tanggal pelaksanaan, status, "
            "fase, kategori instalasi, serta nilai kontrak. Kolom "
            "duration dihasilkan otomatis (generated column) dari "
            "selisih start_date dan end_date."
        ),
    },
    {
        'op': 'SELECT',
        'sql': (
            "SELECT p.id_proyek, p.project_code, p.name,\n"
            "       p.status, p.phase, c.name AS klien\n"
            "FROM tb_proyek p\n"
            "JOIN tb_klien c ON c.id_klien = p.id_klien\n"
            "WHERE p.status = 'active'\n"
            "ORDER BY p.start_date DESC\n"
            "LIMIT 5;"
        ),
        'narr': (
            "Query SELECT pada tabel tb_proyek dengan JOIN ke tb_klien "
            "berfungsi menampilkan daftar proyek aktif beserta nama "
            "klien terkait. Perintah ini menjadi sumber data utama "
            "halaman Data Proyek dan komponen daftar proyek pada "
            "Dashboard Early Warning System (EWS), sehingga manajer "
            "dapat memantau seluruh proyek yang sedang berjalan."
        ),
    },
    {
        'op': 'UPDATE',
        'sql': (
            "UPDATE tb_proyek\n"
            "SET status = 'completed',\n"
            "    phase = 'execution',\n"
            "    end_date = '2026-07-20'\n"
            "WHERE project_code = 'PRJ-DEMO-05'\n"
            "RETURNING id_proyek, status, phase, end_date;"
        ),
        'narr': (
            "Query UPDATE pada tabel tb_proyek dijalankan saat status "
            "proyek berubah, misalnya saat manajer menandai proyek "
            "selesai atau memperpanjang tenggat. Karena tabel ini "
            "menjadi pusat operasional, perubahan di sini memicu "
            "rekalkulasi metrik Schedule Performance Index (SPI) pada "
            "tabel kesehatan proyek dan memengaruhi indikator kesehatan "
            "proyek di dashboard."
        ),
    },
    {
        'op': 'DELETE',
        'sql': (
            "DELETE FROM tb_proyek\n"
            "WHERE project_code = 'PRJ-DEMO-05'\n"
            "RETURNING id_proyek, project_code, name;"
        ),
        'narr': (
            "Query DELETE pada tabel tb_proyek digunakan untuk "
            "menghapus proyek yang dibatalkan sebelum eksekusi dimulai. "
            "Constraint ON DELETE CASCADE pada tabel turunan "
            "(tb_penugasan_proyek, tb_tugas, tb_eskalasi) memastikan "
            "seluruh data terkait ikut terhapus, sehingga tidak ada "
            "data orphan yang membebani basis data."
        ),
    },
]

# ---------------------------------------------------------------------------
# tb_penugasan_proyek
# ---------------------------------------------------------------------------
TB_PENUGASAN = [
    {
        'op': 'INSERT',
        'sql': (
            "INSERT INTO tb_penugasan_proyek (id_proyek, id_user)\n"
            "VALUES (1, 11)\n"
            "RETURNING id_proyek, id_user, assigned_at;"
        ),
        'narr': (
            "Query INSERT pada tabel tb_penugasan_proyek dijalankan saat "
            "manajer menambahkan teknisi ke dalam suatu proyek. Tabel ini "
            "merupakan junction table dengan primary key komposit "
            "(id_proyek, id_user) yang menjamin satu teknisi hanya "
            "muncul satu kali per proyek. Kolom assigned_at terisi "
            "otomatis sebagai catatan waktu penugasan."
        ),
    },
    {
        'op': 'SELECT',
        'sql': (
            "SELECT pp.id_proyek, p.name AS proyek,\n"
            "       pp.id_user, u.name AS teknisi,\n"
            "       pp.assigned_at\n"
            "FROM tb_penugasan_proyek pp\n"
            "JOIN tb_proyek p ON p.id_proyek = pp.id_proyek\n"
            "JOIN tb_user   u ON u.id_user   = pp.id_user\n"
            "WHERE pp.id_proyek = 1;"
        ),
        'narr': (
            "Query SELECT pada tabel tb_penugasan_proyek dengan JOIN ke "
            "tb_proyek dan tb_user berfungsi menampilkan komposisi tim "
            "yang menangani sebuah proyek. Perintah ini menjadi dasar "
            "modul detail proyek pada bagian 'Tim Teknisi' serta sumber "
            "filter penugasan pada papan Kanban tugas."
        ),
    },
    {
        'op': 'UPDATE',
        'sql': (
            "UPDATE tb_penugasan_proyek\n"
            "SET assigned_at = CURRENT_TIMESTAMP\n"
            "WHERE id_proyek = 1 AND id_user = 11\n"
            "RETURNING id_proyek, id_user, assigned_at;"
        ),
        'narr': (
            "Query UPDATE pada tabel tb_penugasan_proyek digunakan untuk "
            "mereset waktu penugasan ketika teknisi ditugaskan ulang ke "
            "proyek yang sama setelah sempat dilepaskan, atau ketika "
            "manajer mereorganisasi roster tim. Karena tabel ini hanya "
            "memiliki tiga kolom, ruang lingkup UPDATE umumnya terbatas "
            "pada kolom assigned_at."
        ),
    },
    {
        'op': 'DELETE',
        'sql': (
            "DELETE FROM tb_penugasan_proyek\n"
            "WHERE id_proyek = 1 AND id_user = 11\n"
            "RETURNING id_proyek, id_user;"
        ),
        'narr': (
            "Query DELETE pada tabel tb_penugasan_proyek digunakan saat "
            "manajer mengeluarkan teknisi dari sebuah proyek, baik "
            "karena rotasi tugas maupun karena penyelesaian peran. "
            "Operasi ini bersifat soft separation—data tb_tugas tetap "
            "menyimpan riwayat siapa yang pernah mengerjakan tugas "
            "tersebut melalui kolom assigned_to."
        ),
    },
]

# ---------------------------------------------------------------------------
# tb_tugas
# ---------------------------------------------------------------------------
TB_TUGAS = [
    {
        'op': 'INSERT',
        'sql': (
            "INSERT INTO tb_tugas\n"
            "  (id_proyek, name, description, assigned_to,\n"
            "   status, due_date, sort_order, created_by)\n"
            "VALUES (1, 'Tugas Demo Bab5',\n"
            "        'Pemasangan sensor demo bab 5',\n"
            "        5, 'to_do', '2026-06-01', 99, 3)\n"
            "RETURNING id_tugas, name, status, due_date;"
        ),
        'narr': (
            "Query INSERT pada tabel tb_tugas dieksekusi saat manajer "
            "mendekomposisi proyek menjadi unit pekerjaan yang dapat "
            "diberikan kepada teknisi. Setiap tugas memiliki status "
            "awal 'to_do', tanggal jatuh tempo, dan referensi teknisi "
            "yang ditugaskan. Kolom sort_order mengatur urutan tampil "
            "pada papan Kanban."
        ),
    },
    {
        'op': 'SELECT',
        'sql': (
            "SELECT t.id_tugas, t.name, t.status, t.due_date,\n"
            "       u.name AS teknisi\n"
            "FROM tb_tugas t\n"
            "LEFT JOIN tb_user u ON u.id_user = t.assigned_to\n"
            "WHERE t.id_proyek = 1\n"
            "ORDER BY t.sort_order;"
        ),
        'narr': (
            "Query SELECT pada tabel tb_tugas dengan LEFT JOIN ke "
            "tb_user berfungsi sebagai sumber data papan Kanban "
            "Penugasan Proyek. Hasil pengambilan diurutkan berdasarkan "
            "sort_order agar tata letak kartu tugas konsisten setiap "
            "kali halaman dibuka. LEFT JOIN dipakai agar tugas yang "
            "belum di-assign tetap muncul dengan kolom teknisi NULL."
        ),
    },
    {
        'op': 'UPDATE',
        'sql': (
            "UPDATE tb_tugas\n"
            "SET status = 'in_progress',\n"
            "    status_changed_at = now()\n"
            "WHERE name = 'Tugas Demo Bab5'\n"
            "RETURNING id_tugas, status, status_changed_at;"
        ),
        'narr': (
            "Query UPDATE pada tabel tb_tugas adalah operasi paling "
            "sering dieksekusi pada sistem ini karena setiap perubahan "
            "status tugas otomatis memicu rekalkulasi SPI. Kolom "
            "status_changed_at dipakai untuk menghitung durasi tugas "
            "berada pada setiap status, sehingga sistem dapat "
            "mendeteksi tugas yang stagnan."
        ),
    },
    {
        'op': 'DELETE',
        'sql': (
            "DELETE FROM tb_tugas\n"
            "WHERE name = 'Tugas Demo Bab5'\n"
            "RETURNING id_tugas, name;"
        ),
        'narr': (
            "Query DELETE pada tabel tb_tugas dijalankan ketika tugas "
            "dibatalkan atau dirancang ulang. Constraint ON DELETE "
            "CASCADE pada tb_bukti dan tb_eskalasi memastikan seluruh "
            "lampiran dan laporan kendala yang melekat pada tugas "
            "tersebut ikut terhapus untuk menjaga konsistensi basis "
            "data."
        ),
    },
]

# ---------------------------------------------------------------------------
# tb_bukti
# ---------------------------------------------------------------------------
TB_BUKTI = [
    {
        'op': 'INSERT',
        'sql': (
            "INSERT INTO tb_bukti\n"
            "  (id_tugas, file_path, file_name, file_type,\n"
            "   file_size, uploaded_by)\n"
            "VALUES (1, '/uploads/demo_bab5.jpg',\n"
            "        'demo_bab5.jpg', 'photo', 204800, 5)\n"
            "RETURNING id_bukti, file_name, file_type, file_size;"
        ),
        'narr': (
            "Query INSERT pada tabel tb_bukti dieksekusi saat teknisi "
            "mengunggah lampiran sebagai bukti penyelesaian tugas, "
            "umumnya berupa foto instalasi, dokumen serah terima, "
            "atau tangkapan layar. Sistem menyimpan jalur berkas pada "
            "disk lokal serta metadata seperti tipe dan ukuran berkas "
            "untuk keperluan tampilan galeri."
        ),
    },
    {
        'op': 'SELECT',
        'sql': (
            "SELECT b.id_bukti, b.file_name, b.file_type,\n"
            "       b.file_size, u.name AS pengunggah\n"
            "FROM tb_bukti b\n"
            "JOIN tb_user u ON u.id_user = b.uploaded_by\n"
            "WHERE b.id_tugas = 1\n"
            "ORDER BY b.uploaded_at DESC;"
        ),
        'narr': (
            "Query SELECT pada tabel tb_bukti dengan JOIN ke tb_user "
            "berperan menampilkan galeri bukti pada halaman detail "
            "tugas. Pengurutan berdasarkan uploaded_at descending "
            "menjamin lampiran terbaru muncul paling atas, dan kolom "
            "pengunggah memberi konteks siapa teknisi yang bertanggung "
            "jawab atas bukti tersebut."
        ),
    },
    {
        'op': 'UPDATE',
        'sql': (
            "UPDATE tb_bukti\n"
            "SET description = 'Foto hasil instalasi - direvisi',\n"
            "    file_type = 'photo'\n"
            "WHERE file_name = 'demo_bab5.jpg'\n"
            "RETURNING id_bukti, description;"
        ),
        'narr': (
            "Query UPDATE pada tabel tb_bukti dipakai untuk menyunting "
            "metadata lampiran tanpa harus mengunggah ulang, misalnya "
            "menambah keterangan atau memperbaiki klasifikasi tipe "
            "berkas. Operasi ini ringan namun penting untuk menjaga "
            "kualitas informasi pada galeri bukti."
        ),
    },
    {
        'op': 'DELETE',
        'sql': (
            "DELETE FROM tb_bukti\n"
            "WHERE file_name = 'demo_bab5.jpg'\n"
            "RETURNING id_bukti, file_name;"
        ),
        'narr': (
            "Query DELETE pada tabel tb_bukti digunakan untuk membuang "
            "lampiran yang salah unggah atau sudah tidak relevan. "
            "Penghapusan record di basis data idealnya disertai "
            "penghapusan berkas fisik pada disk lokal melalui pipeline "
            "aplikasi agar tidak menyisakan berkas orphan."
        ),
    },
]

# ---------------------------------------------------------------------------
# tb_eskalasi
# ---------------------------------------------------------------------------
TB_ESKALASI = [
    {
        'op': 'INSERT',
        'sql': (
            "INSERT INTO tb_eskalasi\n"
            "  (id_tugas, id_proyek, reported_by,\n"
            "   title, description, status, priority)\n"
            "VALUES (1, 1, 5,\n"
            "        'Eskalasi Demo Bab5',\n"
            "        'Material kurang, perlu pengadaan ulang',\n"
            "        'open', 'high')\n"
            "RETURNING id_eskalasi, title, status, priority;"
        ),
        'narr': (
            "Query INSERT pada tabel tb_eskalasi dijalankan ketika "
            "teknisi melaporkan kendala lapangan yang menghambat "
            "penyelesaian tugas, seperti kekurangan material atau "
            "akses lokasi terbatas. Setiap eskalasi terikat pada tugas "
            "dan proyek tertentu, dilengkapi prioritas (low/medium/"
            "high/critical) yang menjadi dasar pemilahan oleh manajer."
        ),
    },
    {
        'op': 'SELECT',
        'sql': (
            "SELECT e.id_eskalasi, e.title, e.priority, e.status,\n"
            "       u.name AS pelapor, p.name AS proyek\n"
            "FROM tb_eskalasi e\n"
            "JOIN tb_user   u ON u.id_user   = e.reported_by\n"
            "JOIN tb_proyek p ON p.id_proyek = e.id_proyek\n"
            "WHERE e.status = 'open'\n"
            "ORDER BY\n"
            "  CASE e.priority\n"
            "    WHEN 'critical' THEN 1\n"
            "    WHEN 'high'     THEN 2\n"
            "    WHEN 'medium'   THEN 3\n"
            "    ELSE 4 END;"
        ),
        'narr': (
            "Query SELECT pada tabel tb_eskalasi dirancang untuk "
            "menampilkan daftar laporan terbuka diurutkan berdasarkan "
            "prioritas dengan klausa CASE. Hasil pengambilan ini menjadi "
            "konten utama halaman Manajemen Eskalasi pada antarmuka "
            "manajer, sehingga isu kritikal selalu muncul di urutan "
            "teratas."
        ),
    },
    {
        'op': 'UPDATE',
        'sql': (
            "UPDATE tb_eskalasi\n"
            "SET status = 'resolved',\n"
            "    resolved_by = 3,\n"
            "    resolved_at = now(),\n"
            "    resolution_notes = 'Material tambahan tiba 17/05/26.'\n"
            "WHERE title = 'Eskalasi Demo Bab5'\n"
            "RETURNING id_eskalasi, status, resolved_by;"
        ),
        'narr': (
            "Query UPDATE pada tabel tb_eskalasi dijalankan ketika "
            "manajer menutup laporan kendala setelah solusi dijalankan. "
            "Kolom resolved_by, resolved_at, dan resolution_notes "
            "memberi jejak audit lengkap mengenai siapa yang menutup, "
            "kapan, dan bagaimana penyelesaiannya. Sistem kemudian "
            "menonaktifkan badge eskalasi pada tugas terkait."
        ),
    },
    {
        'op': 'DELETE',
        'sql': (
            "DELETE FROM tb_eskalasi\n"
            "WHERE title = 'Eskalasi Demo Bab5'\n"
            "RETURNING id_eskalasi, title;"
        ),
        'narr': (
            "Query DELETE pada tabel tb_eskalasi digunakan untuk "
            "menghapus laporan eskalasi yang keliru atau duplikat. "
            "Penghapusan tidak memengaruhi tabel tb_tugas terkait, "
            "karena hubungan dibangun lewat foreign key id_tugas "
            "dengan aksi default. Data audit umumnya tetap dipertahankan "
            "melalui mekanisme audit log."
        ),
    },
]

ALL_TABLES = [
    ('tb_user',             TB_USER,      'Tabel User'),
    ('tb_klien',            TB_KLIEN,     'Tabel Klien'),
    ('tb_proyek',           TB_PROYEK,    'Tabel Proyek'),
    ('tb_penugasan_proyek', TB_PENUGASAN, 'Tabel Penugasan Proyek'),
    ('tb_tugas',            TB_TUGAS,     'Tabel Tugas'),
    ('tb_bukti',            TB_BUKTI,     'Tabel Bukti'),
    ('tb_eskalasi',         TB_ESKALASI,  'Tabel Eskalasi'),
]
