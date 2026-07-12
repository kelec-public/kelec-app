export type DateOrder = 'DMY' | 'MDY' | 'YMD';
export type DateParser = (raw: string) => Date | null;