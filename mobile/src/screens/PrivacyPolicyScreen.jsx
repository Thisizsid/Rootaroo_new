import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../shared/theme';
const SECTIONS = [
  {
    heading: 'What we collect',
    body: 'Account information you give us directly: name, email or phone number, and an optional avatar. Content you and your household create: feed posts, tasks, grocery/to-do items, expenses, chat messages, calendar events, and Ping location shares. We also store technical data needed to run the app — device push-notification tokens and login sessions.',
  },
  {
    heading: 'Household data is shared, not private to you',
    body: 'Anything you post to a household — feed posts, tasks, chat messages, calendar events, expenses, and Ping location shares — is visible to the other members of that household. Removing someone from a household stops their future access but does not undo anything they already saw, saved, or shared elsewhere.',
  },
  {
    heading: 'Location (Ping)',
    body: 'Ping only shares your location when you tap "Ping everyone" or accept a location request — there is no background location tracking. Shared locations are visible to your household and stored so you can see recent activity; you control every share individually.',
  },
  {
    heading: 'The Vault is end-to-end encrypted — we cannot read it',
    body: 'Documents you store in the Vault are encrypted and decrypted only on your device. We store encrypted bytes we have no technical ability to decrypt. This also means: if you lose your device without passphrase backup enabled, your Vault contents cannot be recovered by you or by us. That is a deliberate design property, not a bug.',
  },
  {
    heading: 'Third-party services we use',
    body: 'Cloudinary stores uploaded photos and files (feed media, avatars). Auth0 delivers phone verification codes. Google handles "Sign in with Google" if you use it. Firebase Cloud Messaging delivers push notifications. None of these services can see the contents of your end-to-end encrypted Vault.',
  },
  {
    heading: 'Data retention & deletion',
    body: 'Deleting your account or a household you administer schedules removal with a 30-day grace period you can cancel at any time, or you can choose to delete immediately. Once deleted, your access — and everyone else’s access, for a household — is removed.',
  },
  {
    heading: 'Your choices',
    body: 'You can edit your profile, leave a household, revoke Vault access for a removed member, turn off individual notification types, and delete your account at any time from Settings.',
  },
  {
    heading: 'Contact',
    body: 'Questions about this policy or your data can be sent to the support address in Help Center.',
  },
];
export default function PrivacyPolicyScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: insets.top,
        },
      ]}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.canvas} />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{
            top: 8,
            bottom: 8,
            left: 8,
            right: 8,
          }}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: insets.bottom + 40,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.draftBanner}>
          <Text style={styles.draftBannerText}>
            Draft — this describes how Rootaroo actually handles data today. It has not yet been
            reviewed by a lawyer and should not be treated as final legal text.
          </Text>
        </View>

        {SECTIONS.map((section) => (
          <View key={section.heading} style={styles.section}>
            <Text style={styles.sectionHeading}>{section.heading}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 24,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.ink,
    lineHeight: 26,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: fonts.displayBold,
    color: colors.ink,
  },
  headerSpacer: {
    width: 32,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  draftBanner: {
    backgroundColor: colors.goldTint,
    borderRadius: 14,
    padding: 14,
    marginBottom: 24,
  },
  draftBannerText: {
    fontSize: 12.5,
    lineHeight: 18,
    fontFamily: fonts.bodyMedium,
    color: colors.goldDeep,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: fonts.displayBold,
    color: colors.ink,
    marginBottom: 8,
  },
  sectionBody: {
    fontSize: 13.5,
    lineHeight: 20,
    fontFamily: fonts.body,
    color: colors.textSecondary,
  },
});
