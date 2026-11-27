// Papiery fine art na /dla-fotografow. Ceny formatów biorą się z catalog.json (slug) – te same liczy serwer.
// Koszt papieru: centrumpapieru.pl, rola 44" (1118 mm), stan 27.11.2026 – cena wydruku proporcjonalna do Photo Rag Baryta.
// digi: papier, którego używamy do edycji Digigraphie® (lista Epson – potwierdzamy przy zamówieniu edycji).
export const PAPERS = [
  {
    slug: 'fine-art-bawelna', group: 'baryt', name: 'Hahnemühle Photo Rag Baryta', g: 315, base: '100% bawełna + baryt', surface: 'połysk barytowy', white: 'jasna biel', digi: true, star: true,
    lead: 'Najgłębsza czerń, jaką da się uzyskać w druku pigmentowym.',
    desc: 'Bawełniany papier muzealny z warstwą siarczanu baru – wygląda i pachnie jak klasyczna odbitka barytowa z ciemni, ale ma trwałość papieru bawełnianego. Lekki połysk daje bardzo szeroką tonalność, a czerń jest gęsta i aksamitna.',
    best: 'fotografia czarno-biała, portret, reportaż, edycje kolekcjonerskie',
  },
  {
    slug: 'fine-art-photo-rag', group: 'mat', name: 'Hahnemühle Photo Rag', g: 308, base: '100% bawełna', surface: 'gładki mat, delikatna struktura filcu', white: 'jasna biel', digi: true,
    lead: 'Najpopularniejszy papier fine art na świecie.',
    desc: 'Miękki, matowy papier bawełniany, na którym kolory są spokojne, a przejścia tonalne bardzo płynne. Nie odbija światła, więc dobrze wygląda w każdym oświetleniu i za szkłem. Uniwersalny wybór, gdy nie wiesz, od czego zacząć.',
    best: 'krajobraz, portret, reprodukcje, portfolio',
  },
  {
    slug: 'fine-art-rag-photographique', group: 'mat', name: 'Canson Infinity Rag Photographique', g: 310, base: '100% bawełna', surface: 'gładki mat', white: 'jasna biel', digi: true,
    lead: 'Gładki mat o bardzo wysokiej ostrości detalu.',
    desc: 'Papier bawełniany z francuskiej papierni Canson, z gładką, satynową w dotyku powierzchnią. Oddaje najdrobniejsze szczegóły i ma neutralny, jasny odcień – dobrze sprawdza się w fotografii architektury i przyrody, gdzie liczy się precyzja.',
    best: 'architektura, przyroda, fotografia produktowa, ilustracja',
  },
  {
    slug: 'fine-art-william-turner', group: 'faktura', name: 'Hahnemühle William Turner', g: 310, base: '100% bawełna', surface: 'wyraźna faktura papieru akwarelowego', white: 'naturalna biel, bez wybielaczy', digi: true,
    lead: 'Faktura prawdziwego papieru akwarelowego.',
    desc: 'Czerpany na sicie papier z wyraźną, ręcznie wyczuwalną strukturą, nazwany na cześć angielskiego malarza. Naturalna, ciepła biel bez rozjaśniaczy optycznych sprawia, że wydruk wygląda jak praca na papierze, a nie jak zdjęcie.',
    best: 'reprodukcje akwareli i rysunku, nastrojowy krajobraz, grafika artystyczna',
  },
  {
    slug: 'fine-art-german-etching', group: 'faktura', name: 'Hahnemühle German Etching', g: 310, base: 'alfa-celuloza, czerpany na sicie', surface: 'aksamitna faktura papieru graficznego', white: 'ciepła biel', digi: true,
    lead: 'Papier graficzny o aksamitnej fakturze.',
    desc: 'Klasyczny papier do grafiki warsztatowej, przygotowany do druku pigmentowego. Ma delikatną, regularną strukturę i ciepły ton – nadaje pracom charakter odbitki graficznej. Dobra cena przy papierze o tak szlachetnym wyglądzie.',
    best: 'reprodukcje grafik i obrazów, ilustracja, czarno-biała fotografia artystyczna',
  },
  {
    slug: 'fine-art-bfk-rives', group: 'faktura', name: 'Canson Infinity Arches BFK Rives', g: 310, base: '100% bawełna', surface: 'delikatna faktura', white: 'biel naturalna', digi: true,
    lead: 'Legendarny francuski papier grafików.',
    desc: 'BFK Rives od pokoleń służy artystom do litografii, akwaforty i sitodruku. W wersji do druku pigmentowego zachowuje miękką fakturę i matową głębię – świetnie oddaje reprodukcje prac na papierze i limitowane edycje.',
    best: 'reprodukcje grafiki warsztatowej, rysunku i pasteli, edycje artystyczne',
  },
  {
    slug: 'fine-art-baryta-photographique', group: 'baryt', name: 'Canson Infinity Baryta Photographique', g: 310, base: 'alfa-celuloza + baryt', surface: 'satyna barytowa', white: 'jasna biel', digi: true,
    lead: 'Satynowy baryt w przystępnej cenie.',
    desc: 'Papier z warstwą barytu o lekkim, satynowym połysku – daje mocną czerń i nasycony kolor, a jednocześnie mniej odbija światło niż pełny połysk. Bardzo dobry wybór na wystawę fotografii barwnej i czarno-białej.',
    best: 'wystawy, fotografia barwna i czarno-biała, portret',
  },
  {
    slug: 'fine-art-platine-fibre-rag', group: 'baryt', name: 'Canson Infinity Platine Fibre Rag', g: 310, base: '100% bawełna + baryt', surface: 'satyna', white: 'naturalna biel, bez wybielaczy', digi: true,
    lead: 'Wygląd odbitki platynowej na papierze bawełnianym.',
    desc: 'Bawełniany papier z barytem, inspirowany historycznymi odbitkami platynowo-palladowymi. Satynowa powierzchnia, ciepła naturalna biel i bardzo szeroki zakres tonalny – wybierają go fotografowie czarno-biali, którzy chcą klasycznego, muzealnego charakteru.',
    best: 'czarno-biała fotografia artystyczna, portret, edycje kolekcjonerskie',
  },
  {
    slug: 'fine-art-epson-cotton', group: 'mat', name: 'Epson Fine Art Cotton (Textured / Smooth)', g: 300, base: '100% bawełna', surface: 'faktura lub gładki mat', white: 'naturalna lub jasna biel', digi: true,
    lead: 'Bawełna od Epsona – najkorzystniejsza cena papieru muzealnego.',
    desc: 'Papier bawełniany produkowany dla Epson w wersji z fakturą (Textured) lub gładkiej (Smooth), w odcieniu naturalnym albo jasnym. Zaprojektowany razem z tuszami UltraChrome, na których drukujemy – daje przewidywalny, wierny kolor przy niższej cenie.',
    best: 'portfolio, wystawy, reprodukcje, większe nakłady edycji',
  },
  {
    slug: 'fine-art-imprime', group: 'mat', name: 'ImPrime Premium MC230 / 260 Bright White', g: 230, base: 'papier powlekany', surface: 'gładki mat', white: 'jasna biel', digi: false,
    lead: 'Matowy papier do plakatu, ilustracji i próbnych wydruków.',
    desc: 'Nie jest papierem bawełnianym, ale ma czystą biel, równą matową powierzchnię i dobrze trzyma kolor. Sprawdza się tam, gdzie liczy się cena: plakaty, ilustracje, prezentacje portfolio i próby kolorów przed drukiem na papierze muzealnym.',
    best: 'plakat, ilustracja, portfolio, wydruk próbny',
  },
];
export const GROUPS = [['mat', 'Matowe bawełniane'], ['faktura', 'Z fakturą – papiery artystyczne'], ['baryt', 'Barytowe – jak odbitka z ciemni']];
