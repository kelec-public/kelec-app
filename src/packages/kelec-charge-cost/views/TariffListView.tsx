import { useContext } from "react";
import { StyleSheet, View } from "react-native";
import MainContext from "../../../lib/Contexts/MainContext";
import Text from "../../../screen/Common/CustomText";
import Button from "../../kelec-model/view/Button";
import KelecCard from "../../kelec-model/view/Card";
import TariffPageLayout from "./TariffPageLayout";
import { NEUTRAL_300, ORANGE_ONE } from "../../kelec-model/lib/colours";
import { spacerM, spacerS, spacerXL } from "../../kelec-model/view/Spacers";
import { subTitle2, textBody } from "../../kelec-model/view/Titles";
import { CURRENCIES, Currency, TariffSettings, toLocalDate } from "../models/Tariff";
import { tariffStatus } from "../services/tariffList";
import ChoicePills from "./ChoicePills";
import Badge from "./Badge";
import TariffCard from "./TariffCard";
import PriceRow from "./PriceRow";

type Props = {
    /** Voiture dont ce sont les tarifs (déjà mise en forme). */
    readonly vehicleName?: string;
    readonly settings: TariffSettings;
    readonly onBack: () => void;
    readonly onSelectCurrency: (currency: Currency) => void;
    /** Pertes à la recharge saisies (%), telles quelles. */
    readonly chargingLoss: string;
    readonly isChargingLossValid: boolean;
    readonly onChangeChargingLoss: (text: string) => void;
    readonly onEditTariff: (id: string) => void;
    readonly onAddTariff: () => void;
};

/** Devise, pertes à la recharge, puis une carte par tarif, le plus récent en haut. */
function TariffListView({
    vehicleName, settings, onBack, onSelectCurrency, chargingLoss, isChargingLossValid, onChangeChargingLoss, onEditTariff, onAddTariff,
}: Props): React.JSX.Element {
    const { languageHandler } = useContext(MainContext);
    const t = (key: string) => languageHandler.getTranslation(key);
    const today = toLocalDate(new Date());

    return (
        <TariffPageLayout
            testID="tariffListView"
            title={t("electricityTariff")}
            subtitle={vehicleName}
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
                <View style={styles.section}>
                    <Text style={[subTitle2, styles.caption]}>{t("chargingLoss").toUpperCase()}</Text>
                    <KelecCard>
                        <View style={styles.card}>
                            <PriceRow
                                testID="chargingLossInput"
                                icon="trending-down"
                                iconColour={ORANGE_ONE}
                                label={t("chargingLossLabel")}
                                value={chargingLoss}
                                onChangeText={onChangeChargingLoss}
                                unit="%"
                                placeholder="0"
                            />
                            <Text testID="chargingLossHint" style={[subTitle2, styles.hint]}>
                                {t(isChargingLossValid ? "chargingLossDescription" : "invalidChargingLoss")}
                            </Text>
                        </View>
                    </KelecCard>
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
    card: {
        // la carte (KelecCard) est en ligne : le contenu prend toute sa largeur
        flex: 1,
        gap: spacerM,
        padding: spacerS,
    },
    hint: {
        color: NEUTRAL_300,
    },
    caption: {
        color: NEUTRAL_300,
        letterSpacing: 1,
        flexShrink: 1,
    },
});

export default TariffListView;
