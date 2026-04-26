# ATURAN BAKU DIAGRAM AKADEMIK
## Sistem Dashboard PT Smart Home Inovasi
### Referensi: Tabel 2.1–2.4 + Gambar 4.1–4.10 (Thesis UTY, 2026)

---

## ATURAN UMUM (Berlaku untuk Semua Diagram)

```
VISUAL STYLE:
- Warna: Hitam & putih ONLY — no fill colors, no gradients
- Garis: Tipis, solid atau dashed sesuai jenis relasi
- Font: Sans-serif, ukuran konsisten, teks singkat (maks 4 kata per node)
- Bahasa: Bahasa Indonesia untuk semua label dan nama proses
- Background: Putih bersih, tanpa grid
- Orientasi: Top-to-bottom (kecuali swimlane: left-to-right per lane)

PENAMAAN:
- Nama diagram: Format "Gambar X.Y [Nama Diagram]" — penomoran mengikuti bab
- Caption: Di BAWAH gambar, italic, contoh: "Gambar 4.5 Use Case Diagram."
- Nama proses: Kata kerja + objek (contoh: "Validasi Login", "Tampil Dashboard")
- Nama aktor: Sesuai role system (Teknisi, Project Manager, Admin)
- Nama class: PascalCase (contoh: ProjectHealth, DailyReport)
- Nama method/field: camelCase (contoh: getSpiValue(), projectId: String)

REFERENSI SILANG:
- Diagram dibuat per use case / per alur utama
- Connector antar halaman memakai lingkaran dengan huruf (A, B, C...)
- Setiap diagram wajib direferensi dalam teks: "dapat dilihat pada Gambar X.Y"
```

---

## 1. FLOWCHART

### Simbol Wajib (Tabel 2.1)

| No | Simbol | Bentuk | Fungsi |
|----|--------|--------|--------|
| 1 | Terminator | Oval/Ellipse rounded | Titik START dan END alur |
| 2 | Process | Persegi panjang biasa | Proses/aksi sistem atau pengguna |
| 3 | Decision | Belah ketupat (diamond) | Percabangan kondisi Ya/Tidak |
| 4 | Input/Output | Jajar genjang (parallelogram) | Input dari user / output ke user |
| 5 | Flow Line | Panah berarah | Menghubungkan simbol, arah alur |
| 6 | On-Page Ref | Lingkaran kecil + huruf | Koneksi dalam halaman sama (A, B...) |
| 7 | Off-Page Ref | Pentagon bawah (arrow shape) | Koneksi ke halaman lain |
| 8 | Predefined Process | Persegi + garis vertikal kanan-kiri | Proses sudah didefinisikan di tempat lain |
| 9 | Document I/O | Persegi bawah melengkung | Input/output berbentuk dokumen |
| 10 | Delay | Bentuk D miring | Tunggu / delay proses |
| 11 | Manual Operation | Trapesium terbalik | Proses yang dilakukan manual oleh user |
| 12 | Manual Input | Persegi dengan sisi miring atas | Input manual dari user |
| 13 | Annotation | Kurung siku L terbuka | Keterangan tambahan |

### Aturan Layout & Konvensi

```
LAYOUT:
- Orientasi: Top-to-bottom
- START selalu di atas, END di bawah
- Satu jalur utama di tengah, cabang ke kiri/kanan
- Gunakan On-Page Reference (lingkaran huruf) jika diagram terlalu panjang
- Label pada cabang Decision: "Y" (kanan/bawah) dan "N" (kiri/bawah)
- Loop/iterasi: panah balik ke atas dengan elbow connector

VISUAL:
- Tidak ada warna fill — semua simbol outline hitam, background putih
- Ukuran Decision diamond lebih besar dari Process box
- Teks di dalam simbol: tengah-tengah, word wrap jika perlu
- Panah: Satu arah, tanpa label kecuali di cabang Decision (Y/N)

PENAMAAN PROSES:
- Gunakan kata kerja aktif: "Validasi Kredensial", "Tampil Dashboard"
- Bukan deskripsi panjang: BUKAN "Sistem melakukan validasi..."
- Singkat: max 4 kata per kotak
```

### Template Prompt Generate Flowchart

