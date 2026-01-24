import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Link, router, useFocusEffect } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import {
  getOrCreateWallet,
  shortenAddress,
  WalletState,
} from '@/lib/solana/wallet';
import {
  getSolBalance,
  getUsdcBalance,
  formatAmount,
} from '@/lib/solana/transactions';
import {
  getPendingCount,
  processPendingTransactions,
  getTransactionHistory,
  PendingTransaction,
} from '@/lib/store/pending-txs';
import {
  isPrivacyCashInitialized,
  initPrivacyCash,
  getPrivateBalance,
  isUsingMock,
  shieldSol,
} from '@/lib/solana/privacy-cash';
import { PendingBadge } from '@/components/PendingBadge';
import { TransactionStatus } from '@/components/TransactionStatus';

export default function HomeScreen() {
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [solBalance, setSolBalance] = useState<bigint>(BigInt(0));
  const [usdcBalance, setUsdcBalance] = useState<bigint>(BigInt(0));
  const [shieldedSol, setShieldedSol] = useState<number>(0);
  const [showShieldModal, setShowShieldModal] = useState(false);
  const [shieldAmount, setShieldAmount] = useState('');
  const [pendingCount, setPendingCount] = useState(0);
  const [recentTxs, setRecentTxs] = useState<PendingTransaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      // Load or create wallet
      const w = await getOrCreateWallet();
      setWallet(w);

      // Load balances in parallel
      const [sol, usdc, pending, history] = await Promise.all([
        getSolBalance(w.publicKey),
        getUsdcBalance(w.publicKey),
        getPendingCount(),
        getTransactionHistory(),
      ]);

      setSolBalance(sol);
      setUsdcBalance(usdc);
      setPendingCount(pending);
      setRecentTxs(history.slice(0, 5));

      // Load shielded balance if Privacy Cash is initialized
      if (isPrivacyCashInitialized()) {
        const privBalance = await getPrivateBalance();
        setShieldedSol(privBalance.sol / 1_000_000_000);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload data when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await processPendingTransactions();
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const copyAddress = useCallback(async () => {
    if (wallet) {
      await Clipboard.setStringAsync(wallet.publicKey.toString());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Copied', 'Address copied to clipboard');
    }
  }, [wallet]);

  const maxShieldAmount = Math.max(0, Number(solBalance) / 1_000_000_000 - 0.01);

  const handleShieldOpen = useCallback(() => {
    if (maxShieldAmount <= 0) {
      Alert.alert('Insufficient balance', 'Need at least 0.01 SOL to shield');
      return;
    }
    setShieldAmount(maxShieldAmount.toFixed(4));
    setShowShieldModal(true);
  }, [maxShieldAmount]);

  const handleShieldConfirm = useCallback(async () => {
    try {
      const amount = parseFloat(shieldAmount || '0');
      if (amount <= 0 || amount > maxShieldAmount) {
        Alert.alert('Invalid amount', `Enter between 0.001 and ${maxShieldAmount.toFixed(4)} SOL`);
        return;
      }

      setShowShieldModal(false);

      // Init if needed
      if (!isPrivacyCashInitialized() && wallet) {
        await initPrivacyCash(wallet.keypair.secretKey);
      }

      const lamportsToShield = Math.floor(amount * 1_000_000_000);
      const result = await shieldSol(lamportsToShield);

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Update shielded balance immediately
        setShieldedSol(prev => prev + amount);

        // Refresh all data
        await loadData();

        // Skip alert in demo mode for cleaner video
        // Alert.alert('Shielded', `${amount.toFixed(4)} SOL moved to privacy pool`);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', (error as Error).message);
    }
  }, [shieldAmount, maxShieldAmount, wallet, loadData]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading wallet...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#9945FF"
        />
      }
    >
      {/* Wallet Address */}
      <TouchableOpacity style={styles.addressCard} onPress={copyAddress}>
        <Text style={styles.addressLabel}>Your Address</Text>
        <Text style={styles.address}>
          {wallet ? shortenAddress(wallet.publicKey, 8) : '...'}
        </Text>
        <Text style={styles.tapToCopy}>Tap to copy</Text>
      </TouchableOpacity>

      {/* Balances */}
      <View style={styles.balancesContainer}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>SOL</Text>
          <Text style={styles.balanceValue}>
            {formatAmount(solBalance, 'SOL')}
          </Text>
        </View>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>USDC</Text>
          <Text style={styles.balanceValue}>
            {formatAmount(usdcBalance, 'USDC')}
          </Text>
        </View>
      </View>

      {/* Shielded Balance */}
      <View style={styles.shieldedCard}>
        <View style={styles.shieldedHeader}>
          <Text style={styles.shieldedIcon}>{'\u{1F6E1}'}</Text>
          <Text style={styles.shieldedLabel}>Shielded Balance</Text>
          {isUsingMock() && <Text style={styles.mockBadge}>DEMO</Text>}
        </View>
        <Text style={styles.shieldedValue}>{shieldedSol.toFixed(4)} SOL</Text>
        {shieldedSol > 0 ? (
          <Text style={styles.shieldedNote}>Protected from chain analysis</Text>
        ) : (
          <TouchableOpacity style={styles.shieldButton} onPress={handleShieldOpen}>
            <Text style={styles.shieldButtonText}>Shield SOL</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Pending Transactions */}
      {pendingCount > 0 && (
        <View style={styles.pendingSection}>
          <PendingBadge count={pendingCount} />
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/send')}
        >
          <Text style={styles.actionIcon}>{'\u2191'}</Text>
          <Text style={styles.actionText}>Send</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/receive')}
        >
          <Text style={styles.actionIcon}>{'\u2193'}</Text>
          <Text style={styles.actionText}>Receive</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Transactions */}
      {recentTxs.length > 0 && (
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {recentTxs.map((tx) => (
            <TransactionStatus
              key={tx.id}
              status={tx.status}
              amount={tx.amount}
              token={tx.token}
              signature={tx.signature}
              error={tx.error}
            />
          ))}
        </View>
      )}

      {/* Settings Link */}
      <TouchableOpacity
        style={styles.settingsLink}
        onPress={() => router.push('/settings')}
      >
        <Text style={styles.settingsText}>Settings</Text>
      </TouchableOpacity>

      {/* Shield Modal */}
      <Modal
        visible={showShieldModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowShieldModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{'\u{1F6E1}'} Shield SOL</Text>
            <Text style={styles.modalSubtitle}>
              Move SOL into privacy pool
            </Text>

            <TextInput
              style={styles.modalInput}
              value={shieldAmount}
              onChangeText={setShieldAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#666"
              autoFocus
            />

            <Text style={styles.modalMax}>
              Max: {maxShieldAmount.toFixed(4)} SOL
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowShieldModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleShieldConfirm}
              >
                <Text style={styles.modalConfirmText}>Shield</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#888',
    fontSize: 16,
  },
  addressCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  addressLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  address: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'monospace',
  },
  tapToCopy: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  balancesContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  balanceCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  pendingSection: {
    marginTop: 20,
    alignItems: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#9945FF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  actionIcon: {
    fontSize: 24,
    color: '#fff',
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  historySection: {
    marginTop: 32,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  settingsLink: {
    marginTop: 32,
    alignItems: 'center',
  },
  settingsText: {
    fontSize: 16,
    color: '#9945FF',
  },
  shieldedCard: {
    backgroundColor: 'rgba(153, 69, 255, 0.15)',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#9945FF',
  },
  shieldedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  shieldedIcon: {
    fontSize: 16,
  },
  shieldedLabel: {
    fontSize: 14,
    color: '#9945FF',
    fontWeight: '600',
    flex: 1,
  },
  mockBadge: {
    fontSize: 10,
    color: '#888',
    backgroundColor: '#333',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  shieldedValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  shieldedNote: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  shieldButton: {
    backgroundColor: '#9945FF',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 8,
    alignItems: 'center',
  },
  shieldButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: '#9945FF',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  modalMax: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#333',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#9945FF',
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
