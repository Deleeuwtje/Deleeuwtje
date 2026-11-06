# Architectuur

## Doel
Een browsergebaseerde, korte verhalende RPG. Verhaalinhoud wordt later als data toegevoegd; engine en interface hoeven dan niet per verhaal herschreven te worden. De huidige app toont alleen een startscherm en bevat geen speelbaar verhaal.

## Stack en runtime
- Vite + TypeScript, zonder UI-framework of externe runtime-dependencies.
- Statische browserapp. Geen server, accounts, analytics of netwerktoegang nodig.
- TypeScript strict mode en aanvullende checks op ontbrekende waarden en control-flow fouten.

## Afhankelijkheidsrichting
    presentatie → applicatie → domein
                      ↑          ↑
                 infrastructuur ┘

- Domein (src/domain): verhaalstructuur, sessiestatus en zuivere overgangen; geen browser-API's.
- Applicatie (src/application): orkestreert domeinacties en bewaakt content bij het starten.
- Infrastructuur (src/infrastructure): adapters voor browseropslag.
- Presentatie (src/ui): schermen tonen toestand en sturen intenties door; geen spelregels.
- Content wordt los toegevoegd en gevalideerd bij het laden.

## Content en sessies
Een verhaal heeft een ID, titel, startscène en scènes. Elke scène heeft een titel, paragrafen en keuzes met verwijzingen naar volgende scènes. De validator controleert unieke ID's, een geldige startscène en bestaande doel-scènes.

Een sessie bewaart alleen stabiele ID's: huidig/bezochte scènes en gekozen keuzes. chooseOption is een pure overgang: een ongeldige keuze verandert de sessie niet. Nieuwe systemen (inventaris, relaties, variabelen) horen later in expliciete domeintypes en regels, niet als losse UI-voorwaarden.

## Opslag
Savebestanden zijn JSON-enveloppen met een versienummer. Data wordt bij het lezen als onbetrouwbaar behandeld. Schemawijzigingen vereisen migratie of gecontroleerde afwijzing. Browseropslag kan ontbreken of vol zijn; de game moet dan gecontroleerd doorgaan zonder crash.

## Projectindeling
    src/
      application/    use-cases en coördinatie
      domain/         contentcontracten en pure spelregels
      infrastructure/ browser-API-adapters
      ui/             presentatie
      main.ts         app-startpunt
      styles.css
    docs/               architectuur
    styles.md           visuele richting

## Betrouwbaarheidsafspraken
- Houd domeintransities deterministisch en zonder verborgen browserstatus.
- Valideer content en saves bij grenzen waar data binnenkomt.
- Sla geen volledige scènekopieën op; gebruik stabiele ID's.
- Houd UI semantisch, toetsenbordbedienbaar en vriendelijk voor gereduceerde beweging.
- Voeg lockfile en geautomatiseerde checks toe wanneer installatie en CI worden ingericht.

## Lokale commando's
npm install · npm run dev · npm run typecheck · npm run build · npm run preview
