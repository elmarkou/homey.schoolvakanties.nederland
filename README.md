# Schoolvakanties

This app allows you to check if today, yesterday, or tomorrow is a (school) holiday in the Netherlands. It provides detailed information about school holidays in different regions (North, Central, South) and various types of holidays such as Autumn break, Christmas break, Spring break, May holidays, and Summer holidays. You can also add and manage custom holidays and get an overview of all holidays per region. The app includes tokens and flow cards for integrating holiday checks into your flows, making it easy to automate actions based on school holidays and your own custom holidays.

Check if today / yesterday / tomorrow is a (school) holiday in the Netherlands.

![image][storebackdrop]

## Acknowledgements

The open-data API from [https://www.rijksoverheid.nl/opendata/schoolvakanties](https://www.rijksoverheid.nl/opendata/schoolvakanties).

## Feedback

Please report issues at the [issues section on Github](https://github.com/elmarkou/homey.schoolvakanties.nederland/issues).

## Donate

If you like the app, you are free to sponsor.  
[![Paypal donate][pp-donate-image]][pp-donate-link]

### Release Notes

### 2.4.0
- Add triggers for custom holidays starting and ending
### 2.3.0

- Add triggers for specific school holidays starting and ending

### 2.2.8

-

### 2.2.7

- Updated app.json

### 2.2.6

- Updated app.json

### 2.2.5

- Bugfixes

### 2.2.4

- Bugfixes

### 2.2.3

- Improve storing widget data
- Added translations for "French" and "German"

### 2.2.2

- Bugfixes

### 2.2.1

- Bugfixes

#### 2.2.0

- Truncating too long texts
- Able to update the custom holidays

#### 2.1.5

- Made widget bigger

#### 2.1.4

- Added interval to fetch data and use calendar method from momentjs

#### 2.1.3

- Fix incorrect dates inside the widget

#### 2.1.2

- Bugfixes

#### 2.1.1

- Bugfixes

#### 2.1.0

- Added widget for upcoming (school) holiday

#### 2.0.0

- You are now able to manage your own custom holidays via settings.

#### 1.1.8

- After latest holiday, fetch holidays for next year

#### 1.1.7

- Update fix for year listings
- Change settings page from iframe to data from API

#### 1.1.6

- Update settings page

#### 1.1.5

- Fix switching current years calendar

#### 1.1.4

- Fix getting correct calendar data

#### 1.1.3

- Added Regions to settingspage and change labelnames.

#### 1.1.2

- Added settingspage with overview of school holidays

#### 1.1.1

- Added caching to prevent multiple API Calls

#### 1.1.0

- Added new condition to specify the type of school holiday

#### 1.0.3

- Added token documentation

#### 1.0.2

- Added tokens for School holiday today, yesterday and tomorrow.

#### 1.0.1

- First version for app store.

[pp-donate-link]: https://www.paypal.me/elmarkouwenhoven
[pp-donate-image]: https://www.paypalobjects.com/webstatic/en_US/i/btn/png/btn_donate_92x26.png
[storebackdrop]: https://github.com/elmarkou/homey.schoolvakanties.nederland/raw/master/assets/images/large.png
