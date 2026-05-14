"""Generate the 12 missing drawio diagrams aligned to naskah/bab4_gambar/ references.

References:
  4.1  FC_ALUR_BERJALAN      - flowchart current process (ScriptSheet + WhatsApp)
  4.2  FC_ALUR_DIUSULKAN     - flowchart proposed system flow
  4.4  AD_AUTENTIKASI        - activity login (3 swimlanes: User|Sistem|Database)
  4.5  AD_PENGELOLAAN_PROYEK - activity add project (Manajer|Sistem|Database)
  4.6  AD_PELAPORAN_REVIEW_GATE - activity reporting + review (Manajer|Sistem|Teknisi)
  4.7  AD_DASHBOARD_EWS      - activity dashboard (Manager|Sistem|Database)
  4.8  AD_ESKALASI           - activity escalation (Teknisi|Sistem|Manajer)
  4.9  SD_AUTENTIKASI        - sequence login
  4.10 SD_PENGELOLAAN_PROYEK - sequence add project
  4.11 SD_REVIEW_GATE        - sequence kanban+evidence+review
  4.12 SD_DASHBOARD_EWS      - sequence dashboard load
  4.13 SD_ESKALASI           - sequence escalation
"""

from pathlib import Path

BASE = Path(__file__).parent

XML_HEADER = '<?xml version="1.0" encoding="UTF-8"?>'

# --- Helpers ---

def mxfile(diag_id, diag_name, body, width=1100, height=900):
    return f'''{XML_HEADER}
<mxfile host="app.diagrams.net" modified="2026-05-13T00:00:00.000Z" agent="Claude Code" version="26.0.0" type="device">
  <diagram id="{diag_id}" name="{diag_name}">
    <mxGraphModel dx="1400" dy="900" grid="0" gridSize="10" guides="1" tooltips="1" connect="0" arrows="1" fold="0" page="1" pageScale="1" pageWidth="{width}" pageHeight="{height}" background="#FFFFFF" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
{body}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
'''

def cell_term(cid, label, x, y, w=120, h=40):
    """Terminator (ellipse) for Mulai/Selesai."""
    # _esc not yet defined when this runs at module level — inline minimal escape
    safe = label.replace('"', '&quot;')
    return f'        <mxCell id="{cid}" value="{safe}" style="ellipse;whiteSpace=wrap;html=1;fontSize=11;fontStyle=1;fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=1.5;" vertex="1" parent="1"><mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>'

def _esc(s):
    """Escape literal quotes for XML attribute safety."""
    return s.replace('"', '&quot;')

def cell_proc(cid, label, x, y, w=200, h=50):
    """Process rectangle."""
    return f'        <mxCell id="{cid}" value="{_esc(label)}" style="rounded=0;whiteSpace=wrap;html=1;fontSize=10;fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=1.2;" vertex="1" parent="1"><mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>'

def cell_dec(cid, label, x, y, w=140, h=70):
    """Decision diamond."""
    return f'        <mxCell id="{cid}" value="{_esc(label)}" style="rhombus;whiteSpace=wrap;html=1;fontSize=10;fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=1.2;" vertex="1" parent="1"><mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>'

def cell_para(cid, label, x, y, w=200, h=50):
    """Parallelogram (I/O)."""
    return f'        <mxCell id="{cid}" value="{_esc(label)}" style="shape=parallelogram;perimeter=parallelogramPerimeter;whiteSpace=wrap;html=1;fixedSize=1;fontSize=10;fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=1.2;" vertex="1" parent="1"><mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>'

def cell_db(cid, label, x, y, w=120, h=60):
    """Database cylinder."""
    safe = label.replace('"', '&quot;')
    return f'        <mxCell id="{cid}" value="{safe}" style="shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;fontSize=10;fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=1.2;" vertex="1" parent="1"><mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>'

def cell_circle(cid, x, y, filled=True, w=20, h=20):
    """Initial/final node."""
    fill = "#000000" if filled else "#FFFFFF"
    return f'        <mxCell id="{cid}" value="" style="ellipse;fillColor={fill};strokeColor=#000000;strokeWidth=1.5;" vertex="1" parent="1"><mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>'

def cell_final(cid, x, y, w=24, h=24):
    """Final node (bullseye)."""
    return (
        f'        <mxCell id="{cid}_o" value="" style="ellipse;fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=1.5;" vertex="1" parent="1"><mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>\n'
        f'        <mxCell id="{cid}" value="" style="ellipse;fillColor=#000000;strokeColor=#000000;" vertex="1" parent="1"><mxGeometry x="{x+5}" y="{y+5}" width="{w-10}" height="{h-10}" as="geometry"/></mxCell>'
    )

def edge(eid, src, tgt, label=""):
    style = "edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;jettySize=auto;orthogonalLoop=1;strokeColor=#000000;strokeWidth=1.2;endArrow=classic;endFill=1;"
    safe = label.replace('"', '&quot;')
    lbl_attr = f' value="{safe}"' if label else ' value=""'
    return f'        <mxCell id="{eid}"{lbl_attr} style="{style}" edge="1" parent="1" source="{src}" target="{tgt}"><mxGeometry relative="1" as="geometry"/></mxCell>'

def edge_straight(eid, src, tgt, label=""):
    style = "html=1;endArrow=classic;endFill=1;strokeColor=#000000;strokeWidth=1.2;"
    safe = label.replace('"', '&quot;')
    lbl_attr = f' value="{safe}"' if label else ' value=""'
    return f'        <mxCell id="{eid}"{lbl_attr} style="{style}" edge="1" parent="1" source="{src}" target="{tgt}"><mxGeometry relative="1" as="geometry"/></mxCell>'

