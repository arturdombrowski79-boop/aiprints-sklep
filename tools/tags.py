import re
# Filtry w stylu sklepów z prezentami: okazja, dla kogo, rodzaj personalizacji, materiał
OKAZJE = [
 ('Urodziny', [
  ('urodziny', 'Urodziny', r'nadrukiem|naszyjnik|bransolet|krysztal-zdjecie|krysztal-pupil|swieca|poduszka|akryl-|zdjecie-na|lupek|etui|puzzle|litofania|szklo-ramka|kieliszki|karafka|whisky|kufel|deska|niesmiertelnik|brelok|kubek|tumbler|okladka|portret|mapa|obraz|fotopanel|odbitki|magnesy|plakat|kliker|smok|bidon|ksiazeczka|dioram|szkielet|pupil-figurka|fine-art|skrzynka-wino|butelka'),
  ('okragle-urodziny', '18, 30, 40, 50 urodziny', r'krysztal-zdjecie|okladka|akryl-piosenka|akryl-plakat|karafka|whisky|kieliszki|mapa-nieba|fotoksiazka|butelka|naszyjnik|bransolet|statuetka-krysztal'),
 ]),
 ('Śluby i rocznice', [
  ('slub', 'Ślub i wesele', r'slub|wesel|winietki|numery-stol|plan-stolow|tablica-witamy|tablica-inicjaly|tablica-powitalna|ksiega-gosci|zaproszenia|topper|maz-zona|koperty|inicjaly-scianka|podziekowania|kieliszki'),
  ('rocznica', 'Rocznica', r'krysztal-zdjecie|krysztal-slub|krysztal-pamiatkowy|mapa-nieba|mapa-poznalismy|nasza-data|piosenka|kieliszki|puzzle-akryl|akryl-bilet|akryl-polaroid|akryl-plakat|okladka|poduszka|litofania|fotoksiazka|swieca'),
  ('walentynki', 'Walentynki', r'naszyjnik|bransolet|krysztal-zdjecie|mapa-nieba|mapa-poznalismy|nasza-data|piosenka|puzzle-akryl|akryl-polaroid|swieca|poduszka|litofania|kieliszki|akryl-led'),
  ('podziekowania', 'Podziękowania dla rodziców', r'podziekowania|krysztal-pamiatkowy|krysztal-zdjecie|statuetka-krysztal|kieliszki'),
 ]),
 ('Chrzty i Komunie', [
  ('komunia', 'Komunia', r'komuni|ihs|medalik'),
  ('chrzest', 'Chrzest i narodziny', r'inicjal|ksiazeczka|naklejki-scienne|nauka-imienia|puzzle-imie|lamibook|krysztal-pamiatkowy|ihs|medalik'),
 ]),
 ('Święta w kalendarzu', [
  ('dzien-mamy', 'Dzień Mamy', r'naszyjnik|bransolet|krysztal-zdjecie|swieca|poduszka|zdjecie-na|lupek|litofania|szklo-ramka|deska|akryl-led|fotoksiazka|odbitki|magnesy|tumbler'),
  ('dzien-taty', 'Dzień Ojca', r'karafka|whisky|kufel|deska|niesmiertelnik|brelok-drewno|tablica-rejestracyjna|kubek-termiczny|etui-grawer|portfel'),
  ('dzien-babci', 'Dzień Babci i Dziadka', r'krysztal-zdjecie|poduszka|zdjecie-na|lupek|litofania|szklo-ramka|fotoksiazka|kalendarz|magnesy|puzzle-zdjecie|obraz|deska'),
  ('dzien-dziecka', 'Dzień Dziecka', r'bidon|ksiazeczka|nauka-imienia|smok|kliker|puzzle-imie|brelok-3d|ruchomy|dioram|lamibook|inicjal|naklejki-scienne'),
  ('koniec-roku', 'Dzień Nauczyciela i koniec roku', r'dyplom|medale|dlugopisy|statuetka|kubek-termiczny|brelok'),
 ]),
 ('Inne okazje', [
  ('nowy-dom', 'Nowy dom i parapetówka', r'numer-domu|tabliczka-adres|deska|napis-scienny|tabliczka-drzwi|zegar|jelen|mapa-miasta|plakat-mapa|fototapeta|podkladki|wycieraczk'),
  ('pamiatka', 'Pamiątka i upamiętnienie', r'znicz|krysztal-pamiatkowy|krysztal-pupil|litofania|lupek|portret-pupila|pupil-figurka|fotoksiazka|odbitki'),
  ('firma', 'Dla firmy i klientów', r'.'),
 ]),
]
DLA = [
 ('Rodzina', [
  ('mama', 'Mamy', r'kubek-z-nadrukiem|naszyjnik|bransolet|krysztal-zdjecie|swieca|poduszka|zdjecie-na|lupek|litofania|szklo-ramka|akryl-led|fotoksiazka|tumbler|deska'),
  ('tata', 'Taty', r'kubek-z-nadrukiem|koszulka-z|karafka|whisky|kufel|deska|niesmiertelnik|brelok-drewno|tablica-rejestracyjna|kubek-termiczny|etui-grawer'),
  ('babcia-dziadek', 'Babci i dziadka', r'krysztal-zdjecie|poduszka|zdjecie-na|lupek|litofania|szklo-ramka|fotoksiazka|kalendarz|magnesy|obraz|puzzle-zdjecie'),
  ('dziecko', 'Dziecka', r'inicjal|bidon|ksiazeczka|nauka-imienia|naklejki-scienne|lamibook|smok|kliker|puzzle-imie|brelok-3d|figurka|ruchomy|dioram|kalendarz-adwentowy'),
 ]),
 ('Ukochani i przyjaciele', [
  ('dla-niej', 'Dla niej', r'naszyjnik|bransolet|krysztal-zdjecie|swieca|poduszka|akryl-piosenka|akryl-polaroid|zdjecie-na|lupek|etui-telefon|puzzle-akryl|litofania|szklo-ramka|kieliszki|tumbler'),
  ('dla-niego', 'Dla niego', r'kufel|whisky|karafka|deska|brelok-drewno|niesmiertelnik|tablica-rejestracyjna|etui-grawer|kubek-termiczny|skrzynka-wino|okleiny'),
  ('para', 'Dla pary', r'krysztal-zdjecie|krysztal-slub|mapa-nieba|mapa-poznalismy|nasza-data|piosenka|kieliszki|puzzle-akryl|maz-zona|okladka|akryl-bilet|akryl-plakat'),
  ('przyjaciel', 'Przyjaciółki i przyjaciela', r'nadrukiem|akryl-polaroid|odbitki|magnesy|brelok|kubek|tumbler|swieca|okladka|puzzle-zdjecie|etui'),
 ]),
 ('Okolicznościowe', [
  ('nauczyciel', 'Nauczyciela', r'dyplom|dlugopisy|kubek-termiczny|statuetka|deska|brelok-drewno'),
  ('goscie', 'Gości weselnych', r'winietki|medalik|brelok|magnesy|podziekowania'),
  ('pracownik', 'Pracownika i klienta', r'nadrukiem|statuetka|dlugopisy|notesy|kubek-termiczny|termos|pudelko-grawer|skrzynka-wino|kartka-drewniana|breloki|medale|dyplom'),
 ]),
 ('Z pasją', [
  ('psiarze', 'Miłośników psów', r'psa|pupil|adresowka'),
  ('kociarze', 'Miłośników kotów', r'pupil|portret-pupila'),
  ('kierowca', 'Kierowcy i motocyklisty', r'tablica-rejestracyjna|brelok|okleiny'),
  ('kuchnia', 'Kucharza i grillmistrza', r'deska|podkladki|kufel'),
  ('wino', 'Miłośnika wina i whisky', r'karafka|whisky|kieliszki|skrzynka-wino|butelka'),
 ]),
]
PERS = [
 ('zdjecie', 'Ze zdjęciem', r'nadrukiem|zdjec|foto|polaroid|puzzle-zdjecie|puzzle-akryl|obraz|litofan|portret|okladka|plakat-filmowy|magnes|fototapet|bilet|etui-telefon|krysztal|kalendarz|pupil-figurka|znicz|lupek|poduszka|akryl-led|akryl-blok|akryl-obrys|odbitki|fine-art|nasza-data|bombka-zdjecie|ksiazeczka'),
 ('grawer', 'Z grawerem', r'grawer|deska|karafka|whisky|kieliszki|kufel|naszyjnik|bransolet|niesmiertelnik|adresowka|lupek|brelok-drewno|pudelko|skrzynka|podkladki|dyplom|medal|kartka-drewniana|etui-grawer|plakietki-qr-grawer|bombka-dab|swieca|termos|kubek-termiczny|dlugopisy|krysztal'),
 ('imie', 'Z imieniem lub tekstem', r'.'),
 ('logo', 'Z logo firmy', r'nadrukiem|logo|szyld|witryna|wizytowk|ulotki|vouchery|bony|rollup|banery|naklejki|folia|statuetka|termos|dlugopisy|notesy|pudelko|skrzynka|breloki|stojak|tabliczka-scienna|plakietki|lusterko|cennik|pakiet|karty-stalego|butelka|zegar-z-logo|kartka-drewniana|certyfikaty|terminarzyki'),
]
MAT = [
 ('drewno', 'Drewno i sklejka', r'drewn|deska|sklejk|dab|jelen|napis-scienny|inicjal|puzzle-imie|nauka-imienia|pudelko|skrzynka|podkladki|dyplom|kartka-drewniana|koperta|maz-zona|inicjaly-scianka|numery-stol-podstawka|zegar'),
 ('szklo', 'Szkło i kryształ', r'kryszt|szklank|whisky|karafka|kieliszki|kufel|szklo|swieca|statuetka-krysztal|znicz'),
 ('akryl', 'Akryl, plexi i lustro', r'akryl|plexi|lustr|winietki|topper|ihs-litery|logo-na|szyld-okragly|numery-stol-lustro|tablica-|plan-stolow|ksiega-gosci|napis-recepcja|tabliczk|wizytownik|cennik|dekoracje|podziekowania|stojak|statuetka-3'),
 ('metal', 'Metal i stal', r'naszyjnik|bransolet|niesmiertelnik|adresowka|medal|termos|kubek-termiczny|tumbler|bidon|dlugopisy|fotopanel|plakietki-qr-grawer|dystanse|numer-domu|etui-grawer|lusterko'),
 ('druk', 'Druk, papier i folia', r'nadrukiem|druk|plakat|kalendarz|fotoksiazka|odbitki|wizytowk|ulotki|voucher|bony|certyfikat|skrypt|notesy|terminarzyki|karty-stalego|naklejk|foli|okleiny|fototapet|obraz|banery|rollup|magnesy|puzzle-zdjecie|ksiazeczka|lamibook|regulamin|witryna|godziny|lokal|pchac|piktogram|zaproszenia|poduszka|okladka|portret|mapa-nieba|fine-art'),
 ('3d', 'Druk 3D', r'3d|flexi|smok|figurk|kliker|szkielet|dioram|litofan|choinka|balwanek|breloki-klub|kalendarz-adwentowy'),
]
FIRMA_CATS = {'dla-firm', 'salony-beauty', 'wspolnoty-i-spoldzielnie'}

