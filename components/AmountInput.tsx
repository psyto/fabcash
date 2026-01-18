import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { TokenType } from '@/lib/solana/transactions';

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  token: TokenType;
  onTokenChange: (token: TokenType) => void;
  maxAmount?: number;
  placeholder?: string;
}

export function AmountInput({
  value,
  onChange,
  token,
  onTokenChange,
  maxAmount,
  placeholder = '0.00',
}: AmountInputProps) {
  const handleChange = useCallback(
    (text: string) => {
      // Only allow numbers and one decimal point
      const sanitized = text.replace(/[^0-9.]/g, '');
      const parts = sanitized.split('.');
      if (parts.length > 2) {
        return;
      }

      // Limit decimal places
      const maxDecimals = token === 'SOL' ? 9 : 6;
      if (parts[1] && parts[1].length > maxDecimals) {
        parts[1] = parts[1].slice(0, maxDecimals);
      }

      onChange(parts.join('.'));
    },
    [token, onChange]
  );

  const handleMax = useCallback(() => {
    if (maxAmount !== undefined) {
      onChange(maxAmount.toString());
    }
  }, [maxAmount, onChange]);

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={handleChange}
          placeholder={placeholder}
          placeholderTextColor="#666"
          keyboardType="decimal-pad"
          autoCorrect={false}
        />
        {maxAmount !== undefined && (
          <TouchableOpacity onPress={handleMax} style={styles.maxButton}>
            <Text style={styles.maxText}>MAX</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tokenSelector}>
        <TouchableOpacity
          style={[
            styles.tokenButton,
            token === 'SOL' && styles.tokenButtonActive,
          ]}
          onPress={() => onTokenChange('SOL')}
        >
          <Text
            style={[
              styles.tokenText,
              token === 'SOL' && styles.tokenTextActive,
            ]}
          >
            SOL
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tokenButton,
            token === 'USDC' && styles.tokenButtonActive,
          ]}
          onPress={() => onTokenChange('USDC')}
        >
          <Text
            style={[
              styles.tokenText,
              token === 'USDC' && styles.tokenTextActive,
            ]}
          >
            USDC
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  input: {
    flex: 1,
    fontSize: 32,
    fontWeight: '600',
    color: '#fff',
    paddingVertical: 20,
  },
  maxButton: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  maxText: {
    color: '#9945FF',
    fontSize: 12,
    fontWeight: '600',
  },
  tokenSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  tokenButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  tokenButtonActive: {
    backgroundColor: '#9945FF',
    borderColor: '#9945FF',
  },
  tokenText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888',
  },
  tokenTextActive: {
    color: '#fff',
  },
});
