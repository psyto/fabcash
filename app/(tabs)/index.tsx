import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Link, router } from 'expo-router';
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
import { PendingBadge } from '@/components/PendingBadge';
import { TransactionStatus } from '@/components/TransactionStatus';

export default function HomeScreen() {
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [solBalance, setSolBalance] = useState<bigint>(BigInt(0));
  const [usdcBalance, setUsdcBalance] = useState<bigint>(BigInt(0));
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
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
});
