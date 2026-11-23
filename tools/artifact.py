# Podgląd na claude.ai (limit 512 plików na wersję): zdjęcia z dist/img pakujemy w paczki JSON (~1,2 MB),
# a mały skrypt w każdej stronie podmienia adresy img/… na dane z paczek – leniwie, gdy obrazek wchodzi w ekran.
# Wersja na LH.pl (prod/) zostaje bez zmian. Wynik: art/
import os, re, json, base64, shutil, glob
B = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); D = B + '/dist'; A = B + '/art'
shutil.rmtree(A, ignore_errors=True); shutil.copytree(D, A, ignore=shutil.ignore_patterns('.htaccess', 'robots.txt'))
for junk in ('img/bombka', 'img/f/bombka-zlota.jpg', 'img/site/pracownia-szyld.jpg'):
    p = f'{A}/{junk}'; shutil.rmtree(p, ignore_errors=True) if os.path.isdir(p) else (os.path.exists(p) and os.remove(p))
for f in glob.glob(f'{A}/img/ph/*.svg'):
    if 'prezenty-z-grawerem' not in f: os.remove(f)
KEEP = {'img/logo.svg', 'img/logo-mark.svg', 'img/site/apple-touch-icon.png', 'img/site/favicon-48.png', 'img/site/icon-512.png', 'img/site/og-aiprints.jpg'}
MIME = {'.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml'}
imgs = sorted(os.path.relpath(p, A) for p in glob.glob(f'{A}/img/**/*.*', recursive=True) if os.path.splitext(p)[1] in MIME)
imgs = [p for p in imgs if p not in KEEP]
# kolejność jak w katalogu, żeby strona kategorii potrzebowała niewielu paczek
cat = json.load(open(B + '/src/data/catalog.json'))
order = []
for c in cat['cats']:
    for p in cat['products']:
        if p['cat'] == c['slug']:
            for g in [p.get('img')] + (p.get('gallery') or []):
                if g and g in imgs and g not in order: order.append(g)
order += [p for p in imgs if p not in order]
packs, cur, size, index = [], {}, 0, {}
for p in order:
    data = 'data:' + MIME[os.path.splitext(p)[1]] + ';base64,' + base64.b64encode(open(f'{A}/{p}', 'rb').read()).decode()
    if size and size + len(data) > 1_300_000: packs.append(cur); cur, size = {}, 0
    cur[p] = data; size += len(data); index[p] = len(packs)
if cur: packs.append(cur)
for i, pk in enumerate(packs): json.dump(pk, open(f'{A}/img/pack-{i}.json', 'w'))
for p in order: os.remove(f'{A}/{p}')
for d in sorted(glob.glob(f'{A}/img/*/'), reverse=True):
    if not os.listdir(d): os.rmdir(d)
LOADER = '''<script>(()=>{const I=%s,C={},P={};const get=(n)=>C[n]||(C[n]=fetch('img/pack-'+n+'.json').then(r=>r.json()).then(j=>Object.assign(P,j)));
const key=(u)=>{if(!u)return null;u=String(u).replace(/^\\.\\//,'').replace(/^\\//,'');return I[u]!==undefined?u:null};
window.__pk=(u)=>{const k=key(u);return k?get(I[k]).then(()=>P[k]):Promise.resolve(u)};
const d=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');
Object.defineProperty(HTMLImageElement.prototype,'src',{get(){return d.get.call(this)},set(v){const k=key(v);if(!k)return d.set.call(this,v);if(P[k])return d.set.call(this,P[k]);get(I[k]).then(()=>d.set.call(this,P[k]))}});
const fix=(el)=>{if(el.tagName==='IMG'){const k=key(el.getAttribute('data-ps')||el.getAttribute('src'));if(k){el.removeAttribute('data-ps');el.src=k}}
const st=el.getAttribute&&el.getAttribute('style');if(st&&/url\\((\\.\\/)?img\\//.test(st)){const m=[...st.matchAll(/url\\(([^)]+)\\)/g)].map(x=>x[1].replace(/['"]/g,'')).filter(key);
Promise.all(m.map(window.__pk)).then(us=>{let s=el.getAttribute('style');m.forEach((u,i)=>s=s.split(u).join(us[i]));el.setAttribute('style',s)})}};
const io=new IntersectionObserver((es)=>es.forEach(e=>{if(e.isIntersecting){io.unobserve(e.target);fix(e.target)}}),{rootMargin:'800px'});
const scan=(r)=>{r.querySelectorAll&&r.querySelectorAll('img[data-ps],img[src^="img/"],img[src^="./img/"],[style*="img/"]').forEach(el=>io.observe(el));if(r.matches&&r.matches('img[data-ps],img[src^="img/"],[style*="img/"]'))io.observe(r)};
new MutationObserver(ms=>ms.forEach(m=>{m.addedNodes.forEach(n=>n.nodeType===1&&scan(n));if(m.type==='attributes')scan(m.target)})).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['src','style']});
document.addEventListener('DOMContentLoaded',()=>scan(document))})()</script>''' % json.dumps(index, separators=(',', ':'))
# indeks jest duży – trzymamy go w osobnym pliku JS ładowanym synchronicznie
open(f'{A}/img/pack-index.js', 'w').write('window.__PI=' + json.dumps(index, separators=(',', ':')) + ';')
LOADER = '<script src="img/pack-index.js"></script>' + LOADER.replace(json.dumps(index, separators=(',', ':')), 'window.__PI', 1)
n = 0
for f in glob.glob(f'{A}/*.html'):
    s = open(f, encoding='utf-8').read()
    s = re.sub(r'<img([^>]*?)\ssrc="((?:\./)?img/[^"]+)"', lambda m: f'<img{m.group(1)} data-ps="{m.group(2)}" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="' if m.group(2).lstrip('./') in index else m.group(0), s)
    s = s.replace('<head>', '<head>' + LOADER, 1); open(f, 'w', encoding='utf-8').write(s); n += 1
files = sum(len(fs) for _, _, fs in os.walk(A))
print(f'art: {n} stron, {len(packs)} paczek zdjęć, plików razem {files}')
