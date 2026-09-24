import { useContext } from "react";
import { Image, Linking, StyleSheet, TouchableOpacity, View } from "react-native";
import MainContext from "../../../lib/Contexts/MainContext";
import Text from "../../../screen/Common/CustomText";
import { DropDownType } from "../../../screen/Common/DropDown";
import { PRIMARY_COLOUR } from "../../kelec-model/lib/colours";
import { spacerM } from "../../kelec-model/view/Spacers";
import { subTitle } from "../../kelec-model/view/Titles";
import StepLayout from "../../kelec-model/view/StepLayout";
import SwitchCard from "../../kelec-model/view/SwitchCard";
import { useCarTypeForm } from "../controllers/useCarTypeForm";
import { CarCatalog } from "../services/carCatalog";
import { CarTypeRouteParams } from "../routes";
import AsyncDropDown from "./AsyncDropDown";
import ChargeLimitSlider from "./ChargeLimitSlider";
import LeasingCard from "./LeasingCard";

const CAR_NOT_LISTED_MAIL = 'mailto:contact@kelec.app?subject=Kelec new model&body=I have the following 100% electric cars that is not listed in Kelec: ';

type Props = {
    readonly navigation: { goBack: () => void };
    readonly route: { params: CarTypeRouteParams };
    /** Appelé une fois le modèle enregistré (fourni par le navigateur : fin de l'ajout, retour à la page voiture…). */
    readonly onConfirmed: () => void | Promise<void>;
};

/** Formulaire du modèle de la voiture : marque, modèle, batterie, limite de charge, leasing, V2G. */
const CarTypeScreen = ({ navigation, route, onConfirmed }: Props) => {
    const { languageHandler } = useContext(MainContext);
    const t = (key: string) => languageHandler.getTranslation(key);
    const { vin, imageUrl, titleKey, subTitleKey, nextButtonTextKey, safeAreaEdges } = route.params;

    const controller = useCarTypeForm(vin);
    const { form, showErrors } = controller;

    return (
        <StepLayout
            testID="carModelChoiceStep"
            title={t(titleKey)}
            subtitle={subTitleKey ? t(subTitleKey) : undefined}
            safeAreaEdges={safeAreaEdges}
            onPrevious={() => navigation.goBack()}
            nextButtonTestID="confirmCarModelChoice"
            nextLabel={t(nextButtonTextKey ?? "next")}
            onNext={async () => {
                if (await controller.submit()) {
                    await onConfirmed();
                }
            }}
        >
            <View style={{ gap: spacerM }}>
                <Image source={{ uri: imageUrl }} style={styles.mainCarImage} />

                <AsyncDropDown
                    testID="brandDropdown"
                    title="carBrand"
                    dropDownType={DropDownType.BRAND}
                    loadOptions={CarCatalog.brandOptions}
                    value={form.brand}
                    onChange={controller.setBrand}
                    error={showErrors}
                />

                {form.brand && (
                    <AsyncDropDown
                        testID="modelDropdown"
                        title="carModel"
                        dropDownType={DropDownType.MODEL}
                        loadOptions={() => CarCatalog.modelOptions(form.brand!.value as string)}
                        value={form.model}
                        onChange={controller.setModel}
                        listener={form.brand}
                        error={showErrors}
                    />
                )}

                {form.model && (
                    <AsyncDropDown
                        testID="batteryDropdown"
                        title="battery"
                        dropDownType={DropDownType.BATTERY}
                        loadOptions={() => CarCatalog.batteryOptions(form.brand!.value as string, form.model!.value as string)}
                        value={form.battery}
                        onChange={controller.setBattery}
                        listener={form.model}
                        error={showErrors}
                    />
                )}

                <TouchableOpacity testID="carNotListedButton" onPress={() => { Linking.openURL(CAR_NOT_LISTED_MAIL); }}>
                    <Text style={[subTitle, styles.inlineButton]}>
                        {t("myCarIsNotListed")}
                    </Text>
                </TouchableOpacity>

                {controller.showChargingLimit && (
                    <ChargeLimitSlider chargingLimit={form.chargingLimit} setChargingLimit={controller.setChargingLimit} />
                )}

                <LeasingCard isError={showErrors} leasingData={form.leasing} setLeasingData={controller.setLeasing} />

                <SwitchCard
                    testID="V2GCompatibleSwitch"
                    icon="ev-station"
                    label={t("myCarSupportsV2G")}
                    value={form.supportsV2G}
                    onValueChange={controller.setSupportsV2G}
                />
            </View>
        </StepLayout>
    );
};

const styles = StyleSheet.create({
    mainCarImage: {
        width: '100%',
        height: 180,
        resizeMode: 'contain',
    },
    inlineButton: {
        color: PRIMARY_COLOUR,
        textAlign: 'center',
        textDecorationLine: 'underline',
    },
});

export default CarTypeScreen;
