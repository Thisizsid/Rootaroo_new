import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { showAlert } from '../shared/services/themedAlert';
import Svg, { Path } from 'react-native-svg';
import SignupWizardShell from '../shared/components/SignupWizardShell';
import { authApi } from '../shared/api/auth';
import { updateSignupProgress } from '../shared/store/signupProgress';
import { useAuthStore } from '../shared/store/authStore';
import { colors, fonts } from '../shared/theme';
const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30;
export default function EmailVerificationScreen({ navigation, route }) {
  const email = route.params?.email || 'your email';
  const devCode = route.params?.code;
  const [otp, setOtp] = useState(() => {
    if (devCode) {
      const digits = devCode.split('').slice(0, OTP_LENGTH);
      while (digits.length < OTP_LENGTH) digits.push('');
      return digits;
    }
    return Array(OTP_LENGTH).fill('');
  });
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const [focusedIndex, setFocusedIndex] = useState(null);
  const inputs = useRef([]);
  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [countdown]);
  const handleChange = useCallback(
    (text, index) => {
      const digit = text.replace(/\D/g, '').slice(-1);
      const next = [...otp];
      next[index] = digit;
      setOtp(next);
      setInvalid(false);
      if (digit && index < OTP_LENGTH - 1) {
        inputs.current[index + 1]?.focus();
      }
    },
    [otp],
  );
  const handleKeyPress = useCallback(
    (key, index) => {
      if (key === 'Backspace') {
        if (otp[index]) {
          const next = [...otp];
          next[index] = '';
          setOtp(next);
        } else if (index > 0) {
          const next = [...otp];
          next[index - 1] = '';
          setOtp(next);
          inputs.current[index - 1]?.focus();
        }
      }
    },
    [otp],
  );
  const handleVerify = async () => {
    const fullCode = otp.join('');
    if (fullCode.length !== OTP_LENGTH) return;
    setVerifying(true);
    try {
      await authApi.verifyEmail(fullCode);
      const current = useAuthStore.getState().user;
      useAuthStore.getState().setUser({ ...current, isVerified: true });
      await updateSignupProgress({
        step: 'invite',
      });
      navigation.navigate('InviteMembers');
    } catch (e) {
      setInvalid(true);
    } finally {
      setVerifying(false);
      setLoading(false);
    }
  };
  const handleResend = async () => {
    if (countdown > 0) return;
    setResending(true);
    try {
      await authApi.sendVerification();
      setOtp(Array(OTP_LENGTH).fill(''));
      setCountdown(RESEND_COOLDOWN);
      setInvalid(false);
      inputs.current[0]?.focus();
      showAlert('Sent', `A new code has been sent to ${email}.`);
    } catch (e) {
      showAlert('Error', e?.response?.data?.error || 'Failed to resend.');
    } finally {
      setResending(false);
    }
  };
  const otpFilled = otp.every((d) => d !== '');
  return (
    <SignupWizardShell
      step={7}
      stepName="Verify"
      title="Check your email"
      subtitle={`We sent a 6-digit code to ${email}.`}
      onBack={() => navigation.goBack()}
      onContinue={handleVerify}
      continueLabel="Verify"
      continueDisabled={!otpFilled || verifying}
      loading={verifying}
    >
      {/* OTP boxes */}
      <View style={styles.otpRow}>
        {otp.map((digit, i) => (
          <TextInput
            key={i}
            ref={(r) => {
              inputs.current[i] = r;
            }}
            style={[
              styles.otpBox,
              focusedIndex === i && styles.otpBoxFocused,
              digit ? styles.otpBoxFilled : null,
              invalid && styles.otpBoxError,
            ]}
            value={digit}
            onChangeText={(t) => handleChange(t, i)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
            onFocus={() => setFocusedIndex(i)}
            onBlur={() => setFocusedIndex(null)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
            caretHidden
            autoFocus={i === 0}
          />
        ))}
      </View>

      {/* Invalid code message */}
      {invalid && (
        <View style={styles.errorRow}>
          <Svg width="14" height="14" viewBox="0 0 20 20" fill={colors.errorWarm}>
            <Path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 5a1 1 0 112 0v5a1 1 0 11-2 0V5zm1 10a1.25 1.25 0 100-2.5 1.25 1.25 0 000 2.5z"
              clipRule="evenodd"
            />
          </Svg>
          <Text style={styles.errorText}>That code didn't work. Please try again.</Text>
        </View>
      )}

      {/* Resend */}
      <View style={styles.resendRow}>
        {resending ? (
          <ActivityIndicator size="small" color={colors.goldWarm} />
        ) : countdown > 0 ? (
          <Text style={styles.cooldownText}>
            Resend code in <Text style={styles.cooldownNum}>{countdown}s</Text>
          </Text>
        ) : (
          <TouchableOpacity
            onPress={handleResend}
            hitSlop={{
              top: 8,
              bottom: 8,
              left: 8,
              right: 8,
            }}
          >
            <Text style={styles.resendText}>Resend code</Text>
          </TouchableOpacity>
        )}
      </View>
    </SignupWizardShell>
  );
}
const styles = StyleSheet.create({
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 14,
    marginBottom: 16,
  },
  otpBox: {
    width: 48,
    height: 56,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.fieldBorder,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  otpBoxFocused: {
    borderColor: colors.goldWarm,
    borderWidth: 2,
  },
  otpBoxFilled: {
    borderColor: colors.goldWarm,
    borderWidth: 2,
    backgroundColor: colors.goldTint,
  },
  otpBoxError: {
    borderColor: colors.errorWarm,
    borderWidth: 2,
    backgroundColor: colors.errorBg,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 14,
  },
  errorText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.errorWarm,
  },
  resendRow: {
    alignItems: 'center',
    minHeight: 22,
    marginBottom: 14,
  },
  cooldownText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondaryWarm,
  },
  cooldownNum: {
    fontFamily: fonts.bodySemiBold,
    fontWeight: '600',
    color: colors.labelWarm,
  },
  resendText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    fontWeight: '600',
    color: colors.goldWarmDark,
  },
});
