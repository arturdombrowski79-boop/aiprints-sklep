import sys, numpy as np
from PIL import Image
from scipy import ndimage
src, dst = sys.argv[1], sys.argv[2]; fill = float(sys.argv[3]) if len(sys.argv) > 3 else .84
im = np.asarray(Image.open(src).convert('RGB')).astype(np.int16)
r, g, b = im[..., 0], im[..., 1], im[..., 2]
d = g - np.maximum(r, b)
bg = ((d > 28) & (g > 60)) | ((g > 28) & (g > 1.8 * np.maximum(r, b) + 8))
fg = ~bg
fg = ndimage.binary_opening(fg, iterations=2)
lab, n = ndimage.label(fg)
if n:
    sizes = ndimage.sum(fg, lab, range(1, n + 1)); keep = np.argmax(sizes) + 1
    # keep components >= 3% of the biggest (rings, chains)
    ok = [i + 1 for i, s in enumerate(sizes) if s >= sizes.max() * .03]
    fg = np.isin(lab, ok)
# soft alpha on edges
a = np.clip((40 - d) / 25, 0, 1).astype(np.float32); a[~ndimage.binary_dilation(fg, iterations=2)] = 0
a = np.where(fg & ~ndimage.binary_erosion(fg, iterations=2), np.minimum(a, 1), np.where(fg, 1, a))
out = im.copy(); spill = g > np.maximum(r, b); out[..., 1] = np.where(spill, np.maximum(r, b) + (g - np.maximum(r, b)) * 0.15, g)
rgba = np.dstack([out.astype(np.uint8), (a * 255).astype(np.uint8)])
img = Image.fromarray(rgba, 'RGBA'); bb = img.getbbox(); img = img.crop(bb)
S = 1200; k = S * fill / max(img.size); img = img.resize((round(img.width * k), round(img.height * k)), Image.LANCZOS)
can = Image.new('RGBA', (S, S), (0, 0, 0, 0)); x, y = (S - img.width) // 2, (S - img.height) // 2; can.paste(img, (x, y), img)
can.save(dst, 'WEBP', quality=86, method=6)
print(dst, 'bbox%% x=%.1f y=%.1f w=%.1f h=%.1f' % (x / S * 100, y / S * 100, img.width / S * 100, img.height / S * 100))
