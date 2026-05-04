"""Generator for 5 Sequence Diagrams (Gambar 4.10-4.14).
Mirrors Activity Diagrams 4.5-4.9 (1:1).
Spec source: naskah/09_activity_diagram.md narrative. Run: python _gen.py.

Pattern (Raharja KKP business-process):
  Single-actor: Aktor | Form/Data lifelines (3 partisipan)
  Dual-actor: Aktor1 | Form/Data lifelines | Aktor2 (4 partisipan)
Aktor = umlActor stick figure. Lifeline = object rectangle.
Activation bar on every partisipan that participates.
Linear happy-path only, no combined fragments.
Academic Indonesian (no SQL/HTTP/code).
"""
from xml.sax.saxutils import escape
import pathlib

OUT_DIR = pathlib.Path(__file__).parent

# UML blue scheme (Raharja convention)
FILL = '#DAE8FC'      # light blue
STROKE = '#6C8EBF'    # darker blue
LINE_STROKE = '#000000'  # lifeline + arrow black for contrast
BAR_HALF = 5          # activation bar half-width (bar w=10)
MARGIN_X = 160        # left/right page margin for first/last lifeline (room for actor label)


def esc(s):
    return escape(str(s), {'"': '&quot;'})


# ============ primitives ============

def object_cell(cid, name, x, y=90, w=160, h=40):
    """Object rectangle lifeline header (Form, Data, Dashboard)."""
    return (f'<mxCell id="{cid}" value="{esc(name)}" '
            f'style="rounded=0;whiteSpace=wrap;html=1;fillColor={FILL};strokeColor={STROKE};'
            f'strokeWidth=1.5;fontSize=11;fontColor=#000000;fontStyle=1;" '
            f'vertex="1" parent="1">'
            f'<mxGeometry x="{x-w//2}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>')


def actor_cell(cid, name, x, y=50, w=30, h=60):
    """umlActor stick figure with label below."""
    return (f'<mxCell id="{cid}" value="{esc(name)}" '
            f'style="shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;'
            f'outlineConnect=0;fillColor={FILL};strokeColor={STROKE};strokeWidth=1.5;'
            f'fontSize=11;fontColor=#000000;fontStyle=1;" '
            f'vertex="1" parent="1">'
            f'<mxGeometry x="{x-w//2}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>')


def activation_cell(cid, x, y_top, y_bot, w=10):
    """Execution specification bar (activation rectangle on lifeline)."""
    return (f'<mxCell id="{cid}" '
            f'style="rounded=0;whiteSpace=wrap;html=1;fillColor={FILL};strokeColor={STROKE};'
            f'strokeWidth=1;" '
            f'vertex="1" parent="1">'
            f'<mxGeometry x="{x-w//2}" y="{y_top}" width="{w}" height="{y_bot-y_top}" as="geometry"/></mxCell>')


def lifeline_cell(cid, x, y_top, y_bot):
    return (f'<mxCell id="{cid}" '
            f'style="endArrow=none;html=1;rounded=0;dashed=1;strokeColor=#000000;strokeWidth=1;" '
            f'edge="1" parent="1">'
            f'<mxGeometry relative="1" as="geometry">'
            f'<mxPoint x="{x}" y="{y_top}" as="sourcePoint"/>'
            f'<mxPoint x="{x}" y="{y_bot}" as="targetPoint"/>'
            f'</mxGeometry></mxCell>')


def msg_cell(cid, x1, x2, y, label, mtype='sync'):
    """Cross-lifeline arrow. Source/target shifted to outer edge of activation bar
    so arrows don't pierce into bars."""
    if x2 > x1:
        x1 += BAR_HALF
        x2 -= BAR_HALF
    else:
        x1 -= BAR_HALF
        x2 += BAR_HALF
    if mtype == 'sync':
        style = ('endArrow=block;endFill=1;html=1;rounded=0;strokeColor=#000000;strokeWidth=1;'
                 'fontSize=10;fontColor=#000000;align=center;verticalAlign=top;')
    elif mtype == 'return':
        style = ('endArrow=open;endFill=0;html=1;rounded=0;dashed=1;strokeColor=#000000;'
                 'strokeWidth=1;fontSize=10;fontColor=#000000;align=center;verticalAlign=top;')
    elif mtype == 'async':
        style = ('endArrow=open;endFill=0;html=1;rounded=0;strokeColor=#000000;strokeWidth=1;'
                 'fontSize=10;fontColor=#000000;align=center;verticalAlign=top;')
    else:
        style = ('endArrow=block;endFill=1;html=1;rounded=0;strokeColor=#000000;strokeWidth=1;'
                 'fontSize=10;')
    return (f'<mxCell id="{cid}" value="{esc(label)}" style="{style}" edge="1" parent="1">'
            f'<mxGeometry relative="1" as="geometry">'
            f'<mxPoint x="{x1}" y="{y}" as="sourcePoint"/>'
            f'<mxPoint x="{x2}" y="{y}" as="targetPoint"/>'
            f'</mxGeometry></mxCell>')


