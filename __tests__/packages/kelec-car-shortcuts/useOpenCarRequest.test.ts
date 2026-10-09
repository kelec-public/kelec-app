import { DeviceEventEmitter, NativeModules } from "react-native";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { useOpenCarRequest } from "../../../src/packages/kelec-car-shortcuts";

// module natif simulé : une demande en attente, lue une seule fois
let pendingVin: string | null = null;
const nativeModule = {
    consume: jest.fn(async () => {
        const vin = pendingVin;
        pendingVin = null;
        return vin;
    }),
    addListener: jest.fn(),
    removeListeners: jest.fn(),
};

const setNativeModule = (available: boolean) => {
    NativeModules.OpenCarRequests = available ? nativeModule : undefined;
};

beforeEach(() => {
    pendingVin = null;
    nativeModule.consume.mockClear();
});

afterAll(() => {
    delete NativeModules.OpenCarRequests;
});

test("app lancée par une demande : la voiture est ouverte au montage", async () => {
    pendingVin = "VIN2";
    setNativeModule(true);
    const onOpenCar = jest.fn();

    renderHook(() => useOpenCarRequest(onOpenCar));

    await waitFor(() => expect(onOpenCar).toHaveBeenCalledWith("VIN2"));
    expect(onOpenCar).toHaveBeenCalledTimes(1);
});

test("app déjà ouverte : chaque nouvelle demande ouvre sa voiture", async () => {
    setNativeModule(true);
    const onOpenCar = jest.fn();

    renderHook(() => useOpenCarRequest(onOpenCar));
    await waitFor(() => expect(nativeModule.consume).toHaveBeenCalledTimes(1));
    expect(onOpenCar).not.toHaveBeenCalled();

    pendingVin = "VIN1";
    await act(async () => {
        DeviceEventEmitter.emit("openCarRequested");
    });

    await waitFor(() => expect(onOpenCar).toHaveBeenCalledWith("VIN1"));
});

test("plus d'ouverture après le démontage", async () => {
    setNativeModule(true);
    const onOpenCar = jest.fn();

    const { unmount } = renderHook(() => useOpenCarRequest(onOpenCar));
    await waitFor(() => expect(nativeModule.consume).toHaveBeenCalledTimes(1));
    unmount();

    pendingVin = "VIN1";
    await act(async () => {
        DeviceEventEmitter.emit("openCarRequested");
    });

    expect(onOpenCar).not.toHaveBeenCalled();
    expect(pendingVin).toBe("VIN1"); // la demande reste pour la prochaine page des voitures
});

test("sans module natif (tests, ancienne version) : rien ne se passe", async () => {
    setNativeModule(false);
    const onOpenCar = jest.fn();

    renderHook(() => useOpenCarRequest(onOpenCar));

    await act(async () => { });
    expect(onOpenCar).not.toHaveBeenCalled();
    expect(nativeModule.consume).not.toHaveBeenCalled();
});
