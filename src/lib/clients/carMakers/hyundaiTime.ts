/** Convertit une date Hyundai au format `20240409175202` (UTC) en Date. */
export const parseHyundaiTime = (time: string): Date => {
    const year = time.substring(0, 4);
    const month = time.substring(4, 6);
    const day = time.substring(6, 8);
    const hour = time.substring(8, 10);
    const minute = time.substring(10, 12);
    const second = time.substring(12, 14);
    return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
};
