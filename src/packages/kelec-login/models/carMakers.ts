import { CAR_MAKER_DISPLAY, CarMaker } from "../../../lib/clients/accounts/account";

/** Constructeurs proposés à l'ajout d'une voiture, dans l'ordre d'affichage. */
export const SELECTABLE_CAR_MAKERS: { brand: CarMaker; display: string }[] =
    [CarMaker.ALPINE, CarMaker.DACIA, CarMaker.HYUNDAI, CarMaker.RENAULT]
        .map(brand => ({ brand, display: CAR_MAKER_DISPLAY[brand] }));
