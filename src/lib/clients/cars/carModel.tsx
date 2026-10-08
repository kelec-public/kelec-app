import { CarMaker } from "../accounts/account";

class CarModel {
    private readonly vin: string;
    private model: string;
    private readonly registrationNumber?: string;
    private registrationCountry?: string; // code ISO du pays d'immatriculation (ex. "FR"), absent si inconnu
    private readonly imageUrl: string;
    private readonly carMaker: CarMaker;
    private image: string;

    constructor(vin: string, model: string, imageUrl: string, carMaker: CarMaker, registrationNumber?: string, registrationCountry?: string) {
        this.vin = vin;
        this.model = model;
        this.imageUrl = imageUrl;
        this.registrationNumber = registrationNumber;
        this.registrationCountry = registrationCountry;
        this.carMaker = carMaker;
        this.image = "";
    }



    getVin(): string {
        return this.vin;
    }

    getModel(): string {
        return this.model;
    }

    getImageUrl(): string {
        return this.imageUrl;
    }

    getImageData(): string {
        return this.image
    }

    getCarmaker(): CarMaker {
        return this.carMaker;
    }

    setModel(model: string): void {
        this.model = model;
    }


    getRegistrationNumber(): string | undefined {
        return this.registrationNumber;
    }

    getRegistrationCountry(): string | undefined {
        return this.registrationCountry;
    }

    setRegistrationCountry(country: string): void {
        this.registrationCountry = country;
    }



    setImageData(image: string): void {
        this.image = image;
    }

}

interface CarModelInterface {
    vin: string;
    model: string;
    imageUrl: string;
    registrationNumber?: string;
    registrationCountry?: string;
    carMaker: CarMaker;
}

export default CarModel;
export type { CarModelInterface };