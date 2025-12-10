[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/integration)
[![GitHub release](https://img.shields.io/github/release/jayjojayson/Sun-Position-Card?include_prereleases=&sort=semver&color=blue)](https://github.com/jayjojayson/Sun-Position-Card/releases/)
[![GH-code-size](https://img.shields.io/github/languages/code-size/jayjojayson/Sun-Position-Card?color=blue)](https://github.com/jayjojayson/Sun-Position-Card)
[![README English](https://img.shields.io/badge/README-Eng-orange)](https://github.com/jayjojayson/Sun-Position-Card/blob/main/docs/README-eng.md)

# Sun Position Card

This is a custom card for Home Assistant that displays the sun's position with custom images and details.

## Installation

### HACS (Recommended)

 [![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=jayjojayson&repository=Sun-Position-Card&category=plugin)

1.  Open HACS in Home Assistant.
2.  Go to "Frontend" and click the three dots in the top right corner.
3.  Select "Custom repositories".
4.  Add the URL to your GitHub repository and select "Lovelace" as the category.
5.  Click "ADD".
6.  The "Sun Position Card" should now be available in HACS. Click "INSTALL".
7.  The resource will be added to your Lovelace configuration automatically.

### Manual Installation

1.  Download the `sun-position-card.js`, `sun-position-card-editor.js` and the `images` folder from the `dist` directory.
2.  Place the `sun-position-card.js` and `sun-position-card-editor.js` files and the `images` folder in `config/www/community/Sun-Position-Card/dist/`. You will have to create the `community` and `sun-position-card` folders.
3.  Add the resource to your Lovelace configuration through the Home Assistant UI:
    a. Go to "Settings" -> "Dashboards".
    b. Click on the three dots in the top right corner and select "Resources".
    c. Click on "+ ADD RESOURCE".
    d. Enter `/local/community/Sun-Position-Card/dist/sun-position-card.js` as the URL and select "JavaScript Module" as the Resource type.
    e. Click "CREATE".
4.  Restart Home Assistant.

## Configuration

### Options

| name                  | typ      | required   | description                                                                                                 | standard                                 |
| --------------------- | -------- | ---------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `type`                | `string` | Yes        | `custom:sun-custom-card`                                                                                    |                                          |
| `entity`              | `string` | Yes        | Die Entität Ihrer Sonne, normalerweise `sun.sun`.                                                               |                                          |
| `times_to_show`       | `list`   | No         | Eine Liste von Zeiten, die angezeigt werden sollen. Mögliche Werte: `next_rising`, `next_setting`, `next_dawn`, `next_dusk`, `next_noon`, `next_midnight`. | `['next_rising', 'next_setting']`        |
| `time_position`       | `string` | No         | Position der Zeitangaben im Verhältnis zum Bild. Mögliche Werte: `above`, `below`, `right`.                 | `below`                                  |
| `morning_azimuth`     | `number` | No         | Azimut-Grenzwert für den Morgen.                                                                            | `150`                                    |
| `noon_azimuth`        | `number` | No         | Azimut-Grenzwert für den Mittag.                                                                            | `200`                                    |
| `afternoon_azimuth`   | `number` | No         | Azimut-Grenzwert für den Nachmittag.                                                                        | `255`                                    |
| `dusk_elevation`      | `number` | No         | Höhen-Grenzwert für die Dämmerung.                                                                          | `10`                                     |



```yaml
type: custom:sun-position-card
entity: sun.sun
show_image: true
state_position: in_list
show_dividers: true
show_degrees: false
show_degrees_in_list: false
times_to_show:
  - next_rising
  - next_setting
```

---

## CSS elements you can target for styling:

| Selector                | Description                                                                 |
| ----------------------- | --------------------------------------------------------------------------- |
| `ha-card`               | The entire card container.                                                  |
| `.card-content`         | The main container wrapping all elements inside the card.                   |
| `.sun-image-container`  | The container `<div>` for the sun image.                                    |
| `.sun-image`            | The image `<img>` element itself.                                           |
| `.times-container`      | The container for the list of times.                                        |
| `.time-entry`           | An individual row/entry in the times list (e.g., "Aufgang: 06:30").         |
| `.state`                | The current state text (e.g., "Mittag") when positioned above the image.    |
| `.degrees`              | The Azimuth/Elevation text when positioned above the image.                 |
| `.degrees-in-list`      | The Azimuth/Elevation text when positioned inside the times list.           |
| `.divider`              | The horizontal line `<hr>` used as a separator between time entries.        |

### Beispiele

Hier sind einige Beispiele, wie Sie `card-mod` in der YAML-Konfiguration Ihrer Card verwenden können.

#### Schriftgröße und Farbe ändern

Macht den Hauptstatus-Text größer und blau und die Zeiteinträge etwas kleiner und grau.

```yaml
type: custom:sun-position-card
entity: sun.sun
state_position: above # State must be 'above' to see the effect on .state
card_mod:
  style: |
    .state {
      font-size: 24px;
      color: dodgerblue;
    }
    .time-entry {
      font-size: 14px;
      color: #888;
    }
```

#### Bild bearbeiten

Fügt dem Bild einen Rahmen hinzu und macht es leicht transparent und zoomt etwas heraus.

```yaml
type: custom:sun-position-card
entity: sun.sun
card_mod:
  style: |
    .sun-image {
      border: 2px solid var(--primary-color);
      border-radius: 10px;
      opacity: 0.9;
    }
```

#### Background ändern und Shadows entfernen

Setzt einen hellgelben Hintergrund für die Card und entfernt den standardmäßigen Schatten (Box Shadow).

```yaml
type: custom:sun-position-card
entity: sun.sun
card_mod:
  style: |
    ha-card {
      background: #FFFACD;
      box-shadow: none;
    }
```

#### Trennlinien bearbeiten

Macht die Trennlinie dicker und formatiert sie als gestrichelte rote Linie.

```yaml
type: custom:sun-position-card
entity: sun.sun
show_dividers: true
card_mod:
  style: |
    .divider {
      border-top: 2px dashed red;
    }
```
