# Architectuur

## Doel en grenzen

Deze repository is de basis voor een korte, verhalende browser-RPG. Deze eerste stap bevat alleen de technische app-shell en ontwikkelconfiguratie; er is nog geen verhaal, spelwereld, spelmechaniek of opgeslagen voortgang.

## Technologiekeuze

- **Vite + TypeScript** voor een snelle lokale ontwikkelserver en een statische browserbuild.
- **Vanilla DOM** voorlopig, zodat er geen UI-framework of runtime-abonnement nodig is voordat de interface daarom vraagt.
- **Browser als runtime**. Er is geen server, account, analytics of netwerktoegang nodig voor de basis.
- **TypeScript strict mode** plus checks op onbedoelde ontbrekende waarden en control-flow fouten.

## Beoogde grenzen

Als spelcode wordt toegevoegd, houd de afhankelijkheden in deze richting:

```text
UI / presentatie
      ↓
applicatie (use-cases en coördinatie)
      ↓
domein (regels en state, zonder browser-API's)
      ↑
infrastructuur (opslag, audio, platform-API's)
```

- **Domein:** pure regels en getypeerde speldata; geen DOM, opslag of netwerk.
- **Applicatie:** orkestreert acties en valideert overgangen tussen toestanden.
- **Infrastructuur:** implementeert interfaces voor browseropslag en andere externe API's.
- **Presentatie:** toont toestand en stuurt gebruikersacties door; bevat geen spelregels.
- Verhaal en content blijven data, los van de code die ze afspeelt.

## Betrouwbaarheidsafspraken

- Valideer data die van buiten het domein komt, zoals opgeslagen voortgang.
- Geef save-data een schema-versie en migreer versies expliciet; verwijder corrupte data gecontroleerd.
- Houd domeinfuncties deterministisch waar dat kan, zodat spelregels later eenvoudig te testen zijn.
- Behandel opslaan als een optionele adapter: de game moet gecontroleerd kunnen starten als browseropslag ontbreekt.
- Voeg dependency-lockfile en geautomatiseerde checks toe zodra de lokale projectinstallatie is ingericht.
- Voeg geen backend toe zolang er geen concrete online functie (zoals accounts of multiplayer) nodig is.

## Projectstructuur

```text
src/
  main.ts       # app-startpunt en mountcontrole
  styles.css    # globale basisstijl
docs/
  architecture.md
```

## Lokale commando's

- `npm install` installeert de ontwikkeltools.
- `npm run dev` start de lokale ontwikkelserver.
- `npm run typecheck` voert alleen TypeScript-controle uit.
- `npm run build` controleert types en bouwt de statische site.
- `npm run preview` serveert de gebouwde site lokaal.

