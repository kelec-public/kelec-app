import { useCallback, useEffect, useState } from "react";
import CarModel from "../../../lib/clients/cars/carModel";
import CarType from "../../../lib/clients/cars/carTypes/carType";
import { CarImageRepository, CarTypeRepository } from "../../kelec-garage";

const EMPTY_CAR_TYPE = new CarType({
    brand: { name: '', display_name: '' },
    model: { name: '', display_name: '', engine_type: '' },
    battery: { size: 0, max_ac_power: 0, max_dc_power: -1 },
    chargingLimit: 0,
});

export function useCarProfile(carModel: CarModel) {
    const [image, setImage] = useState<string>('');
    const [carType, setCarType] = useState<CarType>(EMPTY_CAR_TYPE);

    const reload = useCallback(async () => {
        const vin = carModel.getVin();

        const [storedImage, storedCarType] = await Promise.all([
            CarImageRepository.get(vin),
            CarTypeRepository.get(vin),
        ]);

        if (storedImage) setImage(storedImage);
        if (storedCarType) setCarType(storedCarType);
    }, [carModel]);

    useEffect(() => {
        reload();
    }, [reload]);

    return { image, carType, reload };
}