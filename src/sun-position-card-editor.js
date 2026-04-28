// sun-position-card-editor.js
import de from './lang-de.js';
import en from './lang-en.js';
import fr from './lang-fr.js';
import ita from './lang-ita.js';
import nl from './lang-nl.js';
import pl from './lang-pl.js';
import cs from './lang-cs.js';

const fireEvent = (node, type, detail, options) => {
  options = options || {};
  detail = detail === null || detail === undefined ? {} : detail;
  const event = new Event(type, {
    bubbles: options.bubbles === undefined ? true : options.bubbles,
    cancelable: Boolean(options.cancelable),
    composed: options.composed === undefined ? true : options.composed,
  });
  event.detail = detail;
  node.dispatchEvent(event);
  return event;
};

class SunPositionCardEditor extends HTMLElement {
  constructor() {
    super();
    this.langs = { de, en, fr, it: ita, nl, pl, cs };
    this._initialized = false;
  }
    
  setConfig(config) {
    this._config = config;
    if (this.shadowRoot) {
      this._render();
    }
  }

  set hass(hass) {
    this._hass = hass;
    if (this.shadowRoot) {
        // Aktualisiere hass auch für die neuen ha-selector Elemente
        this.shadowRoot.querySelectorAll("ha-selector").forEach(picker => {
            if (picker) {
                picker.hass = hass;
            }
        });
        // Fallback für verbleibende Picker, falls vorhanden
        this.shadowRoot.querySelectorAll("ha-entity-picker").forEach(picker => {
            if (picker) {
                picker.hass = hass;
            }
        });
        
        // Aktualisiere Sichtbarkeit des 12h-Schalters basierend auf Sprache
        const use12hContainer = this.shadowRoot.getElementById('use_12h_format_container');
        if (use12hContainer) {
            const currentLang = (this._config?.language || hass?.locale?.language || 'en').split('-')[0];
            const isEnglish = currentLang === 'en';
            
            if (isEnglish) {
                use12hContainer.classList.remove('hidden');
            } else {
                use12hContainer.classList.add('hidden');
            }
        }
    }
  }
  
