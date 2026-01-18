import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { TransactionStatus as TxStatus } from '@/lib/solana/broadcast';
import { TokenType, formatAmount } from '@/lib/solana/transactions';

interface TransactionStatusProps {
  status: TxStatus;
  amount: string;
  token: TokenType;
  signature?: string;
  error?: string;
  onRetry?: () => void;
}

const STATUS_CONFIG: Record<
  TxStatus,
  { color: string; label: string; icon: string }
> = {
  pending: { color: '#FFB800', label: 'Pending', icon: '\u25CF' },
  broadcasting: { color: '#00B4D8', label: 'Broadcasting', icon: '\u2022' },
  confirmed: { color: '#14F195', label: 'Confirmed', icon: '\u2714' },
  finalized: { color: '#14F195', label: 'Finalized', icon: '\u2714' },
  failed: { color: '#FF6B6B', label: 'Failed', icon: '\u2717' },
  expired: { color: '#888', label: 'Expired', icon: '\u00D7' },
};

export function TransactionStatus({
  status,
  amount,
  token,
  signature,
  error,
  onRetry,
}: TransactionStatusProps) {
  const config = STATUS_CONFIG[status];
  const displayAmount = formatAmount(BigInt(amount), token);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.statusRow}>
          <Text style={[styles.icon, { color: config.color }]}>{config.icon}</Text>
          <Text style={[styles.status, { color: config.color }]}>
            {config.label}
          </Text>
        </View>
        <Text style={styles.amount}>{displayAmount}</Text>
      </View>

      {signature && (
        <Text style={styles.signature} numberOfLines={1}>
          {signature.slice(0, 16)}...{signature.slice(-16)}
        </Text>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      {status === 'failed' && onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  icon: {
    fontSize: 14,
  },
  status: {
    fontSize: 14,
    fontWeight: '600',
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  signature: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  error: {
    fontSize: 12,
    color: '#FF6B6B',
  },
  retryButton: {
    backgroundColor: '#333',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  retryText: {
    fontSize: 14,
    color: '#9945FF',
    fontWeight: '600',
  },
});
