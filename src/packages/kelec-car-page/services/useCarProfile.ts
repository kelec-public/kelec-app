import { useCallback, useContext, useEffect, useState } from "react";
import CarModel from "../../../lib/clients/cars/carModel";
import MainContext from "../../../lib/Contexts/MainContext";
import CarType from "../../../lib/clients/cars/carTypes/carType";
import AsyncStorage from "@react-native-async-storage/async-storage";

const EMPTY_CAR_TYPE = new CarType({
    brand: { name: '', display_name: '' },
    model: { name: '', display_name: '', engine_type: '' },
    battery: { size: 0, max_ac_power: 0, max_dc_power: -1 },
    chargingLimit: 0,
});

export function useCarProfile(carModel: CarModel) {
    const { storageHandler } = useContext(MainContext);
    const [image, setImage] = useState<string>('');
    const [carType, setCarType] = useState<CarType>(EMPTY_CAR_TYPE);

    const reload = useCallback(async () => {
        const vin = carModel.getVin();

        const [storedImage, storedCarType] = await Promise.all([
            AsyncStorage.getItem(`${vin}/image`),
            storageHandler.getCarType(vin),
        ]);

        if (storedImage) setImage(storedImage);
        if (storedCarType) setCarType(storedCarType);
    }, [carModel, storageHandler]);

    useEffect(() => {
        reload();
    }, [reload]);

    return { image, carType, reload };
}