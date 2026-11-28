# Katalog oferty PDF: buduje prod/_katalog.html (+ miniatury w prod/_katalog/), a tools/katalog-pdf.mjs drukuje go do
# public/pliki/katalog-aiprints.pdf. Uruchom po `bash tools/build.sh`:  python3 tools/katalog.py && node tools/katalog-pdf.mjs
# Dane: src/data/catalog.json (produkty, ceny), src/data/realizacje.json, src/data/pakiety.js (przez node), real-photos.json.
import json, os, re, html, hashlib, subprocess, datetime
from PIL import Image, ImageOps
B = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = B + '/prod'; OUT = P + '/_katalog'; os.makedirs(OUT + '/t', exist_ok=True)
cat = json.load(open(B + '/src/data/catalog.json'))
REAL = json.load(open(B + '/src/data/realizacje.json'))
PAK = json.loads(subprocess.check_output(['node', '-e', "import('./src/data/pakiety.js').then(m=>console.log(JSON.stringify(m.PAKIETY)))"], cwd=B))
E = lambda s: html.escape(str(s or ''))
TODAY = datetime.date.today()
A5 = os.environ.get('FMT') == 'a5'     # FMT=a5 → broszura A5 (A4 składane, zszywane) pod Xerox C75
B2B = os.environ.get('KAT') == 'b2b'   # KAT=b2b → katalog tylko dla firm (ceny netto), plik katalog-firmy
def NET(t):
    if not B2B: return t
    t = re.sub(r'(\d+(?:[.,]\d+)?)(?=\s*(?:/\s*)?(?:\d+\s*)?zł)', lambda m: (lambda v: ('%d' % v) if abs(v - round(v)) < 0.005 else ('%.2f' % v).replace('.', ','))(float(m.group(1).replace(',', '.')) / 1.23), t)
    return t.replace('zł', 'zł netto', 1) if 'zł' in t else t
MIES = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia']
DATA = f'{TODAY.day} {MIES[TODAY.month - 1]} {TODAY.year}'

def thumb(src, w=440):
    """Miniatura do PDF (mniejszy plik). Zwraca ścieżkę względną od prod/."""
    if not src: return ''
    f = P + '/' + src.lstrip('/')
    if not os.path.exists(f): return ''
    h = hashlib.md5((src + str(w)).encode()).hexdigest()[:12]; o = f'{OUT}/t/{h}.jpg'
    if not os.path.exists(o):
        im = ImageOps.exif_transpose(Image.open(f)).convert('RGB'); im.thumbnail((w, w), Image.LANCZOS); im.save(o, quality=68, optimize=True, progressive=True)
    return f'_katalog/t/{h}.jpg'

zl = lambda v: (('%d' % v) if v == int(v) else ('%.2f' % v).replace('.', ',')) + ' zł'
prods = [p for p in cat['products'] if p['cat'] != 'na-swieta']
def od(fn):
    v = [(p['tiers'][0]['p'] if p.get('tiers') else p['price']) for p in prods if p.get('price') and not p.get('quote') and fn(p)]
    return NET(('od ' + zl(min(v)))) if v else 'wycena'
inc = lambda c: (lambda p: p['cat'] == c or c in (p.get('also') or []))
mach = lambda rx: (lambda p: re.search(rx, p.get('machine') or ''))

def price_of(p):
    if not p.get('price') or p.get('quote'): return 'wycena'
    t = p['priceText'] or ''
    t = re.sub(r'\s*\(.*\)$', '', t)
    return NET(t if len(t) < 34 else ('od ' + zl(p['tiers'][0]['p']) if p.get('tiers') else t[:34]))

def short(t, n=80):
    t = re.sub(r'\s+', ' ', t or '').strip()
    return t if len(t) <= n else t[:n].rsplit(' ', 1)[0] + '…'

pages = []
def page(body, cls='', num=True):
    for b in body.split('</section>SPLIT'): pages.append((b, cls, num))

