School Holidays in the Netherlands – Easily Check Holiday Status!

This app allows you to quickly determine if today, yesterday, or tomorrow is a school holiday in the Netherlands. It provides comprehensive information about holidays in different regions (North, Central, South) and various types of holidays such as Autumn break, Christmas break, Spring break, May holidays, and Summer holidays. You can also add and manage custom holidays and get an overview of all holidays per region. The app includes tokens for integrating holiday checks into your workflows, making it easy to automate actions based on school and custom holidays.

Features:

- Check if today, yesterday, or tomorrow is a holiday in Region North, Region Central, or Region South.
- Get details on specific holidays like Autumn Break, Christmas Break, Spring Break, May Break, and Summer Break.
- Manage your own holidays: add custom holidays or remove irrelevant ones.
- View a complete overview of all school holidays by region in the Netherlands.
- Use the widget to add to your dashboard, displaying the next upcoming holiday or a specific chosen holiday.

Trigger cards (WHEN):

- `holiday_starts`: Trigger a flow when any school holiday starts today in the selected region. Argument: `regio` (noord/midden/zuid). Token: `holiday_name`.
- `holiday_ends`: Trigger a flow when any school holiday ends today in the selected region. Argument: `regio`. Token: `holiday_name`.
- `specific_holiday_starts`: Trigger a flow when a specific holiday starts today in the selected region. Arguments: `regio` and `holiday` (herfstvakantie, kerstvakantie, voorjaarsvakantie, meivakantie, zomervakantie). Token: `holiday_name`.
- `specific_holiday_ends`: Trigger a flow when a specific holiday ends today in the selected region. Arguments and token are the same as above.

All triggers fire once per day at midnight, not continuously. No memory or performance impact.

Example use case:

- Suppose your morning alarm goes off. If it's not a school holiday, let the alarm play morning wake-up music.
- If it’s Christmas Break, you can choose festive holiday tunes instead.
- If it's a (school) holiday, you can skip your alarm clock.

Stay informed about school and custom holidays and adjust your plans accordingly with this tool!