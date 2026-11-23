import csv, json, re, os
B=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rows=list(csv.DictReader(open(B+'/data/baza-produktow.csv',encoding='utf-8-sig'),delimiter=';'))
CATS=[
 ('na-swieta','Na święta','Bombki z imieniem, kryształy z zimowym motywem i kalendarze 2027. Ozdoby z imieniem i zdjęciem na kolejny sezon.','#7a2e2a'),
 ('prezenty-ze-zdjeciem','Prezenty ze zdjęciem','Wasze zdjęcie w szkle, na akrylu, płótnie i drewnie. Przed produkcją wysyłamy podgląd do akceptacji.','#2f4a6b'),
 ('prezenty-z-grawerem','Prezenty z grawerem','Imię, data albo dedykacja wypalona laserem w drewnie, szkle i stali. Na lata, nie do szuflady.','#6b4a2a'),
 ('slub-i-okazje','Ślub i okazje','Tablice powitalne, plany stołów, winietki, pamiątki komunijne i podziękowania dla rodziców.','#8a6a5a'),
 ('dla-firm','Dla firm','Upominki z logo, szyldy, oznakowanie, witryny i druk. Faktura VAT, wycena w 24 h.','#2a2a2a'),
 ('wspolnoty-i-spoldzielnie','Wspólnoty i spółdzielnie','Tablice przy wejściu, regulaminy, numeracja lokali i tabliczki na skrzynki – w jednym stylu dla wszystkich budynków zarządcy.','#3d5a4f'),
 ('salony-beauty','Salony beauty','Szyldy z lustra, bony podarunkowe, stojaki QR i komplet oznakowania gabinetu.','#a06a7a'),
 ('druk-wielkoformatowy','Druk wielkoformatowy i folie','Banery, siatki, folie, naklejki po obrysie, oklejanie witryn i aut oraz litery z plotera. Drukujemy na HP Latex 375, tniemy na Summa S3.','#1f3b57'),
 ('dla-fotografow','Fine art i fotografia','Wydruki muzealne na papierach bawełnianych (Epson P9500), odbitki DryLab, powiększenia, oprawa i retusz starych zdjęć.','#3b3a36'),
 ('sublimacja','Sublimacja','Koszulki sportowe, koce, ręczniki, kubki i gadżety z pełnym nadrukiem – trwałym, bo farba wnika w materiał (Epson F500).','#4a3f6b'),
 ('szkoly-i-przedszkola','Szkoły i przedszkola','Od grafiki na drzwiach i banerów na ogrodzenie po plakaty grup, naklejki na okna i tabliczki sal. Projekt w cenie.','#2f6b4f'),
 ('cmentarz-i-pogrzeb','Pamięć i pogrzeb','Zdjęcia nagrobne na porcelanie, tabliczki, klepsydry, portrety i obrazki pamiątkowe. Pilne zamówienia wykonujemy w 24 h.','#3a3a3a'),
]
SUB2CAT={'Na święta':'na-swieta','Pamiątki ze zdjęciem':'prezenty-ze-zdjeciem','Dla fotografów':'dla-fotografow',
 'Zwierzaki':'prezenty-z-grawerem','Dla dzieci':'prezenty-z-grawerem','Dom i dekoracje':'prezenty-z-grawerem','Zegary ścienne':'prezenty-z-grawerem',
 'Ślub i wesele':'slub-i-okazje','Komunia i chrzest':'slub-i-okazje','Pamięć':'cmentarz-i-pogrzeb',
 'Witryny i folie':'druk-wielkoformatowy','Oznakowanie pomieszczeń':'dla-firm','QR, opinie i social media':'dla-firm','Projekty i grafika':'dla-firm','Wspólnoty, szkoły, sport':'dla-firm',
 'Wspólnoty i spółdzielnie':'wspolnoty-i-spoldzielnie','Druk dla salonów':'salony-beauty',
 'Druk wielkoformatowy':'druk-wielkoformatowy','Ploter tnący':'druk-wielkoformatowy','Fine art i fotografia':'dla-fotografow',
 'Sublimacja':'sublimacja','Szkoły i przedszkola':'szkoly-i-przedszkola','Cmentarz i pogrzeb':'cmentarz-i-pogrzeb'}