def swimlane_header(cid, label, x, y, w, h=30):
    safe = label.replace('"', '&quot;')
    return f'        <mxCell id="{cid}" value="{safe}" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#E6E6E6;strokeColor=#000000;fontStyle=1;fontSize=11;strokeWidth=1.5;" vertex="1" parent="1"><mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>'

def swimlane_body(cid, x, y, w, h):
    return f'        <mxCell id="{cid}" value="" style="rounded=0;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#000000;strokeWidth=1.2;" vertex="1" parent="1"><mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>'

# ============================================================================
# 4.1 FC_ALUR_BERJALAN - Current process (manual)
# ============================================================================

def gen_fc_alur_berjalan():
    cells = []
    # vertical layout, single column
    cx = 280  # centre x for 200-wide boxes
    cells.append(cell_term("start", "Mulai", cx+40, 20))
    cells.append(cell_proc("p1", "Manajer buat data proyek di ScriptSheet", cx, 90))
    cells.append(cell_proc("p2", "Manajer menugaskan teknisi ke lapangan", cx, 170))
    cells.append(cell_proc("p3", "Teknisi mengerjakan proyek", cx, 250))
    cells.append(cell_para("p4", "Teknisi melaporkan progres proyek melalui WhatsApp", cx, 330))
    cells.append(cell_proc("p5", "Manajer memasukkan data secara manual berdasarkan laporan teknisi", cx, 410))
    cells.append(cell_dec("d1", "Data lengkap?", cx+30, 490))
    cells.append(cell_proc("p6_back", "Minta tambahan data ke teknisi", 40, 495, 180, 50))
    cells.append(cell_para("p7", "Manajer menganalisis data proyek secara manual", cx, 600))
    cells.append(cell_proc("p8", "Hitung Progres &amp; SPI Manual", cx, 680))
    cells.append(cell_dec("d2", "Proyek Terlambat?", cx+30, 760))
    cells.append(cell_para("p9", "Hubungi Teknisi via WhatsApp", cx+260, 765, 180, 50))
    cells.append(cell_proc("p10", "Update Status di ScriptSheet", cx, 870))
    cells.append(cell_term("end", "Selesai", cx+40, 950))

    # edges
    cells.append(edge("e1","start","p1"))
    cells.append(edge("e2","p1","p2"))
    cells.append(edge("e3","p2","p3"))
    cells.append(edge("e4","p3","p4"))
    cells.append(edge("e5","p4","p5"))
    cells.append(edge("e6","p5","d1"))
    cells.append(edge("e7","d1","p6_back","N"))
    cells.append(edge("e8","p6_back","p4"))
    cells.append(edge("e9","d1","p7","Y"))
    cells.append(edge("e10","p7","p8"))
    cells.append(edge("e11","p8","d2"))
    cells.append(edge("e12","d2","p9","Y"))
    cells.append(edge("e13","p9","p10"))
    cells.append(edge("e14","d2","p10","N"))
    cells.append(edge("e15","p10","end"))

    body = "\n".join(cells)
    return mxfile("fc_berjalan","Flowchart Alur Sistem Berjalan", body, 900, 1020)


# ============================================================================
# 4.2 FC_ALUR_DIUSULKAN - Proposed flow with role split
# ============================================================================

def gen_fc_alur_diusulkan():
    cells = []
    cells.append(cell_term("start", "Mulai", 360, 20))
    cells.append(cell_proc("login", "Pengguna membuka halaman Login", 280, 90))
    cells.append(cell_para("kred", "Input kredensial (email &amp; password)", 280, 170))
    cells.append(cell_dec("valid", "Validasi kredensial?", 290, 250))
    cells.append(cell_proc("err", "Tampil pesan error", 60, 260, 160, 50))
    cells.append(cell_proc("role", "Sistem cek role pengguna", 280, 360))
    cells.append(cell_dec("rdec", "Role pengguna?", 290, 440))

    # Manajer branch (left)
    cells.append(cell_para("mdash", "Dashboard Proyek &amp; Teknisi&#10;(Grafik Visualisasi Seluruh Proyek)", 30, 550, 240, 60))
    cells.append(cell_proc("m1","Mengelola Data Proyek &amp; Jadwal", 50, 640, 200, 45))
    cells.append(cell_proc("m2","Mengelola Data Pelanggan", 50, 705, 200, 45))
    cells.append(cell_proc("m3","Mengelola Laporan Teknisi &amp; Proyek", 50, 770, 200, 45))
    cells.append(cell_proc("m4","Menindaklanjuti Eskalasi Kendala", 50, 835, 200, 45))

    # Teknisi branch (right)
    cells.append(cell_para("tdash", "Dashboard Performa Pekerjaan", 480, 550, 240, 50))
    cells.append(cell_proc("t1","Melihat Data Proyek yang Didapatkan", 490, 640, 220, 45))
    cells.append(cell_proc("t2","Mengelola Tugas Proyek Berjalan&#10;(Real-time)", 490, 705, 220, 50))
    cells.append(cell_proc("t3","Mengajukan Eskalasi Kendala ke Manajer", 490, 775, 220, 50))

    cells.append(cell_proc("komentar","Fitur Komentar: Komunikasi Antar Role&#10;(Tersedia Saat Membuka Detail Proyek &#8212; Berlaku Semua Role)", 130, 920, 500, 50))
    cells.append(cell_para("logout","Logout / Keluar Sistem", 290, 1000, 200, 50))
    cells.append(cell_term("end","Selesai", 360, 1080))

    # edges
    cells.append(edge("e1","start","login"))
    cells.append(edge("e2","login","kred"))
    cells.append(edge("e3","kred","valid"))
    cells.append(edge("e4","valid","err","N"))
    cells.append(edge("e5","err","kred"))
    cells.append(edge("e6","valid","role","Y"))
    cells.append(edge("e7","role","rdec"))
    cells.append(edge("e8","rdec","mdash","Manajer"))
    cells.append(edge("e9","rdec","tdash","Teknisi"))
    cells.append(edge("e10","mdash","m1"))
    cells.append(edge("e11","m1","m2"))
    cells.append(edge("e12","m2","m3"))
    cells.append(edge("e13","m3","m4"))
    cells.append(edge("e14","m4","komentar"))
    cells.append(edge("e15","tdash","t1"))
    cells.append(edge("e16","t1","t2"))
    cells.append(edge("e17","t2","t3"))
    cells.append(edge("e18","t3","komentar"))
    cells.append(edge("e19","komentar","logout"))
    cells.append(edge("e20","logout","end"))

    body = "\n".join(cells)
    return mxfile("fc_diusulkan","Flowchart Alur Sistem Diusulkan", body, 800, 1180)


