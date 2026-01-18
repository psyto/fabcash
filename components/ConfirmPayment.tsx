import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { TokenType, formatAmount, toSmallestUnit } from '@/lib/solana/transactions';
import { shortenAddress } from '@/lib/solana/wallet';
import { Address } from '@solana/kit';
import { PrivacyMode } from './PrivacyModeSelector';

const PRIVACY_MODE_LABELS: Record<PrivacyMode, { label: string; color: string }> = {
  standard: { label: 'Standard', color: '#666' },
  compressed: { label: 'ZK Compressed', color: '#14F195' },
  shielded: { label: 'Shielded', color: '#9945FF' },
  maximum: { label: 'Max Privacy', color: '#00B4D8' },
};

interface ConfirmPaymentProps {
  recipient: string;
  amount: string;
  token: TokenType;
  privacyMode?: PrivacyMode;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ConfirmPayment({
  recipient,
  amount,
  token,
  privacyMode = 'standard',
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmPaymentProps) {
  const amountValue = parseFloat(amount) || 0;
  const displayAmount = formatAmount(
    toSmallestUnit(amountValue, token),
    token
  );
  const privacyInfo = PRIVACY_MODE_LABELS[privacyMode];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Confirm Payment</Text>
      </View>

      <View style={styles.details}>
        <View style={styles.row}>
          <Text style={styles.label}>To</Text>
          <Text style={styles.value}>{shortenAddress(recipient as Address, 6)}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>Privacy</Text>
          <Text style={[styles.privacyValue, { color: privacyInfo.color }]}>
            {privacyInfo.label}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Amount</Text>
          <Text style={styles.amountValue}>{displayAmount}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          disabled={isLoading}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.confirmButton, isLoading && styles.buttonDisabled]}
          onPress={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.confirmText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    gap: 20,
  },
  header: {
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  details: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: '#888',
  },
  value: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'monospace',
  },
  privacyValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  amountLabel: {
    fontSize: 16,
    color: '#888',
  },
  amountValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#333',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#9945FF',
    alignItems: 'center',
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
