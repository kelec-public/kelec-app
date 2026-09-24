import { View } from "react-native";
import { useEffect, useState } from "react";
import commonStyles from "../../../lib/graphics/commonStyle";
import CarType from "../../../lib/clients/cars/carTypes/carType";
import { ChargeMonth } from "../models/ChargeMonth";
import ChargeMonthHeader from "./ChargeMonthHeader";
import ChargeCard from "./ChargeCard";

type Props = {
    readonly month: ChargeMonth;
    readonly carType: CarType;
    readonly isFirst: boolean; // premier mois de la liste : déplié par défaut
}

function ChargeMonthSection({ month, carType, isFirst }: Props): React.JSX.Element {
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        if (isFirst) setExpanded(true);
    }, [isFirst]);

    return (
        <View>
            <ChargeMonthHeader month={month} expanded={expanded} onToggle={() => setExpanded(!expanded)} />
            {expanded && month.charges.map((charge, index) => (
                <View key={charge.getStartDate().toISOString()}>
                    <ChargeCard charge={charge} carType={carType} />
                    {index !== month.charges.length - 1 && (
                        <View style={[commonStyles.navSeparator, { marginVertical: 5, marginHorizontal: 15 }]}></View>
                    )}
                </View>
            ))}
        </View>
    )
};

export default ChargeMonthSection;
