import { V2GApiSession } from "../carMakers/renault/v2gApiResponse";
import CarModel from "../cars/carModel";

type CarFetchStatus = {
    hasError: boolean;
    errorMessage?: string;
    apiData?: any;
    regToken?: string;
};

enum CarMaker {
    // to handle the carmaker of an account
    RENAULT = 'renault',
    HYUNDAI = 'hyundai',
    DACIA = 'dacia',
    DEMO = 'demo',
    ALPINE = 'alpine',
};

const CAR_MAKER_DISPLAY: Record<CarMaker, string> = {
    [CarMaker.RENAULT]: 'Renault',
    [CarMaker.HYUNDAI]: 'Hyundai',
    [CarMaker.DACIA]: 'Dacia',
    [CarMaker.DEMO]: 'Demo',
    [CarMaker.ALPINE]: 'Alpine',
};

enum MoveDirection {
    UP = 'UP',
    DOWN = 'DOWN'
};

class Account implements AccountInterface {
    // to handle a saved account

    // email adress of the account
    email: string;

    // password of the account
    password: string;

    // carmaker of the account
    carMaker: CarMaker;

    // all the cars of the account
    car?: CarModel;

    // renault specific
    firstName?: string;
    lastName?: string;


    constructor(email: string, password: string, carMaker: CarMaker, car?: CarModel) {
        this.email = email;
        this.password = password;
        this.carMaker = carMaker;
        this.car = car;
    }

    getCarMaker(): CarMaker {
        return this.carMaker;
    }

    setCar(car: CarModel) {
        this.car = car;
    }


    getCar(): CarModel | undefined {
        return this.car;
    }

    fetchCarStatus = async (vin: string): Promise<CarFetchStatus> => {
        return {
            hasError: true
        }
    }

    fetchCarCockpit = async (vin: string): Promise<CarFetchStatus> => {
        return {
            hasError: true
        }
    }

    fetchLocationStatus = async (vin: string): Promise<CarFetchStatus> => {
        return {
            hasError: true
        }
    }

    fetchChargesHistory = async (vin: string): Promise<CarFetchStatus> => {
        return {
            hasError: true
        }
    }

    fetchV2GSessions = async (vin: string): Promise<V2GApiSession[] | null> => {
        return null;
    }

    fetchChargesSettings = async (vin: string): Promise<CarFetchStatus> => {
        return {
            hasError: true
        }
    }

    fetchHVACStatus = async (vin: string): Promise<CarFetchStatus> => {
        return {
            hasError: true
        }
    }

    launchHVAC = async (temperature: number): Promise<boolean> => {
        return false;
    }

    getEmail(): string {
        return this.email;
    }

    getPassword(): string {
        return this.password;
    }
}

interface AccountInterface {
    email: string;
    password: string;
    carMaker: CarMaker;
    car?: CarModel;

    // renault specific
    kamereonAccountID?: string;
    firstName?: string;
    lastName?: string;

    // hyundai specific
    pinCode?: string;
}

export default Account;
export { CarMaker, MoveDirection, CAR_MAKER_DISPLAY };
export type { AccountInterface, CarFetchStatus };