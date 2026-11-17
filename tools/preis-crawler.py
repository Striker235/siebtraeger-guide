#!/usr/bin/env python3
"""Preis-Crawler für den Siebträger-Guide.

Nur Python-Standardbibliothek. Ablauf pro Lauf:

1. Quellen aus data/preis-quellen.json lesen.
2. Liegt für eine Quelle ein Produktfeed vor (Adresse in einer
   Umgebungsvariable, zum Beispiel ein Awin-Feed), gilt der Feed.
3. Sonst: robots.txt des Shops mit dem eigenen User-Agent laden und nach
   RFC 9309 auswerten (mit * und $), dann die Produktseite abrufen. Zwischen
   zwei Abrufen beim selben Shop liegen mindestens 10 Sekunden.
   Umleitungen auf einen anderen Host folgt das Programm nicht.
4. Preis und Lieferbarkeit aus den JSON-LD-Angeboten (schema.org Offer) lesen.
5. data/preise.json (Stand der Prüfung) und data/preis-historie.json (ein
   Preis pro Tag und Quelle) schreiben. Die Historie ist die Grundlage für den
   Tiefstpreis der letzten 30 Tage (vgl. § 11 PAngV).
6. In der Black-Friday-Seite den Block zwischen den Markern
   DEAL-CHECK:START und DEAL-CHECK:END neu schreiben. Ändert sich der Block,
   setzt das Programm dateModified (WebPage) und article:modified_time auf
   den Zeitpunkt der Prüfung.
7. In den Preisseiten (Liste "preisseiten" in preis-quellen.json) nur diese
   Stellen neu schreiben, alles andere bleibt byte-gleich:
   <!-- preis:ID -->…<!-- /preis -->       Preis, zum Beispiel 380,99&nbsp;€
   <!-- preis:ID:ab -->…<!-- /preis -->    mit „ab“ davor
   <!-- preis:ID:shop -->…<!-- /preis -->  Shop des Preises: „Geprüft bei roastmarket“, ohne Preis „Kein geprüfter Preis“
   <!-- preis-stand -->…<!-- /preis-stand -->  Datum der Prüfung
   data-preis im <article> mit data-produkt="ID" (Sortierung)
   Offer im JSON-LD der Produkte, die die Seite unter "ld" (Name zu ID) nennt.
   Ohne geprüften Preis steht „Preis beim Händler prüfen“ oder „derzeit nicht
   lieferbar“, und das Produkt hat kein Offer im JSON-LD. Ändert sich eine
   Seite, setzt das Programm dateModified, article:modified_time und lastmod
   in src/sitemap.xml auf den Zeitpunkt der Prüfung.
   Marker gehören nur in Tabellen und Karten, nicht in Fließtext: Dort ergäbe
   „Für ab Preis beim Händler prüfen“ keinen Satz.

Amazon-Preise liest das Programm nicht. Amazon erscheint nur als Link.

Aufruf:
  python3 tools/preis-crawler.py                abrufen, Daten und Seite schreiben
  python3 tools/preis-crawler.py --trocken      abrufen und anzeigen, nichts schreiben
  python3 tools/preis-crawler.py --nur-seite    Seite aus vorhandenen Daten neu bauen
  python3 tools/preis-crawler.py --nur-historie abrufen, nur data/preis-historie.json schreiben

Rückgabewert 2: Weniger als die Hälfte der geprüften Quellen lieferte ein
Ergebnis. Die Ergebnisse kommen in die Historie. data/preise.json und die Seite
bleiben auf dem Stand der letzten Prüfung, die Seite nennt deren Zeitpunkt.
"""

import argparse
import csv
import datetime as dt
import gzip
import html
import io
import itertools
import json
import os
import re
import shutil
import tempfile
import time
import unicodedata
import urllib.error
import urllib.request
from pathlib import Path
from urllib.parse import urlencode, urlsplit

ROOT = Path(__file__).resolve().parent.parent
QUELLEN = ROOT / "data" / "preis-quellen.json"
START = "<!-- DEAL-CHECK:START -->"
ENDE = "<!-- DEAL-CHECK:END -->"
MARKER_RE = re.compile(r"<!-- preis:([a-z0-9-]+)(?::(ab|shop))? -->(.*?)<!-- /preis -->")
STAND_RE = re.compile(r"(<!-- preis-stand -->)(.*?)(<!-- /preis-stand -->)")
ARTIKEL_RE = re.compile(r"<article\b[^>]*>")
OFFER_RE = re.compile(r'(?:"offers":\{"@type":"Offer"[^{}]*\},)?"brand":')
MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September",
          "Oktober", "November", "Dezember"]
LIEFERBAR = {"instock", "limitedavailability", "onlineonly"}
ALTPREIS = {"strikethroughprice", "listprice", "msrp", "srp", "invoiceprice"}
PRODUKTTYPEN = {"product", "productgroup", "individualproduct", "productmodel"}
OHNE_ERGEBNIS = {"nur Link", "kein Feed"}
MIT_ERGEBNIS = {"ok", "nicht lieferbar"}
GEPRUEFT = MIT_ERGEBNIS | {"kein Preis", "unplausibel"}  # Seite abgerufen und ausgewertet
SEITE_WEG = {"HTTP 404", "HTTP 410"}  # Produktseite gibt es nicht mehr: kein Link
LAGER_JA = {"1", "true", "yes", "ja", "y", "instock", "in stock"}
MAX_BYTES = 8 * 1024 * 1024
LD_RE = re.compile(r"<script\b[^>]*application/ld\+json[^>]*>(.*?)</script\s*>", re.S | re.I)
HIST_HINWEIS = (
    "Ein Eintrag pro Tag und Quelle (Produkt|Shop): d = Datum, p = niedrigster "
    "lieferbarer Preis des Tages in Euro, null = nicht lieferbar. Fehlt ein Tag, "
    "gab es keine Prüfung oder kein Ergebnis."
)
PREISE_HINWEIS = (
    "Stand der letzten Prüfung. Preise aus den JSON-LD-Angeboten der Shopseiten oder aus "
    "einem Produktfeed. tief_30: niedrigster Tagespreis der 30 Tage vor dem Prüftag. "
    "Amazon und OTTO nur als Link."
)
SHOPKLASSE = {"roastmarket": "roastmarket", "Amazon": "amazon", "OTTO": "otto"}
URTEILE = {
    "tief": ("tief", "Unter 30-Tage-Tief"),
    "gleich": ("gleich", "Auf 30-Tage-Tief"),
    "hoch": ("hoch", "Über 30-Tage-Tief"),
    "kurz": ("kurz", "Verlauf zu kurz"),
    "kein-preis": ("kein", "Kein Preis"),
}

