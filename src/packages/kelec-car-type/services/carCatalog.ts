import KelecApiHandler from "../../../lib/clients/kelec-api/kelecApiHandler";
import { DropDownData } from "../../../screen/Common/DropDown";
import { batteryOption, brandOption, modelOption } from "../models/carTypeForm";

/** Catalogue des modèles (API Kelec), sous forme d'options de menus déroulants. */
export const CarCatalog = {
    async brandOptions(): Promise<DropDownData[]> {
        const brands = await new KelecApiHandler().getBrands();
        return brands.map(brandOption);
    },

    async modelOptions(brand: string): Promise<DropDownData[]> {
        const models = await new KelecApiHandler().getModels(brand);
        return models.map(modelOption);
    },

    async batteryOptions(brand: string, model: string): Promise<DropDownData[]> {
        const batteries = await new KelecApiHandler().getBatteries(brand, model);
        return batteries.map(batteryOption);
    },
};
