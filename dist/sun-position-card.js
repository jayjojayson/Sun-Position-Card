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
  set hass(hass) {
    if (!this.content) {
      this.innerHTML = `
        <ha-card>
          <div class="card-content"></div>
        </ha-card>
      `;
      this.content = this.querySelector('div');
    }

    const config = this.config;
    const entityId = config.entity;
    const state = hass.states[entityId];

    if (!state) {
      this.content.innerHTML = `Entity not found: ${entityId}`;
      return;
    }

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
      if (config.show_state_in_times === true) {
        statePosition = 'in_list';
      } else if (config.show_state_in_times === false) {
        statePosition = 'above';
      } else {
        statePosition = 'in_list';
      }
    }

    const showImage = config.show_image ?? true; // New option
    const showDividers = config.show_dividers ?? true;
    const timesToShow = config.times_to_show || ['next_rising', 'next_setting'];
    const timePosition = config.time_position || 'below';
    const showDegrees = config.show_degrees ?? false;
    const showDegreesInList = config.show_degrees_in_list ?? false;

    const formatTime = (isoString) => {
      if (!isoString) return '';
      const date = new Date(isoString);
      return date.toLocaleTimeString(hass.locale?.language || 'en-US', { hour: '2-digit', minute: '2-digit' });
    };
    
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
            case 'next_rising': label = 'Aufgang'; break;
            case 'next_setting': label = 'Untergang'; break;
            case 'next_dawn': label = 'Morgendämmerung'; break;
            case 'next_dusk': label = 'Abenddämmerung'; break;
            case 'next_noon': label = 'Mittag'; break;
            case 'next_midnight': label = 'Mitternacht'; break;
        }
        const timeValue = state.attributes[timeKey];
        if (timeValue) {
            timeEntries.push(`<div class="time-entry">${label}: ${formatTime(timeValue)}</div>`);
        }
    });

    const timeHtml = timeEntries.join(showDividers ? '<hr class="divider">' : '');
    
    const imageHtml = showImage 
      ? `<div class="sun-image-container"><img class="sun-image" src="/local/community/Sun-Position-Card/images/${image}" alt="${currentState}"></div>`
      : '';
    const timesContainer = `<div class="times-container">${timeHtml}</div>`;
    
    const stateHtml = (statePosition === 'above')
      ? `<div class="state">${currentState}</div>`
      : '';
    const degreesHtml = (showDegrees && !showDegreesInList)
      ? `<div class="degrees">Azimut: ${azimuth.toFixed(2)}° / Elevation: ${elevation.toFixed(2)}°</div>`
      : '';

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
      <style>
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
      ${stateHtml}
      ${degreesHtml}
      ${cardLayout}
    `;
  }

  setConfig(config) {
    if (!config.entity || config.entity.split('.')[0] !== 'sun') {
      throw new Error('Please define a sun entity.');
    }
    this.config = config;
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
