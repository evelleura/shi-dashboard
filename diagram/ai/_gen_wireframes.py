# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Generate 10 wireframe .drawio files for Tugas Akhir §4.3.5 Perancangan Antarmuka.
Output structure:
  Wireframe/Input/   WF_01_LOGIN, WF_02_TAMBAH_PROYEK, WF_03_TAMBAH_DAILY_REPORT
  Wireframe/Proses/  WF_04_DASHBOARD_EWS, WF_05_DATA_PROYEK,
                     WF_06_KANBAN_PENUGASAN, WF_07_JADWAL_PROYEK
  Wireframe/Output/  WF_08_DASHBOARD_PERFORMA_TEKNISI, WF_09_DETAIL_PROYEK,
                     WF_10_LAPORAN_KESEHATAN
Style: B&W, browser device frame, Comic Sans MS, 1200x800 canvas, captioned."""
from __future__ import annotations
import os
from xml.sax.saxutils import escape

OUT_DIR = r"D:\__CODING\05-MyProjects\__IRENE\shi-crm\diagram\ai\Wireframe"
FONT = "Comic Sans MS"
PAGE_W, PAGE_H = 1200, 800
CANVAS_H = 740  # frame_outer height; caption sits below

# ---- ID counter (per-file reset) ----
_id = 0


def reset_ids() -> None:
    global _id
    _id = 0


def nid() -> str:
    global _id
    _id += 1
    return f"c{_id}"


# ---- Cell builder ----
def cell(value: str, x: int, y: int, w: int, h: int, *, style: str,
         vertex: bool = True, edge: bool = False, source: str | None = None,
         target: str | None = None) -> str:
    val = escape(value, {'"': "&quot;"}) if value else ""
    attrs = ""
    if vertex and not edge:
        attrs = ' vertex="1"'
    if edge:
        attrs = ' edge="1"'
        if source:
            attrs += f' source="{source}"'
        if target:
            attrs += f' target="{target}"'
    geom = f'<mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/>'
    return (f'        <mxCell id="{nid()}" value="{val}" style="{style}"'
            f'{attrs} parent="1">{geom}</mxCell>')


# ---- Style presets (B&W) ----
S_FONT = f"fontFamily={FONT}"
S_PLAIN = f"rounded=0;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=1;{S_FONT}"
S_GRAY = f"rounded=0;whiteSpace=wrap;html=1;fillColor=#F0F0F0;strokeColor=#000000;strokeWidth=1;{S_FONT}"
S_GRAY_DARK = f"rounded=0;whiteSpace=wrap;html=1;fillColor=#D0D0D0;strokeColor=#000000;strokeWidth=1;{S_FONT}"
S_BLACK = f"rounded=0;whiteSpace=wrap;html=1;fillColor=#000000;strokeColor=#000000;strokeWidth=1;fontColor=#FFFFFF;{S_FONT}"
S_NOFILL = f"rounded=0;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#000000;strokeWidth=1;{S_FONT}"
S_DASHED = f"rounded=0;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#000000;strokeWidth=1;dashed=1;{S_FONT}"


def text(value: str, x: int, y: int, w: int, h: int, *, size: int = 11,
         bold: bool = False, italic: bool = False, align: str = "left",
         color: str = "#000000", spacingLeft: int = 0) -> str:
    style = (f"text;html=1;align={align};fontSize={size};fontColor={color};{S_FONT};"
             f"spacingLeft={spacingLeft}")
    if bold:
        style += ";fontStyle=1"
    if italic:
        style += ";fontStyle=2"
    if bold and italic:
        style = style.replace(";fontStyle=1", ";fontStyle=3")
    return cell(value, x, y, w, h, style=style)


def box(value: str, x: int, y: int, w: int, h: int, *, fill: str = "#FFFFFF",
        stroke: str = "#000000", size: int = 11, bold: bool = False,
        align: str = "center", color: str = "#000000",
        spacingLeft: int = 0, dashed: bool = False) -> str:
    dash = ";dashed=1" if dashed else ""
    fontStyle = ";fontStyle=1" if bold else ""
    style = (f"rounded=0;whiteSpace=wrap;html=1;fillColor={fill};strokeColor={stroke};"
             f"strokeWidth=1;fontSize={size};fontColor={color};{S_FONT};"
             f"align={align};spacingLeft={spacingLeft}{fontStyle}{dash}")
    return cell(value, x, y, w, h, style=style)


def line(x: int, y: int, w: int, h: int, *, dashed: bool = False) -> str:
    style = f"line;strokeColor=#000000;strokeWidth=1;{S_FONT}"
    if dashed:
        style += ";dashed=1"
    return cell("", x, y, w, h, style=style)


# ---- Common chrome (browser frame, top nav, sidebar) ----
def browser_frame(tab: str, url: str) -> list[str]:
    return [
        cell("", 0, 0, PAGE_W, 70,
             style=f"rounded=0;whiteSpace=wrap;html=1;fillColor=#DCDCDC;strokeColor=#000000;strokeWidth=1;{S_FONT}"),
        cell("", 14, 14, 12, 12,
             style=f"ellipse;fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=1;{S_FONT}"),
        cell("", 32, 14, 12, 12,
             style=f"ellipse;fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=1;{S_FONT}"),
        cell("", 50, 14, 12, 12,
             style=f"ellipse;fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=1;{S_FONT}"),
        box(tab, 80, 6, 240, 26, size=10, align="left", spacingLeft=10),
        text("&lt;", 14, 36, 22, 28, size=18, bold=True, align="center"),
        text("&gt;", 40, 36, 22, 28, size=18, bold=True, align="center"),
        box("O", 66, 40, 22, 22, size=12, bold=True),
        box(url, 96, 38, 988, 26, size=11, align="left", spacingLeft=12),
        text("...", 1088, 34, 24, 30, size=18, bold=True, align="center"),
    ]


def top_nav(user_label: str, *, brand: str = "PT Smart Home Inovasi") -> list[str]:
    return [
        cell("", 0, 70, PAGE_W, 50,
             style=f"rounded=0;whiteSpace=wrap;html=1;fillColor=#E0E0E0;strokeColor=#000000;strokeWidth=1;{S_FONT}"),
        text(brand, 16, 70, 400, 50, size=13, bold=True, align="left", spacingLeft=4),
        text(user_label, 760, 70, 424, 50, size=11, align="right"),
    ]


def sidebar_manajer(active: str) -> list[str]:
    items = ["Dashboard", "Proyek", "Klien", "Jadwal", "Laporan", "Pengaturan"]
    return _sidebar(items, active, footer="Keluar")


def sidebar_teknisi(active: str) -> list[str]:
    items = ["Dashboard", "Tugas Saya", "Daily Report", "Profil"]
    return _sidebar(items, active, footer="Keluar")


def _sidebar(items: list[str], active: str, footer: str) -> list[str]:
    cells = [
        cell("", 0, 120, 200, CANVAS_H - 120,
             style=f"rounded=0;whiteSpace=wrap;html=1;fillColor=#F0F0F0;strokeColor=#000000;strokeWidth=1;{S_FONT}"),
        text("MENU", 0, 125, 200, 28, size=10, bold=True, align="left", spacingLeft=16),
    ]
    y = 156
    for label in items:
        is_active = label == active
        if is_active:
            cells.append(box(f"■ {label}", 0, y, 200, 34, fill="#D0D0D0",
                             align="left", spacingLeft=12, bold=True))
        else:
            cells.append(box(f"  {label}", 0, y, 200, 34, fill="#F0F0F0",
                             stroke="#F0F0F0", align="left", spacingLeft=12))
        y += 34
    # Footer (Keluar) at bottom
    cells.append(box(f"  {footer}", 0, CANVAS_H - 44, 200, 34, fill="#F0F0F0",
                     stroke="#F0F0F0", align="left", spacingLeft=12))
    return cells


def caption(num: str, name: str) -> str:
    return text(f"Gambar {num} Wireframe {name}", 40, 770, PAGE_W - 80, 20,
                size=11, italic=True, align="center")


# ---- Page wrapper ----
HEADER = '''<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" modified="2026-05-07T00:00:00.000Z" agent="Claude Code" version="26.0.0" type="device">
  <diagram id="{did}" name="{name}">
    <mxGraphModel dx="1200" dy="900" grid="0" gridSize="10" guides="1" tooltips="1" connect="0" arrows="0" fold="0" page="1" pageScale="1" pageWidth="{pw}" pageHeight="{ph}" background="#FFFFFF" math="0" shadow="0">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
        <mxCell id="frame_outer" value="" style="rounded=0;whiteSpace=wrap;html=1;" vertex="1" parent="1"><mxGeometry x="-2" y="0" width="{pw_outer}" height="{ch}" as="geometry"/></mxCell>
'''
FOOTER = '''      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
'''


def write_page(path: str, did: str, name: str, body: list[str]) -> None:
    reset_ids()
    xml = HEADER.format(did=did, name=name, pw=PAGE_W, ph=PAGE_H,
                        pw_outer=PAGE_W + 3, ch=CANVAS_H)
    xml += "\n".join(body) + "\n" + FOOTER
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(xml)


# ============================================================
# WIREFRAMES
# ============================================================

# ---------- WF-01 LOGIN ----------
def wf_01_login() -> list[str]:
    cells = browser_frame("Login - SHI", "https://shi-crm.id/login")
    cells += [
        cell("", 0, 70, PAGE_W, 50,
             style=f"rounded=0;whiteSpace=wrap;html=1;fillColor=#E0E0E0;strokeColor=#000000;strokeWidth=1;{S_FONT}"),
        text("PT Smart Home Inovasi - Sistem Manajemen Proyek", 16, 70, PAGE_W - 32, 50,
             size=13, bold=True, align="left", spacingLeft=4),
    ]
    cells += [
        cell("", 0, 120, PAGE_W, CANVAS_H - 120,
             style=f"rounded=0;whiteSpace=wrap;html=1;fillColor=#F5F5F5;strokeColor=none;{S_FONT}"),
    ]
    cx = (PAGE_W - 400) // 2
    cells += [
        box("", cx, 190, 400, 420, fill="#FFFFFF"),
        text("Masuk ke Sistem", cx, 210, 400, 36, size=16, bold=True, align="center"),
        line(cx + 20, 253, 360, 10),
        text("Email", cx + 40, 276, 320, 18, size=11, bold=True),
        box("contoh@perusahaan.com", cx + 40, 296, 320, 34, color="#888888",
            align="left", spacingLeft=8, size=11),
        text("Kata Sandi", cx + 40, 348, 320, 18, size=11, bold=True),
        box("••••••••", cx + 40, 368, 320, 34,
            color="#888888", align="left", spacingLeft=8, size=11),
        box("Masuk", cx + 40, 428, 320, 42, fill="#000000", color="#FFFFFF",
            size=13, bold=True),
        text("Lupa kata sandi? Hubungi administrator sistem", cx, 484, 400, 18,
             size=10, align="center"),
        line(cx + 20, 512, 360, 10),
        box("[Peran pengguna: Teknisi / Manajer / Admin - otomatis dari database]",
            cx + 20, 528, 360, 28, fill="#E8E8E8", size=10, align="center"),
    ]
    cells.append(caption("4.21", "Halaman Login"))
    return cells


# ---------- WF-02 TAMBAH PROYEK ----------
def wf_02_tambah_proyek() -> list[str]:
    cells = browser_frame("Tambah Proyek - SHI", "https://shi-crm.id/proyek/baru")
    cells += top_nav("Manajer: [Nama] | Keluar")
    cells += sidebar_manajer("Proyek")

    # Main panel x=200..1200 (1000 wide)
    M_X, M_Y, M_W = 200, 120, 1000
    cells.append(box("Tambah Proyek Baru", M_X + 16, M_Y + 12, M_W - 32, 36,
                     fill="#FFFFFF", stroke="#FFFFFF", align="left", size=14, bold=True,
                     spacingLeft=8))

    # Section 1: Informasi Proyek
    sy = M_Y + 56
    cells.append(text("1. Informasi Proyek", M_X + 24, sy, 400, 22, size=12, bold=True))
    cells.append(line(M_X + 24, sy + 22, M_W - 48, 8))

    # Form fields - 2 columns
    fy = sy + 36
    col1_x, col2_x = M_X + 24, M_X + 510
    fw = 460
    fields_left = [("Nama Proyek", "Instalasi IoT Cluster A"),
                   ("Klien", "[Pilih klien]  v")]
    fields_right = [("Nilai Proyek (Rp)", "150.000.000"),
                    ("Status", "[active]  v")]
    for i, (lbl, ph) in enumerate(fields_left):
        ly = fy + i * 60
        cells.append(text(lbl, col1_x, ly, fw, 18, size=11, bold=True))
        cells.append(box(ph, col1_x, ly + 22, fw, 30, color="#888888",
                         align="left", spacingLeft=8))
    for i, (lbl, ph) in enumerate(fields_right):
        ly = fy + i * 60
        cells.append(text(lbl, col2_x, ly, fw, 18, size=11, bold=True))
        cells.append(box(ph, col2_x, ly + 22, fw, 30, color="#888888",
                         align="left", spacingLeft=8))

    fy2 = fy + 120
    cells += [
        text("Tanggal Mulai", col1_x, fy2, 220, 18, size=11, bold=True),
        box("dd/mm/yyyy", col1_x, fy2 + 22, 220, 30, color="#888888", align="left", spacingLeft=8),
        text("Tanggal Selesai", col1_x + 240, fy2, 220, 18, size=11, bold=True),
        box("dd/mm/yyyy", col1_x + 240, fy2 + 22, 220, 30, color="#888888", align="left", spacingLeft=8),
        text("Phase", col2_x, fy2, 220, 18, size=11, bold=True),
        box("[survey]  v", col2_x, fy2 + 22, 220, 30, color="#888888", align="left", spacingLeft=8),
    ]

    # Section 2: Penugasan Teknisi (rekomendasi otomatis)
    sy2 = fy2 + 70
    cells.append(text("2. Penugasan Teknisi (rekomendasi sistem berdasarkan jadwal)",
                      M_X + 24, sy2, M_W - 48, 22, size=12, bold=True))
    cells.append(line(M_X + 24, sy2 + 22, M_W - 48, 8))
    ty = sy2 + 36
    techs = [("[ ] Budi (Teknisi)", "Tersedia"),
             ("[x] Andi (Teknisi)", "Tersedia"),
             ("[ ] Citra (Teknisi)", "Bentrok 12-15 Mei")]
    for i, (n, s) in enumerate(techs):
        cells.append(box(n, M_X + 24, ty + i * 26, 320, 24, align="left", spacingLeft=8, size=11))
        cells.append(text(s, M_X + 360, ty + i * 26, 200, 24, size=10, align="left"))

    # Section 3: Daftar Tugas (decomposition)
    sy3 = ty + 90
    cells.append(text("3. Dekomposisi Daftar Tugas", M_X + 24, sy3, 400, 22, size=12, bold=True))
    cells.append(line(M_X + 24, sy3 + 22, M_W - 48, 8))
    # Header row
    hy = sy3 + 36
    cells += [
        box("Nama Tugas", M_X + 24, hy, 380, 24, fill="#E8E8E8", bold=True),
        box("Tanggal Tenggat", M_X + 408, hy, 200, 24, fill="#E8E8E8", bold=True),
        box("Ditugaskan", M_X + 612, hy, 220, 24, fill="#E8E8E8", bold=True),
        box("Aksi", M_X + 836, hy, 140, 24, fill="#E8E8E8", bold=True),
    ]
    rows = [("Survey lokasi awal", "10/05/2026", "Andi", "Hapus"),
            ("Instalasi sensor utama", "13/05/2026", "Andi", "Hapus")]
    for i, r in enumerate(rows):
        ry = hy + 28 + i * 26
        cells += [
            box(r[0], M_X + 24, ry, 380, 24, align="left", spacingLeft=8),
            box(r[1], M_X + 408, ry, 200, 24),
            box(r[2], M_X + 612, ry, 220, 24, align="left", spacingLeft=8),
            box(r[3], M_X + 836, ry, 140, 24, fill="#E8E8E8"),
        ]
    cells.append(box("+ Tambah Tugas", M_X + 24, hy + 28 + len(rows) * 26 + 8, 200, 26,
                     dashed=True, size=11))

    # Aksi
    ay = CANVAS_H - 56
    cells += [
        box("Batal", M_X + M_W - 280, ay, 120, 36, fill="#E8E8E8", size=12, bold=True),
        box("Simpan Proyek", M_X + M_W - 152, ay, 136, 36, fill="#000000",
            color="#FFFFFF", size=12, bold=True),
    ]

    cells.append(caption("4.22", "Halaman Tambah Proyek"))
    return cells


# ---------- WF-03 TAMBAH DAILY REPORT ----------
def wf_03_tambah_daily_report() -> list[str]:
    cells = browser_frame("Daily Report - SHI", "https://shi-crm.id/daily-report/baru")
    cells += top_nav("Teknisi: [Nama] | Keluar")
    cells += sidebar_teknisi("Daily Report")

    M_X, M_Y, M_W = 200, 120, 1000
    cells.append(box("Tambah Daily Report", M_X + 16, M_Y + 12, M_W - 32, 36,
                     fill="#FFFFFF", stroke="#FFFFFF", align="left", size=14, bold=True,
                     spacingLeft=8))

    # Card-like wrapper
    cy = M_Y + 60
    cells.append(box("", M_X + 24, cy, M_W - 48, 540, fill="#FFFFFF"))

    # Date readout
    cells += [
        text("Tanggal Laporan", M_X + 48, cy + 16, 460, 18, size=11, bold=True),
        box("07 Mei 2026 (otomatis - hari ini)", M_X + 48, cy + 36, 460, 30,
            fill="#F0F0F0", color="#444444", align="left", spacingLeft=8),
    ]

    # Pilih Proyek
    cells += [
        text("Pilih Proyek", M_X + 48, cy + 80, 460, 18, size=11, bold=True),
        box("[Instalasi IoT Cluster A - PT XYZ]  v", M_X + 48, cy + 100, 460, 30,
            color="#888888", align="left", spacingLeft=8),
    ]
    # Pilih Tugas
    cells += [
        text("Pilih Tugas", M_X + 528, cy + 80, 396, 18, size=11, bold=True),
        box("[Instalasi sensor utama]  v", M_X + 528, cy + 100, 396, 30,
            color="#888888", align="left", spacingLeft=8),
    ]

    # Persentase
    cells += [
        text("Persentase Progres Hari Ini (%)", M_X + 48, cy + 144, 460, 18, size=11, bold=True),
        box("65", M_X + 48, cy + 164, 460, 30, color="#888888", align="left", spacingLeft=8),
        text("(0-100, akumulatif terhadap tugas)", M_X + 48, cy + 196, 460, 16,
             size=9, italic=True, align="left"),
    ]

    # Status tugas
    cells += [
        text("Status Tugas Setelah Laporan", M_X + 528, cy + 144, 396, 18, size=11, bold=True),
        box("[Working On It]  v", M_X + 528, cy + 164, 396, 30,
            color="#888888", align="left", spacingLeft=8),
        text("(catatan: Done hanya disetujui oleh Manajer)", M_X + 528, cy + 196, 396, 16,
             size=9, italic=True, align="left"),
    ]

    # Catatan / kendala
    cells += [
        text("Catatan / Kendala Lapangan", M_X + 48, cy + 230, 876, 18, size=11, bold=True),
        box("Tulis kendala atau catatan teknis di sini...", M_X + 48, cy + 250, 876, 90,
            color="#888888", align="left", spacingLeft=8),
    ]

    # Upload bukti
    cells += [
        text("Unggah Bukti Pekerjaan (foto / dokumen)", M_X + 48, cy + 354, 876, 18,
             size=11, bold=True),
        box("Seret & lepas berkas di sini, atau klik untuk memilih",
            M_X + 48, cy + 374, 876, 100, dashed=True, color="#888888", size=11),
        text("Format: .jpg .png .pdf | maks 10 MB / berkas",
             M_X + 48, cy + 478, 876, 16, size=9, italic=True, align="left"),
    ]

    # Aksi
    ay = cy + 510
    cells += [
        box("Batal", M_X + M_W - 280, ay, 120, 36, fill="#E8E8E8", size=12, bold=True),
        box("Kirim Laporan", M_X + M_W - 152, ay, 136, 36, fill="#000000",
            color="#FFFFFF", size=12, bold=True),
    ]

    cells.append(caption("4.23", "Halaman Tambah Daily Report"))
    return cells


# ---------- WF-04 DASHBOARD EWS ----------
def wf_04_dashboard_ews() -> list[str]:
    cells = browser_frame("Dashboard EWS - SHI", "https://shi-crm.id/dashboard")
    cells += top_nav("Manajer: [Nama] | Keluar")
    cells += sidebar_manajer("Dashboard")

    M_X, M_Y, M_W = 200, 120, 1000
    cells.append(box("Dashboard - Early Warning System (EWS)",
                     M_X + 16, M_Y + 12, M_W - 32, 36, fill="#FFFFFF",
                     stroke="#FFFFFF", align="left", size=14, bold=True, spacingLeft=8))

    # Stat cards row
    sy = M_Y + 60
    stat_w = (M_W - 48 - 36) // 4  # 4 cards with gap
    stats = [("Total Proyek", "12"),
             ("Status Merah", "3"),
             ("Status Kuning", "4"),
             ("Status Hijau", "5")]
    badges = [None, "[!]", "[~]", "[v]"]
    for i, ((lbl, val), bd) in enumerate(zip(stats, badges)):
        sx = M_X + 24 + i * (stat_w + 12)
        cells.append(box("", sx, sy, stat_w, 84, fill="#FFFFFF"))
        cells.append(text(lbl, sx + 12, sy + 8, stat_w - 24, 20, size=10, bold=True))
        cells.append(text(val, sx + 12, sy + 28, stat_w - 24, 40, size=24, bold=True, align="left"))
        if bd:
            cells.append(box(bd, sx + stat_w - 50, sy + 12, 38, 24, fill="#E8E8E8",
                             size=11, bold=True))

    # Project list table
    ty = sy + 100
    cells.append(text("Daftar Proyek (diurutkan dari status paling kritis)",
                      M_X + 24, ty, 600, 22, size=12, bold=True))
    # Header row
    hy = ty + 26
    headers = [("Status", 80), ("Nama Proyek", 230), ("Klien", 160),
               ("SPI", 80), ("Deviasi", 100), ("Update Terakhir", 160)]
    hx = M_X + 24
    for h, w in headers:
        cells.append(box(h, hx, hy, w, 26, fill="#E0E0E0", bold=True))
        hx += w
    table_w = sum(w for _, w in headers)

    # Data rows
    rows = [
        ("[MERAH]", "Instalasi Cluster A", "PT Mitra Aksara", "0.72", "-28%", "07/05 09:14"),
        ("[MERAH]", "Renovasi Server B", "PT Bina Daya", "0.81", "-19%", "07/05 08:02"),
        ("[KUNING]", "Pemasangan IoT Lantai 3", "Yayasan Cahaya", "0.88", "-12%", "06/05 16:40"),
        ("[KUNING]", "Migrasi Sensor Pabrik", "PT Putra Jaya", "0.91", "-9%", "06/05 14:21"),
        ("[HIJAU]", "Instalasi Smart Office", "PT Maju Bersama", "0.97", "-3%", "07/05 10:05"),
        ("[HIJAU]", "Pemeliharaan Gedung C", "PT Sentosa", "1.02", "+2%", "06/05 18:33"),
    ]
    for i, r in enumerate(rows):
        ry = hy + 26 + i * 30
        rx = M_X + 24
        for (val, _), w in zip(zip(r, headers), [h[1] for h in headers]):
            fill = "#FFFFFF"
            bold = False
            align = "center" if w in (80, 100) else "left"
            sl = 8 if align == "left" else 0
            if r[0] == "[MERAH]":
                fill = "#E8E8E8"
            cells.append(box(val, rx, ry, w, 30, fill=fill, align=align,
                             spacingLeft=sl, bold=(rx == M_X + 24)))
            rx += w

    # Right alerts panel? Embed below table
    ay = hy + 26 + len(rows) * 30 + 16
    cells.append(text("Eskalasi Terbaru (membutuhkan tindakan)",
                      M_X + 24, ay, 600, 22, size=12, bold=True))
    cells.append(box("Andi (Teknisi) - Cluster A: kabel utama tidak kompatibel | 07/05 08:50",
                     M_X + 24, ay + 26, table_w, 26, fill="#F0F0F0", align="left",
                     spacingLeft=8, size=11))
    cells.append(box("Budi (Teknisi) - Server B: hardware delayed dari supplier | 06/05 17:10",
                     M_X + 24, ay + 54, table_w, 26, fill="#F0F0F0", align="left",
                     spacingLeft=8, size=11))

    cells.append(caption("4.24", "Halaman Dashboard Early Warning System (EWS)"))
    return cells


# ---------- WF-05 DATA PROYEK ----------
def wf_05_data_proyek() -> list[str]:
    cells = browser_frame("Data Proyek - SHI", "https://shi-crm.id/proyek")
    cells += top_nav("Manajer: [Nama] | Keluar")
    cells += sidebar_manajer("Proyek")

    M_X, M_Y, M_W = 200, 120, 1000
    cells.append(box("Data Proyek", M_X + 16, M_Y + 12, M_W - 32, 36,
                     fill="#FFFFFF", stroke="#FFFFFF", align="left", size=14,
                     bold=True, spacingLeft=8))

    # Filter bar
    fy = M_Y + 60
    cells += [
        box("Cari nama proyek...", M_X + 24, fy, 320, 32, color="#888888",
            align="left", spacingLeft=10, size=11),
        box("[Status: semua]  v", M_X + 356, fy, 180, 32, align="left", spacingLeft=8, size=11),
        box("[Phase: semua]  v", M_X + 548, fy, 180, 32, align="left", spacingLeft=8, size=11),
        box("[Klien: semua]  v", M_X + 740, fy, 180, 32, align="left", spacingLeft=8, size=11),
        box("+ Tambah Proyek", M_X + M_W - 184, fy, 168, 32, fill="#000000",
            color="#FFFFFF", size=11, bold=True),
    ]

    # Table
    hy = fy + 48
    headers = [("ID", 70), ("Nama Proyek", 240), ("Klien", 180), ("Status", 100),
               ("Phase", 100), ("Mulai", 110), ("Selesai", 110), ("Aksi", 116)]
    hx = M_X + 24
    for h, w in headers:
        cells.append(box(h, hx, hy, w, 28, fill="#E0E0E0", bold=True))
        hx += w

    rows = [
        ("PRJ-001", "Instalasi Cluster A", "PT Mitra Aksara", "active", "execution", "01/05/2026", "20/05/2026"),
        ("PRJ-002", "Renovasi Server B", "PT Bina Daya", "active", "execution", "28/04/2026", "25/05/2026"),
        ("PRJ-003", "Pemasangan IoT Lt.3", "Yayasan Cahaya", "active", "survey", "05/05/2026", "30/05/2026"),
        ("PRJ-004", "Migrasi Sensor Pabrik", "PT Putra Jaya", "on-hold", "execution", "20/04/2026", "10/05/2026"),
        ("PRJ-005", "Smart Office Setup", "PT Maju Bersama", "active", "execution", "25/04/2026", "15/05/2026"),
        ("PRJ-006", "Pemeliharaan Gedung C", "PT Sentosa", "completed", "execution", "10/04/2026", "30/04/2026"),
        ("PRJ-007", "Survey Awal Site D", "CV Anugerah", "active", "survey", "06/05/2026", "12/05/2026"),
    ]
    for i, r in enumerate(rows):
        ry = hy + 30 + i * 30
        rx = M_X + 24
        widths = [w for _, w in headers]
        for j, val in enumerate(r):
            align = "left" if j in (1, 2) else "center"
            sl = 8 if align == "left" else 0
            cells.append(box(val, rx, ry, widths[j], 30, fill="#FFFFFF",
                             align=align, spacingLeft=sl))
            rx += widths[j]
        # Aksi cell with mini-buttons
        cells += [
            box("Lihat", rx, ry + 4, 36, 22, fill="#E8E8E8", size=9),
            box("Edit", rx + 38, ry + 4, 32, 22, fill="#E8E8E8", size=9),
            box("Hapus", rx + 72, ry + 4, 40, 22, fill="#E8E8E8", size=9),
        ]

    # Pagination
    py = hy + 30 + len(rows) * 30 + 18
    cells += [
        text("Menampilkan 1-7 dari 12 proyek", M_X + 24, py, 320, 24, size=10),
        box("&lt;", M_X + M_W - 200, py, 36, 24, fill="#E8E8E8", size=11, bold=True),
        box("1", M_X + M_W - 162, py, 36, 24, fill="#000000", color="#FFFFFF", size=11, bold=True),
        box("2", M_X + M_W - 124, py, 36, 24, fill="#FFFFFF", size=11),
        box("3", M_X + M_W - 86, py, 36, 24, fill="#FFFFFF", size=11),
        box("&gt;", M_X + M_W - 48, py, 36, 24, fill="#E8E8E8", size=11, bold=True),
    ]

    cells.append(caption("4.25", "Halaman Data Proyek"))
    return cells


# ---------- WF-06 KANBAN PENUGASAN PROYEK ----------
def wf_06_kanban() -> list[str]:
    cells = browser_frame("Kanban Penugasan - SHI", "https://shi-crm.id/proyek/PRJ-001/kanban")
    cells += top_nav("Manajer: [Nama] | Keluar")
    cells += sidebar_manajer("Proyek")

    M_X, M_Y, M_W = 200, 120, 1000
    cells.append(box("Kanban Penugasan Proyek", M_X + 16, M_Y + 12, M_W - 32, 36,
                     fill="#FFFFFF", stroke="#FFFFFF", align="left", size=14,
                     bold=True, spacingLeft=8))

    # Project selector + filter bar
    fy = M_Y + 60
    cells += [
        box("[Proyek: Instalasi Cluster A - PRJ-001]  v", M_X + 24, fy, 380, 32,
            align="left", spacingLeft=8, size=11),
        box("[Teknisi: semua]  v", M_X + 416, fy, 200, 32, align="left", spacingLeft=8, size=11),
        text("Total Tugas: 12 | Selesai: 5 | SPI: 0.91", M_X + 640, fy, 340, 32,
             size=11, italic=True, align="right"),
    ]

    # 3 columns
    cy = fy + 48
    col_w = (M_W - 48 - 24) // 3  # 24 = gaps total
    col_h = CANVAS_H - cy - 16
    col_titles = [("To Do", "[Belum Dikerjakan]"),
                  ("Working On It", "[Sedang Dikerjakan]"),
                  ("Done", "[Disetujui Manajer]")]
    col_x = M_X + 24
    cards_per_col = [
        [("Survey lokasi awal", "10/05", "Andi", "0 bukti"),
         ("Pemasangan kabel data", "12/05", "Budi", "0 bukti"),
         ("Konfigurasi gateway", "14/05", "Andi", "0 bukti"),
         ("Uji koneksi sensor", "15/05", "Citra", "0 bukti")],
        [("Instalasi sensor utama", "13/05", "Andi", "2 bukti"),
         ("Setup panel kontrol", "13/05", "Budi", "1 bukti"),
         ("Kalibrasi alat ukur", "14/05", "Citra", "0 bukti")],
        [("Persiapan lokasi", "08/05", "Andi", "3 bukti"),
         ("Pengukuran area", "09/05", "Budi", "2 bukti"),
         ("Survey kelistrikan", "09/05", "Citra", "1 bukti"),
         ("Sosialisasi tim", "10/05", "Andi", "1 bukti"),
         ("Verifikasi tools", "10/05", "Budi", "2 bukti")],
    ]
    for i, ((title, sub), cards) in enumerate(zip(col_titles, cards_per_col)):
        x = col_x + i * (col_w + 12)
        # Column header
        cells.append(box(title, x, cy, col_w, 32, fill="#E0E0E0", bold=True, size=12))
        cells.append(text(sub, x, cy + 32, col_w, 18, size=9, italic=True, align="center"))
        # Column body
        cells.append(box("", x, cy + 54, col_w, col_h - 54, fill="#F5F5F5"))
        # Cards
        for j, c in enumerate(cards):
            ck_y = cy + 64 + j * 76
            cells.append(box("", x + 8, ck_y, col_w - 16, 68, fill="#FFFFFF"))
            cells.append(text(c[0], x + 16, ck_y + 6, col_w - 32, 20,
                              size=11, bold=True, align="left"))
            cells.append(text(f"Tenggat: {c[1]}", x + 16, ck_y + 26, col_w - 32, 16,
                              size=9, align="left"))
            cells.append(text(f"Teknisi: {c[2]}", x + 16, ck_y + 42, col_w - 32, 16,
                              size=9, align="left"))
            cells.append(box(c[3], x + col_w - 80, ck_y + 42, 64, 18,
                             fill="#E8E8E8", size=8))
        # Add task button (col 1 only - To Do)
        if i == 0:
            ay = cy + 64 + len(cards) * 76
            cells.append(box("+ Tambah Tugas", x + 8, ay, col_w - 16, 30,
                             dashed=True, size=11))

    cells.append(caption("4.26", "Halaman Kanban Penugasan Proyek"))
    return cells


# ---------- WF-07 JADWAL PROYEK ----------
def wf_07_jadwal() -> list[str]:
    cells = browser_frame("Jadwal - SHI", "https://shi-crm.id/jadwal")
    cells += top_nav("Manajer: [Nama] | Keluar")
    cells += sidebar_manajer("Jadwal")

    M_X, M_Y, M_W = 200, 120, 1000
    cells.append(box("Jadwal Proyek - Linimasa Penugasan",
                     M_X + 16, M_Y + 12, M_W - 32, 36, fill="#FFFFFF",
                     stroke="#FFFFFF", align="left", size=14, bold=True, spacingLeft=8))

    fy = M_Y + 60
    cells += [
        box("[Bulan: Mei 2026]  v", M_X + 24, fy, 220, 32, align="left", spacingLeft=8, size=11),
        box("[Proyek: semua]  v", M_X + 256, fy, 220, 32, align="left", spacingLeft=8, size=11),
        box("&lt; Sebelumnya", M_X + M_W - 244, fy, 116, 32, fill="#E8E8E8", size=11, bold=True),
        box("Berikutnya &gt;", M_X + M_W - 120, fy, 104, 32, fill="#E8E8E8", size=11, bold=True),
    ]

    # Gantt-like table
    gy = fy + 48
    name_w = 160
    grid_x = M_X + 24 + name_w
    grid_w = M_W - 48 - name_w
    days = 14
    day_w = grid_w // days
    # Header cells
    cells.append(box("Teknisi", M_X + 24, gy, name_w, 28, fill="#E0E0E0", bold=True))
    for d in range(days):
        cells.append(box(str(d + 1), grid_x + d * day_w, gy, day_w, 28,
                         fill="#E0E0E0", size=10, bold=True))

    # Rows
    techs = ["Andi", "Budi", "Citra", "Dedi", "Eka"]
    # Each task: (tech_idx, day_start, day_count, name, conflict)
    tasks = [
        (0, 0, 3, "Survey Cluster A", False),
        (0, 3, 4, "Instalasi sensor", False),
        (0, 7, 2, "Kalibrasi", False),
        (1, 1, 5, "Renovasi Server B", False),
        (1, 6, 3, "Setup panel", False),
        (2, 2, 4, "Pemasangan IoT Lt.3", False),
        (2, 6, 4, "Survey kelistrikan", True),
        (3, 0, 6, "Migrasi Sensor", False),
        (3, 6, 4, "Uji koneksi", False),
        (4, 4, 5, "Smart Office Setup", False),
        (4, 9, 3, "Pemeliharaan", False),
    ]
    for i, t in enumerate(techs):
        ry = gy + 28 + i * 50
        cells.append(box(t, M_X + 24, ry, name_w, 50, fill="#FFFFFF",
                         align="left", spacingLeft=12, bold=True))
        for d in range(days):
            cells.append(box("", grid_x + d * day_w, ry, day_w, 50, fill="#FFFFFF"))
    for tech_idx, ds, dc, name, conflict in tasks:
        ry = gy + 28 + tech_idx * 50 + 8
        bx = grid_x + ds * day_w + 4
        bw = dc * day_w - 8
        fill = "#D0D0D0" if not conflict else "#000000"
        color = "#000000" if not conflict else "#FFFFFF"
        cells.append(box(name, bx, ry, bw, 34, fill=fill, color=color,
                         size=9, bold=True))

    # Legend
    ly = CANVAS_H - 36
    cells += [
        text("Legenda:", M_X + 24, ly, 80, 20, size=10, bold=True),
        box("", M_X + 100, ly + 2, 18, 14, fill="#D0D0D0"),
        text("Tugas terjadwal", M_X + 124, ly, 140, 20, size=10),
        box("", M_X + 268, ly + 2, 18, 14, fill="#000000"),
        text("Bentrok jadwal", M_X + 292, ly, 140, 20, size=10),
        box("", M_X + 436, ly + 2, 18, 14, fill="#FFFFFF"),
        text("Hari kosong", M_X + 460, ly, 140, 20, size=10),
    ]

    cells.append(caption("4.27", "Halaman Jadwal Proyek"))
    return cells


# ---------- WF-08 DASHBOARD PERFORMA TEKNISI ----------
def wf_08_dashboard_teknisi() -> list[str]:
    cells = browser_frame("Performa Saya - SHI", "https://shi-crm.id/performa")
    cells += top_nav("Teknisi: [Nama] | Keluar")
    cells += sidebar_teknisi("Dashboard")

    M_X, M_Y, M_W = 200, 120, 1000
    cells.append(box("Dashboard Performa Saya", M_X + 16, M_Y + 12, M_W - 32, 36,
                     fill="#FFFFFF", stroke="#FFFFFF", align="left", size=14,
                     bold=True, spacingLeft=8))

    # Stat cards
    sy = M_Y + 60
    stat_w = (M_W - 48 - 36) // 4
    stats = [("SPI Saya", "0.94"),
             ("Tugas Selesai", "18"),
             ("Tugas Berjalan", "4"),
             ("Tugas Overdue", "1")]
    sub = ["(target >= 0.95)", "(akumulasi 30 hari)", "(saat ini)", "(perlu eskalasi)"]
    for i, ((lbl, val), sb) in enumerate(zip(stats, sub)):
        sx = M_X + 24 + i * (stat_w + 12)
        cells.append(box("", sx, sy, stat_w, 90, fill="#FFFFFF"))
        cells.append(text(lbl, sx + 12, sy + 8, stat_w - 24, 20, size=10, bold=True))
        cells.append(text(val, sx + 12, sy + 28, stat_w - 24, 36, size=22, bold=True, align="left"))
        cells.append(text(sb, sx + 12, sy + 64, stat_w - 24, 20, size=9, italic=True))

    # SPI trend chart placeholder
    cy = sy + 110
    chart_h = 220
    cells.append(box("", M_X + 24, cy, M_W - 48 - 320, chart_h, fill="#FFFFFF"))
    cells.append(text("Tren SPI Mingguan (4 minggu terakhir)",
                      M_X + 40, cy + 10, 600, 22, size=12, bold=True))
    chart_x = M_X + 56
    chart_y = cy + 50
    chart_w = M_W - 48 - 320 - 64
    chart_inner_h = chart_h - 80
    # Chart axes
    cells.append(line(chart_x, chart_y + chart_inner_h, chart_w, 1))  # x-axis
    cells.append(line(chart_x, chart_y, 1, chart_inner_h))  # y-axis
    # Trend dummy points (4 weeks: 0.82, 0.88, 0.92, 0.94)
    points = [0.82, 0.88, 0.92, 0.94]
    n = len(points)
    for i, v in enumerate(points):
        px = chart_x + (chart_w - 30) * i // (n - 1) + 15
        py = chart_y + int((1 - (v - 0.7) / 0.3) * chart_inner_h)
        cells.append(box("", px - 4, py - 4, 8, 8, fill="#000000"))
        cells.append(text(f"M-{n-i}\n{v}", px - 30, chart_y + chart_inner_h + 6, 60, 24,
                          size=9, align="center"))
    # Connect dots (approximate via lines)
    for i in range(n - 1):
        x1 = chart_x + (chart_w - 30) * i // (n - 1) + 15
        x2 = chart_x + (chart_w - 30) * (i + 1) // (n - 1) + 15
        y1 = chart_y + int((1 - (points[i] - 0.7) / 0.3) * chart_inner_h)
        y2 = chart_y + int((1 - (points[i + 1] - 0.7) / 0.3) * chart_inner_h)
        # Diagonal line via mxCell line
        cells.append(line(min(x1, x2), min(y1, y2),
                          abs(x2 - x1), abs(y2 - y1)))
    cells.append(text("Target SPI = 0.95", chart_x + chart_w - 140, chart_y + 4,
                      140, 18, size=9, italic=True, align="right"))

    # Right panel: Recent reports
    rx = M_X + 24 + (M_W - 48 - 320) + 16
    rw = 304
    cells.append(box("", rx, cy, rw, chart_h, fill="#FFFFFF"))
    cells.append(text("Laporan Terbaru", rx + 12, cy + 10, rw - 24, 22, size=12, bold=True))
    reports = [
        ("Instalasi sensor utama", "65% | 07/05"),
        ("Kalibrasi alat ukur", "100% | 06/05"),
        ("Survey kelistrikan", "80% | 06/05"),
        ("Pengukuran area", "100% | 05/05"),
    ]
    for i, (n, m) in enumerate(reports):
        ly = cy + 40 + i * 38
        cells.append(box(n, rx + 12, ly, rw - 24, 34, fill="#F0F0F0",
                         align="left", spacingLeft=10, size=10, bold=True))
        cells.append(text(m, rx + 16, ly + 18, rw - 32, 14, size=8, italic=True))

    # Bottom panel: Tugas saat ini
    by = cy + chart_h + 16
    bh = CANVAS_H - by - 16
    cells.append(box("", M_X + 24, by, M_W - 48, bh, fill="#FFFFFF"))
    cells.append(text("Tugas Saat Ini", M_X + 40, by + 8, 600, 22, size=12, bold=True))
    hy = by + 36
    headers = [("Tugas", 320), ("Proyek", 220), ("Status", 140), ("Tenggat", 140), ("SPI", 76)]
    hx = M_X + 40
    for h, w in headers:
        cells.append(box(h, hx, hy, w, 24, fill="#E8E8E8", bold=True, size=10))
        hx += w
    rows = [
        ("Instalasi sensor utama", "Cluster A", "Working On It", "13/05/2026", "0.93"),
        ("Setup panel kontrol", "Cluster A", "Working On It", "13/05/2026", "0.95"),
        ("Konfigurasi gateway", "Cluster A", "To Do", "14/05/2026", "-"),
    ]
    for i, r in enumerate(rows):
        ry = hy + 26 + i * 26
        rx2 = M_X + 40
        widths = [w for _, w in headers]
        for j, val in enumerate(r):
            align = "left" if j in (0, 1) else "center"
            sl = 8 if align == "left" else 0
            cells.append(box(val, rx2, ry, widths[j], 26, fill="#FFFFFF",
                             align=align, spacingLeft=sl, size=10))
            rx2 += widths[j]

    cells.append(caption("4.28", "Halaman Dashboard Performa Teknisi"))
    return cells


# ---------- WF-09 DETAIL PROYEK ----------
def wf_09_detail_proyek() -> list[str]:
    cells = browser_frame("Detail Proyek - SHI", "https://shi-crm.id/proyek/PRJ-001")
    cells += top_nav("Manajer: [Nama] | Keluar")
    cells += sidebar_manajer("Proyek")

    M_X, M_Y, M_W = 200, 120, 1000

    # Header card
    hcy = M_Y + 16
    cells.append(box("", M_X + 16, hcy, M_W - 32, 90, fill="#FFFFFF"))
    cells += [
        text("Instalasi Cluster A", M_X + 36, hcy + 10, 600, 28, size=18, bold=True),
        text("ID: PRJ-001 | Klien: PT Mitra Aksara | Manajer: [Nama]",
             M_X + 36, hcy + 40, 700, 20, size=10),
        text("Periode: 01/05/2026 - 20/05/2026 | Nilai: Rp 150.000.000",
             M_X + 36, hcy + 60, 700, 20, size=10),
    ]
    # Status badges right-aligned
    bx = M_X + M_W - 16 - 16
    cells += [
        box("[STATUS: MERAH]", bx - 160, hcy + 12, 160, 26, fill="#000000",
            color="#FFFFFF", size=10, bold=True),
        box("[Phase: execution]", bx - 160, hcy + 44, 160, 26, fill="#E0E0E0",
            size=10, bold=True),
    ]

    # Tab bar
    ty = hcy + 100
    tabs = ["Ringkasan", "Tugas", "Bukti", "Eskalasi", "Tim"]
    tab_w = 140
    for i, t in enumerate(tabs):
        active = (i == 0)
        cells.append(box(t, M_X + 16 + i * tab_w, ty, tab_w, 32,
                         fill=("#000000" if active else "#E0E0E0"),
                         color=("#FFFFFF" if active else "#000000"),
                         size=11, bold=True))

    # Tab content area
    cy = ty + 32 + 8
    ch = CANVAS_H - cy - 16

    # Two-column layout: progress (left), details (right)
    cells.append(box("", M_X + 16, cy, M_W - 32, ch, fill="#FFFFFF"))

    # Left column
    lx = M_X + 36
    lw = 540
    cells.append(text("Progres Proyek", lx, cy + 12, lw, 22, size=12, bold=True))

    # Earned Value bar (PV vs EV)
    pby = cy + 44
    cells += [
        text("Planned Value (PV)", lx, pby, 200, 18, size=10),
        text("70%", lx + lw - 60, pby, 60, 18, size=10, align="right"),
        box("", lx, pby + 22, lw, 18, fill="#FFFFFF"),
        box("", lx, pby + 22, int(lw * 0.70), 18, fill="#888888"),
    ]
    pby2 = pby + 56
    cells += [
        text("Earned Value (EV) - Aktual", lx, pby2, 250, 18, size=10),
        text("48%", lx + lw - 60, pby2, 60, 18, size=10, align="right"),
        box("", lx, pby2 + 22, lw, 18, fill="#FFFFFF"),
        box("", lx, pby2 + 22, int(lw * 0.48), 18, fill="#000000"),
    ]
    pby3 = pby2 + 56
    cells += [
        text("Schedule Performance Index (SPI)", lx, pby3, 250, 18, size=10),
        text("0.69 [BEHIND]", lx + lw - 120, pby3, 120, 18, size=10, align="right", bold=True),
        text("Deviasi: -22% terhadap Planned Value",
             lx, pby3 + 22, lw, 18, size=10, italic=True),
    ]

    # Komentar global
    kx_y = pby3 + 56
    cells += [
        text("Komentar Global", lx, kx_y, lw, 22, size=12, bold=True),
        line(lx, kx_y + 22, lw, 8),
    ]
    cmts = [
        ("Andi (Teknisi) - 07/05 09:14", "Kabel utama tidak kompatibel, butuh penggantian merek X."),
        ("Manajer - 07/05 09:30", "Sudah saya pesan dari supplier B, ETA 09/05 sore."),
    ]
    for i, (who, msg) in enumerate(cmts):
        cy2 = kx_y + 36 + i * 60
        cells += [
            text(who, lx, cy2, lw, 16, size=9, bold=True),
            box(msg, lx, cy2 + 18, lw, 36, fill="#F0F0F0",
                align="left", spacingLeft=10, size=10),
        ]
    # Comment input
    cells += [
        box("Tulis komentar...", lx, kx_y + 36 + len(cmts) * 60, lw - 100, 32,
            color="#888888", align="left", spacingLeft=10, size=10),
        box("Kirim", lx + lw - 92, kx_y + 36 + len(cmts) * 60, 92, 32,
            fill="#000000", color="#FFFFFF", size=11, bold=True),
    ]

    # Right column: ringkasan tugas + bukti
    rx = M_X + 16 + 580
    rw = M_W - 32 - 580 - 16
    cells.append(text("Statistik Tugas", rx, cy + 12, rw, 22, size=12, bold=True))
    stats_r = [("Total Tugas", "12"),
               ("Selesai (Done)", "4"),
               ("Berjalan", "5"),
               ("Belum Mulai", "2"),
               ("Overdue", "1"),
               ("Total Bukti", "18")]
    for i, (lbl, val) in enumerate(stats_r):
        sx = rx + (i % 2) * (rw // 2)
        sy = cy + 44 + (i // 2) * 60
        cells.append(box("", sx, sy, rw // 2 - 8, 50, fill="#F0F0F0"))
        cells.append(text(lbl, sx + 8, sy + 4, rw // 2 - 24, 16, size=9))
        cells.append(text(val, sx + 8, sy + 20, rw // 2 - 24, 26, size=18, bold=True))

    # Eskalasi mini-list
    ey = cy + 44 + 3 * 60 + 12
    cells.append(text("Eskalasi Aktif", rx, ey, rw, 22, size=12, bold=True))
    cells.append(box("[!] Kabel tidak kompatibel - Andi", rx, ey + 28, rw - 8, 28,
                     fill="#E0E0E0", align="left", spacingLeft=10, size=10))
    cells.append(box("[!] Hardware delay supplier - Budi", rx, ey + 60, rw - 8, 28,
                     fill="#E0E0E0", align="left", spacingLeft=10, size=10))

    cells.append(caption("4.29", "Halaman Detail Proyek"))
    return cells


# ---------- WF-10 LAPORAN KESEHATAN PROYEK ----------
def wf_10_laporan_kesehatan() -> list[str]:
    cells = browser_frame("Laporan Kesehatan - SHI",
                          "https://shi-crm.id/laporan/kesehatan/PRJ-001")
    cells += top_nav("Manajer: [Nama] | Keluar")
    cells += sidebar_manajer("Laporan")

    M_X, M_Y, M_W = 200, 120, 1000
    cells.append(box("Laporan Kesehatan Proyek", M_X + 16, M_Y + 12, M_W - 32, 36,
                     fill="#FFFFFF", stroke="#FFFFFF", align="left", size=14,
                     bold=True, spacingLeft=8))

    # Selector + export
    fy = M_Y + 60
    cells += [
        box("[Proyek: Instalasi Cluster A - PRJ-001]  v", M_X + 24, fy, 380, 32,
            align="left", spacingLeft=8, size=11),
        box("[Periode: 01/05 - 20/05/2026]  v", M_X + 416, fy, 280, 32,
            align="left", spacingLeft=8, size=11),
        box("Cetak / Ekspor PDF", M_X + M_W - 184, fy, 168, 32, fill="#000000",
            color="#FFFFFF", size=11, bold=True),
    ]

    # Summary card
    sy = fy + 48
    cells.append(box("", M_X + 24, sy, M_W - 48, 110, fill="#FFFFFF"))
    cells += [
        text("Ringkasan Status Kesehatan", M_X + 40, sy + 8, 600, 22, size=12, bold=True),
        text("SPI", M_X + 40, sy + 36, 200, 18, size=10),
        text("0.69", M_X + 40, sy + 54, 200, 36, size=24, bold=True),
        text("Status RAG", M_X + 200, sy + 36, 200, 18, size=10),
        box("MERAH", M_X + 200, sy + 58, 140, 32, fill="#000000",
            color="#FFFFFF", size=14, bold=True),
        text("Deviasi", M_X + 380, sy + 36, 200, 18, size=10),
        text("-22%", M_X + 380, sy + 54, 200, 36, size=24, bold=True),
        text("Update Terakhir", M_X + 540, sy + 36, 240, 18, size=10),
        text("07/05/2026 09:14", M_X + 540, sy + 54, 240, 36, size=14, bold=True),
        box("Interpretasi: Proyek terlambat signifikan terhadap rencana. Tindakan mitigasi diperlukan.",
            M_X + 800, sy + 36, M_W - 48 - 776, 60, fill="#E8E8E8",
            align="left", spacingLeft=10, size=10, bold=True),
    ]

    # Earned Value chart
    cy = sy + 130
    ch = 240
    cells.append(box("", M_X + 24, cy, M_W - 48 - 360, ch, fill="#FFFFFF"))
    cells.append(text("Grafik Earned Value (PV vs EV)",
                      M_X + 40, cy + 8, 600, 22, size=12, bold=True))
    cx = M_X + 60
    cy_axis = cy + 50
    cw = M_W - 48 - 360 - 80
    chh = ch - 80
    # Axes
    cells.append(line(cx, cy_axis + chh, cw, 1))
    cells.append(line(cx, cy_axis, 1, chh))
    # PV line (linear: 0 -> 100% over period)
    pv_pts = [0, 25, 50, 75, 100]
    ev_pts = [0, 18, 32, 45, 48]
    for i in range(len(pv_pts) - 1):
        x1 = cx + cw * i // (len(pv_pts) - 1)
        x2 = cx + cw * (i + 1) // (len(pv_pts) - 1)
        # PV line - dashed
        y1 = cy_axis + int((1 - pv_pts[i] / 100) * chh)
        y2 = cy_axis + int((1 - pv_pts[i + 1] / 100) * chh)
        cells.append(line(min(x1, x2), min(y1, y2),
                          abs(x2 - x1), abs(y2 - y1), dashed=True))
        # EV line - solid
        y1 = cy_axis + int((1 - ev_pts[i] / 100) * chh)
        y2 = cy_axis + int((1 - ev_pts[i + 1] / 100) * chh)
        cells.append(line(min(x1, x2), min(y1, y2),
                          abs(x2 - x1), abs(y2 - y1)))
    # Markers + labels
    for i, (pv, ev) in enumerate(zip(pv_pts, ev_pts)):
        px = cx + cw * i // (len(pv_pts) - 1)
        py_pv = cy_axis + int((1 - pv / 100) * chh)
        py_ev = cy_axis + int((1 - ev / 100) * chh)
        cells.append(box("", px - 3, py_pv - 3, 6, 6, fill="#FFFFFF"))
        cells.append(box("", px - 3, py_ev - 3, 6, 6, fill="#000000"))
        cells.append(text(f"M-{i+1}", px - 20, cy_axis + chh + 4, 40, 16,
                          size=9, align="center"))
    cells += [
        text("Y-axis: % Progres", cx, cy_axis - 28, 200, 18, size=9, italic=True),
        text("X-axis: Minggu", cx + cw - 100, cy_axis + chh + 22, 100, 16,
             size=9, italic=True, align="right"),
    ]
    # Legend
    lgy = cy + ch - 26
    cells += [
        line(cx + cw - 220, lgy + 8, 30, 1, dashed=True),
        text("PV (rencana)", cx + cw - 184, lgy + 1, 100, 16, size=9),
        line(cx + cw - 80, lgy + 8, 30, 1),
        text("EV (aktual)", cx + cw - 44, lgy + 1, 100, 16, size=9),
    ]

    # Right side: Task breakdown
    rx = M_X + 24 + (M_W - 48 - 360) + 16
    rw = 344
    cells.append(box("", rx, cy, rw, ch, fill="#FFFFFF"))
    cells.append(text("Breakdown Tugas", rx + 12, cy + 8, rw - 24, 22, size=12, bold=True))
    breakdown = [("Selesai (Done)", "4", "33%"),
                 ("Sedang Dikerjakan", "5", "42%"),
                 ("Belum Dikerjakan", "2", "17%"),
                 ("Overdue", "1", "8%")]
    by = cy + 36
    for i, (lbl, val, pct) in enumerate(breakdown):
        ry = by + i * 44
        cells.append(box(lbl, rx + 12, ry, 200, 38, fill="#F0F0F0",
                         align="left", spacingLeft=10, size=10))
        cells.append(box(val, rx + 220, ry, 50, 38, fill="#F0F0F0",
                         size=14, bold=True))
        cells.append(box(pct, rx + 274, ry, 60, 38, fill="#F0F0F0",
                         size=11, bold=True))

    # Bottom: rekomendasi
    ry = cy + ch + 16
    rh = CANVAS_H - ry - 16
    cells.append(box("", M_X + 24, ry, M_W - 48, rh, fill="#FFFFFF"))
    cells.append(text("Rekomendasi Tindakan",
                      M_X + 40, ry + 8, 600, 22, size=12, bold=True))
    recs = [
        "1. Eskalasi prioritas tinggi pada kendala kabel utama (Andi) - butuh resolusi < 2 hari.",
        "2. Realokasi teknisi tambahan untuk mengejar deviasi -22% terhadap target Planned Value.",
        "3. Tinjau ulang lingkup pekerjaan minggu depan; pertimbangkan revisi tenggat selesai.",
    ]
    for i, r in enumerate(recs):
        cells.append(text(r, M_X + 40, ry + 36 + i * 22, M_W - 80, 20,
                          size=11, align="left"))

    cells.append(caption("4.30", "Halaman Laporan Kesehatan Proyek"))
    return cells


# ============================================================
# DRIVER
# ============================================================
PAGES = [
    ("Input/WF_01_LOGIN.drawio", "wf_01", "WF-01 Login", wf_01_login),
    ("Input/WF_02_TAMBAH_PROYEK.drawio", "wf_02", "WF-02 Tambah Proyek", wf_02_tambah_proyek),
    ("Input/WF_03_TAMBAH_DAILY_REPORT.drawio", "wf_03", "WF-03 Tambah Daily Report", wf_03_tambah_daily_report),
    ("Proses/WF_04_DASHBOARD_EWS.drawio", "wf_04", "WF-04 Dashboard EWS", wf_04_dashboard_ews),
    ("Proses/WF_05_DATA_PROYEK.drawio", "wf_05", "WF-05 Data Proyek", wf_05_data_proyek),
    ("Proses/WF_06_KANBAN_PENUGASAN.drawio", "wf_06", "WF-06 Kanban Penugasan", wf_06_kanban),
    ("Proses/WF_07_JADWAL_PROYEK.drawio", "wf_07", "WF-07 Jadwal Proyek", wf_07_jadwal),
    ("Output/WF_08_DASHBOARD_PERFORMA_TEKNISI.drawio", "wf_08", "WF-08 Dashboard Performa Teknisi", wf_08_dashboard_teknisi),
    ("Output/WF_09_DETAIL_PROYEK.drawio", "wf_09", "WF-09 Detail Proyek", wf_09_detail_proyek),
    ("Output/WF_10_LAPORAN_KESEHATAN.drawio", "wf_10", "WF-10 Laporan Kesehatan Proyek", wf_10_laporan_kesehatan),
]


def main() -> None:
    for rel_path, did, name, builder in PAGES:
        full = os.path.join(OUT_DIR, rel_path)
        body = builder()
        write_page(full, did, name, body)
        print(f"OK {rel_path}")


if __name__ == "__main__":
    main()