# ============================================================================
# Activity diagrams - 3-swimlane pattern
# ============================================================================

SW_W = 240  # width per swimlane
SW_X0 = 40
SW_Y0 = 20

def swimlane_layout(labels, body_h):
    """Render swimlane headers + bodies. Returns list of cells."""
    cells = []
    for i, lbl in enumerate(labels):
        x = SW_X0 + i * SW_W
        cells.append(swimlane_header(f"sw_h{i}", lbl, x, SW_Y0, SW_W))
        cells.append(swimlane_body(f"sw_b{i}", x, SW_Y0+30, SW_W, body_h))
    return cells

def col_x(col, box_w=180):
    """Centre x for a box of given width in swimlane col (0-indexed)."""
    return SW_X0 + col*SW_W + (SW_W - box_w)//2


# 4.4 Activity Autentikasi: User | Sistem | Database

def gen_ad_autentikasi():
    body_h = 360
    cells = swimlane_layout(["User","Sistem","Database"], body_h)
    cells.append(cell_circle("init", col_x(0,20), 60))
    cells.append(cell_proc("u1", "Masukkan Email dan Password", col_x(0), 100, 180, 50))
    cells.append(cell_dec("validasi", "Validasi", col_x(1,140), 170, 140, 70))
    cells.append(cell_db("db1", "tb_user", col_x(2,120), 175))
    cells.append(cell_proc("u2", "Akses Sistem Diberikan", col_x(1), 260, 180, 40))
    cells.append(cell_proc("u3", "Permintaan Logout", col_x(1), 310, 180, 40))
    cells.append(cell_final("final", col_x(1,20), 360))

    cells.append(edge("e1","init","u1"))
    cells.append(edge("e2","u1","validasi","ya"))
    cells.append(edge("e3","validasi","db1"))
    cells.append(edge("e4","validasi","u1","tidak"))
    cells.append(edge("e5","validasi","u2"))
    cells.append(edge("e6","u2","u3"))
    cells.append(edge("e7","u3","final"))
    body = "\n".join(cells)
    return mxfile("ad_autentikasi","Activity Diagram Autentikasi", body, 800, 480)


# 4.5 Activity Pengelolaan Proyek: User(Manajer) | Sistem | Database

def gen_ad_pengelolaan_proyek():
    body_h = 660
    cells = swimlane_layout(["User (Manajer)","Sistem","Database"], body_h)
    cells.append(cell_circle("init", col_x(0,20), 60))
    cells.append(cell_proc("m1", 'Memilih opsi "Tambah Proyek Baru" dan mengisi detail informasi proyek', col_x(0), 100, 200, 60))
    cells.append(cell_proc("m2", "Memasukkan rentang waktu/jadwal pengerjaan proyek", col_x(0), 175, 200, 55))
    cells.append(cell_proc("s1", "Menerima input jadwal dan mengirimkan permintaan pengecekan ketersediaan teknisi", col_x(1), 175, 200, 70))
    cells.append(cell_proc("d1", "Melakukan pengecekan jadwal (memfilter teknisi yang jadwalnya sudah penuh/bentrok)", col_x(2,200), 175, 200, 70))
    cells.append(cell_proc("m3", "Memilih teknisi dari daftar rekomendasi dan menyusun daftar tugas kerja", col_x(0), 260, 200, 60))
    cells.append(cell_proc("s2", "Menampilkan pilihan teknisi yang tersedia di layar Manajer", col_x(1), 260, 200, 60))
    cells.append(cell_proc("d2", "Mengirimkan daftar teknisi yang berstatus tersedia (available)", col_x(2,200), 260, 200, 60))
    cells.append(cell_proc("m4", 'Menekan tombol "Simpan Proyek"', col_x(0), 340, 200, 50))
    cells.append(cell_proc("s3", "Memproses penyimpanan data proyek dan alokasi tugas", col_x(1), 340, 200, 55))
    cells.append(cell_proc("d3", "Menyimpan data proyek baru secara permanen", col_x(2,200), 340, 200, 50))
    cells.append(cell_proc("m5", "Melihat data proyek berhasil ditambahkan ke dalam daftar", col_x(0), 415, 200, 55))
    cells.append(cell_proc("s4", "Menampilkan pesan sukses dan mendistribusikan notifikasi penugasan baru", col_x(1), 415, 200, 60))
    cells.append(cell_final("final", col_x(0,20), 495))

    cells.append(edge("e1","init","m1"))
    cells.append(edge("e2","m1","m2"))
    cells.append(edge("e3","m2","s1"))
    cells.append(edge("e4","s1","d1"))
    cells.append(edge("e5","d1","d2"))
    cells.append(edge("e6","d2","s2"))
    cells.append(edge("e7","s2","m3"))
    cells.append(edge("e8","m3","m4"))
    cells.append(edge("e9","m4","s3"))
    cells.append(edge("e10","s3","d3"))
    cells.append(edge("e11","d3","s4"))
    cells.append(edge("e12","s4","m5"))
    cells.append(edge("e13","m5","final"))
    body = "\n".join(cells)
    return mxfile("ad_pengelolaan","Activity Diagram Pengelolaan Proyek", body, 820, 580)


