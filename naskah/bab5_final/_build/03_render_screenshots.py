"""
Render CRUD query screenshots for 5.2.1 Pembahasan Basis Data.

For each (table, operation) in ALL_TABLES:
  1. Execute the SQL inside a single per-table transaction (so INSERT
     persists for SELECT/UPDATE/DELETE), then rollback at end to keep
     seed intact.
  2. Render two PNGs:
       <table>_<NN>_<op>_sql.png     - SQL panel (DBeaver-like)
       <table>_<NN>_<op>_result.png  - Result panel
"""

import sys, os
from pathlib import Path
import psycopg2
from psycopg2.errors import InFailedSqlTransaction
from PIL import Image, ImageDraw, ImageFont
from pygments import highlight
from pygments.lexers.sql import PostgresLexer
from pygments.formatters import ImageFormatter
from pygments.styles import get_style_by_name

ROOT = Path(__file__).resolve().parent
SCREENSHOTS_DIR = ROOT.parent / 'screenshots'
SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)

sys.path.insert(0, str(ROOT))
from importlib import import_module
import importlib.util
spec = importlib.util.spec_from_file_location("crud", ROOT / "02_crud_queries.py")
crud = importlib.util.module_from_spec(spec); spec.loader.exec_module(crud)

DB_DSN = "host=127.0.0.1 port=5432 dbname=shi_dashboard_new user=postgres password=12345"

# ── Fonts ──────────────────────────────────────────────────────────────────
FONT_MONO_PATH = "/System/Library/Fonts/Menlo.ttc"
FONT_UI_PATH   = "/System/Library/Fonts/Helvetica.ttc"
FONT_UI_BOLD   = "/System/Library/Fonts/Helvetica.ttc"

def font(path, size, idx=0):
    try:
        return ImageFont.truetype(path, size, index=idx)
    except Exception:
        return ImageFont.load_default()

F_MONO   = font(FONT_MONO_PATH, 18)
F_MONO_S = font(FONT_MONO_PATH, 14)
F_UI     = font(FONT_UI_PATH, 16)
F_UI_B   = font(FONT_UI_PATH, 17, idx=1)
F_TITLE  = font(FONT_UI_PATH, 14)

# ── Colors (DBeaver-ish light theme) ───────────────────────────────────────
C_BG       = (250, 250, 252)
C_TITLEBAR = (228, 230, 236)
C_TAB      = (245, 246, 250)
C_TAB_ACT  = (255, 255, 255)
C_BORDER   = (200, 204, 212)
C_TEXT     = (32, 36, 48)
C_HEADER   = (235, 238, 245)
C_HEADER_T = (60, 70, 90)
C_ROW_ALT  = (244, 247, 252)
C_LINENO   = (160, 168, 180)
C_KEYWORD  = (38, 95, 175)
C_STRING   = (175, 50, 28)
C_NUMBER   = (135, 78, 0)
C_COMMENT  = (130, 138, 152)

# ── Pygments image formatter for SQL ───────────────────────────────────────
SQL_STYLE = get_style_by_name('friendly')


def _render_sql_image(sql_text: str, target_width: int) -> Image.Image:
    """Use Pygments ImageFormatter to render syntax-highlighted SQL."""
    formatter = ImageFormatter(
        font_name='Menlo',
        font_size=16,
        line_numbers=True,
        line_number_chars=2,
        line_number_pad=10,
        line_number_bg='#e8eaf2',
        line_number_fg='#7a8194',
        line_pad=4,
        style='friendly',
        image_pad=12,
        background='#ffffff',
    )
    png_bytes = highlight(sql_text, PostgresLexer(), formatter)
    from io import BytesIO
    img = Image.open(BytesIO(png_bytes)).convert('RGB')
    # Pad to target width
    if img.width < target_width:
        bg = Image.new('RGB', (target_width, img.height), '#ffffff')
        bg.paste(img, (0, 0))
        img = bg
    return img