def self_msg_cell(cid, x, y, label):
    """Self loop. Starts/ends at right edge of activation bar so the loop
    doesn't pierce into the bar."""
    bx = x + BAR_HALF
    style = ('endArrow=block;endFill=1;html=1;rounded=0;strokeColor=#000000;strokeWidth=1;'
             'fontSize=10;fontColor=#000000;align=left;verticalAlign=middle;')
    return (f'<mxCell id="{cid}" value="{esc(label)}" style="{style}" edge="1" parent="1">'
            f'<mxGeometry relative="1" as="geometry">'
            f'<mxPoint x="{bx}" y="{y}" as="sourcePoint"/>'
            f'<mxPoint x="{bx}" y="{y+22}" as="targetPoint"/>'
            f'<Array as="points">'
            f'<mxPoint x="{bx+55}" y="{y}"/>'
            f'<mxPoint x="{bx+55}" y="{y+22}"/>'
            f'</Array></mxGeometry></mxCell>')


# ============ builder ============

class SeqBuilder:
    def __init__(self, page_w, lifelines):
        # lifelines: list of (id, name, kind) — kind in {'actor','object'}
        self.page_w = page_w
        self.lifelines = lifelines
        n = len(lifelines)
        self.lx = {}
        if n == 1:
            self.lx[lifelines[0][0]] = page_w // 2
        else:
            usable = page_w - 2 * MARGIN_X
            spacing = usable / (n - 1)
            for i, (lid, _, _) in enumerate(lifelines):
                self.lx[lid] = int(MARGIN_X + i * spacing)
        self.body = []
        self.cid_n = 100
        self.row_y = 180  # below actor head + label
        self.activations = {}  # lid -> [first_y, last_y]

    def cid(self):
        self.cid_n += 1
        return f'c{self.cid_n}'

    def _touch(self, lid, y):
        if lid not in self.activations:
            self.activations[lid] = [y, y]
        else:
            self.activations[lid][1] = y

    def msg(self, src, dst, label, mtype='sync'):
        cid = self.cid()
        if src == dst:
            self.body.append(self_msg_cell(cid, self.lx[src], self.row_y, label))
            self._touch(src, self.row_y)
            self.row_y += 32
            self._touch(src, self.row_y)
        else:
            self.body.append(msg_cell(cid, self.lx[src], self.lx[dst], self.row_y, label, mtype))
            self._touch(src, self.row_y)
            self._touch(dst, self.row_y)
            self.row_y += 28

    def emit(self, title, caption_num, caption_text):
        # Align baselines: actor figure(50-110) + label(110-130) ends at y=130;
        # object box(90-130) ends at y=130. Lifeline starts y=150.
        head_y_act = 50    # actor figure top
        head_y_obj = 90    # object box top (drops down so bottom aligns with actor label end)
        line_top = 150
        line_bot = self.row_y + 20
        cells = []
        cells.append(f'<mxCell id="title" value="{esc(title)}" '
                     f'style="text;html=1;align=center;fontSize=12;fontStyle=1;fontColor=#000000;" '
                     f'vertex="1" parent="1">'
                     f'<mxGeometry x="40" y="20" width="{self.page_w-80}" height="20" as="geometry"/>'
                     f'</mxCell>')
        for lid, name, kind in self.lifelines:
            x = self.lx[lid]
            if kind == 'actor':
                cells.append(actor_cell(f'{lid}_h', name, x, head_y_act))
            else:
                cells.append(object_cell(f'{lid}_h', name, x, head_y_obj, w=160, h=40))
            cells.append(lifeline_cell(f'{lid}_l', x, line_top, line_bot))
        # Activation bars: one per lifeline, spans first to last touch
        for lid, span in self.activations.items():
            y0, y1 = span[0] - 8, span[1] + 8
            cells.append(activation_cell(f'{lid}_act', self.lx[lid], y0, y1))
        cells.extend(self.body)
        cap_y = line_bot + 25
        cells.append(f'<mxCell id="caption" '
                     f'value="{esc(f"Gambar {caption_num} {caption_text}.")}" '
                     f'style="text;html=1;align=center;fontSize=11;fontStyle=2;fontColor=#000000;" '
                     f'vertex="1" parent="1">'
                     f'<mxGeometry x="40" y="{cap_y}" width="{self.page_w-80}" height="20" as="geometry"/>'
                     f'</mxCell>')
        page_h = cap_y + 50
        body = '\n        '.join(cells)
        return (f'<?xml version="1.0" encoding="UTF-8"?>\n'
                f'<mxfile host="app.diagrams.net" modified="2026-05-05T00:00:00.000Z" '
                f'agent="Claude Code" version="26.0.0" type="device">\n'
                f'  <diagram id="{caption_num.replace(".","_")}" name="{esc(title)}">\n'
                f'    <mxGraphModel dx="1200" dy="900" grid="1" gridSize="10" guides="1" '
                f'tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" '
                f'pageWidth="{self.page_w}" pageHeight="{page_h}" background="#FFFFFF" '
                f'math="0" shadow="0">\n'
                f'      <root>\n'
                f'        <mxCell id="0"/>\n'
                f'        <mxCell id="1" parent="0"/>\n'
                f'        {body}\n'
                f'      </root>\n'
                f'    </mxGraphModel>\n'
                f'  </diagram>\n'
                f'</mxfile>\n')


