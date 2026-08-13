import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatFileSize } from '../shared/utils/format';

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
    backgroundColor: '#F7F7FA',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(13,13,26,0.05)',
  },
  label: {
    fontSize: 12,
    color: 'rgba(13,13,26,0.5)',
    fontWeight: '500',
    marginRight: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#D4A017',
    borderRadius: 3,
  },
  progressDanger: {
    backgroundColor: '#DC3545',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D4A017',
    marginLeft: 8,
  },
});