# ——— 1. okładka ———
cov = [thumb(x, 900) for x in (['img/realizacje/domix-powstancow-24.jpg', 'img/realizacje/przedszkole-drzwi.jpg', 'img/realizacje/fototapeta-salon.jpg', 'img/realizacje/domix-szobiszowicka-1.jpg', 'img/realizacje/rollup-festyn.jpg', 'img/realizacje/druk-3d-wazon.jpg'] if B2B else ['img/realizacje/domix-powstancow-24.jpg', 'img/f/krysztal-para-sq.jpg', 'img/realizacje/przedszkole-zagladajace-dzieci.jpg', 'img/portfolio/sesja-02.jpg', 'img/realizacje/fototapeta-salon.jpg', 'img/hf/karafka-grawer-sq.jpg'])]
COV_EY = 'Oferta dla firm, wspólnot i instytucji' if B2B else 'Katalog usług i produktów'
COV_H = 'Oznakowanie, druk<br><em>i produkcja dla firm.</em>' if B2B else 'Twój pomysł,<br><em>nasza pracownia.</em>'
COV_L = ('Tablice i oznakowanie budynków, szyldy, oklejanie witryn, banery i druk wielkoformatowy, grawer i cięcie laserowe, pieczątki, druk 3D i materiały dla szkół – wykonujemy we własnej pracowni w Chorzowie, z montażem na Śląsku. Ceny netto, faktura VAT, wycena w 24 h.' if B2B else
         'Prezenty personalizowane, grawer i druk UV, druk cyfrowy i wielkoformatowy, fine art, sublimacja, druk 3D, pieczątki, oznakowanie i fotografia – wszystko wykonujemy we własnej pracowni w Chorzowie.')
page(f'''
<div class="cov">
  <img src="img/logo-white.svg" class="cov-logo" alt="AiPrints.pl">
  <p class="eyebrow light">{COV_EY} · {TODAY.year}/{TODAY.year + 1}</p>
  <h1 class="cov-h">{COV_H}</h1>
  <p class="cov-lead">{COV_L}</p>
  <div class="cov-grid">{''.join(f'<img src="{c}">' for c in cov if c)}</div>
  <div class="cov-foot"><b>AiPrints.pl</b> · ul. Okrężna 98B, 41-500 Chorzów · tel. 609 040 274 · kontakt@aiprints.pl · <b>aiprints.pl</b></div>
</div>''', 'dark', False)

# ——— 2. o pracowni ———
MACH = [
  ('Lasery xTool – CO₂, MOPA 60 W, UV 5 W + RA3', 'Grawer i cięcie: drewno, akryl, skóra, stal, aluminium, szkło i kryształ, przedmioty okrągłe; gumki do pieczątek.'),
  ('Drukarka UV GoArt A3 (CMYK + biały + lakier)', 'Druk bezpośrednio na przedmiotach: akryl, szkło, drewno, metal, etui, gadżety; wypukły lakier 3D.'),
  ('HP Latex 375 + ploter tnący Summa S3', 'Druk do 1,6 m szerokości: banery, siatki, folie, fototapety, naklejki po obrysie, litery z folii.'),
  ('Epson SureColor P9500 + EIZO ColorEdge CG319X', 'Fine art do 44 cali na papierach muzealnych, reprodukcje, edycje Digigraphie® by Epson.'),
  ('Epson SureLab D1000 (DryLab)', 'Odbitki fotograficzne od 10×15 do 20×30 cm, zdjęcia do dokumentów, kalendarze, przypinki.'),
  ('Epson SureColor F500 + prasy', 'Sublimacja: koszulki sportowe, kubki, koce, poduszki, fotopanele, gadżety z logo.'),
  ('Xerox C75 z finiszerem', 'Druk cyfrowy do SRA3: prace dyplomowe, zaproszenia, wizytówki, ulotki składane, broszury.'),
  ('Drukarki 3D Bambu Lab (H2C, X1C, A2L, A1 mini)', 'PLA, PET-G, ASA, ABS, PLA-CF, TPU – części, prototypy, figurki, druk wielokolorowy.'),
  ('Sony A7R V + obiektywy G Master', 'Sesje w studiu i plenerze, zdjęcia do dokumentów, packshoty, architektura, dron.'),
]
page(f'''
<p class="eyebrow">O pracowni</p>
<h2 class="h2">Wszystko powstaje <em>u nas</em>.</h2>
<div class="two">
  <div><p class="lead">Nie zlecamy produkcji podwykonawcom. Projekt, grawer, druk, kontrola i pakowanie odbywają się w jednej pracowni przy ul. Okrężnej 98B w Chorzowie. Dlatego pokazujemy projekt przed produkcją, pilnujemy terminów i odpowiadamy za każdy egzemplarz.</p>
  <ul class="ticks">
    <li><b>Projekt do akceptacji</b> – produkcję zaczynamy po Twoim „tak”; poprawki przed akceptacją są bezpłatne.</li>
    <li><b>Od 1 sztuki do serii</b> – prezent dla jednej osoby albo kilkaset upominków z logo.</li>
    <li><b>Faktura VAT</b> – dla firm, szkół, wspólnot i instytucji; stałym klientom płatność z terminem.</li>
    <li><b>Wycena w 24 h</b> w dni robocze – wystarczy opis, zdjęcie miejsca albo plik.</li>
    <li><b>Wysyłka w całej Polsce</b>, odbiór w Chorzowie, montaż oznakowania na Śląsku.</li>
  </ul></div>
  <img src="{thumb('img/site/pracownia.jpg', 900)}" class="ph tall">
</div>
{'</section>SPLIT<p class="eyebrow">O pracowni (cd.)</p>' if A5 else ''}<h3 class="h3">Park maszynowy</h3>
<div class="mgrid">{''.join(f'<div class="m"><b>{E(t)}</b><span>{E(d)}</span></div>' for t, d in MACH)}</div>
''')

