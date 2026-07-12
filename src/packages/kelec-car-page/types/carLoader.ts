import CarModel from "../../../lib/clients/cars/carModel";
import StorageHandler from "../../../lib/storage/storageHandler";
import ApiHandler from "../../../lib/clients/apiHandlers/apiHandler";
import Account from "../../../lib/clients/accounts/account";

export type CarLoaderDeps = {
    carModel: CarModel;
    account: Account;
    storageHandler: StorageHandler;
};

export interface CarDataLoader {
    loadFromCache(ctx: LoadContext): Promise<void>;
    loadFromNetwork(ctx: LoadContext): Promise<RemoteResult>;
}

export type LoadContext = {
    handler: ApiHandler;
    notify: () => void;
};

export type RemoteResult =
    | { status: 'ok' }
    | { status: 'tfa'; regToken: string }
    | { status: 'error'; message: string };