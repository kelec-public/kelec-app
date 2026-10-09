import { useContext, useState } from "react";
import MainContext from "../../../lib/Contexts/MainContext";
import Account, { CarMaker } from "../../../lib/clients/accounts/account";
import { CarImageRepository, ConnectedStatusRepository, GarageService } from "../../kelec-garage";
import { ListedVehicle } from "../models/listedVehicle";
import { fetchVehicleImage } from "../services/vehicleImages";

/** Parcours d'ajout d'une voiture : constructeur → compte → voiture → (modèle) → ajout au garage. */
export function useAddCarFlow() {
    const { currentUser, reloadUser } = useContext(MainContext);

    const [carMaker, setCarMaker] = useState<CarMaker | undefined>(undefined);
    const [account, setAccount] = useState<Account | undefined>(undefined);
    const [selectedVehicle, setSelectedVehicle] = useState<ListedVehicle | undefined>(undefined);

    /**
     * Dernière étape : enregistre l'image et la connectivité de la voiture choisie, l'ajoute au compte,
     * puis recharge l'utilisateur.
     */
    const confirm = async () => {
        if (!account || !selectedVehicle) return;
        const { car: selectedCar, connectedStatus } = selectedVehicle;

        const image = await fetchVehicleImage(selectedCar.getImageUrl());
        if (image) await CarImageRepository.save(selectedCar.getVin(), image);
        if (connectedStatus) await ConnectedStatusRepository.save(selectedCar.getVin(), connectedStatus);

        account.setCar(selectedCar);
        // false si le VIN est déjà dans le garage (il n'est de toute façon pas proposé à l'étape 3)
        await new GarageService(currentUser).addCar(account);
        reloadUser();
    };

    return { carMaker, setCarMaker, account, setAccount, selectedVehicle, setSelectedVehicle, confirm };
}