# ============ specs ============

def sd1_autentikasi():
    """SD Autentikasi — Gambar 4.10 (mirror Activity 4.5).
    Aktor (1): Pengguna
    Lifelines (2): Form Login, Data Pengguna
    """
    sb = SeqBuilder(page_w=900, lifelines=[
        ('akt', 'Pengguna',      'actor'),
        ('frm', 'Form Login',    'object'),
        ('dat', 'Data Pengguna', 'object'),
    ])
    sb.msg('akt', 'frm', 'membuka halaman login')
    sb.msg('akt', 'frm', 'memasukkan email dan kata sandi')
    sb.msg('frm', 'dat', 'meminta verifikasi kredensial')
    sb.msg('dat', 'dat', 'mencocokkan data pada tabel pengguna')
    sb.msg('dat', 'frm', 'mengembalikan data pengguna', 'return')
    sb.msg('frm', 'frm', 'memvalidasi kesesuaian kredensial')
    sb.msg('frm', 'frm', 'memeriksa peran pengguna')
    sb.msg('frm', 'akt', 'menampilkan dashboard sesuai peran', 'return')
    sb.msg('akt', 'frm', 'mengirim permintaan logout')
    sb.msg('frm', 'akt', 'mengonfirmasi keluar dari sesi', 'return')
    return sb.emit('Sequence Diagram Autentikasi', '4.10',
                   'Sequence Diagram Autentikasi')


def sd2_review_gate():
    """SD Pelaporan Progres Harian (Review Gate) — Gambar 4.11 (mirror Activity 4.6).
    Aktor (2): Manajer (kiri), Teknisi (kanan)
    Lifelines (2): Papan Kanban, Data Tugas
    """
    sb = SeqBuilder(page_w=1200, lifelines=[
        ('mgr', 'Manajer',      'actor'),
        ('kbn', 'Papan Kanban', 'object'),
        ('tug', 'Data Tugas',   'object'),
        ('tek', 'Teknisi',      'actor'),
    ])
    sb.msg('tek', 'kbn', 'menggeser status tugas menjadi Working On It')
    sb.msg('kbn', 'tug', 'memperbarui status tugas')
    sb.msg('tek', 'kbn', 'mengunggah foto bukti pekerjaan')
    sb.msg('kbn', 'tug', 'menyimpan bukti pada tugas')
    sb.msg('tug', 'kbn', 'mengonfirmasi penyimpanan', 'return')
    sb.msg('kbn', 'mgr', 'menampilkan notifikasi tugas siap ditinjau', 'return')
    sb.msg('mgr', 'kbn', 'membuka papan kanban dan meninjau bukti')
    sb.msg('mgr', 'kbn', 'menyetujui tugas menjadi Done')
    sb.msg('kbn', 'tug', 'memperbarui status tugas menjadi Done')
    sb.msg('kbn', 'kbn', 'menghitung ulang SPI dan Health Status')
    sb.msg('tug', 'kbn', 'mengembalikan data terbaru', 'return')
    sb.msg('kbn', 'mgr', 'memperbarui dashboard secara real-time', 'return')
    sb.msg('kbn', 'tek', 'mengirim notifikasi tugas telah disetujui', 'return')
    return sb.emit('Sequence Diagram Pelaporan Progres Harian (Review Gate)', '4.11',
                   'Sequence Diagram Pelaporan Progres Harian')


