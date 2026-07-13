import Account from "../../../lib/clients/accounts/account";
import HyundaiAccount from "../../../lib/clients/accounts/hyundaiAccount";
import RenaultAccount from "../../../lib/clients/accounts/renaultAccount";
import CarModel from "../../../lib/clients/cars/carModel";
import StorageHandler from "../../../lib/storage/storageHandler";

export type CarLoaderDeps<A extends Account = Account> = {
    carModel: CarModel;
    account: A;
    storageHandler: StorageHandler;
};

export type RenaultCarLoaderDeps = CarLoaderDeps<RenaultAccount>;
export type HyundaiCarLoaderDeps = CarLoaderDeps<HyundaiAccount>;