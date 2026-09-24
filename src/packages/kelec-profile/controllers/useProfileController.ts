import { useCallback, useContext, useMemo, useState } from "react";
import { Alert } from "react-native";
import MainContext from "../../../lib/Contexts/MainContext";
import Account, { MoveDirection } from "../../../lib/clients/accounts/account";
import CarModel from "../../../lib/clients/cars/carModel";
import { ViewsAvailable } from "../../../Main";
import { GarageService } from "../../kelec-garage";

export type GarageCar = {
    account: Account;
    carModel: CarModel;
};

/** Page compte : liste des voitures, mode édition (réordonner) et actions sur chaque voiture. */
export function useProfileController() {
    const { languageHandler, currentUser, storageHandler, reloadUser, setCurrentView } = useContext(MainContext);

    const [editMode, setEditMode] = useState(false);

    const cars = useMemo<GarageCar[]>(
        () => currentUser.getCars().flatMap(account => {
            const carModel = account.getCar();
            return carModel ? [{ account, carModel }] : [];
        }),
        [currentUser],
    );

    const garage = useMemo(() => new GarageService(currentUser, storageHandler), [currentUser, storageHandler]);

    /** Enregistre puis recharge l'utilisateur pour mettre toute l'app à jour. */
    const run = useCallback(async (action: () => Promise<void>) => {
        await action();
        reloadUser();
    }, [reloadUser]);

    const confirmDelete = useCallback((car: GarageCar) => {
        Alert.alert(
            languageHandler.getTranslation("deleteVehicle"),
            languageHandler.getTranslation("deleteVehicleMessage"),
            [
                {
                    text: languageHandler.getTranslation("cancel"),
                    onPress: () => { },
                    style: "cancel",
                },
                {
                    text: languageHandler.getTranslation("confirm"),
                    onPress: () => {
                        run(() => garage.deleteCar(car.carModel.getVin()));
                    },
                },
            ],
        );
    }, [languageHandler, run, garage]);

    return {
        cars,
        hasMultipleCars: cars.length > 1,
        defaultCarName: currentUser.getSelectedCar() !== '' ? currentUser.getSelectedCarName() : null,
        isDefaultCar: (vin: string) => vin === currentUser.getSelectedCar(),

        editMode,
        toggleEditMode: () => setEditMode(mode => !mode),
        openAddCar: () => setCurrentView(ViewsAvailable.LOGIN),

        selectDefaultCar: (vin: string) => run(() => garage.selectDefaultCar(vin)),
        moveCar: (vin: string, direction: MoveDirection) => run(() => garage.moveCar(vin, direction)),
        renameCar: (vin: string, name: string) => run(() => garage.renameCar(vin, name)),
        confirmDelete,
    };
}
