// sun-position-card.js
import de from './lang-de.js';
import en from './lang-en.js';
import ita from './lang-ita.js';
import fr from './lang-fr.js';

console.log(
  "%c☀️ Sun-Position-Card v_1.8 loaded",
  "background: #2ecc71; color: #000; padding: 2px 6px; border-radius: 4px; font-weight: bold;"
);

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
    this.langs = { de, en, fr, it: ita };
  }
  
  _localize(key, lang = this._hass?.locale?.language || 'en') {
    const code = lang.split('-')[0];
    const keys = key.split('.');
    
    let a = this.langs[code];
    if (!a) a = this.langs['en'];

    for (const k of keys) {
        if (typeof a[k] === 'undefined') {
            if(keys[0] === 'weather_state') return keys[1];
            return this.langs['en'][keys[0]][keys[1]];
        }
        a = a[k];
    }
    return a;
  }

  _getWeatherIcon(state) {
    const mapping = {
        'clear-night': 'mdi:weather-night',
        'cloudy': 'mdi:weather-cloudy',
        'fog': 'mdi:weather-fog',
        'hail': 'mdi:weather-hail',
        'lightning': 'mdi:weather-lightning',
        'lightning-rainy': 'mdi:weather-lightning-rainy',
        'partlycloudy': 'mdi:weather-partly-cloudy',
        'pouring': 'mdi:weather-pouring',
        'rainy': 'mdi:weather-rainy',
        'snowy': 'mdi:weather-snowy',
        'snowy-rainy': 'mdi:weather-snowy-rainy',
        'sunny': 'mdi:weather-sunny',
        'windy': 'mdi:weather-windy',
        'windy-variant': 'mdi:weather-windy-variant',
        'exceptional': 'mdi:alert-circle-outline'
    };
    return mapping[state] || 'mdi:weather-cloudy';
  }

  _getMoonIcon(state) {
    const mapping = {
        'new_moon': 'mdi:moon-new',
        'waxing_crescent': 'mdi:moon-waxing-crescent',
        'first_quarter': 'mdi:moon-first-quarter',
        'waxing_gibbous': 'mdi:moon-waxing-gibbous',
        'full_moon': 'mdi:moon-full',
        'waning_gibbous': 'mdi:moon-waning-gibbous',
        'last_quarter': 'mdi:moon-last-quarter',
        'waning_crescent': 'mdi:moon-waning-crescent'
    };
    return mapping[state] || 'mdi:moon-waning-crescent';
  }

  _calculateSunPosition(sunState, hass) {
    const fallback = { top: '270px', clipPath: 'inset(0 0 170px 0)' };
    if (!sunState || sunState.state !== 'above_horizon') return fallback;

    const riseEnt = hass.states['sensor.sun_next_rising'];
    const noonEnt = hass.states['sensor.sun_next_noon'];
    const setEnt  = hass.states['sensor.sun_next_setting'];
    
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

  _calculateSunPositionArc(sunState, hass, isCompact) {
    const fallback = { left: '50%', top: '100%', clipPath: 'none' };
    
    if (!sunState || sunState.state !== 'above_horizon') return fallback;

    const riseEnt = hass.states['sensor.sun_next_rising'];
    const setEnt  = hass.states['sensor.sun_next_setting'];
    
    if (!riseEnt || !setEnt) return fallback;

    const riseNext = new Date(riseEnt.state);
    const setNext  = new Date(setEnt.state);
    
    if (isNaN(riseNext.getTime()) || isNaN(setNext.getTime())) return fallback;

    const now = new Date();
    const dayMs = 24 * 60 * 60 * 1000;
    
    const set = setNext;
    const rise = new Date(riseNext.getTime() - dayMs);
    
    const totalDay = set - rise;
    const elapsed = now - rise;
    let percent = totalDay > 0 ? elapsed / totalDay : 0;
    
    percent = Math.max(0, Math.min(1, percent));

    // Radius Logik: Compact 90px, Groß 120px
    const radius = isCompact ? 90 : 120; 
    
    const rad = Math.PI * (1 - percent);
    
    const xOffset = Math.cos(rad) * radius;
    const yOffset = Math.sin(rad) * radius;

    // Basislinie berechnen (Horizont)
    // CSS Top ist 50px (Groß) oder 70px (Compact)
    // Baseline = CSS Top + Radius
    const baselineY = isCompact ? (70 + 90) : (50 + 120); // 160px oder 170px

    return {
        left: `calc(50% + ${xOffset}px)`,
        top: `calc(${baselineY}px - ${yOffset}px)`,
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
    
    const weatherEntityId = config.weather_entity;
    const weatherStateObj = weatherEntityId ? hass.states[weatherEntityId] : null;
    const showWeatherBadge = config.show_weather_badge ?? true;

    // NEU: Temp Entity Support
    const tempEntityId = config.temp_entity;
    const tempStateObj = tempEntityId ? hass.states[tempEntityId] : null;

    // NEU: Hide Moon Config
    const hideMoonOnDay = config.hide_moon_phase_on_day ?? false;
    const showMoonIcon = config.show_moon_icon_in_text ?? false;
    const sunSize = config.sun_size || 50;

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
        // NEUE LOGIK: Unterscheidung zwischen Morgendämmerung (Dawn) und Abenddämmerung (Dusk)
        if (azimuth < noonAzimuth) {
             currentState = this._localize('sun_state.dawn');
             image = 'dammerung.png';
        } else {
             currentState = this._localize('sun_state.dusk');
             image = 'dammerung.png';
        }
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
            image = `${moonState.state}.png`;
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

    const isCompact = (timePosition === 'right');

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
    
    let weatherText = '';
    let weatherIcon = '';
    let weatherTemp = '';
    
    if (weatherStateObj) {
        const cond = this._localize(`weather_state.${weatherStateObj.state}`);
        let temp = weatherStateObj.attributes.temperature;
        let unit = hass.config.unit_system.temperature || '°C';
        
        // NEU: Override Temperature if Temp Entity is set and valid
        if (tempStateObj && !isNaN(tempStateObj.state)) {
            temp = tempStateObj.state;
            if (tempStateObj.attributes.unit_of_measurement) {
                unit = tempStateObj.attributes.unit_of_measurement;
            }
        }

        weatherTemp = `${temp}${unit}`;
        weatherText = `${cond}, ${weatherTemp}`;
        weatherIcon = this._getWeatherIcon(weatherStateObj.state);
    }

    const daylightDuration = calculateDaylight(state.attributes.next_rising, state.attributes.next_setting);
    
    let translatedMoonPhase = moonState ? translateMoonPhase(moonState.state) : null;
    
    // NEU: Logik zum Hinzufügen des Icons zum Mondtext mit neuer Klasse
    if (moonState && showMoonIcon) {
        const mIcon = this._getMoonIcon(moonState.state);
        translatedMoonPhase += ` <ha-icon class="moon-phase-icon" icon="${mIcon}"></ha-icon>`;
    }
    
    // NEU: Logik zum Ausblenden des Mondtextes am Tag
    const isDay = elevation > 0;
    const showMoonPhaseText = moonState && !(hideMoonOnDay && isDay);

    const showMoonPhaseAbove = showMoonPhaseText && moonPhasePosition === 'above' && timesToShow.includes('moon_phase');

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
                if (showMoonPhaseText) { 
                    label = this._localize('time_entry.moon_phase');
                    content = translatedMoonPhase;
                }
                break;
            case 'weather':
                if (weatherStateObj) {
                    label = this._localize('time_entry.weather');
                    content = weatherText;
                }
                break;
        }

        if (timeListFormat === 'block' && label) {
            const timeValue = (timeKey === 'daylight_duration' || timeKey === 'moon_phase' || timeKey === 'weather') ? content : formatTime(state.attributes[timeKey]);
            if (timeValue) {
                 timeEntries.push(`<div class="time-entry-block"><span class="time-label">${label}</span><span class="time-value">${timeValue}</span></div>`);
            }
        } else if (label) {
            if (timeKey === 'daylight_duration' || timeKey === 'moon_phase' || timeKey === 'weather') {
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
    if (moonPhaseEl) moonPhaseEl.innerHTML = translatedMoonPhase; // WICHTIG: innerHTML statt innerText wegen Icon

    const degreesEl = this.querySelector('#sun-degrees-text');
    if (degreesEl) degreesEl.innerText = `${this._localize('time_entry.azimuth')}: ${azimuth.toFixed(2)}° / ${this._localize('time_entry.elevation')}: ${elevation.toFixed(2)}°`;
    
    // UPDATE Badge Visibility and Background Color
    const badgeEl = this.querySelector('#weather-badge');
    if (badgeEl) {
        if (weatherStateObj && showWeatherBadge) {
            badgeEl.style.display = 'flex';
            
            // Logik für Hintergrundfarbe (Tag vs Nacht)
            const isDay = elevation > 0;
            const badgeBg = isDay ? 'rgba(21, 67, 108, 0.8)' : 'rgba(0, 0, 0, 0.8)';
            badgeEl.style.background = badgeBg;
            
            badgeEl.innerHTML = `<ha-icon icon="${weatherIcon}"></ha-icon><span>${weatherTemp}</span>`;
        } else {
            badgeEl.style.display = 'none';
        }
    }

    const imgEl = this.querySelector('#sun-card-image');
    const wrapperEl = this.querySelector('#sun-icon-wrapper');
    const container = this.querySelector('.sun-image-container');

    if (imgEl && container && wrapperEl) {
        
        if (config.view_mode === 'calculated' || config.view_mode === 'arc') {
            
            // NEU: Sun Size dynamisch anwenden (im Bogen-Modus)
            if (config.view_mode === 'arc') {
                if (elevation <= 0) {
                     // Nachts (Mond): Feste Größe 170px erzwingen
                     imgEl.style.width = '170px';
                     imgEl.style.maxWidth = '170px';
                } else {
                     // Tagsüber (Sonne): Benutzerdefinierte Größe
                     imgEl.style.width = `${sunSize}px`;
                     imgEl.style.maxWidth = `${sunSize}px`;
                }
            } else {
                // Reset für andere Modi
                imgEl.style.width = '';
                imgEl.style.maxWidth = '';
            }

            const arcEl = this.querySelector('.sun-arc-path');
            if(arcEl) {
                if(isCompact) arcEl.classList.add('compact');
                else arcEl.classList.remove('compact');
            }

            if (elevation <= 0) {
                // NACHT (Mond)
                container.classList.remove('arc-mode');
                
                let displayImage = image;
                if (displayImage === 'unterHorizont.png') {
                    displayImage = 'full_moon.png';
                }

                const newSrc = `/local/community/Sun-Position-Card/images/${displayImage}`;
                if (!imgEl.src.endsWith(displayImage)) imgEl.src = newSrc;

                // Zentriert
                wrapperEl.style.top = '50%';
                wrapperEl.style.left = '50%';
                wrapperEl.style.transform = 'translate(-50%, -50%)';
                
                if (arcEl) arcEl.style.display = 'none';

                imgEl.classList.remove('sun-image-animated');

            } else {
                // TAG (Sonne)
                const sunSrc = `/local/community/Sun-Position-Card/images/calc-sun.png`;
                if (!imgEl.src.endsWith('calc-sun.png')) imgEl.src = sunSrc;

                if (arcEl && config.view_mode === 'arc') arcEl.style.display = 'block';

                if (config.view_mode === 'arc') {
                    // ARC MODUS
                    container.classList.add('arc-mode');
                    
                    const { left, top } = this._calculateSunPositionArc(state, hass, isCompact);
                    wrapperEl.style.left = left;
                    wrapperEl.style.top = top;
                    wrapperEl.style.transform = 'translate(-50%, -50%)'; 

                } else {
                    // CALCULATED MODUS
                    container.classList.remove('arc-mode');
                    
                    const { top, clipPath } = this._calculateSunPosition(state, hass);
                    wrapperEl.style.left = '50%';
                    wrapperEl.style.top = top;
                    wrapperEl.style.transform = 'translateX(-50%)'; 
                    
                    imgEl.style.clipPath = clipPath; 
                }

                if (config.animate_images) {
                    imgEl.classList.add('sun-image-animated');
                } else {
                    imgEl.classList.remove('sun-image-animated');
                }
            }

        } else {
            // CLASSIC MODE
            container.classList.remove('arc-mode');

             // Reset für Classic Mode
            imgEl.style.width = '';
            imgEl.style.maxWidth = '';

            const newSrc = `/local/community/Sun-Position-Card/images/${image}`;
            if (this._lastImage !== image) {
                imgEl.src = newSrc;
                imgEl.alt = currentState;
                this._lastImage = image;
            }
            
            wrapperEl.style.top = '';
            wrapperEl.style.left = '';
            wrapperEl.style.transform = '';
            imgEl.style.clipPath = '';
            
            const shouldAnimate = config.animate_images && ['morgen.png', 'mittag.png', 'nachmittag.png'].includes(image);
            if (shouldAnimate) {
                imgEl.classList.add('sun-image-animated');
            } else {
                imgEl.classList.remove('sun-image-animated');
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
            min-height: 170px;
            padding: 0;
			margin: 10px 0 8px 0;
        }
        
        .sun-icon-wrapper {
            position: absolute;
            width: auto;
            height: auto;
            display: flex; 
            justify-content: center;
            align-items: center;
            transition: top 0.5s ease, left 0.5s ease;
        }

        /* 170px für große Sonne/Mond */
        .calculated-sun {
            width: 170px;
            max-width: 170px;
            height: auto;
        }

        /* Kleine Sonne im Arc-Modus */
        .sun-image-container.arc-mode .calculated-sun {
            width: 50px;
            max-width: 50px;
        }
        
        .sun-arc-path {
            position: absolute;
            width: 240px; 
            height: 120px;
            border-top: 3px dashed var(--secondary-text-color, #727272);
            border-left: 3px dashed var(--secondary-text-color, #727272);
            border-right: 3px dashed var(--secondary-text-color, #727272);
            border-radius: 120px 120px 0 0;
            top: 50px;
            left: 50%;
            transform: translateX(-50%);
            opacity: 0.4;
            pointer-events: none;
            box-sizing: border-box;
            display: none;
        }

        .sun-arc-path.compact {
            width: 180px;
            height: 90px;
            border-radius: 90px 90px 0 0;
            top: 70px;
        }
        
        .weather-badge {
            position: absolute;
            top: 10px;
            right: 10px;
            /* Default background wird dynamisch überschrieben */
            background: rgba(0, 0, 0, 0.4); 
            color: #fff;
            padding: 4px 8px;
            border-radius: 12px;
            display: none; 
            align-items: center;
            gap: 6px;
            font-size: 1em; /* UPDATE: Größere Schrift */
            pointer-events: none;
            backdrop-filter: blur(2px);
            z-index: 5;
            transition: background 0.5s ease;
        }
        .weather-badge ha-icon {
            --mdc-icon-size: 18px;
        }
        
        /* NEU: CSS für Mond-Icon */
        .moon-phase-icon {
            --mdc-icon-size: 20px;
            vertical-align: text-bottom;
            opacity: 0.8;
            padding-left: 4px;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .sun-image-animated {
          animation: spin 40s linear infinite;
          will-change: transform;
        }
        
        .sun-image-container { text-align: center; padding: 16px; position: relative; display: flex; justify-content: center; } 
        .sun-image { max-width: 90%; height: auto; }
        .times-container { padding: 8px 8px 0 8px; margin-top: 15px;}
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
        
        .sun-image-container:not(.calculated) .sun-icon-wrapper {
            position: relative;
        }
      </style>
    `;

    const stateHtml = (statePosition === 'above') ? `<div class="state" id="sun-state-text"></div>` : '';
    const moonPhaseHtml = (showMoonPhaseAbove) ? `<div class="moon-phase-state" id="moon-phase-text"></div>` : '';
    const degreesHtml = (showDegrees && !showDegreesInList) ? `<div class="degrees" id="sun-degrees-text"></div>` : '';

    let imageHtml = '';
    if (showImage) {
        if (viewMode === 'calculated' || viewMode === 'arc') {
            imageHtml = `<div class="sun-image-container calculated">
                           <div class="weather-badge" id="weather-badge"></div>
                           <div class="sun-arc-path"></div>
                           <div class="sun-icon-wrapper" id="sun-icon-wrapper">
                               <img id="sun-card-image" class="calculated-sun" src="/local/community/Sun-Position-Card/images/calc-sun.png" alt="">
                           </div>
                         </div>`;
        } else {
            imageHtml = `<div class="sun-image-container">
                           <div class="weather-badge" id="weather-badge"></div>
                           <div class="sun-icon-wrapper" id="sun-icon-wrapper">
                               <img id="sun-card-image" class="sun-image" src="" alt="">
                           </div>
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
        sun_size: 50,
        hide_moon_phase_on_day: false,
        show_moon_icon_in_text: false,
    };
  }
}

customElements.define('sun-position-card', SunPositionCard);