def render_sql_panel(table, op_idx, op, sql, out_path):
    """Compose a window: title bar + tab + sql editor."""
    W = 980
    # First render the SQL body so we know its height
    sql_img = _render_sql_image(sql, W - 2)  # account for borders
    body_h = sql_img.height
    H_TITLE = 32
    H_TAB = 30
    H = H_TITLE + H_TAB + body_h + 2

    canvas = Image.new('RGB', (W, H), C_BG)
    d = ImageDraw.Draw(canvas)

    # Title bar
    d.rectangle([0, 0, W, H_TITLE], fill=C_TITLEBAR)
    d.rectangle([0, H_TITLE-1, W, H_TITLE], fill=C_BORDER)
    title_txt = f"PostgreSQL — {table}  •  Query Editor"
    d.text((14, 9), title_txt, font=F_TITLE, fill=(80, 88, 104))
    # Window dots
    for i, c in enumerate([(255,95,86),(255,189,46),(39,201,63)]):
        d.ellipse([W-78+i*22, 10, W-66+i*22, 22], fill=c)

    # Tab
    tab_y0 = H_TITLE
    d.rectangle([0, tab_y0, W, tab_y0+H_TAB], fill=C_TAB)
    d.rectangle([12, tab_y0+4, 280, tab_y0+H_TAB], fill=C_TAB_ACT,
                outline=C_BORDER)
    d.text((22, tab_y0+8), f"{op} — {table}", font=F_TITLE, fill=C_TEXT)
    d.rectangle([0, tab_y0+H_TAB-1, W, tab_y0+H_TAB], fill=C_BORDER)

    # SQL body
    canvas.paste(sql_img, (1, tab_y0+H_TAB))
    # Outer border
    d.rectangle([0, 0, W-1, H-1], outline=C_BORDER)

    canvas.save(out_path, 'PNG', optimize=True)


def render_result_panel(table, op_idx, op, columns, rows, status_text, out_path):
    """Render result table or status line."""
    W = 980
    H_TITLE = 32
    H_TAB = 30
    H_HDR = 32
    ROW_H = 28
    PAD = 12

    if not columns:
        # Status-only (no RETURNING / DDL): pure message
        H = H_TITLE + H_TAB + 90
        canvas = Image.new('RGB', (W, H), C_BG)
        d = ImageDraw.Draw(canvas)
        _draw_chrome(d, W, H_TITLE, H_TAB, table, op, 'Output')
        d.text((PAD+4, H_TITLE+H_TAB+16), status_text,
               font=F_MONO_S, fill=(20, 110, 60))
        d.rectangle([0, 0, W-1, H-1], outline=C_BORDER)
        canvas.save(out_path, 'PNG', optimize=True)
        return

    # Column widths: distribute proportionally to header & content max
    str_rows = [[_fmt(c) for c in r] for r in rows]
    col_w = []
    for ci, c in enumerate(columns):
        max_str = max([len(c)] + [len(r[ci]) for r in str_rows])
        col_w.append(min(38, max(10, max_str)))
    total_units = sum(col_w)
    body_w = W - 24
    pixel_w = [int(body_w * w / total_units) for w in col_w]
    # adjust rounding
    pixel_w[-1] += body_w - sum(pixel_w)

    rows_h = max(1, len(str_rows)) * ROW_H
    H = H_TITLE + H_TAB + H_HDR + rows_h + 36 + 24

    canvas = Image.new('RGB', (W, H), '#ffffff')
    d = ImageDraw.Draw(canvas)

    _draw_chrome(d, W, H_TITLE, H_TAB, table, op, 'Result')

    # Result header
    y = H_TITLE + H_TAB
    d.rectangle([0, y, W, y+H_HDR], fill=C_HEADER)
    x = 12
    for ci, c in enumerate(columns):
        d.text((x+8, y+8), c, font=F_TITLE, fill=C_HEADER_T)
        x += pixel_w[ci]
        d.line([x, y+4, x, y+H_HDR-4], fill=C_BORDER)
    d.rectangle([0, y+H_HDR-1, W, y+H_HDR], fill=C_BORDER)

    # Rows
    y += H_HDR
    if not str_rows:
        d.text((20, y+8), "(0 rows)", font=F_MONO_S, fill=(140,140,150))
        y += ROW_H
    else:
        for ri, row in enumerate(str_rows):
            if ri % 2 == 1:
                d.rectangle([0, y, W, y+ROW_H], fill=C_ROW_ALT)
            x = 12
            for ci, cell in enumerate(row):
                d.text((x+8, y+6), cell[:60], font=F_MONO_S, fill=C_TEXT)
                x += pixel_w[ci]
            y += ROW_H
            d.rectangle([0, y-1, W, y], fill=(232,234,240))

    # Footer
    y += 8
    d.rectangle([0, y, W, y+28], fill=C_HEADER)
    d.text((14, y+6), status_text, font=F_TITLE, fill=(20, 110, 60))

    d.rectangle([0, 0, W-1, H-1], outline=C_BORDER)
    canvas.save(out_path, 'PNG', optimize=True)