# ——— 3. usługi w skrócie ———
U = [
  ('Prezenty personalizowane', 'Grawer, zdjęcie, kryształy 3D, akryl, drewno, szkło – z podglądem projektu.', od(lambda p: p.get('kind') == 'gift' and inc('prezenty-z-grawerem')(p)), 'aiprints.pl/sklep'),
  ('Grawer i cięcie laserowe', 'Serie z logo, tabliczki, cięcie akrylu i sklejki z pliku, grawer na przedmiotach klienta.', 'wycena', 'aiprints.pl/grawer-laserowy'),
  ('Pieczątki', 'Firmowe w automatach, imienne, okrągłe, kieszonkowe, datowniki; wymiana gumek.', od(lambda p: p['slug'] == 'pieczatki-firmowe'), 'aiprints.pl/pieczatki-firmowe'),
  ('Druk cyfrowy (Xerox C75)', 'Prace dyplomowe, zaproszenia, wizytówki, ulotki, broszury zszywane – do SRA3.', od(mach('Xerox')), 'aiprints.pl/druk-cyfrowy'),
  ('Druk wielkoformatowy i folie', 'Banery, siatki, fototapety, folie na witryny, naklejki po obrysie, litery z folii.', od(inc('druk-wielkoformatowy')), 'aiprints.pl/druk-wielkoformatowy'),
  ('Fine art i Digigraphie®', 'Wydruki muzealne, reprodukcje, edycje limitowane z certyfikatem, odbitki.', od(lambda p: inc('dla-fotografow')(p) and re.search('fine-art|digigraphie|wydruk', p['slug'])), 'aiprints.pl/druk-dla-artystow'),
  ('Koszulki, kubki i gadżety', 'Koszulki z logo i imieniem, kubki, koce, poduszki – nadruk, który nie schodzi.', od(inc('koszulki-kubki-gadzety')), 'aiprints.pl/koszulki-kubki-gadzety'),
  ('Druk 3D na zamówienie', 'Części zamienne, prototypy, figurki i gadżety z 6 materiałów.', od(inc('wydruki-3d')), 'aiprints.pl/druk-3d'),
  ('Szyldy i oznakowanie firm', 'Szyldy z plexi i lustra, logo na ścianę, tabliczki, stojaki QR, upominki z logo.', od(inc('dla-firm')), 'aiprints.pl/dla-firm'),
  ('Salony beauty', 'Szyldy, cenniki, bony, wizytówki, oznakowanie gabinetu i oznakowanie higieniczne.', od(inc('salony-beauty')), 'aiprints.pl/salony-beauty'),
  ('Wspólnoty i zarządcy', 'Tablice przy wejściu, regulaminy, numeracja, tabliczki na skrzynki – w jednym stylu.', od(inc('wspolnoty-i-spoldzielnie')), 'aiprints.pl/wspolnoty-i-spoldzielnie'),
  ('Szkoły i przedszkola', 'Grafiki na drzwi i okna, plakaty grup, banery, dyplomy, tabliczki sal.', od(inc('szkoly-i-przedszkola')), 'aiprints.pl/szkoly-i-przedszkola'),
  ('Pamięć i pogrzeb', 'Zdjęcia nagrobne na porcelanie, tabliczki, klepsydry, portrety, obrazki pamiątkowe.', od(inc('cmentarz-i-pogrzeb')), 'aiprints.pl/cmentarz-i-pogrzeb'),
  ('Fotografia i sesje', 'Zdjęcia do dokumentów, portret, sesje rodzinne i plenerowe, produkty, architektura, dron.', 'od 30 zł', 'aiprints.pl/fotografia'),
]
if B2B: U = [u for u in U if u[0] not in ('Prezenty personalizowane', 'Sublimacja', 'Pamięć i pogrzeb', 'Fotografia i sesje', 'Fine art i Digigraphie®')]
page(f'''
<p class="eyebrow">Usługi w skrócie</p>
<h2 class="h2">Co dla Ciebie <em>zrobimy</em></h2>
<table class="tbl">{''.join(f'<tr><td><b>{E(t)}</b><span>{E(d)}</span><i>{E(u)}</i></td><td class="pr">{E(c)}</td></tr>' for t, d, c, u in U)}</table>
<p class="note">{'Ceny netto – do każdej ceny doliczamy VAT 23%. Stan na' if B2B else 'Ceny brutto (z VAT 23%) według stanu na'} {DATA}. Aktualne ceny, promocje i pełny opis każdego produktu znajdziesz na aiprints.pl. Większe zlecenia i serie wyceniamy indywidualnie w ciągu 24 h w dni robocze.</p>
''')

