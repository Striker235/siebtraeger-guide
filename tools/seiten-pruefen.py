#!/usr/bin/env python3
"""Prüft die Website vor dem Veröffentlichen.

Nur Python-Standardbibliothek. Aufruf:
  python3 tools/seiten-pruefen.py

Geprüft werden alle .html-Dateien unter src/:
- UTF-8, LF, Zeilenumbruch am Dateiende, keine Leerzeichen am Zeilenende,
  kein rohes geschütztes Leerzeichen (U+00A0, im Quelltext steht &nbsp;)
- jeder JSON-LD-Block ist gültiges JSON
- interne Links ohne .html, Amazon-Links mit Partner-Tag
- Footer vorhanden, kein „Testsieger“

Dazu der Deal-Check auf /black-friday-siebtraeger gegen data/preise.json:
- Marker genau einmal, Tags im Block geschlossen
- Prüfzeitpunkt und alle geprüften Preise stehen im Block
- kein Amazon-Preis, kein Mittelpunkt in der Prüfzeile

Dazu src/sitemap.xml: gültiges XML, jede Adresse hat eine Seite, keine
noindex-Seite, lastmod gleich dateModified der Seite.

Dazu die Preisseiten aus data/preis-quellen.json ("preisseiten"): jeder
Preis-Marker gleich mit data/preise.json, Prüfdatum gleich, JSON-LD-Offer
gleich mit dem geprüften Preis (ohne Preis kein Offer). Auf Seiten, die
nicht in der Liste stehen, gibt es keine Preis-Marker.

Rückgabewert 0: alles in Ordnung. 1: mindestens ein Fehler, nicht veröffentlichen.
"""

import html.parser
import json
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
SEITE = SRC / "black-friday-siebtraeger.html"
PREISE = ROOT / "data" / "preise.json"
QUELLEN = ROOT / "data" / "preis-quellen.json"
START = "<!-- DEAL-CHECK:START -->"
ENDE = "<!-- DEAL-CHECK:END -->"
MARKER_RE = re.compile(r"<!-- preis:([a-z0-9-]+)(?::(ab|shop))? -->(.*?)<!-- /preis -->")
STAND_RE = re.compile(r"<!-- preis-stand -->(.*?)<!-- /preis-stand -->")
MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September",
          "Oktober", "November", "Dezember"]
AMAZON_TAG = "tag=siebtraegergu-21"
LEER = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}
LD_RE = re.compile(r"<script\b[^>]*application/ld\+json[^>]*>(.*?)</script\s*>", re.S | re.I)
HREF_RE = re.compile(r'\bhref="([^"]*)"')
REF_RE = re.compile(r'\b(?:href|src)="([^"]*)"')

fehler = []


def melden(datei, text):
    fehler.append(f"{datei}: {text}")


def euro(wert):
    """Wie im Crawler: 1.234,56&nbsp;€"""
    text = f"{wert:,.2f}".replace(",", "#").replace(".", ",").replace("#", ".")
    return f"{text}&nbsp;€"


def soll_marker(eintrag, art):
    """Wie im Crawler: erwarteter Text eines Preis-Markers."""
    preis = eintrag.get("bester_preis")
    if art == "shop":
        return f'Geprüft bei {eintrag["bester_shop"]}' if preis is not None else "Kein geprüfter Preis"
    if preis is None:
        weg = any(a.get("status") == "nicht lieferbar" for a in eintrag.get("angebote", []))
        return "derzeit nicht lieferbar" if weg else "Preis beim Händler prüfen"
    return ("ab&nbsp;" if art == "ab" else "") + euro(preis)


