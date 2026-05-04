# Diagram Standard — PT Smart Home Inovasi Dashboard

Gold source: `diagram/good/`

---

## Directory Structure

```
diagram/
├── Flowchart/      Flowchart sistem (proses bisnis, fitur, analisis)
├── Activity/       Activity diagram (swimlane, per aktor)
├── Use Case/       Use case diagram
├── Class/          Class diagram
├── Sequence/       Sequence diagram
└── good/           Gold reference files (jangan diubah)
```

---

## Global Rules (berlaku untuk semua jenis diagram)

| Property | Value |
|----------|-------|
| `fillColor` | `#FFFFFF` |
| `strokeColor` | `#000000` |
| `fontColor` | `#000000` |
| Background | `#FFFFFF` |
| Grid | enabled, gridSize=10 |
| Shadow | disabled |

Caption format: italic (`fontStyle=2`), font size 11, centered bawah diagram.
Format teks: `Gambar X.X Nama Diagram.` (titik di akhir).

---

## Flowchart

**Page size:** 850 × 1100 (potret), perpanjang ke 1400 jika butuh ruang.

### Shapes

| Elemen | Style |
|--------|-------|
| Start / End | `ellipse;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=1.5;fontSize=12;fontColor=#000000;fontStyle=1;` |
| Proses | `rounded=0;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=1;fontSize=11;fontColor=#000000;` |
| I/O | `shape=parallelogram;perimeter=parallelogramPerimeter;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=1;fontSize=11;fontColor=#000000;` |
| Keputusan | `rhombus;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=1;fontSize=11;fontColor=#000000;` |

### Arrows

- Alur utama: `endArrow=block;endFill=1;strokeColor=#000000;strokeWidth=1;`
- Loop-back / cabang alternatif: `endArrow=classic;html=1;rounded=0;strokeColor=#000000;strokeWidth=1;`
- Label keputusan: tulis di `value` pada edge (bukan sebagai node terpisah), mis. `value="Y"` atau `value="N"`

---

## Activity Diagram

**Page size:** 850 × 1100 (2 lane), perpanjang sesuai kebutuhan.

### Swimlane

```
swimlane;startSize=30;fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=1.5;fontSize=11;fontStyle=1;fontColor=#000000;
```

- Header tinggi: 30px (`startSize=30`)
- Koordinat node: **lokal** relatif terhadap swimlane parent
- Edge cross-lane: `parent="1"` (root), bukan parent swimlane

### Shapes

| Elemen | Style |
|--------|-------|
| Initial node | `ellipse;aspect=fixed;fillColor=#000000;strokeColor=#000000;strokeWidth=1;` w=24 h=24 |
| Final node | `ellipse;html=1;shape=endState;fillColor=strokeColor;` w=30 h=30 |
| Aktivitas | `rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=1;fontSize=10;fontColor=#000000;` |
| Keputusan | `rhombus;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=1;fontSize=10;fontColor=#000000;` |
| Database | `shape=mxgraph.flowchart.database;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=1;fontSize=10;fontColor=#000000;` |
| Loop bar | `html=1;points=[];perimeter=orthogonalPerimeter;fillColor=strokeColor;` w=5 h=80 |

### Arrows

- Dalam satu lane (parent=lane): `endArrow=block;endFill=1;strokeColor=#000000;strokeWidth=1;`
- Cross-lane (parent=1): `endArrow=classic;html=1;rounded=0;strokeColor=#000000;strokeWidth=1;`
- Loop-back: gunakan `Array as="points"` dengan waypoint di luar semua lane (x ≈ 20, kiri margin)

---

## Use Case Diagram

**Page size:** 850 × 1100 atau lebih lebar untuk banyak aktor.

### Shapes

| Elemen | Style |
|--------|-------|
| Aktor | `shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;` |
| Use Case | `ellipse;whiteSpace=wrap;html=1;` |
| System boundary | `swimlane;startSize=0;` |

### Relationships

| Tipe | Style | Label |
|------|-------|-------|
| Association | `endArrow=classic;html=1;rounded=0;` | — |
| Include | `endArrow=classic;dashed=1;html=1;rounded=0;endFill=1;` | `<<include>>` |
| Extend | `endArrow=none;dashed=1;html=1;rounded=0;startArrow=classic;startFill=1;` | `<<extend>>` |
| Exclude | `endArrow=none;dashed=1;html=1;rounded=0;startArrow=classic;startFill=1;` | `<<exclude>>` |

---

## Sequence Diagram

**Reference standard:** Raharja University KKP — `widuri.raharja.info/index.php?title=KP1122469850`
**Page size:** 850–1400 wide (jumlah aktor + lifeline), tinggi auto-grow per panjang flow.

### Paradigma: business-process, bukan MVC

Sequence diagram menggambarkan **alur proses bisnis** antara aktor dan entitas/dokumen bisnis.
JANGAN gunakan komponen teknis (Halaman, Controller, Service, Database, API).
Lifeline merepresentasikan **objek bisnis** (Form, Dokumen, Data, Laporan), bukan layer arsitektur.

### Skema warna (UML blue, override global B&W)

| Property | Value |
|----------|-------|
| Fill | `#DAE8FC` (light blue) |
| Stroke | `#6C8EBF` (darker blue) |
| Lifeline garis & arrow | `#000000` (black, kontras) |

### Komponen

