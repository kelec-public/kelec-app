export enum OptionType {
    SWITCH = 'SWITCH',
    NAVIGATE = 'NAVIGATE',
};

export type SettingItem = {
    icon: string; // sert aussi au testID : `testSettingRow<icon>`
    title: string;
    description?: string;
    type: OptionType;
    onPress: () => void;
    switchValue?: boolean;
    useMaterialCommunityIcon?: boolean;
    visible?: boolean; // false : ligne masquée
};

export type SettingSection = {
    title: string;
    showTitle: boolean;
    items: SettingItem[];
};