try:
    from zoneinfo import ZoneInfo
    TZ = ZoneInfo("Europe/Berlin")
except Exception:  # ohne Zeitzonendaten, zum Beispiel unter Windows ohne tzdata
    TZ = None


def log(text):
    print(text, flush=True)


def jetzt_berlin(utc=None):
    """Zeit in Berlin. Ohne Zeitzonendaten gelten die EU-Regeln für MEZ und MESZ."""
    utc = (utc or dt.datetime.now(dt.timezone.utc)).replace(microsecond=0)
    if TZ is not None:
        return utc.astimezone(TZ)

    def letzter_sonntag(monat):
        tag = dt.datetime(utc.year, monat, 31, 1, tzinfo=dt.timezone.utc)
        return tag - dt.timedelta(days=(tag.weekday() + 1) % 7)

    sommer = letzter_sonntag(3) <= utc < letzter_sonntag(10)
    return utc.astimezone(dt.timezone(dt.timedelta(hours=2 if sommer else 1)))


def schreiben(pfad, text):
    pfad.parent.mkdir(parents=True, exist_ok=True)
    with open(pfad, "w", encoding="utf-8", newline="\n") as datei:
        datei.write(text)


def zahl(wert):
    if wert is None or isinstance(wert, bool):
        return None
    if isinstance(wert, (int, float)):
        return float(wert)
    text = re.sub(r"[^0-9,.]", "", str(wert))
    if "," in text and "." in text:
        if text.rfind(",") > text.rfind("."):
            text = text.replace(".", "").replace(",", ".")
        else:
            text = text.replace(",", "")
    elif "," in text:
        text = text.replace(",", ".")
    try:
        return float(text)
    except ValueError:
        return None


def norm(text):
    text = re.sub("[\u2122\u00ae\u00a9]", "", str(text or ""))
    text = unicodedata.normalize("NFKD", text)
    text = "".join(zeichen for zeichen in text if not unicodedata.combining(zeichen))
    return re.sub(r"[^a-z0-9]", "", text.lower())


def passt(name, muss, nicht):
    wert = norm(name)
    return all(norm(wort) in wert for wort in muss) and not any(norm(wort) in wert for wort in nicht)


# ------------------------------------------------------------------ robots.txt

def robots_lesen(text, token):
    """Regeln und Crawl-delay für den eigenen User-Agent (RFC 9309).

    Gibt es eine Gruppe für das eigene Token, gilt nur sie, sonst die Gruppe "*".
    """
    gruppen, agenten, regeln, pause, in_regeln = [], [], [], None, False
    for zeile in text.lstrip("\ufeff").splitlines():
        zeile = zeile.split("#", 1)[0].strip()
        if ":" not in zeile:
            continue
        feld, wert = (teil.strip() for teil in zeile.split(":", 1))
        feld = feld.lower()
        if feld == "user-agent":
            if in_regeln:
                gruppen.append((agenten, regeln, pause))
                agenten, regeln, pause, in_regeln = [], [], None, False
            agenten.append(wert.lower())
        elif feld in ("allow", "disallow") and agenten:
            in_regeln = True
            if wert:
                regeln.append((feld == "allow", wert))
        elif feld == "crawl-delay" and agenten:
            in_regeln = True
            pause = zahl(wert)
    if agenten:
        gruppen.append((agenten, regeln, pause))
    passend = [g for g in gruppen if token in g[0]] or [g for g in gruppen if "*" in g[0]]
    pausen = [g[2] for g in passend if g[2] is not None]
    return [regel for g in passend for regel in g[1]], (max(pausen) if pausen else None)


def robots_erlaubt(regeln, url):
    """Längste passende Regel gewinnt, bei Gleichstand Allow."""
    teile = urlsplit(url)
    pfad = (teile.path or "/") + ("?" + teile.query if teile.query else "")
    bester = None
    for erlaubt, muster in regeln:
        anker = muster.endswith("$")
        rumpf = muster[:-1] if anker else muster
        ausdruck = ".*".join(re.escape(teil) for teil in rumpf.split("*")) + ("$" if anker else "")
        if re.match(ausdruck, pfad):
            laenge = len(muster)
            if bester is None or laenge > bester[0] or (laenge == bester[0] and erlaubt):
                bester = (laenge, erlaubt)
    return bester is None or bester[1]


# ------------------------------------------------------------------ Abruf

class Umleitung(urllib.request.HTTPRedirectHandler):
    """Folgt Umleitungen nur auf demselben Host, bei robots.txt auch auf andere (RFC 9309).

    Eine Umleitung auf einen anderen Host endet mit einem HTTPError (3xx). So ruft das
    Programm keine Seite ab, deren robots.txt es nicht geprüft hat.
    """

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        alt, neu = urlsplit(req.full_url), urlsplit(newurl)
        if alt.path != "/robots.txt" and alt.netloc.lower() != neu.netloc.lower():
            return None
        return super().redirect_request(req, fp, code, msg, headers, newurl)


