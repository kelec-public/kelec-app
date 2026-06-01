export type VehicleLinkApi = {
    vin: string;
    vehicleDetails: {
        model: {
            label: string;
        }
        energy: {
            code: string;
            lable: string;
        }
        registrationNumber?: string;
        assets?: Asset[];
    }
}

export type Asset = {
    assetType: string;
    viewpoint: string;
    renditions: {
        resolutionType: string;
        url: string;
    }[]
}