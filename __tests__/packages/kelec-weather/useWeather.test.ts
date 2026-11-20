import AsyncStorage from "@react-native-async-storage/async-storage";
import { renderHook, waitFor } from "@testing-library/react-native";
import { useWeather } from "../../../src/packages/kelec-weather";

const okResponse = (tempC: number) => ({
    ok: true,
    json: async () => ({
        location: {},
        current: { temp_c: tempC, condition: { icon: '//cdn.weatherapi.com/sun.png', code: 1000 } },
    }),
});

let fetchMock: jest.Mock;

beforeEach(async () => {
    await AsyncStorage.clear();
    fetchMock = jest.fn();
    global.fetch = fetchMock;
});

afterEach(() => {
    jest.restoreAllMocks();
});

test('aucun appel sans position', async () => {
    const { result } = renderHook(() => useWeather(null));

    expect(result.current).toEqual({ status: 'loading' });
    expect(fetchMock).not.toHaveBeenCalled();
});

test('charge la météo à la position donnée', async () => {
    fetchMock.mockResolvedValueOnce(okResponse(18));
    const { result } = renderHook(() => useWeather({ latitude: 44.1, longitude: 4.09 }));

    await waitFor(() => expect(result.current).toEqual({
        status: 'loaded',
        weather: { temperatureC: 18, iconUrl: 'https://cdn.weatherapi.com/sun.png' },
    }));
    expect(fetchMock.mock.calls[0][0]).toContain('q=44.1,4.09');
});

test('erreur si l\'API répond en erreur', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 403 });
    const { result } = renderHook(() => useWeather({ latitude: 1, longitude: 2 }));

    await waitFor(() => expect(result.current).toEqual({ status: 'error' }));
});

test('erreur si le réseau échoue', async () => {
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => useWeather({ latitude: 1, longitude: 2 }));

    await waitFor(() => expect(result.current).toEqual({ status: 'error' }));
});

test('recharge quand la position change', async () => {
    fetchMock.mockResolvedValueOnce(okResponse(10)).mockResolvedValueOnce(okResponse(20));
    const { result, rerender } = renderHook(
        (position: { latitude: number; longitude: number }) => useWeather(position),
        { initialProps: { latitude: 1, longitude: 2 } },
    );
    await waitFor(() => expect(result.current).toMatchObject({ status: 'loaded', weather: { temperatureC: 10 } }));

    rerender({ latitude: 3, longitude: 4 });

    await waitFor(() => expect(result.current).toMatchObject({ status: 'loaded', weather: { temperatureC: 20 } }));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toContain('q=3,4');
});

describe('cache', () => {
    const loadAt = async (position: { latitude: number; longitude: number }) => {
        const { result, unmount } = renderHook(() => useWeather(position));
        await waitFor(() => expect(result.current.status).toBe('loaded'));
        const state = result.current;
        unmount();
        return state;
    };

    test('réutilise la météo à la même position sans rappeler l\'API', async () => {
        fetchMock.mockResolvedValueOnce(okResponse(18));

        await loadAt({ latitude: 44.1, longitude: 4.09 });
        const second = await loadAt({ latitude: 44.1, longitude: 4.09 });

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(second).toMatchObject({ weather: { temperatureC: 18 } });
    });

    test('une position à quelques mètres utilise le même cache', async () => {
        fetchMock.mockResolvedValueOnce(okResponse(18));

        await loadAt({ latitude: 44.1001, longitude: 4.0902 });
        await loadAt({ latitude: 44.1003, longitude: 4.0899 });

        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    test('rappelle l\'API après 30 min', async () => {
        fetchMock.mockResolvedValueOnce(okResponse(10)).mockResolvedValueOnce(okResponse(20));
        const now = jest.spyOn(Date, 'now').mockReturnValue(1_000_000);

        await loadAt({ latitude: 1, longitude: 2 });
        now.mockReturnValue(1_000_000 + 29 * 60 * 1000);
        await loadAt({ latitude: 1, longitude: 2 });
        expect(fetchMock).toHaveBeenCalledTimes(1);

        now.mockReturnValue(1_000_000 + 31 * 60 * 1000);
        const state = await loadAt({ latitude: 1, longitude: 2 });

        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(state).toMatchObject({ weather: { temperatureC: 20 } });
    });

    test('une erreur n\'est pas mise en cache', async () => {
        fetchMock.mockResolvedValueOnce({ ok: false, status: 429 }).mockResolvedValueOnce(okResponse(12));
        const { result, unmount } = renderHook(() => useWeather({ latitude: 1, longitude: 2 }));
        await waitFor(() => expect(result.current).toEqual({ status: 'error' }));
        unmount();

        const state = await loadAt({ latitude: 1, longitude: 2 });

        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(state).toMatchObject({ weather: { temperatureC: 12 } });
    });

    test('un cache illisible déclenche un appel à l\'API', async () => {
        await AsyncStorage.setItem('weatherCache', '{pas du json');
        fetchMock.mockResolvedValueOnce(okResponse(15));

        const state = await loadAt({ latitude: 1, longitude: 2 });

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(state).toMatchObject({ weather: { temperatureC: 15 } });
    });
});
