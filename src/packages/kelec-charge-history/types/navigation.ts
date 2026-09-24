import CarType from "../../../lib/clients/cars/carTypes/carType";
import ChargesHistory from "../models/ChargesHistory";

/** Paramètres de la route `ChargesView`. */
export type ChargesHistoryParams = {
    charges: ChargesHistory;
    carType: CarType;
};
