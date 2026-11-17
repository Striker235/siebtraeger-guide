#!/usr/bin/env python3
"""Meldet geänderte Seiten über IndexNow (Bing, Yandex, Seznam, Naver u. a.).

Nur Python-Standardbibliothek. Aufruf:
  python3 tools/indexnow.py             Seiten mit lastmod = heute (Europe/Berlin) melden
  python3 tools/indexnow.py --alle      alle Seiten aus src/sitemap.xml melden
  python3 tools/indexnow.py --trocken   nur anzeigen, nichts senden

Der Schlüssel steht in der Datei src/<schlüssel>.txt und wird mit der Website
veröffentlicht. Er ist absichtlich öffentlich: Die Suchmaschine prüft über diese
Datei, dass die Meldung von der Website selbst kommt.

Google nutzt IndexNow nicht. Für Google genügen die Sitemap und lastmod.

Rückgabewert 0: gemeldet (HTTP 200 oder 202) oder nichts zu melden.
1: Meldung abgelehnt oder nicht erreichbar.
"""

import argparse
import datetime as dt
import json
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
HOST = "siebtraeger-guide.de"
ENDPUNKT = "https://api.indexnow.org/indexnow"
SCHLUESSEL_RE = re.compile(r"^[a-f0-9]{32}\.txt$")
EINTRAG_RE = re.compile(r"<loc>(https://siebtraeger-guide\.de/[^<]*)</loc><lastmod>([0-9-]+)</lastmod>")
ANTWORTEN = {
    400: "ungültige Anfrage",
    403: "Schlüssel ungültig oder Schlüsseldatei nicht erreichbar",
    422: "Adressen passen nicht zum Host oder zum Schlüssel",
    429: "zu viele Anfragen",
}


def schluessel():
    dateien = [pfad for pfad in SRC.iterdir() if SCHLUESSEL_RE.match(pfad.name)]
    if len(dateien) != 1:
        raise SystemExit(f"Genau eine Schlüsseldatei src/<32 Hex-Zeichen>.txt erwartet, gefunden: {len(dateien)}")
    wert = dateien[0].read_text(encoding="utf-8").strip()
    if wert != dateien[0].stem:
        raise SystemExit(f"{dateien[0].name}: Inhalt muss gleich dem Dateinamen ohne .txt sein")
    return wert


def main():
    argumente = argparse.ArgumentParser(description="Geänderte Seiten über IndexNow melden")
    argumente.add_argument("--alle", action="store_true", help="alle Seiten aus der Sitemap melden")
    argumente.add_argument("--trocken", action="store_true", help="nur anzeigen, nichts senden")
    args = argumente.parse_args()
    key = schluessel()
    eintraege = EINTRAG_RE.findall((SRC / "sitemap.xml").read_text(encoding="utf-8"))
    heute = dt.datetime.now(ZoneInfo("Europe/Berlin")).date().isoformat()
    adressen = [loc for loc, lastmod in eintraege if args.alle or lastmod == heute]
    if not adressen:
        print(f"Keine Seite mit lastmod {heute}, nichts zu melden", flush=True)
        return 0
    daten = {
        "host": HOST,
        "key": key,
        "keyLocation": f"https://{HOST}/{key}.txt",
        "urlList": adressen,
    }
    print(f"{len(adressen)} Adressen: " + ", ".join(adressen), flush=True)
    if args.trocken:
        print(json.dumps(daten, ensure_ascii=False, indent=1), flush=True)
        return 0
    anfrage = urllib.request.Request(
        ENDPUNKT, data=json.dumps(daten).encode("utf-8"), method="POST",
        headers={"Content-Type": "application/json; charset=utf-8"})
    try:
        with urllib.request.urlopen(anfrage, timeout=30) as antwort:
            status = antwort.status
    except urllib.error.HTTPError as fehler:
        status = fehler.code
    except (urllib.error.URLError, TimeoutError) as fehler:
        print(f"FEHLER IndexNow nicht erreichbar: {fehler}", flush=True)
        return 1
    if status in (200, 202):
        print(f"IndexNow: HTTP {status}, gemeldet", flush=True)
        return 0
    print(f"FEHLER IndexNow: HTTP {status} ({ANTWORTEN.get(status, 'unbekannt')})", flush=True)
    return 1


if __name__ == "__main__":
    sys.exit(main())
