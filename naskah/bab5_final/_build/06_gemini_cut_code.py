"""
Loop 10 handler functions, ask Gemini to cut each to <=45 lines
preserving business logic. Apply tb_* table-name transform first
so Gemini sees BAB IV nomenclature. Save outputs to gemini_outputs/cut_code.json.
"""

import re, json, subprocess, sys
from pathlib import Path

HERE      = Path(__file__).resolve().parent
ROOT      = HERE.parents[2]
HANDLERS  = ROOT / 'frontend/src/lib/handlers'
OUT_DIR   = HERE / 'gemini_outputs'
OUT_DIR.mkdir(exist_ok=True)
OUT_FILE  = OUT_DIR / 'cut_code.json'

sys.path.insert(0, str(HERE))
from code_transform import transform_code

MAPPING = [
    ('auth.ts',       'login',                  'Halaman Login'),
    ('projects.ts',   'createProject',          'Halaman Tambah Proyek'),
    ('activities.ts', 'createActivity',         'Halaman Tambah Daily Report'),
    ('dashboard.ts',  'getDashboard',           'Halaman Dashboard EWS'),
    ('projects.ts',   'listProjects',           'Halaman Data Proyek'),
    ('tasks.ts',      'changeTaskStatus',       'Halaman Kanban Penugasan Proyek'),
    ('tasks.ts',      'getScheduleTasks',       'Halaman Jadwal Proyek'),
    ('dashboard.ts',  'getTechnicianDashboard', 'Halaman Dashboard Performa Teknisi'),
    ('projects.ts',   'getProject',             'Halaman Detail Proyek'),
    ('dashboard.ts',  'chartEarnedValue',       'Halaman Laporan Kesehatan Proyek'),
]


def extract_function(filename: str, fn_name: str) -> str:
    text = (HANDLERS / filename).read_text()
    m = re.search(rf'^export (async )?function {fn_name}\b.*?\{{', text, re.M | re.S)
    if not m:
        raise RuntimeError(f"Function not found: {filename}:{fn_name}")
    start = m.start()
    depth = 0; i = m.end() - 1
    while i < len(text):
        c = text[i]
        if c == '{': depth += 1
        elif c == '}':
            depth -= 1
            if depth == 0:
                return text[start:i+1].rstrip()
        i += 1
    raise RuntimeError(f"Unmatched braces in {filename}:{fn_name}")


def ask_gemini(prompt: str) -> str:
    """Call gemini via the wrapper, return stdout text."""
    sh = HERE / 'gemini_ask.sh'
    result = subprocess.run(
        [str(sh), prompt],
        capture_output=True, text=True, timeout=180,
    )
    if result.returncode != 0:
        raise RuntimeError(f"gemini_ask.sh failed: {result.stderr}")
    # Extract just the model response between markers in our wrapper output
    out = result.stdout
    m = re.search(r'----- RESPONSE -----\n(.*?)\n\n\[ASK\] Logged', out, re.S)
    if m:
        body = m.group(1)
    else:
        body = out
    # Strip the "Ripgrep is not available..." preamble if present
    body = re.sub(r'^Ripgrep is not available.*?\n', '', body, flags=re.M)
    return body.strip()


def cut_one(filename, fn_name, module_label):
    raw   = extract_function(filename, fn_name)
    raw_tb = transform_code(raw)
    n_lines = raw_tb.count('\n') + 1
    prompt = (
        "TASK: CUT_TS_FUNCTION\n"
        f"MODUL: {module_label}\n"
        f"FILE: {filename}  •  FUNGSI: {fn_name}\n"
        f"BARIS_ASLI: {n_lines}\n"
        "TARGET: Pangkas fungsi TypeScript di bawah ke MAKSIMAL 45 baris. "
        "Pertahankan: (1) signature fungsi, (2) seluruh string SQL utuh "
        "(jangan diubah), (3) alur logika utama (validasi otorisasi inti, "
        "operasi DB, return). Ganti boilerplate (try/catch verbose, "
        "validasi input panjang, console.log, comment) dengan SATU baris "
        "penanda: `// ... (validasi & error handling)` atau "
        "`// ... (helper omitted)` sesuai konteks.\n"
        "FORMAT_OUTPUT: Hanya kode TypeScript murni. JANGAN bungkus dalam "
        "markdown code-fence (no ```). JANGAN tambahkan komentar penjelas "
        "di luar yang ada di kode. JANGAN narasi/preambule.\n\n"
        "KODE_INPUT:\n"
        f"{raw_tb}"
    )
    print(f"[Gemini cut] {filename}:{fn_name} ({n_lines} -> target ≤45)")
    out = ask_gemini(prompt)
    # Strip any leftover markdown fence just in case
    out = re.sub(r'^```(?:typescript|ts)?\n?', '', out)
    out = re.sub(r'\n?```\s*$', '', out)
    cut_lines = out.count('\n') + 1
    print(f"  -> {cut_lines} baris\n")
    return {
        'file': filename,
        'fn': fn_name,
        'module': module_label,
        'orig_lines': n_lines,
        'cut_lines': cut_lines,
        'code': out,
    }


def main():
    results = {}
    for filename, fn_name, label in MAPPING:
        key = f"{filename}::{fn_name}"
        results[key] = cut_one(filename, fn_name, label)
        OUT_FILE.write_text(json.dumps(results, ensure_ascii=False, indent=2))
    print(f"\nSaved {len(results)} entries to {OUT_FILE}")


if __name__ == '__main__':
    main()
