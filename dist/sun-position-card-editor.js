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
  setConfig(config) {
    this._config = config;
    if (this.shadowRoot) {
      this._render();
    }
  }

  set hass(hass) {
    this._hass = hass;
    if (this.shadowRoot) {
      const entityPicker = this.shadowRoot.querySelector("ha-entity-picker");
      if (entityPicker) {
        entityPicker.hass = hass;
      }
    }
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
      </style>

      <div class="card-config">
        
        <ha-entity-picker
          id="entity"
          label="Sun Entity"
          domain-filter="sun"
          allow-custom-entity
        ></ha-entity-picker>

        <h4>Anzeigeoptionen</h4>
        
        <div class="row">
          <ha-switch id="show_image"></ha-switch>
          <span style="margin-left: 16px;">Sonnenstand (Bild) anzeigen</span>
        </div>

        <ha-select
          id="state_position"
          label="Position des Status"
          fixedMenuPosition
          naturalMenuWidth
        >
          <mwc-list-item value="above">Über dem Bild</mwc-list-item>
          <mwc-list-item value="in_list">In der Liste</mwc-list-item>
          <mwc-list-item value="hide">Ausblenden</mwc-list-item>
        </ha-select>

        <div class="row">
          <ha-switch id="show_dividers"></ha-switch>
          <span style="margin-left: 16px;">Trennlinien anzeigen</span>
        </div>

        <div class="row">
          <ha-switch id="show_degrees"></ha-switch>
          <span style="margin-left: 16px;">Gradzahlen anzeigen (Azimut/Elevation)</span>
        </div>

        <div class="row">
          <ha-switch id="show_degrees_in_list"></ha-switch>
          <span style="margin-left: 16px;">Gradzahlen in Liste anzeigen</span>
        </div>

        <ha-select
          id="time_position"
          label="Position der Zeiten"
          fixedMenuPosition
          naturalMenuWidth
        >
          <mwc-list-item value="below">Unter dem Bild</mwc-list-item>
          <mwc-list-item value="above">Über dem Bild</mwc-list-item>
          <mwc-list-item value="right">Rechts neben Bild</mwc-list-item>
        </ha-select>

        <h4>Zeiten auswählen</h4>
        <div class="checkbox-group">
            ${this._renderCheckbox('next_rising', 'Sonnenaufgang', hasTime('next_rising'))}
            ${this._renderCheckbox('next_setting', 'Sonnenuntergang', hasTime('next_setting'))}
            ${this._renderCheckbox('next_dawn', 'Morgendämmerung', hasTime('next_dawn'))}
            ${this._renderCheckbox('next_dusk', 'Abenddämmerung', hasTime('next_dusk'))}
            ${this._renderCheckbox('next_noon', 'Mittag', hasTime('next_noon'))}
            ${this._renderCheckbox('next_midnight', 'Mitternacht', hasTime('next_midnight'))}
        </div>

        <h4>Schwellwerte (Erweitert)</h4>
        <ha-textfield
            id="morning_azimuth"
            label="Morgen Azimut"
            type="number"
        ></ha-textfield>
        <ha-textfield
            id="noon_azimuth"
            label="Mittag Azimut"
            type="number"
        ></ha-textfield>
        <ha-textfield
            id="afternoon_azimuth"
            label="Nachmittag Azimut"
            type="number"
        ></ha-textfield>
        <ha-textfield
            id="dusk_elevation"
            label="Dämmerung Elevation"
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
    setupEl('show_image', config.show_image ?? true);
    setupEl('state_position', statePosition, 'above', 'selected'); 
    setupEl('show_dividers', config.show_dividers ?? true);
    setupEl('show_degrees', config.show_degrees ?? true);
    setupEl('show_degrees_in_list', config.show_degrees_in_list ?? false);
    setupEl('time_position', config.time_position || 'right', 'selected');
    setupEl('morning_azimuth', config.morning_azimuth || 150);
    setupEl('noon_azimuth', config.noon_azimuth || 200);
    setupEl('afternoon_azimuth', config.afternoon_azimuth || 255);
    setupEl('dusk_elevation', config.dusk_elevation || 10);
    
    this.shadowRoot.querySelectorAll('ha-select').forEach(el => {
        el.addEventListener('closed', (e) => e.stopPropagation());
    });
    
    const picker = this.shadowRoot.getElementById('entity');
    if (picker && this._hass) {
        picker.hass = this._hass;
    }

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

    const newConfig = { ...this._config };
    
    if (configValue === 'state_position') {
        newConfig.state_position = newValue;
        delete newConfig.show_state_in_times;
    } else {
        newConfig[configValue] = newValue;
    }

    fireEvent(this, "config-changed", { config: newConfig });
  }
}

customElements.define('sun-position-card-editor', SunPositionCardEditor);
