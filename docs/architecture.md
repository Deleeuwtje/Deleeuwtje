# Architectuur

## Doel en huidige status

Een browser-RPG rond Aven. De game speelt in een doorlopende pixelwereld met een camera die Aven volgt. Personages en plaatsen starten korte, keuze-gedreven dialogen. Aflevering 1 is de introductieroute. Aflevering 2 bevat de speelbare hoofdroute van het vulkaanverhaal, maar is nog niet vier uur lang uitgewerkt.

## Stack

- Vite + strict TypeScript zonder externe runtime-dependencies.
- Canvas 2D voor de wereld; HTML voor dialoog, doelen en bediening.
- Lokale browseropslag voor campagnestatus en de actuele scène per aflevering.

## Grenzen

- src/domain: pure verhaal-, sessie- en campagneregels.
- src/content: verhaaldata, NPC- en wereldposities.
- src/application: valideert content en voert verhaalkeuzes uit.
- src/ui: rendert camera, map, sprites en invoer.
- src/main.ts: koppelt wereldinteracties, dialoog, opslag en de campagne.

## Wereldrenderer

De renderer gebruikt een 480 × 270 intern pixelcanvas dat schermvullend wordt geschaald. De map is 1280 × 720 wereldeenheden. Aven beweegt binnen die grens en de camera volgt met lichte vertraging. Kaartdecor, objecten en personen worden in lagen getekend. Personen worden op voetpositie gesorteerd om diepte te suggereren.

Elke verhaal-scène heeft via worldForScene één actief interactiepunt: bijvoorbeeld Oda, Rin, de klokkentoren of een lavamonster. Andere dorpelingen blijven zichtbaar als sfeerpersonages. De renderer geeft alleen een interactie door wanneer Aven dichtbij staat.

## Dialoog en voortgang

Een gesprek toont één tekstdeel tegelijk in een HTML-paneel en laat daarna keuzes zien. Een keuze past de pure GameController-sessie aan, kent eventuele vondsten toe en verplaatst het actieve interactiepunt. De wereld blijft zichtbaar tijdens gesprekken.

Het campagnedossier staat los van de scènevoortgang. Het bevat inventaris, uitrusting, upgrades en voltooide afleveringen. Daardoor kan een gevonden voorwerp later een gesprek, route of mechaniek openen.

## Lokaal starten

Op Windows PowerShell:

    npm.cmd install
    npm.cmd run dev
    npm.cmd run typecheck
    npm.cmd run build
