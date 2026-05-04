"""Generator for 4 Sequence Diagrams (Gambar 4.10-4.13).
Spec source: diagram/TODO.md. Run: python _gen.py
Output: SD_*.drawio in this directory.
Lifeline layout mirrors activity diagram swimlanes:
  Single-actor: User (Role) | Sistem | Database
Academic style: linear happy-path only, no combined fragments.
"""
from xml.sax.saxutils import escape
import pathlib

OUT_DIR = pathlib.Path(__file__).parent


def esc(s):
    return escape(str(s), {'"': '&quot;'})


# ============ primitives ============

def actor_cell(cid, name, x, y=50):
    return (f'<mxCell id="{cid}" value="{esc(name)}" '
            f'style="shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;'
            f'outlineConnect=0;strokeColor=#000000;fillColor=#FFFFFF;fontSize=11;fontColor=#000000;" '
            f'vertex="1" parent="1">'
            f'<mxGeometry x="{x-15}" y="{y}" width="30" height="60" as="geometry"/></mxCell>')


def object_cell(cid, name, x, y=60, w=150, h=40):
    return (f'<mxCell id="{cid}" value="{esc(name)}" '
            f'style="rounded=0;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000;'
            f'strokeWidth=1.5;fontSize=11;fontColor=#000000;fontStyle=1;" '
            f'vertex="1" parent="1">'
            f'<mxGeometry x="{x-w//2}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>')


def lifeline_cell(cid, x, y_top, y_bot):
    return (f'<mxCell id="{cid}" '
            f'style="endArrow=none;html=1;rounded=0;dashed=1;strokeColor=#000000;strokeWidth=1;" '
            f'edge="1" parent="1">'
            f'<mxGeometry relative="1" as="geometry">'
            f'<mxPoint x="{x}" y="{y_top}" as="sourcePoint"/>'
            f'<mxPoint x="{x}" y="{y_bot}" as="targetPoint"/>'
            f'</mxGeometry></mxCell>')


def msg_cell(cid, x1, x2, y, label, mtype='sync'):
    if mtype == 'sync':
        style = ('endArrow=block;endFill=1;html=1;rounded=0;strokeColor=#000000;strokeWidth=1;'
                 'fontSize=10;fontColor=#000000;align=center;verticalAlign=bottom;')
    elif mtype == 'return':
        style = ('endArrow=open;endFill=0;html=1;rounded=0;dashed=1;strokeColor=#000000;'
                 'strokeWidth=1;fontSize=10;fontColor=#000000;align=center;verticalAlign=bottom;')
    elif mtype == 'async':
        style = ('endArrow=open;endFill=0;html=1;rounded=0;strokeColor=#000000;strokeWidth=1;'
                 'fontSize=10;fontColor=#000000;align=center;verticalAlign=bottom;')
    else:
        style = ('endArrow=block;endFill=1;html=1;rounded=0;strokeColor=#000000;strokeWidth=1;'
                 'fontSize=10;')
    return (f'<mxCell id="{cid}" value="{esc(label)}" style="{style}" edge="1" parent="1">'
            f'<mxGeometry relative="1" as="geometry">'
            f'<mxPoint x="{x1}" y="{y}" as="sourcePoint"/>'
            f'<mxPoint x="{x2}" y="{y}" as="targetPoint"/>'
            f'</mxGeometry></mxCell>')


def self_msg_cell(cid, x, y, label):
    style = ('endArrow=block;endFill=1;html=1;rounded=0;strokeColor=#000000;strokeWidth=1;'
             'fontSize=10;fontColor=#000000;')
    return (f'<mxCell id="{cid}" value="{esc(label)}" style="{style}" edge="1" parent="1">'
            f'<mxGeometry relative="1" as="geometry">'
            f'<mxPoint x="{x}" y="{y}" as="sourcePoint"/>'
            f'<mxPoint x="{x}" y="{y+22}" as="targetPoint"/>'
            f'<Array as="points">'
            f'<mxPoint x="{x+50}" y="{y}"/>'
            f'<mxPoint x="{x+50}" y="{y+22}"/>'
            f'</Array></mxGeometry></mxCell>')


def note_cell(cid, x, y, w, text):
    return (f'<mxCell id="{cid}" value="{esc(text)}" '
            f'style="text;html=1;align=left;fontSize=9;fontStyle=2;fontColor=#000000;'
            f'spacingLeft=4;" vertex="1" parent="1">'
            f'<mxGeometry x="{x}" y="{y}" width="{w}" height="16" as="geometry"/></mxCell>')


# ============ builder ============

