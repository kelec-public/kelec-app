import { DropDownData } from "../../../screen/Common/DropDown";

interface BrandApi extends DropDownData {
    display_name: string;
    name: string;
}

interface ModelApi {
    display_name: string;
    name: string;
    engine_type: string;
}

interface BatteryApi {
    size: number;
    max_ac_power: number;
    max_dc_power: number;
}

class KelecApiHandler {
    private readonly baseUrl: string = "https://api.kelec.app/api/v1";

    async getBrands(): Promise<BrandApi[]> {
        const url = `${this.baseUrl}/brands`;
        const response = await fetch(url);
        if (response.status !== 200) {
            throw new Error("Failed to fetch brands");
        }
        const data = await response.json();
        return data.brands.sort((a: BrandApi, b: BrandApi) => a.display_name.localeCompare(b.display_name));
    }

    async getModels(brand: string): Promise<ModelApi[]> {
        const url = `${this.baseUrl}/brands/${brand}/models`;
        const response = await fetch(url);
        if (response.status !== 200) {
            throw new Error("Failed to fetch models");
        }
        const data = await response.json();
        return data.models.sort((a: ModelApi, b: ModelApi) => a.display_name.localeCompare(b.display_name));
    };

    async getBatteries(brand: string, model: string): Promise<BatteryApi[]> {
        const url = `${this.baseUrl}/brands/${brand}/${model}/batteries`;
        const response = await fetch(url);
        if (response.status !== 200) {
            throw new Error("Failed to fetch batteries");
        }
        const data = await response.json();
        return data.batteries.sort((a: BatteryApi, b: BatteryApi) => a.size - b.size);
    }

    async getMessage(version: string, language: string): Promise<string | null> {
        try {
            const url = `${this.baseUrl}/messages/${version}?language=${language}`;

            const response = await fetch(url);

            if (response.status !== 200) {
                throw new Error("Failed to fetch message");
            }

            const data = await response.json();
            return data.message;
        } catch (e) {
            // nothing to do
            return null;
        }

    };


}

export default KelecApiHandler;
export type { BrandApi, ModelApi, BatteryApi };