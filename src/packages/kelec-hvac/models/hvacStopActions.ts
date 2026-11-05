import { CarAvailableModels } from "../../../lib/clients/cars/carTypes/carType";
import { HvacStopAction } from "../../../lib/clients/carMakers/renaultEnums";

/**
 * Modèles qui arrêtent la climatisation avec « stop » ; les autres utilisent « cancel ».
 * Repris de la table par modèle de renault-api, qui reconnaît ne pas avoir pu le vérifier partout.
 * Scénic : absente de cette table, vérifiée sur une voiture. L'API y accepte « cancel » sans arrêter la climatisation.
 */
const STOP_ACTION_MODELS: string[] = [
    CarAvailableModels.MEGANE,
    CarAvailableModels.SCENIC,
    CarAvailableModels.R5,
    CarAvailableModels.A290,
];

/**
 * Actions à essayer, dans l'ordre, pour arrêter la climatisation : celle attendue pour le modèle, puis l'autre.
 * Modèle inconnu : « cancel » d'abord, comme renault-api pour un modèle qu'elle ne documente pas.
 */
export const hvacStopActions = (modelName?: string): HvacStopAction[] =>
    modelName !== undefined && STOP_ACTION_MODELS.includes(modelName)
        ? [HvacStopAction.STOP, HvacStopAction.CANCEL]
        : [HvacStopAction.CANCEL, HvacStopAction.STOP];
