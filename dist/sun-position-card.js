// sun-position-card.js
import de from './lang-de.js';
import en from './lang-en.js';

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
    this.langs = { de, en };
  }
  
  _localize(key, lang = this._hass?.locale?.language || 'en') {
    const code = lang.split('-')[0];
    const keys = key.split('.');
    
    let a = this.langs[code];
    if (!a) a = this.langs['en'];

    for (const k of keys) {
        if (typeof a[k] === 'undefined') {
            return this.langs['en'][keys[0]][keys[1]];
        }
        a = a[k];
    }
    return a;
  }

  _calculateSunPosition(sunState, hass) {
    const fallback = { top: '270px', clipPath: 'inset(0 0 170px 0)' };
    if (!sunState || sunState.state !== 'above_horizon') return fallback;

    // Check if sensors exist safely
    const riseEnt = hass.states['sensor.sun_next_rising'];
    const noonEnt = hass.states['sensor.sun_next_noon'];
    const setEnt  = hass.states['sensor.sun_next_setting'];
    
    // If user doesn't have these specific sensors (e.g. from Sun2 integration), return safe fallback
    if (!riseEnt || !noonEnt || !setEnt) return fallback;

    const riseNext = new Date(riseEnt.state);
    const noonNext = new Date(noonEnt.state);
    const setNext  = new Date(setEnt.state);
    
    if ([riseNext, noonNext, setNext].some(d => isNaN(d.getTime()))) return fallback;

    const now = new Date();
    const dayMs = 24 * 60 * 60 * 1000;
    const set = setNext;
    const rise = new Date(riseNext.getTime() - dayMs);
    let noon = noonNext <= set ? noonNext : new Date(noonNext.getTime() - dayMs);

    const h = 170; 
    const posAtHorizon = h - 40; 
    const posAtNoon = 0;
    let phase = 0;

    if (now <= noon) {
      const total = noon - rise;
      const elapsed = now - rise;
      phase = total > 0 ? elapsed / total : 0;
    } else {
      const total = set - noon;
      const remaining = set - now;
      phase = total > 0 ? remaining / total : 0;
    }
    phase = Math.max(0, Math.min(1, phase));

    const topPos = posAtHorizon - (posAtHorizon - posAtNoon) * phase;

    return {
      top: `${topPos}px`,
      clipPath: 'none'
    };
  }

  set hass(hass) {
    this._hass = hass;
    
    if (!this.content) {
      this.innerHTML = `
        <ha-card>
          <div class="card-content"></div>
        </ha-card>
      `;
      this.content = this.querySelector('.card-content');
    }

    const config = this.config;
    if (!config) return;

    const entityId = config.entity;
    const state = hass.states[entityId];

    if (!state) {
      this.content.innerHTML = `${this._localize('error.entity_not_found')}${entityId}`;
      return;
    }
    
    const moonEntityId = config.moon_entity;
    const moonState = moonEntityId ? hass.states[moonEntityId] : null;
    const moonPhasePosition = config.moon_phase_position || 'in_list';

    const sunState = state.state;
    const azimuth = state.attributes.azimuth || 0;
    const elevation = state.attributes.elevation || 0;

    const morningAzimuth = config.morning_azimuth || 150;
    const noonAzimuth = config.noon_azimuth || 200;
    const afternoonAzimuth = config.afternoon_azimuth || 255;
    const duskElevation = config.dusk_elevation || 10;

    let currentState = this._localize('sun_state.below_horizon');
    let image = 'unterHorizont.png';

    if (sunState === 'above_horizon' && elevation > 0) {
      if (elevation < duskElevation) {
        currentState = this._localize('sun_state.dawn');
        image = 'dammerung.png';
      } else if (azimuth < morningAzimuth) {
        currentState = this._localize('sun_state.morning');
        image = 'morgen.png';
      } else if (azimuth < noonAzimuth) {
        currentState = this._localize('sun_state.noon');
        image = 'mittag.png';
      } else if (azimuth < afternoonAzimuth) {
        currentState = this._localize('sun_state.afternoon');
        image = 'nachmittag.png';
      } else {
        currentState = this._localize('sun_state.evening');
        image = 'abend.png';
      }
    } else {
        if (moonState) {
            // Mapping moon state to image filename
            image = `${moonState.state}.png`;
            // Fallback for unknown states handled implicitly by image loading or keep previous
        }
    }

    let statePosition = config.state_position || 'in_list';

    const showImage = config.show_image ?? true;
    const showDividers = config.show_dividers ?? true;
    let timesToShow = config.times_to_show || ['next_rising', 'next_setting'];
    const timePosition = config.time_position || 'below';
    const showDegrees = config.show_degrees ?? false;
    const showDegreesInList = config.show_degrees_in_list ?? false;
    const timeListFormat = config.time_list_format || 'centered';

    const formatTime = (isoString) => {
      if (!isoString) return '';
      const date = new Date(isoString);
      return date.toLocaleTimeString(hass.locale?.language || 'en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const calculateDaylight = (sunrise, sunset) => {
      if (!sunrise || !sunset) return null;
      const sunriseDate = new Date(sunrise);
      const sunsetDate = new Date(sunset);
      
      let diff = sunsetDate.getTime() - sunriseDate.getTime();      
      if (diff < 0) {
        diff += (24 * 60 * 60 * 1000);
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    };
    
    const translateMoonPhase = (phase) => {
        return this._localize(`moon_phase.${phase}`) || phase;
    }

    const daylightDuration = calculateDaylight(state.attributes.next_rising, state.attributes.next_setting);
    const translatedMoonPhase = moonState ? translateMoonPhase(moonState.state) : null;
    const showMoonPhaseAbove = moonState && moonPhasePosition === 'above' && timesToShow.includes('moon_phase');

    if (showMoonPhaseAbove) {
        timesToShow = timesToShow.filter(t => t !== 'moon_phase');
    }
    
    let timeEntries = [];
    if (statePosition === 'in_list') {
        timeEntries.push(`<div class="time-entry">${this._localize('time_entry.current')}: ${currentState}</div>`);
    }
    if (showDegrees && showDegreesInList) {
        timeEntries.push(`<div class="time-entry degrees-in-list">${this._localize('time_entry.azimuth')}: ${azimuth.toFixed(2)}° / ${this._localize('time_entry.elevation')}: ${elevation.toFixed(2)}°</div>`);
    }

    timesToShow.forEach(timeKey => {
        let label = '';
        let content = '';
        
        switch(timeKey) {
            case 'daylight_duration':
                if (daylightDuration) {
                    label = this._localize('time_entry.daylight_duration');
                    content = daylightDuration;
                }
                break;
            case 'next_rising': label = this._localize('time_entry.next_rising'); break;
            case 'next_setting': label = this._localize('time_entry.next_setting'); break;
            case 'next_dawn': label = this._localize('time_entry.next_dawn'); break;
            case 'next_dusk': label = this._localize('time_entry.next_dusk'); break;
            case 'next_noon': label = this._localize('time_entry.next_noon'); break;
            case 'next_midnight': label = this._localize('time_entry.next_midnight'); break;
            case 'moon_phase':
                if (moonState) {
                    label = this._localize('time_entry.moon_phase');
                    content = translatedMoonPhase;
                }
                break;
        }

        if (timeListFormat === 'block' && label) {
            const timeValue = (timeKey === 'daylight_duration' || timeKey === 'moon_phase') ? content : formatTime(state.attributes[timeKey]);
            if (timeValue) {
                 timeEntries.push(`<div class="time-entry-block"><span class="time-label">${label}</span><span class="time-value">${timeValue}</span></div>`);
            }
        } else if (label) {
            if (timeKey === 'daylight_duration' || timeKey === 'moon_phase') {
                if (content) timeEntries.push(`<div class="time-entry">${label}: ${content}</div>`);
            } else {
                 const timeValue = state.attributes[timeKey];
                 if (timeValue) {
                    timeEntries.push(`<div class="time-entry">${label}: ${formatTime(timeValue)}</div>`);
                 }
            }
        }
    });

    const timeHtml = timeEntries.join(showDividers ? '<hr class="divider">' : '');

    if (!this._created) {
        this._buildStructure(timePosition, statePosition, showImage, showDegrees, showDegreesInList, timeListFormat, showMoonPhaseAbove, config.view_mode);
        this._created = true;
        this._lastImage = null;
    }
    
    const stateEl = this.querySelector('#sun-state-text');
    if (stateEl) stateEl.innerText = currentState;

    const moonPhaseEl = this.querySelector('#moon-phase-text');
    if (moonPhaseEl) moonPhaseEl.innerText = translatedMoonPhase;

    const degreesEl = this.querySelector('#sun-degrees-text');
    if (degreesEl) degreesEl.innerText = `${this._localize('time_entry.azimuth')}: ${azimuth.toFixed(2)}° / ${this._localize('time_entry.elevation')}: ${elevation.toFixed(2)}°`;
    
    const imgEl = this.querySelector('#sun-card-image');
    if (imgEl) {
        if (config.view_mode === 'calculated') {
            if (elevation <= 0) {
                // Berechneter Modus - NACHT
                let displayImage = image;
                if (displayImage === 'unterHorizont.png') {
                    displayImage = 'full_moon.png';
                }

                const newSrc = `/local/community/Sun-Position-Card/images/${displayImage}`;
                
                if (!imgEl.src.endsWith(displayImage)) {
                     imgEl.src = newSrc;
                }

                // ZENTRIERUNG DES MONDES
                imgEl.style.top = '50%';
                imgEl.style.transform = 'translate(-50%, -50%)'; // Vertikal und Horizontal zentrieren
                imgEl.style.clipPath = 'none';

            } else {
                // Berechneter Modus - TAG
                const sunSrc = `/local/community/Sun-Position-Card/images/calc-sun.png`;
                if (!imgEl.src.endsWith('calc-sun.png')) {
                    imgEl.src = sunSrc;
                }

                // Reset Transform für Sonne (Position wird über top gesteuert)
                imgEl.style.transform = ''; 

                const { top, clipPath } = this._calculateSunPosition(state, hass);
                imgEl.style.top = top;
                imgEl.style.clipPath = clipPath;
            }

            if (imgEl.classList.contains('sun-image-animated')) {
                imgEl.classList.remove('sun-image-animated');
            }

        } else {
            // CLASSIC MODE
            const newSrc = `/local/community/Sun-Position-Card/images/${image}`;
            if (this._lastImage !== image) {
                imgEl.src = newSrc;
                imgEl.alt = currentState;
                this._lastImage = image;
            }
            
            // Inline Styles zurücksetzen
            imgEl.style.top = '';
            imgEl.style.transform = '';
            imgEl.style.clipPath = '';
            
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
    }

    const timesEl = this.querySelector('#sun-card-times');
    if (timesEl) {
        if (timesEl.innerHTML !== timeHtml) {
             timesEl.innerHTML = timeHtml;
        }
    }
  }

  _buildStructure(timePosition, statePosition, showImage, showDegrees, showDegreesInList, timeListFormat, showMoonPhaseAbove, viewMode) {
    const style = `
      <style>
        .sun-image-container.calculated {
            position: relative;
            overflow: hidden;
            min-height: 170px; /* Ensure container has height */
            padding: 0;
			margin: 10px 0 20px 0;
        }
        .calculated-sun {
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            width: 100%;
            max-width: 175px;
            height: auto;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .sun-image-animated {
          animation: spin 40s linear infinite;
          will-change: transform;
        }
        .sun-image-container { text-align: center; padding: 16px; }
        .sun-image { max-width: 100%; height: auto; }
        .times-container { padding: 8px; }
        .time-entry { padding: 4px 0; text-align: center; }
        .time-entry-block { display: flex; justify-content: space-between; padding: 4px 0; }
        .time-label { text-align: left; }
        .time-value { text-align: right; }
        .flex-container { display: flex; align-items: center; }
        .flex-container .sun-image-container { flex: 1; }
        .flex-container .times-container { flex: 1; }
        .state { text-align: center; font-weight: bold; padding-bottom: 8px; }
        .moon-phase-state { text-align: center; font-weight: normal; padding-bottom: 0px; }
        .degrees { text-align: center; font-size: 0.9em; opacity: 0.8; padding-bottom: 0px; }
        .degrees-in-list { font-size: 0.9em; opacity: 0.8; }
        .divider { border: 0; border-top: 1px solid var(--divider-color, #e0e0e0); margin: 0; }
      </style>
    `;

    const stateHtml = (statePosition === 'above') ? `<div class="state" id="sun-state-text"></div>` : '';
    const moonPhaseHtml = (showMoonPhaseAbove) ? `<div class="moon-phase-state" id="moon-phase-text"></div>` : '';
    const degreesHtml = (showDegrees && !showDegreesInList) ? `<div class="degrees" id="sun-degrees-text"></div>` : '';

    let imageHtml = '';
    if (showImage) {
        if (viewMode === 'calculated') {
            imageHtml = `<div class="sun-image-container calculated">
                           <img id="sun-card-image" class="calculated-sun" src="/local/community/Sun-Position-Card/images/calc-sun.png" alt="">
                         </div>`;
        } else {
            imageHtml = `<div class="sun-image-container">
                           <img id="sun-card-image" class="sun-image" src="" alt="">
                         </div>`;
        }
    }

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
      ${moonPhaseHtml}
      ${cardLayout}
    `;
  }

  setConfig(config) {
    if (!config.entity || config.entity.split('.')[0] !== 'sun') {
      throw new Error(this._localize('error.no_sun_entity'));
    }
    this.config = config;
    this._created = false; 
    
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
        type: 'custom:sun-position-card',
        entity: 'sun.sun',
        animate_images: true,
        show_image: true,
        state_position: 'above',
        show_dividers: true,
        show_degrees: true,
        show_degrees_in_list: false,
        times_to_show: [
          'next_rising',
          'next_setting',
          'daylight_duration',
        ],
        time_position: 'right',
        time_list_format: 'block',
        morning_azimuth: 155,
        dusk_elevation: 5,
        noon_azimuth: 200,
        afternoon_azimuth: 255,
    };
  }
}

customElements.define('sun-position-card', SunPositionCard);