| Komponen | Bentuk | Style | Catatan |
|----------|--------|-------|---------|
| Aktor | Stick figure | `shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fillColor=#DAE8FC;strokeColor=#6C8EBF;strokeWidth=1.5;fontSize=11;fontColor=#000000;fontStyle=1;` (30×60) | Orang/peran: Pengguna, Manajer, Teknisi, Klien |
| Lifeline (objek) | Rectangle | `rounded=0;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;strokeWidth=1.5;fontSize=11;fontColor=#000000;fontStyle=1;` (160×40) | Form/Data/Dokumen: Form Login, Data Pengguna, Dashboard |
| Garis lifeline | Dashed vertical | `endArrow=none;html=1;rounded=0;dashed=1;strokeColor=#000000;strokeWidth=1;` | Putus-putus dari header ke bawah |
| Activation bar | Narrow rectangle | `rounded=0;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;strokeWidth=1;` (10×variabel) | Persegi panjang biru di lifeline saat aktif |

### Layout (alignment baseline)

Aktor stick figure & object box di-baseline di y=130:
- Actor figure: y=50, h=60 (figure 50-110, label 110-130)
- Object box: y=90, h=40 (box 90-130)
- Lifeline garis dashed mulai y=150
- Page width auto sesuai jumlah aktor+lifeline (3 partisipan ~800px, 4 ~950px)

### Penamaan lifeline (objek bisnis)

| Tipe | Contoh |
|------|--------|
| Form | `Form Login`, `Form Proyek`, `Form Bukti`, `Formulir Tugas` |
| Data | `Data Pengguna`, `Data Proyek`, `Data Tugas`, `Data Klien` |
| Dokumen | `Laporan`, `Proposal`, `Bukti Pekerjaan` |
| Tampilan | `Dashboard`, `Halaman Detail` |

### Penamaan aktor (peran)

`Pengguna`, `Manajer`, `Teknisi`, `Klien`, `Admin`. Tanpa prefix `User (...)`.
Susunan kiri→kanan: aktor utama paling kiri, lifeline objek bisnis ke kanan, aktor lain (jika ada) di paling kanan.

### Activation bar (execution specification)

Persegi panjang putih sempit di lifeline yang menunjukkan durasi objek aktif memproses pesan.
- Lebar: 10px, posisi: center pada lifeline
- Tinggi: dari y pesan masuk pertama ke y pesan keluar terakhir (+8px margin)
- Setiap aktor & lifeline yang terlibat WAJIB punya activation bar

### Messages (academic Indonesian)

| Tipe | Style | Catatan |
|------|-------|---------|
| Sync | `endArrow=block;endFill=1;html=1;rounded=0;strokeColor=#000000;strokeWidth=1;fontSize=10;align=center;verticalAlign=top;` | Panah solid, label kalimat aksi |
| Return | `endArrow=open;endFill=0;html=1;rounded=0;dashed=1;strokeColor=#000000;strokeWidth=1;fontSize=10;align=center;verticalAlign=top;` | Dashed, balik ke pemanggil |
| Self | Sync style + `Array as="points"` waypoint `(x+50, y0)` `(x+50, y1)` | Loop ke diri sendiri |

**Kosakata pesan akademik (kata kerja Indonesia formal):**
- Aksi user: `membuka`, `mengisi`, `memilih`, `mengirim`, `menetapkan`, `meminta persetujuan`
- Aksi sistem/objek: `memvalidasi`, `memverifikasi`, `memeriksa`, `menghitung`, `menyimpan`, `menampilkan`, `mengonfirmasi`
- Aksi data: `meminta data`, `mengembalikan data`, `mencatat`, `memperbarui`

JANGAN gunakan istilah teknis: SQL, GET/POST, endpoint, table name, method name, kode.

### Combined fragment: OMIT

Untuk gaya akademik (Tugas Akhir, KKP, skripsi), combined fragment (alt/loop/opt/par) DIHILANGKAN.
Sequence menampilkan **happy-path** saja secara linear atas-ke-bawah.
Conditional logic, loop, parallel cukup digambar di activity diagram.

### Narrative paragraph (wajib di naskah)

Setiap sequence diagram wajib diikuti paragraf narasi dengan format:

> Berdasarkan gambar X.X Sequence Diagram di atas terdapat: 1). N Lifeline, yaitu: [list]. 2). M Aktor, yaitu: [list]. 3). K Message yang memuat informasi-informasi tentang aktivitas yang terjadi, kegiatan yang biasa dilakukan oleh aktor tersebut.

### Caption format

`Gambar X.X Sequence Diagram [NamaKegiatan].` (italic, bold, centered, font 11)

### Generator

`diagram/ai/Sequence/_gen.py` — Python builder. Edit spec di file, jalankan `python _gen.py`, output 4 `SD_*.drawio`.

---

## PlantUML (Activity — alternatif)

Gunakan PlantUML jika diagram perlu di-render dengan tools akademik.

```plantuml
skinparam backgroundColor White
skinparam activityBackgroundColor White
skinparam activityBorderColor Black
skinparam activityFontColor Black
skinparam activityFontSize 11
skinparam arrowColor Black
skinparam swimlaneBorderColor Black
skinparam swimlaneBorderThickness 1.5
skinparam swimlaneTitleFontSize 12
skinparam swimlaneTitleFontStyle bold
skinparam swimlaneTitleFontColor Black
```

Sintaks swimlane: `|Nama Lane|`
Loop: `repeat ... repeat while (...) is (...) not (...)`
Decision dalam loop: `if (...) then (Ya) / break / else (Tidak) / ... / endif`
Fork: `fork ... fork again ... end fork`

---

## Caption Numbering

| Bab | Prefix | Contoh |
|-----|--------|--------|
| Bab 3 — Analisis & Perancangan | Gambar 3.x | Gambar 3.1 Use Case Diagram... |
| Bab 4 — Implementasi | Gambar 4.x | Gambar 4.1 Flowchart Login... |
