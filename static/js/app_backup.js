/**
 * AeroQuest - Advanced Global AQI Dashboard Logic
 */

// Global Application State
const STATE = {
    currentCity: {
        name: "Tokyo",
        latitude: 35.6895,
        longitude: 139.6917,
        country: "Japan",
        region: "Tokyo Prefecture",
        id: null // Will be populated if favorited
    },
    favorites: [],
    trendChart: null,
    compareChart: null,
    leafletMap: null,
    mapMarker: null,
    compareCityA: null,
    compareCityB: null,
    activeView: 'dashboard',
    activeTrendParam: 'us_aqi'
};

// AQI Category Breakpoints & Guidelines
const AQI_RANGES = [
    {
        min: 0, max: 50,
        label: 'Good',
        class: 'aqi-good',
        color: '#10b981',
        glow: 'rgba(16, 185, 129, 0.25)',
        desc: 'Air quality is satisfactory, and air pollution poses little or no risk.',
        general: 'Excellent time to go outside and breathe the fresh air! Perfect for all activities.',
        sensitive: 'No special health precautions are required for vulnerable groups.',
        outdoors: 'Ideal for outdoor exercises, running, cycling, and children playing.',
        ventilation: 'Highly recommended to open windows and ventilate your home with fresh clean air.'
    },
    {
        min: 51, max: 100,
        label: 'Moderate',
        class: 'aqi-moderate',
        color: '#f59e0b',
        glow: 'rgba(245, 158, 11, 0.25)',
        desc: 'Air quality is acceptable. However, there may be a risk for some people, particularly those who are unusually sensitive to air pollution.',
        general: 'Air quality is acceptable. You can proceed with standard daily routines.',
        sensitive: 'Unusually sensitive individuals should consider reducing prolonged or heavy exertion outdoors.',
        outdoors: 'Good for most outdoor activities; take short breaks if you experience symptoms like throat irritation.',
        ventilation: 'Generally safe to open windows, but limit ventilation if you are highly sensitive to pollen or dust.'
    },
    {
        min: 101, max: 150,
        label: 'Unhealthy (Sensitive)',
        class: 'aqi-sensitive',
        color: '#f97316',
        glow: 'rgba(249, 115, 22, 0.25)',
        desc: 'Members of sensitive groups may experience health effects. The general public is less likely to be affected.',
        general: 'General public is unlikely to be affected, but sensitive individuals should monitor their health.',
        sensitive: 'People with asthma, heart/lung disease, older adults, and children should reduce prolonged outdoor exertion.',
        outdoors: 'Sensitive groups should reduce strenuous outdoor workouts. Replace them with indoor exercises.',
        ventilation: 'Keep windows closed during peak traffic or high wind hours to prevent outdoor pollution from seeping inside.'
    },
    {
        min: 151, max: 200,
        label: 'Unhealthy',
        class: 'aqi-unhealthy',
        color: '#ef4444',
        glow: 'rgba(239, 68, 68, 0.25)',
        desc: 'Some members of the general public may experience health effects; members of sensitive groups may experience more serious health effects.',
        general: 'Everyone may begin to experience adverse health effects. Limit long sessions outdoors.',
        sensitive: 'Vulnerable individuals should avoid outdoor activities and remain in clean-air environments.',
        outdoors: 'Avoid heavy exercises outdoors. Move gym/fitness sessions indoors. Wear a protective N95 mask if outdoors.',
        ventilation: 'Keep windows shut. Use air purifiers/conditioners to recirculate and filter indoor air.'
    },
    {
        min: 201, max: 300,
        label: 'Very Unhealthy',
        class: 'aqi-veryunhealthy',
        color: '#8b5cf6',
        glow: 'rgba(139, 92, 246, 0.25)',
        desc: 'Health alert: The risk of health effects is increased for everyone.',
        general: 'Health warning of emergency conditions. Everyone is likely to be affected. Strictly limit outdoor exposures.',
        sensitive: 'Remain indoors, keep activity levels low, and keep medication (like inhalers) readily available.',
        outdoors: 'Do not exercise outdoors. Wear N95/N99 grade particulate masks if you must commute.',
        ventilation: 'Keep all doors and windows locked. Run air purifiers on high speed. Avoid cooking methods that create smoke.'
    },
    {
        min: 301, max: Infinity,
        label: 'Hazardous',
        class: 'aqi-hazardous',
        color: '#991b1b',
        glow: 'rgba(153, 27, 27, 0.35)',
        desc: 'Health warning of emergency conditions: Everyone is more likely to experience serious health effects.',
        general: 'Extreme health risk. Everyone should avoid all outdoor physical activity. Stay indoors in a sealed room.',
        sensitive: 'Vulnerable individuals must stay inside a clean room and avoid any physical exertion.',
        outdoors: 'Do not go outdoors under any circumstance. Hazardous particulate levels cause acute respiratory strain.',
        ventilation: 'Sealed environment required. Run air purification units. Avoid burning candles, incense, or using gas stoves.'
    }
];

