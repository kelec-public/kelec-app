import { DimensionValue, TextStyle } from 'react-native';

export type ButtonStyle = {
    colors: {
        background: string | Gradient,
        backgroundDisabled: string | Gradient,
        backgroundPressed?: string | Gradient,
        text: string,
        textDisabled: string,
        iconTint: string
        loader: string
    }
    border?: {
        width: number
        color: string
    },
    radius?: DimensionValue,
    textStyle: TextStyle
};

export type Gradient = {
    startColor: string,
    endColor: string,
    orientation: 'horizontal' | 'vertical'
}