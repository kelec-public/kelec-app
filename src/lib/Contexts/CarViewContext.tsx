import { createContext } from "react";
import CarModel from "../clients/cars/carModel";
import ApiHandler from "../clients/apiHandlers/apiHandler";
import CarType from "../clients/cars/carTypes/carType";
import Account from "../clients/accounts/account";

const CarViewContext = createContext({
    carModel: null as unknown as CarModel,
    image: '',
    apiHandler: null as unknown as ApiHandler,
    carType: null as unknown as CarType,
    account: null as unknown as Account
});

export default CarViewContext;