# /// script
# requires-python = ">=3.11"
# dependencies = ["python-docx>=1.1.2"]
# ///
"""Generate 4.3.3 Perancangan Fisik Basis Data .docx aligned to ERD (6 entitas).
Tables: tb_user, tb_klien, tb_proyek, tb_penugasan_proyek, tb_tugas, tb_bukti,
tb_eskalasi. Style: Times New Roman, 5-col schema tables."""
from docx import Document
from docx.shared import Pt, Cm, RGBColor, Twips
from docx.enum.table import WD_ALIGN_VERTICAL, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

OUT = r"D:\__CODING\05-MyProjects\__IRENE\shi-crm\diagram\ai\4.3.3_PERANCANGAN_FISIK.docx"
FONT = "Times New Roman"

# Column widths in twips (DXA). 5 columns: No | Nama Field | Tipe Data | Panjang | Constraint
COL_W = [600, 2400, 1800, 3360, 1500]

TABLES = [
    {
        "num": "4.6", "title": "User", "nama": "tb_user", "pk": "id_user", "fk": [],
        "rows": [
            ("id_user", "BIGINT", "20", "PK"),
            ("name", "VARCHAR", "255", ""),
            ("email", "VARCHAR", "255", "Unique"),
            ("password_hash", "VARCHAR", "255", ""),
            ("role", "ENUM", "'technician','manager','admin'", ""),
            ("is_active", "TINYINT", "1", "Default: 1"),
            ("created_at", "TIMESTAMP", "-", ""),
        ],
    },
    {
        "num": "4.7", "title": "Klien", "nama": "tb_klien", "pk": "id_klien", "fk": [],
        "rows": [
            ("id_klien", "BIGINT", "20", "PK"),
            ("nama_klien", "VARCHAR", "255", ""),
            ("alamat", "VARCHAR", "255", ""),
            ("no_telp", "VARCHAR", "20", ""),
            ("email", "VARCHAR", "255", ""),
            ("created_at", "TIMESTAMP", "-", ""),
        ],
    },
    {
        "num": "4.8", "title": "Proyek", "nama": "tb_proyek", "pk": "id_proyek",
        "fk": [
            "id_klien (terhubung dengan tb_klien)",
            "created_by (terhubung dengan tb_user)",
        ],
        "rows": [
            ("id_proyek", "BIGINT", "20", "PK"),
            ("nama_proyek", "VARCHAR", "255", ""),
            ("id_klien", "BIGINT", "20", "FK"),
            ("start_date", "DATE", "-", ""),
            ("end_date", "DATE", "-", ""),
            ("status", "ENUM", "'active','completed','on-hold'", "Default: active"),
            ("phase", "ENUM", "'survey','execution'", "Default: survey"),
            ("project_value", "DECIMAL", "15,2", ""),
            ("survey_approved", "TINYINT", "1", "Default: 0"),
            ("created_by", "BIGINT", "20", "FK"),
            ("created_at", "TIMESTAMP", "-", ""),
        ],
    },
    {
        "num": "4.9", "title": "Penugasan Proyek", "nama": "tb_penugasan_proyek",
        "pk": "(id_proyek, id_user)",
        "fk": [
            "id_proyek (terhubung dengan tb_proyek)",
            "id_user (terhubung dengan tb_user)",
        ],
        "rows": [
            ("id_proyek", "BIGINT", "20", "PK, FK"),
            ("id_user", "BIGINT", "20", "PK, FK"),
            ("assigned_at", "TIMESTAMP", "-", ""),
        ],
    },
    {
        "num": "4.10", "title": "Tugas", "nama": "tb_tugas", "pk": "id_tugas",
        "fk": [
            "id_proyek (terhubung dengan tb_proyek)",
            "assigned_to (terhubung dengan tb_user)",
            "created_by (terhubung dengan tb_user)",
        ],
        "rows": [
            ("id_tugas", "BIGINT", "20", "PK"),
            ("id_proyek", "BIGINT", "20", "FK"),
            ("nama_tugas", "VARCHAR", "255", ""),
            ("assigned_to", "BIGINT", "20", "FK"),
            ("status", "ENUM", "'to_do','working_on_it','done'", "Default: to_do"),
            ("due_date", "DATE", "-", ""),
            ("sort_order", "INT", "11", ""),
            ("created_by", "BIGINT", "20", "FK"),
            ("created_at", "TIMESTAMP", "-", ""),
            ("updated_at", "TIMESTAMP", "-", ""),
        ],
    },
    {
        "num": "4.11", "title": "Bukti", "nama": "tb_bukti", "pk": "id_bukti",
        "fk": [
            "id_tugas (terhubung dengan tb_tugas)",
            "uploaded_by (terhubung dengan tb_user)",
        ],
        "rows": [
            ("id_bukti", "BIGINT", "20", "PK"),
            ("id_tugas", "BIGINT", "20", "FK"),
            ("file_path", "VARCHAR", "500", ""),
            ("file_name", "VARCHAR", "255", ""),
            ("file_type", "ENUM", "'image','document','video'", ""),
            ("file_size", "INT", "11", ""),
            ("uploaded_by", "BIGINT", "20", "FK"),
            ("uploaded_at", "TIMESTAMP", "-", ""),
        ],
    },
    {
        "num": "4.12", "title": "Eskalasi", "nama": "tb_eskalasi", "pk": "id_eskalasi",
        "fk": [
            "id_proyek (terhubung dengan tb_proyek)",
            "id_tugas (terhubung dengan tb_tugas)",
            "reported_by (terhubung dengan tb_user)",
        ],
        "rows": [
            ("id_eskalasi", "BIGINT", "20", "PK"),
            ("id_proyek", "BIGINT", "20", "FK"),
            ("id_tugas", "BIGINT", "20", "FK"),
            ("reported_by", "BIGINT", "20", "FK"),
            ("title", "VARCHAR", "255", ""),
            ("description", "TEXT", "-", ""),
            ("priority", "ENUM", "'low','medium','high'", "Default: medium"),
            ("status", "ENUM", "'open','handled','closed'", "Default: open"),
            ("created_at", "TIMESTAMP", "-", ""),
        ],
    },
]