# ——— 4. kategorie produktów ———
ORDER = ['wspolnoty-i-spoldzielnie', 'dla-firm', 'salony-beauty', 'szkoly-i-przedszkola', 'druk-wielkoformatowy', 'wydruki-3d'] if B2B else ['prezenty-ze-zdjeciem', 'prezenty-z-grawerem', 'slub-i-okazje', 'dla-firm', 'salony-beauty', 'wspolnoty-i-spoldzielnie', 'szkoly-i-przedszkola', 'druk-wielkoformatowy', 'dla-fotografow', 'koszulki-kubki-gadzety', 'cmentarz-i-pogrzeb', 'wydruki-3d']
CN = {c['slug']: c for c in cat['cats']}
RG = {'wspolnoty-i-spoldzielnie': 'wspolnoty', 'szkoly-i-przedszkola': 'szkoly', 'druk-wielkoformatowy': 'wielkoformat', 'prezenty-ze-zdjeciem': 'zdjecia', 'koszulki-kubki-gadzety': 'odziez', 'wydruki-3d': 'druk3d'}
def card(p):
    real = p.get('real')
    return f'''<div class="pc"><div class="pi"><img src="{thumb(p.get('img') or '')}">{'<span class="real">Realizacja</span>' if real else ''}</div>
<b>{E(p['name'])}</b><span class="v">{E(short(p.get('variants'), 72))}</span><span class="p">{E(price_of(p))}</span></div>'''
for slug in ORDER:
    c = CN[slug]; items = sorted([p for p in prods if p['cat'] == slug], key=lambda p: -(p.get('score') or 0))
    if not items: continue
    rs = [r for r in REAL if r['g'] == RG.get(slug)][:4]
    first, per = ((6 if rs else 9), 9) if A5 else ((8 if rs else 12), 16)
    chunks = [items[:first]] + [items[i:i + per] for i in range(first, len(items), per)]
    for k, ch in enumerate(chunks):
        head = (f'<p class="eyebrow">Katalog · {E(c["name"])}</p><h2 class="h2">{E(c["name"])}</h2><p class="lead sm">{E(c.get("lead"))}</p>'
                + (f'<div class="rstrip">{"".join(f"<img src=\"{thumb(r["f"])}\">" for r in rs)}</div><p class="cap">Zdjęcia z naszych realizacji</p>' if rs else '')) if k == 0 else f'<p class="eyebrow">Katalog · {E(c["name"])} (cd.)</p>'
        page(head + f'<div class="pgrid">{"".join(card(p) for p in ch)}</div><p class="more">Pełne opisy, warianty i zamówienie online: <b>aiprints.pl/{slug}</b></p>')

# ——— 5. fotografia i pakiety ———
SV = [('zdjecia-do-dokumentow', 'Zdjęcia do dokumentów'), ('sesja-portretowa', 'Portret i zdjęcie biznesowe'), ('sesja-rodzinna', 'Sesja rodzinna'), ('sesja-plenerowa', 'Sesja plenerowa'), ('fotografia-produktowa', 'Fotografia produktowa'), ('fotografia-architektury', 'Architektura i wnętrza'), ('zdjecia-z-drona', 'Zdjęcia i filmy z drona')]
def pak(s, t):
    d = PAK.get(s);
    if not d: return ''
    return f'<div class="pk"><h4>{E(t)}</h4><p class="pkn">{E(d["note"])}</p>' + ''.join(f'<div class="pkr"><div><b>{E(n)}</b><span>{E(" · ".join(f))}</span></div><em>{E(pr)}</em></div>' for n, pr, f in d['p']) + '</div>'
pf = [thumb(f'img/portfolio/sesja-{i:02d}.jpg') for i in (1, 2, 4, 6, 7)]
if not B2B: page(f'''<p class="eyebrow">Fotografia · Sony A7R V + obiektywy G Master</p><h2 class="h2">Sesje i zdjęcia, które <em>od razu wydrukujemy</em></h2>
<div class="rstrip five">{''.join(f'<img src="{x}">' for x in pf)}</div><p class="cap">Zdjęcia z naszych sesji – publikowane za zgodą osób na zdjęciach</p>
<div class="pks">{''.join(pak(s, t) for s, t in SV[:4])}</div>''')
if not B2B: page(f'''<p class="eyebrow">Fotografia · pakiety (cd.)</p><div class="pks">{''.join(pak(s, t) for s, t in SV[4:])}</div>
<p class="note">Najlepsze ujęcia możesz od razu zamówić u nas jako odbitki, fine art, fotoksiążkę, obraz na płótnie albo fotopanel. Obróbka na skalibrowanym monitorze EIZO ColorEdge.</p>''')

