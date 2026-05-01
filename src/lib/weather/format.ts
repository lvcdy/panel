import { WEATHER_DEFAULT_LABEL } from "../config";
import type { WeatherResult } from "./types";

export const FALLBACK_WEATHER_TEXT = `${WEATHER_DEFAULT_LABEL} · 天气暂不可用`;
export const LOADING_WEATHER_TEXT = "正在同步天气数据...";

export const buildWeatherRequestUrl = (baseUrl: string, key: string, location: string) => {
    const requestUrl = new URL(baseUrl);
    requestUrl.searchParams.set("key", key);
    requestUrl.searchParams.set("location", location);
    requestUrl.searchParams.set("language", "zh-Hans");
    requestUrl.searchParams.set("unit", "c");
    return requestUrl;
};

const formatLocationHierarchy = (locationName?: string) => {
    if (!locationName) return "";

    const segments = locationName
        .split(/[,，]/)
        .map((segment) => segment.trim())
        .filter(Boolean);

    if (segments.length === 0) return locationName.trim();

    const dedupedSegments: string[] = [];
    for (const segment of segments) {
        if (dedupedSegments[dedupedSegments.length - 1] === segment) {
            continue;
        }
        dedupedSegments.push(segment);
    }

    return dedupedSegments.reverse().slice(0, 3).join(" · ");
};

export const formatWeatherSummary = (result: WeatherResult, sourceLabel: string) => {
    const locationName = formatLocationHierarchy(
        result.location?.path || result.location?.name || sourceLabel,
    );
    const now = result.now;

    if (!now) {
        return FALLBACK_WEATHER_TEXT;
    }

    const parts = [
        locationName,
        now.text,
        now.temperature ? `${now.temperature}°C` : "",
        now.feels_like ? `体感 ${now.feels_like}°C` : "",
        now.wind_direction ? `${now.wind_direction}风` : "",
        now.humidity ? `湿度 ${now.humidity}%` : "",
    ].filter(Boolean);

    return parts.join(" · ") || FALLBACK_WEATHER_TEXT;
};