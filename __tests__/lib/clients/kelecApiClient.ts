jest.unmock('../../../src/lib/clients/kelec-api/kelecApiHandler');
import KelecApiHandler from "../../../src/lib/clients/kelec-api/kelecApiHandler";


const kelecApiClient = new KelecApiHandler();

describe('kelecApiClient', () => {
    it('should have message', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: jest.fn().mockResolvedValue({
                message: "This is a test message"
            })
        });

        const message = await kelecApiClient.getMessage("1.0.0", "en");
        expect(message).toBe("This is a test message");
    });

    it('should return null if fetch fails', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            status: 500,
        });

        const message = await kelecApiClient.getMessage("1.0.0", "en");
        expect(message).toBeNull();
    });

    it('should return null if response code is not 200', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            status: 400,
        });

        const message = await kelecApiClient.getMessage("1.0.0", "en");
        expect(message).toBeNull();
    });
});