def sd3_pengelolaan_proyek():
    """SD Pengelolaan Proyek — Gambar 4.12 (mirror Activity 4.7).
    Aktor (1): Manajer
    Lifelines (2): Form Proyek, Data Proyek
    """
    sb = SeqBuilder(page_w=900, lifelines=[
        ('akt', 'Manajer',     'actor'),
        ('frm', 'Form Proyek', 'object'),
        ('dat', 'Data Proyek', 'object'),
    ])
    sb.msg('akt', 'frm', 'memilih opsi tambah proyek baru dan mengisi detail')
    sb.msg('akt', 'frm', 'memasukkan rentang waktu pengerjaan')
    sb.msg('frm', 'dat', 'meminta pengecekan ketersediaan teknisi')
    sb.msg('dat', 'dat', 'memfilter teknisi berdasarkan jadwal')
    sb.msg('dat', 'frm', 'mengembalikan daftar teknisi tersedia', 'return')
    sb.msg('frm', 'akt', 'menampilkan daftar teknisi yang tersedia', 'return')
    sb.msg('akt', 'frm', 'memilih teknisi dan menyusun daftar tugas')
    sb.msg('akt', 'frm', 'menekan tombol simpan proyek')
    sb.msg('frm', 'dat', 'menyimpan data proyek dan alokasi tugas')
    sb.msg('dat', 'frm', 'mengonfirmasi penyimpanan', 'return')
    sb.msg('frm', 'akt', 'menampilkan pesan sukses dan distribusi notifikasi', 'return')
    return sb.emit('Sequence Diagram Pengelolaan Proyek', '4.12',
                   'Sequence Diagram Pengelolaan Proyek')


def sd4_dashboard_ews():
    """SD Dashboard Early Warning System — Gambar 4.13 (mirror Activity 4.8).
    Aktor (1): Manajer
    Lifelines (2): Dashboard, Data Proyek
    """
    sb = SeqBuilder(page_w=900, lifelines=[
        ('akt', 'Manajer',     'actor'),
        ('dsh', 'Dashboard',   'object'),
        ('dat', 'Data Proyek', 'object'),
    ])
    sb.msg('akt', 'dsh', 'mengakses halaman utama dashboard')
    sb.msg('dsh', 'dat', 'meneruskan permintaan ekstraksi data metrik')
    sb.msg('dat', 'dat', 'memproses kueri data SPI dan status tugas')
    sb.msg('dat', 'dsh', 'mengembalikan data metrik proyek', 'return')
    sb.msg('dsh', 'dsh', 'memetakan status kesehatan ke indikator warna EWS')
    sb.msg('dsh', 'dsh', 'mengurutkan proyek berdasarkan tingkat urgensi')
    sb.msg('dsh', 'akt', 'menampilkan dashboard dengan indikator peringatan dini', 'return')
    return sb.emit('Sequence Diagram Dashboard Early Warning System', '4.13',
                   'Sequence Diagram Dashboard Early Warning System')


def sd5_eskalasi():
    """SD Pengajuan & Penanganan Eskalasi — Gambar 4.14 (mirror Activity 4.9).
    Aktor (2): Teknisi (kiri), Manajer (kanan)
    Lifelines (2): Form Eskalasi, Data Eskalasi
    """
    sb = SeqBuilder(page_w=1200, lifelines=[
        ('tek', 'Teknisi',        'actor'),
        ('frm', 'Form Eskalasi',  'object'),
        ('dat', 'Data Eskalasi',  'object'),
        ('mgr', 'Manajer',        'actor'),
    ])
    sb.msg('tek', 'frm', 'membuka form eskalasi kendala')
    sb.msg('tek', 'frm', 'mengisi detail kendala lapangan')
    sb.msg('tek', 'frm', 'mengirim laporan eskalasi')
    sb.msg('frm', 'dat', 'menyimpan tiket eskalasi baru')
    sb.msg('dat', 'frm', 'mengonfirmasi penyimpanan', 'return')
    sb.msg('frm', 'mgr', 'menampilkan indikator flag merah pada dashboard', 'return')
    sb.msg('mgr', 'frm', 'meninjau detail kendala eskalasi')
    sb.msg('mgr', 'frm', 'mengirim instruksi penanganan')
    sb.msg('frm', 'dat', 'memperbarui status tiket menjadi Ditangani')
    sb.msg('dat', 'frm', 'mengonfirmasi pembaruan status', 'return')
    sb.msg('frm', 'tek', 'meneruskan instruksi balasan dan notifikasi selesai', 'return')
    return sb.emit('Sequence Diagram Pengajuan dan Penanganan Eskalasi', '4.14',
                   'Sequence Diagram Pengajuan dan Penanganan Eskalasi')


# ============ main ============

if __name__ == '__main__':
    targets = [
        ('SD_AUTENTIKASI.drawio',        sd1_autentikasi),
        ('SD_REVIEW_GATE.drawio',        sd2_review_gate),
        ('SD_PENGELOLAAN_PROYEK.drawio', sd3_pengelolaan_proyek),
        ('SD_DASHBOARD_EWS.drawio',      sd4_dashboard_ews),
        ('SD_ESKALASI.drawio',           sd5_eskalasi),
    ]
    for fn, builder in targets:
        xml = builder()
        path = OUT_DIR / fn
        path.write_text(xml, encoding='utf-8')
        print(f'  {fn:40s} | {path.stat().st_size:>6d} bytes')
    print(f'output dir: {OUT_DIR}')
