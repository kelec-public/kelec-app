import Account, { MoveDirection } from "./account";

export interface UserAccountInterface {
    selectedCar: string; // vin
    cars: Account[];
}

class UserAccount implements UserAccountInterface {
    constructor(public selectedCar: string, public cars: Account[]) {
        this.selectedCar = selectedCar;
        this.cars = cars;
    }

    addCar(car: Account): void {
        this.cars.push(car);
        if (this.selectedCar === '') {
            this.selectedCar = car.getCar()?.getVin() ?? '';
        }
    }

    getCars(): Account[] {
        return this.cars;
    }

    getSelectedCar(): string {
        return this.selectedCar;
    }

    getSelectedCarName(): string {
        return this.cars.find(car => car.car?.getVin() === this.selectedCar)?.car?.getModel() ?? 'Unknown';
    }

    setSelectedCar(vin: string): void {
        this.selectedCar = vin;
    }

    moveCar = (vin: string, direction: MoveDirection) => {
        // move the car up in the list of cars
        const index = this.cars.findIndex(car => car.car?.getVin() === vin);
        if (index > -1) {
            if (direction === MoveDirection.UP) {
                const temp = this.cars[index - 1];
                this.cars[index - 1] = this.cars[index];
                this.cars[index] = temp;
            } else {
                const temp = this.cars[index + 1];
                this.cars[index + 1] = this.cars[index];
                this.cars[index] = temp;
            }
        }
    }

    deleteACar = (vin: string) => {
        const index = this.cars.findIndex(car => car.car?.getVin() === vin);
        if (index > -1) {
            this.cars.splice(index, 1);
            if (this.selectedCar === vin) {
                if (this.cars.length > 0) {
                    this.selectedCar = this.cars[0].car?.getVin() ?? "";
                } else {
                    this.selectedCar = '';
                }
            }
        }
    }

    renameACar = (vin: string, newName: string) => {
        const index = this.cars.findIndex(car => car.car?.getVin() === vin);
        if (index > -1) {
            this.cars[index].car?.setModel(newName);

        }
    }

}

export default UserAccount;