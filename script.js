const apiKey = "ac324a808280e23b7458e9e2244c90a2";
const apiUrlCity = "https://api.openweathermap.org/data/2.5/weather?units=metric&q=";
const apiUrlCoords = "https://api.openweathermap.org/data/2.5/weather?units=metric&";

const searchBox = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const errorMsg = document.getElementById("errorMsg");
const weatherIcon = document.getElementById("weatherIcon");

// Fungsi kemas kini UI selepas terima data API
function updateUI(data) {
  document.getElementById("city").textContent = data.name;
  document.getElementById("temp").textContent = Math.round(data.main.temp) + "°C";
  document.getElementById("humidity").textContent = data.main.humidity + "%";
  document.getElementById("wind").textContent = data.wind.speed + " km/h";

  const iconCode = data.weather[0].icon;
  weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;

  errorMsg.style.display = "none";
}

// Carian mengikut nama bandar
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

// Carian mengikut koordinat GPS (Latitud & Longitud)
async function checkWeatherByCoords(lat, lon) {
  try {
    const response = await fetch(`${apiUrlCoords}lat=${lat}&lon=${lon}&appid=${apiKey}`);
    if (response.ok) {
      const data = await response.json();
      updateUI(data);
    } else {
      checkWeatherByCity("Kuala Lumpur"); // Fallback jika ralat API
    }
  } catch (err) {
    checkWeatherByCity("Kuala Lumpur");
  }
}

// Semak Kebenaran GPS Lokasi Pengguna
function initWeather() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // User izinkan akses lokasi (GPS)
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        checkWeatherByCoords(lat, lon);
      },
      (error) => {
        // User tolak (Deny) atau ralat GPS -> Guna default location
        checkWeatherByCity("Kuala Lumpur");
      }
    );
  } else {
    // Pelayar tidak menyokong Geolocation API -> Guna default location
    checkWeatherByCity("Kuala Lumpur");
  }
}

// Event Listeners
searchBtn.addEventListener("click", () => {
  checkWeatherByCity(searchBox.value);
});

searchBox.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    checkWeatherByCity(searchBox.value);
  }
});

// Jalankan semasa aplikasi dimuatkan
initWeather();

searchBox.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    checkWeather(searchBox.value);
  }
});