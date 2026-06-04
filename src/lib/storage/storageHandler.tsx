import AsyncStorage from "@react-native-async-storage/async-storage";
import { AccountInterface, CarFetchStatus, CarMaker } from "../clients/accounts/account";
import { getNativeCryptedData, saveNativeAccount, saveNativeImage } from "./sharedPlatformsData";
import RenaultAccount from "../../lib/clients/accounts/renaultAccount";
import HyundaiAccount from "../../lib/clients/accounts/hyundaiAccount";
import ApiHandler from "../clients/apiHandlers/apiHandler";
import HyundaiApiHandler from "../clients/apiHandlers/hyundaiApiHandler";
import CarType, { CarTypeInterface } from "../clients/cars/carTypes/carType";
import RenaultApiHandler from "../clients/apiHandlers/renaultApiHandler";
import RenaultCharge from "../clients/apiHandlers/renaultCharges/RenaultCharge";
import UserAccount, { UserAccountInterface } from "../clients/accounts/userAccount";
import CarModel, { CarModelInterface } from "../clients/cars/carModel";
import DemoAccount from "../clients/accounts/demoAccount";
import AppPreferences from "../appPreferences/model/appPreferences";

enum CarStorageLocation {
    IMAGE = '/image',
}

class StorageHandler {
    // class to handle local storage of the app

    getHasSeenOnboarding = async (): Promise<boolean> => {
        // check if the user has seen the onboarding
        const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenLoginOnboarding');
        return hasSeenOnboarding === 'true';
    }

    setHasSeenOnboarding = async (): Promise<void> => {
        // set that the user has seen the onboarding
        await AsyncStorage.setItem('hasSeenLoginOnboarding', 'true');
    }

    saveAccount = async (account: UserAccount): Promise<void> => {

        // save the account for widgets
        await saveNativeAccount(account);

        // remove clear passwords
        account.getCars().forEach(car => {
            car.password = '';
        });

        // save the account in the async storage
        await Promise.all([
            AsyncStorage.setItem('account', JSON.stringify(account)),
            AsyncStorage.setItem('kelecNextGen', 'true')
        ]);

    }

    loadAccount = async (): Promise<UserAccount | null> => {
        // load the account from the async storage
        let account = await AsyncStorage.getItem('account');
        let kelecNextGen = await AsyncStorage.getItem('kelecNextGen'); // transition to new add car interface
        if (account === null || kelecNextGen === null) return null;
        const accountJSON: UserAccountInterface = JSON.parse(account);
        return await this.buildUserAccount(accountJSON);
    }

    buildUserAccount = async (account: UserAccountInterface): Promise<UserAccount> => {
        // build a user account class from the storage interface
        let toMigrate = false; // true if needs to resave crypted password
        const currentUserAccount = new UserAccount(account.selectedCar, []);
        for (let car of account.cars) {
            const typedAccout = car as unknown as AccountInterface;
            const carMaker = typedAccout.carMaker;
            let typedCar: CarModelInterface = car.car as unknown as CarModelInterface;
            let carToAdd: CarModel;

            // get password from crypted storage
            let password = await getNativeCryptedData(typedCar.vin + '_password');
            if (password == null || password == "") { // happens if password hasn't been stored to crypted storage yet
                toMigrate = true;
                password = typedAccout.password;
            }
            switch (carMaker) {
                case CarMaker.ALPINE:
                case CarMaker.DACIA:
                case CarMaker.RENAULT:
                    carToAdd = new CarModel(typedCar.vin, typedCar.model, typedCar.imageUrl, typedCar.carMaker, typedCar.registrationNumber);
                    currentUserAccount.addCar(new RenaultAccount(typedAccout.email, password ?? '', typedAccout.kamereonAccountID ?? "", carToAdd, typedAccout.firstName, typedAccout.lastName, carMaker));
                    break;
                case CarMaker.HYUNDAI:
                    carToAdd = new CarModel(typedCar.vin, typedCar.model, typedCar.imageUrl, typedCar.carMaker, typedCar.registrationNumber);
                    currentUserAccount.addCar(new HyundaiAccount(typedAccout.email, password ?? '', typedAccout.pinCode ?? "", carToAdd));
                    break;
                case CarMaker.DEMO:
                    carToAdd = new CarModel(typedCar.vin, typedCar.model, typedCar.imageUrl, typedCar.carMaker, typedCar.registrationNumber);
                    currentUserAccount.addCar(new DemoAccount(typedAccout.email, password ?? '', typedAccout.carMaker, carToAdd));
                    break;
            }
        }
        if (toMigrate) {
            await this.saveAccount(currentUserAccount);
        }

        return currentUserAccount;
    }


