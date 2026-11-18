import { useVehicleName } from "../controllers/useVehicleName";
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
    const vehicleName = useVehicleName(vin);
    if (!settings) return null;

    return (
        <TariffListView
            vehicleName={vehicleName}
            settings={settings}
            onBack={onBack}
            onSelectCurrency={setCurrency}
            onEditTariff={id => onOpenTariff(id)}
            onAddTariff={() => onOpenTariff()}
        />
    );
}

export default TariffListScreen;
