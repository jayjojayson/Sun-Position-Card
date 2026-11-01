// sun-position-card.js
import de from './lang-de.js';
import en from './lang-en.js';
import fr from './lang-fr.js';
import ita from './lang-ita.js';
import nl from './lang-nl.js';
import pl from './lang-pl.js';
import cs from './lang-cs.js';
import ru from './lang-ru.js';
import br from './lang-br.js';
import se from './lang-se.js';
import es from './lang-es.js';
import da from './lang-da.js';

const MOON_PHASES = [
  'new_moon', 'waxing_crescent', 'first_quarter', 'waxing_gibbous',
  'full_moon', 'waning_gibbous', 'last_quarter', 'waning_crescent'
];

console.log(
  "%c☀️ Sun-Position-Card v_2.3 ready",
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
    this.langs = { de, en, fr, it: ita, nl, pl, cs, ru, sv: se, pt: br, es, da };
  }

  // Mondphase vereinheitlichen (z.B. "Waxing crescent" -> "waxing_crescent").
  // Unbekannte Zustände (unknown, unavailable, ...) liefern null.
  _normalizeMoonPhase(state) {
    if (!state) return null;
    const phase = String(state).trim().toLowerCase().replace(/[\s-]+/g, '_');
    return MOON_PHASES.includes(phase) ? phase : null;
  }

  // Sonnenzeiten bevorzugt aus den Attributen der Sonnen-Entität,
  // Fallback auf die Sensoren der Sun-Integration (sensor.sun_next_*).
  _getSunTime(sunState, hass, key) {
    const value = sunState?.attributes?.[key] || hass.states[`sensor.sun_${key}`]?.state;
    if (!value) return null;
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }

  _localize(key, lang = this.config?.language || this._hass?.locale?.language || 'en') {
    const code = lang.split('-')[0];
    const keys = key.split('.');

    let a = this.langs[code];
    if (!a) a = this.langs['en'];

    for (const k of keys) {
      if (typeof a[k] === 'undefined') {
        if (keys[0] === 'weather_state') return keys[1];
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

    const riseNext = this._getSunTime(sunState, hass, 'next_rising');
    const noonNext = this._getSunTime(sunState, hass, 'next_noon');
    const setNext = this._getSunTime(sunState, hass, 'next_setting');

    if (!riseNext || !noonNext || !setNext) return fallback;

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

    const riseNext = this._getSunTime(sunState, hass, 'next_rising');
    const setNext = this._getSunTime(sunState, hass, 'next_setting');

    if (!riseNext || !setNext) return fallback;

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

  _calculateNightPositionArc(sunState, hass, isCompact) {
    const fallback = { left: '50%', top: '100%' };

    const riseNext = this._getSunTime(sunState, hass, 'next_rising');
    const setNext = this._getSunTime(sunState, hass, 'next_setting');
    const now = new Date();

    if (!riseNext || !setNext) return fallback;

    // Logik: Wir befinden uns in der Nacht VOR riseNext.
    const dayLength = setNext.getTime() - riseNext.getTime();
    const dayMs = 24 * 60 * 60 * 1000;
    const nightLength = dayMs - dayLength;

    // Startzeitpunkt der aktuellen Nacht
    const startOfNight = new Date(riseNext.getTime() - nightLength);

    const elapsed = now - startOfNight;
    let percent = nightLength > 0 ? elapsed / nightLength : 0;

    percent = Math.max(0, Math.min(1, percent));

    // Gleiche Geometrie wie bei der Sonne
    const radius = isCompact ? 90 : 120;
    const rad = Math.PI * (1 - percent);
    const xOffset = Math.cos(rad) * radius;
    const yOffset = Math.sin(rad) * radius;
    const baselineY = isCompact ? (70 + 90) : (50 + 120);

    return {
      left: `calc(50% + ${xOffset}px)`,
      top: `calc(${baselineY}px - ${yOffset}px)`
    };
  }

  /**
   * Berechnet die astronomische Tageslänge in Millisekunden für ein bestimmtes Datum
   */
  _getSunDuration(date, lat) {
    if (typeof lat !== 'number') return 0;

    const rad = Math.PI / 180;
    // Tag des Jahres berechnen
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = (date - start) + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);

    // Näherung der Deklination der Sonne
    const axis = 23.44;
    const declination = Math.asin(Math.sin(axis * rad) * Math.sin(rad * (360 / 365.24) * (dayOfYear - 81)));

    // Standard-Elevation (-0.833 für Refraktion)
    const elevation = -0.833;

    const numerator = Math.sin(elevation * rad) - Math.sin(lat * rad) * Math.sin(declination);
    const denominator = Math.cos(lat * rad) * Math.cos(declination);

    let cosH = numerator / denominator;

    if (cosH < -1.0) return 24 * 60 * 60 * 1000;
    if (cosH > 1.0) return 0;

    const H = Math.acos(cosH);
    const hours = (H * 180 / Math.PI) * (2 / 15);

    return hours * 60 * 60 * 1000;
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
    const moonPhase = moonState ? this._normalizeMoonPhase(moonState.state) : null;
    const moonPhasePosition = config.moon_phase_position || 'in_list';

    // Südhalbkugel: automatisch über den Breitengrad, per YAML überschreibbar (hemisphere: north/south)
    const latitude = hass.config?.latitude;
    const hemisphere = config.hemisphere || 'auto';
    const isSouthern = hemisphere === 'south' ||
      (hemisphere !== 'north' && typeof latitude === 'number' && latitude < 0);

    const weatherEntityId = config.weather_entity;
    const weatherStateObj = weatherEntityId ? hass.states[weatherEntityId] : null;
    const showWeatherBadge = config.show_weather_badge ?? true;

    const solarEntityId = config.solar_entity;
    const solarStateObj = solarEntityId ? hass.states[solarEntityId] : null;
    const showSolarBadge = config.show_solar_badge ?? true;
    const solarDecimals = config.solar_decimals;

    const tempEntityId = config.temp_entity;
    const tempStateObj = tempEntityId ? hass.states[tempEntityId] : null;
    const tempDecimals = config.temperature_decimals;

    const hideMoonOnDay = config.hide_moon_phase_on_day ?? false;
    const showMoonIcon = config.show_moon_icon_in_text ?? false;
    const sunSize = config.sun_size || 50;
    const showNightArc = config.show_night_arc ?? false;

    const use12hFormat = config.use_12h_format ?? false;

    const sunState = state.state;
    const azimuth = state.attributes.azimuth || 0;
    const elevation = state.attributes.elevation || 0;

    const morningAzimuth = config.morning_azimuth || 150;
    const noonAzimuth = config.noon_azimuth || 200;
    const afternoonAzimuth = config.afternoon_azimuth || 255;
    const duskElevation = config.dusk_elevation || 10;

    // Auf der Südhalbkugel steht die Sonne mittags im Norden (Azimut ~0°/360°).
    // Für die Tageszeit-Einteilung wird der Azimut an der Ost-West-Achse gespiegelt,
    // damit dieselben Grenzwerte gelten (Osten 90° bleibt 90°, Norden 0° wird 180°, Westen 270° bleibt 270°).
    const stateAzimuth = isSouthern ? (540 - azimuth) % 360 : azimuth;

    let currentState = this._localize('sun_state.below_horizon');
    let image = 'unterHorizont.png';

    if (sunState === 'above_horizon' && elevation > 0) {
      if (elevation < duskElevation) {
        if (stateAzimuth < noonAzimuth) {
          currentState = this._localize('sun_state.dawn');
          image = 'dammerung.png';
        } else {
          currentState = this._localize('sun_state.dusk');
          image = 'dammerung.png';
        }
      } else if (stateAzimuth < morningAzimuth) {
        currentState = this._localize('sun_state.morning');
        image = 'morgen.png';
      } else if (stateAzimuth < noonAzimuth) {
        currentState = this._localize('sun_state.noon');
        image = 'mittag.png';
      } else if (stateAzimuth < afternoonAzimuth) {
        currentState = this._localize('sun_state.afternoon');
        image = 'nachmittag.png';
      } else {
        currentState = this._localize('sun_state.evening');
        image = 'abend.png';
      }
    } else if (moonPhase) {
      image = `${moonPhase}.png`;
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
      if (isNaN(date.getTime())) return '';

      const locale =
        config.language ||
        hass.locale?.language ||
        navigator.language ||
        'en-US';

      // Zeitzone wie im HA-Benutzerprofil: "local" = Browser, sonst Server-Zeitzone
      const timeZone = hass.locale?.time_zone === 'local'
        ? undefined
        : (hass.config?.time_zone || undefined);

      const options = {
        hour: use12hFormat ? 'numeric' : '2-digit',
        minute: '2-digit',
        hour12: use12hFormat,
        ...(timeZone && { timeZone })
      };

      try {
        return date.toLocaleTimeString(locale, options);
      } catch (e) {
        // Ungültige Sprache oder Zeitzone: auf Browser-Standard zurückfallen
        return date.toLocaleTimeString(undefined, { ...options, timeZone: undefined });
      }
    };

    const calculateDaylight = (sunrise, sunset) => {
      if (!sunrise || !sunset) return null;
      const sunriseDate = new Date(sunrise);
      const sunsetDate = new Date(sunset);

      let diff = sunsetDate.getTime() - sunriseDate.getTime();
      if (diff < 0) {
        diff += (24 * 60 * 60 * 1000);
      }
      if (diff > (24 * 60 * 60 * 1000)) {
        diff -= (24 * 60 * 60 * 1000);
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    };

    // UPDATE: Nutzt den Sensor-Text für die Mitte, berechnet Diffs relativ dazu
    const calculateDaylightComparison = (currentDurationString) => {
      const lat = hass.config?.latitude;
      if (typeof lat !== 'number' || !currentDurationString) return null;

      // next_setting als Anker nutzen für das "aktuelle" Datum der angezeigten Tageslänge.
      // Wenn next_setting "morgen" ist (weil es nacht ist), berechnet dies die Diffs für morgen.
      // Das passt, da "Tageslänge" dann auch die von morgen anzeigt.
      const nextSetting = state.attributes.next_setting;
      if (!nextSetting) return null;

      const targetDate = new Date(nextSetting);
      const oneDayMs = 24 * 60 * 60 * 1000;

      // Berechnung der Dauern für Diffs
      const targetLength = this._getSunDuration(targetDate, lat);
      const prevLength = this._getSunDuration(new Date(targetDate.getTime() - oneDayMs), lat);
      const nextLength = this._getSunDuration(new Date(targetDate.getTime() + oneDayMs), lat);

      if (!targetLength || !prevLength || !nextLength) return null;

      // Differenzen berechnen (in Millisekunden)
      const diffPrevMs = (targetLength - prevLength) * -1;
      const diffNextMs = nextLength - targetLength;

      const formatDiff = (diffMs) => {
        if (diffMs === 0) return '±0:00m';
        const sign = diffMs > 0 ? '+' : '-';
        const absDiffMs = Math.abs(diffMs);
        const minutes = Math.floor(absDiffMs / (1000 * 60));
        const seconds = Math.floor((absDiffMs % (1000 * 60)) / 1000);
        return `${sign}${minutes}:${String(seconds).padStart(2, '0')}m`;
      };

      return {
        yesterday: formatDiff(diffPrevMs),
        today: currentDurationString + 'h',
        tomorrow: formatDiff(diffNextMs)
      };
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

      // Einheit bevorzugt aus der Weather-Entity
      let unit =
        weatherStateObj.attributes.temperature_unit ||
        weatherStateObj.attributes.unit_of_measurement ||
        hass.config.unit_system.temperature ||
        '°C';

      // temp_entity hat Priorität
      if (tempStateObj && !isNaN(parseFloat(tempStateObj.state))) {
        temp = tempStateObj.state;

        if (tempStateObj.attributes.unit_of_measurement) {
          unit = tempStateObj.attributes.unit_of_measurement;
        }
      }

      const parsedTemp = parseFloat(temp);

      if (isNaN(parsedTemp)) {
        weatherTemp = `--${unit}`;
      } else if (typeof tempDecimals === 'number') {
        weatherTemp = `${parsedTemp.toFixed(tempDecimals)}${unit}`;
      } else {
        weatherTemp = `${temp}${unit}`;
      }

      weatherText = `${cond}, ${weatherTemp}`;
      weatherIcon = this._getWeatherIcon(weatherStateObj.state);
    }

    const daylightDuration = calculateDaylight(state.attributes.next_rising, state.attributes.next_setting);

    // Übergebe den Sensor-String an die Vergleichsfunktion
    const daylightComparison = calculateDaylightComparison(daylightDuration);

    // Unbekannte Zustände (z.B. "unavailable") werden unübersetzt angezeigt
    let translatedMoonPhase = moonState
      ? (moonPhase ? translateMoonPhase(moonPhase) : moonState.state)
      : '';

    if (moonPhase && showMoonIcon) {
      const mIcon = this._getMoonIcon(moonPhase);
      const iconClass = isSouthern ? 'moon-phase-icon southern' : 'moon-phase-icon';
      translatedMoonPhase += ` <ha-icon class="${iconClass}" icon="${mIcon}"></ha-icon>`;
    }

    const isDay = elevation > 0;
    const showMoonPhaseText = Boolean(moonState) && !(hideMoonOnDay && isDay);

    // Die Zeile über dem Bild wird unabhängig von Tag/Nacht angelegt und nur ein-/ausgeblendet,
    // da die Struktur nur einmal pro Konfiguration aufgebaut wird.
    const moonPhaseAboveConfigured = Boolean(moonState) && moonPhasePosition === 'above' && timesToShow.includes('moon_phase');

    if (moonPhaseAboveConfigured) {
      timesToShow = timesToShow.filter(t => t !== 'moon_phase');
    }

    let timeEntries = [];
    if (statePosition === 'in_list') {
      timeEntries.push(`<div class="time-entry">${this._localize('time_entry.current')}: ${currentState}</div>`);
    }
    if (showDegrees && showDegreesInList) {
      if (timeListFormat === 'block') {
        timeEntries.push(`<div class="time-entry-block"><span class="time-label">${this._localize('time_entry.azimuth')}</span><span class="time-value">${azimuth.toFixed(2)}°</span></div>`);
        timeEntries.push(`<div class="time-entry-block"><span class="time-label">${this._localize('time_entry.elevation')}</span><span class="time-value">${elevation.toFixed(2)}°</span></div>`);
      } else {
        timeEntries.push(`<div class="time-entry">${this._localize('time_entry.azimuth')}: ${azimuth.toFixed(2)}°</div>`);
        timeEntries.push(`<div class="time-entry">${this._localize('time_entry.elevation')}: ${elevation.toFixed(2)}°</div>`);
      }
    }

    timesToShow.forEach(timeKey => {
      let label = '';
      let content = '';

      switch (timeKey) {
        case 'daylight_duration':
          if (daylightDuration) {
            label = this._localize('time_entry.daylight_duration');
            content = daylightDuration;
          }
          break;
        case 'day_comparison':
          if (daylightComparison) {
            label = this._localize('time_entry.day_comparison');
            content = `${daylightComparison.yesterday} · ${daylightComparison.today} · ${daylightComparison.tomorrow}`;
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
        const timeValue = (timeKey === 'daylight_duration' || timeKey === 'day_comparison' || timeKey === 'moon_phase' || timeKey === 'weather') ? content : formatTime(state.attributes[timeKey]);
        if (timeValue) {
          timeEntries.push(`<div class="time-entry-block"><span class="time-label">${label}</span><span class="time-value">${timeValue}</span></div>`);
        }
      } else if (label) {
        if (timeKey === 'daylight_duration' || timeKey === 'day_comparison' || timeKey === 'moon_phase' || timeKey === 'weather') {
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
      this._buildStructure(timePosition, statePosition, showImage, showDegrees, showDegreesInList, timeListFormat, moonPhaseAboveConfigured, config.view_mode, showNightArc);
      this._created = true;
    }

    const stateEl = this.querySelector('#sun-state-text');
    if (stateEl) stateEl.innerText = currentState;

    const moonPhaseEl = this.querySelector('#moon-phase-text');
    if (moonPhaseEl) {
      moonPhaseEl.style.display = showMoonPhaseText ? '' : 'none';
      if (moonPhaseEl.innerHTML !== translatedMoonPhase) moonPhaseEl.innerHTML = translatedMoonPhase;
    }

    const degreesEl = this.querySelector('#sun-degrees-text');
    if (degreesEl) degreesEl.innerText = `${this._localize('time_entry.azimuth')}: ${azimuth.toFixed(2)}° / ${this._localize('time_entry.elevation')}: ${elevation.toFixed(2)}°`;

    const badgeEl = this.querySelector('#weather-badge');
    if (badgeEl) {
      if (weatherStateObj && showWeatherBadge) {
        badgeEl.style.display = 'flex';
        const badgeBg = isDay ? 'rgba(21, 67, 108, 0.8)' : 'rgba(0, 0, 0, 0.8)';
        badgeEl.style.background = badgeBg;
        badgeEl.innerHTML = `<ha-icon icon="${weatherIcon}"></ha-icon><span>${weatherTemp}</span>`;
      } else {
        badgeEl.style.display = 'none';
      }
    }

    const solarBadgeEl = this.querySelector('#solar-badge');
    if (solarBadgeEl) {
      if (solarStateObj && showSolarBadge) {
        solarBadgeEl.style.display = 'flex';
        const badgeBg = isDay ? 'rgba(21, 67, 108, 0.8)' : 'rgba(0, 0, 0, 0.8)';
        solarBadgeEl.style.background = badgeBg;
        const solarValue = parseFloat(solarStateObj.state);
        const solarUnit = solarStateObj.attributes.unit_of_measurement || 'W';
        let solarText = '--';
        if (!isNaN(solarValue)) {
          const value = typeof solarDecimals === 'number' ? solarValue.toFixed(solarDecimals) : solarStateObj.state;
          solarText = `${value} ${solarUnit}`;
        }
        solarBadgeEl.innerHTML = `<ha-icon icon="mdi:solar-power"></ha-icon><span>${solarText}</span>`;
      } else {
        solarBadgeEl.style.display = 'none';
      }
    }

    const imgEl = this.querySelector('#sun-card-image');
    const wrapperEl = this.querySelector('#sun-icon-wrapper');
    const container = this.querySelector('.sun-image-container');

    if (imgEl && container && wrapperEl) {

      // Bild nur bei Wechsel neu setzen. Im Bundle sind die Bilder Data-URIs,
      // ein Vergleich über imgEl.src würde das Bild bei jedem HA-Update neu laden.
      let shownImage = null;
      const setImage = (name, src) => {
        shownImage = name;
        if (imgEl.dataset.image !== name) {
          imgEl.src = src;
          imgEl.dataset.image = name;
        }
      };

      const forceNightArc = (elevation <= 0 && showNightArc);
      const isCalculatedOrArc = (config.view_mode === 'calculated' || config.view_mode === 'arc');

      if (isCalculatedOrArc || forceNightArc) {

        container.classList.add('calculated');

        const effectiveViewMode = forceNightArc ? 'arc' : config.view_mode;

        if (effectiveViewMode === 'arc') {
          imgEl.style.width = `${sunSize}px`;
          imgEl.style.maxWidth = `${sunSize}px`;
        } else {
          imgEl.style.width = '';
          imgEl.style.maxWidth = '';
        }

        const arcEl = this.querySelector('.sun-arc-path');
        if (arcEl) {
          if (isCompact) arcEl.classList.add('compact');
          else arcEl.classList.remove('compact');
        }

        if (elevation <= 0) {
          // *** NACHT (Mond) ***
          let displayImage = image;
          if (displayImage === 'unterHorizont.png') {
            displayImage = 'full_moon.png';
          }

          const newSrc = `/local/community/Sun-Position-Card/images/${displayImage}`;
          setImage(displayImage, newSrc);
          imgEl.alt = currentState;
          imgEl.classList.remove('sun-image-animated');

          if (effectiveViewMode === 'arc' && showNightArc) {
            container.classList.add('arc-mode');
            if (arcEl) arcEl.style.display = 'block';

            const { left, top } = this._calculateNightPositionArc(state, hass, isCompact);
            wrapperEl.style.left = left;
            wrapperEl.style.top = top;
            wrapperEl.style.transform = 'translate(-50%, -50%)';

          } else {
            container.classList.remove('arc-mode');
            if (effectiveViewMode === 'arc' || effectiveViewMode === 'calculated') {
              imgEl.style.width = '170px';
              imgEl.style.maxWidth = '170px';
            }
            if (arcEl) arcEl.style.display = 'none';

            wrapperEl.style.top = '50%';
            wrapperEl.style.left = '50%';
            wrapperEl.style.transform = 'translate(-50%, -50%)';
          }

        } else {
          // *** TAG (Sonne) ***
          const sunSrc = `/local/community/Sun-Position-Card/images/calc-sun.png`;
          setImage('calc-sun.png', sunSrc);
          imgEl.alt = currentState;

          if (arcEl && config.view_mode === 'arc') arcEl.style.display = 'block';
          else if (arcEl) arcEl.style.display = 'none';

          if (config.view_mode === 'arc') {
            container.classList.add('arc-mode');
            const { left, top } = this._calculateSunPositionArc(state, hass, isCompact);
            wrapperEl.style.left = left;
            wrapperEl.style.top = top;
            wrapperEl.style.transform = 'translate(-50%, -50%)';
          } else {
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
        container.classList.remove('calculated');
        container.classList.remove('arc-mode');

        imgEl.style.width = '';
        imgEl.style.maxWidth = '';

        const newSrc = `/local/community/Sun-Position-Card/images/${image}`;
        setImage(image, newSrc);
        imgEl.alt = currentState;

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

      // Südhalbkugel: Mond erscheint um 180° gedreht (beleuchtete Seite links statt rechts)
      const isMoonImage = shownImage && MOON_PHASES.includes(shownImage.replace('.png', ''));
      imgEl.style.transform = (isSouthern && isMoonImage) ? 'rotate(180deg)' : '';
    }

    const timesEl = this.querySelector('#sun-card-times');
    if (timesEl) {
      if (timesEl.innerHTML !== timeHtml) {
        timesEl.innerHTML = timeHtml;
      }
    }
  }

  _buildStructure(timePosition, statePosition, showImage, showDegrees, showDegreesInList, timeListFormat, showMoonPhaseAbove, viewMode, showNightArc) {
    const style = `
      <style>
        .card-content {
            padding: 15px 10px 5px 10px;
        }
		
        .sun-image-container.calculated {
            position: relative;
            overflow: hidden;
            min-height: 170px;
            padding: 0;
			margin: 10px 0 10px 0;
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

        .calculated-sun {
            width: 170px;
            max-width: 170px;
            height: auto;
        }

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
            background: rgba(0, 0, 0, 0.4); 
            color: #fff;
            padding: 4px 8px;
            border-radius: 12px;
            display: none; 
            align-items: center;
            gap: 6px;
            font-size: 1em; 
            pointer-events: none;
            backdrop-filter: blur(2px);
            z-index: 5;
            transition: background 0.5s ease;
        }
        .weather-badge ha-icon {
            --mdc-icon-size: 18px;
        }

        .solar-badge {
            position: absolute;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.4); 
            color: #fff;
            padding: 4px 8px;
            border-radius: 12px;
            display: none; 
            align-items: center;
            gap: 6px;
            font-size: 1em; 
            pointer-events: none;
            backdrop-filter: blur(2px);
            z-index: 5;
            transition: background 0.5s ease;
        }
        .solar-badge ha-icon {
            --mdc-icon-size: 18px;
        }
        
        .moon-phase-icon {
            --mdc-icon-size: 20px;
            vertical-align: text-bottom;
            opacity: 0.8;
            padding-left: 4px;
        }
        .moon-phase-icon.southern {
            display: inline-block;
            transform: rotate(180deg);
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
        .times-container { padding: 8px 8px 0 8px; margin-top: 20px;}
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
      if (viewMode === 'calculated' || viewMode === 'arc' || showNightArc) {
        imageHtml = `<div class="sun-image-container calculated">
                           <div class="solar-badge" id="solar-badge"></div>
                           <div class="weather-badge" id="weather-badge"></div>
                           <div class="sun-arc-path"></div>
                           <div class="sun-icon-wrapper" id="sun-icon-wrapper">
                               <img id="sun-card-image" class="calculated-sun" src="/local/community/Sun-Position-Card/images/calc-sun.png" alt="">
                           </div>
                         </div>`;
      } else {
        imageHtml = `<div class="sun-image-container">
                           <div class="solar-badge" id="solar-badge"></div>
                           <div class="weather-badge" id="weather-badge"></div>
                           <div class="sun-icon-wrapper" id="sun-icon-wrapper">
                               <img id="sun-card-image" class="sun-image" src="" alt="">
                           </div>
                         </div>`;
      }
    }

    const timesContainer = `<div class="times-container" id="sun-card-times"></div>`;

    let cardLayout = '';
    switch (timePosition) {
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
      show_night_arc: false,
      use_12h_format: false
    };
  }
}

customElements.define('sun-position-card', SunPositionCard);