OEFFNER = urllib.request.build_opener(Umleitung)


class Abrufer:
    """Höflicher Abruf: eigener User-Agent, robots.txt, Abstand pro Host."""

    def __init__(self, user_agent, abstand):
        self.ua = user_agent
        self.token = user_agent.split("/", 1)[0].strip().lower()
        self.abstand = float(abstand)
        self.letzter = {}
        self.robots = {}

    def warten(self, host):
        eintrag = self.robots.get(host)
        pause = eintrag[1] if eintrag else None
        abstand = max(self.abstand, pause or 0)
        rest = self.letzter.get(host, float("-inf")) + abstand - time.monotonic()
        if rest > 0:
            time.sleep(rest)

    def oeffnen(self, url, accept, timeout=40, frei=False):
        """frei: Umleitungen auf andere Hosts erlaubt, nur für Produktfeeds."""
        host = urlsplit(url).netloc.lower()
        self.warten(host)
        self.letzter[host] = time.monotonic()
        anfrage = urllib.request.Request(url, headers={
            "User-Agent": self.ua,
            "Accept": accept,
            "Accept-Language": "de-DE,de;q=0.9",
        })
        return (urllib.request.urlopen if frei else OEFFNER.open)(anfrage, timeout=timeout)

    def text(self, url, accept="text/html,application/xhtml+xml"):
        host = urlsplit(url).netloc.lower()
        try:
            with self.oeffnen(url, accept) as antwort:
                daten = antwort.read(MAX_BYTES)
                ziel = antwort.geturl()
                zeichensatz = antwort.headers.get_content_charset() or "utf-8"
        finally:
            self.letzter[host] = time.monotonic()
        try:
            return ziel, daten.decode(zeichensatz, "replace")
        except LookupError:
            return ziel, daten.decode("utf-8", "replace")

    def erlaubt(self, url):
        teile = urlsplit(url)
        host = teile.netloc.lower()
        if host not in self.robots:
            try:
                _, inhalt = self.text(f"{teile.scheme}://{host}/robots.txt", "text/plain")
                self.robots[host] = robots_lesen(inhalt, self.token)
            except urllib.error.HTTPError as fehler:
                # 401, 403, 429 und 5xx: nicht abrufen. Andere 4xx: keine robots.txt, Abruf erlaubt.
                frei = 400 <= fehler.code < 500 and fehler.code not in (401, 403, 429)
                self.robots[host] = ([], None) if frei else None
            except Exception:
                self.robots[host] = None
        eintrag = self.robots[host]
        if eintrag is None:
            return None  # robots.txt nicht lesbar: nicht abrufen
        return robots_erlaubt(eintrag[0], url)


# ------------------------------------------------------------------ Preise lesen

def ld_bloecke(text):
    for roh in LD_RE.findall(text):
        roh = re.sub(r"^\s*(<!--|//\s*<!\[CDATA\[|/\*\s*<!\[CDATA\[\s*\*/)", "", roh)
        roh = re.sub(r"(-->|//\s*\]\]>|/\*\s*\]\]>\s*\*/)\s*$", "", roh).strip()
        if not roh:
            continue
        try:
            yield json.loads(roh, strict=False)
        except ValueError:
            continue


def typen(knoten):
    wert = knoten.get("@type")
    liste = wert if isinstance(wert, list) else [wert]
    return {str(typ).rsplit("/", 1)[-1].split(":")[-1].lower() for typ in liste if typ}


def produkte(knoten, tiefe=0):
    """Produkte auf oberster Ebene, in @graph, mainEntity und hasVariant.

    Verwandte Produkte und Produktlisten wertet das Programm bewusst nicht aus.
    """
    if tiefe > 6:
        return
    if isinstance(knoten, list):
        for teil in knoten:
            yield from produkte(teil, tiefe + 1)
        return
    if not isinstance(knoten, dict):
        return
    if typen(knoten) & PRODUKTTYPEN:
        yield knoten
        if knoten.get("hasVariant"):
            yield from produkte(knoten["hasVariant"], tiefe + 1)
    for schluessel_name in ("@graph", "mainEntity"):
        if knoten.get(schluessel_name):
            yield from produkte(knoten[schluessel_name], tiefe + 1)


def angebote(knoten):
    wert = knoten.get("offers")
    for angebot in (wert if isinstance(wert, list) else [wert]):
        if not isinstance(angebot, dict):
            continue
        if isinstance(angebot.get("offers"), (list, dict)):
            yield from angebote(angebot)
        else:
            yield angebot


def preis_aus(angebot):
    if str(angebot.get("priceCurrency") or "EUR").upper() != "EUR":
        return None
    for feld in ("price", "lowPrice"):
        preis = zahl(angebot.get(feld))
        if preis is not None:
            return preis
    spez = angebot.get("priceSpecification")
    for teil in (spez if isinstance(spez, list) else [spez]):
        if not isinstance(teil, dict):
            continue
        art = str(teil.get("priceType") or "").rsplit("/", 1)[-1].lower()
        if art in ALTPREIS or str(teil.get("priceCurrency") or "EUR").upper() != "EUR":
            continue
        preis = zahl(teil.get("price"))
        if preis is not None:
            return preis
    return None


def lieferbar_aus(angebot):
    wert = angebot.get("availability")
    if not wert:
        return None
    return str(wert).rsplit("/", 1)[-1].strip().lower() in LIEFERBAR


