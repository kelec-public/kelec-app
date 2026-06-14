import { StyleSheet, Platform } from "react-native";

const fontNames = {
    regular: 'NouvelR',
    bold: 'NouvelRBold',
    italic: 'NouvelRItalic'
}

const fontFamilyBold = Platform.OS === 'ios' ? 'NouvelR' : 'NouvelRBold';
const fontWeightBold = Platform.OS === 'ios' ? 'bold' : 'normal';


const commonStyles = StyleSheet.create({
    navTitle: {
        fontSize: 35,
        fontFamily: fontFamilyBold,
        fontWeight: fontWeightBold
    },
    bottomSheetTitle: {
        fontSize: 30,
        fontFamily: fontFamilyBold,
        fontWeight: fontWeightBold
    },
    navSeparator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: 'lightgray'
    },
    rowFlex: {
        flexDirection: 'row',
    },
    spaceBetween: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10
    },
    flexEnd: {
        display: 'flex',
        justifyContent: 'flex-end'
    },
    spaceAround: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        gap: 10
    },
    centerFlex: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    gap15: {
        gap: 15
    },
    gap30: {
        gap: 30
    },
    gap10: {
        gap: 10
    },
    gap5: {
        gap: 5
    },
    flex: {
        flex: 1
    },
    verySmallText: {
        fontSize: 10,
        color: 'gray'
    },
    smallText: {
        fontSize: 15,
    },
    listText: {
        fontSize: 18,
        fontWeight: fontWeightBold,
        fontFamily: fontFamilyBold,
        color: 'gray',
        marginTop: 20
    },
    paddingHorizontal: {
        paddingHorizontal: 15,
        marginVertical: 10,
    },
    marginVertical: {
        marginVertical: 10
    },
    flexColumn: {
        flexDirection: 'column',
    },
});

export default commonStyles;
export { fontNames, fontFamilyBold, fontWeightBold };