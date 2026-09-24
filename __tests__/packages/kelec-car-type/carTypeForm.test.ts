import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import CarType from "../../../src/lib/clients/cars/carTypes/carType";
import { CarTypeRepository } from "../../../src/packages/kelec-garage";
import {
    EMPTY_CAR_TYPE_FORM, batteryOption, brandOption, carTypeFromForm, formFromCarType, formatBatteryLabel,
    isCarTypeFormValid, modelOption, supportsChargingLimit,
} from "../../../src/packages/kelec-car-type/models/carTypeForm";
import { useCarTypeForm } from "../../../src/packages/kelec-car-type/controllers/useCarTypeForm";

const brand = brandOption({ name: 'renault', display_name: 'Renault' } as any);
const megane = modelOption({ name: 'megane_e_tech', display_name: 'Mégane E-Tech', engine_type: 'ELECTRIC' } as any);
const other = modelOption({ name: 'zoe', display_name: 'Zoé', engine_type: 'ELECTRIC' } as any);
const battery = batteryOption({ size: 60, max_ac_power: 22, max_dc_power: 130 }, 0);
const complete = { ...EMPTY_CAR_TYPE_FORM, brand, model: megane, battery };

beforeEach(async () => {
    await AsyncStorage.clear();
});

test('libellé de batterie, avec la puissance DC seulement si elle existe', () => {
    expect(formatBatteryLabel({ size: 60, max_ac_power: 22, max_dc_power: 130 })).toBe('60 kWh / AC 22 kW / DC 130 kW');
    expect(formatBatteryLabel({ size: 22, max_ac_power: 7, max_dc_power: -1 })).toBe('22 kWh / AC 7 kW');
});

test('validité : marque, modèle, batterie, et contrat de leasing complet si leasing', () => {
    expect(isCarTypeFormValid(EMPTY_CAR_TYPE_FORM)).toBe(false);
    expect(isCarTypeFormValid(complete)).toBe(true);
    expect(isCarTypeFormValid({ ...complete, leasing: {} })).toBe(false);
    expect(isCarTypeFormValid({ ...complete, leasing: { startDate: new Date(), endDate: new Date(), totalMileage: 10000 } })).toBe(true);
});

test('limite de charge proposée seulement pour les modèles qui la gèrent', () => {
    expect(supportsChargingLimit(complete)).toBe(true);
    expect(supportsChargingLimit({ ...complete, model: other })).toBe(false);
    expect(supportsChargingLimit({ ...complete, battery: null })).toBe(false);
});

test('aller-retour formulaire → CarType → formulaire', () => {
    const form = { ...complete, chargingLimit: 80, supportsV2G: true };
    const carType: CarType = carTypeFromForm(form);
    expect(formFromCarType(carType)).toMatchObject({
        brand: { value: 'renault' }, model: { value: 'megane_e_tech' }, battery: { testID: battery.testID },
        chargingLimit: 80, supportsV2G: true,
    });
});

describe('useCarTypeForm', () => {
    test('changer de marque vide le modèle et la batterie ; changer de modèle vide la batterie', () => {
        const { result } = renderHook(() => useCarTypeForm('VIN'));
        act(() => { result.current.setBrand(brand); });
        act(() => { result.current.setModel(megane); });
        act(() => { result.current.setBattery(battery); });

        act(() => { result.current.setModel(other); });
        expect(result.current.form.battery).toBeNull();

        act(() => { result.current.setBrand(brand); });
        expect(result.current.form.model).toBeNull();
    });

    test('formulaire incomplet : rien n\'est enregistré et les erreurs s\'affichent', async () => {
        const { result } = renderHook(() => useCarTypeForm('VIN'));
        let saved = true;
        await act(async () => { saved = await result.current.submit(); });

        expect(saved).toBe(false);
        expect(result.current.showErrors).toBe(true);
        expect(await CarTypeRepository.get('VIN')).toBeNull();
    });

    test('pré-rempli avec le modèle enregistré, puis enregistré à la validation', async () => {
        await CarTypeRepository.save('VIN', carTypeFromForm(complete));
        const { result } = renderHook(() => useCarTypeForm('VIN'));
        await waitFor(() => expect(result.current.form.model?.value).toBe('megane_e_tech'));

        act(() => { result.current.setSupportsV2G(true); });
        let saved = false;
        await act(async () => { saved = await result.current.submit(); });

        expect(saved).toBe(true);
        expect((await CarTypeRepository.get('VIN'))?.getSupportsV2G()).toBe(true);
    });
});
