import { BleManager, Characteristic, Service } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid } from 'react-native';
import {
  FABRKNT_SERVICE_UUID,
  PAYMENT_REQUEST_CHAR_UUID,
  TRANSACTION_CHAR_UUID,
  PaymentRequest,
  TransactionPayload,
  serializePayload,
  deserializePayload,
  createPaymentRequest,
  createAckPayload,
  validateTransactionPayload,
  chunkPayload,
  reassembleChunks,
} from './protocol';
import { generateEphemeralKey, EphemeralKey, markEphemeralKeyUsed } from '../solana/ephemeral';
import { addPendingTransaction } from '../store/pending-txs';
import { TokenType, SignedTransaction } from '../solana/transactions';

export type PeripheralState =
  | 'idle'
  | 'initializing'
  | 'advertising'
  | 'connected'
  | 'receiving'
  | 'completed'
  | 'error';

export interface ReceivedPayment {
  ephemeralKey: EphemeralKey;
  transaction: TransactionPayload;
  txId: string;
}

export interface PeripheralCallbacks {
  onStateChange: (state: PeripheralState) => void;
  onPaymentReceived: (payment: ReceivedPayment) => void;
  onError: (error: Error) => void;
}

let bleManager: BleManager | null = null;
let currentState: PeripheralState = 'idle';
let currentEphemeralKey: EphemeralKey | null = null;
let callbacks: PeripheralCallbacks | null = null;
let receivedChunks: string[] = [];

/**
 * Initialize BLE manager
 */
export async function initBleManager(): Promise<BleManager> {
  if (bleManager) return bleManager;

  bleManager = new BleManager();

  // Request permissions on Android
  if (Platform.OS === 'android') {
    await requestAndroidPermissions();
  }

  return bleManager;
}

/**
 * Request Android BLE permissions
 */
async function requestAndroidPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  const permissions = [
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  ];

  const results = await PermissionsAndroid.requestMultiple(permissions);

  return Object.values(results).every(
    (result) => result === PermissionsAndroid.RESULTS.GRANTED
  );
}

/**
 * Start advertising as a BLE peripheral
 */
export async function startAdvertising(
  cbs: PeripheralCallbacks,
  options?: {
    amount?: string;
    token?: TokenType;
    expirationMinutes?: number;
  }
): Promise<EphemeralKey> {
  callbacks = cbs;
  receivedChunks = [];

  try {
    setState('initializing');

    await initBleManager();

    // Generate ephemeral key for this receive session
    currentEphemeralKey = await generateEphemeralKey(
      options?.expirationMinutes ?? 15
    );

    // Create payment request payload
    const paymentRequest = createPaymentRequest({
      recipientPubkey: currentEphemeralKey.publicKey.toString(),
      ephemeralId: currentEphemeralKey.id,
      amount: options?.amount,
      token: options?.token,
      expirationMinutes: options?.expirationMinutes,
    });

    // Note: react-native-ble-plx primarily supports central mode
    // For full peripheral mode, we'd need platform-specific native modules
    // This is a simplified implementation that stores the request for QR fallback

    setState('advertising');

    return currentEphemeralKey;
  } catch (error) {
    setState('error');
    callbacks?.onError(error as Error);
    throw error;
  }
}

/**
 * Stop advertising
 */
export async function stopAdvertising(): Promise<void> {
  setState('idle');
  currentEphemeralKey = null;
  receivedChunks = [];
  callbacks = null;
}

/**
 * Handle incoming transaction data
 * This would be called when receiving data over BLE
 */
export async function handleIncomingTransaction(
  data: string,
  isFinalChunk: boolean
): Promise<void> {
  receivedChunks.push(data);

  if (!isFinalChunk) {
    setState('receiving');
    return;
  }

  // Reassemble and parse the transaction
  const fullPayload = reassembleChunks(receivedChunks);
  receivedChunks = [];

  try {
    const payload = deserializePayload(fullPayload);

    if (!validateTransactionPayload(payload)) {
      throw new Error('Invalid transaction payload');
    }

    if (!currentEphemeralKey) {
      throw new Error('No active ephemeral key');
    }

    // Verify the transaction is not expired
    if (Date.now() > payload.expiresAt) {
      throw new Error('Transaction expired');
    }

    // Create a SignedTransaction from the payload
    const signedTx: SignedTransaction = {
      id: `rx_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      base64: payload.txBase64,
      sender: payload.senderPubkey as any,
      recipient: currentEphemeralKey.publicKey.toBase58(),
      amount: payload.amount,
      token: payload.token,
      createdAt: Date.now(),
      expiresAt: payload.expiresAt,
    };

    // Add to pending transactions
    await addPendingTransaction(signedTx);

    // Mark ephemeral key as used
    await markEphemeralKeyUsed(currentEphemeralKey.id);

    setState('completed');

    callbacks?.onPaymentReceived({
      ephemeralKey: currentEphemeralKey,
      transaction: payload,
      txId: signedTx.id,
    });
  } catch (error) {
    setState('error');
    callbacks?.onError(error as Error);
  }
}

/**
 * Get the current payment request for QR display
 */
export function getCurrentPaymentRequest(): PaymentRequest | null {
  if (!currentEphemeralKey || currentState !== 'advertising') {
    return null;
  }

  return createPaymentRequest({
    recipientPubkey: currentEphemeralKey.publicKey.toString(),
    ephemeralId: currentEphemeralKey.id,
  });
}

/**
 * Get current peripheral state
 */
export function getPeripheralState(): PeripheralState {
  return currentState;
}

/**
 * Get current ephemeral key
 */
export function getCurrentEphemeralKey(): EphemeralKey | null {
  return currentEphemeralKey;
}

/**
 * Update and notify state change
 */
function setState(state: PeripheralState): void {
  currentState = state;
  callbacks?.onStateChange(state);
}

/**
 * Destroy BLE manager
 */
export function destroyBleManager(): void {
  if (bleManager) {
    bleManager.destroy();
    bleManager = null;
  }
  currentState = 'idle';
  currentEphemeralKey = null;
  callbacks = null;
  receivedChunks = [];
}
