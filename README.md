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
npm start
```

- Speisekarte: http://localhost:3000/
- Küche: http://localhost:3000/kitchen

Der Port kann über die Umgebungsvariable `PORT` angepasst werden.

## Speisekarte anpassen

Gerichte, Preise und Kategorien liegen in `data/menu.json` und können direkt bearbeitet werden.

## Nächste Schritte für den echten Betrieb

- Hosting (z.B. auf einem kleinen Server/VPS) und eigene Domain/HTTPS
- Optional: Login/PIN für die Küchen-Ansicht, Bezahlfunktion, Bestellhistorie/Statistiken