# 4.6 Activity Pelaporan ReviewGate: User(Manajer) | Sistem | User(Teknisi)

def gen_ad_pelaporan_review():
    body_h = 880
    cells = swimlane_layout(["User (Manajer)","Sistem","User (Teknisi)"], body_h)
    cells.append(cell_circle("init", col_x(0,20), 60))
    cells.append(cell_proc("m1","Membuat proyek baru", col_x(0), 100, 200, 50))
    cells.append(cell_proc("s1","Menyediakan opsi teknisi (available) berdasarkan jadwal yang dipilih", col_x(1), 100, 200, 70))
    cells.append(cell_proc("m2","Mengalokasikan teknisi dan membuat daftar tugas untuk teknisi", col_x(0), 175, 200, 60))
    cells.append(cell_proc("m3","Simpan data proyek baru", col_x(0), 250, 200, 50))
    cells.append(cell_proc("s2","Muncul notifikasi proyek baru", col_x(1), 250, 200, 50))
    cells.append(cell_proc("t1","Membuka papan kanban proyek", col_x(2), 250, 200, 50))
    cells.append(cell_proc("t2","Menggeser status tugas ke Working On It dan mengunggah foto bukti", col_x(2), 320, 200, 70))
    cells.append(cell_proc("s3","Memunculkan notifikasi perlu direview di Dashboard Manajer", col_x(1), 410, 200, 60))
    cells.append(cell_proc("m4","Menerima data pembaruan tugas dan file foto", col_x(0), 410, 200, 60))
    cells.append(cell_proc("m5","Membuka detail tugas dan meninjau foto bukti dari teknisi", col_x(0), 485, 200, 60))
    cells.append(cell_dec("dec","Apakah hasil pekerjaan valid?", col_x(0,160), 565, 160, 70))
    cells.append(cell_proc("m6","Mengirim catatan revisi kepada Teknisi", col_x(0), 660, 200, 50))
    cells.append(cell_proc("s4","Meneruskan notifikasi revisi ke Teknisi", col_x(1), 565, 200, 50))
    cells.append(cell_proc("m7","Menyetujui dan menggeser status tugas menjadi Done", col_x(0), 730, 200, 55))
    cells.append(cell_proc("s5","Menghitung SPI dan memperbarui Health Status Proyek", col_x(1), 730, 200, 55))
    cells.append(cell_proc("s6",'Menampilkan Pesan Tugas Berhasil Diselesaikan ke Kedua Aktor', col_x(1), 800, 200, 60))
    cells.append(cell_proc("m8","Dashboard proyek diperbarui", col_x(0), 800, 200, 50))
    cells.append(cell_proc("t3","Dashboard performa diperbarui", col_x(2), 800, 200, 50))
    cells.append(cell_final("final", col_x(1,20), 880))

    cells.append(edge("e1","init","m1"))
    cells.append(edge("e2","m1","s1"))
    cells.append(edge("e3","s1","m2"))
    cells.append(edge("e4","m2","m3"))
    cells.append(edge("e5","m3","s2"))
    cells.append(edge("e6","s2","t1"))
    cells.append(edge("e7","t1","t2"))
    cells.append(edge("e8","t2","s3"))
    cells.append(edge("e9","s3","m4"))
    cells.append(edge("e10","m4","m5"))
    cells.append(edge("e11","m5","dec"))
    cells.append(edge("e12","dec","m6","N"))
    cells.append(edge("e13","m6","s4"))
    cells.append(edge("e14","s4","t2"))
    cells.append(edge("e15","dec","m7","Y"))
    cells.append(edge("e16","m7","s5"))
    cells.append(edge("e17","s5","s6"))
    cells.append(edge("e18","s6","m8"))
    cells.append(edge("e19","s6","t3"))
    cells.append(edge("e20","m8","final"))
    cells.append(edge("e21","t3","final"))
    body = "\n".join(cells)
    return mxfile("ad_pelaporan","Activity Diagram Pelaporan Review Gate", body, 820, 940)


# 4.7 Activity Dashboard EWS: Manager | Sistem | Database

