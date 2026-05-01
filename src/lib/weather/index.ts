import { FALLBACK_WEATHER_TEXT, LOADING_WEATHER_TEXT } from "./format";
import { fetchWeatherText } from "./api";

export const fetchWeatherInfo = async (
    weatherEl: HTMLElement | null,
    weatherBoxEl: HTMLElement | null,
) => {
    if (!weatherEl || !weatherBoxEl) return;

    weatherEl.textContent = LOADING_WEATHER_TEXT;

    try {
        weatherEl.textContent = await fetchWeatherText();
    } catch (error) {
        console.warn("天气 API 请求失败:", error);
        weatherEl.textContent = FALLBACK_WEATHER_TEXT;
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