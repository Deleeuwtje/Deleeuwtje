# Visuele stijlrichting

## Kern

Het scherm draait om de speelwereld. Er is geen pagina met een kleine game naast lappen tekst: de pixelwereld vult het hele venster. De interface is een dunne, rustige laag die de wereld niet verdringt.

## Wereld en camera

- De camera volgt Aven soepel en houdt die iets onder het midden, zodat je meer van het pad vóór je ziet.
- Veldhaven is één doorlopende map: huizen, bakkerij, dorpsplein, klokkentoren, waterput, rivier, noordpoort en heuvelkam liggen in dezelfde wereld.
- De Asberg gebruikt hetzelfde systeem met lavastromen, rails, basalt, kristallen en oude machines.
- De renderer tekent grond, wegen en water, gebouwen en rotsen, personen en voorgrond in lagen. Personen worden op hun voetpositie gesorteerd zodat diepte leesbaar is.
- De wereld gebruikt pixel-perfect rendering. Tekst blijft scherp en krijgt geen pixel-filter.

## Sprites

- Aven heeft een herkenbare sprite met jas, sjaal, gereedschap, haar en een korte loopcyclus.
- Oda, Rin, de reiziger, dorpelingen, lavahonden en de lavawachter hebben eigen silhouetten en kleurpaletten.
- Omgevingssprites bevatten huizen, bomen, de waterput, klokkentoren, grotopening, druksluizen en vulkanische machines.
- Animatie blijft beperkt tot lopen, subtiele idle-bewegingen, water, lavagloed en een zwevende interactiemarkering.

## Gesprekken

Verhaal komt via mensen en plekken in de wereld. De speler loopt naar een NPC of object, krijgt een korte hint en start een gesprek met E, Enter, spatie of een klik.

Dialogen staan onderaan als een compact venster met een portret, naam en één korte tekststap. Pas daarna verschijnen keuzes. De spelwereld blijft zichtbaar achter het gesprek, waardoor plaats en personage deel blijven van het verhaal.

## Interface

- Links boven: plaats en de huidige opdracht.
- Rechts boven: tas en verhalen.
- Midden onder: alleen een hint wanneer Aven dicht genoeg bij een interactiepunt staat.
- De tas toont voorwerpen die tussen afleveringen meegaan en laat relevante uitrusting aantrekken.
- Mobiel: dialoog blijft onderin, doel en knoppen blijven compact.

## Kleuren

Veldhaven gebruikt mosgroen, rivierblauw, warm hout, oogstgeel en koper. De Asberg gebruikt basaltgrijs, asviolet, donkerbruin en lava-oranje. Dialogen zijn warm papier met donkergroene tekst, voor leesbaarheid zonder de wereld te verdringen.

## Toegankelijkheid

Bewegen werkt met WASD of pijltjestoetsen. Gesprekken en onderzoeken werken met E, Enter of spatie. Bedieningsknoppen krijgen zichtbare focus. Dialogen gebruiken semantische knoppen en live-updates. Bij gereduceerde beweging zijn overgangen minimaal.
