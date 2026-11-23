// Czy pozycja zmieści się w paczkomacie InPost (gabaryt C: 41 × 38 × 64 cm)?
// Wydruki zwijane (banery, fototapety, plakaty) mieszczą się, gdy krótszy bok ≤ 60 cm (rolka w tubie).
// Sztywne płyty i ramy – gdy dłuższy bok ≤ 60 cm. Ta sama reguła jest w api/lib.php (too_big).
export const RIGID = ['tablica-pcv-dibond', 'wydruk-wystawowy', 'wydruk-w-ramie', 'tablica-ogloszen', 'tablica-wejscie-zarzadca', 'tablica-dla-rodzicow', 'tablica-urzedowa-szkola', 'regulamin-porzadku'];
export const ALWAYS = ['potykacz-a1', 'baner-rekrutacja', 'plakaty-edukacyjne', 'pakiet-budynek', 'grafika-drzwi-wejsciowe', 'naklejki-podlogowe-gry', 'postacie-zagladajace-drzwi'];
export const LOCKER_MAX = 60;
const ISO = { A2: [42, 59.4], A1: [59.4, 84.1], A0: [84.1, 118.9], B1: [70, 100], B0: [100, 141] };
export function dimsOf(i) {
  if (i.w && i.h) return [+i.w, +i.h];
  const o = String(i.opt || ''); const m = o.match(/(\d+(?:[.,]\d+)?)\s*×\s*(\d+(?:[.,]\d+)?)/);
  if (m) return [parseFloat(m[1].replace(',', '.')), parseFloat(m[2].replace(',', '.'))];
  const k = (o.match(/\b(A[0-2]|B[01])\b/) || [])[1]; return k ? ISO[k] : null;
}
export function tooBig(i) {
  if (ALWAYS.includes(i.slug)) return true;
  const d = dimsOf(i); if (!d) return false;
  return RIGID.includes(i.slug) ? Math.max(...d) > LOCKER_MAX : Math.min(...d) > LOCKER_MAX;
}
