import { useEffect, useRef } from "react";
import { Animated } from "react-native";

/** Léger tremblement horizontal tant que `active` est vrai (mode édition), décalé de `delay` ms. */
export function useShakeAnimation(active: boolean, delay: number): Animated.Value {
    const offset = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!active) {
            offset.setValue(0);
            return;
        }

        const animation = Animated.sequence([
            Animated.delay(delay),
            Animated.loop(Animated.sequence([
                Animated.timing(offset, { toValue: 2, duration: 100, useNativeDriver: true }),
                Animated.timing(offset, { toValue: -2, duration: 100, useNativeDriver: true }),
                Animated.timing(offset, { toValue: 2, duration: 100, useNativeDriver: true }),
            ])),
        ]);
        animation.start();

        return () => {
            animation.stop();
            offset.setValue(0);
        };
    }, [active, delay, offset]);

    return offset;
}
