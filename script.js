// Konfigurasi API Key
const apiKey = "ac324a808280e23b7458e9e2244c90a2";
const unsplashKey = "tGhfP7vJcCpyHlYhs1UHMpyZ5y5RyeGD6BOtJZn22q0"; // Access Key dari Unsplash Developers

// URL Endpoints
const apiUrlCity = "https://api.openweathermap.org/data/2.5/weather?units=metric&q=";
const apiUrlCoords = "https://api.openweathermap.org/data/2.5/weather?units=metric&";
const geoApiUrl = "https://api.openweathermap.org/geo/1.0/direct?limit=5&q=";

// Elemen DOM
const searchBox = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const errorMsg = document.getElementById("errorMsg");
const weatherIcon = document.getElementById("weatherIcon");
const suggestionsBox = document.getElementById("suggestions");

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

// 2. Kemas Kini Tampilan UI
async function updateUI(data) {
  document.getElementById("city").textContent = data.name;
  document.getElementById("temp").textContent = Math.round(data.main.temp) + "°C";
  document.getElementById("humidity").textContent = data.main.humidity + "%";
  document.getElementById("wind").textContent = data.wind.speed + " km/h";

  // Kemas kini Ikon Cuaca
  const iconCode = data.weather[0].icon;
  weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;

  // Kemas kini Latar Belakang Unsplash
  const cityName = data.name;
  const weatherCondition = data.weather[0].main;
  await fetchUnsplashBackground(cityName, weatherCondition);

  // TERKINI: Kemas kini kedudukan Minimap
  updateMap(data.coord.lat, data.coord.lon, data.name);

  errorMsg.style.display = "none";
}

// 3. Semak Cuaca Mengikut Nama Bandar
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

// 4. Semak Cuaca Mengikut Koordinat GPS (Geolocation)
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

// 5. Autocomplete: Ambil Cadangan Lokasi Dari Geocoding API
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

// 6. Autocomplete: Paparkan Cadangan Lokasi Dalam Senarai (Guna Koordinat GPS)
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
      // TERKINI: Guna koordinat terus untuk elak isu salah bandar
      checkWeatherByCoords(city.lat, city.lon);
    });

    suggestionsBox.appendChild(div);
  });

  suggestionsBox.style.display = "block";
}

// 7. Pengendali Kebenaran GPS Lokasi (Mula-mula Buka Web)
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

// 8. Event Listeners
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

// 9. Fungsi Kemas Kini / Inisialisasi Minimap
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

  // Petua Leaflet: Refresh saiz peta supaya tidak render senget/potong
  setTimeout(() => map.invalidateSize(), 200);
}

// Jalankan aplikasi semasa halaman dimuatkan
initWeather();