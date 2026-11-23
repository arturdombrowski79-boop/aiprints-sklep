# Impozycja broszury zszywanej (saddle-stitch) z PDF A5 – pod Xerox C75.
#   KAT=b2b FMT=a5 python3 tools/katalog.py && KAT=b2b FMT=a5 node tools/katalog-pdf.mjs && python3 tools/broszura.py
# Wynik (public/pliki/druk/):
#   *-broszura-A4.pdf    – arkusze A4 poziomo, 2 strony A5 obok siebie, druk dwustronny „krótka krawędź”, złożyć i zszyć.
#   *-broszura-SRA3.pdf  – to samo na SRA3 ze spadem 3 mm i znacznikami cięcia (bez białej ramki po docięciu do A4).
import os, sys, subprocess, tempfile, io
from pypdf import PdfReader, PdfWriter, PageObject, Transformation
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from PIL import Image

B = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sys.argv[1] if len(sys.argv) > 1 else B + '/public/pliki/katalog-firmy-aiprints-a5.pdf'
OUT = B + '/public/pliki/druk'; os.makedirs(OUT, exist_ok=True)
base = os.path.basename(SRC).replace('-a5.pdf', '')
r = PdfReader(SRC); n = len(r.pages)
assert n % 4 == 0, f'liczba stron {n} nie jest podzielna przez 4'
W, H = 148 * mm, 210 * mm

# kolor tła każdej strony (do spadu) – piksel z rogu strony
with tempfile.TemporaryDirectory() as t:
    subprocess.run(['pdftoppm', '-r', '12', '-png', SRC, t + '/p'], check=True)
    fs = sorted(os.listdir(t)); bg = [Image.open(f'{t}/{f}').convert('RGB').getpixel((1, 1)) for f in fs]

# kolejność: arkusz s – przód [ostatnia-2s, 2s+1], tył [2s+2, ostatnia-2s-1] (indeksy od 0)
sides = []
for s in range(n // 4):
    sides.append((n - 1 - 2 * s, 2 * s)); sides.append((2 * s + 1, n - 2 - 2 * s))

def build(sw, sh, bleed, marks, name):
    ox, oy = (sw - 2 * W) / 2, (sh - H) / 2
    w = PdfWriter()
    for L, R in sides:
        buf = io.BytesIO(); c = canvas.Canvas(buf, pagesize=(sw, sh))
        if bleed:
            for k, (pi, x) in enumerate(((L, ox), (R, ox + W))):
                c.setFillColorRGB(*[v / 255 for v in bg[pi]])
                c.rect(x - (bleed if k == 0 else 0), oy - bleed, W + bleed, H + 2 * bleed, stroke=0, fill=1)
        if marks:
            c.setStrokeColorRGB(0, 0, 0); c.setLineWidth(0.25)
            g, ln = 3 * mm, 6 * mm
            for x in (ox, ox + 2 * W):
                for y in (oy, oy + H):
                    sx = -1 if x == ox else 1; sy = -1 if y == oy else 1
                    c.line(x + sx * g, y, x + sx * (g + ln), y); c.line(x, y + sy * g, x, y + sy * (g + ln))
            c.setDash(2, 2)
            c.line(ox + W, oy - g, ox + W, oy - g - ln); c.line(ox + W, oy + H + g, ox + W, oy + H + g + ln)
            c.setDash()
            c.setFont('Helvetica', 6); c.setFillColorRGB(.3, .3, .3)
            c.drawString(ox, oy - g - ln - 3 * mm, f'{base} · str. {L + 1} | {R + 1} · ciąć na A4, złożyć w połowie (linia przerywana), zszyć')
        c.showPage(); c.save(); buf.seek(0)
        pg = PdfReader(buf).pages[0]
        for pi, x in ((L, ox), (R, ox + W)):
            pg.merge_transformed_page(r.pages[pi], Transformation().translate(x, oy))
        w.add_page(pg)
    w.compress_identical_objects(remove_duplicates=True, remove_unreferenced=True)
    p = f'{OUT}/{base}-{name}.pdf'; w.write(p); print(p, len(sides), 'stron arkuszy')

build(297 * mm, 210 * mm, 0, False, 'broszura-A4')
build(450 * mm, 320 * mm, 3 * mm, True, 'broszura-SRA3')