// WMO Weather Code Dictionary
const WEATHER_CODES = {
    0: { text: "Clear Sky", icon: "sun" },
    1: { text: "Mainly Clear", icon: "sun" },
    2: { text: "Partly Cloudy", icon: "cloud-sun" },
    3: { text: "Overcast", icon: "cloud" },
    45: { text: "Fog", icon: "cloud" },
    48: { text: "Depositing Rime Fog", icon: "cloud" },
    51: { text: "Light Drizzle", icon: "cloud-drizzle" },
    53: { text: "Moderate Drizzle", icon: "cloud-drizzle" },
    55: { text: "Dense Drizzle", icon: "cloud-drizzle" },
    61: { text: "Slight Rain", icon: "cloud-rain" },
    63: { text: "Moderate Rain", icon: "cloud-rain" },
    65: { text: "Heavy Rain", icon: "cloud-rain" },
    71: { text: "Slight Snowfall", icon: "snowflake" },
    73: { text: "Moderate Snowfall", icon: "snowflake" },
    75: { text: "Heavy Snowfall", icon: "snowflake" },
    77: { text: "Snow Grains", icon: "snowflake" },
    80: { text: "Slight Rain Showers", icon: "cloud-rain" },
    81: { text: "Moderate Rain Showers", icon: "cloud-rain" },
    82: { text: "Violent Rain Showers", icon: "cloud-lightning" },
    85: { text: "Slight Snow Showers", icon: "snowflake" },
    86: { text: "Heavy Snow Showers", icon: "snowflake" },
    95: { text: "Thunderstorm", icon: "cloud-lightning" },
    96: { text: "Thunderstorm with Hail", icon: "cloud-lightning" },
    99: { text: "Heavy Thunderstorm with Hail", icon: "cloud-lightning" }
};

// WHO limit markers for progress bars
const WHO_GUIDELINES = {
    pm2_5: 15,       // WHO 24h limit is 15 µg/m³
    pm10: 45,        // WHO 24h limit is 45 µg/m³
    no2: 25,         // WHO 24h limit is 25 µg/m³
    o3: 100,         // WHO 8h limit is 100 µg/m³
    co: 4,           // WHO 24h limit is 4 mg/m³
    so2: 40,         // WHO 24h limit is 40 µg/m³
    uv: 6,           // Arbitrary reference scale (Medium radiation)
    dust: 100        // Reference concentration
};

// Document Load Event
document.addEventListener("DOMContentLoaded", () => {
    // 1. Initialize Views, Toggles & Nav Actions
    initNavigation();
    initTheme();
    initSearchAutocomplete();
    initTabs();
    initComparisonSearch();

    // 2. Fetch Favorites & Load Default City
    fetchFavorites().then(() => {
        loadCityData(STATE.currentCity);
    });

    // 3. Make sure Lucide icons are initialized
    lucide.createIcons();
});

/* =========================================================================
   THEME MANAGEMENT (DARK / LIGHT / DYNAMIC AQI GLOW)
   ========================================================================= */

function initTheme() {
    const themeBtn = document.getElementById("theme-toggle");
    
    // Auto-detect system preference or load stored setting
    const savedTheme = localStorage.getItem("app-theme");
    if (savedTheme === "light") {
        document.body.classList.remove("dark-theme");
        document.body.classList.add("light-theme");
    } else {
        document.body.classList.remove("light-theme");
        document.body.classList.add("dark-theme");
    }

    themeBtn.addEventListener("click", () => {
        if (document.body.classList.contains("dark-theme")) {
            document.body.classList.replace("dark-theme", "light-theme");
            localStorage.setItem("app-theme", "light");
        } else {
            document.body.classList.replace("light-theme", "dark-theme");
            localStorage.setItem("app-theme", "dark");
        }
        
        // Redraw map tile styles if map exists
        if (STATE.leafletMap) {
            updateMapTiles();
        }
    });
}

function updateDynamicGlow(aqi) {
    const info = getAQIInfo(aqi);
    document.documentElement.style.setProperty('--active-theme-color', info.color);
    document.documentElement.style.setProperty('--active-glow-color', info.glow);
    
    // Animate the sidebar brand icon glow
    const brandIcon = document.querySelector(".brand-icon");
    if (brandIcon) {
        brandIcon.style.color = info.color;
        brandIcon.style.filter = `drop-shadow(0 0 8px ${info.glow})`;
    }
}

function getAQIInfo(aqi) {
    for (const range of AQI_RANGES) {
        if (aqi >= range.min && aqi <= range.max) {
            return range;
        }
    }
    return AQI_RANGES[AQI_RANGES.length - 1];
}

/* =========================================================================
   NAVIGATION & TABS MANAGEMENT
   ========================================================================= */