INTRO = (
    "Perancangan model fisik basis data merupakan tahap akhir dalam proses desain "
    "basis data. Pada tahap ini, skema logis atau model Entity Relationship Diagram "
    "(ERD) yang telah dirancang sebelumnya diwujudkan menjadi basis data nyata "
    "menggunakan perangkat lunak manajemen basis data (DBMS) yang dipilih. Tujuan "
    "utama dari perancangan fisik ini adalah untuk mencapai efisiensi dalam "
    "pemrosesan dan pengelolaan data. Berikut adalah perancangan model fisik basis "
    "data untuk sistem manajemen proyek di PT Smart Home Inovasi (SHI)."
)


def set_cell_shading(cell, color_hex: str) -> None:
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), color_hex)
    tc_pr.append(shd)


def set_cell_borders(cell) -> None:
    tc_pr = cell._tc.get_or_add_tcPr()
    tc_borders = OxmlElement("w:tcBorders")
    for side in ("top", "left", "bottom", "right"):
        b = OxmlElement(f"w:{side}")
        b.set(qn("w:val"), "single")
        b.set(qn("w:sz"), "4")
        b.set(qn("w:color"), "000000")
        tc_borders.append(b)
    tc_pr.append(tc_borders)


def style_run(run, *, bold: bool = False, size: int = 11, italic: bool = False) -> None:
    run.font.name = FONT
    run.font.size = Pt(size)
    run.bold = bold
    run.italic = italic
    rpr = run._element.get_or_add_rPr()
    r_fonts = rpr.find(qn("w:rFonts"))
    if r_fonts is None:
        r_fonts = OxmlElement("w:rFonts")
        rpr.append(r_fonts)
    for attr in ("w:ascii", "w:hAnsi", "w:cs", "w:eastAsia"):
        r_fonts.set(qn(attr), FONT)


