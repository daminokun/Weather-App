// Konfigurasi API Key
const apiKey = "ac324a808280e23b7458e9e2244c90a2";
const unsplashKey = "tGhfP7vJcCpyHlYhs1UHMpyZ5y5RyeGD6BOtJZn22q0"; 

// URL Endpoints
const apiUrlCity = "https://api.openweathermap.org/data/2.5/weather?units=metric&q=";
const apiUrlCoords = "https://api.openweathermap.org/data/2.5/weather?units=metric&";
const apiUrlForecast = "https://api.openweathermap.org/data/2.5/forecast?units=metric&";
const geoApiUrl = "https://api.openweathermap.org/geo/1.0/direct?limit=5&q=";

// Elemen DOM
const searchBox = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const errorMsg = document.getElementById("errorMsg");
const weatherIcon = document.getElementById("weatherIcon");
const suggestionsBox = document.getElementById("suggestions");
const forecastContainer = document.getElementById("forecast");

let debounceTimer;
let map;
let marker;

// 1. Ambil Gambar Latar Belakang HD dari Unsplash API
async function fetchUnsplashBackground(cityName, weatherCondition) {
  const unsplashUrl = `https://api.unsplash.com/photos/random?query=${cityName},${weatherCondition}&orientation=landscape&client_id=${unsplashKey}`;

  try {
    const response = await fetch(unsplashUrl);
    if (response.ok) {
      const data = await response.json();
      document.body.style.backgroundImage = `url('${data.urls.regular}')`;
    } else {
      document.body.style.backgroundImage = `url('https://images.unsplash.com/photo-1516912481808-3406841bd33c?auto=format&fit=crop&w=1920&q=80')`;
    }
  } catch (err) {
    console.error("Ralat Unsplash API:", err);
  }
}

// 2. Dapatkan & Paparkan Ramalan Cuaca 5 Hari
async function fetchForecast(lat, lon) {
  try {
    const response = await fetch(`${apiUrlForecast}lat=${lat}&lon=${lon}&appid=${apiKey}`);
    if (response.ok) {
      const data = await response.json();
      updateForecastUI(data);
    }
  } catch (err) {
    console.error("Ralat Forecast API:", err);
  }
}

function updateForecastUI(data) {
  if (!forecastContainer) return;
  forecastContainer.innerHTML = "";

  // Tapis data setiap 3 jam untuk ambil slot waktu 12:00:00 tengah hari sahaja
  const dailyData = data.list.filter((item) => item.dt_txt.includes("12:00:00"));

  dailyData.forEach((item) => {
    const date = new Date(item.dt * 1000);
    const dayName = date.toLocaleDateString("ms-MY", { weekday: "short" });
    const temp = Math.round(item.main.temp);
    const iconCode = item.weather[0].icon;

    const card = document.createElement("div");
    card.classList.add("forecast-card");
    card.innerHTML = `
      <p style="font-weight: bold;">${dayName}</p>
      <img src="https://openweathermap.org/img/wn/${iconCode}.png" alt="icon" />
      <p style="font-weight: bold;">${temp}°C</p>
    `;

    forecastContainer.appendChild(card);
  });
}

// 3. Kemas Kini Tampilan UI Cuaca Semasa
async function updateUI(data) {
  document.getElementById("city").textContent = data.name;
  document.getElementById("temp").textContent = Math.round(data.main.temp) + "°C";
  document.getElementById("humidity").textContent = data.main.humidity + "%";
  document.getElementById("wind").textContent = data.wind.speed + " km/h";

  const iconCode = data.weather[0].icon;
  weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;

  const cityName = data.name;
  const weatherCondition = data.weather[0].main;
  await fetchUnsplashBackground(cityName, weatherCondition);

  // Kemas kini Minimap & Ramalan 5 Hari
  updateMap(data.coord.lat, data.coord.lon, data.name);
  fetchForecast(data.coord.lat, data.coord.lon);

  errorMsg.style.display = "none";
}

// 4. Semak Cuaca Mengikut Nama Bandar
async function checkWeatherByCity(city) {
  if (!city) return;
  
  try {
    const response = await fetch(apiUrlCity + city + `&appid=${apiKey}`);
    if (response.status === 404) {
      errorMsg.style.display = "block";
    } else {
      const data = await response.json();
      updateUI(data);
    }
  } catch (err) {
    errorMsg.style.display = "block";
  }
}

// 5. Semak Cuaca Mengikut Koordinat GPS (Geolocation)
async function checkWeatherByCoords(lat, lon) {
  try {
    const response = await fetch(`${apiUrlCoords}lat=${lat}&lon=${lon}&appid=${apiKey}`);
    if (response.ok) {
      const data = await response.json();
      updateUI(data);
    } else {
      checkWeatherByCity("Kuala Lumpur");
    }
  } catch (err) {
    checkWeatherByCity("Kuala Lumpur");
  }
}

// 6. Autocomplete: Ambil Cadangan Lokasi Dari Geocoding API
async function fetchCitySuggestions(query) {
  if (query.length < 2) {
    suggestionsBox.style.display = "none";
    return;
  }

  try {
    const response = await fetch(`${geoApiUrl}${query}&appid=${apiKey}`);
    if (response.ok) {
      const cities = await response.json();
      showSuggestions(cities);
    }
  } catch (err) {
    console.error("Ralat Geocoding API:", err);
  }
}

// 7. Autocomplete: Paparkan Cadangan Lokasi Dalam Senarai
function showSuggestions(cities) {
  suggestionsBox.innerHTML = "";

  if (cities.length === 0) {
    suggestionsBox.style.display = "none";
    return;
  }

  cities.forEach((city) => {
    const div = document.createElement("div");
    div.classList.add("suggestion-item");
    
    const stateStr = city.state ? `, ${city.state}` : "";
    const fullLocation = `${city.name}${stateStr}, ${city.country}`;
    div.textContent = fullLocation;

    div.addEventListener("click", () => {
      searchBox.value = fullLocation;
      suggestionsBox.style.display = "none";
      checkWeatherByCoords(city.lat, city.lon);
    });

    suggestionsBox.appendChild(div);
  });

  suggestionsBox.style.display = "block";
}

// 8. Pengendali Kebenaran GPS Lokasi
function initWeather() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        checkWeatherByCoords(lat, lon);
      },
      (error) => {
        checkWeatherByCity("Kuala Lumpur");
      }
    );
  } else {
    checkWeatherByCity("Kuala Lumpur");
  }
}

// 9. Event Listeners
searchBtn.addEventListener("click", () => {
  suggestionsBox.style.display = "none";
  checkWeatherByCity(searchBox.value);
});

searchBox.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    suggestionsBox.style.display = "none";
    checkWeatherByCity(searchBox.value);
  }
});

searchBox.addEventListener("input", (e) => {
  clearTimeout(debounceTimer);
  const query = e.target.value.trim();
  debounceTimer = setTimeout(() => {
    fetchCitySuggestions(query);
  }, 300);
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".input-container")) {
    suggestionsBox.style.display = "none";
  }
});

// 10. Inisialisasi / Kemas Kini Minimap
function updateMap(lat, lon, cityName) {
  if (!map) {
    map = L.map('map').setView([lat, lon], 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);

    marker = L.marker([lat, lon]).addTo(map)
      .bindPopup(`<b>${cityName}</b>`)
      .openPopup();
  } else {
    map.setView([lat, lon], 10);
    marker.setLatLng([lat, lon])
      .setPopupContent(`<b>${cityName}</b>`)
      .openPopup();
  }

  setTimeout(() => map.invalidateSize(), 200);
}

// Mula aplikasi
initWeather();