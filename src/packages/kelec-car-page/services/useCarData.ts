import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import CarModel from '../../../lib/clients/cars/carModel';
import MainContext from '../../../lib/Contexts/MainContext';
import ApiHandler from '../../../lib/clients/apiHandlers/apiHandler';
import { refreshWidget } from '../../../lib/storage/sharedPlatformsData';
import { createCarLoader } from './createCarLoader';
import Account from '../../../lib/clients/accounts/account';

export type CarDataStatus = 'loading' | 'loaded' | 'error';

type Params = {
    carModel: CarModel;
    account: Account;
    onTfaRequired: (regToken: string) => void;
    onSoftError: (errorMessage: string) => void;
};

/**
 * Charge les données d'une voiture en "cache d'abord, réseau ensuite".
 * Un seul ApiHandler vit pendant tout le chargement ; `revision` sert de
 * signal de re-render (affichage progressif à chaque bloc reçu).
 */
export function useCarData({ carModel, account, onTfaRequired, onSoftError }: Params) {
    const { storageHandler } = useContext(MainContext);

    const [status, setStatus] = useState<CarDataStatus>('loading');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [revision, setRevision] = useState<number>(0);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [apiHandler, setApiHandler] = useState<ApiHandler>(() =>
        storageHandler.buildApiHandler(carModel.getCarmaker()),
    );

    // Évite les setState après démontage et les lectures d'état périmées.
    const isMounted = useRef<boolean>(true);
    const statusRef = useRef<CarDataStatus>('loading');

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    const commitStatus = useCallback((next: CarDataStatus, message = '') => {
        statusRef.current = next;
        if (!isMounted.current) return;
        setStatus(next);
        setErrorMessage(message);
    }, []);

    const load = useCallback(async () => {
        const handler = storageHandler.buildApiHandler(carModel.getCarmaker());
        const notify = () => {
            if (!isMounted.current) return;
            setApiHandler(handler);
            setRevision(r => r + 1);
        };

        const loader = createCarLoader({ carModel, account, storageHandler });
        const ctx = { handler, notify };

        await loader.loadFromCache(ctx);
        if (!handler.hasError()) {
            notify();
            commitStatus('loaded');
        }

        const result = await loader.loadFromNetwork(ctx);

        switch (result.status) {
            case 'ok':
                notify();
                commitStatus('loaded');
                return;

            case 'tfa':
                onTfaRequired(result.regToken);
                return;

            case 'error':
                // On a déjà quelque chose à l'écran : on ne casse pas la vue.
                if (statusRef.current === 'loaded') onSoftError(result.message);
                else commitStatus('error', result.message);
                return;
        }
    }, [carModel, account, storageHandler, commitStatus, onTfaRequired, onSoftError]);

    const refresh = useCallback(async () => {
        setIsRefreshing(true);
        refreshWidget();
        try {
            await load();
        } finally {
            if (isMounted.current) setIsRefreshing(false);
        }
    }, [load]);

    useEffect(() => {
        refreshWidget();
        load();
    }, [load]);

    return { status, errorMessage, apiHandler, revision, isRefreshing, refresh };
}