function initNavigation() {
    const navItems = document.querySelectorAll(".nav-item");
    const viewPanels = document.querySelectorAll(".view-panel");

    navItems.forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            const targetView = item.getAttribute("data-view");
            
            navItems.forEach(n => n.classList.remove("active"));
            item.classList.add("active");

            viewPanels.forEach(panel => {
                panel.classList.add("hidden");
                if (panel.id === `${targetView}-view`) {
                    panel.classList.remove("hidden");
                }
            });

            STATE.activeView = targetView;
            
            // Trigger maps and charts resizing on tab change
            if (targetView === 'map') {
                setTimeout(() => {
                    if (STATE.leafletMap) {
                        STATE.leafletMap.invalidateSize();
                    }
                }, 100);
            }
        });
    });
}

function initTabs() {
    const tabButtons = document.querySelectorAll(".tab-btn");
    const tabPanes = document.querySelectorAll(".tab-pane");

    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const targetTab = btn.getAttribute("data-tab");
            
            tabButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            tabPanes.forEach(pane => {
                pane.classList.remove("active");
                if (pane.id === targetTab) {
                    pane.classList.add("active");
                }
            });
        });
    });
}

/* =========================================================================
   API INTERACTION & SEARCH AUTOCOMPLETE
   ========================================================================= */

function initSearchAutocomplete() {
    const searchInput = document.getElementById("city-search");
    const suggestionsBox = document.getElementById("search-suggestions");
    const spinner = document.getElementById("loading-spinner");
    let debounceTimer;

    searchInput.addEventListener("input", () => {
        clearTimeout(debounceTimer);
        const query = searchInput.value.trim();

        if (query.length < 2) {
            suggestionsBox.classList.add("hidden");
            suggestionsBox.innerHTML = "";
            return;
        }

        spinner.classList.remove("hidden");

        debounceTimer = setTimeout(() => {
            fetch(`/api/search?q=${encodeURIComponent(query)}`)
                .then(res => res.json())
                .then(data => {
                    spinner.classList.add("hidden");
                    renderSuggestions(data.results, suggestionsBox, (city) => {
                        searchInput.value = "";
                        suggestionsBox.classList.add("hidden");
                        
                        STATE.currentCity = {
                            name: city.name,
                            latitude: city.latitude,
                            longitude: city.longitude,
                            country: city.country,
                            region: city.admin1 || ""
                        };
                        
                        loadCityData(STATE.currentCity);
                    });
                })
                .catch(() => {
                    spinner.classList.add("hidden");
                });
        }, 350);
    });

    // Close recommendations panel if clicking outside
    document.addEventListener("click", (e) => {
        if (!searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
            suggestionsBox.classList.add("hidden");
        }
    });
}

function renderSuggestions(results, box, onSelect) {
    box.innerHTML = "";
    if (!results || results.length === 0) {
        box.classList.add("hidden");
        return;
    }

    results.forEach(city => {
        const item = document.createElement("div");
        item.className = "suggestion-item";
        
        const regionText = city.admin1 ? `${city.admin1}, ` : "";
        item.innerHTML = `
            <span class="city-name">${city.name}</span>
            <span class="region-country">${regionText}${city.country}</span>
        `;
        
        item.addEventListener("click", () => onSelect(city));
        box.appendChild(item);
    });

    box.classList.remove("hidden");
}

/* =========================================================================
   LOAD CITY DATA AND RENDER WIDGETS
   ========================================================================= */

function loadCityData(city) {
    const loader = document.getElementById("page-loader");
    loader.classList.remove("hidden");

    fetch(`/api/air-quality?latitude=${city.latitude}&longitude=${city.longitude}`)
        .then(res => res.json())
        .then(data => {
            loader.classList.add("hidden");
            
            // Check if city is favorited
            const matchedFav = STATE.favorites.find(f => 
                Math.abs(f.latitude - city.latitude) < 0.01 && 
                Math.abs(f.longitude - city.longitude) < 0.01
            );
            STATE.currentCity.id = matchedFav ? matchedFav.id : null;
            updateFavoriteButtonState();

            // Render components
            renderDashboard(city, data);
            renderAnalyticsChart(data.hourly_aqi);
            renderGISMap(city, data.current_aqi.us_aqi);
        })
        .catch(err => {
            loader.classList.add("hidden");
            alert("Error loading atmospheric data. Please check connection and try again.");
            console.error(err);
        });
}

