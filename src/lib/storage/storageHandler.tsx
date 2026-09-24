import AsyncStorage from "@react-native-async-storage/async-storage";
import { CarFetchStatus, CarMaker } from "../clients/accounts/account";
import ApiHandler from "../clients/apiHandlers/apiHandler";
import HyundaiApiHandler from "../clients/apiHandlers/hyundaiApiHandler";
import RenaultApiHandler from "../clients/apiHandlers/renaultApiHandler";

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
}
export default StorageHandler