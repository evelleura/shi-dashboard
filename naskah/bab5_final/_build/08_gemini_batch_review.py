"""
Batch consistency review of all 28 narratives via Gemini.

Submits the entire narratives.json in a single prompt; asks Gemini to:
  (a) audit cross-paragraph consistency (terminology, voice, opening repetition)
  (b) flag any factual / nomenclature drift (tb_* + id_* must be strict)
  (c) emit replacement paragraphs ONLY for entries that need rewrite,
      keyed by `<table>::<op>`, as a JSON object

Output: gemini_outputs/review_report.txt (full Gemini reply)
        gemini_outputs/review_fixes.json (parsed replacements)
Then merge fixes back into narratives.json (backup original first).
"""

import json, re, subprocess, sys
from pathlib import Path

HERE      = Path(__file__).resolve().parent
OUT_DIR   = HERE / 'gemini_outputs'
NARR_FILE = OUT_DIR / 'narratives.json'
BACKUP    = OUT_DIR / 'narratives.before_review.json'
REPORT    = OUT_DIR / 'review_report.txt'
FIXES     = OUT_DIR / 'review_fixes.json'


def ask_gemini(prompt: str, timeout: int = 300) -> str:
    sh = HERE / 'gemini_ask.sh'
    result = subprocess.run(
        [str(sh), prompt], capture_output=True, text=True, timeout=timeout
    )
    if result.returncode != 0:
        raise RuntimeError(f"gemini_ask.sh failed: {result.stderr}")
    out = result.stdout
    m = re.search(r'----- RESPONSE -----\n(.*?)\n\n\[ASK\] Logged', out, re.S)
    body = m.group(1) if m else out
    body = re.sub(r'^Ripgrep is not available.*?\n', '', body, flags=re.M)
    return body.strip()


def build_prompt(narratives: dict) -> str:
    lines = [
        "TASK: BATCH_REVIEW_521_NARRATIVES",
        "",
        "Kamu sudah men-generate 28 narasi untuk 5.2.1 Pembahasan Basis Data.",
        "Sekarang lakukan REVIEW akhir terhadap seluruh narasi sebagai satu",
        "kumpulan utuh. Tujuan: memastikan konsistensi stilistik & faktual",
        "antar paragraf, layak untuk Tugas Akhir S1.",
        "",
        "KRITERIA AUDIT:",
        "1. PEMBUKA: Tidak boleh ada dua paragraf berbeda yang mulai dengan",
        "   kata pertama / frasa pembuka identik. Identifikasi setiap pembuka",
        "   yang BENTROK (mis. 'Penghapusan ... pada tabel X' muncul di 4 tabel",
        "   berbeda). Sarankan pembuka pengganti yang sinonim namun tetap formal.",
        "2. TERMINOLOGI: Konsisten gunakan tb_user/tb_klien/tb_proyek/",
        "   tb_penugasan_proyek/tb_tugas/tb_bukti/tb_eskalasi DAN kolom",
        "   id_user/id_klien/id_proyek/id_tugas/id_bukti/id_eskalasi. Flag",
        "   penyimpangan apa pun.",
        "3. VOICE: Bahasa Indonesia formal akademik, kalimat aktif, tidak",
        "   ceremonial, tidak bullet, 3-5 kalimat.",
        "4. SUBSTANSI: tiap paragraf wajib menyebut (a) tujuan operasi,",
        "   (b) konteks bisnis, (c) dampak data pada modul/tabel lain.",
        "",
        "FORMAT OUTPUT (WAJIB, dua bagian terpisah):",
        "",
        "=== AUDIT ===",
        "Daftar temuan singkat per kategori. Bullet boleh. Max 25 baris.",
        "",
        "=== FIXES (JSON) ===",
        "Object JSON dengan key `<table>::<op>` HANYA untuk paragraf yang",
        "kamu rewrite. Value = paragraf pengganti lengkap (string, 3-5 kalimat).",
        "Jika tidak ada yang perlu diganti: tulis `{}`.",
        "JANGAN bungkus dalam markdown fence. JANGAN tambah komentar di luar dua",
        "bagian di atas.",
        "",
        "=== NARASI SAAT INI (28 entri) ===",
    ]
    for k, v in narratives.items():
        lines.append(f"--- {k} ---")
        lines.append(v)
        lines.append("")
    return "\n".join(lines)


