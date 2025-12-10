![Home Assistant](https://img.shields.io/badge/home%20assistant-41BDF5?logo=home-assistant&logoColor=white)
[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/integration)
[![GitHub release](https://img.shields.io/github/release/jayjojayson/Sun-Position-Card?include_prereleases=&sort=semver&color=blue)](https://github.com/jayjojayson/Sun-Position-Card/releases/)
![File size](https://img.shields.io/github/size/jayjojayson/Sun-Position-Card/dist/sun-position-card.js?label=Card%20Size)
![last commit](https://img.shields.io/github/last-commit/jayjojayson/Sun-Position-Card)
[![README English](https://img.shields.io/badge/README-Eng-orange)](https://github.com/jayjojayson/Sun-Position-Card/blob/main/docs/README-eng.md)
![stars](https://img.shields.io/github/stars/jayjojayson/Sun-Position-Card)

# :sunny: Sun Position Card

Dies ist eine benutzerdefinierte Lovelace-Karte zur Visualisierung der aktuellen Sonnenposition mit entsprechenden Sonnenstandbildern und zur Anzeige relevanter Sonnenzeiten. Die Karte ist vollständig über die Benutzeroberfläche des Karteneditors konfigurierbar.

Wenn euch die custom Card gefällt, würde ich mich sehr über eine Sternebewertung ⭐ freuen. 🤗

## Merkmale

-   **Visuelle Darstellung:** Zeigt je nach Tageszeit (Morgen, Mittag, Nachmittag, Abend, Dämmerung) unterschiedliche Sonnenstandbilder an.
-   **Anpassbare Zeiten:** Wähle aus, welche Sonnenzeiten (Sonnenaufgang, Sonnenuntergang, Mittag usw.) angezeigt werden sollen.
-   **Flexibles Layout:** Platziere die Zeitangaben über, unter oder rechts neben dem Bild.
-   **Anpassbare Schwellenwerte:** Passe die Azimut- und Höhenschwellenwerte an, um die Tagesphasen genau an Ihren geografischen Standort anzupassen.
-   **UI-Konfiguration:** Konfiguriere alle Optionen bequem über den visuellen Editor, ohne YAML manuell bearbeiten zu müssen.

<img width="48%" height="auto" alt="image" src="https://github.com/user-attachments/assets/7c7688ba-49a0-4cf7-b545-3244ab64a600" />
<img width="48%" height="auto" alt="image" src="https://github.com/user-attachments/assets/d6353870-f448-4648-8ae6-a5fdc4793d91" />


---

## Installation

### HACS (Empfohlen)
 
 [![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=jayjojayson&repository=Sun-Position-Card&category=plugin)

Öffne HACS in Home Assistant.

- Gehe zu "Frontend" und klicke auf die drei Punkte in der oberen rechten Ecke.
- Wähle "Benutzerdefinierte Repositories" ("Custom repositories") aus.
- Füge die URL zu Ihrem GitHub-Repository hinzu und wähle "Lovelace" als Kategorie.
- Klicke auf "HINZUFÜGEN" ("ADD").
- Die "Sun Position Card" sollte nun in HACS verfügbar sein. Klicke auf "INSTALLIEREN" ("INSTALL").
- Die Ressource wird automatisch zu Ihrer Lovelace-Konfiguration hinzugefügt.

### Manuelle Installation
1.  **Dateien herunterladen:**
    *   Lade die `sun-position-card.js`, `sun-position-card-editor.js` und die PNG-Bilddateien aus diesem Repository herunter.

2.  **Dateien in Home Assistant hochladen:**
    *   Erstelle einen neuen Ordner namens `sun-card` im `www`-Verzeichnis deiner Home Assistant-Konfiguration. (Das `www`-Verzeichnis befindet sich im selben Ordner wie deine `configuration.yaml`).
    *   Kopiere **alle heruntergeladenen Dateien** in diesen neuen Ordner. Deine Ordnerstruktur sollte wie folgt aussehen:
        ```
        /config/www/Sun-Position-Card/sun-position-card.js
        /config/www/Sun-Position-Card/sun-position-card-editor.js
        /config/www/Sun-Position-Card/images/morgen.png
        /config/www/Sun-Position-Card/images/mittag.png
        ... (alle anderen Bilder)
        ```

3.  **Ressource zu Home Assistant hinzufügen:**
    *   Gehe in Home Assistant zu **Einstellungen > Dashboards**.
    *   Klicke auf das Menü mit den drei Punkten oben rechts und wählen Sie **Ressourcen**.
    *   Klicke auf **+ Ressource hinzufügen**.
    *   Gebe als URL `/local/Sun-Position-Card/sun-position-card.js` ein.
    *   Wähle als Ressourcentyp **JavaScript-Modul**.
    *   Klicke auf **Erstellen**.

---

## Konfiguration

Nach der Installation kannst du die Karte zu deinem Dashboard hinzufügen:

1.  **Bearbeitungsmodus aktivieren:**
    *   Öffne das Dashboard, zu dem die Karte hinzufügt werden soll, und klicke auf **Bearbeiten**.

2.  **Karte hinzufügen:**
    *   Klicke auf **+ Karte hinzufügen** und suche nach der **"Sun Position Card"**.

3.  **Optionen konfigurieren:**
    *   Ein Konfigurationsfenster wird angezeigt, in dem alle Einstellungen bequem über Dropdown-Menüs, Kontrollkästchen und Eingabefelder angepasst werden können.
    *   **Sun Entity:** Die Entität Sonne (normalerweise `sun.sun`).
    *   **Times to Display:** Wähle die Zeiten aus, die du anzeigen möchtest.
    *   **Time Position:** Lege fest, wo die Zeiten angezeigt werden sollen.
    *   **Thresholds (Advanced):** Passe bei Bedarf die Azimut- und Höhenwerte an.


---

## YAML-Modus (Alternative)

Obwohl die UI-Konfiguration empfohlen wird, kann die Karte auch manuell über den YAML-Editor konfiguriert werden:

### Optionen

| Name                  | Typ      | Erforderlich | Beschreibung                                                                                                | Standard                                 |
| --------------------- | -------- | ------------ | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `type`                | `string` | Ja           | `custom:sun-custom-card`                                                                                    |                                          |
| `entity`              | `string` | Ja           | Die Entität Ihrer Sonne, normalerweise `sun.sun`.                                                               |                                          |
| `times_to_show`       | `list`   | Nein         | Eine Liste von Zeiten, die angezeigt werden sollen. Mögliche Werte: `next_rising`, `next_setting`, `next_dawn`, `next_dusk`, `next_noon`, `next_midnight`. | `['next_rising', 'next_setting']`        |
| `time_position`       | `string` | Nein         | Position der Zeitangaben im Verhältnis zum Bild. Mögliche Werte: `above`, `below`, `right`.                 | `below`                                  |
| `morning_azimuth`     | `number` | Nein         | Azimut-Grenzwert für den Morgen.                                                                            | `150`                                    |
| `noon_azimuth`        | `number` | Nein         | Azimut-Grenzwert für den Mittag.                                                                            | `200`                                    |
| `afternoon_azimuth`   | `number` | Nein         | Azimut-Grenzwert für den Nachmittag.                                                                        | `255`                                    |
| `dusk_elevation`      | `number` | Nein         | Höhen-Grenzwert für die Dämmerung.                                                                          | `10`                                     |


### Beispielkonfiguration

einfaches Beispiel:

```yaml
type: custom:sun-custom-card
entity: sun.sun
times_to_show:
  - next_rising
  - next_setting
time_position: right
```

erweitertes Beispiel:

```yaml
type: custom:sun-custom-card
entity: sun.sun
times_to_show:
  - next_rising
  - next_setting
time_position: right
morning_azimuth: 140
noon_azimuth: 190
afternoon_azimuth: 260
dusk_elevation: 12
```

---

## CSS Elemente die bearbeitet werden können:

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

Hier sind einige Beispiele, wie du `card-mod` in der YAML-Konfiguration deiner Card verwenden kannst.

#### Schriftgröße und Farbe ändern

Macht den Hauptstatus-Text größer und blau und die Zeiteinträge etwas kleiner und grau.

<img width="30%" height="auto" alt="image" src="https://github.com/user-attachments/assets/80e1bd5b-0098-4fa6-96c6-d5c866f9cb5c" />


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

Fügt dem Bild einen Rahmen hinzu und macht es leicht transparent.

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
