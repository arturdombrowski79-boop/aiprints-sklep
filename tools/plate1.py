# Galeria 3D: z projektów Bambu Studio z kilkoma płytami zostawia w <build> tylko obiekty z płyty 1
# (inaczej kalkulator liczy wszystkie warianty naraz). Uruchom: python3 tools/plate1.py public/pliki/3d/<plik>.3mf
import sys, zipfile, re, shutil, os
for path in sys.argv[1:]:
    z = zipfile.ZipFile(path); cfg = z.read('Metadata/model_settings.config').decode() if 'Metadata/model_settings.config' in z.namelist() else ''
    plates = re.findall(r'<plate>.*?</plate>', cfg, re.S)
    if len(plates) < 2: print('1 płyta:', path); continue
    keep = set(re.findall(r'key="object_id" value="(\d+)"', plates[0]))
    m = z.read('3D/3dmodel.model').decode()
    n0 = len(re.findall(r'<item ', m))
    m2 = re.sub(r'\s*<item objectid="(\d+)"[^>]*/>', lambda x: x.group(0) if x.group(1) in keep else '', m)
    tmp = path + '.tmp'
    with zipfile.ZipFile(tmp, 'w', zipfile.ZIP_DEFLATED) as o:
        for it in z.infolist():
            if it.filename.startswith('Auxiliaries/'): continue  # zdjęcia autora – niepotrzebne, mniejszy plik
            o.writestr(it, m2 if it.filename == '3D/3dmodel.model' else z.read(it.filename))
    z.close(); os.replace(tmp, path)
    print(f'{path}: płyt {len(plates)}, obiekty {n0} → {len(re.findall(r"<item ", m2))}')