def parse_response(text: str) -> tuple[str, dict]:
    """Return (audit_text, fixes_dict)."""
    audit_match = re.search(r'=== AUDIT ===\s*(.*?)\s*=== FIXES', text, re.S)
    audit = audit_match.group(1).strip() if audit_match else text

    # Find FIXES block, allow optional "(JSON)" tag
    fixes_match = re.search(r'=== FIXES.*?===\s*(.*)', text, re.S)
    fixes_raw = fixes_match.group(1).strip() if fixes_match else '{}'

    # Strip code fences if present
    fixes_raw = re.sub(r'^```(?:json)?\s*', '', fixes_raw)
    fixes_raw = re.sub(r'\s*```\s*$', '', fixes_raw)

    # Try to locate first '{' to last '}'
    first = fixes_raw.find('{')
    last  = fixes_raw.rfind('}')
    if first == -1 or last == -1 or last <= first:
        return audit, {}
    json_blob = fixes_raw[first:last+1]
    try:
        fixes = json.loads(json_blob)
    except json.JSONDecodeError as e:
        print(f"[parse] JSON decode failed: {e}", file=sys.stderr)
        print(f"[parse] Blob preview: {json_blob[:400]}", file=sys.stderr)
        fixes = {}
    return audit, fixes


def clean_narr(text: str) -> str:
    """Same cleaner used in 07_gemini_narratives, in case Gemini leaks artifacts."""
    if '[Thought: true]' in text:
        text = text.split('[Thought: true]')[-1]
    text = re.sub(r'^\s*\*\*[^*]+\*\*\s*(I\'m currently|I am currently)[^.]*\.\s*',
                  '', text, flags=re.S)
    text = re.sub(r'\bconstellations?\.?\s*$', '', text, flags=re.I).strip()
    text = re.sub(r'[._][a-z_]+_finalized\.?\s*$', '.', text, flags=re.I)
    text = re.sub(r'\bPengapusan\b', 'Penghapusan', text)
    return text.strip().strip('"').strip()


def main():
    narratives = json.load(open(NARR_FILE))
    print(f"[review] Loaded {len(narratives)} narratives")

    prompt = build_prompt(narratives)
    print(f"[review] Prompt length: {len(prompt)} chars")
    print(f"[review] Sending batch review to Gemini...")
    reply = ask_gemini(prompt)
    REPORT.write_text(reply)
    print(f"[review] Reply saved: {REPORT} ({len(reply)} chars)")

    audit, fixes = parse_response(reply)
    print()
    print("=" * 60)
    print("AUDIT:")
    print("=" * 60)
    print(audit)
    print()
    print(f"[review] {len(fixes)} replacement narratives proposed")

    if not fixes:
        print("[review] No replacements -- nothing to merge.")
        return

    # Backup original
    if not BACKUP.exists():
        BACKUP.write_text(json.dumps(narratives, ensure_ascii=False, indent=2))
        print(f"[review] Backup saved: {BACKUP}")

    # Apply fixes
    cleaned_fixes = {}
    for k, v in fixes.items():
        if k not in narratives:
            print(f"[review]   skip unknown key: {k}")
            continue
        new = clean_narr(v)
        if not new:
            continue
        cleaned_fixes[k] = new
        narratives[k] = new

    FIXES.write_text(json.dumps(cleaned_fixes, ensure_ascii=False, indent=2))
    NARR_FILE.write_text(json.dumps(narratives, ensure_ascii=False, indent=2))
    print(f"[review] Merged {len(cleaned_fixes)} fixes into {NARR_FILE}")
    print(f"[review] Fixes summary: {FIXES}")


if __name__ == '__main__':
    main()
