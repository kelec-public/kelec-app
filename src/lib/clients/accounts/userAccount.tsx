import Account, { MoveDirection } from "./account";

export interface UserAccountInterface {
    cars: Account[];
}

class UserAccount implements UserAccountInterface {
    constructor(public cars: Account[]) {
        this.cars = cars;
    }

    addCar(car: Account): void {
        this.cars.push(car);
    }

    getCars(): Account[] {
        return this.cars;
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