SUBNAME={'Wspólnoty, szkoły, sport':'Szkoły i kluby','Prezenty':None,'Salony beauty i firmy':None,'Pamięć':'Pamiątki'}
SALON=re.compile(r'salon|lustr|bony|higien|recepc|szyld|wizytown|lusterk|dystans|logo-na',re.I)
FIRMA=re.compile(r'termos|statuet|kartka-drewn|pudelko|skrzynka|butelka',re.I)
IMG={'krysztal-zdjecie':'f/krysztal-para-sq','krysztal-slub':'f/krysztal-para-sq','koperta-drewniana':'f/koperta-drewniana-sq','bombka-akryl-zloty':'f/bombka-zlota-sq','krysztal-zimowy-led':'p/krysztal-k9-ze-zdjeciem','krysztal-pamiatkowy':'p/grawer-na-szkle',
 'bombka-zdjecie':'p/bombka-ze-zdjeciem','bombka-dab':'bombka/glowne','poduszka-zdjecie':'p/poduszka-ze-zdjeciem','puzzle-zdjecie':'p/puzzle-ze-zdjecia',
 'obraz-plotno':'p/obraz-na-plotnie','niesmiertelnik':'p/niesmiertelnik-ze-zdjeciem','znicz-zdjecie':'p/znicz-ze-zdjeciem','statuetka-krysztal':'p/statuetka-szklana',
 'zdjecie-na-drewnie':'p/nadruk-uv-na-drewnie','szklo-ramka-zdjecie':'p/nadruk-uv-na-szkle','tablica-wejscie-zarzadca':'p/tablica-ze-stali-nierdzewnej',
 'regulamin-porzadku':'p/tablica-dibond','znaki-zakazu':None,'numeracja-lokali':'p/tabliczka-z-numerem-domu','tabliczki-drzwi-salon':'p/tabliczka-na-drzwi',
 'napis-recepcja':'p/litery-przestrzenne','logo-na-sciane':'p/litery-przestrzenne','napis-scienny':'p/napisy-i-dekoracje-ze-sklejki','inicjal-dziecko':'p/napisy-i-dekoracje-ze-sklejki',
 'tabliczka-przedszkole':'p/tabliczka-z-imieniem','brelok-akryl-zdjecie':'p/breloki-akrylowe','odbitki-polaroid':'p/odbitki-10-15-do-15-21','fotopanel-aluminium':'p/fotoobraz-na-dibond',
 'akryl-blok-zdjecie':'p/zdjecie-na-pleksi','akryl-polaroid':'p/zdjecie-na-pleksi','dyplom-drewniany':'p/dyplomy-i-certyfikaty','oznakowanie-piwnic':'p/tabliczka-na-drzwi',
 'tablica-ogloszen':None,'tabliczki-skrzynki':'p/tabliczka-z-imieniem','bony-podarunkowe':'p/karty-pcv','kubek-termiczny-grawer':'p/termos-z-logo',
 'pakiet-budynek':'p/tablica-ze-stali-nierdzewnej','etui-telefon-uv':None,'tablica-powitalna':'p/tablica-dibond','plan-stolow':'p/tablica-dibond','zaproszenia':'p/zaproszenia',
 'kalendarz-biurkowy':'p/kalendarz-scienny-a3-2027','plakat-mapa-2d':None,'mapa-nieba':None,'wizytowki-lakier':'p/wizytowki-300-g','magnesy-zdjecia':'p/odbitki-10-15-do-15-21',
 'akryl-led-zdjecie':'p/tabliczka-akrylowa-led','kartka-drewniana':'p/nadruk-uv-na-drewnie','fotoksiazka-a5':'p/zdjecia-z-sesji-w-etui'}
