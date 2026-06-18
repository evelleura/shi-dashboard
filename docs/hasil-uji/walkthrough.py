# /// script
# requires-python = ">=3.10"
# dependencies = ["playwright"]
# ///
"""
Walkthrough OTOMATIS guide sidang (panduan-demo-sidang.html) lewat browser asli.

Menjalankan langkah-langkah guide dari DB EMPTY: login manajer -> buat klien
(dengan Link Google Maps) -> buat proyek -> buat tugas -> tandai Selesai ->
uji perubahan SPI/RAG + auto-refresh dashboard. Tiap langkah di-screenshot ke
folder skrip ini (docs/hasil-uji/).

LOG (untuk diserahkan ke sesi berikutnya) ditulis ke <root>/iso-logs/:
  - actions-timeline.log : TIMELINE aksi, tiap langkah diberi GARIS PEMISAH jelas,
                           diikuti API call + console yang terjadi di langkah itu.
  - api-calls.log        : setiap panggilan /api/ (method, URL, status), ber-timestamp.
  - browser-console.log  : semua console frontend + page error, ber-timestamp.
  - _console-errors.json : error/warning ringkas (mesin-baca).
Korelasikan timestamp dengan iso-logs/next-dev.log (server+API) & postgres.log (SQL).

Pakai (stack run.py --new --iso di :3100):
    WALK_BASE=http://localhost:3100 python walkthrough.py
"""
import os
import json
import datetime
import pathlib
from playwright.sync_api import sync_playwright, Error as PWError

BASE = os.environ.get("WALK_BASE", "http://localhost:3100").rstrip("/")
OUT = pathlib.Path(__file__).resolve().parent          # docs/hasil-uji (screenshot)
ROOT = pathlib.Path(__file__).resolve().parents[2]      # shi-crm
LOG = ROOT / "iso-logs"
LOG.mkdir(exist_ok=True)
TODAY = datetime.date.today()
GMAPS = "https://www.google.com/maps/place/@-7.7260288,110.4006013,17z"


def now() -> str:
    return datetime.datetime.now().strftime("%H:%M:%S")


def stamp() -> str:
    return datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def dplus(n: int) -> str:
    return (TODAY + datetime.timedelta(days=n)).isoformat()


# --- log writers (tetap terbuka sepanjang sesi) ---
timeline = open(LOG / "actions-timeline.log", "a", encoding="utf-8", buffering=1)
apilog = open(LOG / "api-calls.log", "a", encoding="utf-8", buffering=1)
conlog = open(LOG / "browser-console.log", "a", encoding="utf-8", buffering=1)

_run_hdr = f"\n{'#'*78}\n# RUN walkthrough {stamp()}  base={BASE}\n{'#'*78}\n"
for fh in (timeline, apilog, conlog):
    fh.write(_run_hdr)

errors = []
n = [0]
stepno = [0]


