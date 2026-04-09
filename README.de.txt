Schulferien in den Niederlanden – Einfach den Ferienstatus überprüfen!

Diese App ermöglicht es Ihnen, schnell festzustellen, ob heute, gestern oder morgen ein Schulferientag in den Niederlanden ist. Sie bietet umfassende Informationen über Ferien in verschiedenen Regionen (Nord, Mitte, Süd) und verschiedene Arten von Ferien wie Herbstferien, Weihnachtsferien, Frühlingsferien, Maiferien und Sommerferien. Sie können auch benutzerdefinierte Ferien verwalten und einen Überblick über alle Ferien pro Region erhalten. Die App enthält Tokens zur Integration von Ferienprüfungen in Ihre Workflows, sodass Sie Aktionen basierend auf Schul- und benutzerdefinierten Ferien einfach automatisieren können.

Funktionen:

- Überprüfen Sie, ob heute, gestern oder morgen ein Ferientag in Region Nord, Region Mitte oder Region Süd ist.
- Erhalten Sie Details zu bestimmten Ferien wie Herbstferien, Weihnachtsferien, Frühlingsferien, Maiferien und Sommerferien.
- Verwalten Sie Ihre eigenen Ferien: Fügen Sie benutzerdefinierte Ferien hinzu oder entfernen Sie irrelevante.
- Sehen Sie sich eine vollständige Übersicht aller Schulferien nach Region in den Niederlanden an.
- Verwenden Sie das Widget, um es Ihrem Dashboard hinzuzufügen und die nächste bevorstehende Ferien oder eine bestimmte ausgewählte Ferien anzuzeigen.

## Auslöser (WHEN)

- `holiday_starts`: Löst einen Flow aus, wenn heute eine Schulferien in der ausgewählten Region beginnt. Argument: `regio` (noord/midden/zuid). Token: `holiday_name`.
- `holiday_ends`: Löst einen Flow aus, wenn heute eine Schulferien in der ausgewählten Region endet. Argument: `regio`. Token: `holiday_name`.
- `specific_holiday_starts`: Löst einen Flow aus, wenn eine bestimmte Ferien heute in der ausgewählten Region beginnt. Argumente: `regio` und `holiday` (herfstvakantie, kerstvakantie, voorjaarsvakantie, meivakantie, zomervakantie). Token: `holiday_name`.
- `specific_holiday_ends`: Löst einen Flow aus, wenn eine bestimmte Ferien heute in der ausgewählten Region endet. Argumente und Token sind dieselben.

Alle Auslöser werden einmal pro Tag um Mitternacht ausgeführt; es gibt kein kontinuierliches Polling und keine Speicher- oder Leistungsbeeinträchtigung.

Beispielanwendung:

- Angenommen, Ihr Morgenwecker klingelt. Wenn es kein Schulferientag ist, lassen Sie den Wecker Morgenaufwachmusik spielen.
- Wenn es Weihnachtsferien sind, können Sie stattdessen festliche Feiertagsmusik wählen.
- Wenn es ein (Schul-)Ferientag ist, können Sie Ihren Wecker überspringen.

Bleiben Sie über Schul- und benutzerdefinierte Ferien informiert und passen Sie Ihre Pläne entsprechend mit diesem Tool an!