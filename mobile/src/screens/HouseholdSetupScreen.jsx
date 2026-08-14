import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import SignupWizardShell from '../shared/components/SignupWizardShell';
import { useAuthStore } from '../shared/store/authStore';
import { householdApi } from '../shared/api/household';
import { loadSignupProgress, updateSignupProgress } from '../shared/store/signupProgress';
import { authApi } from '../shared/api/auth';
import { colors, fonts } from '../shared/theme';
const FAMILY_EMOJIS = ['🏡', '🌿', '☀️'];
export default function HouseholdSetupScreen({ navigation }) {
  const setHousehold = useAuthStore((s) => s.setHousehold);
  const [option, setOption] = useState('create');
  const [nestName, setNestName] = useState('');
  const [familyEmoji, setFamilyEmoji] = useState('🏡');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const handleContinue = async () => {
    setLoading(true);
    try {
      if (option === 'create') {
        if (!nestName.trim()) {
          Alert.alert('Error', 'Please enter a name for your household.');
          setLoading(false);
          return;
        }
      } else if (!inviteCode.trim()) {
        Alert.alert('Error', 'Please enter your invite code.');
        setLoading(false);
        return;
      }
      const hh =
        option === 'create'
          ? await householdApi.create(nestName.trim())
          : await householdApi.join(inviteCode.trim());
      setHousehold(hh.id);
      const progress = await loadSignupProgress();
      const method = progress?.authMethod || 'email';
      const user = useAuthStore.getState().user;
      if (method === 'phone') {
        await updateSignupProgress({
          step: 'verify',
        });
        const phone = progress?.phone || user?.phone || '';
        let code;
        try {
          const sent = await authApi.sendPhoneOtp(phone);
          code = sent.code;
        } catch {
          /* still open verify screen */
        }
        navigation.navigate('PhoneVerification', {
          phone,
          code,
        });
      } else if (method === 'google' || user?.isVerified) {
        await updateSignupProgress({
          step: 'invite',
        });
        navigation.navigate('InviteMembers');
      } else {
        await updateSignupProgress({
          step: 'verify',
        });
        navigation.navigate('EmailVerification', {
          email: user?.email,
        });
      }
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || 'Failed to set up household.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };
  return (
    <SignupWizardShell
      step={5}
      stepName="Household"
      title="Your family starts here"
      onBack={() => navigation.goBack()}
      onContinue={handleContinue}
      continueDisabled={(option === 'create' ? !nestName.trim() : !inviteCode.trim()) || loading}
      loading={loading}
    >
      {/* Create option card */}
      <TouchableOpacity
        style={[styles.optionCard, option === 'create' && styles.optionCardOn]}
        onPress={() => setOption('create')}
        activeOpacity={0.85}
      >
        <View style={styles.optionHeader}>
          <View style={[styles.radio, option === 'create' && styles.radioOn]}>
            {option === 'create' && <View style={styles.radioDot} />}
          </View>
          <Text style={[styles.optionTitle, option === 'create' && styles.optionTitleOn]}>
            Create Household
          </Text>
        </View>

        {option === 'create' && (
          <View style={styles.createBody}>
            <Text style={styles.label}>Household name</Text>
            <TextInput
              style={[
                styles.input,
                (focusedField === 'name' || option === 'create') && styles.inputActive,
                focusedField === 'name' && styles.inputFocused,
              ]}
              value={nestName}
              onChangeText={setNestName}
              placeholder="The Mendez House"
              placeholderTextColor={colors.placeholderWarm}
              autoCorrect={false}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField(null)}
            />

            <Text style={[styles.label, styles.emojiLabel]}>Family emoji</Text>
            <View style={styles.emojiMiniRow}>
              {FAMILY_EMOJIS.map((e) => (
                <TouchableOpacity
                  key={e}
                  style={[styles.emojiMini, familyEmoji === e && styles.emojiMiniOn]}
                  onPress={() => setFamilyEmoji(e)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.emojiMiniText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* Join option */}
      <TouchableOpacity
        style={[styles.simpleOption, option === 'join' && styles.simpleOptionOn]}
        onPress={() => setOption('join')}
        activeOpacity={0.85}
      >
        <View style={[styles.radio, option === 'join' && styles.radioOn]}>
          {option === 'join' && <View style={styles.radioDot} />}
        </View>
        <Text style={[styles.optionTitle, option === 'join' && styles.optionTitleOn]}>
          Join Existing Household
        </Text>
      </TouchableOpacity>

      {option === 'join' && (
        <View style={styles.joinBody}>
          <Text style={styles.label}>Invite code</Text>
          <TextInput
            style={[
              styles.input,
              (focusedField === 'code' || option === 'join') && styles.inputActive,
              focusedField === 'code' && styles.inputFocused,
            ]}
            value={inviteCode}
            onChangeText={setInviteCode}
            placeholder="MND-482"
            placeholderTextColor={colors.placeholderWarm}
            autoCapitalize="characters"
            autoCorrect={false}
            onFocus={() => setFocusedField('code')}
            onBlur={() => setFocusedField(null)}
          />
        </View>
      )}
    </SignupWizardShell>
  );
}
const styles = StyleSheet.create({
  optionCard: {
    marginTop: 14,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.fieldBorder,
    padding: 18,
    gap: 12,
  },
  optionCardOn: {
    borderColor: colors.goldWarm,
    borderWidth: 2,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.fieldBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: {
    borderColor: colors.goldWarm,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.goldWarm,
  },
  optionTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondaryWarm,
  },
  optionTitleOn: {
    color: colors.textPrimary,
  },
  createBody: {
    gap: 8,
    marginTop: 4,
  },
  joinBody: {
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
  emojiLabel: {
    marginTop: 6,
  },
  input: {
    height: 52,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.fieldBorder,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 14,
  },
  inputActive: {
    borderColor: colors.goldWarm,
  },
  inputFocused: {
    borderWidth: 2,
  },
  emojiMiniRow: {
    flexDirection: 'row',
    gap: 10,
  },
  emojiMini: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.fieldBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiMiniOn: {
    borderColor: colors.goldWarm,
    borderWidth: 2.5,
    backgroundColor: colors.goldTint,
  },
  emojiMiniText: {
    fontSize: 22,
  },
  simpleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  simpleOptionOn: {},
});
