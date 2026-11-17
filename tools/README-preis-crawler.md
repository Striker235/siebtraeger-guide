# Preis-Crawler und automatische Veröffentlichung

Stand 17.11.2026 (Pakete 17 und 15). Der Crawler misst täglich die Händlerpreise und baut die 30-Tage-Historie auf. Jeden Dienstag um 15:00 Uhr schreibt er den Deal-Check auf `/black-friday-siebtraeger` und die Preis-Marker der Preisseiten neu, prüft die Website und veröffentlicht sie auf Cloudflare Pages oder Netlify.

## Zeitplan

Alle Zeiten Europe/Berlin. GitHub stellt Sommer- und Winterzeit selbst um.

| Workflow | Datei | Wann | Was |
|---|---|---|---|
| Preise messen | `.github/workflows/preise-messen.yml` | täglich 05:17 Uhr | Preise abrufen, nur `data/preis-historie.json` schreiben und committen. Kein Veröffentlichen. |
| Preise veröffentlichen | `.github/workflows/preise-veroeffentlichen.yml` | dienstags 15:00 Uhr | abrufen, Seite schreiben, prüfen, committen, veröffentlichen, live prüfen |
| Preise Wächter | `.github/workflows/preise-waechter.yml` | dienstags 17:30 Uhr | Gibt es heute keinen erfolgreichen Veröffentlichungslauf, startet er ihn nach. |

GitHub kann geplante Läufe bei hoher Last verzögern oder auslassen. Dafür gibt es den Wächter. Alle drei lassen sich unter Actions auch von Hand starten (Run workflow).

## Ablauf am Dienstag

1. `tools/preis-crawler.py` ruft die Preise ab und schreibt `data/preise.json`, `data/preis-historie.json` und den Deal-Check-Block.
2. `tools/seiten-pruefen.py` prüft alle Seiten unter `src/`: UTF-8, LF, kein rohes geschütztes Leerzeichen, gültiges JSON-LD, interne Links ohne `.html`, Amazon-Links mit `tag=siebtraegergu-21`, Footer, kein „Testsieger“. Im Deal-Check: Prüfzeitpunkt und alle Preise wie in `data/preise.json`, Tags geschlossen, kein Amazon-Preis.
3. Commit ins Repository.
4. Veröffentlichen des Ordners `src/`, nur wenn Schritt 1 und 2 bestanden sind.
5. `tools/live-pruefen.py` ruft Startseite, `/preisvergleich` und `/black-friday-siebtraeger` ab und vergleicht Prüfzeitpunkt und Preise. Es versucht es bis zu 10-mal im Abstand von 30 Sekunden.
6. `tools/indexnow.py` meldet alle Seiten, deren `lastmod` in `src/sitemap.xml` auf heute steht, an IndexNow (Bing, Yandex, Seznam, Naver). Der Crawler setzt `lastmod` der Black-Friday-Seite auf den Prüftag, sobald sich ihr Deal-Check ändert. Google nutzt IndexNow nicht und liest die Sitemap.

Scheitert Schritt 1 oder 2, wird nichts veröffentlicht. Die Historie wird trotzdem committet, `data/preise.json` und die Seite bleiben auf dem letzten Stand, die Live-Seite auch. Jeder Fehler öffnet ein GitHub-Issue mit Link zum Log.

## Einrichten

1. Leg auf GitHub ein **privates** Repository an.
   In öffentlichen Repositorys schaltet GitHub Zeitpläne nach 60 Tagen ohne Aktivität ab.
2. Lade den Inhalt von `261117_SiebtraegerGuide_Repo_v14.zip` hoch, mit den Ordnern `.github`, `data`, `src` und `tools`.
   Das Website-ZIP `261117_SiebtraegerGuide_Kaffeefinder_v14.zip` enthält nur den Inhalt von `src/` und reicht für das Repository nicht.
   Auf dem Mac blendet der Finder `.github` aus. Mit Cmd+Umschalt+Punkt zeigst du ihn an.
   Die Workflow-Dateien müssen im Standard-Branch liegen.
