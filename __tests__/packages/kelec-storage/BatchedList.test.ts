import AsyncStorage from "@react-native-async-storage/async-storage";
import BatchedList from "../../../src/packages/kelec-storage/BatchedList";

const list = new BatchedList<number>({ name: 'items', batchSize: 2, legacyKey: 'itemsLegacy' });

beforeEach(async () => {
    await AsyncStorage.clear();
});

test('renvoie null si la liste n\'a jamais été enregistrée', async () => {
    expect(await list.read('vin')).toBeNull();
});

test('écrit par lots et relit la liste complète', async () => {
    await list.write('vin', [1, 2, 3, 4, 5]);

    expect(await AsyncStorage.getItem('vin/itemsAmount')).toBe('5');
    expect(await AsyncStorage.getItem('vin/itemsIndex0')).toBe('[1,2]');
    expect(await AsyncStorage.getItem('vin/itemsIndex2')).toBe('[5]');
    expect(await list.read('vin')).toEqual([1, 2, 3, 4, 5]);
    expect(await list.read('other')).toBeNull();
});

test('lit l\'ancien format puis le supprime à la première écriture', async () => {
    await AsyncStorage.setItem('vin/itemsLegacy', '[7,8]');
    expect(await list.read('vin')).toEqual([7, 8]);

    await list.write('vin', [7, 8, 9]);
    expect(await AsyncStorage.getItem('vin/itemsLegacy')).toBeNull();
    expect(await list.read('vin')).toEqual([7, 8, 9]);
});