def tag(p):
    s = p['slug'] + ' ' + p['name'].lower()
    b2b = p['cat'] in FIRMA_CATS
    out = {'okazja': [], 'dla': [], 'pers': [], 'mat': []}
    for _, opts in OKAZJE:
        for k, _, rx in opts:
            if k == 'firma':
                if b2b or re.search(r'nadrukiem|statuetka|dlugopisy|notesy|termos|pudelko-grawer|kartka-drewniana|skrzynka-wino|breloki-klub|medale|dyplom', s): out['okazja'].append(k)
            elif not b2b and re.search(rx, s): out['okazja'].append(k)
    for _, opts in DLA:
        for k, _, rx in opts:
            if (not b2b or k == 'pracownik') and re.search(rx, s): out['dla'].append(k)
    for k, _, rx in PERS:
        if k == 'imie':
            if 'text' in (p.get('fields') or []) or not b2b: out['pers'].append(k)
        elif k == 'logo':
            if b2b or re.search(rx, s): out['pers'].append(k)
        elif re.search(rx, s): out['pers'].append(k)
    for k, _, rx in MAT:
        if re.search(rx, s): out['mat'].append(k)
    if not out['mat'] and re.search('Bambu', p.get('machine') or ''): out['mat'].append('3d')
    return out

def facets():
    return {'okazja': [(g, [(k, n) for k, n, _ in o]) for g, o in OKAZJE],
            'dla': [(g, [(k, n) for k, n, _ in o]) for g, o in DLA],
            'pers': [(k, n) for k, n, _ in PERS], 'mat': [(k, n) for k, n, _ in MAT]}
