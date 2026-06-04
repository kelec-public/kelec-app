jest.unmock('../../../src/lib/clients/kelec-api/kelecApiHandler');
import KelecApiHandler from "../../../src/lib/clients/kelec-api/kelecApiHandler";

it('should be init KelecApiHandler', () => {
    const kelecApiHandler = new KelecApiHandler();
    expect(kelecApiHandler).toBeDefined();
});

describe('get brands', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should get brands', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                brands: [
                    { display_name: 'brand1', name: 'brand1' },
                    { display_name: 'brand2', name: 'brand2' }
                ]
            }),
            status: 200
        })

        const brands = await new KelecApiHandler().getBrands();
        expect(brands).toEqual([
            { display_name: 'brand1', name: 'brand1' },
            { display_name: 'brand2', name: 'brand2' }
        ]);
    });

    it('should not get brands', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({}),
            status: 500
        })
        await expect(new KelecApiHandler().getBrands()).rejects.toThrow('Failed to fetch brands');
    });
});

describe('get models', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should get models', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                models: [
                    { display_name: 'def', name: 'model1', engine_type: 'engine1' },
                    { display_name: 'abc', name: 'model2', engine_type: 'engine2' }
                ]
            }),
            status: 200
        })

        const models = await new KelecApiHandler().getModels('brand1');
        expect(models).toEqual([
            { display_name: 'abc', name: 'model2', engine_type: 'engine2' },
            { display_name: 'def', name: 'model1', engine_type: 'engine1' }
        ]);
    });

    it('should not get models', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({}),
            status: 500
        })
        await expect(new KelecApiHandler().getModels('brand1')).rejects.toThrow('Failed to fetch models');
    });
});

describe('get batteries', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should get batteries', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                batteries: [
                    { size: 2, max_ac_power: 1, max_dc_power: 1 },
                    { size: 1, max_ac_power: 2, max_dc_power: 2 }
                ]
            }),
            status: 200
        })

        const batteries = await new KelecApiHandler().getBatteries('brand1', 'model1');
        expect(batteries).toEqual([
            { size: 1, max_ac_power: 2, max_dc_power: 2 },
            { size: 2, max_ac_power: 1, max_dc_power: 1 }
        ]);
    });

    it('should not get batteries', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({}),
            status: 500
        })
        await expect(new KelecApiHandler().getBatteries('brand1', 'model1')).rejects.toThrow('Failed to fetch batteries');

    });
});