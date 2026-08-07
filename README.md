# Restaurant-Bestellapp

Gäste bestellen über ihr Handy, die Küche sieht neue Bestellungen live auf einem Bildschirm.

## Funktionsweise

- **Gäste-Ansicht** (`/`, z.B. `/?tisch=5`): mobile Speisekarte, Warenkorb, Bestellung senden.
  Am besten pro Tisch einen QR-Code mit dem Link `https://<domain>/?tisch=<Tischnummer>` aufstellen.
- **Küchen-Ansicht** (`/kitchen`): zeigt eingehende Bestellungen live in drei Spalten
  (Neu → In Zubereitung → Fertig) inklusive Signalton bei neuer Bestellung.

Die Kommunikation läuft über Socket.IO (Echtzeit) plus eine kleine REST-API. Bestellungen
werden in `data/orders.json` gespeichert (übersteht einen Neustart).

## Installation & Start

```bash
npm install
npm start
```

- Speisekarte: http://localhost:3000/?tisch=1
- Küche: http://localhost:3000/kitchen

Der Port kann über die Umgebungsvariable `PORT` angepasst werden.

## Speisekarte anpassen

Gerichte, Preise und Kategorien liegen in `data/menu.json` und können direkt bearbeitet werden.

## Nächste Schritte für den echten Betrieb

- Hosting (z.B. auf einem kleinen Server/VPS) und eigene Domain/HTTPS
- QR-Codes pro Tisch generieren, die auf `/?tisch=<Nummer>` verlinken
- Optional: Login/PIN für die Küchen-Ansicht, Bezahlfunktion, Bestellhistorie/Statistiken
