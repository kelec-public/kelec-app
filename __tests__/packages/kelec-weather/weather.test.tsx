import { render, screen } from "@testing-library/react-native";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { WeatherState } from "../../../src/packages/kelec-weather";
import { WeatherBadge } from "../../../src/packages/kelec-weather";
import { weatherFromResponse } from "../../../src/packages/kelec-weather/models/Weather";
import { WeatherResponse } from "../../../src/packages/kelec-weather/types/weatherApi";

const response = (current?: WeatherResponse['current']): WeatherResponse => ({
    location: { name: '', region: '', country: '', lat: 0, lon: 0, tz_id: '', localtime_epoch: 0, localtime: '' },
    current,
});

test('weatherFromResponse : température et URL complète de l\'icône', () => {
    expect(weatherFromResponse(response({
        last_updated_epoch: 0, last_updated: '', temp_c: 18.5, temp_f: 65, is_day: 1,
        condition: { icon: '//cdn.weatherapi.com/sun.png', code: 1000 },
    }))).toEqual({ temperatureC: 18.5, iconUrl: 'https://cdn.weatherapi.com/sun.png' });

    expect(weatherFromResponse(response())).toEqual({ temperatureC: null, iconUrl: null });
});

const renderBadge = (state: WeatherState) =>
    render(<ThemeProvider value={DefaultTheme}><WeatherBadge state={state} /></ThemeProvider>);

describe('WeatherBadge : un seul état affiché à la fois', () => {
    test('chargement : pas de température', () => {
        renderBadge({ status: 'loading' });
        expect(screen.queryByText(/°/)).toBeNull();
    });

    test('erreur : pas de température', () => {
        renderBadge({ status: 'error' });
        expect(screen.queryByText(/°/)).toBeNull();
    });

    test('chargé : température affichée', () => {
        renderBadge({ status: 'loaded', weather: { temperatureC: 12, iconUrl: 'https://x/icon.png' } });
        expect(screen.getByText('12°')).toBeDefined();
    });
});
