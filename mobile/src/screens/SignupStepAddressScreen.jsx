import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
  SafeAreaView,
} from 'react-native';
import SignupWizardShell from '../shared/components/SignupWizardShell';
import { authApi } from '../shared/api/auth';
import { useAuthStore } from '../shared/store/authStore';
import { loadSignupProgress, updateSignupProgress } from '../shared/store/signupProgress';
import { colors, fonts } from '../shared/theme';
const COUNTRY_CODES = [
  {
    code: '+1',
    flag: '🇺🇸',
    name: 'United States',
  },
  {
    code: '+91',
    flag: '🇮🇳',
    name: 'India',
  },
  {
    code: '+44',
    flag: '🇬🇧',
    name: 'United Kingdom',
  },
  {
    code: '+61',
    flag: '🇦🇺',
    name: 'Australia',
  },
  {
    code: '+1',
    flag: '🇨🇦',
    name: 'Canada',
  },
  {
    code: '+65',
    flag: '🇸🇬',
    name: 'Singapore',
  },
  {
    code: '+977',
    flag: '🇳🇵',
    name: 'Nepal',
  },
  {
    code: '+971',
    flag: '🇦🇪',
    name: 'UAE',
  },
];
export default function SignupStepAddressScreen({ navigation }) {
  const user = useAuthStore((s) => s.user);
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState(COUNTRY_CODES[0]);
  const [authMethod, setAuthMethod] = useState('email');
  const [pickerVisible, setPickerVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);
  useEffect(() => {
    loadSignupProgress().then((p) => {
      if (!p) return;
      setAuthMethod(p.authMethod);
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
      if (p.draft.phone) setPhone(p.draft.phone);
      if (p.draft.countryCode) {
        const match = COUNTRY_CODES.find((c) => c.code === p.draft.countryCode);
        if (match) setCountry(match);
      }
    });
  }, []);
  const filtered = COUNTRY_CODES.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.code.includes(search),
  );
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
    if (authMethod === 'phone') {
      const digits = phone.replace(/\D/g, '');
      if (digits.length < 7) {
        Alert.alert('Phone required', 'Please enter a valid phone number.');
        return;
      }
    }
    setLoading(true);
    try {
      const fullPhone = `${country.code}${phone.replace(/\D/g, '')}`;
      if (authMethod !== 'phone' && user) {
        await authApi.updateProfile({
          homeAddress: fullAddress,
          ...(phone.trim()
            ? {
                phone: fullPhone,
              }
            : {}),
        });
      }
      await updateSignupProgress({
        step: 'avatar',
        phone: authMethod === 'phone' ? fullPhone : undefined,
        draft: {
          homeAddress: fullAddress,
          phone: authMethod === 'phone' ? phone.replace(/\D/g, '') : phone.trim() || undefined,
          countryCode: country.code,
        },
      });
      navigation.navigate('SignupStepAvatar');
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.error || e?.message || 'Could not save address');
    } finally {
      setLoading(false);
    }
  };
  return (
    <SignupWizardShell
      step={3}
      stepName="Address"
      title="Where's home?"
      subtitle="Used for local weather, check-ins, and deliveries."
      onBack={() => navigation.goBack()}
      onContinue={handleContinue}
      continueDisabled={
        !street.trim() ||
        !city.trim() ||
        (authMethod === 'phone' && phone.replace(/\D/g, '').length < 7)
      }
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

      {/* Phone section only for phone auth — mockup has no phone field */}
      {authMethod === 'phone' && (
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Phone number</Text>
          <View style={[styles.phoneRow, focused === 'phone' && styles.inputFocused]}>
            <TouchableOpacity
              style={styles.countryBtn}
              onPress={() => setPickerVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.flag}>{country.flag}</Text>
              <Text style={styles.code}>{country.code}</Text>
              <Text style={styles.chev}>▾</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TextInput
              style={styles.phoneInput}
              value={phone}
              onChangeText={(v) => setPhone(v.replace(/[^\d\s\-()]/g, ''))}
              placeholder="555 000 0000"
              placeholderTextColor={colors.placeholderWarm}
              keyboardType="phone-pad"
              onFocus={() => setFocused('phone')}
              onBlur={() => setFocused(null)}
            />
          </View>
        </View>
      )}

      <Modal
        visible={pickerVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setPickerVisible(false);
          setSearch('');
        }}
      >
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHead}>
            <Text style={styles.modalTitle}>Select country</Text>
            <TouchableOpacity
              onPress={() => {
                setPickerVisible(false);
                setSearch('');
              }}
            >
              <Text style={styles.modalDone}>Done</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.search}
            value={search}
            onChangeText={setSearch}
            placeholder="Search"
            placeholderTextColor={colors.placeholderWarm}
          />
          <FlatList
            data={filtered}
            keyExtractor={(item, i) => `${item.code}-${item.name}-${i}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.countryRow}
                onPress={() => {
                  setCountry(item);
                  setPickerVisible(false);
                  setSearch('');
                }}
              >
                <Text style={styles.flag}>{item.flag}</Text>
                <Text style={styles.rowName}>{item.name}</Text>
                <Text style={styles.rowCode}>{item.code}</Text>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
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
  // Mockup .active — gold border + ring, like the street field in screen07
  inputActive: {
    borderColor: colors.goldWarm,
    borderWidth: 2,
  },
  row: {
    flexDirection: 'row',
    gap: 14,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.fieldBorder,
    overflow: 'hidden',
  },
  countryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 8,
    gap: 4,
    height: 52,
  },
  flag: {
    fontSize: 16,
  },
  code: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  chev: {
    fontSize: 10,
    color: colors.textSecondaryWarm,
  },
  divider: {
    width: 1,
    height: 22,
    backgroundColor: colors.fieldBorder,
  },
  phoneInput: {
    flex: 1,
    height: 52,
    paddingHorizontal: 12,
    fontSize: 16,
    color: colors.textPrimary,
  },
  modal: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  modalHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalDone: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.goldWarm,
  },
  search: {
    marginHorizontal: 16,
    marginBottom: 8,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 13,
    borderWidth: 1.5,
    borderColor: colors.fieldBorder,
    fontSize: 14,
    color: colors.textPrimary,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  rowName: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
  },
  rowCode: {
    fontSize: 13,
    color: colors.textSecondaryWarm,
  },
});