def auswerten(funde, etwa, grenzen):
    """Wählt aus Paaren (Preis, lieferbar) den niedrigsten lieferbaren, plausiblen Preis.

    Es zählen nur Angebote, die ausdrücklich als lieferbar markiert sind.
    """
    funde = [(preis, lieferbar) for preis, lieferbar in funde if 20 <= preis <= 20000]
    if not funde:
        return {"status": "kein Preis", "hinweis": "kein passendes Angebot"}
    verfuegbar = sorted({preis for preis, lieferbar in funde if lieferbar})
    if not verfuegbar:
        if any(lieferbar is None for _, lieferbar in funde):
            return {"status": "kein Preis", "hinweis": "Lieferbarkeit nicht angegeben"}
        return {"status": "nicht lieferbar"}
    hinweis = ""
    if etwa:
        plausibel = [preis for preis in verfuegbar if grenzen[0] * etwa <= preis <= grenzen[1] * etwa]
        if not plausibel:
            return {"status": "unplausibel", "preis": verfuegbar[0], "hinweis": f"weicht stark von {etwa} ab"}
        if len(plausibel) < len(verfuegbar):
            weg = ", ".join(f"{preis:.2f}" for preis in verfuegbar if preis not in plausibel)
            hinweis = f"ohne unplausible Angebote ({weg})"
        verfuegbar = plausibel
    ergebnis = {"status": "ok", "preis": verfuegbar[0]}
    if hinweis:
        ergebnis["hinweis"] = hinweis
    if len(verfuegbar) > 1:
        ergebnis["ab"] = True
    return ergebnis


def pruefe_seite(abrufer, produkt, quelle, grenzen):
    url = quelle["url"]
    try:
        erlaubt = abrufer.erlaubt(url)
        if erlaubt is None:
            return {"status": "robots", "hinweis": "robots.txt nicht lesbar"}
        if not erlaubt:
            return {"status": "robots", "hinweis": "robots.txt erlaubt den Abruf nicht"}
        ziel, text = abrufer.text(url)
    except urllib.error.HTTPError as fehler:
        if 300 <= fehler.code < 400:
            return {"status": "fehler", "hinweis": "Umleitung nicht gefolgt (anderer Host oder Schleife)"}
        return {"status": "fehler", "hinweis": f"HTTP {fehler.code}"}
    except Exception as fehler:  # Netzwerk, Zeitüberschreitung
        return {"status": "fehler", "hinweis": type(fehler).__name__}
    if urlsplit(ziel).netloc.lower() != urlsplit(url).netloc.lower():
        return {"status": "fehler", "hinweis": "auf einen anderen Host umgeleitet"}
    muss = produkt.get("name_muss", [])
    nicht = produkt.get("name_nicht", [])
    sku = str(quelle.get("sku") or "")
    funde, namen = [], []
    for daten in ld_bloecke(text):
        for knoten in produkte(daten):
            name = str(knoten.get("name") or "")
            namen.append(name)
            if not passt(name, muss, nicht):
                continue
            for angebot in angebote(knoten):
                if sku and str(angebot.get("sku") or knoten.get("sku") or "") != sku:
                    continue
                preis = preis_aus(angebot)
                if preis is not None:
                    funde.append((preis, lieferbar_aus(angebot)))
    ergebnis = auswerten(funde, produkt.get("preis_etwa"), grenzen)
    if ergebnis["status"] == "kein Preis" and namen:
        ergebnis["hinweis"] += " (Produkte im JSON-LD: " + ", ".join(namen[:3]) + ")"
    return ergebnis


def feeds_laden(abrufer, auftraege):
    """Lädt jeden Feed einmal (CSV, auch gzip) und behält nur die gesuchten Zeilen."""
    csv.field_size_limit(1 << 24)
    gruppen = {}
    for _, quelle in auftraege:
        gruppen.setdefault(quelle["feed_env"], []).append(quelle)
    treffer = {}
    for env, quellen in gruppen.items():
        url = os.environ.get(env, "").strip()
        if not url:
            treffer[env] = None
            continue
        paare = {(q.get("feed_spalte", "ean"), str(q.get("feed_wert", "")).strip()) for q in quellen}
        spalten = {spalte for spalte, _ in paare}
        trenner = quellen[0].get("feed_trenner", ",")
        zeilen = []
        try:
            with abrufer.oeffnen(url, "text/csv,application/gzip,*/*", timeout=600, frei=True) as antwort:
                with tempfile.TemporaryFile() as puffer:
                    shutil.copyfileobj(antwort, puffer, 1 << 20)
                    puffer.seek(0)
                    gepackt = puffer.read(2) == b"\x1f\x8b"
                    puffer.seek(0)
                    strom = gzip.GzipFile(fileobj=puffer) if gepackt else puffer
                    text = io.TextIOWrapper(strom, encoding="utf-8-sig", errors="replace", newline="")
                    for zeile in csv.DictReader(text, delimiter=trenner):
                        if any((spalte, str(zeile.get(spalte) or "").strip()) in paare for spalte in spalten):
                            zeilen.append(zeile)
        except Exception as fehler:  # die Feed-Adresse enthält einen Schlüssel: nicht ausgeben
            log(f"Feed {env}: {type(fehler).__name__}")
            treffer[env] = "fehler"
            continue
        treffer[env] = zeilen
    return treffer


def pruefe_feed(produkt, quelle, feeds, grenzen):
    zeilen = feeds.get(quelle["feed_env"])
    if zeilen is None:
        return {"status": "kein Feed", "hinweis": f"Umgebungsvariable {quelle['feed_env']} fehlt"}
    if zeilen == "fehler":
        return {"status": "fehler", "hinweis": "Feed nicht lesbar"}
    spalte = quelle.get("feed_spalte", "ean")
    wert = str(quelle.get("feed_wert", "")).strip()
    lager = quelle.get("feed_lager", "in_stock")
    preis_spalte = quelle.get("feed_preis", "search_price")
    funde = []
    for zeile in zeilen:
        if str(zeile.get(spalte) or "").strip() != wert:
            continue
        bestand = str(zeile.get(lager) or "").strip().lower()
        lieferbar = None if not bestand else bestand in LAGER_JA
        preis = zahl(zeile.get(preis_spalte))
        if preis is not None:
            funde.append((preis, lieferbar))
    return auswerten(funde, produkt.get("preis_etwa"), grenzen)


