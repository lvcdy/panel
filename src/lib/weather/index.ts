import { FALLBACK_WEATHER_TEXT, LOADING_WEATHER_TEXT } from "./format";
import { fetchWeatherSummary } from "./api";

const WEATHER_ICON_BY_CODE: Record<string, string> = {
    "0": "fa-sun",
    "1": "fa-moon",
    "2": "fa-sun",
    "3": "fa-moon",
    "4": "fa-cloud",
    "5": "fa-cloud-sun",
    "6": "fa-cloud-moon",
    "7": "fa-cloud-sun",
    "8": "fa-cloud-moon",
    "9": "fa-cloud",
    "10": "fa-cloud-showers-heavy",
    "11": "fa-cloud-bolt",
    "12": "fa-cloud-bolt",
    "13": "fa-cloud-rain",
    "14": "fa-cloud-rain",
    "15": "fa-cloud-showers-heavy",
    "16": "fa-cloud-showers-heavy",
    "17": "fa-cloud-showers-heavy",
    "18": "fa-cloud-showers-heavy",
    "19": "fa-cloud-rain",
    "20": "fa-cloud-meatball",
    "21": "fa-snowflake",
    "22": "fa-snowflake",
    "23": "fa-snowflake",
    "24": "fa-snowflake",
    "25": "fa-snowflake",
    "26": "fa-smog",
    "27": "fa-smog",
    "28": "fa-smog",
    "29": "fa-smog",
    "30": "fa-smog",
    "31": "fa-smog",
    "32": "fa-wind",
    "33": "fa-wind",
    "34": "fa-wind",
    "35": "fa-wind",
    "36": "fa-wind",
    "37": "fa-temperature-low",
    "38": "fa-temperature-high",
};

const updateWeatherIcon = (weatherBoxEl: HTMLElement, code?: string) => {
    const iconEl = weatherBoxEl.querySelector<HTMLElement>(".capsule-icon");
    if (!iconEl) return;

    iconEl.className = `fas ${WEATHER_ICON_BY_CODE[code || ""] || "fa-cloud-sun"} capsule-icon`;
};

export const fetchWeatherInfo = async (
    weatherEl: HTMLElement | null,
    weatherBoxEl: HTMLElement | null,
) => {
    if (!weatherEl || !weatherBoxEl) return;

    weatherEl.textContent = LOADING_WEATHER_TEXT;

    try {
        const weather = await fetchWeatherSummary();
        weatherEl.textContent = weather.text;
        updateWeatherIcon(weatherBoxEl, weather.code);
    } catch (error) {
        console.debug("天气 API 请求失败:", error);
        weatherEl.textContent = FALLBACK_WEATHER_TEXT;
        updateWeatherIcon(weatherBoxEl);
    } finally {
        weatherBoxEl.style.opacity = "1";
        weatherBoxEl.style.filter = "blur(0px)";
    }
};

export const setupWeatherInfoHandler = (
    weatherEl: HTMLElement | null,
    weatherBoxEl: HTMLElement | null,
) => {
    if (!weatherEl || !weatherBoxEl) return;

    const refreshWeather = (event: Event) => {
        event.stopPropagation();
        void fetchWeatherInfo(weatherEl, weatherBoxEl);
    };

    const onKeydown = (event: KeyboardEvent) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            refreshWeather(event);
        }
    };

    weatherBoxEl.addEventListener("click", refreshWeather);
    weatherBoxEl.addEventListener("keydown", onKeydown);
};
