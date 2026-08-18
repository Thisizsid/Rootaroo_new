import React from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, Image, Alert } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { colors, fonts, radius } from '../shared/theme';
import { startPhoneSignupProgress } from '../shared/navigation/postAuthNavigation';
import { useGoogleSignIn } from '../shared/hooks/useGoogleSignIn';
/* Small inline icons (stroke = ink, like the mockup) */
function PhoneIcon() {
  return (
    <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <Rect x="7" y="2" width="10" height="20" rx="2" stroke={colors.ink} strokeWidth="1.6" />
      <Path d="M11 19h2" stroke={colors.ink} strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}
function MailIcon() {
  return (
    <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="5" width="18" height="14" rx="2" stroke={colors.ink} strokeWidth="1.6" />
      <Path d="M3 7l9 6 9-6" stroke={colors.ink} strokeWidth="1.6" strokeLinejoin="round" />
    </Svg>
  );
}
function AppleIcon() {
  return (
    <Svg width="16" height="16" viewBox="0 0 24 24" fill={colors.onAccent}>
      <Path d="M16.5 1.5c0 1-.4 2-1 2.7-.7.8-1.8 1.4-2.8 1.3-.1-1 .4-2 1-2.7.7-.8 1.9-1.4 2.8-1.3zM20.6 17c-.6 1.3-1.3 2.6-2.3 3.8-.9 1.1-1.9 2.2-3.3 2.2-1.3 0-1.8-.8-3.3-.8s-2 .8-3.3.8c-1.3 0-2.4-1.2-3.3-2.3-1.8-2.2-3.2-6.2-1.3-9 .9-1.4 2.5-2.3 4.2-2.3 1.3 0 2.5.9 3.3.9.8 0 2.2-1.1 3.8-.9.6 0 2.5.3 3.7 2-3.2 1.8-2.7 6 .8 6.6z" />
    </Svg>
  );
}
function GoogleChip() {
  return (
    <Image
      source={require('../../assets/images/google-g.png')}
      style={{
        width: 18,
        height: 18,
        borderRadius: 4,
      }}
    />
  );
}
const appleActive = 0;
export default function ChooseMethodScreen({ navigation }) {
  const { signIn: googleSignIn, isLoading: googleLoading } = useGoogleSignIn(async (resp) => {
    // Home handled inside resolve via completeSetup
    void resp;
  });
  const handleApple = () => {
    if (appleActive === 0) {
      Alert.alert(
        'Apple sign-in',
        'Apple sign-in is coming soon. Use Google, Phone, or Email for now.',
      );
    }
  };
  const handlePhone = async () => {
    try {
      await startPhoneSignupProgress();
      navigation.navigate('SignupStepName');
    } catch (e) {
      // Surface minimal error; flow continues to the step screen anyway.
      navigation.navigate('SignupStepName');
    }
  };
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.canvas} />

      {/* Header: back chevron only (matches ref image) */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{
            top: 10,
            bottom: 10,
            left: 20,
            right: 20,
          }}
          style={styles.backBtn}
        >
          <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <Path
              d="M15 5l-7 7 7 7"
              stroke={colors.ink}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
      </View>

      {/* Title */}
      <View style={styles.body}>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Choose how you'd like to get started.</Text>

        {/* Method buttons */}
        <View style={styles.methods}>
          <TouchableOpacity
            style={[styles.methodBtn, styles.methodBtnLight]}
            activeOpacity={0.8}
            onPress={() => googleSignIn()}
            disabled={googleLoading}
          >
            <GoogleChip />
            <Text style={styles.methodTextLight}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.methodBtn, styles.methodBtnDark]}
            activeOpacity={0.85}
            onPress={handleApple}
          >
            <AppleIcon />
            <Text style={styles.methodTextDark}>Continue with Apple</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.methodBtn, styles.methodBtnLight]}
            activeOpacity={0.8}
            onPress={handlePhone}
          >
            <PhoneIcon />
            <Text style={styles.methodTextLight}>Continue with Phone</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.methodBtn, styles.methodBtnLight]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('SignUp')}
          >
            <MailIcon />
            <Text style={styles.methodTextLight}>Continue with Email</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 16,
    marginBottom: 0,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 20,
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 24,
    lineHeight: 31.2,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    marginBottom: 28,
  },
  active: {
    transform: [
      {
        scale: 0.97,
      },
    ],
  },
  methods: {
    gap: 14,
  },
  methodBtn: {
    height: 54,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  methodBtnLight: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  methodBtnDark: {
    backgroundColor: colors.surfaceRaised,
  },
  methodTextLight: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    lineHeight: 15,
    color: colors.ink,
  },
  methodTextDark: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    lineHeight: 15,
    color: colors.onAccent,
  },
});
