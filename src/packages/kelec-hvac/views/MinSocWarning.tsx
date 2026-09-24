import { useContext } from "react";
import MainContext from "../../../lib/Contexts/MainContext";
import Text from "../../../screen/Common/CustomText";
import InfoPopup from "../../../screen/Common/InfoPopup";

type Props = {
    readonly minimumSoc: number | null;
}

/** Batterie sous le SOC minimum requis pour la climatisation (ou minimum inconnu). */
function MinSocWarning({ minimumSoc }: Props): React.JSX.Element {
    const { languageHandler } = useContext(MainContext);

    return (
        <InfoPopup
            backgroundColour={minimumSoc == null ? '#FFCCB3' : '#F4B6B6'}
            icon={"warning"}
            iconColour={'#7A1F1F'}
        >
            {minimumSoc == null
                ? <Text style={{ color: 'black', flexShrink: 1 }}>{languageHandler.getTranslation("hvacMinSocUnknown")}</Text>
                : <Text style={{ color: 'black', flexShrink: 1 }}>{languageHandler.getTranslation("hvacUnderMinSoc")} {minimumSoc}%</Text>
            }
        </InfoPopup>
    );
}

export default MinSocWarning;
