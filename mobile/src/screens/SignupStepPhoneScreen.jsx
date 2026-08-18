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
export default function SignupStepPhoneScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState(COUNTRY_CODES[0]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);
  useEffect(() => {
    loadSignupProgress().then((p) => {
      if (!p) return;
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
  const digits = phone.replace(/\D/g, '');
  const handleContinue = async () => {
    if (digits.length < 7) {
      Alert.alert('Phone required', 'Please enter a valid phone number.');
      return;
    }
    setLoading(true);
    try {
      const fullPhone = `${country.code}${digits}`;
      await updateSignupProgress({
        step: 'avatar',
        phone: fullPhone,
        draft: {
          phone: digits,
          countryCode: country.code,
        },
      });
      navigation.navigate('SignupStepAvatar');
    } catch (e) {
      Alert.alert('Error', e?.message || 'Could not save phone number');
    } finally {
      setLoading(false);
    }
  };
  return (
    <SignupWizardShell
      step={3}
      stepName="Phone"
      title="What's your number?"
      subtitle="We'll use this to verify your account."
      onBack={() => navigation.goBack()}
      onContinue={handleContinue}
      continueDisabled={digits.length < 7}
      loading={loading}
    >
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
            autoFocus
          />
        </View>
      </View>

      <Modal
        visible={pickerVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setPickerVisible(false);
          setSearch('');
        }}
        statusBarTranslucent
        navigationBarTranslucent
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
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 12.5,
    lineHeight: 12.5,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: colors.labelWarm,
    marginBottom: 8,
  },
  inputFocused: {
    borderColor: colors.goldWarm,
    borderWidth: 2,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
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
    backgroundColor: colors.surface,
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
