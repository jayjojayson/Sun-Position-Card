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

// ---------------------------------------------------------------------------
// Astronomie (vereinfachte Formeln, Genauigkeit ~1°) für die 3D-Kuppel:
// Sonnen- und Mondbahn aus Breiten-/Längengrad, Mondphase als Fallback.
// ---------------------------------------------------------------------------
const RAD = Math.PI / 180;
const OBLIQUITY = RAD * 23.4397;
const toDays = (date) => date.valueOf() / 864e5 - 0.5 + 2440588 - 2451545;
const rightAscension = (l, b) => Math.atan2(Math.sin(l) * Math.cos(OBLIQUITY) - Math.tan(b) * Math.sin(OBLIQUITY), Math.cos(l));
const declination = (l, b) => Math.asin(Math.sin(b) * Math.cos(OBLIQUITY) + Math.cos(b) * Math.sin(OBLIQUITY) * Math.sin(l));

const sunLongitude = (d) => {
  const M = RAD * (357.5291 + 0.98560028 * d);
  const C = RAD * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
  return M + C + RAD * 102.9372 + Math.PI;
};

const moonEcliptic = (d) => {
  const L = RAD * (218.316 + 13.176396 * d);
  const M = RAD * (134.963 + 13.064993 * d);
  const F = RAD * (93.272 + 13.229350 * d);
  return { l: L + RAD * 6.289 * Math.sin(M), b: RAD * 5.128 * Math.sin(F) };
};

// Azimut (0° = Norden, im Uhrzeigersinn) und Höhe in Grad
const horizontalPosition = (date, lat, lng, l, b) => {
  const d = toDays(date);
  const phi = RAD * lat;
  const dec = declination(l, b);
  const H = RAD * (280.16 + 360.9856235 * d) + RAD * lng - rightAscension(l, b);
  const alt = Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
  const azSouth = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi));
  return { az: ((azSouth / RAD) + 540) % 360, alt: alt / RAD };
};

const sunPosition = (date, lat, lng) => horizontalPosition(date, lat, lng, sunLongitude(toDays(date)), 0);

const moonPosition = (date, lat, lng) => {
  const m = moonEcliptic(toDays(date));
  return horizontalPosition(date, lat, lng, m.l, m.b);
};

