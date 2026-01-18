import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import QRCode from 'react-native-qrcode-svg';
import { AmountInput } from '@/components/AmountInput';
import {
  getOrCreateWallet,
  shortenAddress,
  WalletState,
} from '@/lib/solana/wallet';
import { generateEphemeralKey, EphemeralKey } from '@/lib/solana/ephemeral';
import { createQRCodeValue, createSolanaPayUrl } from '@/lib/qr/generate';
import { TokenType } from '@/lib/solana/transactions';
import {
  startAdvertising,
  stopAdvertising,
  PeripheralState,
  ReceivedPayment,
} from '@/lib/bluetooth/peripheral';

type ReceiveStep = 'setup' | 'waiting' | 'received';

export default function ReceiveScreen() {
  const [step, setStep] = useState<ReceiveStep>('setup');
  const [amount, setAmount] = useState('');
  const [token, setToken] = useState<TokenType>('SOL');
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [ephemeralKey, setEphemeralKey] = useState<EphemeralKey | null>(null);
  const [qrValue, setQrValue] = useState<string>('');
  const [bleState, setBleState] = useState<PeripheralState>('idle');
  const [receivedPayment, setReceivedPayment] = useState<ReceivedPayment | null>(null);

  // Load wallet on mount
  useEffect(() => {
    getOrCreateWallet().then(setWallet);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAdvertising();
    };
  }, []);

  const handleStartReceiving = useCallback(async () => {
    try {
      // Generate ephemeral key for this receive session
      const key = await generateEphemeralKey(15);
      setEphemeralKey(key);

      // Generate QR code value
      const amountValue = parseFloat(amount) || undefined;
      const qr = createQRCodeValue({
        recipientPubkey: key.publicKey.toString(),
        ephemeralId: key.id,
        amount: amountValue?.toString(),
        token: amountValue ? token : undefined,
        expirationMinutes: 15,
      });
      setQrValue(qr);

      // Start BLE advertising
      await startAdvertising(
        {
          onStateChange: setBleState,
          onPaymentReceived: (payment) => {
            setReceivedPayment(payment);
            setStep('received');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
          onError: (error) => {
            console.error('BLE error:', error);
            // Continue with QR only
          },
        },
        {
          amount: amountValue?.toString(),
          token: amountValue ? token : undefined,
        }
      );

      setStep('waiting');
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    }
  }, [amount, token]);

  const handleCancel = useCallback(async () => {
    await stopAdvertising();
    setStep('setup');
    setEphemeralKey(null);
    setQrValue('');
  }, []);

  const handleDone = useCallback(() => {
    setStep('setup');
    setAmount('');
    setEphemeralKey(null);
    setQrValue('');
    setReceivedPayment(null);
    router.back();
  }, []);

  const copyAddress = useCallback(async () => {
    const address = ephemeralKey?.publicKey.toString() ?? wallet?.publicKey.toString();
    if (address) {
      await Clipboard.setStringAsync(address);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Copied', 'Address copied to clipboard');
    }
  }, [ephemeralKey, wallet]);

  if (step === 'received' && receivedPayment) {
    return (
      <View style={styles.container}>
        <View style={styles.receivedContainer}>
          <Text style={styles.successIcon}>{'\u2714'}</Text>
          <Text style={styles.receivedTitle}>Payment Received!</Text>
          <Text style={styles.receivedAmount}>
            {receivedPayment.transaction.amount} {receivedPayment.transaction.token}
          </Text>
          <Text style={styles.receivedNote}>
            This payment will be swept to your main wallet automatically.
          </Text>
          <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
            <Text style={styles.doneText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (step === 'waiting') {
    const displayAddress = ephemeralKey?.publicKey.toString() ?? '';

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.waitingContent}>
        <View style={styles.qrContainer}>
          {qrValue ? (
            <QRCode
              value={qrValue}
              size={240}
              color="#fff"
              backgroundColor="#1a1a1a"
            />
          ) : (
            <View style={styles.qrPlaceholder}>
              <Text style={styles.qrPlaceholderText}>Generating...</Text>
            </View>
          )}
        </View>

        <View style={styles.waitingInfo}>
          <Text style={styles.waitingTitle}>Waiting for payment...</Text>
          {amount && (
            <Text style={styles.waitingAmount}>
              {amount} {token}
            </Text>
          )}
          <TouchableOpacity onPress={copyAddress}>
            <Text style={styles.waitingAddress}>
              {shortenAddress(displayAddress as any, 8)}
            </Text>
            <Text style={styles.tapToCopy}>Tap to copy address</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statusSection}>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                bleState === 'advertising' && styles.statusDotActive,
              ]}
            />
            <Text style={styles.statusText}>
              {bleState === 'advertising' ? 'Bluetooth ready' : 'QR code active'}
            </Text>
          </View>
          <Text style={styles.expiresText}>Expires in 15 minutes</Text>
        </View>

        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Request Amount (Optional)</Text>
        <AmountInput
          value={amount}
          onChange={setAmount}
          token={token}
          onTokenChange={setToken}
          placeholder="0.00"
        />
      </View>

      <TouchableOpacity
        style={styles.startButton}
        onPress={handleStartReceiving}
      >
        <Text style={styles.startText}>Start Receiving</Text>
      </TouchableOpacity>

      <View style={styles.directSection}>
        <Text style={styles.directTitle}>Or share your address directly</Text>
        <TouchableOpacity style={styles.addressCard} onPress={copyAddress}>
          <Text style={styles.addressText}>
            {wallet ? shortenAddress(wallet.publicKey, 8) : '...'}
          </Text>
          <Text style={styles.tapToCopy}>Tap to copy</Text>
        </TouchableOpacity>
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
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  startButton: {
    backgroundColor: '#9945FF',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
  },
  startText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  directSection: {
    gap: 12,
    alignItems: 'center',
  },
  directTitle: {
    fontSize: 14,
    color: '#666',
  },
  addressCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  addressText: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'monospace',
  },
  tapToCopy: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  waitingContent: {
    padding: 20,
    alignItems: 'center',
    gap: 24,
  },
  qrContainer: {
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
  },
  qrPlaceholder: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333',
    borderRadius: 8,
  },
  qrPlaceholderText: {
    color: '#888',
    fontSize: 16,
  },
  waitingInfo: {
    alignItems: 'center',
    gap: 8,
  },
  waitingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  waitingAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#9945FF',
  },
  waitingAddress: {
    fontSize: 14,
    color: '#888',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  statusSection: {
    alignItems: 'center',
    gap: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#14F195',
  },
  statusDotActive: {
    backgroundColor: '#00B4D8',
  },
  statusText: {
    fontSize: 14,
    color: '#888',
  },
  expiresText: {
    fontSize: 12,
    color: '#666',
  },
  cancelButton: {
    backgroundColor: '#333',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 48,
    marginTop: 12,
  },
  cancelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  receivedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 20,
  },
  successIcon: {
    fontSize: 64,
    color: '#14F195',
  },
  receivedTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  receivedAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#9945FF',
  },
  receivedNote: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
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
