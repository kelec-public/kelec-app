import { createContext } from "react";
import { ChargeCosts } from "../models/ChargeCosts";

/** Coût des charges pour les vues de l'historique : `null` s'il n'y a pas de tarif. */
const ChargeCostsContext = createContext<ChargeCosts | null>(null);

export default ChargeCostsContext;