function renderDashboard(city, data) {
    // 1. Title bar location display
    const locDisplay = document.getElementById("current-location-display");
    const regionSuffix = city.region ? `, ${city.region}` : "";
    locDisplay.textContent = `${city.name}${regionSuffix} (${city.country})`;

    // 2. US AQI Circular Gauge
    const aqi = Math.round(data.current_aqi.us_aqi);
    const aqiValElement = document.getElementById("aqi-value");
    const aqiStatusElement = document.getElementById("aqi-status-text");
    const aqiDescElement = document.getElementById("aqi-status-desc");
    const gaugeFill = document.getElementById("gauge-fill");

    aqiValElement.textContent = aqi;
    
    // Update theme values
    updateDynamicGlow(aqi);
    const aqiInfo = getAQIInfo(aqi);
    
    aqiStatusElement.textContent = aqiInfo.label;
    aqiStatusElement.className = `aqi-status-badge ${aqiInfo.class}`;
    aqiDescElement.textContent = aqiInfo.desc;

    // SVG dashboard offset animation
    // Circle circumference is 2 * PI * r = 2 * 3.14159 * 42 = 263.89 ~ 264
    const percentage = Math.min(aqi, 500) / 500;
    const offset = 264 - (percentage * 264);
    gaugeFill.style.strokeDashoffset = offset;

    // 3. Current Weather
    const weather = data.current_weather;
    const tempElement = document.getElementById("weather-temp");
    const condTextElement = document.getElementById("weather-condition-text");
    const feelsLikeElement = document.getElementById("weather-feels-like");
    const humidityElement = document.getElementById("weather-humidity");
    const windSpeedElement = document.getElementById("weather-wind-speed");
    const windDirElement = document.getElementById("weather-wind-direction");
    const weatherIcon = document.getElementById("weather-icon");

    tempElement.textContent = Math.round(weather.temperature_2m);
    
    const weatherInfo = WEATHER_CODES[weather.weather_code] || { text: "Cloudy", icon: "cloud" };
    condTextElement.textContent = weatherInfo.text;
    
    // Update weather icon class
    weatherIcon.setAttribute("data-lucide", weatherInfo.icon);
    
    feelsLikeElement.textContent = `${Math.round(weather.apparent_temperature)}°C`;
    humidityElement.textContent = `${Math.round(weather.relative_humidity_2m)}%`;
    windSpeedElement.textContent = `${Math.round(weather.wind_speed_10m)} km/h`;
    windDirElement.textContent = `${weather.wind_direction_10m}°`;
    
    // Rotate wind vane
    const windVane = document.getElementById("wind-direction-icon");
    if (windVane) {
        windVane.style.transform = `rotate(${weather.wind_direction_10m}deg)`;
        windVane.style.transition = "transform 1s ease";
    }

    // 4. Health Guidelines update
    document.getElementById("adv-general-text").textContent = aqiInfo.general;
    document.getElementById("adv-sensitive-text").textContent = aqiInfo.sensitive;
    document.getElementById("adv-outdoors-text").textContent = aqiInfo.outdoors;
    document.getElementById("adv-ventilation-text").textContent = aqiInfo.ventilation;

    // 5. Pollutants Cards
    const pollutants = [
        { id: 'pm2_5', val: data.current_aqi.pm2_5 },
        { id: 'pm10', val: data.current_aqi.pm10 },
        { id: 'no2', val: data.current_aqi.nitrogen_dioxide },
        { id: 'o3', val: data.current_aqi.ozone },
        { id: 'co', val: data.current_aqi.carbon_monoxide },
        { id: 'so2', val: data.current_aqi.sulphur_dioxide },
        { id: 'uv', val: data.current_aqi.uv_index },
        { id: 'dust', val: data.current_aqi.dust }
    ];

    pollutants.forEach(p => {
        const valEl = document.getElementById(`val-${p.id}`);
        const barEl = document.getElementById(`bar-${p.id}`);
        
        if (p.val !== undefined && p.val !== null) {
            // Round nicely
            const roundedVal = p.id === 'co' ? p.val.toFixed(2) : Math.round(p.val);
            valEl.textContent = roundedVal;
            
            // WHO limit scale width percentage
            const whoLimit = WHO_GUIDELINES[p.id];
            const widthPercentage = Math.min((p.val / whoLimit) * 100, 100);
            barEl.style.width = `${widthPercentage}%`;
        } else {
            valEl.textContent = "--";
            barEl.style.width = "0%";
        }
    });

    // Recreate Lucide Icons to bind updated items
    lucide.createIcons();
}

/* =========================================================================
   ANALYTICS CHART MANAGEMENT (CHART.JS)
   ========================================================================= */