def gen_ad_dashboard_ews():
    body_h = 520
    cells = swimlane_layout(["Manager","Sistem","Database"], body_h)
    cells.append(cell_circle("init", col_x(0,20), 60))
    cells.append(cell_proc("m1","Mengakses halaman Dashboard Utama EWS", col_x(0), 100, 200, 55))
    cells.append(cell_proc("s1","Menampilkan Dashboard EWS", col_x(1), 100, 200, 50))
    cells.append(cell_proc("d1","Memproses permintaan dan mengirimkan sekumpulan data metrik proyek (termasuk nilai SPI dan status tugas)", col_x(2), 100, 200, 80))
    cells.append(cell_proc("s2","Memetakan status kesehatan proyek (Health Status) ke dalam indikator warna EWS (Merah, Kuning, Hijau) berdasarkan rentang nilai SPI", col_x(1), 200, 200, 90))
    cells.append(cell_proc("s3","Mengurutkan daftar proyek secara otomatis berdasarkan tingkat urgensi (Proyek kritis/merah tampil di urutan teratas)", col_x(1), 300, 200, 80))
    cells.append(cell_proc("s4","Merender grafik visual dan menampilkan Dashboard EWS secara utuh ke layar", col_x(1), 390, 200, 70))
    cells.append(cell_proc("m2","Melihat visualisasi data dan mengevaluasi status kesehatan seluruh proyek", col_x(0), 390, 200, 70))
    cells.append(cell_final("final", col_x(0,20), 480))

    cells.append(edge("e1","init","m1"))
    cells.append(edge("e2","m1","s1"))
    cells.append(edge("e3","s1","d1"))
    cells.append(edge("e4","d1","s2"))
    cells.append(edge("e5","s2","s3"))
    cells.append(edge("e6","s3","s4"))
    cells.append(edge("e7","s4","m2"))
    cells.append(edge("e8","m2","final"))
    body = "\n".join(cells)
    return mxfile("ad_dashboard","Activity Diagram Dashboard EWS", body, 820, 580)


# 4.8 Activity Eskalasi: User(Teknisi) | Sistem | User(Manager)

def gen_ad_eskalasi():
    body_h = 580
    cells = swimlane_layout(["User (Teknisi)","Sistem","User (Manager)"], body_h)
    cells.append(cell_circle("init", col_x(0,20), 60))
    cells.append(cell_proc("t1","Mengakses fitur pengajuan eskalasi kendala", col_x(0), 100, 200, 60))
    cells.append(cell_proc("t2","Mengisi form detail kendala yang terjadi di lapangan dan menekan tombol kirim", col_x(0), 175, 200, 70))
    cells.append(cell_proc("s1","Menerima dan memproses data eskalasi baru", col_x(1), 100, 200, 60))
    cells.append(cell_proc("s2",'Memunculkan indikator peringatan (notifikasi/flag merah) di Dashboard Manajer', col_x(1), 175, 200, 70))
    cells.append(cell_proc("m1","Menerima notifikasi dan membuka detail eskalasi yang diajukan oleh Teknisi", col_x(2), 175, 200, 70))
    cells.append(cell_proc("m2","Menuliskan instruksi penanganan atau solusi untuk kendala tersebut", col_x(2), 255, 200, 60))
    cells.append(cell_proc("m3","Mengirim instruksi penanganan", col_x(2), 325, 200, 50))
    cells.append(cell_proc("s3",'Memperbarui status tiket eskalasi menjadi "Ditangani"', col_x(1), 325, 200, 60))
    cells.append(cell_proc("s4","Meneruskan notifikasi berisi instruksi penanganan kembali ke Teknisi", col_x(1), 395, 200, 70))
    cells.append(cell_proc("t3","Menerima notifikasi dan membaca instruksi penanganan dari Manajer", col_x(0), 395, 200, 70))
    cells.append(cell_proc("t4","Melihat status kendala selesai", col_x(0), 480, 200, 50))
    cells.append(cell_final("final", col_x(0,20), 545))

    cells.append(edge("e1","init","t1"))
    cells.append(edge("e2","t1","t2"))
    cells.append(edge("e3","t2","s1"))
    cells.append(edge("e4","s1","s2"))
    cells.append(edge("e5","s2","m1"))
    cells.append(edge("e6","m1","m2"))
    cells.append(edge("e7","m2","m3"))
    cells.append(edge("e8","m3","s3"))
    cells.append(edge("e9","s3","s4"))
    cells.append(edge("e10","s4","t3"))
    cells.append(edge("e11","t3","t4"))
    cells.append(edge("e12","t4","final"))
    body = "\n".join(cells)
    return mxfile("ad_eskalasi","Activity Diagram Eskalasi", body, 820, 640)


# ============================================================================
# Sequence diagrams
# ============================================================================

def cell_actor(cid, label, x, y):
    return f'''        <mxCell id="{cid}" value="{label}" style="shape=umlActor;verticalLabelPosition=bottom;labelPosition=center;verticalAlign=top;html=1;outlineConnect=0;fontSize=11;fontStyle=1;fillColor=#FFFFFF;strokeColor=#000000;" vertex="1" parent="1"><mxGeometry x="{x}" y="{y}" width="30" height="60" as="geometry"/></mxCell>'''

def cell_lifeline_box(cid, label, x, y, w=140, h=40):
    """Boxed lifeline header (blue-tinted like the references)."""
    safe = label.replace('"', '&quot;')
    return f'        <mxCell id="{cid}" value="{safe}" style="rounded=0;whiteSpace=wrap;html=1;fontSize=11;fontStyle=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;strokeWidth=1.5;" vertex="1" parent="1"><mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>'

def cell_lifeline_line(cid, x, top_y, bottom_y):
    return f'        <mxCell id="{cid}" value="" style="endArrow=none;dashed=1;strokeColor=#000000;strokeWidth=1;html=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="{x}" y="{top_y}" as="sourcePoint"/><mxPoint x="{x}" y="{bottom_y}" as="targetPoint"/></mxGeometry></mxCell>'

