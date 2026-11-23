# Generuje lekkie wersje WebP (480 i 960 px) obok zdjęć JPG w public/img – build.sh dopisuje je jako srcset.
# Uruchom po dodaniu nowych zdjęć:  python3 tools/webp.py
import os, glob
from PIL import Image, ImageOps
B = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
n = 0
for f in glob.glob(B + '/public/img/**/*.jpg', recursive=True):
    if '/_' in f: continue
    im = None
    for w in (480, 960):
        o = f[:-4] + f'-{w}w.webp'
        if os.path.exists(o) and os.path.getmtime(o) >= os.path.getmtime(f): continue
        if im is None: im = ImageOps.exif_transpose(Image.open(f)).convert('RGB')
        if im.width <= w and w == 960:  # małe zdjęcie – jedna wersja wystarczy
            if os.path.exists(o): os.remove(o)
            continue
        c = im.copy(); c.thumbnail((w, w * 4), Image.LANCZOS); c.save(o, 'WEBP', quality=78, method=5); n += 1
print('webp:', n)
