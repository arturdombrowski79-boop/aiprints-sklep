# Galeria gotowych modeli do kalkulatora druku 3D.
# Pliki modeli: public/pliki/3d/<slug>.3mf (lub .stl) – nazwy jak w src/data/druk3d-galeria.json.
# Skrypt wyciąga miniaturę z pliku 3MF (Bambu Studio) do public/img/3d/<slug>.jpg.  Uruchom: python3 tools/gallery3d.py
import json, zipfile, io, os, sys
from PIL import Image
G = json.load(open('src/data/druk3d-galeria.json')); os.makedirs('public/img/3d', exist_ok=True)
for g in G:
    f = next((p for p in (f"public/pliki/3d/{g['slug']}.3mf", f"public/pliki/3d/{g['slug']}.stl") if os.path.exists(p)), None)
    if not f: print('brak pliku:', g['slug']); continue
    out = f"public/img/3d/{g['slug']}.jpg"
    if os.path.exists(out): print('ok', g['slug']); continue
    if f.endswith('.3mf'):
        z = zipfile.ZipFile(f); names = z.namelist()
        cand = [n for n in names if n.lower().endswith('.png') and ('plate_1.png' in n.lower() or 'thumbnail_middle' in n.lower() or 'thumbnail' in n.lower())]
        cand.sort(key=lambda n: (0 if n.lower().endswith('metadata/plate_1.png') else 1 if 'thumbnail_middle' in n.lower() else 2))
        if cand:
            im = Image.open(io.BytesIO(z.read(cand[0]))).convert('RGBA'); bg = Image.new('RGBA', im.size, (241, 237, 230, 255)); bg.alpha_composite(im)
            bg = bg.convert('RGB'); bg.thumbnail((600, 600)); c = Image.new('RGB', (600, 600), (241, 237, 230)); c.paste(bg, ((600 - bg.width) // 2, (600 - bg.height) // 2)); c.save(out, quality=86)
            print('miniatura', g['slug'], '←', cand[0]); continue
    print('bez miniatury (dodaj ręcznie img/3d/%s.jpg):' % g['slug'])
