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
    if n not in ('404','admin','konto','dziekujemy','pliki'): urls.append('' if n=='index' else n)
urls.sort(key=lambda u:(u!='',u))
open('prod/sitemap.xml','w').write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+''.join(f'  <url><loc>https://aiprints.pl/{u}</loc></url>\n' for u in urls)+'</urlset>\n')
print('prod',len(urls),'adresów w sitemap')
PY
cp tools/WDROZENIE.txt prod/
# backend: płatności Stripe, maile, odstąpienia (PHP na LH.pl). config.php z kluczami tworzysz tylko na serwerze.
mkdir -p prod/api/data && cp api/*.php api/.htaccess prod/api/ && cp api/data/.htaccess prod/api/data/ && rm -f prod/api/config.php
node tools/api_catalog.mjs prod/api/catalog.json >/dev/null && node tools/emails.mjs prod/api/emails >/dev/null && node tools/feeds.mjs prod/feed
if [ "${BASE:-/}" != "/" ]; then sed -i "s#ErrorDocument 404 /404.html#ErrorDocument 404 ${BASE}404.html#" prod/.htaccess; fi
if [ -d /home/claude ] && command -v zip >/dev/null; then rm -f /home/claude/AiPrints-sklep-do-wgrania.zip && (cd prod && zip -qr /home/claude/AiPrints-sklep-do-wgrania.zip .); fi
