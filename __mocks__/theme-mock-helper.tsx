import { renderHook } from "@testing-library/react-native";
import { useAutoTheme } from '../theme/theme';

export type Theme = ReturnType<typeof useAutoTheme>;

export const getThemeFor = (
  mockUseColorScheme: jest.Mock,
  scheme: 'light' | 'dark'
): Theme => {
  mockUseColorScheme.mockReturnValue(scheme);
  const { result, unmount } = renderHook(() => useAutoTheme());
  const theme = result.current;
  unmount();
  return theme;
};

export const setupThemes = (mockUseColorScheme: jest.Mock) => {
  let lightTheme: Theme;
  let darkTheme: Theme;

  beforeAll(() => {
    lightTheme = getThemeFor(mockUseColorScheme, 'light');
    darkTheme = getThemeFor(mockUseColorScheme, 'dark');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  return {
    getLight: () => lightTheme,
    getDark: () => darkTheme,
  };
};