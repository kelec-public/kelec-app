import { ActivityIndicator, FlatList, Modal, Platform, ScrollView, Share, StyleSheet, TouchableOpacity, View, useColorScheme } from "react-native";
import Text from "../../../../Common/CustomText";
import commonStyles, { fontFamilyBold, fontWeightBold } from "../../../../../lib/graphics/commonStyle";
import { getBlackColour, getGrayWhiteBackgroundColour, getWhiteColour } from "../../../../../lib/graphics/utils";
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import MainContext from "../../../../../lib/Contexts/MainContext";
import RenaultChargesHandler from "../../../../../lib/clients/apiHandlers/renaultChargesHandler";
import CarType from "../../../../../lib/clients/cars/carTypes/carType";
import BigButton, { ButtonColours } from "../../../../Common/BigButton";
import CarsViewContext from "../../../../../lib/Contexts/CarsViewContext";
import { DocumentDirectoryPath, writeFile } from "react-native-fs";
import XLSX from 'xlsx';
import ChargesFiltersView from "./FiltersView/FiltersView";
import ShareThirdPart from 'react-native-share';
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import ChargeMonthContent from "./ChargeMonthContent";
import { Filter, FilterName } from "../../../../../lib/model/filters/FiltersStruct";
import ChargesViewContext from "../../../../../lib/Contexts/ChargesViewContext";
import { getFilterMax, getFilterMin, getFilterUnit } from "../../../../../lib/model/filters/FiltersHandlers";
import BottomSheet from "../../../../Common/bottomSheet/BottomSheet";


type ChargesViewProps = {
    readonly navigation: any;
    readonly route: any;
}

type RouteParams = {
    charges: RenaultChargesHandler;
    carType: CarType;
}

