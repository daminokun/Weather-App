

const apiKey = "ac324a808280e23b7458e9e2244c90a2";
const unsplashKey = "tGhfP7vJcCpyHlYhs1UHMpyZ5y5RyeGD6BOtJZn22q0"; // Access Key dari Unsplash Developers

const apiUrlCity = "https://api.openweathermap.org/data/2.5/weather?units=metric&q=";
const apiUrlCoords = "https://api.openweathermap.org/data/2.5/weather?units=metric&";

const searchBox = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const errorMsg = document.getElementById("errorMsg");
const weatherIcon = document.getElementById("weatherIcon");

// Fungsi Ambil Gambar Latar Belakang HD dari Unsplash API
async function fetchUnsplashBackground(cityName, weatherCondition) {
  const unsplashUrl = `https://api.unsplash.com/photos/random?query=${cityName},${weatherCondition}&orientation=landscape&client_id=${unsplashKey}`;

  try {
    const response = await fetch(unsplashUrl);
    if (response.ok) {
      const data = await response.json();
      // Gunakan URL gambar bersaiz HD (regular/full)
      document.body.style.backgroundImage = `url('${data.urls.regular}')`;
    } else {
      // Fallback sekiranya limit API tamat
      document.body.style.backgroundImage = `url('https://images.unsplash.com/photo-1516912481808-3406841bd33c?auto=format&fit=crop&w=1920&q=80')`;
    }
  } catch (err) {
    console.error("Ralat Unsplash API:", err);
  }
}

// Fungsi Kemas Kini UI
async function updateUI(data) {
  document.getElementById("city").textContent = data.name;
  document.getElementById("temp").textContent = Math.round(data.main.temp) + "°C";
  document.getElementById("humidity").textContent = data.main.humidity + "%";
  document.getElementById("wind").textContent = data.wind.speed + " km/h";

  // Ikon Cuaca
  const iconCode = data.weather[0].icon;
  weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;

  // Panggil Gambar Unsplash berasaskan Nama Bandar & Keadaan Cuaca
  const cityName = data.name;
  const weatherCondition = data.weather[0].main;
  await fetchUnsplashBackground(cityName, weatherCondition);

  errorMsg.style.display = "none";
}

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

searchBtn.addEventListener("click", () => {
  checkWeatherByCity(searchBox.value);
});

searchBox.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    checkWeatherByCity(searchBox.value);
  }
});

initWeather();