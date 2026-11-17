#!/usr/bin/env python3
"""Prüft nach dem Veröffentlichen die Live-Website.

Nur Python-Standardbibliothek. Aufruf:
  python3 tools/live-pruefen.py

Adresse aus der Umgebungsvariable LIVE_URL, sonst https://siebtraeger-guide.de.
Geprüft werden drei Seiten: Startseite, /preisvergleich und
/black-friday-siebtraeger. Jede muss mit HTTP 200 antworten und den Footer
enthalten. Die Black-Friday-Seite muss den Prüfzeitpunkt und alle geprüften
Preise aus data/preise.json zeigen.

Das CDN braucht nach dem Hochladen etwas Zeit. Darum versucht das Programm es
bis zu 10-mal im Abstand von 30 Sekunden.

Rückgabewert 0: live wie erwartet. 1: Abweichung nach dem letzten Versuch.
"""

import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PREISE = ROOT / "data" / "preise.json"
BASIS = os.environ.get("LIVE_URL", "https://siebtraeger-guide.de").rstrip("/")
SEITEN = ["/", "/preisvergleich", "/black-friday-siebtraeger"]
# Diese Dateien liegen im Repository, dürfen aber nicht auf der Website erscheinen (nur src/ wird veröffentlicht).
PRIVAT = ["/tools/preis-crawler.py", "/data/preise.json", "/.github/workflows/preise-veroeffentlichen.yml",
          "/wrangler.jsonc"]
AGENT = "SiebtraegerGuide-Livecheck/0.1 (+https://siebtraeger-guide.de)"
VERSUCHE = 10
PAUSE = 30


def euro(wert):
    """Wie im Crawler: 1.234,56&nbsp;€"""
    text = f"{wert:,.2f}".replace(",", "#").replace(".", ",").replace("#", ".")
    return f"{text}&nbsp;€"


def holen(pfad):
    url = f"{BASIS}{pfad}?livecheck={int(time.time())}"
    anfrage = urllib.request.Request(url, headers={"User-Agent": AGENT, "Cache-Control": "no-cache"})
    try:
        with urllib.request.urlopen(anfrage, timeout=30) as antwort:
            return antwort.status, antwort.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as fehler:
        return fehler.code, ""
    except (urllib.error.URLError, TimeoutError) as fehler:
        return 0, str(fehler)


def durchgang(preise):
    probleme = []
    for pfad in SEITEN:
        status, text = holen(pfad)
        if status != 200:
            probleme.append(f"{pfad}: HTTP {status}")
            continue
        if 'class="site-foot"' not in text:
            probleme.append(f"{pfad}: Footer fehlt")
        if pfad == "/black-friday-siebtraeger":
            if f'datetime="{preise["geprueft"]}"' not in text:
                probleme.append(f"{pfad}: Prüfzeitpunkt {preise['geprueft']} fehlt")
            for produkt, eintrag in preise["produkte"].items():
                preis = eintrag.get("bester_preis")
                if preis is not None and euro(preis) not in text:
                    probleme.append(f"{pfad}: Preis {euro(preis)} für {produkt} fehlt")
    for pfad in PRIVAT:
        status, _ = holen(pfad)
        if status == 200:
            probleme.append(f"{pfad}: öffentlich abrufbar (HTTP 200), veröffentlicht wird mehr als src/")
    return probleme


def main():
    preise = json.loads(PREISE.read_text(encoding="utf-8"))
    for versuch in range(1, VERSUCHE + 1):
        probleme = durchgang(preise)
        if not probleme:
            print(f"Live in Ordnung ({BASIS}, Versuch {versuch})", flush=True)
            return 0
        print(f"Versuch {versuch}: {len(probleme)} Abweichungen", flush=True)
        if versuch < VERSUCHE:
            time.sleep(PAUSE)
    for problem in probleme:
        print(f"FEHLER {problem}", flush=True)
    return 1


if __name__ == "__main__":
    sys.exit(main())
