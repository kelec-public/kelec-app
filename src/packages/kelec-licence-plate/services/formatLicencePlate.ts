import { PLATE_FORMATS } from "../models/plateFormats";

const normalize = (plate: string): string => plate.replace(/[\s\-.·•]/g, "").toUpperCase();

/**
 * Pays-Bas : une plaque de 6 caractères en 3 groupes (« sidecodes » : AB-12-34, 12-AB-34, 1-ABC-23, AB-123-C…).
 * On coupe entre lettres et chiffres, et un groupe de 4 se coupe en deux (AB-CD-12).
 */
const formatDutchPlate = (plate: string): string | null => {
    if (!/^[A-Z\d]{6}$/.test(plate)) return null;
    const groups = (plate.match(/[A-Z]+|\d+/g) ?? [])
        .flatMap(group => group.length === 4 ? [group.slice(0, 2), group.slice(2)] : [group]);
    return groups.length === 3 ? groups.join("-") : null;
};

/**
 * Écrit la plaque selon les règles de son pays d'immatriculation.
 * Pays inconnu, non géré ou plaque qui ne correspond à aucun format : la plaque est renvoyée telle quelle.
 */
export const formatLicencePlate = (plate: string, country?: string): string => {
    if (!country) return plate;
    const raw = normalize(plate);
    const code = country.toUpperCase();

    if (code === "NL") return formatDutchPlate(raw) ?? plate;

    const format = PLATE_FORMATS[code]?.find(({ pattern }) => pattern.test(raw));
    return format ? raw.replace(format.pattern, format.format) : plate;
};
