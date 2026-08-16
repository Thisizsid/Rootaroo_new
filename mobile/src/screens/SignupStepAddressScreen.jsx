import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert } from 'react-native';
import SignupWizardShell from '../shared/components/SignupWizardShell';
import { authApi } from '../shared/api/auth';
import { loadSignupProgress, updateSignupProgress } from '../shared/store/signupProgress';
import { navigateAfterHouseholdSetup } from '../shared/navigation/postAuthNavigation';
import { colors, fonts } from '../shared/theme';
export default function SignupStepAddressScreen({ navigation }) {
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);
  useEffect(() => {
    loadSignupProgress().then((p) => {
      if (!p) return;
      if (p.draft.homeAddress) {
        // Backwards-compat: "Street, City, ST ZIP" from the old single field
        const parts = p.draft.homeAddress.split(',').map((s) => s.trim());
        if (parts.length >= 3) {
          setStreet(parts[0]);
          setCity(parts[1]);
          const tail = parts.slice(2).join(', ');
          const m = tail.match(/^([A-Za-z]{2})\s+([\d-]+)$/);
          if (m) {
            setState(m[1]);
            setZip(m[2]);
          } else {
            setState(tail);
          }
        } else {
          setStreet(p.draft.homeAddress);
        }
      }
    });
  }, []);
  const fullAddress = (() => {
    const parts = [street.trim(), city.trim(), `${state.trim()} ${zip.trim()}`.trim()].filter(
      Boolean,
    );
    return parts.join(', ');
  })();
  const handleContinue = async () => {
    if (!street.trim() || !city.trim()) {
      Alert.alert('Address required', 'Please enter your street and city.');
      return;
    }
    setLoading(true);
    try {
      // By this point in the flow the household has already been created
      // (this screen only runs for creators, right after HouseholdSetup),
      // so the account always exists for both email and phone signups.
      await authApi.updateProfile({
        homeAddress: fullAddress,
      });
      await updateSignupProgress({
        step: 'address',
        draft: {
          homeAddress: fullAddress,
        },
      });
      await navigateAfterHouseholdSetup(navigation);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.error || e?.message || 'Could not save address');
    } finally {
      setLoading(false);
    }
  };
  return (
    <SignupWizardShell
      step={6}
      stepName="Address"
      title="Where's home?"
      subtitle="Used for local weather, check-ins, and deliveries."
      onBack={() => navigation.goBack()}
      onContinue={handleContinue}
      continueDisabled={!street.trim() || !city.trim()}
      loading={loading}
    >
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Street address</Text>
        {/* Mockup shows street as the active field (gold border + ring) */}
        <TextInput
          style={[styles.input, styles.inputActive]}
          value={street}
          onChangeText={setStreet}
          placeholder="482 Maple Street"
          placeholderTextColor={colors.placeholderWarm}
          autoCorrect={false}
          onFocus={() => setFocused('street')}
          onBlur={() => setFocused(null)}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>City</Text>
        <TextInput
          style={[styles.input, focused === 'city' && styles.inputFocused]}
          value={city}
          onChangeText={setCity}
          placeholder="Austin"
          placeholderTextColor={colors.placeholderWarm}
          autoCorrect={false}
          onFocus={() => setFocused('city')}
          onBlur={() => setFocused(null)}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.fieldGroup, styles.rowField]}>
          <Text style={styles.label}>State</Text>
          <TextInput
            style={[styles.input, focused === 'state' && styles.inputFocused]}
            value={state}
            onChangeText={setState}
            placeholder="TX"
            placeholderTextColor={colors.placeholderWarm}
            autoCapitalize="characters"
            autoCorrect={false}
            onFocus={() => setFocused('state')}
            onBlur={() => setFocused(null)}
          />
        </View>
        <View style={[styles.fieldGroup, styles.rowField]}>
          <Text style={styles.label}>ZIP code</Text>
          <TextInput
            style={[styles.input, focused === 'zip' && styles.inputFocused]}
            value={zip}
            onChangeText={(v) => setZip(v.replace(/[^\d-]/g, ''))}
            placeholder="78701"
            placeholderTextColor={colors.placeholderWarm}
            keyboardType="number-pad"
            onFocus={() => setFocused('zip')}
            onBlur={() => setFocused(null)}
          />
        </View>
      </View>
    </SignupWizardShell>
  );
}
const styles = StyleSheet.create({
  fieldGroup: {
    gap: 8,
  },
  rowField: {
    flex: 1,
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
    backgroundColor: colors.surface,
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
  // Mockup .active — gold border + ring, like the street field in screen07
  inputActive: {
    borderColor: colors.goldWarm,
    borderWidth: 2,
  },
  row: {
    flexDirection: 'row',
    gap: 14,
  },
});
