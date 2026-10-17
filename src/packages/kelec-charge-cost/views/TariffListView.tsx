import { useContext } from "react";
import { StyleSheet, TouchableOpacity, useColorScheme, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import MainContext from "../../../lib/Contexts/MainContext";
import Text from "../../../screen/Common/CustomText";
import Button from "../../kelec-model/view/Button";
import TariffPageLayout from "./TariffPageLayout";
import { BLACK_COLOUR, NEUTRAL_200 } from "../../kelec-model/lib/colours";
import { spacerM, spacerS, spacerXL } from "../../kelec-model/view/Spacers";
import { subTitle, subTitle2, textBody } from "../../kelec-model/view/Titles";
import { CURRENCIES, Currency, TariffSettings } from "../models/Tariff";
import ChoicePills from "./ChoicePills";
import { periodLabel, priceLabel, slotsLabel } from "./tariffLabels";

type Props = {
    readonly settings: TariffSettings;
    readonly onBack: () => void;
    readonly onSelectCurrency: (currency: Currency) => void;
    readonly onEditTariff: (id: string) => void;
    readonly onAddTariff: () => void;
};

/** Liste des tarifs (une ligne par période) et devise. */
function TariffListView({ settings, onBack, onSelectCurrency, onEditTariff, onAddTariff }: Props): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';
    const { languageHandler } = useContext(MainContext);
    const t = (key: string) => languageHandler.getTranslation(key);

    return (
        <TariffPageLayout
            testID="tariffListView"
            title={t("electricityTariff")}
            onBack={onBack}
            backTestID="tariffListBackButton"
            action={{ icon: "add", onPress: onAddTariff, testID: "addTariffButton" }}
        >
            <View style={styles.content}>
                <View style={styles.section}>
                    <Text style={subTitle}>{t("currency")}</Text>
                    <ChoicePills
                        choices={CURRENCIES.map(currency => ({ value: currency, label: currency, testID: 'currencyButton' + currency }))}
                        selected={settings.currency}
                        onSelect={onSelectCurrency}
                    />
                </View>
                <View style={styles.section}>
                    {settings.tariffs.length === 0 && (
                        <>
                            <Text testID="noTariff" style={textBody}>{t("noTariff")}</Text>
                            {/* premier tarif : un bouton explicite, le « + » de l'en-tête prend ensuite le relais */}
                            <Button testID="addFirstTariffButton" text={t("addTariff")} onPress={onAddTariff} />
                        </>
                    )}
                    {settings.tariffs.map((tariff, index) => (
                        <TouchableOpacity
                            key={tariff.id}
                            testID={'tariffRow' + index}
                            onPress={() => onEditTariff(tariff.id)}
                            style={styles.tariffRow}
                        >
                            <View style={styles.tariffText}>
                                <Text style={subTitle2}>{periodLabel(settings.tariffs, tariff, t)}</Text>
                                <Text testID={'tariffPrice' + index} style={textBody}>{priceLabel(tariff, settings.currency, t)}</Text>
                                {tariff.kind === 'peakOffPeak' && (
                                    <Text style={subTitle2}>{`${t("offPeakSlots")} : ${slotsLabel(tariff)}`}</Text>
                                )}
                            </View>
                            <Icon name="keyboard-arrow-right" size={spacerXL} color={BLACK_COLOUR(isDarkMode)} />
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </TariffPageLayout>
    );
}

const styles = StyleSheet.create({
    content: {
        gap: spacerXL,
    },
    section: {
        gap: spacerM,
    },
    tariffRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacerM,
        borderWidth: 1,
        borderColor: NEUTRAL_200,
        borderRadius: spacerS,
        padding: spacerM,
    },
    tariffText: {
        flex: 1,
        gap: spacerS,
    },
});

export default TariffListView;
