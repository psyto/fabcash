import { BleManager, Device, Characteristic } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid } from 'react-native';
import {
  FABRKNT_SERVICE_UUID,
  PAYMENT_REQUEST_CHAR_UUID,
  TRANSACTION_CHAR_UUID,
  PaymentRequest,
  TransactionPayload,
  serializePayload,
  deserializePayload,
  createTransactionPayload,
  validatePaymentRequest,
  chunkPayload,
  reassembleChunks,
} from './protocol';
import { getOrCreateWallet } from '../solana/wallet';
import { buildTransfer, TokenType, SignedTransaction, toSmallestUnit } from '../solana/transactions';
import { addPendingTransaction } from '../store/pending-txs';
import { address } from '@solana/kit';

export type CentralState =
  | 'idle'
  | 'scanning'
  | 'connecting'
  | 'connected'
  | 'sending'
  | 'completed'
  | 'error';

export interface DiscoveredDevice {
  id: string;
  name: string | null;
  rssi: number | null;
  paymentRequest?: PaymentRequest;
}

export interface CentralCallbacks {
  onStateChange: (state: CentralState) => void;
  onDeviceDiscovered: (device: DiscoveredDevice) => void;
  onTransactionSent: (txId: string) => void;
  onError: (error: Error) => void;
}

let bleManager: BleManager | null = null;
let currentState: CentralState = 'idle';
let callbacks: CentralCallbacks | null = null;
let discoveredDevices: Map<string, DiscoveredDevice> = new Map();
let connectedDevice: Device | null = null;

/**
 * Initialize BLE manager for central mode
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
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  ];

  const results = await PermissionsAndroid.requestMultiple(permissions);

  return Object.values(results).every(
    (result) => result === PermissionsAndroid.RESULTS.GRANTED
  );
}

/**
 * Start scanning for nearby payment devices
 */
export async function startScanning(cbs: CentralCallbacks): Promise<void> {
  callbacks = cbs;
  discoveredDevices.clear();

  try {
    setState('scanning');

    const manager = await initBleManager();

    // Check if Bluetooth is powered on
    const state = await manager.state();
    if (state !== 'PoweredOn') {
      throw new Error('Bluetooth is not enabled');
    }

    // Start scanning for devices with our service UUID
    manager.startDeviceScan(
      [FABRKNT_SERVICE_UUID],
      { allowDuplicates: false },
      async (error, device) => {
        if (error) {
          console.warn('Scan error:', error);
          return;
        }

        if (device) {
          const discovered: DiscoveredDevice = {
            id: device.id,
            name: device.name ?? device.localName ?? 'Unknown Device',
            rssi: device.rssi,
          };

          discoveredDevices.set(device.id, discovered);
          callbacks?.onDeviceDiscovered(discovered);
        }
      }
    );
  } catch (error) {
    setState('error');
    callbacks?.onError(error as Error);
    throw error;
  }
}

/**
 * Stop scanning for devices
 */
export async function stopScanning(): Promise<void> {
  if (bleManager) {
    bleManager.stopDeviceScan();
  }
  if (currentState === 'scanning') {
    setState('idle');
  }
}

/**
 * Connect to a discovered device
 */
export async function connectToDevice(deviceId: string): Promise<Device> {
  try {
    setState('connecting');

    const manager = await initBleManager();

    // Stop scanning
    manager.stopDeviceScan();

    // Connect to device
    const device = await manager.connectToDevice(deviceId);
    await device.discoverAllServicesAndCharacteristics();

    connectedDevice = device;
    setState('connected');

    return device;
  } catch (error) {
    setState('error');
    callbacks?.onError(error as Error);
    throw error;
  }
}

/**
 * Read payment request from connected device
 */
export async function readPaymentRequest(): Promise<PaymentRequest | null> {
  if (!connectedDevice) {
    throw new Error('No connected device');
  }

  try {
    const characteristic = await connectedDevice.readCharacteristicForService(
      FABRKNT_SERVICE_UUID,
      PAYMENT_REQUEST_CHAR_UUID
    );

    if (!characteristic.value) {
      return null;
    }

    const payload = deserializePayload(characteristic.value);

    if (!validatePaymentRequest(payload)) {
      throw new Error('Invalid payment request');
    }

    return payload;
  } catch (error) {
    console.error('Failed to read payment request:', error);
    return null;
  }
}

/**
 * Send a payment to the connected device
 */
export async function sendPayment(params: {
  amount: number;
  token: TokenType;
  recipientPubkey: string;
}): Promise<string> {
  try {
    setState('sending');

    const wallet = await getOrCreateWallet();

    // Build the transaction
    const signedTx = await buildTransfer({
      sender: wallet.signer,
      recipient: address(params.recipientPubkey),
      amount: toSmallestUnit(params.amount, params.token),
      token: params.token,
    });

    // Add to pending transactions
    await addPendingTransaction(signedTx);

    // If connected via BLE, send the transaction
    if (connectedDevice) {
      const txPayload = createTransactionPayload({
        txBase64: signedTx.base64,
        senderPubkey: wallet.publicKey.toString(),
        amount: signedTx.amount,
        token: params.token,
      });

      const serialized = serializePayload(txPayload);
      const chunks = chunkPayload(serialized);

      // Send chunks
      for (let i = 0; i < chunks.length; i++) {
        const isLast = i === chunks.length - 1;
        const chunkData = `${isLast ? '1' : '0'}${chunks[i]}`;

        await connectedDevice.writeCharacteristicWithResponseForService(
          FABRKNT_SERVICE_UUID,
          TRANSACTION_CHAR_UUID,
          Buffer.from(chunkData).toString('base64')
        );
      }
    }

    setState('completed');
    callbacks?.onTransactionSent(signedTx.id);

    return signedTx.id;
  } catch (error) {
    setState('error');
    callbacks?.onError(error as Error);
    throw error;
  }
}

/**
 * Send payment directly without BLE (for QR flow)
 */
export async function sendPaymentDirect(params: {
  amount: number;
  token: TokenType;
  recipientPubkey: string;
  useCompression?: boolean;
}): Promise<SignedTransaction> {
  const wallet = await getOrCreateWallet();

  // Build the transaction
  const signedTx = await buildTransfer({
    sender: wallet.signer,
    recipient: address(params.recipientPubkey),
    amount: toSmallestUnit(params.amount, params.token),
    token: params.token,
    useCompression: params.useCompression,
  });

  // Add to pending transactions
  await addPendingTransaction(signedTx);

  return signedTx;
}

/**
 * Disconnect from current device
 */
export async function disconnectDevice(): Promise<void> {
  if (connectedDevice) {
    try {
      await connectedDevice.cancelConnection();
    } catch {
      // Ignore disconnect errors
    }
    connectedDevice = null;
  }
  setState('idle');
}

/**
 * Get list of discovered devices
 */
export function getDiscoveredDevices(): DiscoveredDevice[] {
  return Array.from(discoveredDevices.values());
}

/**
 * Get current central state
 */
export function getCentralState(): CentralState {
  return currentState;
}

/**
 * Check if connected to a device
 */
export function isConnected(): boolean {
  return connectedDevice !== null;
}

/**
 * Update and notify state change
 */
function setState(state: CentralState): void {
  currentState = state;
  callbacks?.onStateChange(state);
}

/**
 * Destroy BLE manager and clean up
 */
export function destroyBleManager(): void {
  if (connectedDevice) {
    disconnectDevice();
  }
  if (bleManager) {
    bleManager.destroy();
    bleManager = null;
  }
  currentState = 'idle';
  callbacks = null;
  discoveredDevices.clear();
}
