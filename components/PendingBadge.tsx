import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PendingBadgeProps {
  count: number;
}

export function PendingBadge({ count }: PendingBadgeProps) {
  if (count === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.dot} />
      <Text style={styles.text}>
        {count} pending {count === 1 ? 'transaction' : 'transactions'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFB800',
  },
  text: {
    fontSize: 14,
    color: '#FFB800',
    fontWeight: '500',
  },
});