def cell_activation(cid, x, top_y, bottom_y, half=5):
    return f'        <mxCell id="{cid}" value="" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;strokeWidth=1;" vertex="1" parent="1"><mxGeometry x="{x-half}" y="{top_y}" width="{half*2}" height="{bottom_y-top_y}" as="geometry"/></mxCell>'

def msg(cid, label, src_x, tgt_x, y, dashed=False):
    style_extra = "dashed=1;" if dashed else ""
    safe = label.replace('"', '&quot;')
    # shift x by ±5 to clear activation bar
    shift = 5 if tgt_x > src_x else -5
    sx = src_x + shift
    tx = tgt_x - shift
    return f'        <mxCell id="{cid}" value="{safe}" style="html=1;endArrow=classic;endFill=1;strokeColor=#000000;strokeWidth=1;{style_extra}fontSize=10;align=center;verticalAlign=bottom;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="{sx}" y="{y}" as="sourcePoint"/><mxPoint x="{tx}" y="{y}" as="targetPoint"/></mxGeometry></mxCell>'

def self_msg(cid, label, x, y, w=100, h=30):
    safe = label.replace('"', '&quot;')
    sx = x + 5
    return f'        <mxCell id="{cid}" value="{safe}" style="html=1;endArrow=classic;endFill=1;strokeColor=#000000;strokeWidth=1;fontSize=10;align=center;verticalAlign=bottom;exitX=1;exitY=0.25;entryX=1;entryY=0.75;exitDx=0;exitDy=0;entryDx=0;entryDy=0;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="{sx}" y="{y}" as="sourcePoint"/><mxPoint x="{sx+w}" y="{y+h}" as="targetPoint"/><Array as="points"><mxPoint x="{sx+w}" y="{y}"/><mxPoint x="{sx+w}" y="{y+h}"/></Array></mxGeometry></mxCell>'


# 4.9 SD Autentikasi: User | Form Login | Data User

def gen_sd_autentikasi():
    cells = []
    actor_x = 50
    ll1_x = 200  # Form Login centre
    ll2_x = 500  # Data User centre
    top = 50
    bottom = 470
    cells.append(cell_actor("a_user","User", actor_x-15, top))
    cells.append(cell_lifeline_box("ll1","Form Login", ll1_x-70, top+90))
    cells.append(cell_lifeline_box("ll2","Data User", ll2_x-70, top+90))
    # lifelines
    cells.append(cell_lifeline_line("l_a", actor_x, top+60, bottom))
    cells.append(cell_lifeline_line("l_1", ll1_x, top+130, bottom))
    cells.append(cell_lifeline_line("l_2", ll2_x, top+130, bottom))
    # activations
    cells.append(cell_activation("act_1", ll1_x, 180, 440))
    cells.append(cell_activation("act_2", ll2_x, 220, 270))
    cells.append(cell_activation("act_a", actor_x, 180, 430))
    # messages
    cells.append(msg("m1","membuka halaman login", actor_x, ll1_x, 200))
    cells.append(msg("m2","memasukkan email dan kata sandi", actor_x, ll1_x, 220))
    cells.append(msg("m3","meminta verifikasi kredensial", ll1_x, ll2_x, 240))
    cells.append(msg("m4","mengembalikan data pengguna", ll2_x, ll1_x, 270, dashed=True))
    cells.append(self_msg("m5","memvalidasi kesesuaian kredensial", ll1_x, 295))
    cells.append(self_msg("m6","memeriksa peran pengguna", ll1_x, 345))
    cells.append(msg("m7","menampilkan dashboard sesuai peran", ll1_x, actor_x, 410, dashed=True))

    # title
    cells.append(f'        <mxCell id="title" value="Sequence Diagram Autentikasi" style="text;html=1;align=center;verticalAlign=middle;fontSize=14;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="200" y="10" width="400" height="30" as="geometry"/></mxCell>')

    body = "\n".join(cells)
    return mxfile("sd_autentikasi","Sequence Diagram Autentikasi", body, 700, 540)


# 4.10 SD Pengelolaan Proyek: Manajer | Form Proyek | Data Proyek

def gen_sd_pengelolaan_proyek():
    cells = []
    actor_x = 50
    ll1_x = 280
    ll2_x = 600
    top = 40
    bottom = 600
    cells.append(cell_actor("a","Manajer", actor_x-15, top))
    cells.append(cell_lifeline_box("ll1","Form Proyek", ll1_x-70, top+80))
    cells.append(cell_lifeline_box("ll2","Data Proyek", ll2_x-70, top+80))
    cells.append(cell_lifeline_line("l_a", actor_x, top+60, bottom))
    cells.append(cell_lifeline_line("l_1", ll1_x, top+120, bottom))
    cells.append(cell_lifeline_line("l_2", ll2_x, top+120, bottom))
    cells.append(cell_activation("act_1", ll1_x, 180, 580))
    cells.append(cell_activation("act_2", ll2_x, 240, 510))
    cells.append(cell_activation("act_a", actor_x, 180, 570))

    cells.append(msg("m1","memilih opsi tambah proyek baru dan mengisi detail", actor_x, ll1_x, 200))
    cells.append(msg("m2","memasukkan rentang waktu pengerjaan", actor_x, ll1_x, 230))
    cells.append(msg("m3","meminta pengecekan ketersediaan teknisi", ll1_x, ll2_x, 260))
    cells.append(self_msg("m4","memfilter teknisi berdasarkan jadwal", ll2_x, 290))
    cells.append(msg("m5","mengembalikan daftar teknisi tersedia", ll2_x, ll1_x, 350, dashed=True))
    cells.append(msg("m6","menampilkan daftar teknisi yang tersedia", ll1_x, actor_x, 380, dashed=True))
    cells.append(msg("m7","memilih teknisi dan menyusun daftar tugas", actor_x, ll1_x, 410))
    cells.append(msg("m8","menekan tombol simpan proyek", actor_x, ll1_x, 440))
    cells.append(msg("m9","menyimpan data proyek dan alokasi tugas", ll1_x, ll2_x, 470))
    cells.append(msg("m10","mengonfirmasi penyimpanan", ll2_x, ll1_x, 500, dashed=True))
    cells.append(msg("m11","menampilkan pesan sukses dan distribusi notifikasi", ll1_x, actor_x, 550, dashed=True))

    cells.append(f'        <mxCell id="title" value="Sequence Diagram Pengelolaan Proyek" style="text;html=1;align=center;verticalAlign=middle;fontSize=14;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="200" y="5" width="500" height="30" as="geometry"/></mxCell>')

    body = "\n".join(cells)
    return mxfile("sd_proyek","Sequence Diagram Pengelolaan Proyek", body, 800, 660)


