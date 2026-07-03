import { useCallback, useRef, useState } from "react";
import { Animated, LayoutChangeEvent, PanResponder, PanResponderGestureState, useColorScheme, View } from "react-native";
import { NEUTRAL_100, PRIMARY_COLOUR } from "../lib/colours";
import { getBlackColour } from "../../../lib/graphics/utils";

type SliderProps = {
    sliderLevel: number;
    setSliderLevel: (level: number) => void;
    stepper?: number;
    testID?: string;
    minimum?: number;
}
const Slider = (props: SliderProps) => {
    /* this component has been almost only vide coded with Claude */
    /* sorry if is is not perfect clean code */

    const isDarkMode = useColorScheme() === 'dark';

    const { sliderLevel, setSliderLevel, stepper, testID } = props;

    const SLIDE_HEIGHT = 10;
    const sliderWidth = useRef(0);
    const sliderPageX = useRef(0);
    const textWidth = useRef(0);

    const onPanMove = useCallback(
        async (_: any, _g: PanResponderGestureState) => {
            const pageX = _g.x0 + _g.dx;
            if (sliderWidth.current > 0) {
                const relativeX = pageX - sliderPageX.current;
                let newLevel = (relativeX / sliderWidth.current) * 100;
                newLevel = Math.max(props.minimum ?? 0, Math.min(100, newLevel));

                // compute the nearest 5%
                const actualStepper = stepper ?? 1;
                newLevel = Math.round(newLevel / actualStepper) * actualStepper;
                setSliderLevel(newLevel);
            }
        }, [],
    );


    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                const { dx, dy } = gestureState;

                // Activate only if horizontal movement is significantly larger than vertical
                const isHorizontal = Math.abs(dx) >= Math.abs(dy) * 1.5;

                return isHorizontal;
            },

            onPanResponderGrant: (evt, g) => {
                startAnimation();
                onPanMove(evt, g);
            },

            onPanResponderMove: onPanMove,

            onPanResponderRelease: () => stopAnimation(),
            onPanResponderTerminate: () => stopAnimation(),
            onPanResponderTerminationRequest: () => false,
        })
    ).current;


    const onLayout = (event: LayoutChangeEvent) => {
        const { width } = event.nativeEvent.layout;
        sliderWidth.current = width;
        event.target.measure((fx, fy, w, h, px, py) => {
            sliderPageX.current = px;
            forceUpdate({});
        });
    };

    const startAnimation = () => {
        Animated.parallel([
            Animated.spring(thumbScale, {
                toValue: 1.3,
                useNativeDriver: true,
                tension: 100,
                friction: 7,
            }),
            Animated.spring(textScale, {
                toValue: 1.3,
                useNativeDriver: true,
                tension: 100,
                friction: 7,
            })
        ]).start();
    };

    const stopAnimation = () => {
        Animated.parallel([
            Animated.spring(thumbScale, {
                toValue: 1,
                useNativeDriver: true,
                tension: 100,
                friction: 7,
            }),
            Animated.spring(textScale, {
                toValue: 1,
                useNativeDriver: true,
                tension: 100,
                friction: 7,
            })
        ]).start();
    };

    const thumbScale = useRef(new Animated.Value(1)).current;
    const textScale = useRef(new Animated.Value(1)).current;


    const onTextLayout = (event: LayoutChangeEvent) => {
        textWidth.current = event.nativeEvent.layout.width;
        forceUpdate({});
    };
    // Ajouter un state pour forcer le re-rendu
    const [, forceUpdate] = useState({}); // NOSONAR


    const getTextTranslateX = useCallback(() => {
        if (sliderWidth.current === 0 || textWidth.current === 0) {
            return -textWidth.current / 2;
        }

        const thumbPosition = (sliderLevel / 100) * sliderWidth.current;
        const textHalfWidth = textWidth.current / 2;

        if (thumbPosition - textHalfWidth < 0) {
            return -thumbPosition;
        }

        if (thumbPosition + textHalfWidth > sliderWidth.current) {
            return -(thumbPosition - sliderWidth.current) - textWidth.current;
        }

        return -textHalfWidth;
    }, [sliderLevel]);


    return (
        <View
            testID={testID}
            {...panResponder.panHandlers}
            style={{
                position: 'relative',
                paddingTop: 25,
            }}
            onLayout={onLayout}
        >
            <View
                style={{
                    width: '100%',
                    height: SLIDE_HEIGHT,
                    backgroundColor: NEUTRAL_100,
                }}
            />
            <View
                style={{
                    position: 'absolute',
                    top: 25,
                    left: 0,
                    height: SLIDE_HEIGHT,
                    width: `${sliderLevel}%`,
                    backgroundColor: PRIMARY_COLOUR,
                }}
            />
            {/* thumb */}
            <Animated.View
                style={{
                    position: 'absolute',
                    top: 20,
                    left: `${sliderLevel}%`,
                    transform: [
                        { translateX: -10 },
                        { scale: thumbScale }
                    ],
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: PRIMARY_COLOUR,
                    boxShadow: '0 0 5px rgba(0,0,0,0.3)',
                }}
            />
            {/* Texte du pourcentage */}
            <Animated.Text
                onLayout={onTextLayout}
                style={{
                    position: 'absolute',
                    top: -5,
                    left: `${sliderLevel}%`,
                    transform: [
                        { translateX: getTextTranslateX() },
                        { scale: textScale }
                    ],
                    fontSize: 12,
                    fontWeight: 'bold',
                    textAlign: 'center',
                    color: getBlackColour(isDarkMode),
                }}
                testID="chargingLimitText"
            >

                {Math.round(sliderLevel)}%
            </Animated.Text>
        </View>
    );

}

export default Slider;