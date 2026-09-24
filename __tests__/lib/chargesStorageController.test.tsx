import AsyncStorage from "@react-native-async-storage/async-storage";
import ChargesRepository from "../../src/packages/kelec-charge-history/services/chargesRepository";
import Charge from "../../src/packages/kelec-charge-history/models/Charge";

beforeEach(async () => {
    await AsyncStorage.clear();
});

test('should retrieve 0 charges', async () => {
    const charges = await ChargesRepository.getCharges('vin');
    expect(charges).toEqual(null);
});

test('should get charges from older storage system', async () => {
    const charge = new Charge('start', 'end', 50, 0, 100, 60, 'OK');
    await AsyncStorage.setItem('vin/chargesHistorySaved', JSON.stringify([charge]));

    const charges = await ChargesRepository.getCharges('vin');
    expect(charges).toEqual([charge]);
});

test('should get charges from newer storage system', async () => {
    const charge = new Charge('start', 'end', 50, 0, 100, 60, 'OK');
    await AsyncStorage.setItem('vin/chargesHistoryAmount', '1');
    await AsyncStorage.setItem('vin/chargesHistoryIndex0', JSON.stringify([charge]));

    const charges = await ChargesRepository.getCharges('vin');
    expect(charges).toEqual([charge]);
});

test('should load from older system, then save through newer system', async () => {
    // first, save with older system 
    const charge = new Charge('start', 'end', 50, 0, 100, 60, 'OK');
    await AsyncStorage.setItem('vin/chargesHistorySaved', JSON.stringify([charge]));

    // now, get charges
    const charges = await ChargesRepository.getCharges('vin');
    expect(charges).toEqual([charge]);

    // now, save with newer system
    await ChargesRepository.saveNewCharges('vin', [charge]);
    const charges2 = await ChargesRepository.getCharges('vin');
    expect(charges2).toEqual([charge]);
    // make sure vin/chargesHistorySaved is removed
    const saved = await AsyncStorage.getItem('vin/chargesHistorySaved');
    expect(saved).toEqual(null);
});

test('charges should be spllitted in batches of 50', async () => {
    const charges = [];
    for (let i = 0; i < 75; i++) {
        const new_charge = new Charge(new Date(), 'end', i, 0, 100, 60, 'OK');
        charges.push(new_charge);
    }
    expect(charges.length).toEqual(75);
    await ChargesRepository.saveNewCharges('vin', charges);

    const storedCharges = await ChargesRepository.getCharges('vin');
    expect(storedCharges.length).toEqual(charges.length);

    // check if there are 2 batches
    const amount = await AsyncStorage.getItem('vin/chargesHistoryAmount');
    expect(amount).toEqual('75');
    const batch0 = await AsyncStorage.getItem('vin/chargesHistoryIndex0');
    const batch1 = await AsyncStorage.getItem('vin/chargesHistoryIndex1');
    expect(batch0).toEqual(JSON.stringify(charges.slice(0, 50)));
    expect(batch1).toEqual(JSON.stringify(charges.slice(50, 75)));
    // check if there are no more batches
    const batch2 = await AsyncStorage.getItem('vin/chargesHistoryIndex2');
    expect(batch2).toEqual(null);
    // check if there are no more charges
    const saved = await AsyncStorage.getItem('vin/chargesHistorySaved');
    expect(saved).toEqual(null);
});