def schluessel(produkt, quelle):
    return f"{produkt['id']}|{quelle['shop']}"


def abrufen_alle(cfg):
    einst = cfg["einstellungen"]
    abrufer = Abrufer(cfg["user_agent"], einst["abstand_sekunden"])
    grenzen = einst["plausibel"]
    alle = [(produkt, quelle) for produkt in cfg["produkte"] for quelle in produkt["quellen"]]
    ergebnisse = {}
    # Feed nur mit eindeutigem Schlüssel (zum Beispiel EAN). Ohne Wert gilt die Produktseite.
    mit_feed = [(produkt, quelle) for produkt, quelle in alle
                if quelle.get("feed_env") and str(quelle.get("feed_wert") or "").strip()]
    if mit_feed:
        geladen = feeds_laden(abrufer, mit_feed)
        for produkt, quelle in mit_feed:
            ergebnisse[schluessel(produkt, quelle)] = pruefe_feed(produkt, quelle, geladen, grenzen)
    seiten = []
    for produkt, quelle in alle:
        erg = ergebnisse.get(schluessel(produkt, quelle))
        if erg and erg["status"] in MIT_ERGEBNIS:
            continue  # Der Feed hat Vorrang vor dem Seitenabruf.
        if quelle.get("url"):
            seiten.append((produkt, quelle))
        elif erg is None:
            ergebnisse[schluessel(produkt, quelle)] = {"status": "nur Link"}
    # Shops abwechselnd abfragen: Die Wartezeit pro Shop läuft dann parallel.
    gruppen = {}
    for auftrag in seiten:
        gruppen.setdefault(urlsplit(auftrag[1]["url"]).netloc.lower(), []).append(auftrag)
    reihenfolge = [auftrag for runde in itertools.zip_longest(*gruppen.values()) for auftrag in runde if auftrag]
    for produkt, quelle in reihenfolge:
        ergebnisse[schluessel(produkt, quelle)] = pruefe_seite(abrufer, produkt, quelle, grenzen)
    for produkt, quelle in alle:
        erg = ergebnisse[schluessel(produkt, quelle)]
        if erg["status"] != "nur Link":
            zusatz = " ".join(str(erg[k]) for k in ("preis", "hinweis") if k in erg)
            log(f"{produkt['name']} | {quelle['shop']}: {erg['status']} {zusatz}".rstrip())
    return ergebnisse


# ------------------------------------------------------------------ Historie und Urteil

def historie_laden(pfad):
    if pfad.exists():
        return json.loads(pfad.read_text(encoding="utf-8"))
    return {"hinweis": HIST_HINWEIS, "quellen": {}}


def historie_aktualisieren(hist, ergebnisse, heute, aufbewahren):
    quellen = hist.setdefault("quellen", {})
    for key, erg in ergebnisse.items():
        if erg["status"] == "ok":
            neu = {"d": heute, "p": erg["preis"]}
        elif erg["status"] == "nicht lieferbar":
            neu = {"d": heute, "p": None}
        else:
            continue
        liste = quellen.setdefault(key, [])
        if liste and liste[-1]["d"] == heute:
            alt = liste[-1]["p"]
            if neu["p"] is not None and (alt is None or neu["p"] < alt):
                liste[-1] = neu
        else:
            liste.append(neu)
    grenze = (dt.date.fromisoformat(heute) - dt.timedelta(days=aufbewahren)).isoformat()
    for key in list(quellen):
        quellen[key] = [eintrag for eintrag in quellen[key] if eintrag["d"] >= grenze]
        if not quellen[key]:
            del quellen[key]


def historie_schreiben(pfad, hist):
    zeilen = [f"  {json.dumps(key, ensure_ascii=False)}: "
              f"{json.dumps(werte, ensure_ascii=False, separators=(',', ':'))}"
              for key, werte in sorted(hist["quellen"].items())]
    hinweis = json.dumps(hist.get("hinweis", HIST_HINWEIS), ensure_ascii=False)
    text = "{\n" + f' "hinweis": {hinweis},\n' + ' "quellen": {\n'
    text += ",\n".join(zeilen) + ("\n" if zeilen else "") + " }\n}\n"
    schreiben(pfad, text)


def tageswerte(hist, produkt):
    """Niedrigster lieferbarer Preis pro Tag über alle geprüften Shops."""
    werte = {}
    for quelle in produkt["quellen"]:
        for eintrag in hist.get("quellen", {}).get(schluessel(produkt, quelle), []):
            preis = eintrag.get("p")
            if preis is not None and (eintrag["d"] not in werte or preis < werte[eintrag["d"]]):
                werte[eintrag["d"]] = preis
    return werte


def urteil(produkt, eintrag, einst):
    preis = eintrag.get("bester_preis")
    if preis is None:
        return {"urteil": "kein-preis"}
    if eintrag["tage_mit_daten"] < einst["min_tage_urteil"]:
        ergebnis = {"urteil": "kurz"}
        for quelle in produkt["quellen"]:
            if quelle["shop"] == eintrag["bester_shop"] and quelle.get("referenz"):
                ergebnis["referenz"] = dict(quelle["referenz"], shop=quelle["shop"])
        return ergebnis
    tief = eintrag["tief_30"]
    if preis < tief - 0.005:
        art = "tief"
    elif preis <= tief + 0.005:
        art = "gleich"
    else:
        art = "hoch"
    return {"urteil": art, "abstand": round((preis - tief) / tief, 4)}


