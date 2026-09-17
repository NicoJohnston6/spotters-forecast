const airportData = {
  JFK: { score: 88, window: "3:40–6:10 PM", status: "Excellent conditions", summary: "Warm afternoon light, scattered clouds, and steady arrivals on the 22s make this the day’s best window.", runway: "Runway 22L / 22R", wind: "Wind SW 11 kt", light: "Golden light", guide: "Bayview Park", guideCopy: "The afternoon favorite for arrivals. Face southwest for clean approach shots; bring a longer lens after 5 PM.", walk: "8 min walk", sun: "Sun behind you", hours: [["12 PM","☁","Good"],["2 PM","⛅","Great"],["4 PM","☀","Excellent"],["6 PM","☀","Excellent"],["8 PM","☾","Good"],["10 PM","☾","Quiet"]], aircraft: [["Airbus A350","Singapore Airlines · 6:05 PM","Rare today"],["Boeing 787-9","Japan Airlines · 4:40 PM","Likely"],["Airbus A380","Emirates · 10:55 PM","Night arrival"]] },
  LAX: { score: 91, window: "2:20–5:30 PM", status: "Near-perfect conditions", summary: "Clear coastal light, a strong west wind, and a busy transpacific bank line up for a very good afternoon.", runway: "Runway 24R / 24L", wind: "Wind W 13 kt", light: "Sun at your back", guide: "Imperial Hill", guideCopy: "A classic elevated view of westbound arrivals. Afternoon gives you the cleanest light on the approach path.", walk: "12 min walk", sun: "Sun behind you", hours: [["11 AM","☀","Great"],["1 PM","☀","Great"],["3 PM","☀","Excellent"],["5 PM","☀","Excellent"],["7 PM","☾","Good"],["9 PM","☾","Busy"]], aircraft: [["Airbus A380","Korean Air · 3:25 PM","Likely"],["Boeing 777-300ER","ANA · 4:05 PM","Likely"],["Boeing 747-8F","Cargolux · 7:10 PM","Cargo watch"]] },
  ORD: { score: 76, window: "4:10–6:00 PM", status: "Good conditions", summary: "Variable clouds may soften the light, but a packed afternoon arrival bank keeps the action consistent.", runway: "Runway 10C / 10R", wind: "Wind E 8 kt", light: "Filtered light", guide: "Bensenville lookout", guideCopy: "Good sightlines toward the 10s and plenty of space to settle in. Check the clouds before you leave.", walk: "6 min walk", sun: "Side light", hours: [["12 PM","☁","Fair"],["2 PM","☁","Good"],["4 PM","⛅","Great"],["6 PM","⛅","Great"],["8 PM","☾","Good"],["10 PM","☾","Busy"]], aircraft: [["Boeing 787-8","United · 4:20 PM","Likely"],["Airbus A350","Cathay Pacific · 5:30 PM","Worth watching"],["Boeing 767F","UPS · 8:15 PM","Cargo watch"]] }
};
const el = (id) => document.getElementById(id);
const liveLocations = { JFK: { lat: 40.6413, lon: -73.7781, radius: 25 }, LAX: { lat: 33.9416, lon: -118.4085, radius: 25 }, ORD: { lat: 41.9742, lon: -87.9073, radius: 25 } };
let liveryWatchlist = {};
const MAX_FLIGHTS = 20;
const aircraftName = (type) => ({ A388: "Airbus A380", A359: "Airbus A350-900", B789: "Boeing 787-9", B788: "Boeing 787-8", B77W: "Boeing 777-300ER", B748: "Boeing 747-8" }[type] || type || "Aircraft type unavailable");
function renderAircraft(flights, isLive) {
  const aircraft = flights.length ? flights.slice(0, MAX_FLIGHTS).map((f) => [aircraftName(f.type), `${f.flight || f.callsign || "Flight number unavailable"} · ${f.operator || f.paintedAs || "Operator unavailable"}`, f.altitude ? `${f.altitude.toLocaleString()} ft` : "Nearby"]) : (isLive ? [] : airportData[el("airport").value].aircraft);
  el("aircraft-list").innerHTML = aircraft.length ? aircraft.map((a) => `<article class="aircraft"><span class="plane-icon" aria-hidden="true">✈</span><div><h3>${a[0]}</h3><p>${a[1]}</p></div><span>${a[2]}</span></article>`).join("") : '<article class="aircraft"><span class="plane-icon" aria-hidden="true">!</span><div><h3>Live aircraft unavailable</h3><p>Host the page through a normal web server, then retry.</p></div><span>—</span></article>';
  el("live-indicator").classList.toggle("is-live", isLive);
  el("live-status").textContent = isLive ? `Live FR24 data · ${flights.length} nearby aircraft` : "Demo aircraft list";
}
function renderLiveries(flights) {
  const special = flights.filter((f) => f.specialLivery).slice(0, 4);
  el("livery-copy").textContent = special.length ? "These aircraft match a livery entry in your curated watchlist." : "No watchlist matches in the current live feed.";
  el("livery-list").innerHTML = special.length ? special.map((f) => `<div class="livery-item"><strong>${f.specialLivery}</strong>${aircraftName(f.type)} · ${f.reg || "registration unavailable"}</div>`).join("") : '<p class="empty-livery">Add registrations to <code>special-liveries.json</code> to begin matching.</p>';
}
function renderForecast(code) {
  const d = airportData[code];
  [["airport-code",code],["score-number",d.score],["best-window",d.window],["status-label",d.status],["best-summary",d.summary],["runway-pill",d.runway],["wind-pill",d.wind],["light-pill",d.light],["guide-title",d.guide],["guide-copy",d.guideCopy],["walk-time",d.walk],["sun-direction",d.sun]].forEach(([id, value]) => el(id).textContent = value);
  el("hour-grid").innerHTML = d.hours.map((h, i) => `<article class="hour ${i === 2 || i === 3 ? "active" : ""}"><strong>${h[0]}</strong><div class="weather">${h[1]}</div><small>${h[2]}</small></article>`).join("");
  el("score-number").parentElement.setAttribute("aria-label", `Spotting score ${d.score} out of 100`);
  renderAircraft([], false); renderLiveries([]);
}
async function loadLiveAircraft(code) {
  try {
    const location = liveLocations[code];
    const response = await fetch(`https://api.adsb.lol/v2/lat/${location.lat}/lon/${location.lon}/dist/${location.radius}`);
    if (!response.ok) throw new Error("Open ADS-B connection unavailable");
    const payload = await response.json();
    const flights = (payload.ac || []).filter((aircraft) => aircraft.lat && aircraft.lon && aircraft.alt_baro !== "ground").map((aircraft) => ({
      flight: aircraft.flight?.trim(), callsign: aircraft.flight?.trim() || aircraft.hex, type: aircraft.t, reg: aircraft.r,
      altitude: typeof aircraft.alt_baro === "number" ? aircraft.alt_baro : null, operator: aircraft.ownOp || aircraft.ownOpIcao,
      paintedAs: null, specialLivery: liveryWatchlist[aircraft.r] || null
    })).sort((a, b) => (a.altitude || 999999) - (b.altitude || 999999));
    renderAircraft(flights, true); renderLiveries(flights);
  } catch (error) { renderAircraft([], true); renderLiveries([]); el("live-status").textContent = `Live feed unavailable: ${error.message}`; }
}
async function loadLiveryWatchlist() {
  try { liveryWatchlist = await fetch("special-liveries.json").then((response) => response.ok ? response.json() : {}); } catch (_) { liveryWatchlist = {}; }
}
const windDirection = (degrees) => ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][(Math.round(degrees / 45) + 8) % 8];
const weatherDescription = (code) => code === 0 ? "clear skies" : code <= 3 ? "partly cloudy skies" : code <= 48 ? "mist or fog" : code <= 67 ? "rain showers" : code <= 77 ? "snow showers" : "thunderstorms";
async function loadWeather(code) {
  try {
    const location = liveLocations[code];
    const fields = "temperature_2m,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m";
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current=${fields}&temperature_unit=fahrenheit&wind_speed_unit=kn&timezone=auto`);
    if (!response.ok) throw new Error("weather request failed");
    const current = (await response.json()).current;
    el("wind-pill").textContent = `Wind ${windDirection(current.wind_direction_10m)} ${Math.round(current.wind_speed_10m)} kt`;
    el("light-pill").textContent = `Cloud cover ${current.cloud_cover}%`;
    el("best-summary").textContent = `Live conditions: ${weatherDescription(current.weather_code)}, ${Math.round(current.temperature_2m)}°F, and ${current.cloud_cover}% cloud cover. Runway and scoring guidance are still prototype estimates.`;
    el("data-note").textContent = `Live weather: Open-Meteo · updated ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}.`;
  } catch (_) { el("data-note").textContent = "Weather forecast unavailable; showing prototype forecast guidance."; }
}
let currentAirport = "JFK";
el("airport-form").addEventListener("submit", (event) => { event.preventDefault(); currentAirport = el("airport").value; renderForecast(currentAirport); loadLiveAircraft(currentAirport); loadWeather(currentAirport); document.querySelector("#forecast").scrollIntoView({ behavior: "smooth" }); });
renderForecast(currentAirport); loadLiveryWatchlist().then(() => loadLiveAircraft(currentAirport)); loadWeather(currentAirport);
window.setInterval(() => loadLiveAircraft(currentAirport), 60_000);
window.setInterval(() => loadWeather(currentAirport), 15 * 60_000);