```
Buat flowchart akademik standar (hitam-putih) untuk menggambarkan [NAMA PROSES].
Gunakan simbol berikut secara KETAT:
- Terminator (oval): hanya untuk "Start" dan "End"
- Process (rectangle): setiap langkah proses
- Decision (diamond): setiap percabangan dengan label "Y" dan "N"
- Flow Line (arrow): semua koneksi antar simbol
- On-Page Reference (small circle + letter): jika diagram terlalu panjang

Aturan visual:
- Hitam & putih, tidak ada warna fill
- Orientasi top-to-bottom
- Bahasa Indonesia untuk semua label
- Teks singkat (max 4 kata per simbol)
- Caption di bawah: "Gambar [X.Y] [Judul Flowchart]."

Konteks sistem: Dashboard manajemen proyek PT Smart Home Inovasi
Aktor yang terlibat: [Teknisi/Project Manager/Admin/Sistem]
Alur yang digambarkan: [DESKRIPSI ALUR]
```

### Daftar Flowchart yang Perlu Dibuat (Project SHI)

```
1. Flowchart Login & Autentikasi (role-based redirect)
2. Flowchart Proses Bisnis Berjalan (manual reporting — as-is)
3. Flowchart Kalkulasi SPI (triggered saat task status berubah)
4. Flowchart Alur Persetujuan Survey → Eksekusi Proyek
5. Flowchart Upload Evidence Task
```

---

## 2. USE CASE DIAGRAM

### Simbol Wajib (Tabel 2.2)

| No | Simbol | Bentuk | Fungsi |
|----|--------|--------|--------|
| 1 | Actor | Stickman + nama di bawah | Pengguna/sistem lain yang berinteraksi |
| 2 | Use Case | Ellipse/oval + teks di dalam | Fungsionalitas yang disediakan sistem |
| 3 | Association | Garis solid | Hubungan aktor ↔ use case |
| 4 | System Boundary | Persegi panjang + nama sistem | Batas ruang lingkup sistem |
| 5 | Include | Panah putus-putus + `<<include>>` | Use case wajib memanggil UC lain |
| 6 | Extend | Panah putus-putus + `<<extend>>` | Use case opsional memperluas UC lain |

### Aturan Layout & Konvensi

```
POSISI:
- Aktor: Di LUAR system boundary (kiri atau kanan kotak sistem)
- Aktor internal (sistem lain): bisa di kanan boundary
- Use cases: Di DALAM system boundary
- Include/Extend target: Bisa di dalam atau di luar boundary sesuai konteks

RELASI:
- Association: Garis solid, tanpa arah panah (bukan arrow)
- Include: ---<<include>>---> (arah dari use case pemanggil ke yang dipanggil)
- Extend: ---<<extend>>---> (arah dari ekstensi ke use case yang diperluas)
- Stereotype ditulis dalam huruf italic atau regular antara <<>>

VISUAL:
- System boundary: Rectangle dengan nama sistem di pojok kiri atas (bold)
- Aktor: Stickman sederhana, nama tepat di bawahnya
- Use case: Oval, teks di tengah, hitam-putih
- Tidak ada warna fill pada elemen

PENAMAAN USE CASE:
- Format: Kata kerja + objek → "Kelola Proyek", "Lihat Dashboard"
- Bukan "Sistem melakukan..."
- Capitalize each word
```

### Template Prompt Generate Use Case Diagram

```
Buat Use Case Diagram UML akademik (hitam-putih) untuk sistem Dashboard PT Smart Home Inovasi.

Aktor yang terlibat:
1. Teknisi (Field Technician) — pengguna eksternal, akses terbatas
2. Project Manager — pengguna internal, akses penuh proyek
3. Admin — pengelola sistem, akses user management

System Boundary: Sistem Dashboard PT Smart Home Inovasi

Gunakan simbol KETAT sesuai standar:
- Actor: stickman + nama di bawah, posisi di LUAR boundary
- Use Case: oval, di DALAM boundary
- Association: garis solid (tanpa panah)
- Include: --<<include>>--> untuk UC wajib
- Extend: --<<extend>>--> untuk UC opsional
- System Boundary: rectangle dengan nama sistem di pojok kiri atas

Aturan visual:
- Hitam & putih, tanpa warna fill
- Bahasa Indonesia
- Caption: "Gambar [X.Y] Use Case Diagram."

Use cases per aktor:
[MASUKKAN DAFTAR UC PER AKTOR]
```

### Daftar Use Case per Aktor (Project SHI)