def preise_bauen(cfg, ergebnisse, hist, jetzt):
    einst = cfg["einstellungen"]
    heute = jetzt.date().isoformat()
    beginn = (jetzt.date() - dt.timedelta(days=einst["fenster_tage"])).isoformat()
    produkte_daten = {}
    for produkt in cfg["produkte"]:
        liste = [dict(ergebnisse.get(schluessel(produkt, quelle), {"status": "nur Link"}), shop=quelle["shop"])
                 for quelle in produkt["quellen"]]
        eintrag = {"name": produkt["name"], "angebote": liste}
        mit_preis = sorted((a["preis"], a["shop"]) for a in liste if a["status"] == "ok")
        if mit_preis:
            eintrag["bester_preis"], eintrag["bester_shop"] = mit_preis[0]
            if any(a["shop"] == mit_preis[0][1] and a.get("ab") for a in liste):
                eintrag["ab"] = True
        vorher = {tag: preis for tag, preis in tageswerte(hist, produkt).items() if beginn <= tag < heute}
        eintrag["tage_mit_daten"] = len(vorher)
        if vorher:
            eintrag["daten_seit"] = min(vorher)
            eintrag["tief_30"] = min(vorher.values())
            eintrag["tief_30_datum"] = max(tag for tag, preis in vorher.items() if preis == eintrag["tief_30"])
        eintrag.update(urteil(produkt, eintrag, einst))
        produkte_daten[produkt["id"]] = eintrag
    return {"geprueft": jetzt.isoformat(), "hinweis": PREISE_HINWEIS, "produkte": produkte_daten}


# ------------------------------------------------------------------ Seite

def tx(text):
    return html.escape(str(text), quote=False)


def at(text):
    return html.escape(str(text), quote=True)


def euro(wert):
    text = f"{wert:,.2f}".replace(",", "#").replace(".", ",").replace("#", ".")
    return f"{text}&nbsp;€"


def prozent(wert):
    return f"{abs(wert) * 100:.1f}".replace(".", ",") + "&nbsp;%"


def abweichung(preis, bezug):
    """Abstand zum Bezugspreis in Prozent, unter 0,1 % in Euro (nie „0,0 %“)."""
    anteil = abs(preis - bezug) / bezug
    if round(anteil * 100, 1) >= 0.1:
        return prozent(anteil)
    return euro(abs(round(preis - bezug, 2)))


def datum_kurz(iso):
    _, monat, tag = iso[:10].split("-")
    return f"{tag}.{monat}."


def tage_text(anzahl):
    return f"{anzahl}&nbsp;Tag" if anzahl == 1 else f"{anzahl}&nbsp;Tage"


def aufzaehlung(namen):
    """Namen als Aufzählung: A, B und C."""
    return namen[0] if len(namen) == 1 else ", ".join(namen[:-1]) + " und " + namen[-1]


def link_fuer(einst, produkt, quelle):
    """Partnerlink über Awin (mit clickref pro Produkt), sonst der eingetragene Link."""
    if quelle.get("awin"):
        return "https://www.awin1.com/cread.php?" + urlencode({
            "awinmid": quelle["awin"],
            "awinaffid": einst["awin_publisher"],
            "clickref": einst.get("clickref_prefix", "") + produkt["id"],
            "ued": quelle.get("ziel") or quelle["url"],
        })
    return quelle.get("link")


def zeile(produkt, eintrag, einst):
    modell = f'<a href="{at(produkt["seite"])}">{tx(produkt["name"])}</a>'
    if produkt.get("label"):
        gruen = " green" if produkt["label"] == "Unsere Empfehlung" else ""
        modell += f'<br><span class="seal-mini{gruen}">{tx(produkt["label"])}</span>'
    preis = eintrag.get("bester_preis")
    if preis is not None:
        ab = "ab " if eintrag.get("ab") else ""
        heute = f'<b>{ab}{euro(preis)}</b><br><small>bei {tx(eintrag["bester_shop"])}</small>'
    else:
        heute = "<small>kein geprüfter Preis</small>"
    tage = eintrag.get("tage_mit_daten", 0)
    tief_preis = eintrag.get("tief_30")
    if tief_preis is not None and tage >= einst["min_tage_urteil"]:
        tief = (f'<b>{euro(tief_preis)}</b><br><small>am {datum_kurz(eintrag["tief_30_datum"])}, '
                f"{tage_text(tage)} mit Daten</small>")
    elif tief_preis is not None:
        tief = (f'<b>{euro(tief_preis)}</b><br><small>niedrigster Preis seit {datum_kurz(eintrag["daten_seit"])}, '
                f"erst {tage_text(tage)} mit Daten</small>")
    else:
        tief = "<small>noch keine Daten aus den Vortagen</small>"
    art = eintrag.get("urteil", "kein-preis")
    klasse, titel = URTEILE[art]
    detail = ""
    if art == "tief":
        detail = f"{abweichung(preis, tief_preis)} unter dem 30-Tage-Tief"
    elif art == "hoch":
        detail = f"aktuell {abweichung(preis, tief_preis)} über dem 30-Tage-Tief"
    elif art == "kurz" and eintrag.get("referenz"):
        ref = eintrag["referenz"]
        detail = f'Am {datum_kurz(ref["datum"])} bei {tx(ref["shop"])}: {euro(ref["preis"])}'
        cent = round(preis * 100) - round(ref["preis"] * 100)
        if cent > 0:
            detail += f" (aktuell {abweichung(preis, ref['preis'])} teurer)"
        elif cent < 0:
            detail += f" (aktuell {abweichung(preis, ref['preis'])} günstiger)"
        else:
            detail += " (aktuell gleich)"
    elif art == "kein-preis":
        weg = [a["shop"] for a in eintrag.get("angebote", []) if a["status"] == "nicht lieferbar"]
        detail = f"Bei {tx(aufzaehlung(weg))} aktuell nicht lieferbar" if weg else "Preis beim Händler prüfen"
    urteil_html = f'<span class="deal-v {klasse}">{titel}</span>'
    if detail:
        urteil_html += f"<br><small>{detail}</small>"
    nach_shop = {angebot["shop"]: angebot for angebot in eintrag.get("angebote", [])}
    knoepfe = []
    for quelle in produkt["quellen"]:
        link = link_fuer(einst, produkt, quelle)
        angebot = nach_shop.get(quelle["shop"], {})
        if not link or angebot.get("status") == "nicht lieferbar" or angebot.get("hinweis") in SEITE_WEG:
            continue
        partner = quelle.get("partner", True)
        rel = "sponsored nofollow noopener" if partner else "noopener"
        knoepfe.append(
            f'<a class="btn tiny {SHOPKLASSE.get(quelle["shop"], "ghost")}" href="{at(link)}" '
            f'target="_blank" rel="{rel}">{tx(quelle.get("knopf", quelle["shop"]))}{"*" if partner else ""}</a>')
    shops = f'<div class="btn-stack">{"".join(knoepfe)}</div>' if knoepfe else "<small>kein Shop-Link</small>"
    return f"<tr><td>{modell}</td><td>{heute}</td><td>{tief}</td><td>{urteil_html}</td><td>{shops}</td></tr>"


