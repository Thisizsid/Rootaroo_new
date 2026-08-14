/**
 * VaultKeyCeremonyScreen — distribute document AES keys to household members.
 *
 * Security contract:
 *   Before wrapping any document's AES key with a member's RSA public key,
 *   we MUST verify that key against our local TOFU pin store. The server
 *   may return a different (attacker-controlled) public key at any time —
 *   if this happens, the operation is blocked and the user is explicitly
 *   notified. The attacker's key is never used.
 *
 *   'trusted'      → pin matches stored pin; wrap and proceed
 *   'newly_pinned' → first contact; key was just pinned (TOFU moment); proceed
 *   'changed'      → KEY SUBSTITUTION DETECTED; block this member; alert user
 *
 * The user must explicitly acknowledge a key change before the new key is
 * accepted (via updatePublicKeyPin). This is the defense against a malicious
 * server substituting its own RSA key to intercept wrapped AES keys.
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  StatusBar,
  Modal,
} from 'react-native';
import { vaultApi } from '../shared/api/vault';
import { useAuthStore } from '../shared/store/authStore';
import { getPrivateKey } from '../shared/crypto/secureKeyStore';
import {
  importPrivateKey,
  importPublicKey,
  unwrapKey,
  wrapKey,
  computePublicKeyFingerprint,
} from '../shared/crypto/vaultCrypto';
import { verifyHouseholdKeys, updatePublicKeyPin } from '../shared/crypto/keyPinStore';
import { colors, fonts, withAlpha } from '../shared/theme';
export default function VaultKeyCeremonyScreen({ navigation }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ceremonyInProgress, setCeremonyInProgress] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [completed, setCompleted] = useState(false);
  // Pending key changes requiring explicit user confirmation
  const [pendingKeyChange, setPendingKeyChange] = useState(null);
  const [changedKeyQueue, setChangedKeyQueue] = useState([]);
  const [blockedUserIds, setBlockedUserIds] = useState(new Set());
  useEffect(() => {
    loadKeyStatus();
  }, []);
  const loadKeyStatus = async () => {
    try {
      const status = await vaultApi.getKeyStatus();
      setMembers([
        {
          userId: 'current',
          displayName: 'You',
          hasKey: status.hasKey,
        },
        {
          userId: 'others',
          displayName: `${status.totalMembers - 1} other member${status.totalMembers - 1 !== 1 ? 's' : ''}`,
          hasKey: status.membersWithKeys > (status.hasKey ? 1 : 0),
        },
      ]);
    } catch {
      Alert.alert('Error', 'Could not load key status');
    } finally {
      setLoading(false);
    }
  };
  const handlePerformCeremony = useCallback(async () => {
    try {
      setCeremonyInProgress(true);
      setProgressText('Initializing ceremony...');
      const user = useAuthStore.getState().user;
      if (!user?.id) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      // Step 1: Get own private key (biometric prompt fires here)
      const privateKeyJwk = await getPrivateKey(user.id);
      if (!privateKeyJwk) {
        Alert.alert('Error', 'No local RSA private key found on this device');
        return;
      }
      const myPrivateKey = await importPrivateKey(privateKeyJwk);

      // Step 2: Fetch household public keys from server
      setProgressText('Fetching and verifying member public keys...');
      const memberKeys = await vaultApi.getHouseholdKeys();

      // Step 3: TOFU verification of ALL keys before any wrapping occurs.
      // This is the critical security step. If the server substituted a key for
      // any member, we detect it here and block wrapping for that member.
      const verificationResults = await verifyHouseholdKeys(
        memberKeys.map((k) => ({
          userId: k.userId,
          publicKey: k.publicKey,
        })),
      );
      const newlyChanged = [];
      const newlyBlocked = new Set();
      for (const r of verificationResults) {
        if (r.result === 'changed') {
          const fingerprint = await computePublicKeyFingerprint(r.publicKey);
          newlyChanged.push({
            userId: r.userId,
            displayName: r.userId,
            spkiB64: r.publicKey,
            fingerprint,
          });
          newlyBlocked.add(r.userId);
        }
      }
      if (newlyChanged.length > 0) {
        setBlockedUserIds(newlyBlocked);
        setChangedKeyQueue(newlyChanged);
        setPendingKeyChange(newlyChanged[0]);
        // Pause the ceremony — user must resolve key changes before continuing
        setCeremonyInProgress(false);
        setProgressText('');
        return;
      }

      // All keys are trusted — proceed with wrapping
      await performWrapping(myPrivateKey, verificationResults);
    } catch (err) {
      Alert.alert(
        'Ceremony Failed',
        err?.response?.data?.message || err.message || 'Could not complete key ceremony',
      );
      setCeremonyInProgress(false);
      setProgressText('');
    }
  }, []);

  /** Perform the actual AES key unwrap + re-wrap for all trusted members. */
  const performWrapping = async (myPrivateKey, verificationResults) => {
    setCeremonyInProgress(true);

    // Only wrap for trusted or newly-pinned members — never for blocked/changed members
    const trustedKeys = verificationResults.filter(
      (r) =>
        (r.result === 'trusted' || r.result === 'newly_pinned') && !blockedUserIds.has(r.userId),
    );
    const importedMemberKeys = [];
    for (const r of trustedKeys) {
      try {
        importedMemberKeys.push({
          userId: r.userId,
          cryptoKey: await importPublicKey(r.publicKey),
        });
      } catch {
        console.warn(`Failed to import key for user ${r.userId}`);
      }
    }
    setProgressText('Loading vault documents...');
    const { documents } = await vaultApi.listDocuments({
      limit: 50,
    });
    if (documents.length === 0) {
      Alert.alert('Notice', 'No documents in vault to distribute');
      setCompleted(true);
      setCeremonyInProgress(false);
      return;
    }
    let processedDocs = 0;
    for (const doc of documents) {
      processedDocs++;
      setProgressText(`Processing ${processedDocs}/${documents.length}: ${doc.name}`);
      let myWrappedKey = null;
      try {
        const docKeyRes = await vaultApi.getDocumentKey(doc.id);
        myWrappedKey = docKeyRes.wrappedKey;
      } catch {
        myWrappedKey = doc.encryptedKey || null;
      }
      if (!myWrappedKey) continue;
      const aesKey = await unwrapKey(myWrappedKey, myPrivateKey);
      const wrappedKeysForDoc = [];
      for (const mk of importedMemberKeys) {
        const wrapped = await wrapKey(aesKey, mk.cryptoKey);
        wrappedKeysForDoc.push({
          userId: mk.userId,
          wrappedKey: wrapped,
        });
      }
      await vaultApi.performKeyCeremony(doc.id, wrappedKeysForDoc);
    }
    const blockedCount = blockedUserIds.size;
    const successMsg =
      blockedCount > 0
        ? `Keys distributed to ${importedMemberKeys.length} member(s). ${blockedCount} member(s) were blocked due to key changes — they must be verified separately.`
        : `Successfully distributed keys for ${documents.length} document(s) to ${importedMemberKeys.length} member(s).`;
    setCompleted(true);
    setCeremonyInProgress(false);
    setProgressText('');
    Alert.alert('Key Ceremony Complete', successMsg, [
      {
        text: 'OK',
        onPress: () => navigation.goBack(),
      },
    ]);
  };

  /** User accepted the key change for the currently-pending member. */
  const handleAcceptKeyChange = async () => {
    if (!pendingKeyChange) return;
    await updatePublicKeyPin(pendingKeyChange.userId, pendingKeyChange.spkiB64);
    const newBlocked = new Set(blockedUserIds);
    newBlocked.delete(pendingKeyChange.userId);
    setBlockedUserIds(newBlocked);
    const remaining = changedKeyQueue.slice(1);
    setChangedKeyQueue(remaining);
    setPendingKeyChange(remaining[0] ?? null);
    if (remaining.length === 0) {
      // All changes resolved — user can now re-run the ceremony
      Alert.alert(
        'Keys Verified',
        'All key changes have been acknowledged. You may now perform the ceremony.',
      );
    }
  };

  /** User rejected the key change — the member remains blocked. */
  const handleRejectKeyChange = () => {
    const remaining = changedKeyQueue.slice(1);
    setChangedKeyQueue(remaining);
    setPendingKeyChange(remaining[0] ?? null);
  };
  const renderItem = ({ item }) => (
    <View style={styles.memberRow}>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{item.displayName}</Text>
        <Text style={styles.memberStatus}>{item.hasKey ? 'Key stored' : 'No vault key yet'}</Text>
      </View>
      <View style={[styles.statusDot, item.hasKey ? styles.statusActive : styles.statusInactive]} />
    </View>
  );
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.inkDeep} />

      {/* Key Change Alert Modal */}
      <Modal visible={pendingKeyChange !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>⚠️ Key Change Detected</Text>
            <Text style={styles.modalBody}>
              The vault key for user{' '}
              <Text
                style={{
                  fontWeight: '700',
                }}
              >
                {pendingKeyChange?.displayName}
              </Text>{' '}
              has changed on the server.{'\n\n'}
              This could mean they rotated their key legitimately, or it could indicate a server
              compromise.{'\n\n'}
              New key fingerprint:{'\n'}
              <Text style={styles.fingerprint}>{pendingKeyChange?.fingerprint}</Text>
              {'\n\n'}
              Do NOT accept unless you have verified this fingerprint with{' '}
              {pendingKeyChange?.displayName} directly and out of band (e.g., in person or via a
              separate secure channel).
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalRejectBtn} onPress={handleRejectKeyChange}>
                <Text style={styles.modalRejectText}>Block — Do Not Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalAcceptBtn} onPress={handleAcceptKeyChange}>
                <Text style={styles.modalAcceptText}>I Verified — Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vault Key Ceremony</Text>
        <View
          style={{
            width: 60,
          }}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Key Distribution Ceremony</Text>
          <Text style={styles.infoText}>
            Distributes document keys to all household members. All public keys are verified against
            locally pinned values before use — a key substitution attack will be detected and
            blocked automatically.
          </Text>
        </View>

        {blockedUserIds.size > 0 && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              ⚠️ {blockedUserIds.size} member(s) blocked due to unverified key changes. Resolve the
              key change alerts before running the ceremony for those members.
            </Text>
          </View>
        )}

        <Text style={styles.sectionHeader}>Household Key Status</Text>
        <FlatList
          data={members}
          keyExtractor={(item) => item.userId}
          renderItem={renderItem}
          style={styles.list}
        />

        {ceremonyInProgress && (
          <View style={styles.progressContainer}>
            <ActivityIndicator size="small" color={colors.gold} />
            <Text style={styles.progressText}>{progressText}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.ceremonyButton,
            (ceremonyInProgress || completed) && styles.buttonDisabled,
          ]}
          onPress={handlePerformCeremony}
          disabled={ceremonyInProgress || completed}
        >
          {ceremonyInProgress ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={styles.ceremonyButtonText}>
              {completed ? 'Ceremony Completed' : 'Perform Key Ceremony'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.inkDeep,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: withAlpha(colors.white, 0.08),
  },
  backButton: {
    paddingVertical: 4,
  },
  backText: {
    fontSize: 16,
    color: colors.gold,
    fontFamily: fonts.bodyMedium,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.displayBold,
    color: colors.surface,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoBox: {
    backgroundColor: colors.inkSoft,
    borderWidth: 1,
    borderColor: withAlpha(colors.gold, 0.35),
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: fonts.displayBold,
    color: colors.gold,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.textFaint,
    lineHeight: 20,
  },
  warningBox: {
    backgroundColor: withAlpha(colors.danger, 0.16),
    borderWidth: 1,
    borderColor: withAlpha(colors.danger, 0.45),
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.blushDeep,
    lineHeight: 18,
  },
  sectionHeader: {
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
    color: colors.textMutedDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  list: {
    flex: 1,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.inkSoft,
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: withAlpha(colors.white, 0.06),
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontFamily: fonts.bodyMedium,
    color: colors.surface,
    marginBottom: 2,
  },
  memberStatus: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.textMutedDark,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusActive: {
    backgroundColor: colors.success,
  },
  statusInactive: {
    backgroundColor: colors.danger,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
    gap: 8,
  },
  progressText: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.textFaint,
  },
  ceremonyButton: {
    backgroundColor: colors.gold,
    borderRadius: 9999,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: colors.gold,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.32,
    shadowRadius: 20,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  ceremonyButtonText: {
    color: colors.surface,
    fontSize: 15,
    fontFamily: fonts.displayBold,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: withAlpha(colors.black, 0.6),
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: colors.inkSoft,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: withAlpha(colors.white, 0.06),
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: fonts.displayBold,
    color: colors.coralSoft,
    marginBottom: 12,
  },
  modalBody: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.sandDim,
    lineHeight: 20,
    marginBottom: 20,
  },
  fingerprint: {
    fontFamily: fonts.mono,
    fontSize: 13,
    backgroundColor: colors.inkDeep,
    color: colors.gold,
    letterSpacing: 1,
  },
  modalButtons: {
    gap: 10,
  },
  modalRejectBtn: {
    backgroundColor: colors.success,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalRejectText: {
    color: colors.surface,
    fontFamily: fonts.displayBold,
    fontSize: 15,
  },
  modalAcceptBtn: {
    backgroundColor: withAlpha(colors.gold, 0.16),
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalAcceptText: {
    color: colors.gold,
    fontFamily: fonts.displayBold,
    fontSize: 15,
  },
});