def preisseiten_pruefen():
    cfg = json.loads(QUELLEN.read_text(encoding="utf-8"))
    preise = json.loads(PREISE.read_text(encoding="utf-8"))
    produkte = preise["produkte"]
    jahr, monat, tag = preise["geprueft"][:10].split("-")
    stand = f"{int(tag)}.&nbsp;{MONATE[int(monat) - 1]} {jahr}"
    liste = {seite["datei"]: seite for seite in cfg.get("preisseiten", [])}
    for pfad in sorted(SRC.rglob("*.html")):
        name = pfad.relative_to(ROOT).as_posix()
        text = pfad.read_text(encoding="utf-8")
        marker = MARKER_RE.findall(text)
        if name not in liste:
            if marker or STAND_RE.search(text):
                melden(name, "Preis-Marker auf einer Seite ohne Eintrag in preisseiten")
            continue
        if not marker:
            melden(name, "keine Preis-Marker")
        for pid, art, inhalt in marker:
            if pid not in produkte:
                melden(name, f"Preis-Marker mit unbekannter ID {pid}")
            elif inhalt != soll_marker(produkte[pid], art):
                melden(name, f"Preis-Marker {pid}: „{inhalt}“ statt „{soll_marker(produkte[pid], art)}“")
        for inhalt in STAND_RE.findall(text):
            if inhalt != stand:
                melden(name, f"Prüfdatum „{inhalt}“ statt „{stand}“")
        for ld_name, pid in liste[name].get("ld", {}).items():
            pos = text.find(f'"@type":"Product","name":"{ld_name}"')
            if pos < 0:
                melden(name, f"JSON-LD-Produkt {ld_name} fehlt")
                continue
            ende = text.find('"brand":', pos)
            offer = re.search(r'"offers":\{"@type":"Offer","price":"([0-9.]+)"', text[pos:ende])
            preis = produkte.get(pid, {}).get("bester_preis")
            if preis is None and offer:
                melden(name, f"JSON-LD-Offer für {ld_name} ohne geprüften Preis")
            elif preis is not None and (not offer or offer.group(1) != f"{preis:.2f}"):
                melden(name, f"JSON-LD-Offer für {ld_name} ungleich {preis:.2f}")


