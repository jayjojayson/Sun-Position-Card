[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/integration)
[![GitHub release](https://img.shields.io/github/release/jayjojayson/Sun-Position-Card?include_prereleases=&sort=semver&color=blue)](https://github.com/jayjojayson/Sun-Position-Card/releases/)
[![GH-code-size](https://img.shields.io/github/languages/code-size/jayjojayson/Sun-Position-Card?color=blue)](https://github.com/jayjojayson/Sun-Position-Card)
[![README Deutsch](https://img.shields.io/badge/README-Deutsch-orange)](https://github.com/jayjojayson/Sun-Position-Card/blob/main/docs/README_eng.md)

# Sun Position Card für Home Assistant

Dies ist eine benutzerdefinierte Lovelace-Karte zur Visualisierung der aktuellen Sonnenposition mit entsprechenden Bildern und zur Anzeige relevanter Sonnenzeiten. Die Karte ist vollständig über die Benutzeroberfläche des Karteneditors konfigurierbar.

## Merkmale

-   **Visuelle Darstellung:** Zeigt je nach Tageszeit (Morgen, Mittag, Nachmittag, Abend, Dämmerung) unterschiedliche Bilder an.
-   **Anpassbare Zeiten:** Wählen Sie aus, welche Sonnenzeiten (Sonnenaufgang, Sonnenuntergang, Mittag usw.) angezeigt werden sollen.
-   **Flexibles Layout:** Platzieren Sie die Zeitangaben über, unter oder rechts neben dem Bild.
-   **Anpassbare Schwellenwerte:** Passen Sie die Azimut- und Höhenschwellenwerte an, um die Tagesphasen genau an Ihren geografischen Standort anzupassen.
-   **UI-Konfiguration:** Konfigurieren Sie alle Optionen bequem über den visuellen Editor, ohne YAML manuell bearbeiten zu müssen.

---

## Installation

### HACS (Empfohlen)
 
 [![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=jayjojayson&repository=Sun-Position-Card&category=plugin)

Öffnen Sie HACS in Home Assistant.

- Gehen Sie zu "Frontend" und klicken Sie auf die drei Punkte in der oberen rechten Ecke.
- Wählen Sie "Benutzerdefinierte Repositories" ("Custom repositories") aus.
- Fügen Sie die URL zu Ihrem GitHub-Repository hinzu und wählen Sie "Lovelace" als Kategorie.
- Klicken Sie auf "HINZUFÜGEN" ("ADD").
- Die "Sun Position Card" sollte nun in HACS verfügbar sein. Klicken Sie auf "INSTALLIEREN" ("INSTALL").
- Die Ressource wird automatisch zu Ihrer Lovelace-Konfiguration hinzugefügt.

### Manuelle Installation
1.  **Dateien herunterladen:**
    *   Laden Sie die `sun-custom-card.js`, `sun-custom-card-editor.js` und die PNG-Bilddateien aus diesem Repository herunter.

2.  **Dateien in Home Assistant hochladen:**
    *   Erstellen Sie einen neuen Ordner namens `sun-card` im `www`-Verzeichnis Ihrer Home Assistant-Konfiguration. (Das `www`-Verzeichnis befindet sich im selben Ordner wie Ihre `configuration.yaml`).
    *   Kopieren Sie **alle heruntergeladenen Dateien** in diesen neuen Ordner. Ihre Ordnerstruktur sollte wie folgt aussehen:
        ```
        /config/www/sun-card/sun-custom-card.js
        /config/www/sun-card/sun-custom-card-editor.js
        /config/www/sun-card/morgen.png
        /config/www/sun-card/mittag.png
        ... (alle anderen Bilder)
        ```

3.  **Ressource zu Home Assistant hinzufügen:**
    *   Gehen Sie in Home Assistant zu **Einstellungen > Dashboards**.
    *   Klicken Sie auf das Menü mit den drei Punkten oben rechts und wählen Sie **Ressourcen**.
    *   Klicken Sie auf **+ Ressource hinzufügen**.
    *   Geben Sie als URL `/local/sun-card/sun-custom-card.js` ein.
    *   Wählen Sie als Ressourcentyp **JavaScript-Modul**.
    *   Klicken Sie auf **Erstellen**.

---

## Konfiguration

Nach der Installation können Sie die Karte zu Ihrem Dashboard hinzufügen:

1.  **Bearbeitungsmodus aktivieren:**
    *   Öffnen Sie das Dashboard, zu dem Sie die Karte hinzufügen möchten, und klicken Sie auf **Bearbeiten**.

2.  **Karte hinzufügen:**
    *   Klicken Sie auf **+ Karte hinzufügen** und suchen Sie nach der **"Sun Position Card"**.

3.  **Optionen konfigurieren:**
    *   Ein Konfigurationsfenster wird angezeigt, in dem Sie alle Einstellungen bequem über Dropdown-Menüs, Kontrollkästchen und Eingabefelder anpassen können.
    *   **Sun Entity:** Die Entität Ihrer Sonne (normalerweise `sun.sun`).
    *   **Times to Display:** Wählen Sie die Zeiten aus, die Sie anzeigen möchten.
    *   **Time Position:** Legen Sie fest, wo die Zeiten angezeigt werden sollen.
    *   **Thresholds (Advanced):** Passen Sie bei Bedarf die Azimut- und Höhenwerte an.


---

## YAML-Modus (Alternative)

Obwohl die UI-Konfiguration empfohlen wird, können Sie die Karte auch manuell über den YAML-Editor konfigurieren:

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
