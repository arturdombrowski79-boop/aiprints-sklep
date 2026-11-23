// Eksport szablonów do emails/*.html dla backendu (PHP): pola {{…}} zamienia serwer, blok {{#items}} powtarza dla pozycji.
import { TEMPLATES, layout, SAMPLE } from '../src/data/emails.js';
import { writeFileSync, mkdirSync } from 'fs';
const B = new URL('..', import.meta.url).pathname; const DIR = process.argv[2] || B + 'emails'; mkdirSync(DIR, { recursive: true });
const ph = Object.fromEntries(Object.keys(SAMPLE).map((k) => [k, `{{${k}}}`]));
const d = { ...ph, __tpl: true, nip: '', ship: '{{ship}}', total: '{{total}}', disc: '{{disc}}', items: [{ title: '{{item.title}}', lines: ['{{item.lines}}'], qty: '{{item.qty}}', price: '{{item.price}}', sum: '{{item.sum}}', persHtml: '{{item.pers}}' }] };
let idx = '# Szablony maili AiPrints.pl\n\nNadawca: zamowienia@aiprints.pl · Reply-To: kontakt@aiprints.pl · kopia do archiwum.\nPola {{…}} uzupełnia backend. Źródło: src/data/emails.js (podgląd: panel → Maile do klientów).\n\n';
for (const [id, t] of Object.entries(TEMPLATES)) {
  writeFileSync(`${DIR}/${id}.html`, layout({ title: t.subject(d), pre: t.name, body: t.body(d) }));
  idx += `- **${id}.html** – ${t.name} (${t.when}). Temat: „${t.subject(d)}”${t.attach ? '. Załączniki: ' + t.attach.join('; ') : ''}\n`;
}
writeFileSync(DIR + '/README.md', idx); console.log('emails:', Object.keys(TEMPLATES).length);
