import { WEATHER_API_KEY, WEATHER_API_URL } from "../config";
import { buildWeatherRequestUrl, FALLBACK_WEATHER_TEXT } from "./format";
import { getBrowserLocation } from "./location";
import type { WeatherApiResponse } from "./types";
import { formatWeatherSummary } from "./format";

export const fetchWeatherText = async () => {
    const { location, label } = await getBrowserLocation();
    const res = await fetch(buildWeatherRequestUrl(WEATHER_API_URL, WEATHER_API_KEY, location).toString(), {
        cache: "no-store",
        signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
    }

    const data = (await res.json()) as WeatherApiResponse;
    const result = data.results?.[0];
    return result ? formatWeatherSummary(result, label) : FALLBACK_WEATHER_TEXT;
};