class Tags(html.parser.HTMLParser):
    """Prüft, ob alle geöffneten Tags in der richtigen Reihenfolge geschlossen werden."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stapel = []
        self.probleme = []

    def handle_starttag(self, tag, attrs):
        if tag not in LEER:
            self.stapel.append(tag)

    def handle_startendtag(self, tag, attrs):
        pass

    def handle_endtag(self, tag):
        if tag in LEER:
            return
        if self.stapel and self.stapel[-1] == tag:
            self.stapel.pop()
            return
        offen = self.stapel[-1] if self.stapel else "nichts"
        self.probleme.append(f"</{tag}> passt nicht, offen ist <{offen}>")
        if tag in self.stapel:
            while self.stapel and self.stapel.pop() != tag:
                pass


def datei_pruefen(pfad):
    name = pfad.relative_to(ROOT).as_posix()
    try:
        text = pfad.read_bytes().decode("utf-8")
    except UnicodeDecodeError:
        melden(name, "kein UTF-8")
        return
    if "\r" in text:
        melden(name, "Zeilenende CRLF statt LF")
    if not text.endswith("\n"):
        melden(name, "kein Zeilenumbruch am Dateiende")
    for nummer, zeile in enumerate(text.split("\n"), 1):
        if zeile != zeile.rstrip():
            melden(name, f"Zeile {nummer}: Leerzeichen am Zeilenende")
            break
    if "\xa0" in text:
        melden(name, "rohes geschütztes Leerzeichen, &nbsp; verwenden")
    if "Testsieger" in text:
        melden(name, "„Testsieger“ gefunden, „Unsere Empfehlung“ verwenden")
    for nummer, block in enumerate(LD_RE.findall(text), 1):
        try:
            json.loads(block)
        except ValueError as grund:
            melden(name, f"JSON-LD-Block {nummer} ungültig ({grund})")
    for ziel in HREF_RE.findall(text):
        if ziel.startswith(("http://", "https://", "//")):
            if "amazon.de" in ziel and AMAZON_TAG not in ziel:
                melden(name, f"Amazon-Link ohne {AMAZON_TAG}: {ziel}")
            continue
        if ziel.startswith(("mailto:", "tel:", "#", "data:", "javascript:")):
            continue
        if ziel.split("#")[0].split("?")[0].endswith(".html"):
            melden(name, f"interner Link mit .html: {ziel}")
    for ziel in REF_RE.findall(text):
        if not ziel or ziel.startswith(("http://", "https://", "//", "mailto:", "tel:", "#", "data:", "javascript:")):
            continue
        ziel_pruefen(name, pfad, ziel)
    if 'class="site-foot"' not in text:
        melden(name, "Footer fehlt")


def ziel_pruefen(name, pfad, ziel):
    """Interne Verweise (Seiten, Bilder, Skripte) müssen auf eine Datei unter src/ zeigen.

    Veröffentlicht wird nur src/. Fehlt dort zum Beispiel der Ordner img/, fällt das hier auf.
    """
    rein = ziel.split("#")[0].split("?")[0]
    if not rein:
        return
    basis = SRC if rein.startswith("/") else pfad.parent
    datei = (basis / rein.lstrip("/")).resolve()
    if rein.endswith("/"):
        datei = datei / "index.html"
    elif not datei.suffix:
        datei = datei.with_suffix(".html")
    if not datei.is_file() or SRC.resolve() not in datei.parents:
        melden(name, f"Verweis ohne Datei unter src/: {ziel}")


def deal_check_pruefen():
    name = SEITE.relative_to(ROOT).as_posix()
    text = SEITE.read_text(encoding="utf-8")
    if text.count(START) != 1 or text.count(ENDE) != 1:
        melden(name, "Marker DEAL-CHECK fehlen oder doppelt")
        return
    block = text[text.find(START):text.find(ENDE) + len(ENDE)]
    preise = json.loads(PREISE.read_text(encoding="utf-8"))
    if f'datetime="{preise["geprueft"]}"' not in block:
        melden(name, f"Prüfzeitpunkt {preise['geprueft']} fehlt im Deal-Check")
    if "·" in block:
        melden(name, "Mittelpunkt im Deal-Check")
    if "bei Amazon</small>" in block:
        melden(name, "Amazon-Preis im Deal-Check")
    for produkt, eintrag in preise["produkte"].items():
        preis = eintrag.get("bester_preis")
        if preis is not None and euro(preis) not in block:
            melden(name, f"Preis {euro(preis)} für {produkt} fehlt im Deal-Check")
    tags = Tags()
    tags.feed(block)
    tags.close()
    for problem in tags.probleme:
        melden(name, f"Deal-Check: {problem}")
    if tags.stapel:
        melden(name, f"Deal-Check: nicht geschlossen: {', '.join(tags.stapel)}")


def sitemap_pruefen():
    pfad = SRC / "sitemap.xml"
    name = pfad.relative_to(ROOT).as_posix()
    try:
        baum = ET.parse(pfad)
    except (ET.ParseError, OSError) as grund:
        melden(name, f"ungültig ({grund})")
        return
    ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    gesehen = set()
    for eintrag in baum.getroot().findall("s:url", ns):
        loc = (eintrag.findtext("s:loc", "", ns) or "").strip()
        lastmod = (eintrag.findtext("s:lastmod", "", ns) or "").strip()
        if loc in gesehen:
            melden(name, f"doppelt: {loc}")
        gesehen.add(loc)
        slug = loc.split("siebtraeger-guide.de/", 1)[-1]
        seite = SRC / ((slug or "index") + ".html")
        if not seite.exists():
            melden(name, f"keine Seite zu {loc}")
            continue
        text = seite.read_text(encoding="utf-8")
        if re.search(r'name="robots" content="[^"]*noindex', text):
            melden(name, f"noindex-Seite in der Sitemap: {loc}")
        geaendert = re.search(r'"dateModified":"([0-9-]+)"', text)
        if geaendert and geaendert.group(1) != lastmod:
            melden(name, f"lastmod {lastmod} ungleich dateModified {geaendert.group(1)}: {loc}")


def main():
    seiten = sorted(SRC.rglob("*.html"))
    for pfad in seiten:
        datei_pruefen(pfad)
    deal_check_pruefen()
    sitemap_pruefen()
    preisseiten_pruefen()
    for eintrag in fehler:
        print(f"FEHLER {eintrag}", flush=True)
    print(f"Geprüft: {len(seiten)} Seiten und der Deal-Check, {len(fehler)} Fehler", flush=True)
    return 1 if fehler else 0


if __name__ == "__main__":
    sys.exit(main())
