import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import AlertHost from './src/components/AlertHost';
import { useAppFonts } from './src/shared/theme/useAppFonts';
import { colors } from './src/shared/theme';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 2 } },
});

/**
 * Without this, NavigationContainer falls back to its built-in light theme —
 * the substrate every screen sits on before its own background paints. Every
 * translucent glass surface in the app (bottom sheets, the floating tab bar,
 * screen-transition edges) was designed assuming a dark field underneath, so
 * an unthemed container is what made those surfaces read as washed-out/faded
 * instead of dark glass. Reuses RN Navigation's own DarkTheme.fonts (unused
 * here — every screen renders its own header) and overrides only colors.
 */
const navigationTheme = {
  ...DarkTheme,
  dark: true,
  colors: {
    ...DarkTheme.colors,
    primary: colors.gold,
    background: colors.canvas,
    card: colors.canvas,
    text: colors.ink,
    border: colors.border,
    notification: colors.danger,
  },
};

export default function App() {
  const { fontsLoaded, fontError } = useAppFonts();

  // Hold rendering until brand fonts are ready (or font loading failed).
  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.splashBg }}>
        <ActivityIndicator size="small" color={colors.gold} />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <NavigationContainer theme={navigationTheme}>
          <RootNavigator />
        </NavigationContainer>
        <AlertHost />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
