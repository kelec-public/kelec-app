import ApiHandler from "../../../lib/clients/apiHandlers/apiHandler";

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