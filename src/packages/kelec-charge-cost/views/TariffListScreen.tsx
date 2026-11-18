import { useTariffList } from "../controllers/useTariffList";
import TariffListView from "./TariffListView";

type Props = {
    /** Voiture dont on affiche les tarifs. */
    readonly vin: string;
    readonly onBack: () => void;
    /** `tariffId` absent : nouveau tarif. */
    readonly onOpenTariff: (tariffId?: string) => void;
};

/** Page des tarifs d'une voiture (route `TARIFF_LIST_ROUTE`). */
function TariffListScreen({ vin, onBack, onOpenTariff }: Props): React.JSX.Element | null {
    const { settings, setCurrency } = useTariffList(vin);
    if (!settings) return null;

    return (
        <TariffListView
            settings={settings}
            onBack={onBack}
            onSelectCurrency={setCurrency}
            onEditTariff={id => onOpenTariff(id)}
            onAddTariff={() => onOpenTariff()}
        />
    );
}

export default TariffListScreen;
