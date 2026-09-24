const mockFetchImage = jest.fn();
jest.mock('../../../src/lib/graphics/imageFetcher', () => ({ __esModule: true, default: (url: string) => mockFetchImage(url) }));

import { fetchVehicleImage } from "../../../src/packages/kelec-login/services/vehicleImages";

test('une image déjà téléchargée n\'est pas retéléchargée', async () => {
    mockFetchImage.mockResolvedValue('base64');
    expect(await fetchVehicleImage('https://x/car.png')).toBe('base64');
    expect(await fetchVehicleImage('https://x/car.png')).toBe('base64');
    expect(mockFetchImage).toHaveBeenCalledTimes(1);
});

test('un échec n\'est pas mis en cache', async () => {
    mockFetchImage.mockResolvedValueOnce(null).mockResolvedValueOnce('ok');
    expect(await fetchVehicleImage('https://x/other.png')).toBeNull();
    expect(await fetchVehicleImage('https://x/other.png')).toBe('ok');
});
