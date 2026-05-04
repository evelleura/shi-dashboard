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

**Page size:** 850–1400 wide (jumlah lifeline), tinggi auto-grow per panjang flow.

### Lifeline header

| Elemen | Style |
|--------|-------|
| Actor | `shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;strokeColor=#000000;fillColor=#FFFFFF;fontSize=11;fontColor=#000000;` (30×60, label di bawah) |
| Object | `rounded=0;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=1.5;fontSize=11;fontColor=#000000;fontStyle=1;` (150×40, bold) |
| Lifeline | `endArrow=none;html=1;rounded=0;dashed=1;strokeColor=#000000;strokeWidth=1;` (vertical edge dari bottom-of-header sampai bottom-of-page) |

### Messages

| Tipe | Style | Catatan |
|------|-------|---------|
| Sync | `endArrow=block;endFill=1;html=1;rounded=0;strokeColor=#000000;strokeWidth=1;fontSize=10;align=center;verticalAlign=bottom;` | Panah solid penuh, label endpoint/method |
| Return | `endArrow=open;endFill=0;html=1;rounded=0;dashed=1;strokeColor=#000000;strokeWidth=1;fontSize=10;align=center;verticalAlign=bottom;` | Dashed, label nilai balik / status code |
| Async | `endArrow=open;endFill=0;html=1;rounded=0;strokeColor=#000000;strokeWidth=1;fontSize=10;` | Solid open arrow, untuk push notif / WS |
| Self | Sync style + `Array as="points"` waypoint `(x+50, y0)` `(x+50, y1)` | Loop balik ke lifeline sendiri |

### Combined Fragment (academic style: OMIT)

Untuk gaya akademik (Tugas Akhir, skripsi), combined fragment (alt/loop/opt/par) DIHILANGKAN.
Sequence menampilkan happy-path saja secara linear dari atas ke bawah.
Conditional logic, loop, dan parallel diagrams tidak digambarkan dalam sequence; cukup di activity diagram.

Reference: thesis author's own p50-p54 sequence diagrams use this convention.

### Lifeline rule (mirror activity layout)

- **Single-actor flow** (3 lifelines): `User (Role) | Sistem | Database`
- **Dual-actor flow** (4 lifelines): `User1 | Sistem | Database | User2`
- Drop `Browser`, `API Backend`, `Browser-T`, `Browser-M` separation — collapse to single `Sistem` object
- User actor labels typed by role: `User (Manager)`, `User (Teknisi)`, `User (Klien)`
- Lifeline order MUST match activity diagram swimlane order

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