    buildApiHandler = (carMaker: CarMaker): ApiHandler => {
        // build an api handler from the api data
        switch (carMaker) {
            case CarMaker.RENAULT:
            case CarMaker.DACIA:
            case CarMaker.ALPINE:
            case CarMaker.DEMO:
                return new RenaultApiHandler();
            case CarMaker.HYUNDAI:
                return new HyundaiApiHandler();
        };
    };

    storeApiData = async (apiData: CarFetchStatus, vin: string, endpoint: string = "batteryStatus") => {
        // store the api data in the async storage
        await AsyncStorage.setItem(vin + '/' + endpoint, JSON.stringify(apiData));
    };

    getStoredApiData = async (vin: string, endpoint: string = "batteryStatus"): Promise<CarFetchStatus | null> => {
        // get the api data from the async storage
        const apiData = await AsyncStorage.getItem(vin + '/' + endpoint);
        if (apiData === null) return null;
        return JSON.parse(apiData);
    }

    loadCarMaker = async (): Promise<string | null> => {
        // load the car maker from the async storage
        return await AsyncStorage.getItem('carMaker');
    }

    logOut = async (): Promise<void> => {
        // remove the account from the async storage
        await AsyncStorage.clear();
        // remove the account for widgets
        await saveNativeAccount(null);
    }

    storeImage = async (image: string, car_vin: string): Promise<void> => {
        // save the image in the async storage
        await saveNativeImage(image, car_vin);
        await AsyncStorage.setItem(car_vin + CarStorageLocation.IMAGE, image);
    }

    getAppPreferences = async (): Promise<AppPreferences> => {
        const appPreferences = await AsyncStorage.getItem('appPreferences');;
        if (appPreferences === null) return new AppPreferences();
        return new AppPreferences(JSON.parse(appPreferences));
    }

    setAppPreferences = async (appPreferences: AppPreferences): Promise<void> => {
        await AsyncStorage.setItem('appPreferences', JSON.stringify(appPreferences));
    }

    getCarType = async (vin: string): Promise<CarType | null> => {
        const carType = await AsyncStorage.getItem(vin + '/carType');
        if (carType === null) return null;
        const parsedCarType = JSON.parse(carType) as unknown as CarTypeInterface;
        if (parsedCarType.battery == undefined) return null;
        return new CarType(JSON.parse(carType) as unknown as CarTypeInterface);
    }

    setCarType = async (vin: string, carType: CarType): Promise<void> => {
        await AsyncStorage.setItem(vin + '/carType', JSON.stringify(carType));
    }

    // convert renault json charges to json class model
    buildCharges = (charges: RenaultCharge[]): RenaultCharge[] => {
        // filter where chargeStartDate is undefined
        charges = charges.filter((charge: any) => charge.chargeStartDate !== undefined);
        return charges.map((charge: any) => {
            return new RenaultCharge(charge.chargeStartDate, charge.chargeEndDate, charge.chargeDuration, charge.chargeStartBatteryLevel, charge.chargeEndBatteryLevel, charge.chargeEnergyRecovered, charge.chargeEndStatus, charge.isAMergeCharge, charge.subCharges, charge.mileageAtStart, charge.inaccurateMileage, charge.V2GEnergyDischarged, charge.isV2G);
        });
    }
}
export default StorageHandler