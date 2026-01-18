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
import * as Haptics from 'expo-haptics';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { AmountInput } from '@/components/AmountInput';
import { ConfirmPayment } from '@/components/ConfirmPayment';
import {
  PrivacyModeSelector,
  PrivacyMode,
  getPrivacyModeDetails,
} from '@/components/PrivacyModeSelector';
import {
  TokenType,
  getSolBalance,
  getUsdcBalance,
  fromSmallestUnit,
  toSmallestUnit,
} from '@/lib/solana/transactions';
import { getOrCreateWallet } from '@/lib/solana/wallet';
import { sendPaymentDirect } from '@/lib/bluetooth/central';
import { broadcastTransaction } from '@/lib/solana/broadcast';
import { parseQRCode, isValidSolanaAddress } from '@/lib/qr/scan';
import {
  isPrivacyCashInitialized,
  getPrivateBalance,
  privateWithdrawSol,
} from '@/lib/solana/privacy-cash';

type SendStep = 'input' | 'scan' | 'confirm' | 'success';

export default function SendScreen() {
  const [step, setStep] = useState<SendStep>('input');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [token, setToken] = useState<TokenType>('SOL');
  const [privacyMode, setPrivacyMode] = useState<PrivacyMode>('standard');
  const [maxAmount, setMaxAmount] = useState<number | undefined>();
  const [privateBalance, setPrivateBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [txId, setTxId] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();

  // Load max balance
  useEffect(() => {
    const loadBalance = async () => {
      try {
        const wallet = await getOrCreateWallet();
        const balance = token === 'SOL'
          ? await getSolBalance(wallet.publicKey)
          : await getUsdcBalance(wallet.publicKey);
        setMaxAmount(fromSmallestUnit(balance, token));

        // Load private balance if Privacy Cash is initialized
        if (isPrivacyCashInitialized()) {
          const privBalance = await getPrivateBalance();
          setPrivateBalance(fromSmallestUnit(
            BigInt(token === 'SOL' ? privBalance.sol : privBalance.usdc),
            token
          ));
        }
      } catch (error) {
        console.error('Failed to load balance:', error);
      }
    };
    loadBalance();
  }, [token]);

  const handleScan = useCallback(async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Camera permission required', 'Please enable camera access to scan QR codes');
        return;
      }
    }
    setStep('scan');
  }, [permission, requestPermission]);

  const handleQRScanned = useCallback(({ data }: { data: string }) => {
    const result = parseQRCode(data);

    if (result.success && result.data) {
      setRecipient(result.data.recipient);
      if (result.data.amount) {
        setAmount(result.data.amount.toString());
      }
      if (result.data.token) {
        setToken(result.data.token);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep('input');
    } else {
      // Maybe it's just an address
      if (isValidSolanaAddress(data)) {
        setRecipient(data);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setStep('input');
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Invalid QR Code', result.error || 'Could not parse QR code');
      }
    }
  }, []);

  const handleContinue = useCallback(() => {
    if (!recipient) {
      Alert.alert('Missing recipient', 'Please enter a recipient address or scan a QR code');
      return;
    }

    if (!isValidSolanaAddress(recipient)) {
      Alert.alert('Invalid address', 'Please enter a valid Solana address');
      return;
    }

    const amountValue = parseFloat(amount);
    if (!amountValue || amountValue <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid amount');
      return;
    }

    if (maxAmount !== undefined && amountValue > maxAmount) {
      Alert.alert('Insufficient balance', `You only have ${maxAmount} ${token}`);
      return;
    }

    setStep('confirm');
  }, [recipient, amount, token, maxAmount]);

  const handleConfirm = useCallback(async () => {
    setIsLoading(true);
    try {
      const amountValue = parseFloat(amount);
      const privacyDetails = getPrivacyModeDetails(privacyMode);

      // Handle shielded/maximum privacy modes with Privacy Cash
      if (privacyDetails.useShielding && token === 'SOL') {
        const lamportsValue = Number(toSmallestUnit(amountValue, 'SOL'));
        const withdrawResult = await privateWithdrawSol(lamportsValue, recipient);

        if (withdrawResult.success) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setTxId(withdrawResult.txSignature || 'shielded');
          setStep('success');
        } else {
          throw new Error(withdrawResult.error || 'Shielded withdrawal failed');
        }
        return;
      }

      // Build and store the transaction (standard or compressed mode)
      const signedTx = await sendPaymentDirect({
        amount: amountValue,
        token,
        recipientPubkey: recipient,
        useCompression: privacyDetails.useCompression,
      });

      // Try to broadcast immediately
      const result = await broadcastTransaction(signedTx);

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTxId(signedTx.id);
        setStep('success');
      } else {
        // Transaction stored for later broadcast
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
          'Payment Queued',
          'Your payment has been queued and will be broadcast when you\'re back online.',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Payment Failed', (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [amount, token, recipient, privacyMode]);

  const handleCancel = useCallback(() => {
    setStep('input');
  }, []);

  const handleDone = useCallback(() => {
    setRecipient('');
    setAmount('');
    setStep('input');
    router.back();
  }, []);

  if (step === 'scan') {
    return (
      <View style={styles.scanContainer}>
        <CameraView
          style={styles.camera}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          onBarcodeScanned={handleQRScanned}
        />
        <TouchableOpacity
          style={styles.cancelScanButton}
          onPress={() => setStep('input')}
        >
          <Text style={styles.cancelScanText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (step === 'confirm') {
    return (
      <View style={styles.container}>
        <View style={styles.confirmContainer}>
          <ConfirmPayment
            recipient={recipient}
            amount={amount}
            token={token}
            privacyMode={privacyMode}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            isLoading={isLoading}
          />
        </View>
      </View>
    );
  }

  if (step === 'success') {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>{'\u2714'}</Text>
          <Text style={styles.successTitle}>Payment Sent!</Text>
          <Text style={styles.successAmount}>
            {amount} {token}
          </Text>
          <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
            <Text style={styles.doneText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.label}>Recipient</Text>
        <View style={styles.recipientRow}>
          <TextInput
            style={styles.recipientInput}
            value={recipient}
            onChangeText={setRecipient}
            placeholder="Enter address or scan QR"
            placeholderTextColor="#666"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity style={styles.scanButton} onPress={handleScan}>
            <Text style={styles.scanText}>Scan</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Amount</Text>
        <AmountInput
          value={amount}
          onChange={setAmount}
          token={token}
          onTokenChange={setToken}
          maxAmount={maxAmount}
        />
      </View>

      <View style={styles.section}>
        <PrivacyModeSelector
          selected={privacyMode}
          onSelect={setPrivacyMode}
        />
        {(privacyMode === 'shielded' || privacyMode === 'maximum') && (
          <View style={styles.privateBalanceInfo}>
            <Text style={styles.privateBalanceLabel}>Shielded Balance:</Text>
            <Text style={styles.privateBalanceValue}>
              {privateBalance.toFixed(4)} {token}
            </Text>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
        <Text style={styles.continueText}>Continue</Text>
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
    gap: 24,
  },
  section: {
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  recipientRow: {
    flexDirection: 'row',
    gap: 12,
  },
  recipientInput: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
  },
  scanButton: {
    backgroundColor: '#9945FF',
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  scanText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  privateBalanceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(153, 69, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
  },
  privateBalanceLabel: {
    fontSize: 13,
    color: '#888',
  },
  privateBalanceValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9945FF',
  },
  continueButton: {
    backgroundColor: '#9945FF',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 12,
  },
  continueText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  scanContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cancelScanButton: {
    position: 'absolute',
    bottom: 60,
    left: 20,
    right: 20,
    backgroundColor: '#333',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelScanText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  confirmContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  successIcon: {
    fontSize: 64,
    color: '#14F195',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  successAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#9945FF',
  },
  doneButton: {
    backgroundColor: '#9945FF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 48,
    marginTop: 24,
  },
  doneText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
