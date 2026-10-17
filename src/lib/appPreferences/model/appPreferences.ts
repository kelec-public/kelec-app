import MapType from "../interface/mapType";
import Units from "../interface/units";
import ColorTheme from "../interface/colorTheme";

class AppPreferences {
    // to display miles instead of km
    displayMiles: boolean = false;
    // to force conversion to miles for certain cars
    convertToMiles: boolean = false;
    // to highlight DC charges in the charges history
    highlightDCCharges: boolean = false;
    // to set the map type for the map card
    mapType: MapType = 'standard';
    // hide map (if contract has expired)
    hideMap: boolean = false;
    // display charging power
    displayChargingPower: boolean = false;
    // shcedules charge offset for various countries usage
    scheduledChargeOffset: number = 0;
    // merge charges 
    mergeCharges: boolean = false;
    // app theme: follows the phone (auto), or forced light / dark
    colorTheme: ColorTheme = 'auto';

    constructor(preferences?: Partial<AppPreferences>) {
        if (preferences) {
            Object.assign(this, preferences);
        }
    }

    /**
     * Returns the unit to use to display distances based on user preference.
     * @returns {Units} - returns the distance unit based on displayMiles preference
     */
    public get distanceUnits(): Units {
        return this.displayMiles ? 'mi' : 'km';
    }


};

export default AppPreferences;