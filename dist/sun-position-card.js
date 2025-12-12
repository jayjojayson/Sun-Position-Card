// sun-position-card.js

// WICHTIG: Damit die Karte im "Hinzufügen"-Menü erscheint:
window.customCards = window.customCards || [];
window.customCards.push({
  type: "sun-position-card",
  name: "Sun Position Card",
  preview: true,
  description: "Sun position with custom images."
});

class SunPositionCard extends HTMLElement {
  constructor() {
    super();
    this._created = false;
    this._lastImage = null;
  }

  set hass(hass) {
    this._hass = hass;
    
    if (!this.content) {
      // Initiale Erstellung des Containers
      this.innerHTML = `
        <ha-card>
          <div class="card-content"></div>
        </ha-card>
      `;
      this.content = this.querySelector('.card-content');
    }

    const config = this.config;
    const entityId = config.entity;
    const state = hass.states[entityId];

    if (!state) {
      this.content.innerHTML = `Entity not found: ${entityId}`;
      return;
    }

    // 1. Alle Daten berechnen
    const sunState = state.state;
    const azimuth = state.attributes.azimuth || 0;
    const elevation = state.attributes.elevation || 0;

    const morningAzimuth = config.morning_azimuth || 150;
    const noonAzimuth = config.noon_azimuth || 200;
    const afternoonAzimuth = config.afternoon_azimuth || 255;
    const duskElevation = config.dusk_elevation || 10;

    let currentState = 'Unter dem Horizont';
    let image = 'unterHorizont.png';

    if (sunState === 'above_horizon' && elevation > 0) {
      if (elevation < duskElevation) {
        currentState = 'Dämmerung';
        image = 'dammerung.png';
      } else if (azimuth < morningAzimuth) {
        currentState = 'Morgen';
        image = 'morgen.png';
      } else if (azimuth < noonAzimuth) {
        currentState = 'Mittag';
        image = 'mittag.png';
      } else if (azimuth < afternoonAzimuth) {
        currentState = 'Nachmittag';
        image = 'nachmittag.png';
      } else {
        currentState = 'Abend';
        image = 'abend.png';
      }
    }

    let statePosition = config.state_position;
    if (statePosition === undefined) {
      if (config.show_state_in_times === true) statePosition = 'in_list';
      else if (config.show_state_in_times === false) statePosition = 'above';
      else statePosition = 'in_list';
    }

    const showImage = config.show_image ?? true;
    const showDividers = config.show_dividers ?? true;
    const timesToShow = config.times_to_show || ['next_rising', 'next_setting'];
    const timePosition = config.time_position || 'below';
    const showDegrees = config.show_degrees ?? false;
    const showDegreesInList = config.show_degrees_in_list ?? false;

    // Helper Funktionen
    const formatTime = (isoString) => {
      if (!isoString) return '';
      const date = new Date(isoString);
      return date.toLocaleTimeString(hass.locale?.language || 'en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const calculateDaylight = (sunrise, sunset) => {
      if (!sunrise || !sunset) return null;
      const sunriseDate = new Date(sunrise);
      const sunsetDate = new Date(sunset);
      
      // Berechnung der Differenz
      let diff = sunsetDate.getTime() - sunriseDate.getTime();      
      // KORREKTUR: Wenn Differenz negativ ist (Aufgang morgen, Untergang heute),
      // addiere 24 Stunden (in Millisekunden), um die korrekte Dauer zu erhalten.
      if (diff < 0) {
        diff += (24 * 60 * 60 * 1000);
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    };

    const daylightDuration = calculateDaylight(state.attributes.next_rising, state.attributes.next_setting);
    
    // HTML für die Listen-Inhalte zusammenbauen
    let timeEntries = [];
    if (statePosition === 'in_list') {
        timeEntries.push(`<div class="time-entry">Akt.: ${currentState}</div>`);
    }
    if (showDegrees && showDegreesInList) {
        timeEntries.push(`<div class="time-entry degrees-in-list">Azimut: ${azimuth.toFixed(2)}° / Elevation: ${elevation.toFixed(2)}°</div>`);
    }

    timesToShow.forEach(timeKey => {
        let label = '';
        switch(timeKey) {
            case 'daylight_duration': 
                if (daylightDuration) {
                    timeEntries.push(`<div class="time-entry">Tageslänge: ${daylightDuration}</div>`);
                }
                return; // Springt zur nächsten Wiederholung, wichtig!
            case 'next_rising': label = 'Aufgang'; break;
            case 'next_setting': label = 'Untergang'; break;
            case 'next_dawn': label = 'Morgendämmerung'; break;
            case 'next_dusk': label = 'Abenddämmerung'; break;
            case 'next_noon': label = 'Mittag'; break;
            case 'next_midnight': label = 'Mitternacht'; break;
        }
        
        // Nur weiter machen, wenn es kein daylight_duration war (das hat oben schon returned)
        const timeValue = state.attributes[timeKey];
        if (timeValue) {
            timeEntries.push(`<div class="time-entry">${label}: ${formatTime(timeValue)}</div>`);
        }
    });

    const timeHtml = timeEntries.join(showDividers ? '<hr class="divider">' : '');

    // 2. Struktur aufbauen (Nur einmalig oder wenn sich das Layout ändert)
    if (!this._created) {
        this._buildStructure(timePosition, statePosition, showImage, showDegrees, showDegreesInList);
        this._created = true;
        this._lastImage = null; // Force image update
    }

    // 3. DOM Elemente aktualisieren 
    
    // a) State Text (oben)
    const stateEl = this.querySelector('#sun-state-text');
    if (stateEl) stateEl.innerText = currentState;

    // b) Degrees Text (oben)
    const degreesEl = this.querySelector('#sun-degrees-text');
    if (degreesEl) degreesEl.innerText = `Azimut: ${azimuth.toFixed(2)}° / Elevation: ${elevation.toFixed(2)}°`;

    // c) Bild & Animation
    const imgEl = this.querySelector('#sun-card-image');
    if (imgEl) {
        // Bild-Quelle nur ändern, wenn nötig (verhindert Flackern/Neuladen)
        const newSrc = `/local/community/Sun-Position-Card/images/${image}`;
        if (this._lastImage !== image) {
            imgEl.src = newSrc;
            imgEl.alt = currentState;
            this._lastImage = image;
        }
        
        // Animation steuern
        const shouldAnimate = config.animate_images && ['morgen.png', 'mittag.png', 'nachmittag.png'].includes(image);
        if (shouldAnimate) {
            if (!imgEl.classList.contains('sun-image-animated')) {
                imgEl.classList.add('sun-image-animated');
            }
        } else {
            if (imgEl.classList.contains('sun-image-animated')) {
                imgEl.classList.remove('sun-image-animated');
            }
        }
    }

    // d) Zeiten Liste (Inhalt kann komplett ersetzt werden, da kein Status/Animation)
    const timesEl = this.querySelector('#sun-card-times');
    if (timesEl) {
        if (timesEl.innerHTML !== timeHtml) {
             timesEl.innerHTML = timeHtml;
        }
    }
  }

  // Hilfsmethode, um das Layout-Gerüst zu bauen
  _buildStructure(timePosition, statePosition, showImage, showDegrees, showDegreesInList) {
    const style = `
      <style>
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .sun-image-animated {
          animation: spin 30s linear infinite;
          will-change: transform; /* Performance Boost */
        }
        .sun-image-container { text-align: center; padding: 16px; }
        .sun-image { max-width: 100%; height: auto; }
        .times-container { padding: 8px; }
        .time-entry { padding: 4px 0; text-align: center; }
        .flex-container { display: flex; align-items: center; }
        .flex-container .sun-image-container { flex: 1; }
        .flex-container .times-container { flex: 1; }
        .state { text-align: center; font-weight: bold; padding-bottom: 8px; }
        .degrees { text-align: center; font-size: 0.9em; opacity: 0.8; padding-bottom: 8px; }
        .degrees-in-list { font-size: 0.9em; opacity: 0.8; }
        .divider { border: 0; border-top: 1px solid var(--divider-color, #e0e0e0); margin: 0; }
      </style>
    `;

    // Platzhalter-Elemente erstellen
    const stateHtml = (statePosition === 'above') ? `<div class="state" id="sun-state-text"></div>` : '';
    const degreesHtml = (showDegrees && !showDegreesInList) ? `<div class="degrees" id="sun-degrees-text"></div>` : '';
    
    const imageHtml = showImage 
      ? `<div class="sun-image-container"><img id="sun-card-image" class="sun-image" src="" alt=""></div>`
      : '';
    const timesContainer = `<div class="times-container" id="sun-card-times"></div>`;

    let cardLayout = '';
    switch(timePosition) {
        case 'above':
            cardLayout = `${timesContainer}${imageHtml}`;
            break;
        case 'right':
            cardLayout = `<div class="flex-container">${imageHtml}${timesContainer}</div>`;
            break;
        case 'below':
        default:
            cardLayout = `${imageHtml}${timesContainer}`;
            break;
    }

    this.content.innerHTML = `
      ${style}
      ${stateHtml}
      ${degreesHtml}
      ${cardLayout}
    `;
  }

  setConfig(config) {
    if (!config.entity || config.entity.split('.')[0] !== 'sun') {
      throw new Error('Please define a sun entity.');
    }
    // Wenn sich die Konfiguration ändert, muss die Struktur neu aufgebaut werden
    this.config = config;
    this._created = false; 
    
    // Trigger Rendern auslösen, falls hass bereits gesetzt ist
    if (this._hass) this.hass = this._hass; 
  }

  getCardSize() {
    return 3;
  }

  static async getConfigElement() {
    const cardPath = import.meta.url;
    const editorPath = cardPath.replace('sun-position-card.js', 'sun-position-card-editor.js');
    await import(editorPath);
    return document.createElement("sun-position-card-editor");
  }

  static getStubConfig() {
    return { 
        entity: "sun.sun", 
        show_image: true,
        state_position: "in_list",
        show_dividers: true,
        show_degrees: false,
        show_degrees_in_list: false,
        times_to_show: ['next_rising', 'next_setting']
    };
  }
}

customElements.define('sun-position-card', SunPositionCard);