```
TEKNISI:
- Login Sistem
- Lihat Proyek yang Ditugaskan
- Lihat Detail Proyek
- Kelola Task (Update Status: to_do → working_on_it)
- Upload Evidence Task
- Lihat Kanban Board
- Lihat Tabel Task

PROJECT MANAGER:
- Login Sistem
- Kelola Klien (CRUD)
- Kelola Proyek (CRUD)
- Assign Task ke Teknisi
- Kelola Task (Update Status: → done)
- Approve Survey Proyek
- Lihat Dashboard Ringkasan
- Lihat Health Status Proyek (SPI)
- Kelola Budget Proyek
- Kelola Material Proyek
- Lihat Laporan Kemajuan

ADMIN:
- Login Sistem
- Kelola User (CRUD)
- Lihat Semua Data Sistem

INCLUDE RELATIONSHIPS:
- Login Sistem <<include>> Validasi Kredensial
- Upload Evidence <<include>> Validasi File
- Approve Survey <<include>> Cek Status Survey

EXTEND RELATIONSHIPS:
- Kelola Task <<extend>> Upload Evidence
- Lihat Dashboard <<extend>> Export Laporan
```

---

## 3. ACTIVITY DIAGRAM

### Simbol Wajib (Tabel 2.3)

| No | Simbol | Bentuk | Fungsi |
|----|--------|--------|--------|
| 1 | Start Point | Lingkaran hitam penuh (●) | Awal alur aktivitas |
| 2 | End Point | Lingkaran dengan titik dalam (◎) | Akhir seluruh aktivitas |
| 3 | Activity | Rounded rectangle | Satu tindakan/aktivitas |
| 4 | Decision | Belah ketupat (◇) | Percabangan kondisi (Ya/Tidak) |
| 5 | Merge | Belah ketupat konvergen (◇) | Menggabungkan alur yang bercabang |
| 6 | Control Flow | Panah solid berarah | Urutan eksekusi aktivitas |
| 7 | Fork Node | Garis tebal horizontal (split) | Membagi ke aktivitas paralel |
| 8 | Join Node | Garis tebal horizontal (join) | Menyatukan aktivitas paralel |
| 9 | Swimlane | Kolom vertikal dengan header | Memisahkan tanggung jawab per aktor |

### Aturan Layout & Konvensi

```
SWIMLANE (WAJIB):
- Selalu gunakan swimlane untuk sistem dengan banyak aktor
- Header swimlane: Nama aktor/sistem, bold, di atas kolom
- Urutan kolom dari kiri ke kanan:
  [User/Aktor] | [Sistem Dashboard SHI] | [Sistem Eksternal (DB/API)]

LAYOUT PER SWIMLANE:
- Start point: di lane aktor yang memulai (biasanya lane User)
- End point: di lane yang menyelesaikan proses
- Aktivitas: di lane yang bertanggung jawab atas aktivitas tersebut
- Panah boleh melewati batas antar-lane

DECISION:
- Label Y/N atau [Kondisi] pada keluar diamond
- Merge menggunakan diamond kosong yang sama bentuknya
- Ya biasanya ke bawah, Tidak ke kiri atau kanan

VISUAL:
- Hitam & putih, tidak ada fill
- Start = filled circle hitam
- End = lingkaran dengan lingkaran kecil di dalam (bull's eye)
- Aktivitas = rounded rectangle (sudut melengkung)
- Control flow = panah

PENAMAAN AKTIVITAS:
- Kata kerja aktif: "Validasi Login", "Tampil Menu Dashboard"
- Singkat, max 4 kata
- Konsisten: satu kata benda untuk satu entitas
```

### Template Prompt Generate Activity Diagram

```
Buat Activity Diagram UML akademik (hitam-putih) untuk menggambarkan alur [NAMA PROSES]
pada sistem Dashboard PT Smart Home Inovasi.

Gunakan 3 swimlane:
- Lane 1: [Nama Aktor — contoh: Teknisi / Project Manager]
- Lane 2: Sistem Dashboard SHI
- Lane 3: [Sistem Eksternal jika ada — contoh: Database PostgreSQL]

Simbol yang WAJIB digunakan:
- Start Point: lingkaran hitam penuh (●) — di lane aktor yang memulai
- End Point: bull's-eye (◎) — di lane yang menyelesaikan proses
- Activity: rounded rectangle dengan teks aksi singkat (Bahasa Indonesia)
- Decision: diamond dengan label percabangan (Y/N atau kondisi)
- Merge: diamond tanpa label (menggabungkan alur)
- Control Flow: panah berarah
- Fork/Join Node: garis tebal horizontal (jika ada aktivitas paralel)
- Swimlane: kolom vertikal, header bold di atas

Aturan visual:
- Hitam & putih, tidak ada warna fill
- Teks singkat (max 4 kata per aktivitas)
- Bahasa Indonesia
- Caption di bawah: "Gambar [X.Y] Activity Diagram [Nama Proses]."

Alur yang digambarkan:
[DESKRIPSIKAN LANGKAH-LANGKAH ALUR]
```

