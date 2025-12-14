import de from './lang-de.js';
import en from './lang-en.js';

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
    this.langs = { de, en };
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
        this.shadowRoot.querySelectorAll("ha-entity-picker").forEach(picker => {
            if (picker) {
                picker.hass = hass;
            }
        });
    }
  }
  
  _localize(key, lang = this._hass?.locale?.language || 'en') {
    const keys = key.split('.');
    let a = this.langs[lang];
    for (const k of keys) {
        if (typeof a[k] === 'undefined') {
            console.error(`Missing translation for ${key} in ${lang}`);
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

    const config = this._config;
    const times = config.times_to_show || [];
    const hasTime = (t) => times.includes(t);
    
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

    this.shadowRoot.innerHTML = `
      <style>
        .card-config { display: flex; flex-direction: column; gap: 16px; padding: 8px; }
        .row { display: flex; align-items: center; margin-bottom: 8px; }
        .checkbox-group { display: flex; flex-direction: column; gap: 8px; margin-left: 16px; }
        ha-textfield, ha-select, ha-entity-picker { width: 100%; display: block; }
        h4 { margin-top: 24px; margin-bottom: 12px; border-bottom: 1px solid var(--divider-color); color: var(--primary-text-color); }
        .hidden { display: none; }
      </style>

      <div class="card-config">
        
        <ha-entity-picker
          id="entity"
          label="${this._localize('editor.entity')}"
          domain-filter="sun"
          allow-custom-entity
        ></ha-entity-picker>

        <ha-entity-picker
          id="moon_entity"
          label="${this._localize('editor.moon_entity')}"
          domain-filter="sensor"
          allow-custom-entity
        ></ha-entity-picker>

        <h4>${this._localize('editor.main_options')}</h4>
        
        <div class="row">
          <ha-switch id="show_image"></ha-switch>
          <span style="margin-left: 16px;">${this._localize('editor.show_image')}</span>
        </div>

        <div class="row">
          <ha-switch id="animate_images"></ha-switch>
          <span style="margin-left: 16px;">${this._localize('editor.animate_images')}</span>
        </div>

        <ha-select
          id="state_position"
          label="${this._localize('editor.state_position')}"
          fixedMenuPosition
          naturalMenuWidth
        >
          <mwc-list-item value="above">${this._localize('editor.state_pos_above')}</mwc-list-item>
          <mwc-list-item value="in_list">${this._localize('editor.state_pos_in_list')}</mwc-list-item>
          <mwc-list-item value="hide">${this._localize('editor.state_pos_hide')}</mwc-list-item>
        </ha-select>
        
        <div id="moon_phase_position_container" class="${config.moon_entity ? '' : 'hidden'}">
            <ha-select
              id="moon_phase_position"
              label="${this._localize('editor.moon_phase_position')}"
              fixedMenuPosition
              naturalMenuWidth
            >
              <mwc-list-item value="in_list">${this._localize('editor.state_pos_in_list')}</mwc-list-item>
              <mwc-list-item value="above">${this._localize('editor.state_pos_above')}</mwc-list-item>
            </ha-select>
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

        <ha-select
          id="time_position"
          label="${this._localize('editor.time_position')}"
          fixedMenuPosition
          naturalMenuWidth
        >
          <mwc-list-item value="below">${this._localize('editor.time_pos_below')}</mwc-list-item>
          <mwc-list-item value="above">${this._localize('editor.time_pos_above')}</mwc-list-item>
          <mwc-list-item value="right">${this._localize('editor.time_pos_right')}</mwc-list-item>
        </ha-select>
        
        <ha-select
          id="time_list_format"
          label="${this._localize('editor.time_list_format')}"
          fixedMenuPosition
          naturalMenuWidth
        >
          <mwc-list-item value="centered">${this._localize('editor.time_format_centered')}</mwc-list-item>
          <mwc-list-item value="block">${this._localize('editor.time_format_block')}</mwc-list-item>
        </ha-select>

        <h4>${this._localize('editor.times_to_show')}</h4>
        <div class="checkbox-group">
            ${this._renderCheckbox('daylight_duration', this._localize('time_entry.daylight_duration'), hasTime('daylight_duration'))}
            ${this._renderCheckbox('next_rising', this._localize('time_entry.next_rising'), hasTime('next_rising'))}
            ${this._renderCheckbox('next_setting', this._localize('time_entry.next_setting'), hasTime('next_setting'))}
            ${this._renderCheckbox('next_dawn', this._localize('time_entry.next_dawn'), hasTime('next_dawn'))}
            ${this._renderCheckbox('next_dusk', this._localize('time_entry.next_dusk'), hasTime('next_dusk'))}
            ${this._renderCheckbox('next_noon', this._localize('time_entry.next_noon'), hasTime('next_noon'))}
            ${this._renderCheckbox('next_midnight', this._localize('time_entry.next_midnight'), hasTime('next_midnight'))}
            <div id="moon_phase_checkbox_container" class="${config.moon_entity ? '' : 'hidden'}">
                ${this._renderCheckbox('moon_phase', this._localize('time_entry.moon_phase'), hasTime('moon_phase'))}
            </div>
        </div>

        <h4>${this._localize('editor.advanced_options')}</h4>
        <ha-textfield
            id="morning_azimuth"
            label="${this._localize('editor.morning_azimuth')}"
            type="number"
        ></ha-textfield>
        <ha-textfield
            id="noon_azimuth"
            label="${this._localize('editor.noon_azimuth')}"
            type="number"
        ></ha-textfield>
        <ha-textfield
            id="afternoon_azimuth"
            label="${this._localize('editor.afternoon_azimuth')}"
            type="number"
        ></ha-textfield>
        <ha-textfield
            id="dusk_elevation"
            label="${this._localize('editor.dusk_elevation')}"
            type="number"
        ></ha-textfield>

      </div>
    `;

    const setupEl = (id, value, event = 'change') => {
        const el = this.shadowRoot.getElementById(id);
        if (el) {
            if (el.tagName === 'HA-SWITCH') {
                el.checked = value;
            } else {
                el.value = value;
            }
            el.addEventListener(event, this._valueChanged.bind(this));
            el.configValue = id;
        }
        return el;
    }

    setupEl('entity', config.entity || 'sun.sun');
    setupEl('moon_entity', config.moon_entity || '');
    setupEl('show_image', config.show_image ?? true);
    setupEl('animate_images', config.animate_images ?? false);
    setupEl('state_position', statePosition, 'selected');
    setupEl('moon_phase_position', config.moon_phase_position || 'in_list', 'selected');
    setupEl('show_dividers', config.show_dividers ?? true);
    setupEl('show_degrees', config.show_degrees ?? true);
    setupEl('show_degrees_in_list', config.show_degrees_in_list ?? false);
    setupEl('time_position', config.time_position || 'right');
    setupEl('time_list_format', config.time_list_format || 'centered');
    setupEl('morning_azimuth', config.morning_azimuth || 150);
    setupEl('noon_azimuth', config.noon_azimuth || 200);
    setupEl('afternoon_azimuth', config.afternoon_azimuth || 255);
    setupEl('dusk_elevation', config.dusk_elevation || 9);
    
    this.shadowRoot.querySelectorAll('ha-select').forEach(el => {
        el.addEventListener('closed', (e) => e.stopPropagation());
    });
    
    this.shadowRoot.querySelectorAll('ha-entity-picker').forEach(picker => {
        if (picker && this._hass) {
            picker.hass = this._hass;
        }
    });

    const checkboxes = this.shadowRoot.querySelectorAll('ha-checkbox');
    checkboxes.forEach(cb => {
        cb.addEventListener('change', this._timeCheckboxChanged.bind(this));
    });
  }

  _renderCheckbox(value, label, checked) {
    return `
      <div class="row">
        <ha-checkbox value="${value}" ${checked ? 'checked' : ''}></ha-checkbox>
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
    if (target.tagName === 'HA-SWITCH') {
        newValue = target.checked;
    } else if (target.type === 'number') {
        newValue = Number(target.value);
    } else {
        newValue = target.value;
    }

    if (this._config[configValue] === newValue) return;
    
    let newConfig = { ...this._config };

    if (configValue === 'moon_entity') {
        const positionContainer = this.shadowRoot.getElementById('moon_phase_position_container');
        const checkboxContainer = this.shadowRoot.getElementById('moon_phase_checkbox_container');
        if (newValue) {
            positionContainer.classList.remove('hidden');
            checkboxContainer.classList.remove('hidden');
        } else {
            positionContainer.classList.add('hidden');
            checkboxContainer.classList.add('hidden');
            
            if (newConfig.times_to_show) {
                newConfig.times_to_show = newConfig.times_to_show.filter(t => t !== 'moon_phase');
            }
        }
    }
    
    if (configValue === 'state_position') {
        newConfig.state_position = newValue;
        delete newConfig.show_state_in_times;
    } else {
        newConfig[configValue] = newValue;
    }
    
    const orderedConfig = {
        type: newConfig.type,
        entity: newConfig.entity,
        moon_entity: newConfig.moon_entity,
        moon_phase_position: newConfig.moon_phase_position,
        ...newConfig
    };
    
    if (!orderedConfig.moon_entity) {
        delete orderedConfig.moon_entity;
        delete orderedConfig.moon_phase_position;
    }

    fireEvent(this, "config-changed", { config: orderedConfig });
  }
}

customElements.define('sun-position-card-editor', SunPositionCardEditor);
