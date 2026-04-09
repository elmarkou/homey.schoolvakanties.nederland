Vacances Scolaires aux Pays-Bas – Vérifiez facilement le statut des vacances !

Cette application vous permet de déterminer rapidement si aujourd'hui, hier ou demain est un jour de vacances scolaires aux Pays-Bas. Elle fournit des informations complètes sur les vacances dans différentes régions (Nord, Centre, Sud) et divers types de vacances telles que les vacances d'automne, les vacances de Noël, les vacances de printemps, les vacances de mai et les vacances d'été. Vous pouvez également gérer des vacances personnalisées et obtenir un aperçu de toutes les vacances par région. L'application inclut des jetons pour intégrer les vérifications des vacances dans vos flux de travail, ce qui facilite l'automatisation des actions basées sur les vacances scolaires et personnalisées.

Caractéristiques :

- Vérifiez si aujourd'hui, hier ou demain est un jour de vacances dans la région Nord, la région Centre ou la région Sud.
- Obtenez des détails sur des vacances spécifiques comme les vacances d'automne, les vacances de Noël, les vacances de printemps, les vacances de mai et les vacances d'été.
- Gérez vos propres vacances : ajoutez des vacances personnalisées ou supprimez celles qui sont non pertinentes.
- Consultez un aperçu complet de toutes les vacances scolaires par région aux Pays-Bas.
- Utilisez le widget pour ajouter à votre tableau de bord, affichant la prochaine vacance à venir ou une vacance spécifique choisie.

## Déclencheurs (WHEN)

- `holiday_starts`: Déclenche un flux lorsqu'une vacance scolaire commence aujourd'hui dans la région sélectionnée. Argument: `regio` (noord/midden/zuid). Jeton: `holiday_name`.
- `holiday_ends`: Déclenche un flux lorsqu'une vacance scolaire se termine aujourd'hui dans la région sélectionnée. Argument: `regio`. Jeton: `holiday_name`.
- `specific_holiday_starts`: Déclenche un flux lorsqu'une vacance spécifique commence aujourd'hui dans la région sélectionnée. Arguments: `regio` et `holiday` (herfstvakantie, kerstvakantie, voorjaarsvakantie, meivakantie, zomervakantie). Jeton: `holiday_name`.
- `specific_holiday_ends`: Déclenche un flux lorsqu'une vacance spécifique se termine aujourd'hui dans la région sélectionnée. Arguments et jeton identiques.

Tous les déclencheurs s'exécutent une fois par jour à minuit; il n'y a pas de polling continu et aucun impact mémoire ou performance.

Exemple d'utilisation :

- Supposons que votre réveil du matin se déclenche. Si ce n'est pas un jour de vacances scolaires, laissez l'alarme jouer de la musique de réveil matinale.
- Si c'est les vacances de Noël, vous pouvez choisir des airs festifs de vacances à la place.
- Si c'est un jour de vacances (scolaires), vous pouvez ignorer votre réveil.

Restez informé des vacances scolaires et personnalisées et ajustez vos plans en conséquence avec cet outil !