def tl(line: str):
    timeline.write(line + "\n")


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(viewport={"width": 1366, "height": 900})
        page = ctx.new_page()
        page.set_default_timeout(35000)

        def close_modal():
            """Tutup modal yang mungkin masih terbuka (Escape) supaya tidak menghalangi klik berikutnya."""
            try:
                if page.locator('div[role="dialog"]').count() > 0:
                    page.keyboard.press("Escape")
                    page.wait_for_timeout(300)
            except Exception:
                pass

        # ---- handler: console frontend (semua level) ----
        def on_console(m):
            line = f"{now()}  [console:{m.type}] {m.text}"
            conlog.write(line + "\n")
            tl("  " + line)
            if m.type in ("error", "warning"):
                errors.append({"kind": "console:" + m.type, "url": page.url, "text": m.text})
        page.on("console", on_console)

        def on_pageerror(e):
            line = f"{now()}  [pageerror] {e}"
            conlog.write(line + "\n")
            tl("  " + line)
            errors.append({"kind": "pageerror", "url": page.url, "text": str(e)})
        page.on("pageerror", on_pageerror)

        # ---- handler: API calls (response) ----
        def on_response(resp):
            url = resp.url
            if "/api/" not in url:
                return
            method = resp.request.method
            line = f"{now()}  [api] {resp.status} {method:6s} {url}"
            apilog.write(line + "\n")
            tl("  " + line)
        page.on("response", on_response)

        def on_reqfail(r):
            if "hot-update" in r.url:
                return
            tag = "[api-FAIL]" if "/api/" in r.url else "[req-FAIL]"
            line = f"{now()}  {tag} {r.method} {r.url} :: {r.failure}"
            apilog.write(line + "\n")
            tl("  " + line)
            errors.append({"kind": "reqfail", "url": r.url, "text": str(r.failure)})
        page.on("requestfailed", on_reqfail)

        def shot(name):
            n[0] += 1
            fn = f"{n[0]:02d}-{name}.png"
            page.wait_for_timeout(700)
            page.screenshot(path=str(OUT / fn))
            tl(f"  {now()}  [shot] {fn}")
            print("  shot", fn)

        def step(desc, fn):
            stepno[0] += 1
            header = (f"\n{'='*78}\nSTEP {stepno[0]:02d} | {stamp()} | {desc}\n{'-'*78}")
            tl(header)
            print(f"\n== STEP {stepno[0]:02d}: {desc}")
            try:
                fn()
            except Exception as e:
                tl(f"  {now()}  [STEP-FAIL] {e!r}")
                print("  [STEP FAIL]", repr(e))
                errors.append({"kind": "step-fail", "url": page.url, "text": f"{desc} :: {e}"})
                try:
                    shot("FAIL-step" + str(stepno[0]))
                except Exception:
                    pass

        # ================= LANGKAH =================
        def login():
            page.goto(f"{BASE}/login", wait_until="networkidle")
            shot("login")
            page.fill("input[name=email]", "admin@shi.co.id")
            page.fill("input[name=password]", "password123")
            page.click("button[type=submit]")
            page.wait_for_url("**/dashboard", timeout=30000)
            page.wait_for_load_state("networkidle")
            shot("dashboard-empty")
        step("Login manajer -> dashboard kosong", login)

        def buat_klien():
            page.goto(f"{BASE}/clients", wait_until="networkidle")
            shot("klien-list-kosong")
            page.click("text=Tambah Klien")
            page.wait_for_timeout(500)
            page.get_by_placeholder("Nama klien").fill("CV Sinar Abadi Teknik")
            page.get_by_placeholder("klien@example.com").fill("kontak@sinarabaditeknik.co.id")
            page.get_by_placeholder("+62812xxxx").fill("081328845120")
            page.get_by_placeholder("Alamat klien...").fill(
                "Jl. Kaliurang Km 9, Sardonoharjo, Ngaglik, Sleman, Yogyakarta 55581")
            page.get_by_placeholder("https://maps.google.com/...").fill(GMAPS)
            page.wait_for_timeout(1800)
            shot("klien-form-terisi-maps")
            page.click("button:has-text('Simpan')")
            page.wait_for_timeout(1500)
            shot("klien-tersimpan")
        step("Buat klien + Link Google Maps", buat_klien)

        def buat_proyek():
            page.goto(f"{BASE}/projects", wait_until="networkidle")
            shot("proyek-list-kosong")
            page.click("text=Proyek Baru")
            page.wait_for_timeout(500)
            page.fill("#proj-name", "Pemasangan CCTV & Smart Lock - Toko Sinar Abadi")
            try:
                page.select_option("#proj-client", label="CV Sinar Abadi Teknik")
            except PWError:
                pass
            page.select_option("#proj-category", "security")
            page.fill("#proj-start", dplus(0))
            page.fill("#proj-end", dplus(30))
            page.fill("#proj-value", "42000000")
            page.fill("#proj-target", "Sistem keamanan terpasang & terhubung aplikasi mobile.")
            shot("proyek-form-terisi")
            page.click("button:has-text('Create Project')")
            page.wait_for_timeout(1500)
            shot("proyek-tersimpan")
        step("Buat proyek", buat_proyek)

        def buat_tugas():
            page.click("text=Pemasangan CCTV")
            page.wait_for_timeout(1500)
            shot("proyek-detail-survey")
            for i, (nama, due) in enumerate([("Survey lokasi 2 toko", 3),
                                             ("Pemasangan kamera & kabel", 12)]):
                try:
                    page.click("text=Tugas Baru")
                    page.wait_for_timeout(500)
                    page.fill("#task-name", nama)
                    # Selector di-scope ke dalam dialog supaya tidak ambigu dengan kartu Kanban.
                    dlg = page.locator('div[role="dialog"]')
                    try:
                        dlg.locator("button:has-text('Belum ditugaskan')").click()
                        page.wait_for_timeout(300)
                        dlg.get_by_text("Rizky Ramadhan", exact=True).first.click()
                    except PWError:
                        pass
                    try:
                        page.fill("#task-tl-start", dplus(0))
                        page.fill("#task-due", dplus(due))
                    except PWError:
                        pass
                    if i == 0:
                        shot("tugas-form-terisi")
                    dlg.locator("button:has-text('Buat Tugas')").click()
                    page.wait_for_timeout(1500)
                except Exception as e:
                    tl(f"  {now()}  [tugas-{i} gagal] {e!r}")
                    close_modal()
            shot("tugas-kanban")
        step("Buka proyek + buat 2 tugas (penjadwalan)", buat_tugas)

        def spi_sebelum():
            shot("metrik-spi-sebelum")
        step("Catat metrik SPI sebelum tandai selesai", spi_sebelum)

        def tandai_selesai():
            sel = page.locator('div[aria-label="Task: Survey lokasi 2 toko"] select')
            if sel.count() == 0:
                sel = page.locator('select[aria-label="Change task status"]').first
            sel.select_option("done")
            page.wait_for_timeout(2000)
            shot("tugas-selesai-spi-update")
        step("Manajer tandai 1 tugas Selesai -> SPI recalc", tandai_selesai)

        def auto_refresh_inapp():
            close_modal()
            page.locator('a:has-text("Dashboard"), button:has-text("Dashboard")').first.click()
            page.wait_for_timeout(2500)
            shot("dashboard-setelah-selesai-TANPA-reload")
        step("Buka Dashboard via menu (SPA, tanpa reload) - cek auto-refresh", auto_refresh_inapp)

        def reload_f5():
            page.reload(wait_until="networkidle")
            page.wait_for_timeout(2000)
            shot("dashboard-setelah-reload-F5")
        step("Reload F5 dashboard - bandingkan dengan langkah sebelumnya", reload_f5)

        def teknisi():
            page.evaluate("() => { try{localStorage.clear()}catch(e){} }")
            page.goto(f"{BASE}/login", wait_until="networkidle")
            page.fill("input[name=email]", "rizky@shi.co.id")
            page.fill("input[name=password]", "password123")
            page.click("button[type=submit]")
            page.wait_for_timeout(3000)
            shot("teknisi-dashboard")
        step("Login teknisi (rizky) -> dashboard teknisi", teknisi)

        # ----- tutup -----
        tl(f"\n{'='*78}\nRUN SELESAI {stamp()} | screenshots={n[0]} | errors={len(errors)}\n{'='*78}\n")
        (OUT / "_console-errors.json").write_text(
            json.dumps(errors, indent=2, ensure_ascii=False), encoding="utf-8")
        (OUT / "_hasil.json").write_text(
            json.dumps({"base": BASE, "screenshots": n[0], "error_count": len(errors),
                        "logs_dir": str(LOG)}, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"\nSELESAI. screenshots={n[0]}, errors={len(errors)}")
        print(f"LOG -> {LOG}")
        for fh in (timeline, apilog, conlog):
            fh.close()
        ctx.close()
        browser.close()


if __name__ == "__main__":
    main()
