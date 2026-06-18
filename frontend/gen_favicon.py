# /// script
# requires-python = ">=3.11"
# dependencies = ["pillow"]
# ///
"""Generate src/app/favicon.ico (multi-size) dari public/logo.png. Throwaway."""
from PIL import Image, ImageChops
from pathlib import Path

im = Image.open("public/logo.png").convert("RGBA")
# Flatten di atas putih -> logo (teks gelap) selalu kelihatan di tab browser gelap.
white = Image.new("RGBA", im.size, (255, 255, 255, 255))
flat = Image.alpha_composite(white, im).convert("RGB")

# Buang tagline merah "SMART HOME INOVASI" supaya favicon = mark SHI + ikon saja
# (lebih jelas di 16-32px). Deteksi baris pertama yg punya piksel merah.
px = flat.load()
W, H = flat.size
red_top = None
for y in range(H):
    reds = sum(1 for x in range(0, W, 4)
               if px[x, y][0] > 150 and px[x, y][1] < 110 and px[x, y][2] < 110)
    if reds > 4:  # baris ini bagian tagline merah
        red_top = y
        break
if red_top and red_top > H * 0.4:  # aman: tagline memang di bawah
    flat = flat.crop((0, 0, W, red_top - int(H * 0.01)))

# Trim margin near-white supaya mark sebesar mungkin di favicon.
diff = ImageChops.difference(flat, Image.new("RGB", flat.size, (255, 255, 255)))
bbox = diff.getbbox()
if bbox:
    flat = flat.crop(bbox)

# Pad ke bujur sangkar + sedikit ruang nafas.
w, h = flat.size
pad = int(max(w, h) * 0.06)
side = max(w, h) + 2 * pad
canvas = Image.new("RGB", (side, side), (255, 255, 255))
canvas.paste(flat, ((side - w) // 2, (side - h) // 2))

sizes = [16, 32, 48, 64, 128, 256]
out = Path("src/app/favicon.ico")
canvas.save(out, format="ICO", sizes=[(s, s) for s in sizes])
print(f"wrote {out} (square {side}px -> {sizes})")

T = "C:/Users/GNERyze/AppData/Local/Temp"
canvas.resize((64, 64)).save(f"{T}/favicon_preview64.png")
# tampilan ukuran tab (32px) di-zoom biar kelihatan jelas
canvas.resize((32, 32)).resize((160, 160), Image.NEAREST).save(f"{T}/favicon_preview32.png")
print("previews saved")
