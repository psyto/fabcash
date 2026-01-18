import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import {
  getOrCreateWallet,
  exportWalletBytes,
  importWallet,
  deleteWallet,
  shortenAddress,
  WalletState,
} from '@/lib/solana/wallet';
import { clearCompletedTransactions } from '@/lib/store/pending-txs';

export default function SettingsScreen() {
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [importKey, setImportKey] = useState('');

  useEffect(() => {
    getOrCreateWallet().then(setWallet);
  }, []);

  const handleExportKey = useCallback(async () => {
    Alert.alert(
      'Export Private Key',
      'Your private key will be copied to clipboard. Anyone with this key can access your funds. Never share it!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          style: 'destructive',
          onPress: async () => {
            const bytes = await exportWalletBytes();
            if (bytes) {
              const base64 = Buffer.from(bytes).toString('base64');
              await Clipboard.setStringAsync(base64);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Exported', 'Private key copied to clipboard');
            }
          },
        },
      ]
    );
  }, []);

  const handleImportKey = useCallback(async () => {
    if (!importKey.trim()) {
      Alert.alert('Error', 'Please enter a private key');
      return;
    }

    try {
      const bytes = new Uint8Array(Buffer.from(importKey.trim(), 'base64'));
      const newWallet = await importWallet(bytes);
      setWallet(newWallet);
      setShowImport(false);
      setImportKey('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Wallet imported successfully');
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Invalid private key format');
    }
  }, [importKey]);

  const handleClearHistory = useCallback(async () => {
    const cleared = await clearCompletedTransactions();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Done', `Cleared ${cleared} transactions`);
  }, []);

  const handleDeleteWallet = useCallback(() => {
    Alert.alert(
      'Delete Wallet',
      'This will permanently delete your wallet. Make sure you have backed up your private key!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteWallet();
            const newWallet = await getOrCreateWallet();
            setWallet(newWallet);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Done', 'New wallet created');
          },
        },
      ]
    );
  }, []);

  const copyAddress = useCallback(async () => {
    if (wallet) {
      await Clipboard.setStringAsync(wallet.publicKey.toString());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Copied', 'Address copied to clipboard');
    }
  }, [wallet]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Wallet Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Wallet</Text>

        <TouchableOpacity style={styles.item} onPress={copyAddress}>
          <Text style={styles.itemLabel}>Address</Text>
          <Text style={styles.itemValue}>
            {wallet ? shortenAddress(wallet.publicKey, 6) : '...'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Backup Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Backup & Recovery</Text>

        <TouchableOpacity style={styles.item} onPress={handleExportKey}>
          <Text style={styles.itemLabel}>Export Private Key</Text>
          <Text style={styles.itemAction}>{'\u276F'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.item}
          onPress={() => setShowImport(!showImport)}
        >
          <Text style={styles.itemLabel}>Import Wallet</Text>
          <Text style={styles.itemAction}>{showImport ? '\u2303' : '\u276F'}</Text>
        </TouchableOpacity>

        {showImport && (
          <View style={styles.importSection}>
            <TextInput
              style={styles.importInput}
              value={importKey}
              onChangeText={setImportKey}
              placeholder="Paste private key (base64)"
              placeholderTextColor="#666"
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              multiline
            />
            <TouchableOpacity style={styles.importButton} onPress={handleImportKey}>
              <Text style={styles.importButtonText}>Import</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Data Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data</Text>

        <TouchableOpacity style={styles.item} onPress={handleClearHistory}>
          <Text style={styles.itemLabel}>Clear Transaction History</Text>
          <Text style={styles.itemAction}>{'\u276F'}</Text>
        </TouchableOpacity>
      </View>

      {/* Danger Zone */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, styles.dangerTitle]}>Danger Zone</Text>

        <TouchableOpacity
          style={[styles.item, styles.dangerItem]}
          onPress={handleDeleteWallet}
        >
          <Text style={styles.dangerLabel}>Delete Wallet</Text>
          <Text style={styles.itemAction}>{'\u276F'}</Text>
        </TouchableOpacity>
      </View>

      {/* App Info */}
      <View style={styles.infoSection}>
        <Text style={styles.infoText}>Fabcash v1.0.0</Text>
        <Text style={styles.infoText}>Network: Devnet</Text>
      </View>
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
    gap: 32,
    paddingBottom: 40,
  },
  section: {
    gap: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 2,
  },
  itemLabel: {
    fontSize: 16,
    color: '#fff',
  },
  itemValue: {
    fontSize: 14,
    color: '#888',
    fontFamily: 'monospace',
  },
  itemAction: {
    fontSize: 14,
    color: '#666',
  },
  importSection: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginTop: 8,
  },
  importInput: {
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  importButton: {
    backgroundColor: '#9945FF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  importButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerTitle: {
    color: '#FF6B6B',
  },
  dangerItem: {
    borderColor: '#FF6B6B',
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  dangerLabel: {
    fontSize: 16,
    color: '#FF6B6B',
  },
  infoSection: {
    alignItems: 'center',
    gap: 4,
    marginTop: 16,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
  },
});