function renderAnalyticsChart(hourlyData) {
    if (!hourlyData || !hourlyData.time) return;

    // Extract values
    const times = hourlyData.time.slice(0, 168); // Show 7 days (168 hours)
    const parameterData = hourlyData[STATE.activeTrendParam].slice(0, 168);
    
    // Format times into labels (e.g. "Jun 20, 12:00")
    const labels = times.map(t => {
        const d = new Date(t);
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + `, ${d.getHours()}:00`;
    });

    // Compute Summary Stats
    const parameterValues = hourlyData[STATE.activeTrendParam].slice(0, 168).filter(v => v !== null);
    if (parameterValues.length > 0) {
        const maxVal = Math.max(...parameterValues);
        const minVal = Math.min(...parameterValues);
        const avgVal = parameterValues.reduce((a, b) => a + b, 0) / parameterValues.length;
        
        const maxIndex = parameterValues.indexOf(maxVal);
        const minIndex = parameterValues.indexOf(minVal);
        
        const maxTimeStr = new Date(times[maxIndex]).toLocaleString(undefined, { weekday: 'short', hour: '2-digit', minute:'2-digit' });
        const minTimeStr = new Date(times[minIndex]).toLocaleString(undefined, { weekday: 'short', hour: '2-digit', minute:'2-digit' });

        document.getElementById("stat-max-aqi").textContent = Math.round(maxVal);
        document.getElementById("stat-max-time").textContent = `Occurred on ${maxTimeStr}`;
        document.getElementById("stat-min-aqi").textContent = Math.round(minVal);
        document.getElementById("stat-min-time").textContent = `Occurred on ${minTimeStr}`;
        document.getElementById("stat-avg-aqi").textContent = Math.round(avgVal);
        
        const avgInfo = getAQIInfo(avgVal);
        document.getElementById("stat-condition-freq").textContent = `Average Quality: ${avgInfo.label}`;
    }

    // Chart Options & Palette
    const ctx = document.getElementById("trend-chart").getContext("2d");
    const activeColor = getComputedStyle(document.documentElement).getPropertyValue('--active-theme-color').trim();
    
    // Destroy previous instance
    if (STATE.trendChart) {
        STATE.trendChart.destroy();
    }

    // Create chart gradients
    const gradient = ctx.createLinearGradient(0, 0, 0, 350);
    gradient.addColorStop(0, `${activeColor}40`);
    gradient.addColorStop(1, `${activeColor}00`);

    let parameterLabel = "US AQI Value";
    if (STATE.activeTrendParam === 'pm2_5') parameterLabel = "Fine Particles (PM2.5) µg/m³";
    if (STATE.activeTrendParam === 'pm10') parameterLabel = "Coarse Particles (PM10) µg/m³";
    if (STATE.activeTrendParam === 'ozone') parameterLabel = "Ozone (O3) µg/m³";
    if (STATE.activeTrendParam === 'nitrogen_dioxide') parameterLabel = "Nitrogen Dioxide (NO2) µg/m³";

    STATE.trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: parameterLabel,
                data: parameterData,
                borderColor: activeColor,
                borderWidth: 3,
                backgroundColor: gradient,
                fill: true,
                tension: 0.3,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHitRadius: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        color: 'rgba(156, 163, 175, 0.7)',
                        maxTicksLimit: 7
                    }
                },
                y: {
                    grid: { color: 'rgba(156, 163, 175, 0.1)' },
                    ticks: { color: 'rgba(156, 163, 175, 0.7)' }
                }
            }
        }
    });

    // Setup filter click actions
    const filters = document.querySelectorAll("#chart-parameter-toggles .filter-btn");
    filters.forEach(btn => {
        btn.onclick = () => {
            filters.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            STATE.activeTrendParam = btn.getAttribute("data-param");
            renderAnalyticsChart(hourlyData);
        };
    });
}

/* =========================================================================
   GIS INTERACTIVE MAP MANAGEMENT (LEAFLET.JS)
   ========================================================================= */

