"""
Regenerate 28 narrative paragraphs for 5.2.1 via Gemini.
Maintains chain context so Gemini can avoid repeating opening
phrases across tables/ops.
"""

import re, json, subprocess, sys
from pathlib import Path

HERE      = Path(__file__).resolve().parent
OUT_DIR   = HERE / 'gemini_outputs'
OUT_DIR.mkdir(exist_ok=True)
OUT_FILE  = OUT_DIR / 'narratives.json'

sys.path.insert(0, str(HERE))
import importlib.util
spec = importlib.util.spec_from_file_location("crud", HERE / "02_crud_queries.py")
crud = importlib.util.module_from_spec(spec); spec.loader.exec_module(crud)


# Mapping: op -> result-status template for "what got returned" context
RESULT_HINT = {
    'INSERT': '1 baris berhasil ditambahkan (INSERT 0 1)',
    'SELECT': 'sejumlah n baris dikembalikan sesuai filter',
    'UPDATE': '1 baris berhasil diperbarui (UPDATE 1)',
    'DELETE': '1 baris berhasil dihapus (DELETE 1)',
}


def ask_gemini(prompt: str) -> str:
    sh = HERE / 'gemini_ask.sh'
    result = subprocess.run(
        [str(sh), prompt], capture_output=True, text=True, timeout=180
    )
    if result.returncode != 0:
        raise RuntimeError(f"gemini_ask.sh failed: {result.stderr}")
    out = result.stdout
    m = re.search(r'----- RESPONSE -----\n(.*?)\n\n\[ASK\] Logged', out, re.S)
    body = m.group(1) if m else out
    body = re.sub(r'^Ripgrep is not available.*?\n', '', body, flags=re.M)
    return body.strip()


def main():
    results = {}

    # Initial context boost: remind Gemini of the anti-repetition rule
    setup_prompt = (
        "TASK: REGISTER_TASK_BATCH\n"
        "BATCH: Menulis ulang 28 paragraf narasi pendek untuk 5.2.1 "
        "Pembahasan Basis Data. Saya akan kirim satu per satu (urutan: "
        "tb_user × 4 op, lalu tb_klien × 4 op, dst.).\n"
        "ATURAN_LINTAS_BATCH:\n"
        "1. JANGAN pernah memulai paragraf dengan frasa identik antar "
        "tabel. Bila tabel ke-N memakai 'Query INSERT pada tabel X "
        "berfungsi…', maka tabel berikutnya WAJIB pakai pembuka berbeda "
        "('Operasi penambahan data pada tabel X dilakukan…', "
        "'Penyimpanan baris baru pada tabel X dieksekusi…', dst.).\n"
        "2. Setiap paragraf 3–5 kalimat, narasi akademis, tanpa bullet, "
        "tanpa kalimat penutup ceremonial.\n"
        "3. Setiap paragraf wajib menyebut: tujuan operasi, konteks "
        "bisnis (kapan dipakai di sistem), dan dampak hasil pada tabel "
        "lain atau modul (untuk SELECT: peran data sebagai sumber UI).\n"
        "4. Nomenklatur STRICT BAB IV: gunakan tb_user, tb_klien, "
        "tb_proyek, tb_penugasan_proyek, tb_tugas, tb_bukti, tb_eskalasi "
        "dan kolom id_user/id_klien/id_proyek/id_tugas/id_bukti/id_eskalasi.\n"
        "5. Output tiap permintaan: HANYA paragraf, tanpa heading, tanpa "
        "preambule 'Berikut adalah…'.\n"
        "Konfirmasi terima dengan 'BATCH READY.'"
    )
    print("[Setup] Sending batch register prompt...")
    ack = ask_gemini(setup_prompt)
    print(f"  Gemini: {ack[:120]}")
    print()

    for table, ops, label in crud.ALL_TABLES:
        for idx, entry in enumerate(ops, start=1):
            op   = entry['op']
            sql  = entry['sql']
            key  = f"{table}::{op}"
            prompt = (
                "TASK: GEN_NARRATIVE_521\n"
                f"TABEL: {table} ({label})\n"
                f"OPERASI: {op}\n"
                f"HASIL_EKSEKUSI_TIPIKAL: {RESULT_HINT[op]}\n"
                f"SQL_REFERENSI:\n{sql}\n"
                "TARGET: 1 paragraf narasi 3–5 kalimat sesuai aturan "
                "batch. Bahasa Indonesia formal akademik.\n"
                "FORMAT_OUTPUT: hanya teks paragraf, tanpa heading."
            )
            print(f"[Gemini narr] {table} / {op}")
            narr = ask_gemini(prompt)
            narr = re.sub(r'^"|"$', '', narr.strip())
            print(f"  -> {len(narr)} chars; opens: {narr[:60]!r}")
            results[key] = narr
            OUT_FILE.write_text(json.dumps(results, ensure_ascii=False, indent=2))

    print(f"\nSaved {len(results)} narratives to {OUT_FILE}")


if __name__ == '__main__':
    main()
