import { useTariffList } from "../controllers/useTariffList";
import TariffListView from "./TariffListView";

type Props = {
    readonly onBack: () => void;
    /** `tariffId` absent : nouveau tarif. */
    readonly onOpenTariff: (tariffId?: string) => void;
};

/** Page des tarifs (route `TARIFF_LIST_ROUTE`). */
function TariffListScreen({ onBack, onOpenTariff }: Props): React.JSX.Element | null {
    const { settings, setCurrency } = useTariffList();
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
