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

beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock;
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
