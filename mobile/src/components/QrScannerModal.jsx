import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, StatusBar } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../shared/theme';

/**
 * Full-screen QR scanner modal. Calls `onScanned(rawValue)` once per open
 * with the raw string encoded in the QR code — the caller is responsible
 * for validating/parsing it (e.g. checking it matches an invite-link
 * pattern) before acting on it.
 */
export default function QrScannerModal({ visible, onClose, onScanned }) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleBarcodeScanned = useCallback(
    ({ data }) => {
      if (scanned) return;
      setScanned(true);
      onScanned?.(data);
    },
    [scanned, onScanned],
  );

  const handleShow = useCallback(() => {
    setScanned(false);
  }, []);

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} onShow={handleShow}>
      <View style={styles.root}>
        <StatusBar barStyle="light-content" />
        {permission?.granted ? (
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
            onBarcodeScanned={handleBarcodeScanned}
          />
        ) : (
          <View style={styles.permissionWrap}>
            <Text style={styles.permissionTitle}>Camera access needed</Text>
            <Text style={styles.permissionText}>
              Allow camera access to scan a household invite QR code.
            </Text>
            <TouchableOpacity
              style={styles.permissionBtn}
              onPress={requestPermission}
              activeOpacity={0.85}
            >
              <Text style={styles.permissionBtnText}>Allow camera access</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Scan frame overlay */}
        {permission?.granted && (
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
    backgroundColor: colors.ink,
  },
  permissionWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  permissionTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 18,
    fontWeight: '700',
    color: colors.surface,
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.surfaceMuted || colors.surface,
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionBtn: {
    paddingHorizontal: 24,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionBtnText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fonts.bodySemiBold,
    color: colors.surface,
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
    color: colors.surface,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  closeBtn: {
    position: 'absolute',
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.surface,
  },
});
