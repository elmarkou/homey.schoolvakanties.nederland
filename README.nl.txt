Schoolvakanties in Nederland – Controleer eenvoudig de vakanties!

Met deze app kun je snel bepalen of het vandaag, gisteren of morgen een schoolvakantie is in Nederland. Het biedt uitgebreide informatie over vakanties in verschillende regio's (Noord, Midden, Zuid) en verschillende soorten vakanties zoals herfstvakantie, kerstvakantie, voorjaarsvakantie, meivakantie en zomervakantie. Je kunt ook aangepaste vakanties toevoegen en beheren en een overzicht krijgen van alle vakanties per regio. De app bevat tokens voor het integreren van vakantiecontroles in je workflows, waardoor het eenvoudig is om acties te automatiseren op basis van school- en aangepaste vakanties.

Functies:

- Controleer of het vandaag, gisteren of morgen een vakantie is in Regio Noord, Regio Midden of Regio Zuid.
- Krijg details over specifieke vakanties zoals herfstvakantie, kerstvakantie, voorjaarsvakantie, meivakantie en zomervakantie.
- Beheer je eigen vakanties: voeg aangepaste vakanties toe of verwijder irrelevante vakanties.
- Bekijk een compleet overzicht van alle schoolvakanties per regio in Nederland.
- Gebruik de widget om toe te voegen aan je dashboard, waarbij de volgende aankomende vakantie of een specifieke gekozen vakantie wordt weergegeven.

## Triggers (WHEN)

- Any school holiday starts in a region (`holiday_starts`): triggert wanneer een schoolvakantie vandaag begint in de gekozen regio. Argument: `regio` (noord/midden/zuid). Token: `holiday_name`.
- Any school holiday ends in a region (`holiday_ends`): triggert wanneer een schoolvakantie vandaag eindigt in de gekozen regio. Argument: `regio`. Token: `holiday_name`.
- A specific school holiday starts in a region (`specific_holiday_starts`): triggert wanneer de geselecteerde vakantie vandaag begint in de gekozen regio. Argumenten: `regio` en `holiday` (herfstvakantie, kerstvakantie, voorjaarsvakantie, meivakantie, zomervakantie). Token: `holiday_name`.
- A specific school holiday ends in a region (`specific_holiday_ends`): triggert wanneer de geselecteerde vakantie vandaag eindigt in de gekozen regio. Argumenten: `regio` en `holiday`. Token: `holiday_name`.

Alle triggers worden één keer per dag rond middernacht uitgevoerd; er is geen continue polling en geen geheugen- of prestatie-impact.

Voorbeelden flows:

- Stel dat je ochtendwekker afgaat. Als het geen schoolvakantie is, laat de wekker dan ochtendmuziek afspelen.
- Als het kerstvakantie is, kun je in plaats daarvan feestelijke kerstliedjes afspelen.
- Als het een (school)vakantie is, kun je je wekker overslaan.

Blijf op de hoogte van school- en aangepaste vakanties en pas je plannen dienovereenkomstig aan met deze tool!