# ——— 6. realizacje ———
rr = [r for r in REAL if r['g'] in ('wspolnoty', 'szkoly', 'wielkoformat', 'druk3d')] if B2B else REAL[:]
if A5: rr = rr[:18]  # 3 pełne strony – broszura bez pustych kartek
RP = 6 if A5 else 12
for k in range(0, len(rr), RP):
    ch = rr[k:k + RP]
    page(('<p class="eyebrow">Realizacje</p><h2 class="h2">Zdjęcia z <em>naszych zleceń</em></h2>' if k == 0 else '<p class="eyebrow">Realizacje (cd.)</p>')
         + f'<div class="rgrid">{"".join(f"<figure><img src=\"{thumb(r["f"], 640)}\"><figcaption>{E(r["t"])}</figcaption></figure>" for r in ch)}</div>')

# ——— 7. współpraca dla firm i hurtowa ———
page(f'''<p class="eyebrow">Dla firm, agencji i zleceniodawców hurtowych</p>
<h2 class="h2">Produkujemy <em>dla Twoich klientów</em>.</h2>
<p class="lead">Współpracujemy z agencjami reklamowymi, drukarniami, fotografami, sklepami, zarządcami nieruchomości, salonami i placówkami oświatowymi. Masz zlecenie, którego nie wykonasz na swoich maszynach? Wykonamy je u nas – od pojedynczej sztuki po serie.</p>
<div class="bgrid">
  <div><b>Indywidualny cennik hurtowy</b><span>Przy stałej współpracy i większych nakładach przygotujemy ceny zależne od ilości i regularności zamówień.</span></div>
  <div><b>Wycena w 24 h</b><span>Wyślij opis, plik lub zdjęcie – odpowiemy następnego dnia roboczego z ceną i terminem.</span></div>
  <div><b>Szablony bez ponownego projektu</b><span>Zapisujemy projekty i ustawienia. Kolejne zamówienie to tylko zmiana danych – nie płacisz drugi raz za projekt.</span></div>
  <div><b>Sztuka próbna przed serią</b><span>Przy seriach najpierw wykonujemy egzemplarz do akceptacji – materiał, kolor, rozmieszczenie.</span></div>
  <div><b>Faktura z terminem płatności</b><span>Dla stałych zleceniodawców, zarządców i instytucji – przelew w terminie z faktury.</span></div>
  <div><b>Własny park maszynowy</b><span>Laser, UV, lateks, sublimacja, fine art, druk cyfrowy i 3D w jednym miejscu – bez podwykonawców, terminy pod kontrolą.</span></div>
  <div><b>Pliki od Ciebie</b><span>Przyjmujemy PDF, AI, EPS, SVG, DXF, TIFF, STL, 3MF – pliki do 2 GB przez link, bez limitu przez Dysk Google czy WeTransfer.</span></div>
  <div><b>Wysyłka i montaż</b><span>Wysyłka w całej Polsce, odbiór w Chorzowie, montaż oznakowania na Śląsku.</span></div>
</div>
<div class="cta"><div><b>Zostańmy partnerami.</b><span>Napisz w temacie „Współpraca” – przygotujemy ofertę dla Twojej firmy.</span></div><div class="ctac">firmy@aiprints.pl<br>tel. 609 040 274</div></div>
''')