function renderGISMap(city, aqi) {
    const lat = city.latitude;
    const lon = city.longitude;
    const aqiInfo = getAQIInfo(aqi);

    // Focused coordinates display
    document.getElementById("map-focused-coords").textContent = `${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`;

    // 1. Initialize Map Object once
    if (!STATE.leafletMap) {
        STATE.leafletMap = L.map('aqi-map').setView([lat, lon], 10);
        updateMapTiles();
    } else {
        STATE.leafletMap.setView([lat, lon], 10);
    }

    // 2. Remove previous marker if it exists
    if (STATE.mapMarker) {
        STATE.leafletMap.removeLayer(STATE.mapMarker);
    }

    // 3. Create Custom Pulse Icon using AQI color
    const customIcon = L.divIcon({
        className: 'custom-aqi-marker',
        html: `
            <div style="
                width: 20px; 
                height: 20px; 
                border-radius: 50%; 
                background: ${aqiInfo.color}; 
                border: 3px solid #ffffff;
                box-shadow: 0 0 10px ${aqiInfo.color}, 0 0 0 6px ${aqiInfo.color}40;
                animation: pulse 1.5s infinite;
            "></div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });

    // 4. Add Marker
    STATE.mapMarker = L.marker([lat, lon], { icon: customIcon }).addTo(STATE.leafletMap);
    
    // Popup binding
    const matchedRegion = city.region ? `${city.region}, ` : "";
    STATE.mapMarker.bindPopup(`
        <div style="font-family: 'Inter', sans-serif; min-width: 140px;">
            <b style="font-family: 'Outfit'; font-size: 1rem; color: #111827;">${city.name}</b><br>
            <span style="font-size:0.8rem; color:#4b5563;">${matchedRegion}${city.country}</span><br>
            <div style="
                margin-top: 8px; 
                padding: 4px 8px; 
                border-radius: 6px; 
                background: ${aqiInfo.color}; 
                color: #ffffff; 
                font-weight: bold; 
                font-size: 0.85rem; 
                text-align: center;
            ">
                AQI: ${Math.round(aqi)} - ${aqiInfo.label}
            </div>
        </div>
    `).openPopup();
}

function updateMapTiles() {
    // Clean up existing tiles
    STATE.leafletMap.eachLayer(layer => {
        if (layer instanceof L.TileLayer) {
            STATE.leafletMap.removeLayer(layer);
        }
    });

    const isDark = document.body.classList.contains("dark-theme");
    const tileUrl = isDark 
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

    L.tileLayer(tileUrl, {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(STATE.leafletMap);
}

/* =========================================================================
   FAVORITES AND DATABASE ACTIONS
   ========================================================================= */

async function fetchFavorites() {
    try {
        const response = await fetch('/api/favorites');
        const data = await response.json();
        STATE.favorites = data.favorites || [];
        renderFavoritesGrid();
    } catch (e) {
        console.error("Error fetching favorites list:", e);
    }
}

function updateFavoriteButtonState() {
    const favBtn = document.getElementById("favorite-btn");
    if (STATE.currentCity.id !== null) {
        favBtn.classList.add("active");
    } else {
        favBtn.classList.remove("active");
    }
}

// Bind Bookmark toggle button click
document.getElementById("favorite-btn").addEventListener("click", async () => {
    const city = STATE.currentCity;
    const favBtn = document.getElementById("favorite-btn");

    if (city.id !== null) {
        // Remove from favorites
        try {
            const res = await fetch(`/api/favorites/${city.id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                city.id = null;
                favBtn.classList.remove("active");
                await fetchFavorites();
            }
        } catch (e) {
            alert("Error removing location from favorites.");
        }
    } else {
        // Save to favorites
        const payload = {
            city_name: city.name,
            latitude: city.latitude,
            longitude: city.longitude,
            country: city.country,
            region: city.region
        };
        try {
            const res = await fetch('/api/favorites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.status === 201) {
                await fetchFavorites();
                // Find and link ID
                const matchedFav = STATE.favorites.find(f => 
                    Math.abs(f.latitude - city.latitude) < 0.01 && 
                    Math.abs(f.longitude - city.longitude) < 0.01
                );
                city.id = matchedFav ? matchedFav.id : null;
                favBtn.classList.add("active");
            }
        } catch (e) {
            alert("Error adding location to favorites.");
        }
    }
});

function renderFavoritesGrid() {
    const grid = document.getElementById("favorites-grid");
    const noFavsMsg = document.getElementById("no-favorites-msg");

    // Clear grid but keep no favorites template initially
    grid.innerHTML = "";
    
    if (STATE.favorites.length === 0) {
        grid.appendChild(noFavsMsg);
        noFavsMsg.classList.remove("hidden");
        return;
    }

    noFavsMsg.classList.add("hidden");

    STATE.favorites.forEach(fav => {
        const card = document.createElement("div");
        card.className = "card glass favorite-card";
        
        const regionText = fav.region ? `${fav.region}, ` : "";
        card.innerHTML = `
            <div class="fav-card-header">
                <div class="fav-card-title">
                    <span class="fav-city-name">${fav.city_name}</span>
                    <span class="fav-country">${regionText}${fav.country}</span>
                </div>
                <button class="fav-delete-btn" title="Remove city" data-id="${fav.id}">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
            <div class="fav-card-content">
                <div class="fav-aqi-display">
                    <span class="fav-aqi-val" id="fav-val-${fav.id}">--</span>
                    <span class="fav-aqi-lbl">US AQI</span>
                </div>
                <span class="fav-aqi-badge" id="fav-badge-${fav.id}" style="background-color: var(--text-muted)">Loading</span>
            </div>
        `;

        // Click on card loads city details
        card.addEventListener("click", (e) => {
            if (e.target.closest(".fav-delete-btn")) return;
            
            STATE.currentCity = {
                name: fav.city_name,
                latitude: fav.latitude,
                longitude: fav.longitude,
                country: fav.country,
                region: fav.region,
                id: fav.id
            };
            
            // Trigger View Swap to Dashboard
            const dashNav = document.querySelector(".nav-item[data-view='dashboard']");
            if (dashNav) dashNav.click();
            
            loadCityData(STATE.currentCity);
        });

        // Delete button listener
        card.querySelector(".fav-delete-btn").addEventListener("click", async (e) => {
            e.stopPropagation();
            const id = e.target.closest(".fav-delete-btn").getAttribute("data-id");
            if (confirm("Remove this city from saved locations?")) {
                await deleteFavoriteAction(id);
            }
        });

        grid.appendChild(card);
        
        // Fetch current live AQI for this favorite city
        fetchFavLiveAQI(fav.id, fav.latitude, fav.longitude);
    });

    lucide.createIcons();
}

async function deleteFavoriteAction(id) {
    try {
        const response = await fetch(`/api/favorites/${id}`, { method: 'DELETE' });
        const data = await response.json();
        if (data.success) {
            if (STATE.currentCity.id === parseInt(id)) {
                STATE.currentCity.id = null;
                updateFavoriteButtonState();
            }
            await fetchFavorites();
        }
    } catch (e) {
        console.error("Error deleting favorite item:", e);
    }
}

