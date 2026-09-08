/**
 * App font loading — load once at app root before rendering screens.
 *
 * Nunito Sans — the global Rootaroo font, both UI/body text and
 *   display/heading text (fonts.body/bodyMedium/bodySemiBold/bodyBold/
 *   display/displayBold in typography.js). Swapping it for another font
 *   later means editing typography.js's `fonts` map and the corresponding
 *   entries here — nothing else.
 * Plus Jakarta Sans — no `fonts.*` token points at this anymore, but the
 *   weights stay loaded: a handful of existing screens (CommentsScreen,
 *   FeedScreen, CreatePostScreen, DashboardScreen) reference its
 *   family-name strings directly instead of through the token (see the
 *   typography audit) — removing these weights would silently break that
 *   unmigrated text rather than advance the font swap.
 * Inter — same reasoning: kept loaded for the same 4 screens' other
 *   hardcoded Inter references, not reachable via any `fonts.*` token.
 * JetBrains Mono — technical/monospace only (fonts.mono).
 * Caveat — NOT part of the `fonts.*` global system. A single one-off weight
 *   loaded only for the Dashboard greeting's handwritten style
 *   (DashboardScreen.jsx's `greetTitle`) — see that file for the exception.
 */
import { useFonts, NunitoSans_400Regular, NunitoSans_500Medium, NunitoSans_600SemiBold, NunitoSans_700Bold, NunitoSans_800ExtraBold } from '@expo-google-fonts/nunito-sans';
import { PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold } from '@expo-google-fonts/plus-jakarta-sans';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono';
import { Caveat_500Medium } from '@expo-google-fonts/caveat';

export function useAppFonts() {
  const [fontsLoaded, fontError] = useFonts({
    NunitoSans_400Regular,
    NunitoSans_500Medium,
    NunitoSans_600SemiBold,
    NunitoSans_700Bold,
    NunitoSans_800ExtraBold,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    JetBrainsMono_400Regular,
    Caveat_500Medium,
  });
  return { fontsLoaded, fontError };
}