imgs={f[:-4] for f in os.listdir(B+'/public/img/p')}
def toks(s): return set(t for t in re.split(r'[-_ ]',s.lower()) if len(t)>2)
def price(t):
    m=re.findall(r'(\d+(?:,\d+)?)\s*(?:zł|/|\s|$)',t.replace(' ',' '))
    if not m or 'wycena' in t: return None
    return float(m[0].replace(',','.'))
def tiers(t):
    m=re.findall(r'\b([SML])\s+(\d+)',t)
    return [{'k':k,'p':int(p)} for k,p in m] if len(m)>=2 else None
def fields(r):
    s=(r['nazwa']+' '+r['warianty']+' '+r['slug']).lower(); f=[]
    if re.search(r'zdj|foto|polaroid|puzzle|obraz|plakat|okładk|bilet|litofan',s): f.append('photo')
    if re.search(r'logo|firm|salon|szyld|wizyt|bony|zarządc|ulotk|rollup',s): f.append('logo')
    if re.search(r'imi|grawer|napis|dedyk|tabli|numer|inicja|data|tekst|bombk|zawiesz|adresów|piosenk',s) or not f: f.append('text')
    if re.search(r'lista|komplet|skrzyn|lokal|winiet',s): f.append('list')
    return f
seen=set(); prods=[]
order={r['slug']:i for i,r in enumerate(rows)}
for r in sorted(rows,key=lambda r:(r['kategoria']!='Wspólnoty i spółdzielnie')):
    if r['slug'] in seen: continue
    seen.add(r['slug'])
    k=r['kategoria']
    if k in ('Dom i dekoracje','Dla dzieci') and re.search(r'zdj|foto|fototapet|plakat|mapa',r['slug']+r['nazwa'].lower()): cat='prezenty-ze-zdjeciem'; sub=k
    elif k=='Prezenty': cat='prezenty-ze-zdjeciem' if re.search(r'zdj|foto|polaroid|puzzle|obraz|mapa|plakat|etui-telefon|magnes|litofan|tumbler',r['slug']+r['nazwa'].lower()) else 'prezenty-z-grawerem'; sub='Prezenty ze zdjęciem' if cat=='prezenty-ze-zdjeciem' else 'Grawer'
    elif k=='Salony beauty i firmy':
        cat='salony-beauty' if SALON.search(r['slug']) and not FIRMA.search(r['slug']) else 'dla-firm'; sub='Szyldy i logo' if cat=='salony-beauty' else 'Upominki z logo'
    else: cat=SUB2CAT.get(k,'dla-firm'); sub=SUBNAME.get(k) or k
    sl=r['slug']
    if cat=='druk-wielkoformatowy' and k=='Druk wielkoformatowy': sub='Banery i flagi' if re.search('baner|siatka',sl) else 'Plakaty i tablice' if re.search('plakat|tablica|potykacz',sl) else 'Folie i naklejki'
    if k=='Ploter tnący': sub='Litery i napisy z folii'
    if cat=='szkoly-i-przedszkola': sub='Wejście i ogrodzenie' if re.search('drzwi|rekrutacja|urzedowa',sl) else 'Dyplomy i odzież' if re.search('dyplom|koszulk',sl) else 'Sale i korytarze'
    if cat=='cmentarz-i-pogrzeb': sub='Na pogrzeb' if re.search('klepsydr|portret|obrazki|podziekowania|szarfa',sl) else 'Pamiątki' if re.search('krysztal|pupil',sl) else 'Na cmentarz'
    if cat=='dla-fotografow': sub='Odbitki i powiększenia' if re.search('odbitk|powieksz|kalendarz|retusz',sl) else 'Fine art'
    if cat=='sublimacja': sub='Tekstylia' if re.search('koszul|koc|recznik|fartuch|torba|flaga|skarpet',sl) else 'Gadżety'
    if cat=='wspolnoty-i-spoldzielnie' and re.search('ppoz|alarmow',sl): sub='Ppoż. i bezpieczeństwo'
    if sl=='montaz-oznakowania': sub='Montaż'
    if cat=='na-swieta': sub='Bombki' if 'bombk' in r['slug'] else 'Kryształy' if 'kryszt' in r['slug'] else 'Kalendarze 2027' if 'kalend' in r['slug'] else 'Ozdoby 3D'
    if cat=='wspolnoty-i-spoldzielnie': sub='Pakiety' if 'pakiet' in r['slug'] else 'Tablice' if re.search('tablica|regulamin',r['slug']) else 'Tabliczki i numeracja' if re.search('skrzyn|domofon|numer',r['slug']) else 'Oznakowanie'
    if cat=='wspolnoty-i-spoldzielnie' and re.search('ppoz|alarmow',r['slug']): sub='Ppoż. i bezpieczeństwo'
    if r['slug']=='montaz-oznakowania': sub='Montaż'
    if k=='Wspólnoty, szkoły, sport' and re.search('szkol|przedszk|dyplom|medal',r['slug']+r['nazwa'].lower()): cat='szkoly-i-przedszkola'; sub='Dyplomy i odzież' if re.search('dyplom|medal',r['slug']) else 'Sale i korytarze'
    im=IMG.get(r['slug'],'')
    if im=='' :
        st=toks(r['slug'])|toks(r['nazwa']); best=max(imgs,key=lambda i:len(toks(i)&st)); im='p/'+best if len(toks(best)&st)>=2 else None
    if r['slug']=='krysztal-zdjecie': r['warianty']='S 5×5×8 cm, M 6×6×10 cm, L 8×8×12 cm; podstawka LED +49 zł'
    vt=None
    for src in ('nasza_cena','warianty'):
        if '=' in r[src] and '|' in r[src]:
            vt=sorted([{'k':a.strip(),'p':float(b)} for a,b in (x.split('=') for x in r[src].split('|'))],key=lambda t:t['p'])
            if src=='warianty': r['warianty']=', '.join(t['k'] for t in vt)
            else: r['warianty']=r['warianty']
            r['nasza_cena']='od '+(('%g'%vt[0]['p']).replace('.',','))+' zł'+('/szt' if re.search('odbitk',r['slug']) else '')
    p=price(r['nasza_cena'])
    unit=bool(re.search(r'/szt|/m²|/ 50|od \d+ szt',r['nasza_cena']))
    prods.append(dict(slug=r['slug'],name=r['nazwa'],cat=cat,sub=sub,variants=r['warianty'],priceText=r['nasza_cena'],price=p,tiers=vt or tiers(r['nasza_cena']),
        machine=r['maszyna'],score=float(r['ocena'] or 0),xmas=r['zdazy_na_swieta']=='tak',img=('img/'+im+'.jpg') if im else None,fields=fields(r),
        quote=p is None or cat in('wspolnoty-i-spoldzielnie',) and 'pakiet' in r['slug'], unit=unit))

