import { createContext, useContext } from 'react';
import { View } from 'react-native';
import { vars } from 'nativewind';

export type ColorScheme = 'dark' | 'light';

// CSS variable values applied to the root View via NativeWind vars()
const darkVars = vars({
    '--background': '#000000',
    '--surface': '#27272a',
    '--surface-light': '#3f3f46',
    '--surface-dark': '#18181b',
    '--text': '#ffffff',
    '--text-muted': '#a1a1aa',
    '--text-dark': '#52525b',
    '--card': '#18181b',
    '--card-light': '#27272a',
    '--card-dark': '#09090b',
    '--modal': '#18181b',
});

const lightVars = vars({
    '--background': '#fafafa',
    '--surface': '#f4f4f5',
    '--surface-light': '#e4e4e7',
    '--surface-dark': '#ffffff',
    '--text': '#09090b',
    '--text-muted': '#71717a',
    '--text-dark': '#a1a1aa',
    '--card': '#ffffff',
    '--card-light': '#f4f4f5',
    '--card-dark': '#e4e4e7',
    '--modal': '#ffffff',
});

// Plain hex values for components that need inline colors (icons, Calendar theme, etc.)
export const THEME_COLORS = {
    dark: {
        background: '#000000',
        surface: '#27272a',
        surfaceLight: '#3f3f46',
        surfaceDark: '#18181b',
        text: '#e4e4e7',
        textMuted: '#a1a1aa',
        textDark: '#52525b',
        card: '#18181b',
        cardLight: '#27272a',
        modal: '#18181b',
    },
    light: {
        background: '#fafafa',
        surface: '#f4f4f5',
        surfaceLight: '#e4e4e7',
        surfaceDark: '#ffffff',
        text: '#18181b',
        textMuted: '#71717a',
        textDark: '#a1a1aa',
        card: '#ffffff',
        cardLight: '#f4f4f5',
        modal: '#ffffff',
    },
} as const;

const ThemeColorsContext = createContext(THEME_COLORS.dark);

export function useThemeColors() {
    return useContext(ThemeColorsContext);
}

export function ThemeProvider({ children, colorScheme }: { children: React.ReactNode; colorScheme: ColorScheme }) {
    return (
        <ThemeColorsContext.Provider value={THEME_COLORS[colorScheme]}>
            <View style={[{ flex: 1 }, colorScheme === 'light' ? lightVars : darkVars]}>
                {children}
            </View>
        </ThemeColorsContext.Provider>
    );
}