const moonPhaseFromDate = (date) => {
  const d = toDays(date);
  const elongation = (((moonEcliptic(d).l - sunLongitude(d)) / RAD) % 360 + 360) % 360;
  return MOON_PHASES[Math.round(elongation / 45) % 8];
};

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
    // Eindeutige ID-Präfixe für SVG-Verläufe/Clips (mehrere Cards auf einem Dashboard)
    this._uid = 'spc' + Math.random().toString(36).slice(2, 8);
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

  // Bildquelle (wird von build.js auf die eingebetteten Data-URIs umgestellt)
  _imageSrc(image) {
    const newSrc = `/local/community/Sun-Position-Card/images/${image}`;
    return newSrc;
  }

  /**
   * Animierter Wetter-Layer als SVG-Gruppe rund um den Ursprung (0,0) = Sonne bzw. Mond.
   * Der Aufrufer verschiebt die Gruppe an die gewünschte Position.
   */
  _weatherLayer(state, isDay) {
    const uid = this._uid;
    let seed = 11;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    const n1 = (v) => v.toFixed(1);

    const light = isDay ? ['#ffffff', '#dbe4ee'] : ['#c4cedb', '#8995a6'];
    const dark = isDay ? ['#b9c3cf', '#737e8c'] : ['#7d8898', '#4a5462'];

    const defs = `<defs>
      <linearGradient id="${uid}-cl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${light[0]}"/><stop offset="1" stop-color="${light[1]}"/></linearGradient>
      <linearGradient id="${uid}-cd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${dark[0]}"/><stop offset="1" stop-color="${dark[1]}"/></linearGradient>
      <radialGradient id="${uid}-sg"><stop offset="0" stop-color="#fff3b0" stop-opacity=".6"/><stop offset="1" stop-color="#ffd54f" stop-opacity="0"/></radialGradient>
      <filter id="${uid}-blur" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="2.5"/></filter>
    </defs>`;

    const cloud = (x, y, s, tone, dur, delay, op = 0.95) =>
      `<g class="spc-drift" style="animation-duration:${dur}s;animation-delay:-${delay}s">` +
      `<g transform="translate(${x} ${y}) scale(${s})" opacity="${op}" fill="url(#${uid}-${tone})">` +
      `<ellipse cx="0" cy="8" rx="34" ry="11"/><circle cx="-16" cy="2" r="12"/><circle cx="-1" cy="-6" r="17"/><circle cx="17" cy="0" r="13"/>` +
      `</g></g>`;

    const rays = () => {
      let lines = '';
      for (let i = 0; i < 12; i++) {
        const a = i * 30 * RAD;
        lines += `<line x1="${n1(Math.cos(a) * 19)}" y1="${n1(Math.sin(a) * 19)}" x2="${n1(Math.cos(a) * 30)}" y2="${n1(Math.sin(a) * 30)}"/>`;
      }
      return `<circle r="36" fill="url(#${uid}-sg)" class="spc-pulse"/>` +
        `<g class="spc-rays" stroke="#ffd54f" stroke-width="2.5" stroke-linecap="round" opacity=".85">${lines}</g>`;
    };

    const drops = (count, heavy) => {
      const dur = heavy ? 0.6 : 0.9;
      let s = '';
      for (let i = 0; i < count; i++) {
        const x = -48 + rnd() * 96, y = 12 + rnd() * 8, len = heavy ? 11 : 8;
        s += `<line class="spc-drop" style="animation-duration:${dur}s;animation-delay:-${(rnd() * dur).toFixed(2)}s"x1="${n1(x)}" y1="${n1(y)}" x2="${n1(x - 2)}" y2="${n1(y + len)}"/>`;
      }
      return `<g stroke="#8fc8ff" stroke-width="${heavy ? 1.8 : 1.4}" stroke-linecap="round" opacity=".9">${s}</g>`;
    };

    const particles = (count, cls, r, fill, dur) => {
      let s = '';
      for (let i = 0; i < count; i++) {
        s += `<circle class="${cls}" style="animation-duration:${dur}s;animation-delay:-${n1(rnd() * dur)}s" cx="${n1(-48 + rnd() * 96)}" cy="${n1(12 + rnd() * 10)}" r="${n1(r * (0.7 + rnd() * 0.6))}"/>`;
      }
      return `<g fill="${fill}">${s}</g>`;
    };

    const stars = () => {
      let s = '';
      for (let i = 0; i < 12; i++) {
        s += `<circle class="spc-twinkle" style="animation-delay:-${n1(rnd() * 3)}s" cx="${n1(-70 + rnd() * 140)}" cy="${n1(-45 + rnd() * 70)}" r="${n1(0.8 + rnd() * 1)}"/>`;
      }
      return `<g fill="#fff">${s}</g>`;
    };

    const bolt = () => `<polygon class="spc-bolt" points="6,10 -5,30 2,30 -5,50 13,24 5,24 11,10" fill="#ffe066" stroke="#fff6bf" stroke-width=".8"/>`;
    const flash = () => `<rect class="spc-flash" x="-240" y="-180" width="480" height="360" fill="#fff"/>`;

    const fog = () => {
      let s = '';
      for (let i = 0; i < 4; i++) {
        s += `<rect class="spc-fog-band" style="animation-delay:-${i * 2.3}s" x="${-75 + i * 6}" y="${-18 + i * 11}" width="${150 - i * 12}" height="8" rx="4"/>`;
      }
      return `<g fill="#fff" opacity=".45" filter="url(#${uid}-blur)">${s}</g>`;
    };

    const wind = () =>
      `<g fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".85">` +
      `<path class="spc-wind" d="M -80 -10 q 30 -12 60 0 t 60 0 t 40 -6"/>` +
      `<path class="spc-wind" style="animation-delay:-1s" d="M -90 8 q 35 -10 70 0 t 70 0"/>` +
      `<path class="spc-wind" style="animation-delay:-1.9s" d="M -70 24 q 30 -8 60 0 t 50 0"/></g>`;

    let layer = '';
    switch (state) {
      case 'sunny': layer = isDay ? rays() : stars(); break;
      case 'clear-night': layer = stars(); break;
      case 'partlycloudy': layer = (isDay ? rays() : '') + cloud(16, 10, 0.75, 'cl', 9, 2); break;
      case 'cloudy': layer = cloud(-24, -4, 0.8, 'cl', 11, 4, 0.9) + cloud(20, 8, 0.95, 'cd', 13, 7); break;
      case 'fog': layer = fog(); break;
      case 'rainy': layer = drops(14, false) + cloud(0, 0, 1, 'cd', 12, 3); break;
      case 'pouring': layer = drops(26, true) + cloud(-18, -2, 0.85, 'cd', 10, 1) + cloud(18, 2, 1, 'cd', 13, 6); break;
      case 'snowy': layer = particles(16, 'spc-flake', 2, '#fff', 4) + cloud(0, 0, 1, 'cl', 12, 3); break;
      case 'snowy-rainy': layer = drops(8, false) + particles(8, 'spc-flake', 2, '#fff', 4) + cloud(0, 0, 1, 'cd', 12, 3); break;
      case 'hail': layer = particles(14, 'spc-hail', 1.8, '#e8f4ff', 0.7) + cloud(0, 0, 1, 'cd', 12, 3); break;
      case 'lightning': layer = flash() + bolt() + cloud(-18, -2, 0.85, 'cd', 10, 1) + cloud(18, 2, 1, 'cd', 13, 6); break;
      case 'lightning-rainy': layer = flash() + drops(18, true) + bolt() + cloud(-18, -2, 0.85, 'cd', 10, 1) + cloud(18, 2, 1, 'cd', 13, 6); break;
      case 'windy': layer = wind(); break;
      case 'windy-variant': layer = wind() + cloud(10, -6, 0.8, 'cl', 7, 2); break;
      case 'exceptional': layer = flash() + cloud(0, 0, 1, 'cd', 12, 3); break;
      default: layer = '';
    }
    return layer ? defs + layer : '';
  }

  /**
   * 3D-Kuppel: Himmelshalbkugel über einer Kompass-Ellipse, Sonnenbahn am Tag, Mondbahn in der Nacht.
   * Orthografische Projektion mit 17° Neigung; Blick nach Süden (Südhalbkugel: nach Norden).
   */
  _renderDome(o) {
    const uid = this._uid;
    const cx = 160, cy = 166, R = 128;
    const tilt = 17 * RAD;
    const ry = R * Math.sin(tilt), rz = R * Math.cos(tilt);
    const f = o.isSouthern ? -1 : 1;
    const n1 = (v) => v.toFixed(1);

    const project = (az, alt, onGround = false) => {
      const A = az * RAD, h = alt * RAD;
      const e = Math.sin(A) * Math.cos(h), n = Math.cos(A) * Math.cos(h), u = onGround ? 0 : Math.sin(h);
      return [cx - f * R * e, cy + f * ry * n - rz * u];
    };

    // Himmelsfarbe nach Sonnenhöhe: Tag, Dämmerung, Nacht
    const el = o.sunEl;
    const sky = el > 6 ? ['#3b8ed8', '#a8d6ff', 0.6, 0.12]
      : el > -6 ? ['#39407c', '#f2a36a', 0.62, 0.3]
        : ['#07142e', '#22335f', 0.85, 0.35];

    const domePath = this._domeOutline();

    // Gitter: Höhenkreise 30°/60°, Meridian und Ost-West-Bogen
    let grid = '';
    for (const a of [30, 60]) {
      grid += `<ellipse cx="${cx}" cy="${n1(cy - rz * Math.sin(a * RAD))}" rx="${n1(R * Math.cos(a * RAD))}" ry="${n1(ry * Math.cos(a * RAD))}"/>`;
    }
    const greatArc = (azA, azB) => {
      const pts = [];
      for (let t = 0; t <= 180; t += 6) pts.push(t <= 90 ? project(azA, t) : project(azB, 180 - t));
      return `<path d="M ${pts.map(p => `${n1(p[0])} ${n1(p[1])}`).join(' L ')}"/>`;
    };
    grid += greatArc(0, 180) + greatArc(90, 270);

    // Kompass-Teilung am Boden
    let ticks = '';
    for (let a = 0; a < 360; a += 10) {
      const k = a % 90 === 0 ? 0.86 : 0.94;
      const A = a * RAD;
      ticks += `<line x1="${n1(cx - f * R * k * Math.sin(A))}" y1="${n1(cy + f * ry * k * Math.cos(A))}" x2="${n1(cx - f * R * Math.sin(A))}" y2="${n1(cy + f * ry * Math.cos(A))}"${a % 90 === 0 ? ' class="major"' : ''}/>`;
    }

    // Bahn (Sonne oder Mond) für ±12 h, getrennt in vergangenen und kommenden Teil
    const trackPaths = (posFn) => {
      if (!posFn) return { past: '', future: '' };
      const now = o.now.getTime();
      const samples = [];
      for (let i = -120; i <= 120; i++) {
        const p = posFn(new Date(now + i * 6 * 60000));
        samples.push({ i, az: p.az, alt: p.alt });
      }
      const past = [], future = [];
      let run = [];
      const flush = () => {
        if (run.length > 1) {
          const toD = (pts) => pts.length > 1 ? `M ${pts.map(s => { const p = project(s.az, s.alt); return `${n1(p[0])} ${n1(p[1])}`; }).join(' L ')}` : '';
          past.push(toD(run.filter(s => s.i <= 0)));
          future.push(toD(run.filter(s => s.i >= 0)));
        }
        run = [];
      };
      for (let k = 0; k < samples.length; k++) {
        const s = samples[k];
        const prev = samples[k - 1];
        if (s.alt >= 0) {
          // Horizont-Schnittpunkt interpolieren, damit die Bahn auf der Ellipse beginnt
          if (prev && prev.alt < 0) {
            const t = prev.alt / (prev.alt - s.alt);
            run.push({ i: s.i - 0.5, az: prev.az + this._angleDiff(prev.az, s.az) * t, alt: 0 });
          }
          run.push(s);
        } else if (run.length) {
          const t = prev.alt / (prev.alt - s.alt);
          run.push({ i: s.i - 0.5, az: prev.az + this._angleDiff(prev.az, s.az) * t, alt: 0 });
          flush();
        }
      }
      flush();
      return { past: past.filter(Boolean).join(' '), future: future.filter(Boolean).join(' ') };
    };

    const isDay = el > 0;
    const hasLoc = typeof o.lat === 'number' && typeof o.lng === 'number';
    const track = trackPaths(hasLoc ? (d) => (isDay ? sunPosition(d, o.lat, o.lng) : moonPosition(d, o.lat, o.lng)) : null);

    let marker = '';
    let focus = [cx, cy - rz * 0.55];
    let trackOpacity = 1;

    if (isDay) {
      const [sx, sy] = project(o.sunAz, el);
      const [gx, gy] = project(o.sunAz, el, true);
      focus = [sx, sy];
      marker =
        `<line class="spc-dome-drop" x1="${n1(sx)}" y1="${n1(sy)}" x2="${n1(gx)}" y2="${n1(gy)}"/>` +
        `<ellipse cx="${n1(gx)}" cy="${n1(gy)}" rx="7" ry="2.4" fill="rgba(0,0,0,.28)"/>` +
        `<circle cx="${n1(sx)}" cy="${n1(sy)}" r="24" fill="url(#${uid}-sunglow)"/>` +
        `<circle cx="${n1(sx)}" cy="${n1(sy)}" r="10" fill="url(#${uid}-sun)"/>`;
    } else if (hasLoc) {
      const m = moonPosition(o.now, o.lat, o.lng);
      if (m.alt > 0) {
        const [mx, my] = project(m.az, m.alt);
        const [gx, gy] = project(m.az, m.alt, true);
        focus = [mx, my];
        const rot = o.isSouthern ? ` transform="rotate(180 ${n1(mx)} ${n1(my)})"` : '';
        marker =
          `<line class="spc-dome-drop moon" x1="${n1(mx)}" y1="${n1(my)}" x2="${n1(gx)}" y2="${n1(gy)}"/>` +
          `<ellipse cx="${n1(gx)}" cy="${n1(gy)}" rx="6" ry="2" fill="rgba(0,0,0,.25)"/>` +
          `<circle cx="${n1(mx)}" cy="${n1(my)}" r="28" fill="url(#${uid}-moonglow)"/>` +
          `<image href="${o.moonSrc}" x="${n1(mx - 16)}" y="${n1(my - 16)}" width="32" height="32"${rot}/>`;
      } else {
        // Mond aktuell unter dem Horizont: Bahn nur andeuten
        trackOpacity = 0.35;
      }
    }

    // Sterne nachts, in der Dämmerung schwächer
    let starsSvg = '';
    const starOpacity = Math.max(0, Math.min(1, (-el - 2) / 8));
    if (starOpacity > 0) {
      let seed = 3;
      const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
      for (let i = 0; i < 46; i++) {
        const az = rnd() * 360, alt = 8 + Math.asin(rnd()) / RAD * 0.9;
        const [x, y] = project(az, alt);
        const twinkle = i % 4 === 0 ? ` class="spc-twinkle" style="animation-delay:-${n1(rnd() * 3)}s"` : '';
        starsSvg += `<circle${twinkle} cx="${n1(x)}" cy="${n1(y)}" r="${n1(0.5 + rnd() * 0.8)}"/>`;
      }
      starsSvg = `<g fill="#fff" opacity="${n1(starOpacity * 0.85)}">${starsSvg}</g>`;
    }

    // Beschriftung: Himmelsrichtungen und optional Auf-/Untergang unter Ost/West
    const L = o.labels;
    const leftIsEast = f === 1;
    const front = f === 1 ? L.n : L.s;
    const back = f === 1 ? L.s : L.n;
    let labels =
      `<text x="${cx - R - 7}" y="${cy + 4}" text-anchor="end" class="spc-dome-cardinal">${leftIsEast ? L.e : L.w}</text>` +
      `<text x="${cx + R + 7}" y="${cy + 4}" text-anchor="start" class="spc-dome-cardinal">${leftIsEast ? L.w : L.e}</text>` +
      `<text x="${cx}" y="${n1(cy + ry + 15)}" text-anchor="middle" class="spc-dome-cardinal">${front}</text>` +
      `<text x="${cx}" y="${n1(cy - ry - 4)}" text-anchor="middle" class="spc-dome-cardinal back">${back}</text>`;
    if (o.showTimes) {
      const riseText = o.rise ? `↑ ${o.rise}` : '';
      const setText = o.set ? `↓ ${o.set}` : '';
      labels +=
        `<text x="4" y="${cy + 28}" text-anchor="start" class="spc-dome-time">${leftIsEast ? riseText : setText}</text>` +
        `<text x="316" y="${cy + 28}" text-anchor="end" class="spc-dome-time">${leftIsEast ? setText : riseText}</text>`;
    }

    const trackColor = isDay ? `url(#${uid}-track)` : '#cfd8e6';

    const svg = `<svg viewBox="0 0 320 236" class="spc-dome-svg spc-anim" role="img" aria-label="${o.ariaLabel}">
      <defs>
        <linearGradient id="${uid}-sky" x1="0" y1="${cy - R}" x2="0" y2="${cy}" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="${sky[0]}" stop-opacity="${sky[2]}"/><stop offset="1" stop-color="${sky[1]}" stop-opacity="${sky[3]}"/>
        </linearGradient>
        <radialGradient id="${uid}-rim" cx="${cx}" cy="${cy}" r="${R}" gradientUnits="userSpaceOnUse">
          <stop offset=".82" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".22"/>
        </radialGradient>
        <radialGradient id="${uid}-ground" cx=".5" cy=".35" r=".65">
          <stop offset="0" stop-color="#8a96a8" stop-opacity=".35"/><stop offset="1" stop-color="#2c3440" stop-opacity=".55"/>
        </radialGradient>
        <linearGradient id="${uid}-track" x1="${cx - R}" y1="0" x2="${cx + R}" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#ff9e3d"/><stop offset=".5" stop-color="#ffd23f"/><stop offset="1" stop-color="#ff7a3d"/>
        </linearGradient>
        <radialGradient id="${uid}-sun"><stop offset="0" stop-color="#fffbe6"/><stop offset=".55" stop-color="#ffd84a"/><stop offset="1" stop-color="#ff9f1c"/></radialGradient>
        <radialGradient id="${uid}-sunglow"><stop offset="0" stop-color="#ffd54f" stop-opacity=".75"/><stop offset="1" stop-color="#ffb300" stop-opacity="0"/></radialGradient>
        <radialGradient id="${uid}-moonglow"><stop offset="0" stop-color="#e8f0ff" stop-opacity=".8"/><stop offset="1" stop-color="#9fb4e6" stop-opacity="0"/></radialGradient>
        <filter id="${uid}-glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <path d="${domePath}" fill="url(#${uid}-sky)"/>
      <path d="${domePath}" fill="url(#${uid}-rim)"/>
      ${starsSvg}
      <ellipse cx="${cx}" cy="${cy}" rx="${R}" ry="${n1(ry)}" fill="url(#${uid}-ground)" class="spc-dome-ground"/>
      <g class="spc-dome-grid">${grid}</g>
      <g class="spc-dome-ticks">${ticks}</g>
      <line class="spc-dome-axis" x1="${cx - R}" y1="${cy}" x2="${cx + R}" y2="${cy}"/>
      <line class="spc-dome-axis" x1="${cx}" y1="${n1(cy - ry)}" x2="${cx}" y2="${n1(cy + ry)}"/>
      <path d="M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}" class="spc-dome-outline"/>
      <g opacity="${trackOpacity}">
        <path d="${track.future}" fill="none" stroke="${trackColor}" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="1 5" opacity=".75"/>
        <path d="${track.past}" fill="none" stroke="${trackColor}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" filter="url(#${uid}-glow)"/>
      </g>
      ${marker}
      ${labels}
    </svg>`;

    return { svg, focus, domePath };
  }

  // Umriss der Kuppel (Halbkreis + vordere Bodenhälfte), auch als Clip für den Wetter-Layer
  _domeOutline() {
    const cx = 160, cy = 166, R = 128;
    const ry = (R * Math.sin(17 * RAD)).toFixed(1);
    return `M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy} A ${R} ${ry} 0 0 1 ${cx - R} ${cy} Z`;
  }

  // Kleinster Winkelabstand a -> b in Grad (für die Interpolation über 0°/360°)
  _angleDiff(a, b) {
    return ((b - a + 540) % 360) - 180;
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

    // --- Animierte Wettereffekte (nur bei Zustandswechsel neu aufbauen, damit Animationen weiterlaufen) ---
    const showWeatherOverlay = (config.show_weather_overlay ?? false) && weatherStateObj;
    const wxState = showWeatherOverlay ? weatherStateObj.state : '';
    const wxLayerEl = this.querySelector(`#${this._uid}-wx`);
    const wxKey = `${wxState}|${isDay}`;
    if (wxLayerEl && this._wxKey !== wxKey) {
      this._wxKey = wxKey;
      wxLayerEl.innerHTML = wxState ? this._weatherLayer(wxState, isDay) : '';
    }
    // In Berechnet/Bogen wächst der Layer mit der Größe von Sonne bzw. Mond
    if (wxLayerEl && wxLayerEl.closest('.spc-wx-overlay.follow')) {
      const imgSize = parseFloat(this.querySelector('#sun-card-image')?.style.width) || 170;
      const followTransform = `translate(120 80) scale(${Math.max(0.7, imgSize / 80).toFixed(2)})`;
      if (wxLayerEl.getAttribute('transform') !== followTransform) wxLayerEl.setAttribute('transform', followTransform);
    }

    // --- 3D-Kuppel (neu zeichnen bei ~0,5° Bewegung oder alle 5 Minuten) ---
    const domeEl = this.querySelector(`#${this._uid}-dome`);
    if (domeEl) {
      const now = new Date();
      const lat = hass.config?.latitude;
      const lng = hass.config?.longitude;
      const hasLocation = typeof lat === 'number' && typeof lng === 'number';
      const moonImage = `${moonPhase || (hasLocation ? moonPhaseFromDate(now) : 'full_moon')}.png`;
      const showDomeTimes = config.show_dome_times ?? false;
      const rise = showDomeTimes ? formatTime(state.attributes.next_rising) : '';
      const set = showDomeTimes ? formatTime(state.attributes.next_setting) : '';
      const domeKey = [Math.round(azimuth * 2), Math.round(elevation * 2), Math.floor(now.getTime() / 300000), moonImage, rise, set, isSouthern].join('|');

      if (this._domeKey !== domeKey) {
        this._domeKey = domeKey;
        const dome = this._renderDome({
          now, lat, lng, isSouthern,
          sunAz: azimuth, sunEl: elevation,
          moonSrc: this._imageSrc(moonImage),
          showTimes: showDomeTimes, rise, set,
          ariaLabel: currentState,
          labels: {
            n: this._localize('compass.n'), e: this._localize('compass.e'),
            s: this._localize('compass.s'), w: this._localize('compass.w')
          }
        });
        domeEl.innerHTML = dome.svg;
        // Wetter-Layer der Sonne bzw. dem Mond folgen lassen
        if (wxLayerEl) wxLayerEl.setAttribute('transform', `translate(${dome.focus[0].toFixed(1)} ${dome.focus[1].toFixed(1)})`);
      }
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

        /* --- Animierte Wettereffekte --- */
        .spc-wx-overlay { position: absolute; pointer-events: none; z-index: 3; overflow: visible; }
        .spc-wx-overlay.full { inset: 0; }
        .spc-wx-overlay.follow { left: 50%; top: 50%; width: 240px; height: 170px; transform: translate(-50%, -50%); }
        .spc-wx-overlay svg { width: 100%; height: 100%; display: block; overflow: visible; }
        .spc-drift { animation: spc-drift 12s ease-in-out infinite alternate; }
        .spc-drop { animation: spc-fall .9s linear infinite; }
        .spc-flake { animation: spc-snow 4s linear infinite; }
        .spc-hail { animation: spc-fall .7s linear infinite; }
        .spc-rays { transform-box: fill-box; transform-origin: center; animation: spc-spin 40s linear infinite; }
        .spc-pulse { transform-box: fill-box; transform-origin: center; animation: spc-pulse 4s ease-in-out infinite; }
        .spc-bolt { opacity: 0; animation: spc-bolt 5s linear infinite; }
        .spc-flash { opacity: 0; animation: spc-flash 5s linear infinite; }
        .spc-fog-band { animation: spc-fog 9s ease-in-out infinite alternate; }
        .spc-wind { stroke-dasharray: 60 120; animation: spc-wind 2.4s linear infinite; }
        .spc-twinkle { animation: spc-twinkle 3s ease-in-out infinite; }
        @keyframes spc-drift { from { transform: translateX(-14px); } to { transform: translateX(14px); } }
        @keyframes spc-fall { 0% { transform: translate(0, 0); opacity: 0; } 15% { opacity: .9; } 100% { transform: translate(-6px, 64px); opacity: 0; } }
        @keyframes spc-snow { 0% { transform: translate(0, 0); opacity: 0; } 15% { opacity: 1; } 50% { transform: translate(5px, 32px); } 100% { transform: translate(-3px, 66px); opacity: 0; } }
        @keyframes spc-spin { to { transform: rotate(360deg); } }
        @keyframes spc-pulse { 0%, 100% { transform: scale(.9); opacity: .7; } 50% { transform: scale(1.12); opacity: 1; } }
        @keyframes spc-bolt { 0%, 86%, 90%, 93%, 100% { opacity: 0; } 87%, 89%, 94%, 95% { opacity: 1; } }
        @keyframes spc-flash { 0%, 86%, 90%, 93%, 100% { opacity: 0; } 87%, 94% { opacity: .3; } }
        @keyframes spc-fog { from { transform: translateX(-16px); } to { transform: translateX(16px); } }
        @keyframes spc-wind { from { stroke-dashoffset: 180; } to { stroke-dashoffset: 0; } }
        @keyframes spc-twinkle { 0%, 100% { opacity: .25; } 50% { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) {
          .spc-anim * { animation: none !important; }
          .spc-anim .spc-bolt, .spc-anim .spc-flash { opacity: 0; }
        }

        /* --- 3D-Kuppel --- */
        .spc-dome-container { padding: 8px 0 4px 0; }
        .spc-dome-stage { position: relative; width: 100%; max-width: 420px; }
        .spc-dome svg { display: block; width: 100%; height: auto; overflow: visible; }
        .spc-dome-wx { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; overflow: visible; }
        .spc-dome-grid { fill: none; stroke: var(--secondary-text-color, #888); stroke-opacity: .22; stroke-width: .8; stroke-dasharray: 2 4; }
        .spc-dome-ticks line { stroke: var(--secondary-text-color, #888); stroke-opacity: .45; stroke-width: 1; }
        .spc-dome-ticks line.major { stroke-opacity: .8; stroke-width: 1.6; }
        .spc-dome-axis { stroke: var(--secondary-text-color, #888); stroke-opacity: .35; stroke-width: .8; stroke-dasharray: 3 4; }
        .spc-dome-outline { fill: none; stroke: var(--secondary-text-color, #888); stroke-opacity: .45; stroke-width: 1.2; }
        .spc-dome-ground { stroke: var(--secondary-text-color, #888); stroke-opacity: .6; stroke-width: 1.4; }
        .spc-dome-drop { stroke: #ffd23f; stroke-opacity: .7; stroke-width: 1.2; stroke-dasharray: 2 3; }
        .spc-dome-drop.moon { stroke: #cfd8e6; }
        .spc-dome-cardinal { fill: var(--primary-text-color, #222); font-size: 13px; font-weight: 600; }
        .spc-dome-cardinal.back { font-size: 10px; opacity: .45; }
        .spc-dome-time { fill: var(--secondary-text-color, #666); font-size: 10.5px; }
      </style>
    `;

    const stateHtml = (statePosition === 'above') ? `<div class="state" id="sun-state-text"></div>` : '';
    const moonPhaseHtml = (showMoonPhaseAbove) ? `<div class="moon-phase-state" id="moon-phase-text"></div>` : '';
    const degreesHtml = (showDegrees && !showDegreesInList) ? `<div class="degrees" id="sun-degrees-text"></div>` : '';

    // Neuaufbau: Kuppel und Wetter-Layer beim nächsten Update neu zeichnen
    this._domeKey = null;
    this._wxKey = null;
    const uid = this._uid;

    // Wetter-Layer: folgt in Berechnet/Bogen der Sonne, liegt in Klassisch über dem Bild
    const wxOverlay = (follow) => follow
      ? `<div class="spc-wx-overlay follow"><svg class="spc-anim" viewBox="0 0 240 170" aria-hidden="true"><g id="${uid}-wx" transform="translate(120 80)"></g></svg></div>`
      : `<div class="spc-wx-overlay full"><svg class="spc-anim" viewBox="0 0 300 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g id="${uid}-wx" transform="translate(150 70) scale(1.4)"></g></svg></div>`;

    let imageHtml = '';
    if (showImage) {
      if (viewMode === 'dome') {
        imageHtml = `<div class="sun-image-container spc-dome-container">
                           <div class="solar-badge" id="solar-badge"></div>
                           <div class="weather-badge" id="weather-badge"></div>
                           <div class="spc-dome-stage">
                               <div class="spc-dome" id="${uid}-dome"></div>
                               <svg class="spc-dome-wx spc-anim" viewBox="0 0 320 236" aria-hidden="true">
                                   <defs><clipPath id="${uid}-clip"><path d="${this._domeOutline()}"/></clipPath></defs>
                                   <g clip-path="url(#${uid}-clip)"><g id="${uid}-wx"></g></g>
                               </svg>
                           </div>
                         </div>`;
      } else if (viewMode === 'calculated' || viewMode === 'arc' || showNightArc) {
        imageHtml = `<div class="sun-image-container calculated">
                           <div class="solar-badge" id="solar-badge"></div>
                           <div class="weather-badge" id="weather-badge"></div>
                           <div class="sun-arc-path"></div>
                           <div class="sun-icon-wrapper" id="sun-icon-wrapper">
                               <img id="sun-card-image" class="calculated-sun" src="/local/community/Sun-Position-Card/images/calc-sun.png" alt="">
                               ${wxOverlay(true)}
                           </div>
                         </div>`;
      } else {
        imageHtml = `<div class="sun-image-container">
                           <div class="solar-badge" id="solar-badge"></div>
                           <div class="weather-badge" id="weather-badge"></div>
                           <div class="sun-icon-wrapper" id="sun-icon-wrapper">
                               <img id="sun-card-image" class="sun-image" src="" alt="">
                               ${wxOverlay(false)}
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
