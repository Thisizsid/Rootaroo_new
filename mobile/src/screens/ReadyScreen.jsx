import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authApi } from '../shared/api/auth';
import { useAuthStore } from '../shared/store/authStore';
import { loadSignupProgress, updateSignupProgress } from '../shared/store/signupProgress';
import { colors, fonts } from '../shared/theme';
/**
 * Ready screen — matches design/auth-designs/screen12_youre_ready.html 1:1.
 * No progress bar / back button (final screen of the flow).
 * Layout: flex column → big dashed upload zone (flex:1, fills free space),
 * then title, description, and the gold CTA directly under the text.
 */
export default function ReadyScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const completeSetup = useAuthStore((s) => s.completeSetup);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoUri, setPhotoUri] = useState(null);

  // Restore a previously fetched/picked family photo (phone flow, avatar photo, etc.)
  useEffect(() => {
    loadSignupProgress().then((p) => {
      const saved = p?.draft?.familyPhoto || p?.draft?.avatarUrl;
      if (saved) setPhotoUri(saved);
    });
  }, []);
  const handleContinue = async () => {
    setLoading(true);
    try {
      // In a real app, we'd upload the photo here if selected
      // For now, just complete setup — completeSetup() flips auth state,
      // and RootNavigator swaps AuthNavigator for MainTabs automatically.
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
  const handleUpload = async () => {
    if (photoUri) {
      // Already picked — tapping again lets them pick a different photo
      setPhotoUri(null);
      return;
    }
    setUploading(true);
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Photo access needed',
          'Allow photo access to add a family photo. You can enable it in Settings.',
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        const uri = result.assets[0].uri;
        setPhotoUri(uri);
        // Persist so the Ready screen shows the image if revisited
        await updateSignupProgress({
          draft: {
            familyPhoto: uri,
          },
        });
        await authApi.uploadAvatar(uri);
      }
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to pick photo. Try again.');
    } finally {
      setUploading(false);
    }
  };
  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: insets.top + (Platform.OS === 'ios' ? 8 : 16),
          paddingBottom: Math.max(insets.bottom, 70),
        },
      ]}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.bgApp} />

      {/* Upload zone — flex:1 fills the screen, pushing text/CTA to the bottom */}
      <TouchableOpacity
        style={[styles.uploadZone, photoUri && styles.uploadZoneFilled]}
        activeOpacity={0.7}
        onPress={handleUpload}
        disabled={uploading}
      >
        {photoUri ? (
          <>
            <Image
              source={{
                uri: photoUri,
              }}
              style={styles.uploadPreview}
            />
            <Text style={styles.uploadCaption}>Tap to change photo</Text>
          </>
        ) : (
          <>
            <Image
              source={require('../../assets/images/family-cover.png')}
              style={styles.uploadPreview}
            />
            <Text style={styles.uploadCaption}>Tap to change photo</Text>
          </>
        )}
      </TouchableOpacity>

      <View
        style={{
          paddingHorizontal: 34,
        }}
      >
        {/* Title + description + CTA (bottom of screen, CTA flush under text) */}
        <Text style={styles.title}>Welcome home.</Text>
        <Text style={styles.subtitle}>
          Everything is ready. Your family can now organize tasks, share moments, manage expenses,
          and stay connected in one place.
        </Text>

        <TouchableOpacity
          style={[styles.cta, loading && styles.ctaOff]}
          onPress={handleContinue}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={styles.ctaText}>Enter Rootaroo</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgApp,
    paddingHorizontal: 0,
  },
  uploadZone: {
    flex: 1,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
    gap: 10,
  },
  uploadIcon: {
    width: 38,
    height: 38,
  },
  uploadZoneFilled: {
    borderStyle: 'solid',
    borderColor: colors.goldWarm,
  },
  uploadPreview: {
    width: '100%',
    height: '90%',
    borderRadius: 18,
  },
  uploadCaption: {
    fontFamily: fonts.body,
    fontSize: 13.5,
    lineHeight: 19,
    textAlign: 'center',
    color: colors.textSecondaryWarm,
  },
  browseLink: {
    fontFamily: fonts.body,
    fontSize: 13.5,
    lineHeight: 19,
    textAlign: 'center',
    color: colors.goldWarm,
    textDecorationLine: 'underline',
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 26,
    lineHeight: 33,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: 22,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 14.5,
    lineHeight: 21,
    textAlign: 'center',
    color: colors.textSecondaryWarm,
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
    color: colors.surface,
  },
});
