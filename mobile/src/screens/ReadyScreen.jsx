import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  ActivityIndicator,
  Platform,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../shared/store/authStore';
import { updateSignupProgress } from '../shared/store/signupProgress';
import { colors, fonts, withAlpha } from '../shared/theme';
const FAMILY_COVER = require('../../assets/images/family-cover.png');
/**
 * Ready screen — matches design/auth-designs/screen12_youre_ready.html 1:1.
 * No progress bar / back button (final screen of the flow).
 * Layout: full-bleed background photo behind everything, darkened toward
 * the bottom with a gradient so the title/description/CTA stay readable
 * over whatever the photo looks like.
 */
export default function ReadyScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const completeSetup = useAuthStore((s) => s.completeSetup);
  const [loading, setLoading] = useState(false);
  const handleContinue = async () => {
    setLoading(true);
    try {
      // completeSetup() flips auth state, and RootNavigator swaps
      // AuthNavigator for MainTabs automatically.
      await updateSignupProgress({
        step: 'done',
        setupComplete: true,
      });
      completeSetup();
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.error || 'Failed to complete setup.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <ImageBackground source={FAMILY_COVER} style={styles.root} resizeMode="cover">
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Darken the photo top-to-bottom so the text/CTA stay readable
          regardless of what the photo looks like underneath. */}
      <LinearGradient
        colors={[
          withAlpha(colors.shadow, 0.05),
          withAlpha(colors.shadow, 0.15),
          withAlpha(colors.shadow, 0.78),
        ]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + (Platform.OS === 'ios' ? 8 : 16),
            paddingBottom: Math.max(insets.bottom, 70),
          },
        ]}
      >
        {/* Spacer pushes title/description/CTA to the bottom over the darkened area */}
        <View style={styles.spacer} />

        <View
          style={{
            paddingHorizontal: 34,
          }}
        >
          {/* Title + description + CTA (bottom of screen, CTA flush under text) */}
          <Text style={styles.title}>Welcome home.</Text>
          <Text style={styles.subtitle}>
            Everything is ready. Your family can now organize tasks, share moments, manage
            expenses, and stay connected in one place.
          </Text>

          <TouchableOpacity
            style={[styles.cta, loading && styles.ctaOff]}
            onPress={handleContinue}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={colors.onAccent} />
            ) : (
              <Text style={styles.ctaText}>Enter Rootaroo</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  content: {
    flex: 1,
  },
  spacer: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 26,
    lineHeight: 33,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: colors.onAccent,
    textAlign: 'center',
    marginTop: 22,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 14.5,
    lineHeight: 21,
    textAlign: 'center',
    color: withAlpha(colors.white, 0.85),
  },
  cta: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.goldWarm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  ctaOff: {
    backgroundColor: colors.btnDisabledBg,
  },
  ctaText: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
    color: colors.onAccent,
  },
});