  _localize(key, lang = this._config?.language || this._hass?.locale?.language || 'en') {
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

  connectedCallback() {
    if (!this.shadowRoot) {
        this.attachShadow({ mode: 'open' });
    }
    this._render();
  }
  
  _render() {
    if (!this.shadowRoot || !this._config) return;

    if (this._initialized) {
        this._updateValues();
        return;
    }

    this.shadowRoot.innerHTML = `
      <style>
        .card-config { display: flex; flex-direction: column; gap: 15px; padding: 8px; }
        .row { display: flex; align-items: center; margin-bottom: 3px; }
        .checkbox-group { display: flex; flex-direction: column; gap: 3px; margin-left: 16px; }
        ha-textfield, ha-selector { width: 100%; display: block; }
        h4 { margin-top: 24px; margin-bottom: 12px; border-bottom: 1px solid var(--divider-color); color: var(--primary-text-color); }
        .hidden { display: none; }
        .lang-specific { display: flex; }
      </style>

      <div class="card-config">
        
        <ha-selector
          id="entity"
          label="${this._localize('editor.entity')}"
        ></ha-selector>

        <ha-selector
          id="moon_entity"
          label="${this._localize('editor.moon_entity')}"
        ></ha-selector>

        <ha-selector
          id="weather_entity"
          label="${this._localize('editor.weather_entity')}"
        ></ha-selector>

        <div id="temp_entity_container" class="hidden">
             <ha-selector
              id="temp_entity"
              label="${this._localize('editor.temp_entity')}"
            ></ha-selector>
        </div>

        <div id="solar_entity_container" class="hidden">
             <ha-selector
              id="solar_entity"
              label="${this._localize('editor.solar_entity')}"
            ></ha-selector>
        </div>

        <h4>${this._localize('editor.main_options')}</h4>

        <ha-selector
          id="view_mode"
          label="${this._localize('editor.view_mode')}"
        ></ha-selector>
        
        <div id="sun_size_container" class="hidden">
             <ha-selector
              id="sun_size"
              label="${this._localize('editor.sun_size')}"
            ></ha-selector>
        </div>
        
        <div class="row">
          <ha-switch id="show_image"></ha-switch>
          <span style="margin-left: 16px;">${this._localize('editor.show_image')}</span>
        </div>

        <div id="weather_badge_toggle_container" class="row">
          <ha-switch id="show_weather_badge"></ha-switch>
          <span style="margin-left: 16px;">${this._localize('editor.show_weather_badge')}</span>
        </div>

        <div id="solar_badge_toggle_container" class="row hidden">
          <ha-switch id="show_solar_badge"></ha-switch>
          <span style="margin-left: 16px;">${this._localize('editor.show_solar_badge')}</span>
        </div>

        <div id="animate_images_container" class="row">
          <ha-switch id="animate_images"></ha-switch>
          <span style="margin-left: 16px;">${this._localize('editor.animate_images')}</span>
        </div>

        <ha-selector
          id="state_position"
          label="${this._localize('editor.state_position')}"
        ></ha-selector>
        
        <div id="moon_phase_position_container" class="hidden">
            <ha-selector
              id="moon_phase_position"
              label="${this._localize('editor.moon_phase_position')}"
            ></ha-selector>

            <div class="row" style="margin: 16px 0 10px 0;">
                <ha-switch id="show_night_arc"></ha-switch>
                <span style="margin-left: 16px;">${this._localize('editor.show_night_arc')}</span>
            </div>
            
            <div class="row" style="margin: 10px 0 10px 0;">
                <ha-switch id="hide_moon_phase_on_day"></ha-switch>
                <span style="margin-left: 16px;">${this._localize('editor.hide_moon_phase_on_day')}</span>
            </div>
            
             <div class="row">
                <ha-switch id="show_moon_icon_in_text"></ha-switch>
                <span style="margin-left: 16px;">${this._localize('editor.show_moon_icon_in_text')}</span>
            </div>
        </div>

        <div class="row">
          <ha-switch id="show_dividers"></ha-switch>
          <span style="margin-left: 16px;">${this._localize('editor.show_dividers')}</span>
        </div>

        <div class="row">
          <ha-switch id="show_degrees"></ha-switch>
          <span style="margin-left: 16px;">${this._localize('editor.show_degrees')}</span>
        </div>

        <div class="row">
          <ha-switch id="show_degrees_in_list"></ha-switch>
          <span style="margin-left: 16px;">${this._localize('editor.show_degrees_in_list')}</span>
        </div>

        <ha-selector
          id="time_position"
          label="${this._localize('editor.time_position')}"
        ></ha-selector>
        
        <ha-selector
          id="time_list_format"
          label="${this._localize('editor.time_list_format')}"
        ></ha-selector>

        <div class="row" id="use_12h_format_container">
          <ha-switch id="use_12h_format"></ha-switch>
          <span style="margin-left: 16px;">${this._localize('editor.use_12h_format')}</span>
        </div>

        <ha-selector
          id="language"
          label="${this._localize('editor.language')}"
        ></ha-selector>

        <h4>${this._localize('editor.times_to_show')}</h4>
        <div class="checkbox-group">
            ${this._renderCheckbox('daylight_duration', this._localize('time_entry.daylight_duration'))}
            ${this._renderCheckbox('day_comparison', this._localize('time_entry.day_comparison'))}
            ${this._renderCheckbox('next_rising', this._localize('time_entry.next_rising'))}
            ${this._renderCheckbox('next_setting', this._localize('time_entry.next_setting'))}
            ${this._renderCheckbox('next_dawn', this._localize('time_entry.next_dawn'))}
            ${this._renderCheckbox('next_dusk', this._localize('time_entry.next_dusk'))}
            ${this._renderCheckbox('next_noon', this._localize('time_entry.next_noon'))}
            ${this._renderCheckbox('next_midnight', this._localize('time_entry.next_midnight'))}
            <div id="moon_phase_checkbox_container" class="hidden">
                ${this._renderCheckbox('moon_phase', this._localize('time_entry.moon_phase'))}
            </div>
            <div id="weather_checkbox_container" class="hidden">
                ${this._renderCheckbox('weather', this._localize('time_entry.weather'))}
            </div>
        </div>

        <h4>${this._localize('editor.advanced_options')}</h4>
        <ha-textfield id="morning_azimuth" label="${this._localize('editor.morning_azimuth')}" type="number"></ha-textfield>
        <ha-textfield id="noon_azimuth" label="${this._localize('editor.noon_azimuth')}" type="number"></ha-textfield>
        <ha-textfield id="afternoon_azimuth" label="${this._localize('editor.afternoon_azimuth')}" type="number"></ha-textfield>
        <ha-textfield id="dusk_elevation" label="${this._localize('editor.dusk_elevation')}" type="number"></ha-textfield>
      </div>
    `;

    // Hier setzen wir die Selector-Konfiguration programmatisch
    const entitySelector = this.shadowRoot.getElementById('entity');
    if (entitySelector) {
        entitySelector.selector = { entity: { domain: "sun" } };
    }

    const moonSelector = this.shadowRoot.getElementById('moon_entity');
    if (moonSelector) {
        moonSelector.selector = { entity: { domain: "sensor" } };
        moonSelector.required = false; 
    }

    const weatherSelector = this.shadowRoot.getElementById('weather_entity');
    if (weatherSelector) {
        weatherSelector.selector = { entity: { domain: "weather" } };
        weatherSelector.required = false; 
    }

    // Temperatur Selector (nur Sensoren mit device_class temperature)
    const tempSelector = this.shadowRoot.getElementById('temp_entity');
    if (tempSelector) {
        tempSelector.selector = { entity: { domain: "sensor", device_class: "temperature" } };
        tempSelector.required = false; 
    }

    // Slider Konfiguration für Sun Size
    const sunSizeSelector = this.shadowRoot.getElementById('sun_size');
    if (sunSizeSelector) {
        sunSizeSelector.selector = { number: { min: 20, max: 120, mode: "slider", unit_of_measurement: "px" } };
    }

    // Solarleistung Selector (alle Sensoren, z.B. Power oder Irradiance)
    const solarSelector = this.shadowRoot.getElementById('solar_entity');
    if (solarSelector) {
        solarSelector.selector = { entity: { domain: "sensor" } };
        solarSelector.required = false;
    }

    // Dropdown-Selektoren konfigurieren (ha-selector mit select-Typ)
    const viewModeSelector = this.shadowRoot.getElementById('view_mode');
    if (viewModeSelector) {
        viewModeSelector.selector = { select: { options: [
            { value: "classic", label: this._localize('editor.view_mode_classic') },
            { value: "calculated", label: this._localize('editor.view_mode_calculated') },
            { value: "arc", label: this._localize('editor.view_mode_arc') }
        ], mode: "dropdown" } };
    }

    const statePositionSelector = this.shadowRoot.getElementById('state_position');
    if (statePositionSelector) {
        statePositionSelector.selector = { select: { options: [
            { value: "above", label: this._localize('editor.state_pos_above') },
            { value: "in_list", label: this._localize('editor.state_pos_in_list') },
            { value: "hide", label: this._localize('editor.state_pos_hide') }
        ], mode: "dropdown" } };
    }

    const moonPhasePositionSelector = this.shadowRoot.getElementById('moon_phase_position');
    if (moonPhasePositionSelector) {
        moonPhasePositionSelector.selector = { select: { options: [
            { value: "in_list", label: this._localize('editor.state_pos_in_list') },
            { value: "above", label: this._localize('editor.state_pos_above') }
        ], mode: "dropdown" } };
    }

    const timePositionSelector = this.shadowRoot.getElementById('time_position');
    if (timePositionSelector) {
        timePositionSelector.selector = { select: { options: [
            { value: "below", label: this._localize('editor.time_pos_below') },
            { value: "above", label: this._localize('editor.time_pos_above') },
            { value: "right", label: this._localize('editor.time_pos_right') }
        ], mode: "dropdown" } };
    }

    const timeListFormatSelector = this.shadowRoot.getElementById('time_list_format');
    if (timeListFormatSelector) {
        timeListFormatSelector.selector = { select: { options: [
            { value: "centered", label: this._localize('editor.time_format_centered') },
            { value: "block", label: this._localize('editor.time_format_block') }
        ], mode: "dropdown" } };
    }

    const languageSelector = this.shadowRoot.getElementById('language');
    if (languageSelector) {
        languageSelector.selector = { select: { options: [
            { value: "", label: this._localize('editor.language_auto') },
            { value: "de", label: "Deutsch" },
            { value: "en", label: "English" },
            { value: "fr", label: "Français" },
            { value: "it", label: "Italiano" },
            { value: "nl", label: "Nederlands" },
            { value: "pl", label: "Polski" },
            { value: "cs", label: "Čeština" }
        ], mode: "dropdown" } };
    }

    this._attachListeners();
    this._initialized = true;
    this._updateValues();
  }

  _attachListeners() {
    const root = this.shadowRoot;
    
    const add = (id, event) => {
        const el = root.getElementById(id);
        if(el) {
            el.configValue = id;
            el.addEventListener(event, this._valueChanged.bind(this));
        }
    };

    add('entity', 'value-changed');
    add('moon_entity', 'value-changed');
    add('weather_entity', 'value-changed');
    add('temp_entity', 'value-changed');
    add('solar_entity', 'value-changed');
    add('view_mode', 'value-changed');
    add('sun_size', 'value-changed');
    add('state_position', 'value-changed');
    add('moon_phase_position', 'value-changed');
    add('time_position', 'value-changed');
    add('time_list_format', 'value-changed');
    add('language', 'value-changed');
    
    add('show_image', 'change');
    add('show_weather_badge', 'change');
    add('show_solar_badge', 'change');
    add('animate_images', 'change');
    add('hide_moon_phase_on_day', 'change');
    add('show_night_arc', 'change');
    add('show_moon_icon_in_text', 'change'); 
    add('show_dividers', 'change');
    add('show_degrees', 'change');
    add('show_degrees_in_list', 'change');
    add('use_12h_format', 'change');

    add('morning_azimuth', 'change');
    add('noon_azimuth', 'change');
    add('afternoon_azimuth', 'change');
    add('dusk_elevation', 'change');

    const checkboxes = root.querySelectorAll('ha-checkbox');
    checkboxes.forEach(cb => {
        cb.addEventListener('change', this._timeCheckboxChanged.bind(this));
    });
  }

  _updateValues() {
    const config = this._config;
    const root = this.shadowRoot;

    const setVal = (id, val) => {
        const el = root.getElementById(id);
        if(el) el.value = val;
    };
    
    const setCheck = (id, val) => {
        const el = root.getElementById(id);
        if(el) el.checked = val;
    };

    setVal('entity', config.entity);
    setVal('moon_entity', config.moon_entity || '');
    setVal('weather_entity', config.weather_entity || '');
    setVal('temp_entity', config.temp_entity || '');
    setVal('solar_entity', config.solar_entity || '');
    setVal('sun_size', config.sun_size || 50);
    
    setVal('view_mode', config.view_mode || 'classic');
    setVal('state_position', config.state_position || 'in_list');
    setVal('moon_phase_position', config.moon_phase_position || 'in_list');
    setVal('time_position', config.time_position || 'right');
    setVal('time_list_format', config.time_list_format || 'centered');
    setVal('language', config.language || '');

    setCheck('show_image', config.show_image ?? true);
    setCheck('show_weather_badge', config.show_weather_badge ?? true);
    setCheck('show_solar_badge', config.show_solar_badge ?? true); 
    setCheck('animate_images', config.animate_images ?? false);
    setCheck('hide_moon_phase_on_day', config.hide_moon_phase_on_day ?? false);
    setCheck('show_night_arc', config.show_night_arc ?? false);
    setCheck('show_moon_icon_in_text', config.show_moon_icon_in_text ?? false); 
    setCheck('show_dividers', config.show_dividers ?? true);
    setCheck('show_degrees', config.show_degrees ?? true);
    setCheck('show_degrees_in_list', config.show_degrees_in_list ?? false);
    setCheck('use_12h_format', config.use_12h_format ?? false);

    setVal('morning_azimuth', config.morning_azimuth || 150);
    setVal('noon_azimuth', config.noon_azimuth || 200);
    setVal('afternoon_azimuth', config.afternoon_azimuth || 255);
    setVal('dusk_elevation', config.dusk_elevation || 9);

    const sunSizeContainer = root.getElementById('sun_size_container');

    // Sichtbarkeit des Sun Size Sliders wenn ViewMode 'arc' IST ODER wenn NightArc aktiviert ist
    if (config.view_mode === 'arc' || config.show_night_arc) {
        sunSizeContainer.classList.remove('hidden');
    } else {
        sunSizeContainer.classList.add('hidden');
    }

    // Sichtbarkeit des 12h Format Schalters nur für Englisch
    const use12hContainer = root.getElementById('use_12h_format_container');
    if (use12hContainer) {
        const currentLang = (config.language || this._hass?.locale?.language || 'en').split('-')[0];
        const isEnglish = currentLang === 'en';
        
        if (isEnglish) {
            use12hContainer.classList.remove('hidden');
        } else {
            use12hContainer.classList.add('hidden');
        }
    }

    // Steuerung der Sichtbarkeit für alle Mond-Optionen
    const moonPosContainer = root.getElementById('moon_phase_position_container');
    const moonCheckContainer = root.getElementById('moon_phase_checkbox_container');
    if (config.moon_entity) {
        moonPosContainer.classList.remove('hidden');
        moonCheckContainer.classList.remove('hidden');
    } else {
        moonPosContainer.classList.add('hidden');
        moonCheckContainer.classList.add('hidden');
    }

    // Wetter Checkbox Sichtbarkeit
    const weatherCheckContainer = root.getElementById('weather_checkbox_container');
    const weatherBadgeToggleContainer = root.getElementById('weather_badge_toggle_container');
    const tempEntityContainer = root.getElementById('temp_entity_container');
    const solarEntityContainer = root.getElementById('solar_entity_container');
    const solarBadgeToggleContainer = root.getElementById('solar_badge_toggle_container');
    
    if (config.weather_entity) {
        weatherCheckContainer.classList.remove('hidden');
        weatherBadgeToggleContainer.classList.remove('hidden');
        tempEntityContainer.classList.remove('hidden');
        solarEntityContainer.classList.remove('hidden');
        if (config.solar_entity) {
            solarBadgeToggleContainer.classList.remove('hidden');
        } else {
            solarBadgeToggleContainer.classList.add('hidden');
        }
    } else {
        weatherCheckContainer.classList.add('hidden');
        weatherBadgeToggleContainer.classList.add('hidden');
        tempEntityContainer.classList.add('hidden');
        solarEntityContainer.classList.add('hidden');
        solarBadgeToggleContainer.classList.add('hidden');
    }

    const times = config.times_to_show || [];
    const checkboxes = root.querySelectorAll('ha-checkbox');
    checkboxes.forEach(cb => {
        const val = cb.getAttribute('value');
        cb.checked = times.includes(val);
    });
    
    if (this._hass) {
        // hass auch an Selektoren übergeben
        root.querySelectorAll("ha-selector").forEach(picker => {
            picker.hass = this._hass;
        });
        root.querySelectorAll("ha-entity-picker").forEach(picker => {
            picker.hass = this._hass;
        });
    }
  }

  _renderCheckbox(value, label) {
    return `
      <div class="row">
        <ha-checkbox value="${value}"></ha-checkbox>
        <span style="margin-left: 16px;">${label}</span>
      </div>
    `;
  }

  _timeCheckboxChanged(ev) {
    const checkbox = ev.target;
    const value = checkbox.getAttribute('value');
    const checked = checkbox.checked;
    
    const oldTimes = this._config.times_to_show || [];
    let newTimes = [...oldTimes];

    if (checked && !newTimes.includes(value)) {
        newTimes.push(value);
    } else if (!checked) {
        newTimes = newTimes.filter(t => t !== value);
    }
    
    fireEvent(this, "config-changed", { config: { ...this._config, times_to_show: newTimes } });
  }

  _valueChanged(ev) {
    if (!this._config) return;
    const target = ev.target;
    const configValue = target.configValue;
    if (!configValue) return;

    let newValue;
    
    // Check für ha-selector Werte (liegen in ev.detail.value)
    if (ev.detail && 'value' in ev.detail) {
        newValue = ev.detail.value;
    } 
    // Fallback & andere Elemente
    else if (target.tagName === 'HA-SWITCH') {
        newValue = target.checked;
    } else if (target.type === 'number') {
        newValue = Number(target.value);
    } else {
        newValue = target.value;
    }

    if (this._config[configValue] === newValue) return;
    
    let newConfig = { ...this._config };
    
    if (newValue === undefined || newValue === null || newValue === '') {
        delete newConfig[configValue];
    } else {
        newConfig[configValue] = newValue;
        // Spezielle Logik für state_position zurücksetzen (Legacy)
        if (configValue === 'state_position') {
             delete newConfig.show_state_in_times;
        }
    }

    // Cleanup Moon Entity wenn gelöscht
    if (configValue === 'moon_entity' && !newConfig.moon_entity) {
         if (newConfig.times_to_show) {
            newConfig.times_to_show = newConfig.times_to_show.filter(t => t !== 'moon_phase');
         }
         delete newConfig.moon_entity;
         delete newConfig.moon_phase_position;
         delete newConfig.hide_moon_phase_on_day;
         delete newConfig.show_night_arc;
         delete newConfig.show_moon_icon_in_text;
    }
    // Cleanup Wetter wenn gelöscht
    if (configValue === 'weather_entity' && !newConfig.weather_entity) {
         if (newConfig.times_to_show) {
            newConfig.times_to_show = newConfig.times_to_show.filter(t => t !== 'weather');
         }
         delete newConfig.weather_entity;
         delete newConfig.show_weather_badge; 
         delete newConfig.temp_entity;
         delete newConfig.solar_entity;
         delete newConfig.show_solar_badge;
    }
    // Cleanup Solar Entity wenn gelöscht
    if (configValue === 'solar_entity' && !newConfig.solar_entity) {
         delete newConfig.solar_entity;
         delete newConfig.show_solar_badge;
    }

    // Wenn Sprache geändert wird, Editor neu rendern für aktualisierte Labels
    if (configValue === 'language') {
        this._initialized = false;
    }

    fireEvent(this, "config-changed", { config: newConfig });
  }
}

customElements.define('sun-position-card-editor', SunPositionCardEditor);