### Daftar Activity Diagram yang Perlu Dibuat (Project SHI)

```
1. Activity Diagram Login (aktor: User | Sistem SHI | --)
2. Activity Diagram Kelola Task oleh Teknisi (Teknisi | Sistem SHI | Database)
3. Activity Diagram Approve Survey Proyek (Project Manager | Sistem SHI | Database)
4. Activity Diagram Kalkulasi & Update SPI (Sistem SHI | Database | --)
5. Activity Diagram Upload Evidence (Teknisi | Sistem SHI | File Storage)
6. Activity Diagram Lihat Dashboard (Project Manager | Sistem SHI | Database)
```

---

## 4. CLASS DIAGRAM

### Simbol Wajib (Tabel 2.4)

| No | Simbol | Bentuk | Fungsi |
|----|--------|--------|--------|
| 1 | Class | Persegi 3 bagian: [ClassName] / [+ attr: Type] / [+ method(): Type] | Kelas: Nama, Atribut, Operasi |
| 2 | Association | Garis solid + multiplicity | Hubungan antar 2 kelas |
| 3 | Attribute | `+ nama: Tipe` (di bagian tengah) | Properti/data kelas |
| 4 | Operation | `+ nama(param): Tipe` (bagian bawah) | Fungsi/method kelas |
| 5 | Generalization | Panah solid dengan kepala terbuka → | Inheritance (is-a) |
| 6 | Aggregation | Garis solid + diamond terbuka ◇ | "Bagian dari" yang bisa dipisah |
| 7 | Composition | Garis solid + diamond terisi ◆ | "Bagian dari" yang tidak bisa dipisah |
| 8 | Realization | Panah putus + kepala terbuka ◁----- | Implementasi interface |
| 9 | Dependency | Panah putus ----> | Ketergantungan khusus antar kelas |

### Aturan Layout & Konvensi

```
STRUKTUR CLASS BOX:
┌──────────────────┐
│   ClassName      │  ← Bold, PascalCase
├──────────────────┤
│ - privateAttr: T │  ← "-" private, "+" public, "#" protected
│ + publicAttr: T  │  ← format: [visibilitas] nama: Tipe
├──────────────────┤
│ + method(): T    │  ← format: [visibilitas] nama(param: Tipe): ReturnType
│ - privMethod()   │
└──────────────────┘

TIPE DATA STANDAR:
- String, Integer, Boolean, Float, Date, DateTime
- List<Type> untuk koleksi
- Enum untuk status: status: StatusEnum

RELASI:
- Label relasi ditulis di atas/tengah garis: "has", "belongs to", "calculates"
- Multiplicity: 1, 0..*, 1..*, 0..1, di kedua ujung relasi
- Composition (◆): parent class memiliki child, child tidak bisa berdiri sendiri
- Aggregation (◇): parent memiliki child, child bisa berdiri sendiri

LAYOUT:
- Class utama/central di tengah
- Dependency mengalir dari kiri ke kanan
- Inheritance dari bawah (child) ke atas (parent)
- Tidak ada crossing lines jika bisa dihindari

VISUAL:
- Hitam & putih
- Garis horizontal memisahkan 3 compartment
- Bold untuk nama class
```

### Template Prompt Generate Class Diagram

