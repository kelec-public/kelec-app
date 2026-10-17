import CarType, { CarTypeInterface, LeasingData } from "../../../src/lib/clients/cars/carTypes/carType";

const leasing: LeasingData = {
    startDate: new Date("2024-01-01T00:00:00Z"),
    endDate: new Date("2026-01-01T00:00:00Z"),
    startMileage: 10000,
    totalMileage: 50000,
};

function carTypeWith(leasingData: LeasingData): CarType {
    return new CarType({
        brand: { display_name: "Renault", name: "renault" },
        model: { display_name: "Megane", name: "megane_e_tech", engine_type: "ELEC" },
        battery: { size: 60, max_ac_power: 7.4, max_dc_power: 130 },
        chargingLimit: 80,
        leasing: leasingData,
    } as CarTypeInterface);
}

describe("getMaximumLeasingMileage", () => {
    afterEach(() => {
        jest.useRealTimers();
    });

    test("is 0 before the start of the contract", () => {
        jest.useFakeTimers().setSystemTime(new Date("2023-06-01T00:00:00Z"));
        expect(carTypeWith(leasing).getMaximumLeasingMileage()).toBe(0);
    });

    test("is prorated between the start mileage and the expected end mileage", () => {
        jest.useFakeTimers().setSystemTime(new Date("2025-01-01T00:00:00Z"));
        // 366 days elapsed out of 731: 10 000 + 40 000 * 366 / 731
        expect(carTypeWith(leasing).getMaximumLeasingMileage()).toBe(30027);
    });

    test("is the expected end mileage after the end of the contract", () => {
        jest.useFakeTimers().setSystemTime(new Date("2026-06-01T00:00:00Z"));
        expect(carTypeWith(leasing).getMaximumLeasingMileage()).toBe(50000);
    });

    test("does not jump at the end of the contract", () => {
        jest.useFakeTimers().setSystemTime(new Date("2025-12-31T23:59:00Z"));
        const justBefore = carTypeWith(leasing).getMaximumLeasingMileage();
        jest.setSystemTime(new Date("2026-01-01T00:00:00Z"));
        const atEnd = carTypeWith(leasing).getMaximumLeasingMileage();
        expect(atEnd - justBefore).toBeLessThanOrEqual(1);
    });
});
