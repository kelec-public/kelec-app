import { useEffect, useState } from "react";
import { LeasingData } from "../../../lib/clients/cars/carTypes/carType";
import { DropDownData } from "../../../screen/Common/DropDown";
import { CarTypeRepository } from "../../kelec-garage";
import { CarTypeForm, EMPTY_CAR_TYPE_FORM, carTypeFromForm, formFromCarType, isCarTypeFormValid, supportsChargingLimit } from "../models/carTypeForm";

/** Formulaire du modèle de la voiture : pré-rempli avec le modèle enregistré, enregistré à la validation. */
export function useCarTypeForm(vin: string) {
    const [form, setForm] = useState<CarTypeForm>(EMPTY_CAR_TYPE_FORM);
    // true après une tentative de validation incomplète : les champs manquants passent en rouge
    const [showErrors, setShowErrors] = useState(false);

    useEffect(() => {
        CarTypeRepository.get(vin).then(stored => {
            if (stored) setForm(formFromCarType(stored));
        });
    }, [vin]);

    const update = (patch: Partial<CarTypeForm>) => setForm(current => ({ ...current, ...patch }));

    /** Enregistre si le formulaire est complet ; renvoie false (et affiche les erreurs) sinon. */
    const submit = async (): Promise<boolean> => {
        if (!isCarTypeFormValid(form)) {
            setShowErrors(true);
            return false;
        }
        await CarTypeRepository.save(vin, carTypeFromForm(form));
        return true;
    };

    return {
        form,
        showErrors,
        showChargingLimit: supportsChargingLimit(form),
        // changer de marque ou de modèle invalide les choix qui en dépendent
        setBrand: (brand: DropDownData) => update({ brand, model: null, battery: null }),
        setModel: (model: DropDownData) => update({ model, battery: null }),
        setBattery: (battery: DropDownData) => update({ battery }),
        setChargingLimit: (chargingLimit: number) => update({ chargingLimit }),
        setLeasing: (leasing: LeasingData | undefined) => update({ leasing }),
        setSupportsV2G: (supportsV2G: boolean) => update({ supportsV2G }),
        submit,
    };
}