function ChargesView({ navigation, route }: ChargesViewProps): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';

    const { languageHandler, appPreferences } = useContext(MainContext);
    const { handleModalAnim } = useContext(CarsViewContext);
    const { charges, carType }: RouteParams = route.params;


    // sort charges by desc date
    const [sortDesc, setSortDesc] = useState(true);

    // to store filters
    const [filters, setFilters] = useState<Filter[]>([]);
    // modal for filters view
    const [showFiltersModal, setShowFiltersModal] = useState(false);

    // modal for export and sort
    const [shouldOpenModal, setShouldOpenModal] = useState(false);

    // to store current displayed charges
    const [displayedMonths, setDisplayedMonths] = useState<number>(2);
    const [displayedCharges, setDisplayedCharges] = useState(RenaultChargesHandler.buildChargesIndex(filters, charges.charges, appPreferences, sortDesc, displayedMonths));

    useEffect(() => {
        setDisplayedCharges(RenaultChargesHandler.buildChargesIndex(filters, charges.charges, appPreferences, sortDesc, displayedMonths));
    }, [filters, sortDesc, displayedMonths]);

    const applyFilter = useCallback((filter: Filter): void => {
        // check if filter already exists
        if (!filters.some(f => f.filterName === filter.filterName)) {
            // it is not the case, add it
            setFilters([...filters, filter]);
        } else {
            // it is the case, replace it
            const index = filters.findIndex(f => f.filterName === filter.filterName);
            const newFilters = [...filters];
            newFilters[index] = filter;
            setFilters(newFilters);
        }
    }, [filters]);


    const removeFilter = useCallback((filterName: string): void => {
        const newFilters = filters.filter(f => f.filterName !== filterName);
        setFilters(newFilters);
    }, [filters]);


    // charges view context
    const chargesViewContextValues = useMemo(() => ({
        filters: filters,
        setFilters: setFilters,
        applyFilter: applyFilter,
        removeFilter: removeFilter,
    }), [filters]);


    const displayFiltersRow = (): React.JSX.Element => {
        return (
            <ScrollView
                horizontal={true}
                showsHorizontalScrollIndicator={false}
            >
                <View style={{
                    flexDirection: 'row',
                    padding: 10,
                    gap: 10,
                }}>
                    <TouchableOpacity
                        testID="showFiltersButton"
                        onPress={() => {
                            setShowFiltersModal(true);
                            handleModalAnim(true);
                        }}
                        style={{
                            backgroundColor: getGrayWhiteBackgroundColour(isDarkMode),
                            flexDirection: 'row',
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: 10,
                            minWidth: 100,
                            borderRadius: 15
                        }}
                    >
                        <Icon name="filter-list" size={15} color={getBlackColour(isDarkMode)} />
                        <Text
                            numberOfLines={1}
                            style={{
                                fontSize: 15,
                                color: getBlackColour(isDarkMode),
                                marginLeft: 10
                            }}>
                            {languageHandler.getTranslation("filters")}
                        </Text>
                    </TouchableOpacity>
                    {/* iterate over filters */}
                    {filters.map((filter, _) => {
                        const formatFilterDisplay = () => {
                            if (filter.filterName === FilterName.ONLY_DC) {
                                return languageHandler.getTranslation("showOnlyDcCharges");
                            }

                            let baseString = "";
                            if (getFilterMin(filter) !== 0) {
                                baseString += getFilterMin(filter) + getFilterUnit(filter) + " < ";
                            }
                            baseString += languageHandler.getTranslation(filter.displayName);
                            if (getFilterMax(filter) !== 9999) {
                                baseString += " < " + getFilterMax(filter) + getFilterUnit(filter);
                            }
                            return baseString;
                        }
                        return (
                            <TouchableOpacity
                                onPress={() => {
                                    removeFilter(filter.filterName);
                                }}
                                testID="filterListButton"
                                style={{
                                    backgroundColor: getGrayWhiteBackgroundColour(isDarkMode),
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    padding: 10,
                                    borderRadius: 15,
                                    gap: 7
                                }}
                                key={filter.filterName}
                            >

                                <Text style={{
                                    fontSize: 15,
                                    color: getBlackColour(isDarkMode),
                                    marginLeft: 10
                                }}>{formatFilterDisplay()}
                                </Text>
                                <Icon name="close" size={15} color={getBlackColour(isDarkMode)} style={{ marginTop: 2 }} />
                            </TouchableOpacity>
                        )

                    })}

                </View>
            </ScrollView>
        )
    };



    return (
        <SafeAreaView
            style={[commonStyles.flex, { backgroundColor: getWhiteColour(isDarkMode), position: 'relative' }]}
            testID="ChargesView"
        >
            <ChargesViewContext.Provider value={chargesViewContextValues}>
                <BottomSheet
                    title={languageHandler.getTranslation("chargeHistory")}
                    testID="chargesViewModal"
                    onClose={() => {
                        setShouldOpenModal(false);
                        handleModalAnim(false);
                    }}
                    visible={shouldOpenModal}
                >
                    <View style={styles.modalContent}>
                        <BigButton
                            testID={'sortButton'}
                            onPress={async () => {
                                setSortDesc(!sortDesc);
                                setDisplayedMonths(2);
                            }}
                            icon="sort"
                            text={sortDesc ? languageHandler.getTranslation("sortNewerToOlder")
                                : languageHandler.getTranslation("sortOlderToNewer")}
                            colour={ButtonColours.SECONDARY}
                        />
                        <BigButton
                            testID={'exportButton'}
                            onPress={async () => {

                                let toExport: any[] = [];
                                toExport = charges.getCharges();
                                // filter charges
                                toExport = RenaultChargesHandler.applyFilters(filters, toExport);
                                // sort charges  by chargeStartDate
                                toExport.sort((a, b) => {
                                    return sortDesc ? b.getStartDate().getTime() - a.getStartDate().getTime() : a.getStartDate().getTime() - b.getStartDate().getTime();
                                });

                                // edit chargeStartDate to match local time
                                toExport = toExport.map(charge => {
                                    return {
                                        ...charge,
                                        chargeStartDate: charge.getStartDate().toLocaleString(),
                                        chargeEndDate: charge.getEndDate().toLocaleString(),
                                    }
                                });
                                const wb = XLSX.utils.book_new();
                                const ws = XLSX.utils.json_to_sheet(toExport);
                                XLSX.utils.book_append_sheet(wb, ws, "Charges");
                                const wbout = XLSX.write(wb, { type: 'binary', bookType: "xlsx" });

                                if (Platform.OS === 'ios') {
                                    const path = `${DocumentDirectoryPath}/export${Date.now()}.xlsx`;
                                    try {
                                        await writeFile(path, wbout, 'ascii');

                                        Share.share({
                                            url: 'file://' + path,
                                        })
                                            .then(res => {
                                                console.log(res);
                                            })
                                            .catch(err => {
                                                err && console.log(err);
                                            });

                                    } catch (e) {
                                        console.log('error', e);
                                    }
                                } else {
                                    const path = `${DocumentDirectoryPath}/export${Date.now()}.xlsx`;
                                    try {
                                        await writeFile(path, wbout, 'ascii');

                                        const fileUri = `file://${path}`;
                                        const shareOptions = {
                                            title: 'Share Excel File',
                                            url: fileUri, // content:// URI for external sharing
                                            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                                        };
                                        ShareThirdPart.open(shareOptions)
                                            .then((res) => {
                                                console.log(res);
                                            })
                                            .catch((err) => {
                                                err && console.log(err);
                                            });

                                    } catch (e) {
                                        console.log('error', e);
                                    }
                                }

                            }}
                            icon={"ios-share"}
                            text={languageHandler.getTranslation("export")}
                            colour={ButtonColours.SECONDARY}
                        />
                    </View>
                </BottomSheet>
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={showFiltersModal}
                    onRequestClose={() => {
                        setShowFiltersModal(false);
                        handleModalAnim(false);
                    }}
                >
                    <SafeAreaProvider>
                        <ChargesFiltersView
                            setShouldOpenModal={setShowFiltersModal}
                            handleModalAnim={handleModalAnim}
                        />
                    </SafeAreaProvider>
                </Modal>
                <View>
                    <View style={
                        [commonStyles.rowFlex, commonStyles.spaceBetween, commonStyles.paddingHorizontal]
                    }>
                        <TouchableOpacity
                            testID="backButton"
                            onPress={() => {
                                navigation.goBack();
                            }}>
                            <Icon name="chevron-left" size={30} color={getBlackColour(isDarkMode)} />
                        </TouchableOpacity>
                        <Text style={[styles.titleText, { color: getBlackColour(isDarkMode), flexShrink: 1, flexWrap: 'wrap' }]} numberOfLines={1} adjustsFontSizeToFit>{languageHandler.getTranslation("chargeHistory")}</Text>
                        <TouchableOpacity
                            testID="openModal"
                            onPress={() => {
                                setShouldOpenModal(true);
                                handleModalAnim(true);
                            }}
                        >
                            <Icon name="more-horiz" size={30} color={getBlackColour(isDarkMode)} />
                        </TouchableOpacity>
                    </View>
                    {displayFiltersRow()}
                    <View style={commonStyles.navSeparator}></View>
                </View>
                <FlatList
                    data={displayedCharges}
                    keyExtractor={(item) => item.monthYear}
                    renderItem={({ item: chargeIndex }) => (

                        <ChargeMonthContent carType={carType} chargeIndex={chargeIndex} isFirst={chargeIndex.monthYear === displayedCharges[0].monthYear} />
                    )}
                    onEndReached={() => {
                        setDisplayedMonths(displayedMonths + 1);
                    }}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={displayedMonths < RenaultChargesHandler.getLastMonthIndex(charges.charges, filters) ? <ActivityIndicator size="large" color="#0000ff" /> : null}
                />
            </ChargesViewContext.Provider>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    titleText: {
        textAlign: 'center',
        paddingHorizontal: 10,
        fontWeight: fontWeightBold,
        fontFamily: fontFamilyBold,
        fontSize: 25,
    },
    modalView: {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 12,
        },
        shadowOpacity: 1,
        shadowRadius: 16.00,
        elevation: 24,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    modalContent: {
        marginTop: 10,
        gap: 10
    },
});

export default ChargesView;