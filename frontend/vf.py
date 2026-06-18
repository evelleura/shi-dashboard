# /// script
# requires-python = ">=3.11"
# dependencies = ["playwright"]
# ///
from playwright.sync_api import sync_playwright
import time
with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    ctx = b.new_context()
    # warm up + wait for dev recompile
    for i in range(6):
        try:
            r = ctx.request.get("http://localhost:3000/", timeout=20000)
            if r.status == 200: break
        except Exception as e:
            print("retry", i, str(e)[:60])
        time.sleep(4)
    print("ASSET status:")
    for a in ["/favicon.ico","/favicon.svg","/favicon-96x96.png","/apple-touch-icon.png",
              "/site.webmanifest","/web-app-manifest-192x192.png","/web-app-manifest-512x512.png"]:
        try:
            r = ctx.request.get("http://localhost:3000"+a, timeout=15000)
            print(f"  {a} -> {r.status} {r.headers.get('content-type','')}")
        except Exception as e:
            print(f"  {a} -> ERR {str(e)[:50]}")
    pg = ctx.new_page()
    try:
        pg.goto("http://localhost:3000/", wait_until="domcontentloaded", timeout=40000)
        links = pg.eval_on_selector_all("link[rel*='icon'],link[rel='manifest'],link[rel='apple-touch-icon']",
            "els => els.map(e => e.rel + ' -> ' + new URL(e.href).pathname)")
        print("HEAD links:"); [print("  ", l) for l in links]
    except Exception as e:
        print("page goto err:", str(e)[:80])
    b.close()