function fetchFavLiveAQI(id, lat, lon) {
    fetch(`/api/air-quality?latitude=${lat}&longitude=${lon}`)
        .then(res => res.json())
        .then(data => {
            const valEl = document.getElementById(`fav-val-${id}`);
            const badgeEl = document.getElementById(`fav-badge-${id}`);
            if (valEl && badgeEl && data.current_aqi) {
                const aqi = Math.round(data.current_aqi.us_aqi);
                const info = getAQIInfo(aqi);
                
                valEl.textContent = aqi;
                badgeEl.textContent = info.label;
                badgeEl.style.backgroundColor = info.color;
            }
        })
        .catch(() => {
            const badgeEl = document.getElementById(`fav-badge-${id}`);
            if (badgeEl) {
                badgeEl.textContent = "Offline";
            }
        });
}

/* =========================================================================
   CITY COMPARISON VIEW CODE
   ========================================================================= */

function initComparisonSearch() {
    const inputA = document.getElementById("compare-city-a");
    const inputB = document.getElementById("compare-city-b");
    const suggestionsA = document.getElementById("suggestions-a");
    const suggestionsB = document.getElementById("suggestions-b");
    const spinA = document.getElementById("spinner-a");
    const spinB = document.getElementById("spinner-b");
    const tagA = document.getElementById("tag-city-a");
    const tagB = document.getElementById("tag-city-b");
    const compareBtn = document.getElementById("compare-trigger-btn");

    setupCompareSearch(inputA, suggestionsA, spinA, tagA, 'compareCityA', compareBtn);
    setupCompareSearch(inputB, suggestionsB, spinB, tagB, 'compareCityB', compareBtn);

    compareBtn.addEventListener("click", () => {
        if (STATE.compareCityA && STATE.compareCityB) {
            runComparison(STATE.compareCityA, STATE.compareCityB);
        }
    });
}

function setupCompareSearch(input, suggestions, spinner, tag, stateKey, triggerBtn) {
    let debounce;
    
    input.addEventListener("input", () => {
        clearTimeout(debounce);
        const query = input.value.trim();
        
        if (query.length < 2) {
            suggestions.classList.add("hidden");
            return;
        }

        spinner.classList.remove("hidden");
        
        debounce = setTimeout(() => {
            fetch(`/api/search?q=${encodeURIComponent(query)}`)
                .then(res => res.json())
                .then(data => {
                    spinner.classList.add("hidden");
                    renderSuggestions(data.results, suggestions, (city) => {
                        input.value = "";
                        suggestions.classList.add("hidden");
                        
                        STATE[stateKey] = {
                            name: city.name,
                            latitude: city.latitude,
                            longitude: city.longitude,
                            country: city.country,
                            region: city.admin1 || ""
                        };
                        
                        // Hide input and show selected city badge
                        input.classList.add("hidden");
                        tag.innerHTML = `
                            <span>${city.name} (${city.country})</span>
                            <button id="clear-${stateKey}">&times;</button>
                        `;
                        tag.classList.remove("hidden");

                        // Add clear function
                        tag.querySelector("button").onclick = () => {
                            STATE[stateKey] = null;
                            tag.classList.add("hidden");
                            input.classList.remove("hidden");
                            triggerBtn.disabled = true;
                            document.getElementById("compare-results").classList.add("hidden");
                        };

                        // Check if both are ready
                        if (STATE.compareCityA && STATE.compareCityB) {
                            triggerBtn.disabled = false;
                        }
                    });
                })
                .catch(() => {
                    spinner.classList.add("hidden");
                });
        }, 350);
    });

    document.addEventListener("click", (e) => {
        if (!input.contains(e.target) && !suggestions.contains(e.target)) {
            suggestions.classList.add("hidden");
        }
    });
}

