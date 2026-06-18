# /// script
# requires-python = ">=3.11"
# dependencies = ["playwright"]
# ///
"""Verify SHI logo loads + sized across landing, login hero, and navbar. Throwaway."""
from playwright.sync_api import sync_playwright

T = "C:/Users/GNERyze/AppData/Local/Temp"

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    pg = b.new_page(viewport={"width": 1366, "height": 900})

    # 1. Landing (root)
    pg.goto("http://localhost:3000/", wait_until="networkidle")
    pg.wait_for_timeout(800)
    pg.screenshot(path=f"{T}/logo_landing.png")
    print("landing saved")

    # 2. Login hero
    pg.goto("http://localhost:3000/login", wait_until="networkidle")
    pg.wait_for_timeout(800)
    pg.screenshot(path=f"{T}/logo_login.png")
    # check img actually loaded (naturalWidth > 0)
    nat = pg.eval_on_selector_all("img[src='/logo.png']",
        "els => els.map(e => ({w: e.naturalWidth, h: e.clientHeight}))")
    print("login logo imgs:", nat)

    # 3. Login -> navbar
    pg.fill('input[name="email"]', "admin@shi.co.id")
    pg.fill('input[name="password"]', "password123")
    pg.click('button[type="submit"]')
    pg.wait_for_load_state("networkidle")
    pg.wait_for_timeout(1500)
    pg.screenshot(path=f"{T}/logo_navbar.png")
    nat2 = pg.eval_on_selector_all("img[src='/logo.png']",
        "els => els.map(e => ({w: e.naturalWidth, h: e.clientHeight}))")
    print("navbar logo imgs:", nat2)
    # crop the brand corner (top-left navbar)
    try:
        pg.locator("text=SHI Dashboard").first.locator("xpath=ancestor::div[2]").screenshot(path=f"{T}/logo_brand.png")
        print("brand crop saved")
    except Exception as e:
        print("brand crop issue:", e)

    b.close()
