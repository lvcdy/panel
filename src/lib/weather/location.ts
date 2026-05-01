import { WEATHER_DEFAULT_LABEL, WEATHER_DEFAULT_LOCATION } from "../config";
import type { WeatherPlace } from "./types";

export const getBrowserLocation = async (): Promise<WeatherPlace> => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
        return {
            location: WEATHER_DEFAULT_LOCATION,
            label: WEATHER_DEFAULT_LABEL,
        };
    }

    return await new Promise<WeatherPlace>((resolve) => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                resolve({
                    location: `${latitude.toFixed(2)}:${longitude.toFixed(2)}`,
                    label: "当前位置",
                });
            },
            () => {
                resolve({
                    location: WEATHER_DEFAULT_LOCATION,
                    label: WEATHER_DEFAULT_LABEL,
                });
            },
            {
                enableHighAccuracy: false,
                timeout: 8000,
                maximumAge: 300000,
            },
        );
    });
};