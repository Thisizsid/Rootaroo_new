import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import SignupWizardShell from '../shared/components/SignupWizardShell';
import { authApi } from '../shared/api/auth';
import { useAuthStore } from '../shared/store/authStore';
import { loadSignupProgress, updateSignupProgress } from '../shared/store/signupProgress';
import { colors, fonts } from '../shared/theme';
export default function SignupStepNameScreen({ navigation }) {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [focusedField, setFocusedField] = useState('fullname');
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    loadSignupProgress().then((p) => {
      if (p?.draft.displayName) setName(p.draft.displayName);
      else if (user?.name) setName(user.name);
    });
  }, [user?.name]);
  const handleContinue = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const method = (await loadSignupProgress())?.authMethod || 'email';
      if (method !== 'phone' && user) {
        const updated = await authApi.updateProfile({
          displayName: name.trim(),
        });
        setUser({
          ...user,
          name: updated.displayName,
        });
      }
      await updateSignupProgress({
        step: 'birthday',
        draft: {
          displayName: name.trim(),
          nickname: nickname.trim() || undefined,
        },
      });
      navigation.navigate('SignupStepBirthday');
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.error || e?.message || 'Could not save name');
    } finally {
      setLoading(false);
    }
  };
  return (
    <SignupWizardShell
      step={1}
      stepName="Name"
      title="Nice to meet you"
      subtitle="What should we call you?"
      onBack={async () => {
        // Delete the pending account so the email can be reused
        try {
          await authApi.cancelPendingRegistration();
          useAuthStore.getState().logout();
          navigation.navigate('SignUp');
        } catch {
          Alert.alert('Error', 'Could not cancel registration. Try again.');
        }
      }}
      onContinue={handleContinue}
      continueDisabled={!name.trim()}
      loading={loading}
    >
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Full name</Text>
        <TextInput
          style={[styles.input, focusedField === 'fullname' && styles.inputFocused]}
          value={name}
          onChangeText={setName}
          placeholder="Sara Mendez"
          placeholderTextColor={colors.placeholderWarm}
          autoFocus
          autoCorrect={false}
          onFocus={() => setFocusedField('fullname')}
          onBlur={() => setFocusedField(null)}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Nickname (optional)</Text>
        <TextInput
          style={[styles.input, focusedField === 'nickname' && styles.inputFocused]}
          value={nickname}
          onChangeText={setNickname}
          placeholder="Mom"
          placeholderTextColor={colors.placeholderWarm}
          autoCorrect={false}
          onFocus={() => setFocusedField('nickname')}
          onBlur={() => setFocusedField(null)}
        />
      </View>
    </SignupWizardShell>
  );
}
const styles = StyleSheet.create({
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 12.5,
    lineHeight: 12.5,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: colors.labelWarm,
    marginBottom: 8,
  },
  input: {
    height: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.fieldBorder,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.textPrimary,
  },
  inputFocused: {
    borderColor: colors.goldWarm,
    borderWidth: 2,
  },
});