# ——— 8. dostawa, płatności, kontakt (tył) ———
import segno
qr = segno.make('https://aiprints.pl/sklep', error='m'); qr.save(OUT + '/qr.svg', scale=6, dark='#141210', light=None, border=0)
qr2 = segno.make('https://aiprints.pl/kontakt#wycena', error='m'); qr2.save(OUT + '/qr2.svg', scale=6, dark='#141210', light=None, border=0)
page(f'''<p class="eyebrow">Zamówienia, dostawa, kontakt</p><h2 class="h2">Jak <em>zamówić</em></h2>
<div class="steps">{''.join(f'<div><span>{i}</span><b>{t}</b><p>{d}</p></div>' for i, (t, d) in enumerate([('Wybierz', 'Produkt w sklepie aiprints.pl albo zapytanie o wycenę – mailem, telefonicznie lub w pracowni.'), ('Projekt', 'Przygotujemy projekt w skali 1:1 i wyślemy do akceptacji. Druk z Twoich plików – sprawdzimy je przed produkcją.'), ('Produkcja', 'Wykonujemy na naszych maszynach i sprawdzamy każdy egzemplarz.'), ('Odbiór lub wysyłka', 'Paczkomat InPost 15,99 zł, kurier DPD 19,99 zł, odbiór w Chorzowie 0 zł. Od 199 zł dostawa gratis.')], 1))}</div>
<div class="two mt">
 <div class="contact"><h3 class="h3">Kontakt</h3>
  <p><b>AiPrints.pl – Artur Dombrowski</b><br>ul. Okrężna 98B, 41-500 Chorzów<br>NIP 6262579694</p>
  <p>tel. <b>609 040 274</b><br>kontakt@aiprints.pl – zamówienia i pytania<br>firmy@aiprints.pl – firmy i współpraca<br>www.aiprints.pl · facebook.com/AIPrintsPL</p>
  <p>Płatności online: BLIK, karta, Apple Pay, Google Pay (Stripe). Dla firm przelew na fakturę.</p></div>
 <div class="qrs"><div><img src="_katalog/qr.svg"><span>Sklep online<br><b>aiprints.pl/sklep</b></span></div><div><img src="_katalog/qr2.svg"><span>Zapytaj o wycenę<br><b>aiprints.pl/kontakt</b></span></div></div>
</div>
<p class="note">Katalog ma charakter informacyjny i nie stanowi oferty w rozumieniu Kodeksu cywilnego. {'Ceny netto (+23% VAT)' if B2B else 'Ceny brutto'} według stanu na {DATA}; obowiązują ceny podane w sklepie w chwili zamówienia. Zdjęcia oznaczone jako realizacje pochodzą z naszych zleceń (publikowane za zgodą klientów); pozostałe zdjęcia produktów są poglądowe.</p>
''')

