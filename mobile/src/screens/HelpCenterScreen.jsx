import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../shared/theme';
import { useTabBarDockHeight } from '../shared/hooks/useTabBarDockHeight';
const SUPPORT_EMAIL = 'support@rootaroo.app';
const FAQS = [
  {
    question: 'How do I create or join a household?',
    answer:
      'From onboarding, choose "Create a household" to start a new one, or "Join" and enter the invite code someone in your household sent you. You can only belong to one household at a time.',
  },
  {
    question: 'What happens if I lose my device and I have Vault documents?',
    answer:
      'Vault documents are end-to-end encrypted using keys stored only on your device. If you enabled passphrase backup, you can recover access on a new device with that passphrase. If you did not, Vault contents cannot be recovered by you or by us — this is a deliberate security tradeoff, so set up passphrase backup if you want a safety net.',
  },
  {
    question: 'How does Ping work?',
    answer:
      '"Ping everyone" shares your current location once with your household. "Request location" asks a specific member to share theirs — they choose whether to accept. Nothing is shared automatically or in the background.',
  },
  {
    question: 'Can I remove someone from my household?',
    answer:
      'Admins can remove members from Household Settings. This revokes their access to future content, chat, and Vault documents, but doesn’t undo anything they already saw or saved before removal.',
  },
  {
    question: 'How do I delete my account or household?',
    answer:
      'Go to Household Settings (for the household) or your profile (for your account) and choose Delete. You can schedule deletion 30 days out and cancel anytime in that window, or delete immediately.',
  },
  {
    question: 'Why didn’t I get a push notification?',
    answer:
      'Check that notifications are enabled for Rootaroo in your phone’s system settings, and that the specific notification type is turned on in Notification Preferences.',
  },
];
export default function HelpCenterScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const dockHeight = useTabBarDockHeight();
  const [openIndex, setOpenIndex] = useState(null);
  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: insets.top,
        },
      ]}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.canvas} />
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
        <Text style={styles.headerTitle}>Help Center</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: dockHeight + 16,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>Frequently asked</Text>
        {FAQS.map((faq, i) => {
          const open = openIndex === i;
          return (
            <TouchableOpacity
              key={faq.question}
              style={styles.faqRow}
              onPress={() => setOpenIndex(open ? null : i)}
              activeOpacity={0.7}
            >
              <View style={styles.faqQuestionRow}>
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                <Text style={styles.faqChevron}>{open ? '−' : '+'}</Text>
              </View>
              {open && <Text style={styles.faqAnswer}>{faq.answer}</Text>}
            </TouchableOpacity>
          );
        })}

        <Text style={styles.sectionLabel}>Still stuck?</Text>
        <TouchableOpacity
          style={styles.contactCard}
          onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
          activeOpacity={0.8}
        >
          <Text style={styles.contactTitle}>Contact support</Text>
          <Text style={styles.contactEmail}>{SUPPORT_EMAIL}</Text>
        </TouchableOpacity>
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
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: fonts.bodySemiBold,
    letterSpacing: 0.4,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginTop: 20,
    marginBottom: 10,
  },
  faqRow: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 16,
    marginBottom: 8,
  },
  faqQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
    color: colors.ink,
  },
  faqChevron: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.goldDeep,
  },
  faqAnswer: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    marginTop: 10,
  },
  contactCard: {
    backgroundColor: colors.goldTint,
    borderRadius: radius.card,
    padding: 16,
  },
  contactTitle: {
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
    color: colors.ink,
    marginBottom: 3,
  },
  contactEmail: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.goldDeep,
  },
});