def write_cell(cell, text: str, *, bold: bool = False, center: bool = False,
               header: bool = False) -> None:
    cell.text = ""
    p = cell.paragraphs[0]
    if center:
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run(text)
    style_run(run, bold=bold or header, size=11)
    cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
    set_cell_borders(cell)
    if header:
        set_cell_shading(cell, "D9E2F3")


def add_para(doc, text: str, *, bold: bool = False, italic: bool = False,
             center: bool = False, justify: bool = False, indent_first: float = 0.0,
             indent_left: float = 0.0, size: int = 11, space_before: int = 0,
             space_after: int = 6, heading_level: int | None = None):
    p = doc.add_paragraph()
    if heading_level is not None:
        p.style = doc.styles[f"Heading {heading_level}"]
    if center:
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    elif justify:
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    pf = p.paragraph_format
    if indent_first:
        pf.first_line_indent = Cm(indent_first)
    if indent_left:
        pf.left_indent = Cm(indent_left)
    pf.space_before = Pt(space_before)
    pf.space_after = Pt(space_after)
    run = p.add_run(text)
    style_run(run, bold=bold, italic=italic, size=size)
    return p


def set_col_widths(table, widths_twips: list[int]) -> None:
    for row in table.rows:
        for idx, cell in enumerate(row.cells):
            cell.width = Twips(widths_twips[idx])


def build_table(doc, t: dict) -> None:
    rows = t["rows"]
    table = doc.add_table(rows=len(rows) + 1, cols=5)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    headers = ("No", "Nama Field", "Tipe Data", "Panjang Karakter", "Constraint")
    for i, h in enumerate(headers):
        write_cell(table.rows[0].cells[i], h, header=True, center=True)

    for r_idx, (field, dtype, length, constraint) in enumerate(rows, start=1):
        write_cell(table.rows[r_idx].cells[0], str(r_idx), center=True)
        write_cell(table.rows[r_idx].cells[1], field)
        write_cell(table.rows[r_idx].cells[2], dtype)
        write_cell(table.rows[r_idx].cells[3], length)
        write_cell(table.rows[r_idx].cells[4], constraint, center=True)

    set_col_widths(table, COL_W)


def main() -> None:
    doc = Document()

    style = doc.styles["Normal"]
    style.font.name = FONT
    style.font.size = Pt(12)
    rpr = style.element.get_or_add_rPr()
    r_fonts = rpr.find(qn("w:rFonts"))
    if r_fonts is None:
        r_fonts = OxmlElement("w:rFonts")
        rpr.append(r_fonts)
    for attr in ("w:ascii", "w:hAnsi", "w:cs", "w:eastAsia"):
        r_fonts.set(qn(attr), FONT)

    section = doc.sections[0]
    section.top_margin = Cm(2.54)
    section.bottom_margin = Cm(2.54)
    section.left_margin = Cm(2.54)
    section.right_margin = Cm(2.54)

    add_para(doc, "4.3.3  Perancangan Fisik Basis Data", bold=True, size=12,
             space_before=12, space_after=12)

    add_para(doc, INTRO, justify=True, indent_first=1.27, size=12, space_after=12)

    for idx, t in enumerate(TABLES, start=1):
        add_para(
            doc, f"{idx}.  Tabel {t['title']}", bold=True, size=12,
            indent_left=0.75, space_before=10, space_after=4,
        )
        add_para(doc, f"Nama Tabel: {t['nama']}", indent_left=1.5, size=12,
                 space_after=2)
        add_para(doc, f"Primary Key: {t['pk']}", indent_left=1.5, size=12,
                 space_after=2)
        for fk in t["fk"]:
            add_para(doc, f"Foreign Key: {fk}", indent_left=1.5, size=12,
                     space_after=2)
        add_para(doc, f"Tabel {t['num']} {t['title']}", italic=True, center=True,
                 size=11, space_before=6, space_after=4)
        build_table(doc, t)
        add_para(doc, "", size=11, space_after=0)

    doc.save(OUT)
    print(f"OK {OUT}")


if __name__ == "__main__":
    main()