3. Stell unter Settings › Actions › General „Read and write permissions“ ein.
4. Leg unter Settings › Secrets and variables › Actions die Zugänge an:

   | Art | Name | Wert |
   |---|---|---|
   | Variable | `DEPLOY_ZIEL` | `cloudflare` oder `netlify` |
   | Variable | `LIVE_URL` | `https://siebtraeger-guide.de` |
   | Secret | `CLOUDFLARE_API_TOKEN` | nur Cloudflare: API-Token mit „Cloudflare Pages: Edit“ |
   | Secret | `CLOUDFLARE_ACCOUNT_ID` | nur Cloudflare: Konto-ID |
   | Variable | `CF_PAGES_PROJEKT` | nur Cloudflare: Name des Pages-Projekts |
   | Secret | `NETLIFY_AUTH_TOKEN` | nur Netlify: Personal Access Token |
   | Variable | `NETLIFY_SITE_ID` | nur Netlify: Site-ID |
   | Secret | `AWIN_FEED_OTTO` | optional, siehe unten |

   CAUTION: Tokens und Feed-Adressen gehören nur in Secrets, nie in eine Datei im Repository.
5. Leg das Pages-Projekt (Cloudflare) oder die Site (Netlify) einmal als Direkt-Upload ohne Git-Anbindung an und verbinde die Domain.
   Cloudflare: Workers & Pages › Create › Pages › Upload assets (Direkt-Upload). Der Production-Branch muss `main` sein, weil der Workflow mit `--branch main` veröffentlicht.
   API-Token: My Profile › API Tokens › Create Token › Custom token, Berechtigung „Account › Cloudflare Pages › Edit“, nur für dein Konto.
6. Klick auf Actions › Preise veröffentlichen › Run workflow.
   Ergebnis: Der Lauf ist grün, es gibt einen Commit „Preise JJJJ-MM-TT“, und der Schritt „5. Live prüfen“ meldet „Live in Ordnung“.
7. Prüf im Browser, ob Adressen ohne `.html` funktionieren, zum Beispiel `/preisvergleich`, und ob die 404-Seite erscheint.

Für den ersten Lauf empfiehlt sich ein Test-Ziel: `LIVE_URL` auf die Vorschau-Adresse des Projekts setzen, Lauf starten, danach auf die echte Domain umstellen.

## Später aktualisieren

Der Preisverlauf wächst nur im Repository.

1. Ersetze nur die geänderten Dateien unter `src/`, `tools/` und bei Bedarf `data/preis-quellen.json`.
   CAUTION: Ersetze nie `data/preis-historie.json`. Sonst fehlen die Vortage für den Tiefstpreis der letzten 30 Tage.
2. Klick auf Actions › Preise veröffentlichen › Run workflow.

## OTTO über den Awin-Feed

Ob OTTO über Awin einen Produktfeed anbietet, ist nicht geprüft.

1. Erstell im Awin-Konto eine CSV-Feed-Adresse für OTTO (Programm 14336) mit den Spalten `ean`, `search_price` und `in_stock`.
2. Speicher die Adresse als Secret `AWIN_FEED_OTTO`.
3. Trag in `data/preis-quellen.json` bei jeder OTTO-Quelle die EAN als `feed_wert` ein.
4. Pass auf der Seite den Satz „Amazon und OTTO prüfen wir nicht automatisch“ an.

Heißen die Spalten anders, trag die Namen bei der Quelle als `feed_spalte`, `feed_preis` und `feed_lager` ein.

## Regeln des Crawlers