```
Buat Class Diagram UML akademik (hitam-putih) untuk sistem Dashboard PT Smart Home Inovasi.

Setiap class WAJIB memiliki 3 compartment:
1. Nama Class (PascalCase, bold)
2. Atribut: format "+ namaAtribut: TipeData" (+ = public, - = private)
3. Operasi/Method: format "+ namaMethod(param: Tipe): ReturnType"

Gunakan relasi berikut sesuai kebutuhan:
- Composition (diamond ◆): objek child tidak bisa hidup tanpa parent
- Aggregation (diamond ◇): objek child bisa berdiri sendiri
- Association (garis solid + multiplicity): hubungan dua arah
- Dependency (panah putus-putus): ketergantungan
- Generalization (panah solid ke parent): inheritance

Aturan visual:
- Hitam & putih, tidak ada warna fill
- Multiplicity (1, 0..*, 1..*) di kedua ujung relasi
- Label relasi di atas/bawah garis (contoh: "Hosts", "Has", "Calculates")
- Bahasa Inggris untuk nama class/method/attribute (konvensi OOP)
- Caption di bawah: "Gambar [X.Y] Class Diagram."

Kelas yang harus ada:
[MASUKKAN DAFTAR KELAS]
```

### Daftar Class untuk Project SHI (dari Data Model)

```
User
- id: Integer
- name: String
- email: String
- role: String (technician|manager|admin)
- passwordHash: String
- createdAt: DateTime
+ login(): Boolean
+ getAssignedProjects(): List<Project>

Client
- id: Integer
- name: String
- address: String
- phone: String
- email: String
- notes: String
+ getProjects(): List<Project>

Project
- id: Integer
- name: String
- clientId: Integer
- startDate: Date
- endDate: Date
- status: String
- projectValue: Float
- phase: String (survey|execution)
- surveyApproved: Boolean
+ getSpi(): Float
+ getHealthStatus(): String
+ approveSurvey(): void

Task
- id: Integer
- projectId: Integer
- title: String
- description: String
- assignedTo: Integer
- status: String (to_do|working_on_it|done)
- dueDate: Date
- sortOrder: Integer
+ updateStatus(newStatus: String): void
+ isOvertime(): Boolean
+ isOverDeadline(): Boolean

TaskEvidence
- id: Integer
- taskId: Integer
- filePath: String
- fileName: String
- fileType: String
- uploadedBy: Integer
+ upload(file: File): void

ProjectHealth
- projectId: Integer
- spiValue: Float
- status: String (green|amber|red)
- deviationPercent: Float
- completedTasks: Integer
- totalTasks: Integer
- lastUpdated: DateTime
+ recalculate(): void
+ getStatusColor(): String

BudgetItem
- id: Integer
- projectId: Integer
- description: String
- category: String
- amount: Float
+ getTotalBudget(): Float

Material
- id: Integer
- projectId: Integer
- name: String
- quantity: Float
- unit: String
- unitPrice: Float
+ getTotalCost(): Float

RELASI:
- Client 1 --has-- 0..* Project (Composition ◆)
- Project 1 --has-- 0..* Task (Composition ◆)
- Project 1 --has-- 1 ProjectHealth (Composition ◆)
- Project 1 --has-- 0..* BudgetItem (Composition ◆)
- Project 1 --has-- 0..* Material (Composition ◆)
- Task 1 --has-- 0..* TaskEvidence (Composition ◆)
- User 0..* --assigned to-- 0..* Task (Association)
- ProjectHealth --calculates from-- Project (Dependency)
```

---

## 5. SEQUENCE DIAGRAM

> Tidak ada di PDF referensi — mengikuti standar UML yang konsisten dengan gaya visual thesis ini.

### Simbol Standar UML

| No | Simbol | Bentuk | Fungsi |
|----|--------|--------|--------|
| 1 | Lifeline | Garis vertikal putus-putus | Garis hidup objek/aktor selama interaksi |
| 2 | Actor/Object | Stickman atau kotak [NamaObjek] | Partisipan dalam sequence |
| 3 | Activation Box | Persegi kecil di atas lifeline | Periode objek aktif memproses |
| 4 | Synchronous Msg | Panah solid penuh ——> | Panggilan method (menunggu balasan) |
| 5 | Return Message | Panah putus-putus <---- | Nilai kembalian dari method |
| 6 | Async Message | Panah solid setengah (terbuka) ——> | Pesan tanpa menunggu balasan |
| 7 | Self Message | Panah balik ke lifeline sendiri | Objek memanggil method sendiri |
| 8 | Alt Fragment | Kotak berlabel "alt" + [kondisi] | Percabangan kondisi |
| 9 | Loop Fragment | Kotak berlabel "loop" + [kondisi] | Pengulangan |
| 10 | Opt Fragment | Kotak berlabel "opt" + [kondisi] | Operasi opsional |

### Aturan Layout & Konvensi

