export interface WeatherApiResponse {
    readonly results?: readonly WeatherResult[];
}

export interface WeatherResult {
    readonly location?: {
        readonly name?: string;
        readonly path?: string;
        readonly id?: string;
        readonly country?: string;
    };
    readonly now?: {
        readonly text?: string;
        readonly code?: string;
        readonly temperature?: string;
        readonly feels_like?: string;
        readonly humidity?: string;
        readonly wind_direction?: string;
        readonly wind_speed?: string;
    };
    readonly last_update?: string;
}

export interface WeatherPlace {
    readonly location: string;
    readonly label: string;
}