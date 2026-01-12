---
name: Add Translation
about: Create a new translation file
title: ''
labels: ''
assignees: ''

---

**Add Translation for ____ YOUR Language ____**
You can help me with your translation.
This file you have to translate, all positions!

Send it back to me and i will create a new translation file.

```js
export default {
    card: {
        name: "Sun Position Card",
        description: "Sun and Moon position with custom images."
    },
    error: {
        no_sun_entity: "Please define a sun entity.",
        entity_not_found: "Entity not found: "
    },
    sun_state: {
        below_horizon: "Below Horizon",
        dawn: "Dawn",
        morning: "Morning",
        noon: "Noon",
        afternoon: "Afternoon",
        evening: "Evening"
    },
    moon_phase: {
        new_moon: 'New Moon',
        waxing_crescent: 'Waxing Crescent',
        first_quarter: 'First Quarter',
        waxing_gibbous: 'Waxing Gibbous',
        full_moon: 'Full Moon',
        waning_gibbous: 'Waning Gibbous',
        last_quarter: 'Last Quarter',
        waning_crescent: 'Waning Crescent'
    },
    weather_state: {
        'clear-night': 'Clear Night',
        'cloudy': 'Cloudy',
        'fog': 'Fog',
        'hail': 'Hail',
        'lightning': 'Lightning',
        'lightning-rainy': 'Lightning & Rainy',
        'partlycloudy': 'Partly Cloudy',
        'pouring': 'Pouring',
        'rainy': 'Rainy',
        'snowy': 'Snowy',
        'snowy-rainy': 'Snowy & Rainy',
        'sunny': 'Sunny',
        'windy': 'Windy',
        'windy-variant': 'Windy',
        'exceptional': 'Exceptional'
    },
    time_entry: {
        current: "Current",
        azimuth: "Azimuth",
        elevation: "Elevation",
        daylight_duration: "Daylight Duration",
        next_rising: "Sunrise",
        next_setting: "Sunset",
        next_dawn: "Dawn",
        next_dusk: "Dusk",
        next_noon: "Noon",
        next_midnight: "Midnight",
        moon_phase: "Moon Phase",
        weather: "Weather"
    },
    editor: {
        entity: "Sun Entity",
        moon_entity: "Moon Entity (Optional)",
        weather_entity: "Weather Entity (Optional)",
        temp_entity: "Temperature Entity (Optional, overrides weather)",
        main_options: "Display Options",
        view_mode: "View Mode",
        view_mode_classic: "Classic (6 Images)",
        view_mode_calculated: "Calculated (Elevation only)",
        view_mode_arc: "Arc (180° Movement)",
        show_image: "Show Sun Position (Image)",
        show_weather_badge: "Show Weather Badge",
        animate_images: "Animate Images (except morning/twilight image)",
        sun_size: "Sun Size (Arc only)",
        state_position: "State Position",
        state_pos_above: "Above Image",
        state_pos_in_list: "In List",
        state_pos_hide: "Hide",
        moon_phase_position: "Moon Phase Position",
        hide_moon_phase_on_day: "Hide Moon Phase during day",
        show_moon_icon_in_text: "Show Moon Icon in text",
        show_dividers: "Show Dividers",
        show_degrees: "Show Degrees (Azimuth/Elevation)",
        show_degrees_in_list: "Show Degrees in List",
        time_position: "Time Position",
        time_pos_below: "Below Image",
        time_pos_above: "Above Image",
        time_pos_right: "Right of Image",
        time_list_format: "Time List Alignment",
        time_format_centered: "Centered",
        time_format_block: "Block",
        times_to_show: "Select Times",
        advanced_options: "Thresholds (Advanced)",
        morning_azimuth: "Morning Azimuth",
        noon_azimuth: "Noon Azimuth",
        afternoon_azimuth: "Afternoon Azimuth",
        dusk_elevation: "Dusk Elevation"
    }
};
```
