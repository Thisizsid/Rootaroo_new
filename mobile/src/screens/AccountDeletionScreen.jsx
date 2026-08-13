import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useAuthStore } from '../shared/store/authStore';
import { authApi } from '../shared/api/auth';
export default function AccountDeletionScreen({ navigation }) {
  const logout = useAuthStore((s) => s.logout);
  const [password, setPassword] = useState('');
  const [step, setStep] = useState('confirm');
  const [loading, setLoading] = useState(false);
  const handleSchedule = async () => {
    if (!password) {
      Alert.alert('Error', 'Enter your password to confirm.');
      return;
    }
    setLoading(true);
    try {
      await authApi.scheduleDeletion(password);
      setStep('scheduled');
    } catch (e) {
      const msg = e?.response?.data?.error || 'Failed. Wrong password?';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };
  const handleCancel = async () => {
    setLoading(true);
    try {
      await authApi.cancelDeletion();
      Alert.alert('Cancelled', 'Your account deletion has been cancelled.');
      navigation.goBack();
    } catch (e) {
      const msg = e?.response?.data?.error || 'Failed to cancel.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };
  const handleConfirmImmediate = async () => {
    Alert.alert(
      'Permanent Deletion',
      'This will immediately delete your account and all data. This cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await authApi.confirmDeletion(password);
              setStep('done');
            } catch (e) {
              const msg = e?.response?.data?.error || 'Deletion failed.';
              Alert.alert('Error', msg);
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };
  const handleLogout = () => {
    logout();
  };
  if (step === 'done') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1A1A2A" />
        <View style={styles.inner}>
          <Text style={styles.doneIcon}>{'\u{1F4A5}'}</Text>
          <Text style={styles.doneTitle}>Account Deleted</Text>
          <Text style={styles.doneSub}>
            Your account and all associated data have been permanently removed.
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleLogout}>
            <Text style={styles.primaryText}>GO BACK TO LOGIN</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0EDE6" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {step === 'confirm' && (
          <>
            <Text style={styles.dangerIcon}>{'\u26A0\uFE0F'}</Text>
            <Text style={styles.heading}>Delete Account</Text>
            <Text style={styles.warning}>
              This will schedule your account for deletion in 30 days. You can cancel anytime during
              this period. All your data — households, messages, tasks, and documents — will be
              permanently removed.
            </Text>

            <Text style={styles.label}>CONFIRM WITH PASSWORD</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor="rgba(13,13,26,0.2)"
              secureTextEntry
            />

            <TouchableOpacity
              style={styles.dangerBtn}
              onPress={handleSchedule}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.dangerText}>SCHEDULE DELETION</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkBtn} onPress={handleConfirmImmediate}>
              <Text style={styles.linkDanger}>Delete immediately instead</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.cancelText}>Keep my account</Text>
            </TouchableOpacity>
          </>
        )}

        {step === 'scheduled' && (
          <>
            <Text style={styles.scheduledIcon}>{'\u{1F551}'}</Text>
            <Text style={styles.heading}>Deletion Scheduled</Text>
            <Text style={styles.warning}>
              Your account is scheduled for deletion in 30 days. You can cancel this anytime by
              logging in and visiting this page.
            </Text>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleCancel}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#1A1A2A" />
              ) : (
                <Text style={styles.primaryText}>CANCEL DELETION</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.cancelText}>Go back</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0EDE6',
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  scroll: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 80 : 50,
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  dangerIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  scheduledIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  doneIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0D0D1A',
    textAlign: 'center',
    marginBottom: 10,
  },
  doneTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0D0D1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  doneSub: {
    fontSize: 13,
    color: 'rgba(13,13,26,0.4)',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  warning: {
    fontSize: 13,
    color: 'rgba(13,13,26,0.5)',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
    maxWidth: 300,
  },
  label: {
    width: '100%',
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(13,13,26,0.35)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    height: 44,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(13,13,26,0.08)',
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#0D0D1A',
    marginBottom: 16,
  },
  primaryBtn: {
    width: '100%',
    height: 46,
    backgroundColor: '#D4A017',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 14,
  },
  primaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A2A',
    letterSpacing: 0.8,
  },
  dangerBtn: {
    width: '100%',
    height: 46,
    backgroundColor: '#DC2626',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  dangerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.8,
  },
  linkBtn: {
    marginBottom: 14,
  },
  linkDanger: {
    fontSize: 12,
    fontWeight: '500',
    color: '#DC2626',
  },
  cancelText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(13,13,26,0.3)',
    marginBottom: 8,
  },
});
