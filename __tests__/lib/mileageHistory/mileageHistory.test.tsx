import AsyncStorage from "@react-native-async-storage/async-storage";
import Charge from "../../../src/packages/kelec-charge-history/models/Charge";
import ChargesRepository from "../../../src/packages/kelec-charge-history/services/chargesRepository";

import * as sharedPlatformsData from '../../../src/lib/storage/sharedPlatformsData';
import { mergeCharges } from "../../../src/packages/kelec-charge-history/services/chargeMonths";
const mockGetMileageHistory = jest.fn();
jest.spyOn(sharedPlatformsData, 'getMileageHistory').mockImplementation(mockGetMileageHistory);

beforeEach(async () => {
    await AsyncStorage.clear();
});

test('should not retrieve any mileage history', async () => {
    const charge1 = new Charge('2023-01-01T00:00:00Z', '2023-01-01T01:00:00Z', 50, 0, 100, 60, 'OK');
    const charge2 = new Charge('2023-01-02T00:00:00Z', '2023-01-02T01:00:00Z', 60, 0, 120, 70, 'OK');
    await ChargesRepository.saveNewCharges('vin', [charge1, charge2]);

    const charges = await ChargesRepository.getCharges('vin');
    expect(charges).toEqual([charge1, charge2]);
});


test('should retrieve mileage history with all parameters', async () => {
    // save mock mileage history
    const mileageHistory: sharedPlatformsData.MileageLog[] = [
        {
            timestamp: '2023-01-01T01:00:00Z',
            mileage: 1000
        },
        {
            timestamp: '2023-01-02T01:00:00Z',
            mileage: 1100
        },
        {
            timestamp: '2023-01-03T01:00:00Z',
            mileage: 1200
        },
        {
            timestamp: '2023-01-04T01:00:00Z',
            mileage: 1200
        },
        {
            timestamp: '2023-01-05T01:00:00Z',
            mileage: 1300
        }
    ]
    mockGetMileageHistory.mockResolvedValue(mileageHistory);

    const charge1 = new Charge('2023-01-01T00:00:00Z', '2023-01-01T01:00:00Z', 50, 0, 100, 60, 'OK');
    const charge2 = new Charge('2023-01-02T00:00:00Z', '2023-01-02T01:00:00Z', 60, 0, 120, 70, 'OK');
    const charge3 = new Charge('2023-01-04T00:00:00Z', '2023-01-04T00:40:00Z', 60, 0, 120, 70, 'OK');
    const charge4 = new Charge('2023-01-05T00:00:00Z', '2023-01-05T00:40:00Z', 60, 0, 120, 70, 'OK');
    const charge5 = new Charge('2023-01-02T02:00:00Z', '2023-01-02T00:40:00Z', 60, 0, 120, 70, 'OK', undefined, undefined, 1234, false);
    const charge6 = new Charge('2023-01-10T00:00:00Z', '2023-01-10T00:40:00Z', 60, 0, 120, 70, 'OK');
    await ChargesRepository.saveNewCharges('vin', [charge1, charge2, charge3, charge4, charge5, charge6]);

    const charges = await ChargesRepository.getCharges('vin');

    // the first charge start is before the first mileage log, so it should not have a mileage at start
    expect(charges![0].mileageAtStart).toBeUndefined();

    // the second charge start is after the first mileage log, so it should have a mileage at start
    expect(charges![1].mileageAtStart).toEqual(1100);
    expect(charges![1].getIsInaccurateMileage()).toEqual(false);

    // the third charge is inaccurate but previous mileage log is the same as the current one
    expect(charges![3].mileageAtStart).toEqual(1200);
    expect(charges![3].getIsInaccurateMileage()).toEqual(false);

    // the fourth charge is inaccurate as the mileage log is after the end of the charge
    expect(charges![4].mileageAtStart).toEqual(1300);
    expect(charges![4].getIsInaccurateMileage()).toEqual(true);

    // the fifth charge should have not an updated mileage
    expect(charges![2].mileageAtStart).toEqual(1234);

    // the last charge should not have a mileage history are there are no record after the chard
    expect(charges![5].mileageAtStart).toBeUndefined();


});


describe('should merge charges', () => {
    test('merge charges with two accurate mileage', async () => {
        const charge1 = new Charge('2023-01-01T00:00:00Z', '2023-01-01T01:00:00Z', 50, 0, 60, 60, 'OK');
        const charge2 = new Charge('2023-01-02T00:00:00Z', '2023-01-02T01:00:00Z', 60, 60, 80, 70, 'OK');
        await ChargesRepository.saveNewCharges('vin', [charge1, charge2]);

        const charges = await ChargesRepository.getCharges('vin');
        const mergedCharges = mergeCharges(charges!);
        expect(mergedCharges).toHaveLength(1);
        expect(mergedCharges[0].getIsInaccurateMileage()).toEqual(false);
    });

    test('merge charges with two accurate mileage', async () => {
        const charge1 = new Charge('2023-01-01T00:00:00Z', '2023-01-01T01:00:00Z', 50, 0, 60, 60, 'OK', undefined, undefined, 1234, true);
        const charge2 = new Charge('2023-01-02T00:00:00Z', '2023-01-02T01:00:00Z', 60, 60, 80, 70, 'OK', undefined, undefined, 1234, true);
        await ChargesRepository.saveNewCharges('vin', [charge1, charge2]);

        const charges = await ChargesRepository.getCharges('vin');
        const mergedCharges = mergeCharges(charges!);
        expect(mergedCharges).toHaveLength(1);
        expect(mergedCharges[0].getIsInaccurateMileage()).toEqual(true);
    });

    test('merge charges with one accurate and one inaccurate mileage', async () => {
        const charge1 = new Charge('2023-01-01T00:00:00Z', '2023-01-01T01:00:00Z', 50, 0, 60, 60, 'OK', undefined, undefined, 1234, false);
        const charge2 = new Charge('2023-01-02T00:00:00Z', '2023-01-02T01:00:00Z', 60, 60, 80, 70, 'OK', undefined, undefined, 1234, true);
        await ChargesRepository.saveNewCharges('vin', [charge1, charge2]);

        const charges = await ChargesRepository.getCharges('vin');
        const mergedCharges = mergeCharges(charges!);
        expect(mergedCharges).toHaveLength(1);
        expect(mergedCharges[0].getIsInaccurateMileage()).toEqual(false);
    }
    )
});