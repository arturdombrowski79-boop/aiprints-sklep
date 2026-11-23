// Wysyłanie plików klienta do zamówienia: kawałki po 4 MB, wznawianie po przerwie, postęp.
const CH = 4 * 1048576;
export async function sendFiles(no, t, groups, onProgress) {
  // groups: [{ i: indeks pozycji albo -1, files: [File] }]
  const all = groups.flatMap((g) => g.files.map((f) => ({ i: g.i, f })));
  const total = all.reduce((a, x) => a + x.f.size, 0) || 1; let sent = 0; const errors = [];
  for (const { i, f } of all) {
    let off = 0, tries = 0;
    while (off < f.size) {
      const q = new URLSearchParams({ no, t, i: String(i), name: f.name, size: String(f.size), off: String(off) });
      try {
        const r = await fetch('api/upload.php?' + q, { method: 'POST', body: f.slice(off, off + CH) });
        const j = await r.json();
        if (!r.ok || j.error) { errors.push(`${f.name}: ${j.error || 'błąd ' + r.status}`); break; }
        sent += j.have - off; off = j.have; tries = 0;
        onProgress && onProgress(sent / total, f.name);
        if (j.done) break;
      } catch (e) { if (++tries > 5) { errors.push(`${f.name}: brak połączenia`); break; } await new Promise((ok) => setTimeout(ok, 2000 * tries)); }
    }
  }
  try { await fetch('api/upload.php?' + new URLSearchParams({ no, t, done: '1' }), { method: 'POST' }); } catch (e) { }
  return { errors, count: all.length - errors.length };
}
export const listFiles = async (no, t) => { try { return (await (await fetch('api/upload.php?' + new URLSearchParams({ no, t }), { cache: 'no-store' })).json()).files || []; } catch (e) { return []; } };