def block(cfg, preise, hist):
    einst = cfg["einstellungen"]
    stand = preise["geprueft"]
    tage = [eintrag["d"] for liste in hist.get("quellen", {}).values() for eintrag in liste]
    seit = min(tage) if tage else stand[:10]
    shops = []
    for eintrag in preise["produkte"].values():
        for angebot in eintrag.get("angebote", []):
            if angebot["status"] in GEPRUEFT and angebot["shop"] not in shops:
                shops.append(angebot["shop"])
    geprueft_bei = f'. Automatisch geprüft: {tx(", ".join(shops))}' if shops else ""
    teile = [
        START,
        f'<p class="meta-line">Zuletzt geprüft: <time datetime="{at(stand)}">{datum_kurz(stand)}, '
        f'{stand[11:16]}&nbsp;Uhr</time>. Verlauf seit <time datetime="{seit}">{datum_kurz(seit)}</time>'
        f"{geprueft_bei}</p>",
    ]
    for kategorie in cfg["kategorien"]:
        liste = [produkt for produkt in cfg["produkte"] if produkt["kat"] == kategorie]
        if not liste:
            continue
        teile.append(f"<h3>{tx(kategorie)}</h3>")
        teile.append('<div class="tbl-wrap"><table class="deal-tbl">')
        teile.append("<thead><tr><th>Modell</th><th>Geprüfter Preis</th><th>Tiefstpreis 30&nbsp;Tage</th>"
                     "<th>Urteil</th><th>Zum Shop</th></tr></thead>")
        teile.append("<tbody>")
        teile.extend(zeile(produkt, preise["produkte"].get(produkt["id"], {}), einst) for produkt in liste)
        teile.append("</tbody></table></div>")
    teile.append(ENDE)
    return "\n".join(teile)


def kopf_aktualisieren(text, stand):
    """dateModified im WebPage-Block und article:modified_time auf den Prüfzeitpunkt setzen."""
    text = re.sub(r'("@type":"WebPage".*?"dateModified":")[0-9-]+(")',
                  lambda treffer: treffer.group(1) + stand[:10] + treffer.group(2), text, count=1)
    text = re.sub(r'(<meta property="article:modified_time" content=")[^"]*(")',
                  lambda treffer: treffer.group(1) + stand + treffer.group(2), text, count=1)
    return text


def seite_schreiben(pfad, neuer_block, stand):
    text = pfad.read_text(encoding="utf-8")
    anfang, ende = text.find(START), text.find(ENDE)
    if anfang < 0 or ende < anfang:
        raise SystemExit(f"Marker DEAL-CHECK fehlen in {pfad}")
    neu = text[:anfang] + neuer_block + text[ende + len(ENDE):]
    if neu == text:
        return False
    schreiben(pfad, kopf_aktualisieren(neu, stand))
    return True


def sitemap_aktualisieren(seite, stand):
    """lastmod der Seite in src/sitemap.xml auf den Prüftag setzen (gleich mit dateModified)."""
    pfad = ROOT / "src" / "sitemap.xml"
    if not pfad.exists():
        return False
    text = pfad.read_text(encoding="utf-8")
    slug = "" if seite.stem == "index" else seite.stem
    muster = r"(<loc>https://siebtraeger-guide\.de/" + re.escape(slug) + r"</loc><lastmod>)[0-9-]+(</lastmod>)"
    neu = re.sub(muster, lambda treffer: treffer.group(1) + stand[:10] + treffer.group(2), text, count=1)
    if neu == text:
        return False
    schreiben(pfad, neu)
    return True


# ------------------------------------------------------------------ Preisseiten

def stand_lang(iso):
    """2026-11-17 wird zu 17.&nbsp;November 2026."""
    jahr, monat, tag = iso[:10].split("-")
    return f"{int(tag)}.&nbsp;{MONATE[int(monat) - 1]} {jahr}"


def ohne_preis(eintrag):
    if any(angebot.get("status") == "nicht lieferbar" for angebot in eintrag.get("angebote", [])):
        return "derzeit nicht lieferbar"
    return "Preis beim Händler prüfen"


def marker_text(eintrag, art):
    preis = eintrag.get("bester_preis")
    if art == "shop":
        return f'Geprüft bei {tx(eintrag["bester_shop"])}' if preis is not None else "Kein geprüfter Preis"
    if preis is None:
        return ohne_preis(eintrag)
    return ("ab&nbsp;" if art == "ab" else "") + euro(preis)


def offer_json(eintrag):
    preis = eintrag.get("bester_preis")
    if preis is None:
        return ""
    return f'"offers":{{"@type":"Offer","price":"{preis:.2f}","priceCurrency":"EUR"}},'