```
URUTAN LIFELINE (kiri ke kanan):
[Aktor/User] → [Frontend/Browser] → [API Backend] → [Database]

VISUAL:
- Lifeline: garis putus-putus vertikal
- Activation Box: persegi tipis di atas lifeline (saat objek aktif)
- Synchronous: panah solid penuh, label di atas panah
- Return: panah putus-putus, label opsional
- Combined Fragment: kotak dengan label (alt/loop/opt) di pojok kiri atas

PENAMAAN PESAN:
- Synchronous: nama endpoint atau method → "POST /api/tasks", "validateToken()"
- Return: nilai/objek kembalian → "200 OK + task data", "JWT Token"
- Boleh campuran Bahasa Indonesia + notasi teknis

DECISION (alt fragment):
- [kondisi benar] di atas garis pemisah
- [kondisi salah / else] di bawah garis pemisah
```

### Template Prompt Generate Sequence Diagram

```
Buat Sequence Diagram UML akademik (hitam-putih) untuk menggambarkan
interaksi [NAMA PROSES] pada sistem Dashboard PT Smart Home Inovasi.

Partisipan (lifeline dari kiri ke kanan):
1. [Nama Aktor — contoh: Teknisi]
2. Browser / Frontend (React)
3. API Backend (Express.js)
4. Database (PostgreSQL)

Simbol yang WAJIB digunakan:
- Lifeline: garis vertikal putus-putus untuk setiap partisipan
- Actor: stickman untuk pengguna manusia
- Object: kotak [NamaObjek] untuk sistem/komponen
- Activation Box: persegi kecil menunjukkan waktu aktif
- Synchronous Message: panah solid penuh dengan label nama method/endpoint
- Return Message: panah putus-putus dengan label nilai kembalian
- Combined Fragment (alt/loop/opt) jika ada kondisi/loop

Aturan visual:
- Hitam & putih, tidak ada warna fill
- Label pesan: nama endpoint atau method
- Urutan dari atas ke bawah = urutan waktu
- Caption di bawah: "Gambar [X.Y] Sequence Diagram [Nama Proses]."

Alur yang digambarkan:
[DESKRIPSIKAN REQUEST-RESPONSE CHAIN]
```

### Daftar Sequence Diagram yang Perlu Dibuat (Project SHI)

```
1. Sequence Diagram Login (POST /api/auth/login)
2. Sequence Diagram Update Status Task oleh Teknisi
   (PATCH /api/tasks/:id/status — include: trigger recalculate SPI)
3. Sequence Diagram Load Dashboard (GET /api/dashboard/summary)
4. Sequence Diagram Upload Evidence (POST /api/evidence)
5. Sequence Diagram Approve Survey (PUT /api/projects/:id/approve-survey)
```

---

## MATRIKS PENGGUNAAN DIAGRAM

| Bagian Thesis | Flowchart | Use Case | Activity | Sequence | Class |
|---------------|-----------|----------|----------|----------|-------|
| Analisis Masalah (as-is) | ✓ | | | | |
| Analisis Kebutuhan | | ✓ | | | |
| Perancangan Model Proses | ✓ | ✓ | ✓ | ✓ | ✓ |

Format penomoran: `Gambar 4.X` (urutan kemunculan dalam BAB IV)

---

## QUICK REFERENCE: PERBEDAAN KUNCI

```
FLOWCHART vs ACTIVITY DIAGRAM:
- Flowchart: Logika algoritma/prosedur, TANPA swimlane, Decision = diamond
- Activity: Alur kerja multi-aktor, DENGAN swimlane, bisa parallel (Fork/Join)

USE CASE vs ACTIVITY:
- Use Case: "APA yang dilakukan" — fungsionalitas dari sudut pandang aktor
- Activity: "BAGAIMANA cara melakukannya" — langkah detail per fungsionalitas

CLASS vs SEQUENCE:
- Class: Struktur statis (atribut, method, relasi antar kelas)
- Sequence: Interaksi dinamis (urutan pemanggilan method antar objek)

INCLUDE vs EXTEND (Use Case):
- <<include>>: Use case WAJIB selalu memanggil UC lain (mandatory)
  Contoh: "Update Task" <<include>> "Validasi Autentikasi"
- <<extend>>: Use case OPSIONAL memperluas UC lain (kondisional)
  Contoh: "Lihat Dashboard" <<extend>> "Export Laporan CSV"
```
