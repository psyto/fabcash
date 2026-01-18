import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

export type PrivacyMode = 'standard' | 'compressed' | 'shielded' | 'maximum';

interface PrivacyModeOption {
  mode: PrivacyMode;
  label: string;
  description: string;
  icon: string;
}

const PRIVACY_MODES: PrivacyModeOption[] = [
  {
    mode: 'standard',
    label: 'Standard',
    description: 'Direct transfer',
    icon: '\u2192', // →
  },
  {
    mode: 'compressed',
    label: 'Compressed',
    description: 'ZK Compression',
    icon: '\u26A1', // ⚡
  },
  {
    mode: 'shielded',
    label: 'Shielded',
    description: 'Privacy Pool',
    icon: '\u{1F6E1}', // 🛡
  },
  {
    mode: 'maximum',
    label: 'Maximum',
    description: 'Full privacy',
    icon: '\u{1F512}', // 🔒
  },
];

interface PrivacyModeSelectorProps {
  selected: PrivacyMode;
  onSelect: (mode: PrivacyMode) => void;
  disabled?: boolean;
}

export function PrivacyModeSelector({
  selected,
  onSelect,
  disabled = false,
}: PrivacyModeSelectorProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Privacy Mode</Text>
        <Text style={styles.subtitle}>
          {PRIVACY_MODES.find((m) => m.mode === selected)?.description}
        </Text>
      </View>
      <View style={styles.options}>
        {PRIVACY_MODES.map((option) => (
          <TouchableOpacity
            key={option.mode}
            style={[
              styles.option,
              selected === option.mode && styles.optionSelected,
              disabled && styles.optionDisabled,
            ]}
            onPress={() => !disabled && onSelect(option.mode)}
            disabled={disabled}
          >
            <Text style={styles.optionIcon}>{option.icon}</Text>
            <Text
              style={[
                styles.optionLabel,
                selected === option.mode && styles.optionLabelSelected,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <PrivacyIndicator mode={selected} />
    </View>
  );
}

function PrivacyIndicator({ mode }: { mode: PrivacyMode }) {
  const getPrivacyLevel = () => {
    switch (mode) {
      case 'standard':
        return { level: 1, color: '#666', text: 'Basic privacy' };
      case 'compressed':
        return { level: 2, color: '#14F195', text: 'Good privacy' };
      case 'shielded':
        return { level: 3, color: '#9945FF', text: 'High privacy' };
      case 'maximum':
        return { level: 4, color: '#00B4D8', text: 'Maximum privacy' };
    }
  };

  const { level, color, text } = getPrivacyLevel();

  return (
    <View style={styles.indicator}>
      <View style={styles.indicatorBars}>
        {[1, 2, 3, 4].map((bar) => (
          <View
            key={bar}
            style={[
              styles.indicatorBar,
              bar <= level && { backgroundColor: color },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.indicatorText, { color }]}>{text}</Text>
    </View>
  );
}

export function getPrivacyModeDetails(mode: PrivacyMode) {
  switch (mode) {
    case 'standard':
      return {
        useCompression: false,
        useShielding: false,
        description: 'Direct transfer from sender to receiver. Receiver address is unlinkable, but sender address is visible on-chain.',
      };
    case 'compressed':
      return {
        useCompression: true,
        useShielding: false,
        description: 'Uses Light Protocol ZK Compression for 99% smaller on-chain footprint. Less data available for chain analysis.',
      };
    case 'shielded':
      return {
        useCompression: false,
        useShielding: true,
        description: 'Uses Privacy Cash shielded pool. Deposits and withdrawals are cryptographically unlinkable.',
      };
    case 'maximum':
      return {
        useCompression: true,
        useShielding: true,
        description: 'Combines ZK Compression and Privacy Cash for the highest level of on-chain privacy.',
      };
  }
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
  },
  options: {
    flexDirection: 'row',
    gap: 8,
  },
  option: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  optionSelected: {
    borderColor: '#9945FF',
    backgroundColor: 'rgba(153, 69, 255, 0.1)',
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  optionLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#888',
  },
  optionLabelSelected: {
    color: '#fff',
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  indicatorBars: {
    flexDirection: 'row',
    gap: 4,
  },
  indicatorBar: {
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#333',
  },
  indicatorText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
