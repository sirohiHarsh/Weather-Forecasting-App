const apiKey = "698ae1a11b1db95cad73cc94b68abecd"; // Using the key you provided
const apiBase = "https://api.openweathermap.org/data/2.5/";

// DOM Elements
const searchBtn = document.getElementById("searchBtn");
const cityInput = document.getElementById("cityInput");
const weatherContent = document.getElementById("weatherContent");
const errorMessage = document.getElementById("errorMessage");
const loader = document.getElementById("loader");
const emptyState = document.getElementById("emptyState");
const body = document.body;

// Initialize Feather Icons
feather.replace();

// Event Listeners
searchBtn.addEventListener("click", () => handleSearch());
cityInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleSearch();
});

async function handleSearch() {
    const city = cityInput.value.trim();
    if (!city) return;

    // UI Reset
    weatherContent.classList.add("hidden");
    errorMessage.classList.add("hidden");
    emptyState.classList.add("hidden");
    loader.classList.remove("hidden");

    try {
        // 1. Get Current Weather
        const weatherRes = await fetch(`${apiBase}weather?q=${city}&units=metric&appid=${apiKey}`);
        if (!weatherRes.ok) throw new Error("City not found");
        const weatherData = await weatherRes.json();

        // 2. Get Forecast (requires coordinates from first call)
        const { lat, lon } = weatherData.coord;
        const forecastRes = await fetch(`${apiBase}forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`);
        const forecastData = await forecastRes.json();

        // Update UI
        updateCurrentWeather(weatherData);
        updateForecast(forecastData.list);
        updateBackground(weatherData.weather[0].main);

        loader.classList.add("hidden");
        weatherContent.classList.remove("hidden");
        
    } catch (error) {
        loader.classList.add("hidden");
        errorMessage.classList.remove("hidden");
        console.error(error);
    }
}

function updateCurrentWeather(data) {
    // Basic Info
    document.getElementById("cityName").innerText = `${data.name}, ${data.sys.country}`;
    
    // Date Format
    const date = new Date();
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    document.getElementById("currentDate").innerText = date.toLocaleDateString('en-US', options);

    // Weather Data
    document.getElementById("temperature").innerText = Math.round(data.main.temp);
    document.getElementById("weatherDesc").innerText = data.weather[0].description;
    document.getElementById("feelsLike").innerText = Math.round(data.main.feels_like);
    
    // Details
    document.getElementById("humidity").innerText = `${data.main.humidity}%`;
    document.getElementById("windSpeed").innerText = `${data.wind.speed} km/h`;
    document.getElementById("visibility").innerText = `${(data.visibility / 1000).toFixed(1)} km`;
    document.getElementById("pressure").innerText = `${data.main.pressure} hPa`;

    // Icon (Using OpenWeatherMap icons)
    const iconCode = data.weather[0].icon;
    document.getElementById("mainIcon").src = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
}

function updateForecast(list) {
    const forecastGrid = document.getElementById("forecastGrid");
    forecastGrid.innerHTML = ""; // Clear previous

    // Filter list to get one reading per day (e.g., at 12:00 PM)
    // The API returns data every 3 hours.
    const dailyData = list.filter(item => item.dt_txt.includes("12:00:00"));

    // If we don't have 5 days yet (due to time of day), take the first 5 entries 
    // spaced out by 8 indices (24 hours approx)
    const displayData = dailyData.length >= 5 ? dailyData.slice(0, 5) : dailyData;

    displayData.forEach((day, index) => {
        const date = new Date(day.dt * 1000);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const iconCode = day.weather[0].icon;

        const card = document.createElement("div");
        card.className = "forecast-card";
        // Staggered animation delay
        card.style.animation = `fadeIn 0.5s ease forwards ${index * 0.1}s`;
        
        card.innerHTML = `
            <p class="forecast-day">${dayName}</p>
            <img src="https://openweathermap.org/img/wn/${iconCode}.png" alt="icon" class="forecast-icon">
            <p class="forecast-temps">
                ${Math.round(day.main.temp_max)}°
                <span>${Math.round(day.main.temp_min)}°</span>
            </p>
        `;
        forecastGrid.appendChild(card);
    });
}

function updateBackground(condition) {
    body.className = ""; // Reset classes
    
    const conditionLower = condition.toLowerCase();
    
    if (conditionLower.includes("clear")) {
        body.classList.add("clear-bg");
    } else if (conditionLower.includes("cloud")) {
        body.classList.add("clouds-bg");
    } else if (conditionLower.includes("rain") || conditionLower.includes("drizzle")) {
        body.classList.add("rain-bg");
    } else if (conditionLower.includes("snow")) {
        body.classList.add("rain-bg"); // Reuse dark theme for snow
    } else if (conditionLower.includes("thunder")) {
        body.classList.add("rain-bg");
    } else {
        body.classList.add("default-bg");
    }
}