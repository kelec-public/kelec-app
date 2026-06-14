import { NEUTRAL_200, NEUTRAL_500, NEUTRAL_ZERO, PRIMARY_COLOUR, SECONDARY_COLOUR } from "./colours";

export enum ButtonColours {
    PRIMARY,
    SECONDARY,
    DISABLED,
}

interface ButtonColourProps {
    backgroundColour: string[];
    textColour: string;
    borderWidth: number;
}

export const ButtonColoursPalettes: Record<ButtonColours, ButtonColourProps> = {
    [ButtonColours.PRIMARY]: {
        backgroundColour: [PRIMARY_COLOUR, SECONDARY_COLOUR],
        textColour: NEUTRAL_ZERO,
        borderWidth: 0
    },
    [ButtonColours.SECONDARY]: {
        backgroundColour: [NEUTRAL_ZERO, NEUTRAL_ZERO],
        textColour: NEUTRAL_500,
        borderWidth: 1
    },
    [ButtonColours.DISABLED]: {
        backgroundColour: [NEUTRAL_200, NEUTRAL_200],
        textColour: NEUTRAL_ZERO,
        borderWidth: 0
    }
};