- robots.txt zuerst, mit eigenem User-Agent `SiebtraegerGuide-Preischeck/0.1 (+https://siebtraeger-guide.de)`, ausgewertet nach RFC 9309.
- Mindestens 10 Sekunden zwischen zwei Abrufen beim selben Shop. Umleitungen nur innerhalb desselben Shops.
- Preise nur aus JSON-LD-Angeboten oder dem Feed. Amazon erscheint nur als Link.
- Nicht lieferbare Angebote und ihre Links erscheinen nicht.
- Preise unter dem 0,5-Fachen oder über dem 1,6-Fachen von `preis_etwa` gelten als unplausibel und zählen nicht.

## Quellen pflegen

| Feld | Bedeutung |
|---|---|
| `url` | Produktseite, die der Crawler abruft |
| `ziel` | Linkziel ohne Abruf |
| `awin` | Awin-Programm-ID. Daraus entsteht der Partnerlink mit `clickref` `bf-<id>`. |
| `link` | Fester Link, zum Beispiel zu Amazon |
| `partner` | `false`: Link ohne Partnerprogramm und ohne Sternchen |
| `knopf` | Text auf dem Knopf, wenn er vom Shop-Namen abweicht |
| `name_muss`, `name_nicht` | Prüfen, ob das Produkt im JSON-LD das richtige ist |
| `preis_etwa` | Erwarteter Preis für die Plausibilitätsprüfung |
| `referenz` | Preis der Prüfung vor dem Start, zur Einordnung in den ersten 25 Tagen |

Ändere keine Produkt-IDs und Shop-Namen. Sie bilden den Schlüssel in `data/preis-historie.json`.

## Preis-Marker auf den Seiten

Der Crawler schreibt Preise nur zwischen Markern. Alles außerhalb bleibt byte-gleich.

| Marker | Ergebnis mit Preis | Ergebnis ohne Preis |
|---|---|---|
| `<!-- preis:ID -->…<!-- /preis -->` | `380,99&nbsp;€` | `derzeit nicht lieferbar` oder `Preis beim Händler prüfen` |
| `<!-- preis:ID:ab -->…<!-- /preis -->` | `ab&nbsp;380,99&nbsp;€` | wie oben |
| `<!-- preis:ID:shop -->…<!-- /preis -->` | `Geprüft bei roastmarket` | `Kein geprüfter Preis` |
| `<!-- preis-stand -->…<!-- /preis-stand -->` | Prüfdatum, z. B. `17.&nbsp;November 2026` | |

`derzeit nicht lieferbar` erscheint, wenn der Shop das Produkt als nicht lieferbar meldet; `Preis beim Händler prüfen`, wenn keine Quelle einen gültigen Preis liefert.

Außerdem:

- Karten mit `data-produkt="ID"` bekommen in `data-preis` den geprüften Preis (Sortierung). Ohne Preis bleibt der alte Wert stehen.
- Im JSON-LD setzt der Crawler das Offer (`{"@type":"Offer","price":"380.99","priceCurrency":"EUR"}`) für jedes Produkt, das die Seite unter `ld` nennt. Ohne Preis entfernt er das Offer.
- Ändert sich eine Seite, setzt er `dateModified`, `article:modified_time` und `lastmod` in `src/sitemap.xml` auf den Prüftag.
- Er baut zuerst alle Seiten. Fehlt eine ID oder ein JSON-LD-Produkt, bricht er ab, bevor eine Seite geschrieben ist.

Die Seiten stehen in `data/preis-quellen.json` unter `preisseiten`:

```
"preisseiten": [
  {"datei": "src/muehlen.html", "ld": {"Eureka Mignon Specialità": "muehlen-mignon-specialita"}}
]
```

`datei` ist der Pfad ab Projektwurzel, `ld` ordnet den Produktnamen im JSON-LD der Produkt-ID zu. Seiten ohne Preise (Ratgeber, Vergleiche ohne Preisangabe) dürfen keine Marker enthalten; `seiten-pruefen.py` meldet das als Fehler.

Marker gehören in Tabellen und Karten, nicht in Fließtext. Ein Satz wie „Für ab Preis beim Händler prüfen bekommt man …“ ergibt ohne Preis keinen Sinn. Fließtext nennt deshalb keine Tagespreise, sondern Preisklassen oder verweist auf die Tabelle.

