# Architectuur

## Doel en huidige status
Een browsergebaseerde, korte verhalen-RPG rond dezelfde held. De eerste twee afleveringen zijn als data toegevoegd; aflevering 1 is een korte introductieroute en aflevering 2 is nu een speelbare opening plus een uitgewerkte vierdelige ontwerpoutline. De laatste is nog geen vier uur aan speelbare content.

## Stack en runtime
- Vite + TypeScript, zonder UI-framework of externe runtime-dependencies.
- Statische browserapp; voortgang wordt lokaal per browser bewaard.
- TypeScript strict mode en aanvullende checks op ontbrekende waarden en control-flow fouten.

## Afhankelijkheidsrichting
    presentatie → applicatie → domein
                      ↑          ↑
                 infrastructuur ┘

- Domein (src/domain): verhaalstructuur, sessiestatus, campaign-profiel en zuivere overgangen; geen DOM of browser-opslag.
- Content (src/content): afleveringen als data; keuzes verwijzen via stabiele scène-ID's.
- Applicatie: GameController valideert content en coördineert keuzes.
- Presentatie (src/ui): pixelwereld en schermen tonen data en sturen intenties door.
- Infrastructuur: browseropslag en andere platform-adapters.

## Campagne en content
Een verhaal heeft een ID, titel, startscène en scènes. Scènes hebben locatie, tekst, encountertype en keuzes. De validator controleert scène-ID's en verwijzingen. Een sessie slaat alleen scène- en keuze-ID's op. Het campagneprofiel is los van de sessie en houdt inventaris, uitrusting, upgrades en vrijgespeelde verhalen bij, zodat vondsten meegaan naar volgende afleveringen.

## Opslag
Voortgang staat in versie-gemarkeerde lokale browseropslag. JSON uit opslag wordt als onbetrouwbare invoer behandeld. Opslag kan uitgeschakeld of vol zijn; doorspelen mag dan niet crashen. De huidige versie heeft eenvoudige versie-sleutels; migraties zijn nodig zodra het opslagformaat verandert.

## Indeling
    src/
      application/    use-cases en coördinatie
      content/        afleveringdata
      domain/         regels, sessies en campagneprofiel
      infrastructure/ opslagadapters
      ui/             pixelwereld en presentatie
      main.ts         app-startpunt
      styles.css
    docs/               architectuur en verhaalbijbel
    styles.md           visuele richting

## Betrouwbaarheidsafspraken
- Houd domeintransities deterministisch en zonder verborgen browserstatus.
- Valideer content en saves waar data de applicatie binnenkomt.
- Sla stabiele ID's op, geen volledige scènekopieën.
- Houd UI semantisch, toetsenbordbedienbaar en vriendelijk voor gereduceerde beweging.
- Gevechten en puzzels mogen optioneel zijn; voorkom dat keuzes de hoofdroute onbereikbaar maken.
- Voeg lockfile en automatische checks toe wanneer de installatie/CI wordt ingericht.

## Lokaal starten
Op Windows PowerShell: npm.cmd install, npm.cmd run dev, npm.cmd run typecheck en npm.cmd run build.