# 4.11 SD Pelaporan Review Gate: Manajer | Papan Kanban | Data Tugas | Teknisi

def gen_sd_review_gate():
    cells = []
    a1_x = 50
    ll1_x = 280
    ll2_x = 540
    a2_x = 800
    top = 40
    bottom = 800
    cells.append(cell_actor("a1","Manajer", a1_x-15, top))
    cells.append(cell_lifeline_box("ll1","Papan Kanban", ll1_x-75, top+80, w=150))
    cells.append(cell_lifeline_box("ll2","Data Tugas", ll2_x-70, top+80))
    cells.append(cell_actor("a2","Teknisi", a2_x-15, top))
    cells.append(cell_lifeline_line("l_a1", a1_x, top+60, bottom))
    cells.append(cell_lifeline_line("l_1", ll1_x, top+120, bottom))
    cells.append(cell_lifeline_line("l_2", ll2_x, top+120, bottom))
    cells.append(cell_lifeline_line("l_a2", a2_x, top+60, bottom))
    cells.append(cell_activation("act_1", ll1_x, 180, 780))
    cells.append(cell_activation("act_2", ll2_x, 220, 680))

    cells.append(msg("m1","membuka papan kanban proyek", a2_x, ll1_x, 200))
    cells.append(msg("m2","menampilkan daftar tugas proyek", ll1_x, a2_x, 230, dashed=True))
    cells.append(msg("m3","memilih proyek", a2_x, ll1_x, 260))
    cells.append(msg("m4","menggeser status tugas menjadi Working On It", a2_x, ll1_x, 290))
    cells.append(msg("m5","memperbarui status tugas", ll1_x, ll2_x, 320))
    cells.append(msg("m6","mengunggah foto bukti pekerjaan", a2_x, ll1_x, 360))
    cells.append(msg("m7","menyimpan bukti pada tugas", ll1_x, ll2_x, 390))
    cells.append(msg("m8","mengonfirmasi penyimpanan", ll2_x, ll1_x, 420, dashed=True))
    cells.append(msg("m9","menampilkan notifikasi tugas siap ditinjau", ll1_x, a1_x, 460, dashed=True))
    cells.append(msg("m10","membuka papan kanban dan meninjau bukti", a1_x, ll1_x, 500))
    cells.append(msg("m11","menyetujui tugas menjadi Done", a1_x, ll1_x, 540))
    cells.append(msg("m12","memperbarui status tugas menjadi Done", ll1_x, ll2_x, 580))
    cells.append(self_msg("m13","menghitung ulang SPI dan Health Status", ll2_x, 620))
    cells.append(msg("m14","mengembalikan data terbaru", ll2_x, ll1_x, 670, dashed=True))
    cells.append(msg("m15","memperbarui dashboard secara real-time", ll1_x, a1_x, 720, dashed=True))
    cells.append(msg("m16","mengirim notifikasi tugas telah disetujui", ll1_x, a2_x, 760, dashed=True))

    cells.append(f'        <mxCell id="title" value="Sequence Diagram Pelaporan dan Review Gate" style="text;html=1;align=center;verticalAlign=middle;fontSize=14;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="220" y="5" width="500" height="30" as="geometry"/></mxCell>')

    body = "\n".join(cells)
    return mxfile("sd_review","Sequence Diagram Pelaporan dan Review Gate", body, 1000, 860)


# 4.12 SD Dashboard EWS: Manajer | Dashboard | Data Proyek