Neue Preisseite einbauen:

1. Marker um die Preise setzen, `<!-- preis-stand -->` um das Prüfdatum, `data-produkt` an die Karten.
2. Seite unter `preisseiten` eintragen.
3. `python3 tools/preis-crawler.py --nur-seite` und danach `python3 tools/seiten-pruefen.py`.

## Lokal testen

Python 3.9 oder neuer, ohne Zusatzpakete:

```
python3 tools/preis-crawler.py --trocken        # abrufen und anzeigen, nichts schreiben
python3 tools/preis-crawler.py --nur-historie   # abrufen, nur die Historie schreiben
python3 tools/preis-crawler.py --nur-seite      # Seite aus vorhandenen Daten neu bauen
python3 tools/preis-crawler.py                  # abrufen, Daten und Seite schreiben
python3 tools/seiten-pruefen.py                 # Seiten vor dem Veröffentlichen prüfen
LIVE_URL=https://siebtraeger-guide.de python3 tools/live-pruefen.py
python3 tools/indexnow.py --trocken             # zeigen, welche Seiten gemeldet würden
python3 tools/indexnow.py --alle                # einmalig alle Seiten melden, z. B. nach dem ersten Livegang
```

## Rückgabewerte

- `preis-crawler.py`: 0 in Ordnung. 2: Weniger als die Hälfte der geprüften Quellen lieferte ein Ergebnis. Die Ergebnisse kommen in die Historie, `data/preise.json` und die Seite bleiben auf dem letzten Stand.
- `seiten-pruefen.py`: 0 in Ordnung, 1 mindestens ein Fehler.
- `live-pruefen.py`: 0 live wie erwartet, 1 Abweichung nach dem letzten Versuch.
- `indexnow.py`: 0 gemeldet (HTTP 200 oder 202) oder nichts zu melden, 1 abgelehnt oder nicht erreichbar. HTTP 403 heißt meist: Die Schlüsseldatei `src/c8ecc0720d8d70e5deeff391397f2672.txt` ist live noch nicht erreichbar.

Das Crawler-Log nennt den Status jeder Quelle: `ok`, `nicht lieferbar`, `kein Preis`, `unplausibel`, `robots` oder `fehler`.

## Geprüft und nicht geprüft

Geprüft am 17.11.2026: Die drei Workflows bestehen actionlint 1.7.12. `seiten-pruefen.py` meldet auf dem Stand v14 0 Fehler und findet 5 von 5 absichtlich eingebauten Fehlern sowie 4 von 4 Marker-Fehlern. `--nur-historie` ändert in einem Offline-Test nur die Historie. `--nur-seite` erzeugt die Prüfzeile ohne Mittelpunkt, bytegleich mit der Seite. Ein echter Lauf am 17.11. um 11:43 lieferte für 19 von 20 Quellen ein Ergebnis und schrieb 11 Preisseiten.

Nicht getestet:

- Die Workflows auf GitHub, das Veröffentlichen auf Cloudflare Pages oder Netlify und `live-pruefen.py` gegen eine echte Adresse. Dafür fehlen Repository und Zugänge.
- Abrufe von GitHub-Rechnern aus. Shops können sie anders behandeln als die Testabrufe vom 22.10.
- Der Awin-Feed. Der Feed-Weg ist nur mit einer Testdatei geprüft.
- Ob Cloudflare Pages oder Netlify Adressen ohne `.html` ohne weitere Einstellung ausliefern. Bitte nach dem ersten Lauf prüfen (Einrichten, Schritt 7).

Der Workflow pflegt den Deal-Check auf `/black-friday-siebtraeger` und die 11 Preisseiten aus `preisseiten`: Startseite, `/kaufberatung`, `/muehlen`, `/preisvergleich`, die drei Vergleichsseiten und die vier Erfahrungsberichte. Er committet alle Änderungen unter `src/`. `/zubehoer` nennt keine Preise.
