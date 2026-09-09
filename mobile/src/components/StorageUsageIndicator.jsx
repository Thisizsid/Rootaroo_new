import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatFileSize } from '../shared/utils/format';
import { colors, fonts, withAlpha } from '../shared/theme';

export default function StorageUsageIndicator({
  usedBytes,
  limitBytes,
  loading,
}) {
  const pct = limitBytes > 0 ? Math.min((usedBytes / limitBytes) * 100, 100) : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Storage</Text>
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: loading ? '0%' : `${pct}%` },
            pct > 90 && styles.progressDanger,
          ]}
        />
      </View>
      <Text style={styles.text}>
        {loading ? '...' : `${formatFileSize(usedBytes)} / ${formatFileSize(limitBytes)}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.canvasCool,
    borderBottomWidth: 1,
    borderBottomColor: withAlpha(colors.legacyNavy, 0.05),
  },
  label: {
    fontSize: 12,
    color: withAlpha(colors.legacyNavy, 0.5),
    fontWeight: '500',
    fontFamily: fonts.bodyMedium,
    marginRight: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.canvasFlat,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.legacyGold,
    borderRadius: 3,
  },
  progressDanger: {
    backgroundColor: colors.dangerBright,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fonts.bodySemiBold,
    color: colors.legacyGold,
    marginLeft: 8,
  },
});