class SeqBuilder:
    def __init__(self, page_w, lifelines):
        # lifelines: list of (id, name, type)
        self.page_w = page_w
        self.lifelines = lifelines
        n = len(lifelines)
        self.lx = {}
        for i, (lid, _, _) in enumerate(lifelines):
            self.lx[lid] = int(page_w * (i+1) / (n+1))
        self.body = []
        self.cid_n = 100
        self.row_y = 150

    def cid(self):
        self.cid_n += 1
        return f'c{self.cid_n}'

    def msg(self, src, dst, label, mtype='sync'):
        cid = self.cid()
        if src == dst:
            self.body.append(self_msg_cell(cid, self.lx[src], self.row_y, label))
            self.row_y += 32
        else:
            self.body.append(msg_cell(cid, self.lx[src], self.lx[dst], self.row_y, label, mtype))
            self.row_y += 28

    def note(self, text):
        cid = self.cid()
        self.body.append(note_cell(cid, 30, self.row_y, self.page_w - 60, text))
        self.row_y += 22

    def emit(self, title, caption_num, caption_text):
        head_y = 60
        head_h = 40
        line_top_obj = head_y + head_h
        line_top_actor = head_y + 60
        line_bot = self.row_y + 20
        cells = []
        cells.append(f'<mxCell id="title" value="{esc(title)}" '
                     f'style="text;html=1;align=center;fontSize=12;fontStyle=1;fontColor=#000000;" '
                     f'vertex="1" parent="1">'
                     f'<mxGeometry x="40" y="20" width="{self.page_w-80}" height="20" as="geometry"/>'
                     f'</mxCell>')
        for lid, name, typ in self.lifelines:
            x = self.lx[lid]
            if typ == 'actor':
                cells.append(actor_cell(f'{lid}_h', name, x, head_y))
                cells.append(lifeline_cell(f'{lid}_l', x, line_top_actor, line_bot))
            else:
                cells.append(object_cell(f'{lid}_h', name, x, head_y, w=150, h=head_h))
                cells.append(lifeline_cell(f'{lid}_l', x, line_top_obj, line_bot))
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
    """SD Autentikasi (Login) — Gambar 4.10
    Happy path: User submits credentials -> Sistem validates -> DB query ->
    Sistem generates token -> User redirected to dashboard.
    Academic style: linear only, no alt/loop/opt fragments.
    """
    sb = SeqBuilder(page_w=700, lifelines=[
        ('user', 'User', 'actor'),
        ('sys', 'Sistem', 'object'),
        ('db', 'Database', 'object'),
    ])
    sb.msg('user', 'sys', 'input email + password')
    sb.msg('sys', 'db', 'SELECT * FROM tb_user WHERE email = ?')
    sb.msg('db', 'sys', 'user row', 'return')
    sb.msg('sys', 'sys', 'bcrypt.compare(password, hash)')
    sb.msg('sys', 'sys', 'generate JWT (payload: id, role)')
    sb.msg('sys', 'db', 'INSERT tb_session (userId, token, expiresAt)')
    sb.msg('db', 'sys', 'ok', 'return')
    sb.msg('sys', 'user', '200 OK { token, user, role }', 'return')
    sb.msg('user', 'sys', 'redirect ke halaman dashboard')
    return sb.emit('Sequence Diagram Autentikasi (Login)', '4.10',
                   'Sequence Diagram Autentikasi')


def sd2_pengelolaan_proyek():
    """SD Pengelolaan Proyek (Tambah Proyek) — Gambar 4.11
    Happy path: open form -> fill data -> save -> DB insert project ->
    DB insert task (representative single call) -> return success.
    Academic style: linear only, no loop/opt fragments.
    """
    sb = SeqBuilder(page_w=700, lifelines=[
        ('man', 'User (Manager)', 'actor'),
        ('sys', 'Sistem', 'object'),
        ('db', 'Database', 'object'),
    ])
    sb.msg('man', 'sys', 'akses menu "Tambah Proyek"')
    sb.msg('sys', 'db', 'SELECT id, name FROM tb_client ORDER BY name')
    sb.msg('db', 'sys', 'list klien', 'return')
    sb.msg('sys', 'man', '200 OK { clients }', 'return')
    sb.msg('man', 'sys', 'input nama, klien, start/end, projectValue')
    sb.msg('sys', 'db', 'SELECT teknisi NOT IN (assignment overlap)')
    sb.msg('db', 'sys', 'teknisi available', 'return')
    sb.msg('sys', 'man', 'render rekomendasi teknisi (no-conflict)', 'return')
    sb.msg('man', 'sys', 'pilih teknisi + susun task list')
    sb.msg('man', 'sys', 'klik "Simpan Proyek"')
    sb.msg('sys', 'sys', 'BEGIN TRANSACTION')
    sb.msg('sys', 'db', 'INSERT tb_project RETURNING id')
    sb.msg('db', 'sys', 'projectId', 'return')
    sb.msg('sys', 'db', 'INSERT tb_task (project_id, title, due_date, assigned_to)')
    sb.msg('db', 'sys', 'ok', 'return')
    sb.msg('sys', 'db', 'INSERT tb_project_assignment (project_id, user_id)')
    sb.msg('db', 'sys', 'ok', 'return')
    sb.msg('sys', 'db', 'INSERT tb_project_health (spi=1.0, status=green)')
    sb.msg('db', 'sys', 'ok', 'return')
    sb.msg('sys', 'sys', 'COMMIT')
    sb.msg('sys', 'man', '201 Created { project } — redirect detail proyek', 'return')
    return sb.emit('Sequence Diagram Pengelolaan Proyek (Tambah Proyek)', '4.11',
                   'Sequence Diagram Pengelolaan Proyek')


