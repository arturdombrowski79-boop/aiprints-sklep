#!/bin/bash
set -e
cd "$(dirname "$0")/.."
python3 tools/catalog.py >/dev/null
npx astro build > build.log 2>&1 || { tail -30 build.log; exit 1; }
sed -i 's#="/assets/#="./assets/#g; s#url(/assets/#url(./assets/#g' dist/*.html
echo "built $(ls dist/*.html | wc -l) pages"
# wersja produkcyjna: czyste adresy + sitemap
rm -rf prod && cp -r dist prod
python3 - <<'PY'
import glob,re,os,datetime
BASE=os.environ.get('BASE','/')  # dla testów: BASE=/test/ bash tools/build.sh
d=datetime.date.today().isoformat(); urls=[]
for f in glob.glob('prod/*.html'):
    s=open(f,encoding='utf-8').read()
    s=re.sub(r'href="index\.html(#[^"]*)?"',lambda m:'href="'+BASE+(m.group(1) or '')+'"',s)
    s=re.sub(r'href="([a-z0-9-]+)\.html([?#][^"]*)?"',lambda m:f'href="{BASE}{m.group(1)}{m.group(2) or ""}"',s)
    s=re.sub(r'(https://aiprints\.pl/[a-z0-9-]+)\.html',r'\1',s)  # adresy końcowe (bez .html) w danych strukturalnych
    s=re.sub(r'(src|href)="(\./)?(assets|img|docs)/',r'\1="'+BASE+r'\3/',s); s=s.replace('url(./assets/','url('+BASE+'assets/')
    s=s.replace('href="favicon.ico"','href="'+BASE+'favicon.ico"')
    open(f,'w',encoding='utf-8').write(s)
    n=os.path.basename(f)[:-5]
    if n not in ('404','admin','konto','dziekujemy','pliki','bio') and not n.startswith('google'): urls.append('' if n=='index' else n)
urls.sort(key=lambda u:(u!='',u))
open('prod/sitemap.xml','w').write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+''.join(f'  <url><loc>https://aiprints.pl/{u}</loc></url>\n' for u in urls)+'</urlset>\n')
print('prod',len(urls),'adresów w sitemap')
PY
# lekkie zdjęcia: srcset z wersjami WebP (tools/webp.py) – mniejsze pliki na telefonach
python3 - <<'PY'
import glob,re,os
def fix(m):
    tag=m.group(0)
    if 'srcset=' in tag: return tag
    src=re.search(r'src="([^"]+\.jpg)"',tag)
    if not src: return tag
    u=src.group(1); p='prod/'+re.sub(r'^(/[^/]*?/)?(?=img/)','',u.lstrip('/')) if 'img/' in u else None
    if not p: return tag
    p='prod/'+u[u.index('img/'):]
    base=p[:-4]; w4=os.path.exists(base+'-480w.webp'); w9=os.path.exists(base+'-960w.webp')
    if not w4: return tag
    ub=u[:-4]; ss=f'{ub}-480w.webp 480w'+(f', {ub}-960w.webp 960w' if w9 else '')+f', {u} 1200w'
    sz='(max-width: 640px) 50vw, 420px' if 'loading="lazy"' in tag else '(max-width: 640px) 100vw, 640px'
    return tag[:-1].rstrip('/').rstrip()+f' srcset="{ss}" sizes="{sz}" decoding="async">'
n=0
for f in glob.glob('prod/*.html'):
    s=open(f,encoding='utf-8').read(); t=re.sub(r'<img\b[^>]*>',fix,s)
    if t!=s: open(f,'w',encoding='utf-8').write(t); n+=1
print('srcset w',n,'plikach')
# wczesne wczytanie głównej czcionki (tekst w pierwszym widoku pojawia się szybciej)
fs=sorted(os.path.basename(x) for x in glob.glob('prod/assets/inter-tight-latin*-wght-normal*.woff2'))
B=os.environ.get('BASE','/')
pre=''.join(f'<link rel="preload" href="{B}assets/{x}" as="font" type="font/woff2" crossorigin>' for x in fs)
if pre:
    for f in glob.glob('prod/*.html'):
        s=open(f,encoding='utf-8').read()
        if 'rel="preload" href="'+B+'assets/inter-tight' not in s: open(f,'w',encoding='utf-8').write(s.replace('<head>','<head>'+pre,1))
PY
cp tools/WDROZENIE.txt prod/
# backend: płatności Stripe, maile, odstąpienia (PHP na LH.pl). config.php z kluczami tworzysz tylko na serwerze.
mkdir -p prod/api/data && cp api/*.php api/.htaccess prod/api/ && cp api/data/.htaccess prod/api/data/ && cp src/data/druk3d.json prod/api/ && rm -f prod/api/config.php
node tools/api_catalog.mjs prod/api/catalog.json >/dev/null && node tools/emails.mjs prod/api/emails >/dev/null && node tools/feeds.mjs prod/feed
if [ "${BASE:-/}" != "/" ]; then sed -i "s#ErrorDocument 404 /404.html#ErrorDocument 404 ${BASE}404.html#" prod/.htaccess; fi
if [ -d /home/claude ] && command -v zip >/dev/null; then rm -f /home/claude/AiPrints-sklep-do-wgrania.zip && (cd prod && zip -qr /home/claude/AiPrints-sklep-do-wgrania.zip .); fi