A5CSS = """
@page{size:A5;margin:0}
.page{width:148mm;height:210mm;padding:11mm 10mm 12mm}
.pn{left:10mm;right:10mm;bottom:5mm;font-size:6.2pt}
.eyebrow{font-size:6.4pt}
.h2{font-size:23pt;margin:2mm 0 3mm}.h3{font-size:15pt;margin:5mm 0 2.5mm}
.lead{font-size:8.6pt;line-height:1.45}.lead.sm{font-size:8pt;margin-bottom:3mm}
.note{font-size:6.4pt;margin-top:3.5mm}.cap{font-size:6pt;margin:1mm 0 3mm}
.two{grid-template-columns:1fr 1fr;gap:5mm}.two.mt{margin-top:5mm}.ph.tall{height:70mm}
.ticks{margin-top:3.5mm;gap:2mm;font-size:7.6pt}.ticks li{padding-left:4mm}.ticks li:before{top:1.3mm;width:1.7mm;height:1.7mm}
.mgrid{grid-template-columns:1fr 1fr;gap:2.5mm}.m{padding:2.6mm 3mm}.m b{font-size:7.6pt}.m span{font-size:6.6pt}
.tbl td{padding:2mm 0}.tbl b{font-size:8.6pt}.tbl span{font-size:7pt}.tbl i{font-size:6.3pt}.tbl .pr{font-size:8.6pt;padding-left:4mm}
.pgrid{grid-template-columns:repeat(3,1fr);gap:3.5mm 3mm}
.pc b{font-size:7.4pt;margin-top:1.4mm}.pc .v{font-size:6.2pt;height:8.4mm}.pc .p{font-size:7.6pt}
.real{font-size:5.4pt}
.more{left:10mm;right:10mm;bottom:9.5mm;font-size:6.4pt}
.rstrip{gap:2mm}.rstrip img{height:22mm;border-radius:2mm}
.rgrid{grid-template-columns:1fr 1fr;gap:3.5mm}.rgrid img{height:45mm}.rgrid figcaption{font-size:6.3pt}
.bgrid{gap:2.5mm;margin-top:4mm}.bgrid div{padding:2.8mm 3mm}.bgrid b{font-size:8pt}.bgrid span{font-size:6.7pt;line-height:1.4}
.cta{margin-top:5mm;padding:4.5mm 5mm;border-radius:3mm;gap:4mm}.cta b{font-size:16pt}.cta span{font-size:7.2pt}.ctac{font-size:8.8pt}
.steps{grid-template-columns:1fr 1fr;gap:2.5mm}.steps div{padding:3mm}.steps span{font-size:18pt}.steps b{font-size:8.4pt}.steps p{font-size:6.8pt}
.contact p{font-size:7.6pt;margin-bottom:2.2mm}.qrs{gap:3mm;margin-top:8mm}.qrs img{width:26mm;height:26mm}.qrs span{font-size:6.8pt}
.cov{height:210mm;padding:12mm 11mm 10mm}.cov-logo{height:8mm}.cov-h{font-size:36pt;margin-top:3mm}.cov-lead{font-size:8.2pt;margin-top:4mm}
.cov-grid{gap:2mm;margin-top:6mm}.cov-foot{margin-top:5mm;font-size:6.6pt}
.notes{position:absolute;left:10mm;right:10mm;top:26mm;bottom:16mm;background:repeating-linear-gradient(#f6f4f0 0 9.6mm,#d9d4cc 9.6mm 9.8mm)}
""" if A5 else ''
# ——— składanie HTML ———
idx = open(P + '/index.html', encoding='utf-8').read()
fonts = ''.join(re.findall(r'@font-face\{[^}]*\}', idx))
CSS = fonts + '''
@page{size:A4;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font-family:"Inter Tight Variable","Inter Tight",system-ui,sans-serif;color:#141210;background:#fff}
.page{width:210mm;height:297mm;padding:16mm 15mm 14mm;position:relative;overflow:hidden;page-break-after:always;background:#f6f4f0}
.page.dark{background:#141210;color:#fff;padding:0}
.pn{position:absolute;left:15mm;right:15mm;bottom:7mm;display:flex;justify-content:space-between;font-size:7.5pt;color:#8a857d}
em{font-style:normal;color:#c8146e}
.eyebrow{font-size:7.5pt;letter-spacing:.22em;text-transform:uppercase;color:#c8146e;font-weight:600}
.eyebrow.light{color:#ff7ab8;margin-top:10mm}
.h2{font-family:"Instrument Serif",Georgia,serif;font-weight:400;font-size:34pt;line-height:.95;letter-spacing:-.01em;margin:3mm 0 5mm}
.h3{font-family:"Instrument Serif",Georgia,serif;font-weight:400;font-size:20pt;margin:7mm 0 3mm}
.lead{font-size:10.5pt;line-height:1.5;color:#55514b}
.lead.sm{font-size:9.5pt;max-width:150mm;margin-bottom:4mm}
.note{font-size:7.5pt;line-height:1.45;color:#8a857d;margin-top:5mm}
.cap{font-size:7pt;color:#8a857d;margin:1.5mm 0 4mm}
.two{display:grid;grid-template-columns:1.1fr 1fr;gap:8mm;align-items:start}.two.mt{margin-top:8mm}
.ph{width:100%;border-radius:4mm;object-fit:cover}.ph.tall{height:95mm}
.ticks{list-style:none;margin-top:5mm;display:grid;gap:2.6mm;font-size:9pt;line-height:1.45;color:#3a3732}
.ticks li{padding-left:5mm;position:relative}.ticks li:before{content:"";position:absolute;left:0;top:1.6mm;width:2mm;height:2mm;border-radius:50%;background:#c8146e}
.mgrid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:3mm}
.m{background:#fff;border-radius:3mm;padding:3.2mm 3.5mm;border:.2mm solid #e5e1da}.m b{display:block;font-size:8.3pt;line-height:1.25}.m span{display:block;font-size:7.4pt;line-height:1.4;color:#6b665e;margin-top:1.2mm}
.tbl{width:100%;border-collapse:collapse}.tbl td{padding:2.6mm 0;border-bottom:.2mm solid #e0dbd3;vertical-align:top}
.tbl b{display:block;font-size:10pt}.tbl span{display:block;font-size:8pt;color:#6b665e;margin-top:.6mm}.tbl i{display:block;font-style:normal;font-size:7pt;color:#c8146e;margin-top:.6mm}
.tbl .pr{text-align:right;white-space:nowrap;font-weight:600;font-size:10pt;padding-left:6mm}
.pgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:4mm 3.5mm}
.pc b{display:block;font-size:8pt;line-height:1.25;margin-top:1.8mm}.pc .v{display:block;font-size:6.6pt;line-height:1.35;color:#77726a;margin-top:.8mm;height:9mm;overflow:hidden}.pc .p{display:block;font-size:8.3pt;font-weight:700;margin-top:.8mm}
.pi{position:relative;aspect-ratio:4/3;border-radius:2.5mm;overflow:hidden;background:#e9e5de}.pi img{width:100%;height:100%;object-fit:cover;display:block}
.real{position:absolute;left:1.5mm;top:1.5mm;background:#c8146e;color:#fff;font-size:5.8pt;font-weight:700;padding:.6mm 1.6mm;border-radius:5mm;letter-spacing:.03em}
.more{position:absolute;left:15mm;right:15mm;bottom:13mm;font-size:7.5pt;color:#6b665e}
.rstrip{display:grid;grid-template-columns:repeat(4,1fr);gap:2.5mm}.rstrip.five{grid-template-columns:repeat(5,1fr)}
.rstrip img{width:100%;height:34mm;object-fit:cover;border-radius:2.5mm;display:block}
.rgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:4mm 4mm}.rgrid img{width:100%;height:44mm;object-fit:cover;border-radius:3mm;display:block}.rgrid figcaption{font-size:6.8pt;line-height:1.35;color:#6b665e;margin-top:1.2mm}
.pks{display:grid;grid-template-columns:1fr 1fr;gap:4mm;margin-top:2mm}
.pk{background:#fff;border:.2mm solid #e5e1da;border-radius:3mm;padding:3.5mm 4mm}.pk h4{font-family:"Instrument Serif",Georgia,serif;font-weight:400;font-size:15pt}.pkn{font-size:7.2pt;color:#77726a;margin:.8mm 0 2mm}
.pkr{display:flex;justify-content:space-between;gap:3mm;padding:1.6mm 0;border-top:.2mm solid #eee9e2}.pkr b{display:block;font-size:8pt}.pkr span{display:block;font-size:6.6pt;color:#77726a;line-height:1.35;margin-top:.4mm}.pkr em{color:#141210;font-weight:700;font-size:8.5pt;white-space:nowrap}
.bgrid{display:grid;grid-template-columns:1fr 1fr;gap:3.5mm;margin-top:7mm}.bgrid div{background:#fff;border:.2mm solid #e5e1da;border-radius:3mm;padding:4mm}.bgrid b{display:block;font-size:10pt}.bgrid span{display:block;font-size:8pt;line-height:1.45;color:#6b665e;margin-top:1.2mm}
.cta{margin-top:8mm;background:#141210;color:#fff;border-radius:4mm;padding:7mm;display:flex;justify-content:space-between;align-items:center;gap:6mm}.cta b{display:block;font-family:"Instrument Serif",Georgia,serif;font-weight:400;font-size:22pt}.cta span{display:block;font-size:9pt;color:#c9c4bb;margin-top:1mm}.ctac{font-size:12pt;font-weight:700;text-align:right;line-height:1.5}
.steps{display:grid;grid-template-columns:repeat(4,1fr);gap:3.5mm}.steps div{background:#fff;border:.2mm solid #e5e1da;border-radius:3mm;padding:4mm}.steps span{font-family:"Instrument Serif",Georgia,serif;font-size:24pt;color:#c8146e;line-height:1}.steps b{display:block;font-size:9.5pt;margin-top:1.5mm}.steps p{font-size:7.6pt;line-height:1.45;color:#6b665e;margin-top:1mm}
.contact p{font-size:9pt;line-height:1.55;margin-bottom:3mm;color:#3a3732}
.qrs{display:grid;grid-template-columns:1fr 1fr;gap:5mm;margin-top:16mm}.qrs div{text-align:center}.qrs img{width:36mm;height:36mm}.qrs span{display:block;font-size:8pt;margin-top:2mm;color:#55514b}
.cov{height:297mm;padding:18mm 16mm 14mm;display:flex;flex-direction:column}
.cov-logo{height:11mm;width:auto;align-self:flex-start}
.cov-h{font-family:"Instrument Serif",Georgia,serif;font-weight:400;font-size:54pt;line-height:.92;margin-top:5mm}
.cov-h em{color:#ff7ab8}
.cov-lead{font-size:10.5pt;line-height:1.55;color:#c9c4bb;margin-top:6mm;max-width:150mm}
.cov-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:3mm;margin-top:10mm;flex:1}
.cov-grid img{width:100%;height:100%;object-fit:cover;border-radius:3mm;display:block;min-height:0}
.cov-foot{margin-top:8mm;font-size:8.5pt;color:#c9c4bb}.cov-foot b{color:#fff}
'''
if B2B:  # współpraca zaraz po usługach
    k = next(i for i, x in enumerate(pages) if 'dla Twoich klientów' in x[0]); pages.insert(3, pages.pop(k))
if A5:  # broszura zszywana: liczba stron podzielna przez 4 – strony na notatki przed tylną okładką
    while len(pages) % 4: pages.insert(len(pages) - 1, ('<p class="eyebrow">Notatki</p><div class="notes"></div>', '', True))
out = []
n = 0
for body, cls, num in pages:
    n += 1
    foot = f'<div class="pn"><span>AiPrints.pl · Katalog usług i produktów · {DATA}</span><span>{n}</span></div>' if num else ''
    out.append(f'<section class="page {cls}">{body}{foot}</section>')
open(P + ('/_katalog-firmy' if B2B else '/_katalog') + ('-a5' if A5 else '') + '.html', 'w', encoding='utf-8').write(f'<!doctype html><html lang="pl"><head><meta charset="utf-8"><title>Katalog AiPrints.pl</title><style>{CSS}{A5CSS}</style></head><body>{"".join(out)}</body></html>')
print('stron', n)
