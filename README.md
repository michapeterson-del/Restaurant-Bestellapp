# Restaurant-Bestellapp

Gäste bestellen über ihr Handy mit ihrem Namen, die Küche sieht neue Bestellungen live auf einem Bildschirm.

## Funktionsweise

- **Gäste-Ansicht** (`/`): Name eingeben, Gerichte antippen, Bestellung senden. Kein Warenkorb-Popup,
  keine Tischnummer — einfach Name + Bestellung.
- **Küchen-Ansicht** (`/kitchen`): zeigt eingehende Bestellungen live in drei Spalten
  (Neu → In Zubereitung → Fertig) inklusive Signalton bei neuer Bestellung, mit dem Namen der
  bestellenden Person.

Die Kommunikation läuft über Socket.IO (Echtzeit) plus eine kleine REST-API. Bestellungen
werden in `data/orders.json` gespeichert (übersteht einen Neustart).

## Installation & Start

```bash
npm install
KITCHEN_PASSWORD=dein-kuechen-passwort npm start
```

`KITCHEN_PASSWORD` ist Pflicht (mind. 8 Zeichen): Die Küchen-Ansicht und die Bestell-API
fragen danach (Benutzername beliebig). Bei Render unter **Environment** eintragen.

- Speisekarte: http://localhost:3000/
- Küche: http://localhost:3000/kitchen

Der Port kann über die Umgebungsvariable `PORT` angepasst werden.

## Speisekarte anpassen

Gerichte, Preise und Kategorien liegen in `data/menu.json` und können direkt bearbeitet werden.

## Online stellen (kostenlos über Render.com)

Damit Gäste und Küche die App über das Internet erreichen (nicht nur `localhost`), am
einfachsten über [Render](https://render.com) hosten:

1. Auf [render.com](https://render.com) mit dem GitHub-Account einloggen/registrieren.
2. **New +** → **Web Service** klicken und dieses Repository auswählen
   (`michapeterson-del/Restaurant-Bestellapp`), Branch `claude/mobile-order-app-kitchen-4qjqoh`
   (oder `main`, sobald gemergt).
3. Render erkennt die `render.yaml` automatisch:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: Free
4. **Create Web Service** klicken und ein paar Minuten warten, bis der Status "Live" ist.
5. Render zeigt eine feste Adresse an, z.B. `https://restaurant-bestellapp.onrender.com`.
   - Speisekarte für Gäste: diese Adresse direkt
   - Küchen-Ansicht: dieselbe Adresse + `/kitchen`

Hinweis zum kostenlosen Plan: Die App "schläft" nach ca. 15 Minuten ohne Aufrufe ein und
braucht beim nächsten Aufruf ca. 30–50 Sekunden zum Aufwachen. Für den echten Betrieb (keine
Wartezeit, eigene Domain) lohnt sich später ein bezahlter Plan (ca. 7 $/Monat).

## Nächste Schritte für den echten Betrieb

- Eigene Domain statt der `onrender.com`-Adresse
- Optional: Bezahlfunktion, Bestellhistorie/Statistiken
