import { useContext, useState } from "react";
import MainContext from "../../../lib/Contexts/MainContext";
import Account, { CarMaker } from "../../../lib/clients/accounts/account";
import CarModel from "../../../lib/clients/cars/carModel";
import { CarImageRepository, GarageService } from "../../kelec-garage";
import { fetchVehicleImage } from "../services/vehicleImages";

/** Parcours d'ajout d'une voiture : constructeur → compte → voiture → (modèle) → ajout au garage. */
export function useAddCarFlow() {
    const { currentUser, reloadUser } = useContext(MainContext);

    const [carMaker, setCarMaker] = useState<CarMaker | undefined>(undefined);
    const [account, setAccount] = useState<Account | undefined>(undefined);
    const [selectedCar, setSelectedCar] = useState<CarModel | undefined>(undefined);

    /** Dernière étape : enregistre l'image de la voiture choisie, l'ajoute au compte, puis recharge l'utilisateur. */
    const confirm = async () => {
        if (!account || !selectedCar) return;

        const image = await fetchVehicleImage(selectedCar.getImageUrl());
        if (image) await CarImageRepository.save(selectedCar.getVin(), image);

        account.setCar(selectedCar);
        await new GarageService(currentUser).addCar(account);
        reloadUser();
    };

    return { carMaker, setCarMaker, account, setAccount, selectedCar, setSelectedCar, confirm };
}
