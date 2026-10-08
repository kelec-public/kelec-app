/**
 * Format d'écriture d'une plaque : la plaque brute (sans séparateurs, en majuscules)
 * doit correspondre à `pattern`, et `format` place les groupes capturés ($1, $2…).
 */
export type PlateFormat = {
    readonly pattern: RegExp;
    readonly format: string;
};

const CROATIAN_LETTER = "A-ZČĆŠŽĐ";

/**
 * Formats des plaques par pays (code ISO 3166-1 alpha-2, celui de `registrationCountry` chez Renault).
 * On ne garde que les formats qu'on peut déduire sans ambiguïté de la plaque brute.
 * Pays absents volontairement (la plaque reste brute) :
 * - DE, AT, PL : la longueur du code de ville / district varie, on ne sait pas où couper ;
 * - SK : l'ancien format (BA-123AB) et le nouveau (AA 123 BC) ont les mêmes caractères ;
 * - SI : la place du tiret varie selon le format choisi.
 */
export const PLATE_FORMATS: Readonly<Record<string, readonly PlateFormat[]>> = {
    // Belgique : 1-ABC-234 (depuis 2010), ABC-123 et 123-ABC (avant)
    BE: [
        { pattern: /^(\d)([A-Z]{3})(\d{3})$/, format: "$1-$2-$3" },
        { pattern: /^([A-Z]{3})(\d{3})$/, format: "$1-$2" },
        { pattern: /^(\d{3})([A-Z]{3})$/, format: "$1-$2" },
    ],
    // Bulgarie : CA 1234 AB, C 1234 AB
    BG: [{ pattern: /^([A-Z]{1,2})(\d{4})([A-Z]{2})$/, format: "$1 $2 $3" }],
    // Chypre : ABC 123
    CY: [{ pattern: /^([A-Z]{3})(\d{3})$/, format: "$1 $2" }],
    // Tchéquie : 1AB 2345
    CZ: [{ pattern: /^(\d[A-Z][A-Z\d])(\d{4})$/, format: "$1 $2" }],
    // Danemark : AB 12 345
    DK: [{ pattern: /^([A-Z]{2})(\d{2})(\d{3})$/, format: "$1 $2 $3" }],
    // Estonie : 123 ABC
    EE: [{ pattern: /^(\d{3})([A-Z]{3})$/, format: "$1 $2" }],
    // Espagne : 1234 BCD
    ES: [{ pattern: /^(\d{4})([A-Z]{3})$/, format: "$1 $2" }],
    // Finlande : ABC-123, AB-1
    FI: [{ pattern: /^([A-Z]{2,3})(\d{1,3})$/, format: "$1-$2" }],
    // France (SIV, depuis 2009) : AB-123-CD
    FR: [{ pattern: /^([A-Z]{2})(\d{3})([A-Z]{2})$/, format: "$1-$2-$3" }],
    // Royaume-Uni (hors UE, mais présent chez Renault) : AB12 CDE
    GB: [{ pattern: /^([A-Z]{2}\d{2})([A-Z]{3})$/, format: "$1 $2" }],
    // Grèce : ABC-1234
    GR: [{ pattern: /^([A-Z]{3})(\d{4})$/, format: "$1-$2" }],
    // Croatie : ZG 123-AB, ZG 1234-A
    HR: [{ pattern: new RegExp(`^([${CROATIAN_LETTER}]{2})(\\d{3,4})([${CROATIAN_LETTER}]{1,2})$`), format: "$1 $2-$3" }],
    // Hongrie : AA BC-123 (depuis 2022), ABC-123 (avant)
    HU: [
        { pattern: /^([A-Z]{2})([A-Z]{2})(\d{3})$/, format: "$1 $2-$3" },
        { pattern: /^([A-Z]{3})(\d{3})$/, format: "$1-$2" },
    ],
    // Irlande : 191-D-12345 (année, comté, numéro)
    IE: [{ pattern: /^(\d{2,3})([A-Z]{1,2})(\d{1,6})$/, format: "$1-$2-$3" }],
    // Italie : AB 123 CD
    IT: [{ pattern: /^([A-Z]{2})(\d{3})([A-Z]{2})$/, format: "$1 $2 $3" }],
    // Lituanie : ABC 123
    LT: [{ pattern: /^([A-Z]{3})(\d{3})$/, format: "$1 $2" }],
    // Luxembourg : AB 1234, AB 123, A 1234
    LU: [{ pattern: /^([A-Z]{1,2})(\d{3,5})$/, format: "$1 $2" }],
    // Lettonie : AB-1234
    LV: [{ pattern: /^([A-Z]{2})(\d{4})$/, format: "$1-$2" }],
    // Malte : ABC 123
    MT: [{ pattern: /^([A-Z]{3})(\d{3})$/, format: "$1 $2" }],
    // Portugal : AB-12-CD (depuis 2020), 12-AB-34, 12-34-AB, AB-12-34
    PT: [{ pattern: /^([A-Z]{2}|\d{2})([A-Z]{2}|\d{2})([A-Z]{2}|\d{2})$/, format: "$1-$2-$3" }],
    // Roumanie : AB 12 CDE, B 123 CDE (Bucarest)
    RO: [{ pattern: /^([A-Z]{1,2})(\d{2,3})([A-Z]{3})$/, format: "$1 $2 $3" }],
    // Suède : ABC 123, ABC 12D
    SE: [{ pattern: /^([A-Z]{3})(\d{2}[A-Z\d])$/, format: "$1 $2" }],
};
