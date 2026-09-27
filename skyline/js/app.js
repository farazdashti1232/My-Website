/* ==========================================================================
   Skyline — app.js
   Vanilla ES6+, module pattern. No frameworks, no build step.
   All data comes live from the Open-Meteo APIs.
   ========================================================================== */
"use strict";

const Skyline = (() => {
  /* ---------------------------------------------------------------- utils */
  const $ = (sel) => document.querySelector(sel);
  const debounce = (fn, ms) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  };
  const esc = (s) => String(s ?? "");

  /* --------------------------------------------------- WMO weather codes */
  const WMO = {
    0:  { desc: "Clear sky",            icon: "clear"   },
    1:  { desc: "Mainly clear",         icon: "partly"  },
    2:  { desc: "Partly cloudy",        icon: "partly"  },
    3:  { desc: "Overcast",             icon: "overcast"},
    45: { desc: "Fog",                  icon: "fog"     },
    48: { desc: "Depositing rime fog",  icon: "fog"     },
    51: { desc: "Light drizzle",        icon: "drizzle" },
    53: { desc: "Moderate drizzle",     icon: "drizzle" },
    55: { desc: "Dense drizzle",        icon: "drizzle" },
    56: { desc: "Light freezing drizzle",  icon: "drizzle" },
    57: { desc: "Dense freezing drizzle",  icon: "drizzle" },
    61: { desc: "Slight rain",          icon: "rain"    },
    63: { desc: "Moderate rain",        icon: "rain"    },
    65: { desc: "Heavy rain",           icon: "rain"    },
    66: { desc: "Light freezing rain",  icon: "rain"    },
    67: { desc: "Heavy freezing rain",  icon: "rain"    },
    71: { desc: "Slight snowfall",      icon: "snow"    },
    73: { desc: "Moderate snowfall",    icon: "snow"    },
    75: { desc: "Heavy snowfall",       icon: "snow"    },
    77: { desc: "Snow grains",          icon: "snow"    },
    80: { desc: "Slight rain showers",  icon: "rain"    },
    81: { desc: "Moderate rain showers",icon: "rain"    },
    82: { desc: "Violent rain showers", icon: "rain"    },
    85: { desc: "Slight snow showers",  icon: "snow"    },
    86: { desc: "Heavy snow showers",   icon: "snow"    },
    95: { desc: "Thunderstorm",         icon: "storm"   },
    96: { desc: "Thunderstorm with slight hail", icon: "storm" },
    99: { desc: "Thunderstorm with heavy hail",  icon: "storm" },
  };
  const wmo = (code) => WMO[code] || { desc: "Unknown conditions", icon: "overcast" };

  /* ------------------------------------------------ hand-drawn SVG icons */
  const SUN = "#f2b134", MOON = "#e9effc", CLOUD = "#c9d8ea", CLOUD_DK = "#9db0c6",
        RAIN = "#5aa0e6", SNOW = "#bfe0ff", BOLT = "#f2a516", FOG = "#8fa2b8";

  function sunMarkup(cx, cy, r, rays) {
    let m = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${SUN}"/>`;
    if (rays) {
      const inner = r + 4.5, outer = r + 9.5;
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI / 4) * i + Math.PI / 8;
        const c = Math.cos(a), s = Math.sin(a);
        m += `<line x1="${(cx + inner * c).toFixed(1)}" y1="${(cy + inner * s).toFixed(1)}"
                   x2="${(cx + outer * c).toFixed(1)}" y2="${(cy + outer * s).toFixed(1)}"
                   stroke="${SUN}" stroke-width="3" stroke-linecap="round"/>`;
      }
    }
    return m;
  }
  function cloudMarkup(fill, tx, ty, sc) {
    return `<g transform="translate(${tx},${ty}) scale(${sc})" fill="${fill}">
      <circle cx="23" cy="35" r="10"/><circle cx="35" cy="29" r="13"/><circle cx="46" cy="36" r="9"/>
      <rect x="23" y="35" width="23" height="10" rx="3"/></g>`;
  }
  function dropsMarkup(n, len, color, width) {
    const xs = n === 2 ? [26, 40] : [24, 32, 40];
    return xs.map((x) =>
      `<line x1="${x}" y1="49" x2="${x - 2.5}" y2="${49 + len}" stroke="${color}"
        stroke-width="${width}" stroke-linecap="round"/>`).join("");
  }
  function flakesMarkup() {
    const at = (x, y) => {
      let m = "";
      for (let i = 0; i < 3; i++) {
        const a = (Math.PI / 3) * i;
        const c = Math.cos(a) * 4, s = Math.sin(a) * 4;
        m += `<line x1="${(x - c).toFixed(1)}" y1="${(y - s).toFixed(1)}"
                   x2="${(x + c).toFixed(1)}" y2="${(y + s).toFixed(1)}"
                   stroke="${SNOW}" stroke-width="2" stroke-linecap="round"/>`;
      }
      return m;
    };
    return at(24, 53) + at(33, 56) + at(42, 53);
  }

  const ICONS = {
    clear:      () => sunMarkup(32, 32, 12, true),
    clearNight: () => `<path d="M44 10 A21 21 0 1 0 54 44 A16.5 16.5 0 1 1 44 10 Z" fill="${MOON}"/>
      <circle cx="20" cy="14" r="1.6" fill="${MOON}" opacity=".8"/>
      <circle cx="14" cy="26" r="1.2" fill="${MOON}" opacity=".6"/>`,
    partly:     () => sunMarkup(42, 22, 9, true) + cloudMarkup(CLOUD, 0, 6, 0.92),
    overcast:   () => cloudMarkup(CLOUD_DK, 0, 2, 0.65) + cloudMarkup(CLOUD, 6, 8, 1),
    fog:        () => cloudMarkup(CLOUD, 0, -3, 0.9) +
      [47, 53, 59].map((y, i) =>
        `<line x1="${16 + i * 2}" y1="${y}" x2="${48 - i * 2}" y2="${y}" stroke="${FOG}"
          stroke-width="3.4" stroke-linecap="round" opacity="${0.85 - i * 0.18}"/>`).join(""),
    drizzle:    () => cloudMarkup(CLOUD, 0, -4, 0.95) + dropsMarkup(3, 5, RAIN, 2.6),
    rain:       () => cloudMarkup(CLOUD, 0, -4, 0.95) + dropsMarkup(3, 10, RAIN, 3.4),
    snow:       () => cloudMarkup(CLOUD, 0, -6, 0.95) + flakesMarkup(),
    storm:      () => cloudMarkup(CLOUD_DK, 0, -4, 0.95) +
      `<path d="M35 44 l-10 14 h6.5 l-4 10 13 -16 h-6.5 l4.5 -8 Z" fill="${BOLT}"/>`,
  };

  function iconSvg(kind, isNight) {
    if (kind === "clear" && isNight) kind = "clearNight";
    const fn = ICONS[kind] || ICONS.overcast;
    return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${fn()}</svg>`;
  }

  /* --------------------------------------------------------------- state */
  const state = {
    unit: "c",
    city: null,      // { name, admin1, country, latitude, longitude, label }
    data: null,      // last successful forecast payload
    isNight: false,
  };
  const LS_CITY = "skyline:lastCity";
  const LS_UNIT = "skyline:unit";

  let forecastCtrl = null;   // AbortController for the forecast request
  let geocodeCtrl  = null;   // AbortController for the geocoding request
  let lastFailedRequest = null;

  /* ------------------------------------------------------------ dom refs */
  const dom = {};
  function cacheDom() {
    [
      "city-input","suggestions","search-status","btn-geolocate","geo-hint",
      "btn-celsius","btn-fahrenheit","error-banner","error-title","error-detail",
      "btn-retry","skeleton-wrap","empty-state","dashboard","hero-place","hero-meta",
      "hero-icon","hero-temp","hero-desc","hero-feels","hero-stats","temp-chart",
      "week-strip",
    ].forEach((id) => (dom[id.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = $("#" + id)));
  }

  /* ------------------------------------------------------- unit handling */
  const toTemp   = (c) => (state.unit === "f" ? (c * 9) / 5 + 32 : c);
  const tempFmt  = (c) => `${Math.round(toTemp(c))}°`;
  const unitSuffix = () => (state.unit === "f" ? "°F" : "°C");
  const speedFmt = (kmh) =>
    state.unit === "f" ? `${Math.round(kmh * 0.621371)} <small>mph</small>` : `${Math.round(kmh)} <small>km/h</small>`;

  function setUnit(unit) {
    state.unit = unit;
    try { localStorage.setItem(LS_UNIT, unit); } catch (_) { /* private mode */ }
    dom.btnCelsius.classList.toggle("is-active", unit === "c");
    dom.btnFahrenheit.classList.toggle("is-active", unit === "f");
    dom.btnCelsius.setAttribute("aria-pressed", String(unit === "c"));
    dom.btnFahrenheit.setAttribute("aria-pressed", String(unit === "f"));
    if (state.data && state.city) renderDashboard(state.city, state.data);
  }

  /* ----------------------------------------------------------- view mode */
  function showView(which) {
    dom.errorBanner.hidden = which !== "error";
    dom.skeletonWrap.hidden = which !== "loading";
    dom.emptyState.hidden = which !== "empty";
    dom.dashboard.hidden = which !== "dash";
  }
  function showError(title, detail, retryable) {
    dom.errorTitle.textContent = title;
    dom.errorDetail.textContent = detail || "";
    dom.btnRetry.hidden = !retryable;
    showView("error");
  }

  /* ----------------------------------------------------------- API calls */
  async function geocode(query) {
    if (geocodeCtrl) geocodeCtrl.abort();
    geocodeCtrl = new AbortController();
    const url = "https://geocoding-api.open-meteo.com/v1/search?count=5&language=en&format=json" +
      "&name=" + encodeURIComponent(query);
    const res = await fetch(url, { signal: geocodeCtrl.signal });
    if (!res.ok) throw new Error("Geocoding service unavailable (" + res.status + ")");
    const json = await res.json();
    return json.results || [];
  }

  async function fetchForecast(city) {
    if (forecastCtrl) forecastCtrl.abort();       // cancel stale in-flight fetch
    forecastCtrl = new AbortController();
    lastFailedRequest = city;
    const url = "https://api.open-meteo.com/v1/forecast" +
      "?latitude=" + city.latitude + "&longitude=" + city.longitude +
      "&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m" +
      "&hourly=temperature_2m,precipitation_probability" +
      "&daily=temperature_2m_max,temperature_2m_min,weather_code,sunrise,sunset" +
      "&timezone=auto&forecast_days=7";
    const res = await fetch(url, { signal: forecastCtrl.signal });
    if (!res.ok) throw new Error("Forecast service unavailable (" + res.status + ")");
    const json = await res.json();
    lastFailedRequest = null;
    return json;
  }

  async function loadCity(city) {
    state.city = city;
    state.data = null;
    try { localStorage.setItem(LS_CITY, JSON.stringify(city)); } catch (_) { /* ignore */ }
    closeSuggest();
    showView("loading");
    try {
      const data = await fetchForecast(city);
      state.data = data;
      renderDashboard(city, data);
    } catch (err) {
      if (err && err.name === "AbortError") return;         // superseded request
      showError("Couldn't load the weather", esc(err && err.message ? err.message : "Network error") +
        " — check your connection and try again.", true);
    }
  }

  /* ----------------------------------------------------------- rendering */
  function isNightNow(data) {
    // ISO-like local strings sort lexicographically: safe for a < b comparisons
    const now = data.current.time;
    return now < data.daily.sunrise[0] || now > data.daily.sunset[0];
  }

  function renderDashboard(city, data) {
    if (!data.current || !data.hourly || !data.daily) {
      showError("Unexpected API response", "The forecast payload was incomplete.", true);
      return;
    }
    state.isNight = isNightNow(data);
    showView("dash");        // make container visible first so chart can measure width
    renderHero(city, data);
    renderChart(data);
    renderWeek(data);
  }

  function renderHero(city, data) {
    dom.heroPlace.textContent = city.label || city.name;
    const info = wmo(data.current.weather_code);
    dom.heroMeta.textContent = "";
    const meta = document.createElement("span");
    meta.append(new Text("Local time "));
    const clock = document.createElement("span");
    clock.id = "local-clock";
    clock.textContent = formatCityTime(data);
    meta.append(clock);
    meta.append(new Text(" · updated " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })));
    dom.heroMeta.append(meta);

    dom.heroIcon.innerHTML = iconSvg(info.icon, state.isNight);
    dom.heroIcon.setAttribute("aria-label", info.desc);
    dom.heroTemp.textContent = Math.round(toTemp(data.current.temperature_2m)) + unitSuffix();
    dom.heroDesc.textContent = info.desc;
    dom.heroFeels.textContent = "Feels like " + tempFmt(data.current.apparent_temperature);

    dom.heroStats.innerHTML = "";
    const stats = [
      ["Humidity", data.current.relative_humidity_2m + " <small>%</small>"],
      ["Wind", speedFmt(data.current.wind_speed_10m)],
      ["Sunrise", hm(data.daily.sunrise[0])],
      ["Sunset", hm(data.daily.sunset[0])],
    ];
    for (const [k, v] of stats) {
      const li = document.createElement("li");
      li.className = "hstat";
      const ks = document.createElement("span"); ks.className = "k"; ks.textContent = k;
      const vs = document.createElement("span"); vs.className = "v"; vs.innerHTML = v;
      li.append(ks, vs);
      dom.heroStats.append(li);
    }
  }

  const hm = (iso) => iso.slice(11, 16);
  function formatCityTime(data) {
    try {
      return new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit", minute: "2-digit", timeZone: data.timezone,
      }).format(new Date());
    } catch (_) {
      return data.current.time.slice(11, 16);
    }
  }

  /* -- 24h temperature line + precipitation bars (hand-rolled SVG) ------- */
  function next24(data) {
    const times = data.hourly.time;
    const nowFloor = data.current.time.slice(0, 13) + ":00";
    let start = times.findIndex((t) => t >= nowFloor);
    if (start < 0) start = 0;
    const slice = (arr) => arr.slice(start, start + 24);
    const ts = slice(times);
    return ts.map((t, i) => ({
      time: t,
      temp: data.hourly.temperature_2m[start + i],
      pop: data.hourly.precipitation_probability[start + i] ?? 0,
    })).filter((p) => p.temp != null);
  }

  function renderChart(data) {
    const pts = next24(data);
    if (!pts.length) { dom.tempChart.innerHTML = ""; return; }

    const H = 230, padT = 26, padB = 30, padL = 36, padR = 14;
    const plotH = H - padT - padB;
    const hostW = dom.tempChart.clientWidth || 640;
    const hourW = Math.max(40, Math.floor((hostW - padL - padR) / pts.length));
    const W = padL + padR + hourW * pts.length;

    const temps = pts.map((p) => toTemp(p.temp));
    let lo = Math.min(...temps), hi = Math.max(...temps);
    if (hi - lo < 4) { lo -= 2; hi += 2; }
    lo = Math.floor(lo - 1); hi = Math.ceil(hi + 1);
    const yOf = (v) => padT + plotH * (1 - (v - lo) / (hi - lo));
    const xOf = (i) => padL + hourW * i + hourW / 2;
    const r1 = (v) => Math.round(v * 10) / 10;

    // nice y ticks
    const step = Math.max(1, Math.round((hi - lo) / 4));
    const ticks = [];
    for (let v = lo; v <= hi; v += step) ticks.push(v);

    // smoothed line
    let line = `M${r1(xOf(0))} ${r1(yOf(temps[0]))}`;
    for (let i = 1; i < temps.length; i++) {
      const x0 = xOf(i - 1), y0 = yOf(temps[i - 1]), x1 = xOf(i), y1 = yOf(temps[i]);
      const c = (x1 - x0) * 0.42;
      line += ` C${r1(x0 + c)} ${r1(y0)}, ${r1(x1 - c)} ${r1(y1)}, ${r1(x1)} ${r1(y1)}`;
    }
    const area = line + ` L${r1(xOf(temps.length - 1))} ${H - padB} L${r1(xOf(0))} ${H - padB} Z`;

    let svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img"
      aria-label="24 hour temperature chart from ${Math.round(lo)} to ${Math.round(hi)} degrees, with precipitation probability bars">
      <defs><linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" class="tg-top"/><stop offset="1" class="tg-bot"/>
      </linearGradient></defs>`;

    for (const t of ticks) {
      const y = r1(yOf(t));
      svg += `<line class="grid-line" x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}"/>
        <text x="${padL - 6}" y="${y + 3.5}" text-anchor="end" font-size="10">${Math.round(t)}°</text>`;
    }

    // precipitation-probability bars (behind the line, anchored to the axis)
    pts.forEach((p, i) => {
      if (!p.pop) return;
      const bh = Math.max(2, (p.pop / 100) * (plotH * 0.6));
      svg += `<rect class="pop-bar" x="${r1(xOf(i) - 7)}" y="${r1(H - padB - bh)}" width="14" height="${r1(bh)}" rx="3"/>
        <text x="${r1(xOf(i))}" y="${r1(H - padB - bh - 4)}" text-anchor="middle" font-size="8.5" opacity="0.9">${p.pop}%</text>`;
    });

    svg += `<path d="${area}" fill="url(#tg)"/><path class="line-path" d="${line}" fill="none" stroke-width="2.6" stroke-linecap="round"/>`;

    pts.forEach((p, i) => {
      svg += `<circle class="dot" cx="${r1(xOf(i))}" cy="${r1(yOf(temps[i]))}" r="3.1" stroke-width="1.4"/>`;
      const hr = p.time.slice(11, 16);
      if (i % 3 === 0) {
        svg += `<text x="${r1(xOf(i))}" y="${H - 9}" text-anchor="middle" font-size="10">${hr}</text>`;
      }
      svg += `<rect class="hit" data-i="${i}" x="${r1(xOf(i) - hourW / 2)}" y="0" width="${hourW}" height="${H}"
        fill="transparent"/>`;
    });
    svg += "</svg>";
    dom.tempChart.innerHTML = svg;
    bindChartTips(pts, temps);
  }

  let tipEl = null;
  function bindChartTips(pts, temps) {
    dom.tempChart.querySelectorAll(".hit").forEach((el) => {
      el.addEventListener("pointerenter", (e) => {
        const i = +el.dataset.i;
        if (!tipEl) { tipEl = document.createElement("div"); tipEl.className = "chart-tip"; document.body.append(tipEl); }
        const time = pts[i].time.slice(11, 16);
        tipEl.innerHTML = "";
        const b = document.createElement("strong"); b.textContent = `${time} · ${Math.round(temps[i])}°`;
        tipEl.append(b, document.createTextNode(` · rain ${pts[i].pop}%`));
        tipEl.hidden = false;
        positionTip(e);
      });
      el.addEventListener("pointermove", positionTip);
      el.addEventListener("pointerleave", () => { if (tipEl) tipEl.hidden = true; });
    });
  }
  function positionTip(e) {
    if (!tipEl) return;
    tipEl.style.left = Math.min(e.clientX + 12, window.innerWidth - tipEl.offsetWidth - 8) + "px";
    tipEl.style.top = Math.max(8, e.clientY - tipEl.offsetHeight - 12) + "px";
  }

  /* -- 7-day strip -------------------------------------------------------- */
  function renderWeek(data) {
    const strip = dom.weekStrip;
    strip.innerHTML = "";
    const maxPop = data.hourly.precipitation_probability;
    for (let d = 0; d < data.daily.time.length; d++) {
      const day = data.daily.time[d];
      let pop = 0;
      for (let h = 0; h < 24; h++) {
        const idx = data.hourly.time.indexOf(day + "T" + String(h).padStart(2, "0") + ":00");
        if (idx >= 0) pop = Math.max(pop, maxPop[idx] ?? 0);
      }
      const info = wmo(data.daily.weather_code[d]);
      const el = document.createElement("article");
      el.className = "day-card" + (d === 0 ? " is-today" : "");
      el.setAttribute("role", "listitem");

      const name = document.createElement("div"); name.className = "day-name";
      name.textContent = d === 0 ? "Today"
        : new Date(day + "T12:00").toLocaleDateString(undefined, { weekday: "short" });
      const date = document.createElement("div"); date.className = "day-date";
      date.textContent = day.slice(5).replace("-", "/");
      const icon = document.createElement("div"); icon.className = "day-icon";
      icon.innerHTML = iconSvg(info.icon, false);
      const range = document.createElement("div"); range.className = "day-range";
      const mx = document.createElement("span"); mx.className = "day-max";
      mx.textContent = tempFmt(data.daily.temperature_2m_max[d]);
      const mn = document.createElement("span"); mn.className = "day-min";
      mn.textContent = tempFmt(data.daily.temperature_2m_min[d]);
      range.append(mx, mn);
      const rain = document.createElement("div"); rain.className = "day-rain";
      rain.textContent = "rain " + pop + "%";
      const sun = document.createElement("div"); sun.className = "day-sun";
      sun.textContent = "☀ " + hm(data.daily.sunrise[d]) + " – " + hm(data.daily.sunset[d]);

      el.append(name, date, icon, range, rain, sun);
      el.title = info.desc;
      strip.append(el);
    }
  }

  /* ------------------------------------------------------------ search UI */
  let sugIndex = -1;
  let geocodeCache = [];
  function closeSuggest() {
    dom.suggestions.hidden = true;
    dom.suggestions.innerHTML = "";
    dom.cityInput.setAttribute("aria-expanded", "false");
    sugIndex = -1;
  }

  function renderSuggestions(results, query) {
    geocodeCache = results;
    dom.suggestions.innerHTML = "";
    sugIndex = -1;
    if (!results.length) {
      const li = document.createElement("li");
      li.className = "s-empty";
      li.textContent = `No cities matched “${query}”.`;
      dom.suggestions.append(li);
      dom.suggestions.hidden = false;
      dom.cityInput.setAttribute("aria-expanded", "true");
      dom.searchStatus.textContent = "No cities found.";
      return;
    }
    results.forEach((r, i) => {
      const li = document.createElement("li");
      li.id = "sug-" + i;
      li.setAttribute("role", "option");
      const nm = document.createElement("span"); nm.className = "s-name"; nm.textContent = esc(r.name);
      const adm = document.createElement("span"); adm.className = "s-admin";
      adm.textContent = (r.admin1 ? ", " + esc(r.admin1) : "") + (r.country ? ", " + esc(r.country) : "");
      const cc = document.createElement("span"); cc.className = "s-country"; cc.textContent = r.country_code || "";
      li.append(nm, adm, cc);
      li.addEventListener("pointerdown", (e) => { e.preventDefault(); pickCity(r); });
      dom.suggestions.append(li);
    });
    dom.suggestions.hidden = false;
    dom.cityInput.setAttribute("aria-expanded", "true");
    dom.searchStatus.textContent = results.length + " cities found. Use arrow keys to review.";
  }

  function highlight(active) {
    [...dom.suggestions.children].forEach((li, i) => {
      const on = i === active;
      li.classList.toggle("is-active", on);
      li.setAttribute("aria-selected", String(on));
    });
    dom.cityInput.setAttribute("aria-activedescendant", active >= 0 ? "sug-" + active : "");
  }

  function pickCity(r) {
    const label = [r.name, r.admin1, r.country].filter(Boolean).join(" · ");
    const city = { name: r.name, admin1: r.admin1, country: r.country, latitude: r.latitude, longitude: r.longitude, label };
    dom.cityInput.value = label;
    loadCity(city);
  }

  const onSearchInput = debounce(async () => {
    const q = dom.cityInput.value.trim();
    if (q.length < 2) { closeSuggest(); return; }
    dom.searchStatus.textContent = "Searching…";
    try {
      const results = await geocode(q);
      renderSuggestions(results, q);
    } catch (err) {
      if (err && err.name === "AbortError") return;
      dom.searchStatus.textContent = "Search failed.";
      closeSuggest();
    }
  }, 320);

  function bindSearch() {
    dom.cityInput.addEventListener("input", onSearchInput);
    dom.cityInput.addEventListener("keydown", (e) => {
      const items = [...dom.suggestions.querySelectorAll("li:not(.s-empty)")];
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        if (!items.length) return;
        e.preventDefault();
        sugIndex = e.key === "ArrowDown"
          ? (sugIndex + 1) % items.length
          : (sugIndex - 1 + items.length) % items.length;
        highlight(sugIndex);
        items[sugIndex].scrollIntoView({ block: "nearest" });
      } else if (e.key === "Enter") {
        const q = dom.cityInput.value.trim();
        if (sugIndex >= 0 && items[sugIndex]) {
          e.preventDefault();
          pickCity(geocodeCache[sugIndex]);
        } else if (q.length >= 2) {
          e.preventDefault();
          geocode(q).then((rs) => rs.length ? pickCity(rs[0]) : renderSuggestions([], q))
            .catch(() => {});
        }
      } else if (e.key === "Escape") {
        closeSuggest();
      }
    });
    dom.cityInput.addEventListener("blur", () => setTimeout(closeSuggest, 120));
    document.addEventListener("click", (e) => {
      if (!e.target.closest("#search-wrap")) closeSuggest();
    });
  }

  /* --------------------------------------------------------- geolocation */
  function useMyLocation() {
    if (!("geolocation" in navigator)) {
      dom.geoHint.hidden = false;
      dom.geoHint.textContent = "Geolocation isn't supported by this browser — try searching instead.";
      return;
    }
    dom.btnGeolocate.classList.add("is-busy");
    dom.geoHint.hidden = false;
    dom.geoHint.textContent = "Locating…";
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        dom.btnGeolocate.classList.remove("is-busy");
        dom.geoHint.hidden = true;
        const city = {
          name: "My location", label: "My location",
          latitude: +pos.coords.latitude.toFixed(4),
          longitude: +pos.coords.longitude.toFixed(4),
        };
        dom.cityInput.value = "My location";
        loadCity(city);
      },
      (err) => {
        dom.btnGeolocate.classList.remove("is-busy");
        dom.geoHint.hidden = false;
        dom.geoHint.textContent = err.code === err.PERMISSION_DENIED
          ? "Location permission denied — no problem, just search for a city above."
          : "Couldn't determine your location right now — try searching instead.";
      },
      { timeout: 8000, maximumAge: 600000 }
    );
  }

  /* --------------------------------------------------------------- retry */
  function bindRetry() {
    dom.btnRetry.addEventListener("click", () => {
      if (lastFailedRequest) loadCity(lastFailedRequest);
      else if (state.city) loadCity(state.city);
    });
  }

  /* ------------------------------------------------------------- resize */
  const onResize = debounce(() => { if (state.data && state.city && !dom.dashboard.hidden) renderChart(state.data); }, 180);

  /* ---------------------------------------------------------------- init */
  function init() {
    cacheDom();
    let savedUnit = "c";
    let savedCity = null;
    try {
      savedUnit = localStorage.getItem(LS_UNIT) === "f" ? "f" : "c";
      savedCity = JSON.parse(localStorage.getItem(LS_CITY) || "null");
    } catch (_) { /* ignore corrupt storage */ }
    setUnit(savedUnit);

    dom.btnCelsius.addEventListener("click", () => setUnit("c"));
    dom.btnFahrenheit.addEventListener("click", () => setUnit("f"));
    dom.btnGeolocate.addEventListener("click", useMyLocation);
    bindSearch();
    bindRetry();
    window.addEventListener("resize", onResize);

    if (savedCity && typeof savedCity.latitude === "number") {
      dom.cityInput.value = savedCity.label || savedCity.name || "";
      loadCity(savedCity);
    } else {
      showView("empty");
    }

    // keep the "local time" readout honest
    setInterval(() => {
      const clock = $("#local-clock");
      if (clock && state.data) clock.textContent = formatCityTime(state.data);
    }, 30000);
  }

  document.addEventListener("DOMContentLoaded", init);

  return { init };
})();