def _draw_chrome(d, W, H_TITLE, H_TAB, table, op, panel_name):
    d.rectangle([0, 0, W, H_TITLE], fill=C_TITLEBAR)
    d.rectangle([0, H_TITLE-1, W, H_TITLE], fill=C_BORDER)
    d.text((14, 9), f"PostgreSQL — {table}  •  {panel_name}",
           font=F_TITLE, fill=(80, 88, 104))
    for i, c in enumerate([(255,95,86),(255,189,46),(39,201,63)]):
        d.ellipse([W-78+i*22, 10, W-66+i*22, 22], fill=c)
    tab_y0 = H_TITLE
    d.rectangle([0, tab_y0, W, tab_y0+H_TAB], fill=C_TAB)
    d.rectangle([12, tab_y0+4, 280, tab_y0+H_TAB], fill=C_TAB_ACT,
                outline=C_BORDER)
    d.text((22, tab_y0+8), f"{op} — {table}", font=F_TITLE, fill=C_TEXT)
    d.rectangle([0, tab_y0+H_TAB-1, W, tab_y0+H_TAB], fill=C_BORDER)


def _fmt(v):
    if v is None:
        return 'NULL'
    if isinstance(v, str):
        return v
    return str(v)


def execute_lifecycle(table, ops, conn):
    """Run INSERT, SELECT, UPDATE, DELETE in one transaction.
    Yields (op_idx, op, sql, columns, rows, status) per operation.
    Rolls back the whole transaction at the end."""
    conn.rollback()  # ensure clean state
    cur = conn.cursor()
    results = []
    for idx, entry in enumerate(ops):
        op  = entry['op']
        sql = entry['sql']
        try:
            cur.execute(sql)
            try:
                cols = [d.name for d in cur.description] if cur.description else []
            except Exception:
                cols = []
            rows = cur.fetchall() if cols else []
            rc = cur.rowcount
            if op == 'INSERT':
                status = f"INSERT 0 {rc}  •  {rc} row affected"
            elif op == 'UPDATE':
                status = f"UPDATE {rc}  •  {rc} row affected"
            elif op == 'DELETE':
                status = f"DELETE {rc}  •  {rc} row affected"
            else:
                status = f"SELECT {rc}  •  {rc} rows returned"
        except Exception as e:
            cols, rows = [], []
            status = f"ERROR: {type(e).__name__}: {e}"
            conn.rollback()
            cur = conn.cursor()
        results.append((idx, op, sql, cols, rows, status))
    conn.rollback()
    cur.close()
    return results


def main():
    conn = psycopg2.connect(DB_DSN)
    conn.autocommit = False
    total = 0
    for table, ops, _label in crud.ALL_TABLES:
        print(f"\n── {table} ──")
        results = execute_lifecycle(table, ops, conn)
        for idx, op, sql, cols, rows, status in results:
            sql_path    = SCREENSHOTS_DIR / f"{table}_{idx+1:02d}_{op.lower()}_sql.png"
            result_path = SCREENSHOTS_DIR / f"{table}_{idx+1:02d}_{op.lower()}_result.png"
            render_sql_panel(table, idx, op, sql, sql_path)
            render_result_panel(table, idx, op, cols, rows, status, result_path)
            print(f"  [{op:6s}] {status}")
            print(f"          SQL    -> {sql_path.name}")
            print(f"          RESULT -> {result_path.name}")
            total += 2
    conn.close()
    print(f"\nDone. {total} PNG files written to {SCREENSHOTS_DIR}")


if __name__ == '__main__':
    main()