# produkty z kreatorem (odzież i kubki) – projekt robi klient w kreatorze
for slug,name,pr,var,mach in [('koszulka-z-nadrukiem','Koszulka z własnym nadrukiem',69,'9 kolorów, S–3XL, nadruk przód i tył','DTF + prasa'),
    ('bluza-z-nadrukiem','Bluza z kapturem z własnym nadrukiem',149,'9 kolorów, S–3XL, przód i tył','DTF + prasa'),
    ('kubek-z-nadrukiem','Kubek ceramiczny z nadrukiem',45,'330 ml, 5 kolorów, zdjęcie, logo lub tekst','Sublimacja / GoArt UV A3')]:
    prods.append(dict(slug=slug,name=name,cat='prezenty-ze-zdjeciem',sub='Odzież i kubki',variants=var,priceText=f'{pr} zł',price=pr,tiers=None,machine=mach,score=5.0,xmas=False,img=f'img/hf/{slug}-1.jpg',fields=[],quote=False,unit=False,creatorOnly=True))
GAL=json.load(open(B+'/src/data/gallery.json'))
for p in prods:
    g=GAL.get(p['slug'])
    if g: p['img']=g['card']; p['gallery']=g['gallery']; p['score']+=1000
    elif p['img'] and '/f/' in p['img']: p['gallery']=[p['img'].replace('-sq','')]; p['score']+=900
    else: p['gallery']=[p['img']] if p['img'] else []