async function runComparison(cityA, cityB) {
    const resultsPanel = document.getElementById("compare-results");
    resultsPanel.classList.add("hidden"); // Hide previous if any
    
    const loader = document.getElementById("page-loader");
    loader.classList.remove("hidden");

    try {
        const [resA, resB] = await Promise.all([
            fetch(`/api/air-quality?latitude=${cityA.latitude}&longitude=${cityA.longitude}`),
            fetch(`/api/air-quality?latitude=${cityB.latitude}&longitude=${cityB.longitude}`)
        ]);
        
        const dataA = await resA.json();
        const dataB = await resB.json();
        
        loader.classList.add("hidden");
        resultsPanel.classList.remove("hidden");

        // 1. Populate City A Card
        const aqiA = Math.round(dataA.current_aqi.us_aqi);
        const infoA = getAQIInfo(aqiA);
        document.getElementById("compare-name-a").textContent = cityA.name;
        document.getElementById("compare-aqi-a").textContent = aqiA;
        document.getElementById("compare-aqi-a").style.color = infoA.color;
        document.getElementById("compare-status-a").textContent = infoA.label;
        document.getElementById("compare-status-a").style.backgroundColor = infoA.color;
        document.getElementById("compare-temp-a").textContent = `${Math.round(dataA.current_weather.temperature_2m)}°C`;
        document.getElementById("compare-hum-a").textContent = `${Math.round(dataA.current_weather.relative_humidity_2m)}%`;
        document.getElementById("compare-wind-a").textContent = `${Math.round(dataA.current_weather.wind_speed_10m)} km/h`;
        document.getElementById("compare-pm25-a").textContent = `${Math.round(dataA.current_aqi.pm2_5)} µg/m³`;
        document.getElementById("compare-pm10-a").textContent = `${Math.round(dataA.current_aqi.pm10)} µg/m³`;
        document.getElementById("compare-o3-a").textContent = `${Math.round(dataA.current_aqi.ozone)} µg/m³`;

        // 2. Populate City B Card
        const aqiB = Math.round(dataB.current_aqi.us_aqi);
        const infoB = getAQIInfo(aqiB);
        document.getElementById("compare-name-b").textContent = cityB.name;
        document.getElementById("compare-aqi-b").textContent = aqiB;
        document.getElementById("compare-aqi-b").style.color = infoB.color;
        document.getElementById("compare-status-b").textContent = infoB.label;
        document.getElementById("compare-status-b").style.backgroundColor = infoB.color;
        document.getElementById("compare-temp-b").textContent = `${Math.round(dataB.current_weather.temperature_2m)}°C`;
        document.getElementById("compare-hum-b").textContent = `${Math.round(dataB.current_weather.relative_humidity_2m)}%`;
        document.getElementById("compare-wind-b").textContent = `${Math.round(dataB.current_weather.wind_speed_10m)} km/h`;
        document.getElementById("compare-pm25-b").textContent = `${Math.round(dataB.current_aqi.pm2_5)} µg/m³`;
        document.getElementById("compare-pm10-b").textContent = `${Math.round(dataB.current_aqi.pm10)} µg/m³`;
        document.getElementById("compare-o3-b").textContent = `${Math.round(dataB.current_aqi.ozone)} µg/m³`;

        // 3. Compute Verdict
        const verdictEl = document.getElementById("comparison-verdict-text");
        if (aqiA === aqiB) {
            verdictEl.innerHTML = `Both <b>${cityA.name}</b> and <b>${cityB.name}</b> share the same atmospheric air index of <b>${aqiA}</b>.`;
        } else {
            const cleanerCity = aqiA < aqiB ? cityA.name : cityB.name;
            const dirtyCity = aqiA < aqiB ? cityB.name : cityA.name;
            const difference = Math.abs(aqiA - aqiB);
            const percentImprovement = Math.round((difference / Math.max(aqiA, aqiB)) * 100);
            
            verdictEl.innerHTML = `
                <b>${cleanerCity}</b> has cleaner air than <b>${dirtyCity}</b>.<br>
                The air quality in <b>${cleanerCity}</b> is approximately <b>${percentImprovement}% better</b> (difference of ${difference} AQI points).
            `;
        }

        // 4. Render Dual Forecast Chart
        renderComparisonChart(cityA, dataA.hourly_aqi, cityB, dataB.hourly_aqi);

    } catch (e) {
        loader.classList.add("hidden");
        alert("Error retrieving comparison data.");
        console.error(e);
    }
}

function renderComparisonChart(cityA, hourlyA, cityB, hourlyB) {
    const ctx = document.getElementById("compare-chart").getContext("2d");
    
    // Slice 7 days
    const times = hourlyA.time.slice(0, 168);
    const dataA = hourlyA.us_aqi.slice(0, 168);
    const dataB = hourlyB.us_aqi.slice(0, 168);

    const labels = times.map(t => {
        const d = new Date(t);
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + `, ${d.getHours()}:00`;
    });

    if (STATE.compareChart) {
        STATE.compareChart.destroy();
    }

    STATE.compareChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: `${cityA.name} AQI`,
                    data: dataA,
                    borderColor: '#3b82f6', // blue
                    backgroundColor: 'rgba(59, 130, 246, 0.05)',
                    borderWidth: 2.5,
                    tension: 0.3,
                    pointRadius: 0,
                    pointHoverRadius: 4
                },
                {
                    label: `${cityB.name} AQI`,
                    data: dataB,
                    borderColor: '#ec4899', // pink
                    backgroundColor: 'rgba(236, 72, 153, 0.05)',
                    borderWidth: 2.5,
                    tension: 0.3,
                    pointRadius: 0,
                    pointHoverRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    labels: { color: 'rgba(156, 163, 175, 0.9)' }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        color: 'rgba(156, 163, 175, 0.7)',
                        maxTicksLimit: 7
                    }
                },
                y: {
                    grid: { color: 'rgba(156, 163, 175, 0.1)' },
                    ticks: { color: 'rgba(156, 163, 175, 0.7)' }
                }
            }
        }
    });
}