def gen_sd_dashboard_ews():
    cells = []
    actor_x = 50
    ll1_x = 280
    ll2_x = 580
    top = 40
    bottom = 460
    cells.append(cell_actor("a","Manajer", actor_x-15, top))
    cells.append(cell_lifeline_box("ll1","Dashboard", ll1_x-65, top+80, w=130))
    cells.append(cell_lifeline_box("ll2","Data Proyek", ll2_x-70, top+80))
    cells.append(cell_lifeline_line("l_a", actor_x, top+60, bottom))
    cells.append(cell_lifeline_line("l_1", ll1_x, top+120, bottom))
    cells.append(cell_lifeline_line("l_2", ll2_x, top+120, bottom))
    cells.append(cell_activation("act_1", ll1_x, 180, 440))
    cells.append(cell_activation("act_2", ll2_x, 220, 290))
    cells.append(cell_activation("act_a", actor_x, 180, 430))

    cells.append(msg("m1","mengakses halaman utama dashboard", actor_x, ll1_x, 200))
    cells.append(msg("m2","meneruskan permintaan ekstraksi data metrik", ll1_x, ll2_x, 230))
    cells.append(self_msg("m3","memproses kueri data SPI dan status tugas", ll2_x, 260))
    cells.append(msg("m4","mengembalikan data metrik proyek", ll2_x, ll1_x, 320, dashed=True))
    cells.append(self_msg("m5","memetakan status kesehatan ke indikator warna EWS", ll1_x, 350))
    cells.append(self_msg("m6","mengurutkan proyek berdasarkan tingkat urgensi", ll1_x, 390))
    cells.append(msg("m7","menampilkan dashboard dengan indikator peringatan dini", ll1_x, actor_x, 425, dashed=True))

    cells.append(f'        <mxCell id="title" value="Sequence Diagram Dashboard EWS" style="text;html=1;align=center;verticalAlign=middle;fontSize=14;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="200" y="5" width="500" height="30" as="geometry"/></mxCell>')

    body = "\n".join(cells)
    return mxfile("sd_ews","Sequence Diagram Dashboard EWS", body, 800, 520)


# 4.13 SD Eskalasi: Teknisi | Form Eskalasi | Data Eskalasi | Manajer

def gen_sd_eskalasi():
    cells = []
    a1_x = 50
    ll1_x = 280
    ll2_x = 540
    a2_x = 800
    top = 40
    bottom = 700
    cells.append(cell_actor("a1","Teknisi", a1_x-15, top))
    cells.append(cell_lifeline_box("ll1","Form Eskalasi", ll1_x-75, top+80, w=150))
    cells.append(cell_lifeline_box("ll2","Data Eskalasi", ll2_x-75, top+80, w=150))
    cells.append(cell_actor("a2","Manajer", a2_x-15, top))
    cells.append(cell_lifeline_line("l_a1", a1_x, top+60, bottom))
    cells.append(cell_lifeline_line("l_1", ll1_x, top+120, bottom))
    cells.append(cell_lifeline_line("l_2", ll2_x, top+120, bottom))
    cells.append(cell_lifeline_line("l_a2", a2_x, top+60, bottom))
    cells.append(cell_activation("act_1", ll1_x, 180, 680))
    cells.append(cell_activation("act_2", ll2_x, 320, 600))

    cells.append(msg("m1","membuka form eskalasi kendala", a1_x, ll1_x, 200))
    cells.append(msg("m2","mengisi detail kendala lapangan", a1_x, ll1_x, 230))
    cells.append(msg("m3","mengirim laporan eskalasi", a1_x, ll1_x, 270))
    cells.append(msg("m4","menyimpan tiket eskalasi baru", ll1_x, ll2_x, 330))
    cells.append(msg("m5","mengonfirmasi penyimpanan", ll2_x, ll1_x, 360, dashed=True))
    cells.append(msg("m6","menampilkan indikator flag merah pada dashboard", ll2_x, a2_x, 400, dashed=True))
    cells.append(msg("m7","meninjau detail kendala eskalasi", a2_x, ll2_x, 440))
    cells.append(msg("m8","mengirim instruksi penanganan", a2_x, ll1_x, 480))
    cells.append(msg("m9",'memperbarui status tiket menjadi Ditangani', ll1_x, ll2_x, 520))
    cells.append(msg("m10","mengonfirmasi pembaruan status", ll2_x, ll1_x, 570, dashed=True))
    cells.append(msg("m11","meneruskan instruksi balasan dan notifikasi selesai", ll1_x, a1_x, 640, dashed=True))

    cells.append(f'        <mxCell id="title" value="Sequence Diagram Eskalasi" style="text;html=1;align=center;verticalAlign=middle;fontSize=14;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="240" y="5" width="500" height="30" as="geometry"/></mxCell>')

    body = "\n".join(cells)
    return mxfile("sd_eskalasi","Sequence Diagram Eskalasi", body, 1000, 780)


# ============================================================================
# WRITE FILES
# ============================================================================

OUT = {
    BASE / "Flowchart/FC_ALUR_BERJALAN.drawio": gen_fc_alur_berjalan,
    BASE / "Flowchart/FC_ALUR_DIUSULKAN.drawio": gen_fc_alur_diusulkan,
    BASE / "Activity/AD_AUTENTIKASI.drawio": gen_ad_autentikasi,
    BASE / "Activity/AD_PENGELOLAAN_PROYEK.drawio": gen_ad_pengelolaan_proyek,
    BASE / "Activity/AD_PELAPORAN_REVIEW_GATE.drawio": gen_ad_pelaporan_review,
    BASE / "Activity/AD_DASHBOARD_EWS.drawio": gen_ad_dashboard_ews,
    BASE / "Activity/AD_ESKALASI.drawio": gen_ad_eskalasi,
    BASE / "Sequence/SD_AUTENTIKASI.drawio": gen_sd_autentikasi,
    BASE / "Sequence/SD_PENGELOLAAN_PROYEK.drawio": gen_sd_pengelolaan_proyek,
    BASE / "Sequence/SD_REVIEW_GATE.drawio": gen_sd_review_gate,
    BASE / "Sequence/SD_DASHBOARD_EWS.drawio": gen_sd_dashboard_ews,
    BASE / "Sequence/SD_ESKALASI.drawio": gen_sd_eskalasi,
}

if __name__ == "__main__":
    for path, fn in OUT.items():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(fn(), encoding="utf-8")
        print(f"wrote {path.relative_to(BASE)}")
