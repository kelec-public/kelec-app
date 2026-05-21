import Config from "react-native-config";

type WeatherResponse = {
    location: {
        name: string;
        region: string;
        country: string;
        lat: number;
        lon: number;
        tz_id: string;
        localtime_epoch: number;
        localtime: string;
    },
    current?: {
        last_updated_epoch: number;
        last_updated: string;
        temp_c?: number;
        temp_f: number;
        is_day: number;
        condition?: {
            text?: string;
            icon?: string;
            code: number;
        }
    }
}

interface WeatherClientInterface {
    getWeather: (latitude: number, longitude: number) => Promise<WeatherResponse>;
}

export class WeatherClient implements WeatherClientInterface {
    private static readonly API_URL: string = "https://api.weatherapi.com/v1";
    private static readonly API_KEY: string = Config.WEATHER_API_KEY ?? '';

    public readonly getWeather = async (latitude: number, longitude: number): Promise<WeatherResponse> => {
        const response = await fetch(`${WeatherClient.API_URL}/current.json?key=${WeatherClient.API_KEY}&q=${latitude},${longitude}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    };
};

interface WeatherApiHandlerInterface {
    getTemperatureC: () => number | null;
    getWeatherIcon: () => string | null;
};

export class WeatherApiHandler implements WeatherApiHandlerInterface {
    private readonly weatherResponse: WeatherResponse;

    public temperatureC: number | null = null;
    public weatherIcon: string | null = null;

    constructor(private readonly _weatherResponse: WeatherResponse) {
        this.weatherResponse = _weatherResponse;
        this.initTemperatureC();
        this.initWeatherIcon();

    }

    initTemperatureC = (): void => {
        this.temperatureC = this.weatherResponse.current?.temp_c ?? null;
    }

    initWeatherIcon = (): void => {
        if (this.weatherResponse.current?.condition?.icon) {
            this.weatherIcon = `https:${this.weatherResponse.current.condition.icon}`;
        } else {
            this.weatherIcon = null;
        }
    }

    getTemperatureC = (): number | null => {
        return this.temperatureC;
    }

    getWeatherIcon = (): string | null => {
        return this.weatherIcon;
    }

}