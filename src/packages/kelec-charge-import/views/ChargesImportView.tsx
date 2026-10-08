import { useContext } from "react";
import { StyleSheet, View } from "react-native";
import MainContext from "../../../lib/Contexts/MainContext";
import StepLayout from "../../kelec-model/view/StepLayout";
import { spacerXL } from "../../kelec-model/view/Spacers";
import Text from "../../../screen/Common/CustomText";
import InfoPopup from "../../../screen/Common/InfoPopup";
import { useChargesImportController } from "../controllers/useChargesImportController";
import ImportFilePickerCard from "./ImportFilePickerCard";
import ImportPreviewSection from "./ImportPreviewSection";

type Props = {
    /** Fermeture de l'écran, sans import ou une fois les charges enregistrées. */
    readonly onClose: () => void;
};

/** Écran d'import d'un fichier exporté depuis l'historique de charge. */
function ChargesImportView({ onClose }: Props): React.JSX.Element {
    const { languageHandler } = useContext(MainContext);
    const t = (key: string) => languageHandler.getTranslation(key);
    const controller = useChargesImportController(onClose);
    const { preview, summary } = controller;

    const fill = (key: string, count: number) => t(key).replace('{count}', String(count));

    return (
        <StepLayout
            testID="ChargesImportView"
            // la barre d'onglets gère déjà le bas de l'écran
            safeAreaEdges={['top']}
            title={t("importCharges")}
            subtitle={t("importChargesDescription")}
            onDismiss={onClose}
            onNext={controller.confirmImport}
            nextLabel={t("import")}
            nextButtonTestID="confirmImportButton"
            disableNext={!controller.canImport}
            isLightLoading={controller.isSaving}
        >
            <View style={styles.content}>
                <InfoPopup backgroundColour={'#FFCCB3'} icon={"warning"} iconColour={'#7A1F1F'}>
                    <Text style={styles.calloutText} testID="importExperimentalCallout">
                        {t("importChargeExperimentalDescription")}
                    </Text>
                </InfoPopup>
                <ImportFilePickerCard
                    title={t("selectFile")}
                    subtitle={t("acceptedImportFormat")}
                    fileName={controller.fileName}
                    isLoading={controller.isReading}
                    onPress={controller.pickFile}
                />
                {preview && summary && (
                    <>
                        {preview.newCharges.length === 0 && (
                            <Text testID="noNewCharges">{t("noNewChargesToImport")}</Text>
                        )}
                        <ImportPreviewSection
                            summary={summary}
                            labels={{
                                title: t("importPreview"),
                                charges: t("charges"),
                                energy: t("totalEnergy"),
                                time: t("totalChargingTime"),
                                alreadyKnown: preview.alreadyKnownCount > 0
                                    ? fill("importAlreadyKnownCharges", preview.alreadyKnownCount) : undefined,
                                rejected: preview.rejectedLines.length > 0
                                    ? fill("importRejectedLines", preview.rejectedLines.length) : undefined,
                            }}
                        />
                    </>
                )}
            </View>
        </StepLayout>
    );
}

const styles = StyleSheet.create({
    content: {
        gap: spacerXL,
        paddingTop: spacerXL,
    },
    calloutText: {
        color: 'black',
        flexShrink: 1,
    },
});

export default ChargesImportView;
