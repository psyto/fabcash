import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  Modal,
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
import {
  activateCrackdownMode,
  getCrackdownStatus,
  CrackdownStep,
} from '@/lib/solana/crackdown';

export default function SettingsScreen() {
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [importKey, setImportKey] = useState('');
  const [crackdownActive, setCrackdownActive] = useState(false);
  const [crackdownSteps, setCrackdownSteps] = useState<CrackdownStep[]>([]);
  const [publicBalance, setPublicBalance] = useState<number>(0);

  useEffect(() => {
    getOrCreateWallet().then(setWallet);
    getCrackdownStatus().then((status) => {
      setPublicBalance(status.publicSolBalance / 1_000_000_000);
    });
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

  const handleCrackdownMode = useCallback(() => {
    Alert.alert(
      '\u{1F6A8} Activate Crackdown Mode',
      `This will:\n\n\u2022 Shield ${publicBalance.toFixed(4)} SOL into privacy pool\n\u2022 Clear all transaction history\n\u2022 Clear all temporary keys\n\nYour funds will be safe but hidden from chain analysis.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Activate',
          style: 'destructive',
          onPress: async () => {
            setCrackdownActive(true);
            setCrackdownSteps([]);

            const result = await activateCrackdownMode((step, allSteps) => {
              setCrackdownSteps([...allSteps]);
            });

            if (result.success) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setTimeout(() => {
                setCrackdownActive(false);
                Alert.alert(
                  '\u{1F512} Funds Protected',
                  `\u2713 ${(result.solShielded / 1_000_000_000).toFixed(4)} SOL shielded\n\u2713 ${result.transactionsCleared} transactions cleared\n\u2713 ${result.ephemeralKeysCleared} keys cleared\n\nYour funds are now in the shielded pool.`,
                  [{ text: 'OK', onPress: () => router.back() }]
                );
              }, 500);
            } else {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              setCrackdownActive(false);
              Alert.alert('Error', result.error || 'Crackdown mode failed');
            }
          },
        },
      ]
    );
  }, [publicBalance]);

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

      {/* Emergency Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, styles.emergencyTitle]}>
          {'\u{1F6A8}'} Emergency
        </Text>

        <TouchableOpacity
          style={[styles.item, styles.emergencyItem]}
          onPress={handleCrackdownMode}
        >
          <View style={styles.emergencyContent}>
            <Text style={styles.emergencyLabel}>Activate Crackdown Mode</Text>
            <Text style={styles.emergencyDescription}>
              Shield all funds & clear history
            </Text>
          </View>
          <Text style={styles.itemAction}>{'\u276F'}</Text>
        </TouchableOpacity>

        <Text style={styles.emergencyNote}>
          Use if you need to protect your funds and transaction history immediately.
        </Text>
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

      {/* Crackdown Progress Modal */}
      <Modal
        visible={crackdownActive}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{'\u{1F6A8}'} Crackdown Mode</Text>
            <Text style={styles.modalSubtitle}>Protecting your funds...</Text>

            <View style={styles.stepsContainer}>
              {crackdownSteps.map((step, index) => (
                <View key={index} style={styles.stepRow}>
                  <View style={styles.stepStatus}>
                    {step.status === 'in_progress' ? (
                      <ActivityIndicator size="small" color="#FF6B6B" />
                    ) : step.status === 'completed' ? (
                      <Text style={styles.stepCheckmark}>{'\u2713'}</Text>
                    ) : step.status === 'failed' ? (
                      <Text style={styles.stepFailed}>{'\u2717'}</Text>
                    ) : (
                      <Text style={styles.stepPending}>{'\u25CB'}</Text>
                    )}
                  </View>
                  <View style={styles.stepInfo}>
                    <Text style={styles.stepName}>{step.name}</Text>
                    {step.details && (
                      <Text style={styles.stepDetails}>{step.details}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      </Modal>

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
  // Emergency styles
  emergencyTitle: {
    color: '#FF6B6B',
  },
  emergencyItem: {
    borderColor: '#FF6B6B',
    borderWidth: 2,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  emergencyContent: {
    flex: 1,
  },
  emergencyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  emergencyDescription: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  emergencyNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
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
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
  },
  stepsContainer: {
    gap: 16,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepStatus: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCheckmark: {
    fontSize: 18,
    color: '#14F195',
  },
  stepFailed: {
    fontSize: 18,
    color: '#FF6B6B',
  },
  stepPending: {
    fontSize: 18,
    color: '#333',
  },
  stepInfo: {
    flex: 1,
  },
  stepName: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  stepDetails: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
});
