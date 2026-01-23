import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import * as Font from 'expo-font';
import { initPendingTxStore, processPendingTransactions } from '@/lib/store/pending-txs';
import { getOrCreateWallet } from '@/lib/solana/wallet';
import { initPrivacyCash } from '@/lib/solana/privacy-cash';

export default function RootLayout() {
  useEffect(() => {
    // Initialize pending transaction store
    initPendingTxStore();

    // Initialize Privacy Cash
    const initPrivacy = async () => {
      try {
        const wallet = await getOrCreateWallet();
        await initPrivacyCash(wallet.keypair.secretKey);
        console.log('[App] Privacy Cash initialized');
      } catch (error) {
        console.error('[App] Failed to init Privacy Cash:', error);
      }
    };
    initPrivacy();

    // Process pending transactions when app loads
    processPendingTransactions().catch(console.error);

    // Set up periodic processing
    const interval = setInterval(() => {
      processPendingTransactions().catch(console.error);
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#000',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '600',
          },
          contentStyle: {
            backgroundColor: '#000',
          },
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            title: 'Settings',
            presentation: 'modal',
          }}
        />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
