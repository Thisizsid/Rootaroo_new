import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, StatusBar } from 'react-native';
import { CameraView } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hasPermission } from '../shared/permissions';
import { colors, fonts, withAlpha } from '../shared/theme';

/**
 * Full-screen QR scanner modal. Calls `onScanned(rawValue)` once per open
 * with the raw string encoded in the QR code — the caller is responsible
 * for validating/parsing it (e.g. checking it matches an invite-link
 * pattern) before acting on it.
 */
export default function QrScannerModal({ visible, onClose, onScanned }) {
  const insets = useSafeAreaInsets();
  const [granted, setGranted] = useState(false);
  const [scanned, setScanned] = useState(false);

  const handleBarcodeScanned = useCallback(
    ({ data }) => {
      if (scanned) return;
      setScanned(true);
      onScanned?.(data);
    },
    [scanned, onScanned],
  );

  // Callers gate with ensureCamera() before setting `visible` — the shared
  // permission sheet is a Modal and can't be stacked reliably on top of this
  // one. This is only a read-back, so a caller that forgot closes cleanly
  // instead of leaving the user on a dead black screen.
  useEffect(() => {
    if (!visible) {
      setGranted(false);
      setScanned(false);
      return undefined;
    }
    let cancelled = false;
    hasPermission('camera').then((ok) => {
      if (cancelled) return;
      setGranted(ok);
      if (!ok) onClose?.();
    });
    return () => {
      cancelled = true;
    };
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <StatusBar barStyle="light-content" />
        {granted && (
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
            onBarcodeScanned={handleBarcodeScanned}
          />
        )}

        {/* Scan frame overlay */}
        {granted && (
          <View style={styles.overlay} pointerEvents="none">
            <View style={styles.frame} />
            <Text style={styles.hint}>Point your camera at the household QR code</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.closeBtn, { top: insets.top + 12 }]}
          onPress={onClose}
          hitSlop={{
            top: 10,
            bottom: 10,
            left: 10,
            right: 10,
          }}
        >
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surfaceRaised,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    width: 240,
    height: 240,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: colors.gold,
  },
  hint: {
    marginTop: 20,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.onAccent,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  closeBtn: {
    position: 'absolute',
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: withAlpha(colors.black, 0.4),
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.onAccent,
  },
});
