[![hacs_badge](https://img.shields.io/badge/HACS-Default%20✔-brightgreen.svg)](https://github.com/hacs/plugin)
[![HACS validation](https://img.shields.io/github/actions/workflow/status/jayjojayson/Sun-Position-Card/validate.yml?label=HACS%20Validation)](https://github.com/jayjojayson/Sun-Position-Card/actions?query=workflow%3Avalidate)
[![GitHub release](https://img.shields.io/github/release/jayjojayson/Sun-Position-Card?include_prereleases=&sort=semver&color=blue)](https://github.com/jayjojayson/Sun-Position-Card/releases/)
![File size](https://img.shields.io/github/size/jayjojayson/Sun-Position-Card/dist/sun-position-card.js?label=Card%20Size)
![last commit](https://img.shields.io/github/last-commit/jayjojayson/Sun-Position-Card)
[![README Deutsch](https://img.shields.io/badge/README-DE-orange)](https://github.com/jayjojayson/Sun-Position-Card/blob/main/docs/README-de.md)
![stars](https://img.shields.io/github/stars/jayjojayson/Sun-Position-Card)

<img width="100%" height="auto" alt="sun-position-card-ubersicht" src="https://github.com/jayjojayson/Sun-Position-Card/blob/main/docs/sun-position-card-ubersicht.png" />

---


# :sunny: Sun Position Card

The Sun Position Card is a custom Lovelace Card that visualizes the current sun position with various options, as well as the current moon phase and other relevant solar times. 
The card is fully configurable via the card editor interface. You will need the `sun.sun` entity, which is provided by Home Assistant once your home location is configured. 
The `moon.phase` entity is optional and is only required to display the current moon phase.

To get the moon sensor, go to Settings → Devices & Services → Add integration and search for "Moon." This is Home Assistant's built-in moon integration.

Translation for English, German and Italian are included. If you need other translation, tell me.

If you like the Card, I would appreciate a Star rating ⭐ from you. 🤗

## Features
- ### 🔆 **Sun Position – Classic Display**  
- ### 🌅 **Sun Position – Calculated Display**  
- ### 🌄 **Sun Position – Calculated Arc**  
- ### 🌙 **Moon Phases – Visual Display**  
- ### 🎞️ **Animated Sun Position**  
- ### ⏰ **Customizable Times**  
- ### 🌤️ **Weather Status** - NEW
- ### 📐 **Flexible Layout**  
- ### 📍 **Adjustable Thresholds**  
- ### ⚙️ **UI Configuration**  

<img width="48%" height="auto" alt="image" src="https://github.com/jayjojayson/Sun-Position-Card/blob/main/docs/sun-positiion-card.png" /> <img width="48%" height="auto" alt="image" src="https://github.com/jayjojayson/Sun-Position-Card/blob/main/docs/sun-positiion-card2.png" />
<img width="48%" height="auto" alt="image" src="https://github.com/jayjojayson/Sun-Position-Card/blob/main/docs/sun-positiion-card4.png" /> <img width="48%" height="auto" alt="image" src="https://github.com/jayjojayson/Sun-Position-Card/blob/main/docs/sun-positiion-card5.png" />

<details>
  <summary> <b>Have a look at the animated card</b></summary>  
  
<img width="48%" height="auto" alt="image" src="https://github.com/jayjojayson/Sun-Position-Card/blob/main/docs/sun-positiion-card-animation.gif" />
</details>

---

## Installation

### HACS (Recommended)

- Add this repository to HACS. To do so, use the following link.

 [![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=jayjojayson&repository=Sun-Position-Card&category=plugin)

- The "Sun Position Card" should now be available in HACS. Click "INSTALL".
- The resource will be added to your Lovelace configuration automatically.

<details>
  <summary> <b>Manual Installation via Hacs</b></summary>  

1.  Open HACS in Home Assistant.
2.  Go to "Frontend" and click the three dots in the top right corner.
3.  Select "Custom repositories".
4.  Add the URL to your GitHub repository and select "Lovelace" as the category.
5.  Click "ADD".
6.  The "Sun Position Card" should now be available in HACS. Click "INSTALL".
7.  The resource will be added to your Lovelace configuration automatically.
</details>

<details>
  <summary> <b>Manual Installation in HA</b></summary>  

### Manual Installation

1.  Download the `sun-position-card.js`, `sun-position-card-editor.js` and the `images` folder from the repo in github.
2.  Place the `sun-position-card.js` and `sun-position-card-editor.js` files and the `images` folder in `config/www/community/Sun-Position-Card/`. You will have to create the `community` and `Sun-Position-Card` folders.
3.  Add the resource to your Lovelace configuration through the Home Assistant UI:
    a. Go to "Settings" -> "Dashboards".
    b. Click on the three dots in the top right corner and select "Resources".
    c. Click on "+ ADD RESOURCE".
    d. Enter `/local/community/Sun-Position-Card/sun-position-card.js` as the URL and select "JavaScript Module" as the Resource type.
    e. Click "CREATE".
4.  Restart Home Assistant.
</details>

---

## Configuration

<img width="70%" height="auto" alt="image" src="https://github.com/jayjojayson/Sun-Position-Card/blob/main/docs/sun-positiion-card%20config.gif" />

Although the UI configuration is recommended, the card can also be configured manually using the YAML editor:

### Options

| name                  | typ      | required   | description                                                                                                 | standard                                 |
| --------------------- | -------- | ---------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `type`                | `string` | Yes        | `custom:sun-position-card`                                                                                  |                                          |
| `entity`              | `string` | Yes        | Die Entität Sonne, normalerweise `sun.sun`.                                         		                  |                                          |
| `moon_entity`			| `string` | No         | Die Entität Mond, normalerweise `sensor.moon_phase`. 										                  | 										 |
| `moon_phase_position` | `string` | No         | Position Text Mondphase im Verhältnis zum Bild. 											                  | `above`, `in_list`   					 |
| `times_to_show`       | `list`   | No         | Eine Liste von Zeiten, die angezeigt werden sollen. 														  | `daylight_duration, next_rising`, `next_setting`, `next_dawn`, `next_dusk`, `next_noon`, `next_midnight`       |
| `time_position`       | `string` | No         | Position der Zeitangaben im Verhältnis zum Bild. 											                  | `above`, `below`, `right`                |
| `time_list_format`	| `string` | No         | Format der Zeitangaben Blocksatz oder Zentriert											 				  | `block`, `centered`  					 |
| `state_position` 		| `string` | No         | Position des aktuellen Status (über dem Bild, in der Time-Liste).							 				  | `above`, `in_list` 						 |
| `show_degrees` 		| `boolean` | No         | Zeige Gradzahlen für Azimuth und Elevation. 																  | `true`, `false`                          |
| `show_degrees_in_list`| `boolean` | No         | Zeige Gradzahlen in der Timeliste.																		  | `true`, `false`                          |
| `show_dividers` 		| `boolean` | No         | Zeige Trennlinien zwischen den Zeiten. 																	  | `true`, `false`                          |
| `animate_images` 		| `boolean` | No         | Animiere die Sonnenstandsbilder.																			  | `true`, `false`                          |
| `view_mode`			| `string` | No         | Ansichtsoption klassich mit Bildern oder berechneter Sonnenstand. 										  | `classic`, `calculated`, `arc`			 |
| `morning_azimuth`     | `number` | No         | Azimut-Grenzwert für den Morgen.                                                                            | `150`                                    |
| `noon_azimuth`        | `number` | No         | Azimut-Grenzwert für den Mittag.                                                                            | `200`                                    |
| `afternoon_azimuth`   | `number` | No         | Azimut-Grenzwert für den Nachmittag.                                                                        | `255`                                    |
| `dusk_elevation`      | `number` | No         | Höhen-Grenzwert für die Dämmerung.                                                                          | `10`                                     |


simple example:

```yaml
type: custom:sun-position-card
entity: sun.sun
times_to_show:
  - next_rising
  - next_setting
time_position: right
show_image: false
```

advanced example:

```yaml
type: custom:sun-position-card
entity: sun.sun
moon_entity: sensor.moon_phase
moon_phase_position: above
state_position: above
show_dividers: true
show_degrees: true
show_degrees_in_list: false
times_to_show:
  - next_rising
  - next_setting
  - daylight_duration
  - moon_phase
time_position: right
show_image: true
morning_azimuth: 155
dusk_elevation: 5
noon_azimuth: 200
afternoon_azimuth: 255
animate_images: false
time_list_format: block
view_mode: arc
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
| `.moon-phase-state`     | The current state text (e.g., "Full-Moon") when positioned above the image. |
| `.degrees`              | The Azimuth/Elevation text when positioned above the image.                 |
| `.degrees-in-list`      | The Azimuth/Elevation text when positioned inside the times list.           |
| `.divider`              | The horizontal line `<hr>` used as a separator between time entries.        |


### Examples

Here are some examples of how you can use `card-mod` in the YAML configuration of your card.

#### Change Fontsize and Color


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

#### Edit Image


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

#### Change Background and remove Shadows


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

#### Edit Divider


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