import sys; sys.path.insert(0,B+'/tools'); from tags import tag, facets
for p in prods:
    m=p['machine'] or ''; a=[]
    if 'F500' in m: a.append('sublimacja')
    if re.search('P9500|D1000|fine art',m+p['slug']): a.append('dla-fotografow')
    if re.search('Latex|Summa',m): a.append('druk-wielkoformatowy')
    p['also']=[x for x in a if x!=p['cat']]
for p in prods: p['tags']=tag(p)

# ——— historia cen (Omnibus) i promocja z src/data/config.js ———
import datetime as _dt
try:
    from zoneinfo import ZoneInfo; TODAY=_dt.datetime.now(ZoneInfo('Europe/Warsaw')).date()
except Exception: TODAY=_dt.date.today()
if os.environ.get('AIP_TODAY'): TODAY=_dt.date.fromisoformat(os.environ['AIP_TODAY'])
base_price=lambda p: (p['tiers'][0]['p'] if p['tiers'] else p['price'])
HP=B+'/data/price-history.json'
H=json.load(open(HP)) if os.path.exists(HP) else {}
for p in prods:
    bp=base_price(p)
    if bp is None: continue
    h=H.setdefault(p['slug'],[])
    if not h or h[-1][1]!=bp: h.append([TODAY.isoformat(),bp])
open(HP,'w').write('{\n'+',\n'.join(json.dumps(k)+': '+json.dumps(v) for k,v in sorted(H.items()))+'\n}\n')
CJ=open(B+'/src/data/config.js',encoding='utf-8').read()
m=re.search(r'export const PROMO = \{(.*?)\n\};',CJ,re.S)
PR=None
if m:
    body=m.group(1); g=lambda k: re.search(k+r":\s*'([^']*)'",body).group(1)
    PR=dict(on='on: true' in body,pct=float(re.search(r'pct:\s*([\d.]+)',body).group(1)),start=g('from'),until=g('until'),name=g('name'),slugs=json.loads(re.search(r'slugs:\s*(\[.*?\])',body,re.S).group(1)))
def low30(slug,start):
    h=sorted(H.get(slug,[])); s=_dt.date.fromisoformat(start); ws=(s-_dt.timedelta(days=30)).isoformat(); st=s.isoformat()
    eff=[pr for d,pr in h if d<=ws][-1:]+[pr for d,pr in h if ws<d<=st]
    return min(eff) if eff else (h[0][1] if h else None)
if PR and PR['on'] and PR['start']<=TODAY.isoformat()<=PR['until']:
    k=1-PR['pct']/100
    for p in prods:
        if p['slug'] in PR['slugs'] and base_price(p):
            p['promo']=dict(pct=PR['pct'],k=k,until=PR['until'],name=PR['name'],low30=low30(p['slug'],PR['start']),regular=base_price(p))
            p['tags']['promo']=['5']; p['score']+=1500
    print('promocja aktywna:',sum('promo' in p for p in prods),'produktów do',PR['until'])
else: print('promocja nieaktywna')
prods.sort(key=lambda p:-p['score'])
cats=[dict(slug=s,name=n,lead=l,color=c,subs=sorted({p['sub'] for p in prods if p['cat']==s}),count=sum(p['cat']==s or s in p.get('also',[]) for p in prods)) for s,n,l,c in CATS]
json.dump(dict(cats=cats,products=prods,facets=facets()),open(B+'/src/data/catalog.json','w'),ensure_ascii=False,indent=0)
for c in cats: print(c['slug'],c['count'],c['subs'])
print(len(prods),'z ceną',sum(p['price'] is not None for p in prods),'ze zdjęciem',sum(bool(p['img']) for p in prods))
print([ (p['slug'],p['priceText']) for p in prods if p['price'] is None][:40])
