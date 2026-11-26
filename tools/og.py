# Obrazek podglądu linku (og:image 1200×630): lewy panel z logo z og-aiprints-old + prawdziwe zdjęcia z pracowni.
# python3 tools/og.py <wyjście.jpg> <zdjęcie1> … (6 zdjęć, siatka 3×2)
import sys
from PIL import Image, ImageOps
out, photos = sys.argv[1], sys.argv[2:]
base = Image.open('/home/claude/og/og-aiprints-old.jpg').convert('RGB')
im = Image.new('RGB', (1200, 630), (20, 20, 22)); im.paste(base.crop((0, 0, 520, 630)), (0, 0))
cols, rows, x0, gap = 3, 2, 520, 3
w = (1200 - x0 - gap * (cols - 1)) // cols; h = (630 - gap * (rows - 1)) // rows
for i, p in enumerate(photos[:6]):
    t = ImageOps.fit(Image.open(p).convert('RGB'), (w, h), Image.LANCZOS, centering=(0.5, 0.45))
    im.paste(t, (x0 + (i % cols) * (w + gap), (i // cols) * (h + gap)))
im.save(out, quality=88, optimize=True)
