import RenaultCharge from "../../../lib/clients/apiHandlers/renaultCharges/RenaultCharge";

export const parseRenaultCharges = (json: any[]): RenaultCharge[] => {
    return json.map((row: any): RenaultCharge | null => {
        return parseRenaultCharge(row);
    })
        .filter((charge): charge is RenaultCharge => charge !== null);
}

export const parseRenaultCharge = (row: any): RenaultCharge | null => {
    if (
        row.chargeStartDate &&
        row.chargeEndDate &&
        row.chargeDuration &&
        row.chargeStartBatteryLevel &&
        row.chargeEndBatteryLevel
    ) {
        return new RenaultCharge(
            row.chargeStartDate,
            row.chargeEndDate,
            row.chargeDuration,
            row.chargeStartBatteryLevel,
            row.chargeEndBatteryLevel,
            row.chargeEnergyRecovered,
            row.chargeEndStatus,
            row.isAMergeCharge === 'true',
            [],
            row.mileageAtStart,
            row.inaccurateMileage === 'true',
            row.V2GEnergyDischarged,
            row.isV2G === 'true',
        );
    }
    return null;
}