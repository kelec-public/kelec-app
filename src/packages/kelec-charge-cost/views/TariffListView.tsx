import { useContext } from "react";
import { StyleSheet, View } from "react-native";
import MainContext from "../../../lib/Contexts/MainContext";
import Text from "../../../screen/Common/CustomText";
import Button from "../../kelec-model/view/Button";
import TariffPageLayout from "./TariffPageLayout";
import { NEUTRAL_300 } from "../../kelec-model/lib/colours";
import { spacerM, spacerXL } from "../../kelec-model/view/Spacers";
import { subTitle2, textBody } from "../../kelec-model/view/Titles";
import { CURRENCIES, Currency, TariffSettings, toLocalDate } from "../models/Tariff";
import { tariffStatus } from "../services/tariffList";
import ChoicePills from "./ChoicePills";
import Badge from "./Badge";
import TariffCard from "./TariffCard";

type Props = {
    readonly settings: TariffSettings;
    readonly onBack: () => void;
    readonly onSelectCurrency: (currency: Currency) => void;
    readonly onEditTariff: (id: string) => void;
    readonly onAddTariff: () => void;
};

/** Devise, puis une carte par tarif, le plus récent en haut. */
function TariffListView({ settings, onBack, onSelectCurrency, onEditTariff, onAddTariff }: Props): React.JSX.Element {
    const { languageHandler } = useContext(MainContext);
    const t = (key: string) => languageHandler.getTranslation(key);
    const today = toLocalDate(new Date());

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
                    <Text style={[subTitle2, styles.caption]}>{t("currency").toUpperCase()}</Text>
                    <ChoicePills
                        choices={CURRENCIES.map(currency => ({ value: currency, label: currency, testID: 'currencyButton' + currency }))}
                        selected={settings.currency}
                        onSelect={onSelectCurrency}
                    />
                </View>
                {settings.tariffs.length === 0 ? (
                    <View style={styles.section}>
                        <Text testID="noTariff" style={textBody}>{t("noTariff")}</Text>
                        {/* premier tarif : un bouton explicite, le « + » de l'en-tête prend ensuite le relais */}
                        <Button testID="addFirstTariffButton" text={t("addTariff")} onPress={onAddTariff} />
                    </View>
                ) : (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={[subTitle2, styles.caption]}>{t("tariffHistory").toUpperCase()}</Text>
                            <Badge text={t("tariffPeriodsCount").replace('{count}', String(settings.tariffs.length))} />
                        </View>
                        {/* le plus récent en haut ; l'index (testID) reste celui de l'ordre chronologique */}
                        {settings.tariffs.map((tariff, index) => ({ tariff, index })).reverse().map(({ tariff, index }) => (
                            <TariffCard
                                key={tariff.id}
                                testID={'tariffRow' + index}
                                tariff={tariff}
                                tariffs={settings.tariffs}
                                currency={settings.currency}
                                status={tariffStatus(settings.tariffs, tariff.id, today)}
                                onPress={() => onEditTariff(tariff.id)}
                            />
                        ))}
                    </View>
                )}
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
    sectionHeader: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacerM,
    },
    caption: {
        color: NEUTRAL_300,
        letterSpacing: 1,
        flexShrink: 1,
    },
});

export default TariffListView;