def preisseite_neu(text, seite, preise):
    """Marker, Prüfdatum, data-preis und JSON-LD-Offers einer Seite neu schreiben."""
    produkte = preise["produkte"]
    fehlt = set()

    def marker(treffer):
        pid, art = treffer.group(1), treffer.group(2)
        if pid not in produkte:
            fehlt.add(pid)
            return treffer.group(0)
        kopf = f"<!-- preis:{pid}{':' + art if art else ''} -->"
        return kopf + marker_text(produkte[pid], art) + "<!-- /preis -->"

    def artikel(treffer):
        tag = treffer.group(0)
        pid = re.search(r'data-produkt="([^"]+)"', tag)
        if not pid:
            return tag
        eintrag = produkte.get(pid.group(1))
        if eintrag is None:
            fehlt.add(pid.group(1))
            return tag
        if eintrag.get("bester_preis") is None:
            return tag
        return re.sub(r'data-preis="[^"]*"', f'data-preis="{eintrag["bester_preis"]:.2f}"', tag, count=1)

    text = MARKER_RE.sub(marker, text)
    text = STAND_RE.sub(lambda treffer: treffer.group(1) + stand_lang(preise["geprueft"]) + treffer.group(3), text)
    text = ARTIKEL_RE.sub(artikel, text)
    for name, pid in seite.get("ld", {}).items():
        pos = text.find(f'"@type":"Product","name":"{name}"')
        treffer = OFFER_RE.search(text, pos) if pos >= 0 else None
        if treffer is None or pid not in produkte:
            raise SystemExit(f"JSON-LD-Produkt {name} ({pid}) fehlt in {seite['datei']}")
        text = text[:treffer.start()] + offer_json(produkte[pid]) + '"brand":' + text[treffer.end():]
    if fehlt:
        raise SystemExit(f"Unbekannte Produkt-IDs in {seite['datei']}: {', '.join(sorted(fehlt))}")
    return text


def datum_setzen(text, stand):
    """dateModified und article:modified_time auf den Prüfzeitpunkt setzen."""
    text = re.sub(r'("dateModified":")[0-9T:+-]+(")',
                  lambda treffer: treffer.group(1) + stand[:10] + treffer.group(2), text)
    return re.sub(r'(<meta property="article:modified_time" content=")[^"]*(")',
                  lambda treffer: treffer.group(1) + stand + treffer.group(2), text, count=1)


def preisseiten_schreiben(cfg, preise):
    """Erst alle Seiten bauen, dann schreiben. Ein Fehler bricht ab, bevor eine Seite geändert ist."""
    neu = []
    for seite in cfg.get("preisseiten", []):
        pfad = ROOT / seite["datei"]
        text = pfad.read_text(encoding="utf-8")
        ergebnis = preisseite_neu(text, seite, preise)
        if ergebnis != text:
            neu.append((pfad, datum_setzen(ergebnis, preise["geprueft"])))
    for pfad, text in neu:
        schreiben(pfad, text)
        sitemap_aktualisieren(pfad, preise["geprueft"])
    return [pfad.name for pfad, _ in neu]


# ------------------------------------------------------------------ Start

def main():
    argumente = argparse.ArgumentParser(description="Preis-Crawler für den Siebträger-Guide")
    argumente.add_argument("--quellen", default=str(QUELLEN), help="Pfad zu preis-quellen.json")
    argumente.add_argument("--nur-seite", action="store_true", help="Seite aus vorhandenen Daten neu bauen")
    argumente.add_argument("--trocken", action="store_true", help="abrufen und anzeigen, nichts schreiben")
    argumente.add_argument("--nur-historie", action="store_true",
                           help="abrufen, nur data/preis-historie.json schreiben (täglicher Messlauf)")
    args = argumente.parse_args()
    cfg = json.loads(Path(args.quellen).read_text(encoding="utf-8"))
    pfade = {name: ROOT / pfad for name, pfad in cfg["dateien"].items()}
    hist = historie_laden(pfade["historie"])
    code = 0
    if args.nur_seite:
        preise = json.loads(pfade["preise"].read_text(encoding="utf-8"))
    else:
        ergebnisse = abrufen_alle(cfg)
        jetzt = jetzt_berlin()
        geprueft = [erg for erg in ergebnisse.values() if erg["status"] not in OHNE_ERGEBNIS]
        gut = [erg for erg in geprueft if erg["status"] in MIT_ERGEBNIS]
        log(f"Ergebnis: {len(gut)} von {len(geprueft)} geprüften Quellen mit Ergebnis")
        if geprueft and len(gut) * 2 < len(geprueft):
            code = 2
        if args.trocken:
            return code
        historie_aktualisieren(hist, ergebnisse, jetzt.date().isoformat(), cfg["einstellungen"]["historie_tage"])
        historie_schreiben(pfade["historie"], hist)
        if args.nur_historie:
            log("Nur Historie: data/preise.json und Seite bleiben unverändert")
            return code
        if code:
            log("Zu wenige Ergebnisse: data/preise.json und Seite bleiben auf dem Stand der letzten Prüfung")
            return code
        preise = preise_bauen(cfg, ergebnisse, hist, jetzt)
        schreiben(pfade["preise"], json.dumps(preise, ensure_ascii=False, indent=1) + "\n")
    geaendert = seite_schreiben(pfade["seite"], block(cfg, preise, hist), preise["geprueft"])
    log("Seite aktualisiert" if geaendert else "Seite unverändert")
    if geaendert and sitemap_aktualisieren(pfade["seite"], preise["geprueft"]):
        log("lastmod in src/sitemap.xml aktualisiert")
    for name in preisseiten_schreiben(cfg, preise):
        log(f"Preisseite aktualisiert: {name} (dateModified und lastmod auf den Prüftag)")
    return code


if __name__ == "__main__":
    raise SystemExit(main())
