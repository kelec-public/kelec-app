import { useTariffEditor } from "../controllers/useTariffEditor";
import TariffEditorView from "./TariffEditorView";

type Props = {
    /** Voiture dont on saisit un tarif. */
    readonly vin: string;
    readonly tariffId?: string;
    readonly onBack: () => void;
    /** Après l'enregistrement ou la suppression (en général : retour à la liste). */
    readonly onDone: () => void;
};

/** Page de saisie d'un tarif (route `TARIFF_EDITOR_ROUTE`). */
function TariffEditorScreen({ vin, tariffId, onBack, onDone }: Props): React.JSX.Element | null {
    const controller = useTariffEditor(vin, tariffId, onDone);
    const { settings, draft } = controller;
    if (!settings || !draft) return null;

    return (
        <TariffEditorView
            draft={draft}
            tariffs={settings.tariffs}
            currency={settings.currency}
            canDelete={controller.canDelete}
            onChange={controller.updateDraft}
            onSave={controller.save}
            onDelete={controller.remove}
            onBack={onBack}
        />
    );
}

export default TariffEditorScreen;