def sd3_dashboard_ews():
    """SD Dashboard Early Warning System — Gambar 4.12
    Happy path: user opens dashboard -> Sistem fetches projects -> DB returns list ->
    Sistem calculates SPI (in-system) -> returns rendered dashboard.
    Academic style: linear only, no par/loop fragments.
    """
    sb = SeqBuilder(page_w=700, lifelines=[
        ('man', 'User (Manager)', 'actor'),
        ('sys', 'Sistem', 'object'),
        ('db', 'Database', 'object'),
    ])
    sb.msg('man', 'sys', 'akses halaman dashboard')
    sb.msg('sys', 'db', 'SELECT p.*, ph.spi_value, ph.status FROM tb_project p JOIN tb_project_health ph')
    sb.msg('db', 'sys', 'rows (spi, status, tasks)', 'return')
    sb.msg('sys', 'sys', 'map RAG: >=0.95 green, >=0.85 amber, <0.85 red')
    sb.msg('sys', 'sys', 'ORDER BY priority (red first)')
    sb.msg('sys', 'db', 'SELECT status, COUNT(*) FROM tb_task GROUP BY status')
    sb.msg('db', 'sys', 'task status counts', 'return')
    sb.msg('sys', 'db', 'SELECT tasks WHERE due_date < NOW() AND status != done')
    sb.msg('db', 'sys', 'overdue list', 'return')
    sb.msg('sys', 'db', 'SELECT cumulative EV aggregation per project')
    sb.msg('db', 'sys', 'earned value series', 'return')
    sb.msg('sys', 'sys', 'render Recharts (Pie/Bar/Line)')
    sb.msg('sys', 'man', '200 OK { projects[], summaryStats } — proyek kritis di atas', 'return')
    return sb.emit('Sequence Diagram Dashboard Early Warning System', '4.12',
                   'Sequence Diagram Dashboard Early Warning System')


def sd4_upload_evidence():
    """SD Upload Evidence — Gambar 4.13
    Happy path: open task detail -> click upload -> select file -> POST evidence ->
    Sistem saves to disk -> DB insert evidence -> DB update task status -> return success.
    Academic style: linear only, no alt fragment.
    """
    sb = SeqBuilder(page_w=700, lifelines=[
        ('tek', 'User (Teknisi)', 'actor'),
        ('sys', 'Sistem', 'object'),
        ('db', 'Database', 'object'),
    ])
    sb.msg('tek', 'sys', 'buka papan Kanban — klik task detail')
    sb.msg('sys', 'db', 'SELECT * FROM tb_task WHERE id = ?')
    sb.msg('db', 'sys', 'task row (title, status, due_date)', 'return')
    sb.msg('sys', 'tek', '200 OK { task, evidence[] } — render task detail modal', 'return')
    sb.msg('tek', 'sys', 'klik "Upload Evidence" — pilih file (foto/dokumen)')
    sb.msg('sys', 'sys', 'simpan file ke server/uploads/{taskId}/')
    sb.msg('sys', 'db', 'INSERT tb_task_evidence (task_id, file_path, file_name, uploaded_by)')
    sb.msg('db', 'sys', 'evidenceId', 'return')
    sb.msg('sys', 'db', 'UPDATE tb_task SET status=\'working_on_it\' WHERE id=? AND status=\'to_do\'')
    sb.msg('db', 'sys', 'ok', 'return')
    sb.msg('sys', 'tek', '201 Created { evidence } — konfirmasi upload berhasil', 'return')
    return sb.emit('Sequence Diagram Upload Evidence', '4.13',
                   'Sequence Diagram Upload Evidence')


# ============ main ============

if __name__ == '__main__':
    targets = [
        ('SD_AUTENTIKASI.drawio', sd1_autentikasi),
        ('SD_PENGELOLAAN_PROYEK.drawio', sd2_pengelolaan_proyek),
        ('SD_DASHBOARD_EWS.drawio', sd3_dashboard_ews),
        ('SD_UPLOAD_EVIDENCE.drawio', sd4_upload_evidence),
    ]
    for fn, builder in targets:
        xml = builder()
        path = OUT_DIR / fn
        path.write_text(xml, encoding='utf-8')
        print(f'  {fn:35s} | {path.stat().st_size:>6d} bytes')
    print(f'output dir: {OUT_DIR}')
