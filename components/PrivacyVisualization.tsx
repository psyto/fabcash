import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { PrivacyMode } from './PrivacyModeSelector';

interface PrivacyVisualizationProps {
  mode: PrivacyMode;
  senderLabel?: string;
  recipientLabel?: string;
  amount?: string;
  compact?: boolean;
}

interface VisibilityItem {
  label: string;
  visible: boolean;
  description: string;
}

function getVisibilityForMode(mode: PrivacyMode): VisibilityItem[] {
  switch (mode) {
    case 'standard':
      return [
        { label: 'Sender', visible: true, description: 'Your address visible' },
        { label: 'Amount', visible: true, description: 'Exact amount visible' },
        { label: 'Recipient', visible: true, description: 'Recipient visible' },
        { label: 'Timing', visible: true, description: 'Exact timestamp' },
      ];
    case 'compressed':
      return [
        { label: 'Sender', visible: true, description: 'Your address visible' },
        { label: 'Amount', visible: false, description: 'Compressed state' },
        { label: 'Recipient', visible: true, description: 'Recipient visible' },
        { label: 'On-chain', visible: false, description: '99% smaller footprint' },
      ];
    case 'shielded':
      return [
        { label: 'Sender', visible: false, description: 'Hidden in pool' },
        { label: 'Amount', visible: false, description: 'Obscured' },
        { label: 'Recipient', visible: false, description: 'Unlinkable' },
        { label: 'Timing', visible: false, description: 'Decoupled' },
      ];
    case 'maximum':
      return [
        { label: 'Sender', visible: false, description: 'Hidden + compressed' },
        { label: 'Amount', visible: false, description: 'Fully obscured' },
        { label: 'Recipient', visible: false, description: 'Unlinkable' },
        { label: 'Footprint', visible: false, description: 'Minimal trace' },
      ];
  }
}

function getModeDescription(mode: PrivacyMode): string {
  switch (mode) {
    case 'standard':
      return 'Chain analysts can link sender to recipient';
    case 'compressed':
      return 'Reduced on-chain data, harder to analyze';
    case 'shielded':
      return 'Funds pass through privacy pool - unlinkable';
    case 'maximum':
      return 'Maximum privacy: shielded + compressed';
  }
}

function getModeColor(mode: PrivacyMode): string {
  switch (mode) {
    case 'standard':
      return '#666';
    case 'compressed':
      return '#14F195';
    case 'shielded':
      return '#9945FF';
    case 'maximum':
      return '#00B4D8';
  }
}

export function PrivacyVisualization({
  mode,
  senderLabel = 'You',
  recipientLabel = 'Recipient',
  amount,
  compact = false,
}: PrivacyVisualizationProps) {
  const visibility = getVisibilityForMode(mode);
  const description = getModeDescription(mode);
  const modeColor = getModeColor(mode);
  const isPrivate = mode === 'shielded' || mode === 'maximum';

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Text style={styles.compactTitle}>Chain Analysis View</Text>
        <View style={styles.compactFlow}>
          <View style={[styles.compactNode, isPrivate && styles.compactNodeHidden]}>
            <Text style={styles.compactNodeText}>{isPrivate ? '?' : senderLabel}</Text>
          </View>
          <View style={styles.compactArrow}>
            <Text style={[styles.compactArrowText, { color: modeColor }]}>
              {isPrivate ? '· · ·' : '→'}
            </Text>
            {amount && !isPrivate && (
              <Text style={styles.compactAmount}>{amount}</Text>
            )}
            {isPrivate && (
              <Text style={styles.compactHidden}>???</Text>
            )}
          </View>
          <View style={[styles.compactNode, isPrivate && styles.compactNodeHidden]}>
            <Text style={styles.compactNodeText}>{isPrivate ? '?' : recipientLabel}</Text>
          </View>
        </View>
        <Text style={[styles.compactDescription, { color: modeColor }]}>
          {description}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyeIcon}>{isPrivate ? '\u{1F512}' : '\u{1F441}'}</Text>
        <Text style={styles.title}>What Chain Analysts See</Text>
      </View>

      {/* Flow Diagram */}
      <View style={styles.flowContainer}>
        <View style={[styles.node, isPrivate && styles.nodeHidden]}>
          <Text style={styles.nodeText}>{isPrivate ? '?' : senderLabel}</Text>
        </View>

        <View style={styles.arrowContainer}>
          <View style={[styles.arrowLine, { borderColor: modeColor }]}>
            {isPrivate ? (
              <Text style={styles.arrowDots}>· · · · ·</Text>
            ) : (
              <Text style={[styles.arrowHead, { color: modeColor }]}>→</Text>
            )}
          </View>
          {amount && (
            <Text style={[styles.arrowAmount, isPrivate && styles.arrowAmountHidden]}>
              {isPrivate ? '???' : amount}
            </Text>
          )}
        </View>

        <View style={[styles.node, isPrivate && styles.nodeHidden]}>
          <Text style={styles.nodeText}>{isPrivate ? '?' : recipientLabel}</Text>
        </View>
      </View>

      {/* Visibility List */}
      <View style={styles.visibilityList}>
        {visibility.map((item, index) => (
          <View key={index} style={styles.visibilityRow}>
            <Text style={styles.visibilityIcon}>
              {item.visible ? '\u{1F441}' : '\u{1F512}'}
            </Text>
            <Text style={[
              styles.visibilityLabel,
              !item.visible && styles.visibilityLabelHidden
            ]}>
              {item.label}
            </Text>
            <Text style={[
              styles.visibilityDescription,
              !item.visible && { color: modeColor }
            ]}>
              {item.description}
            </Text>
          </View>
        ))}
      </View>

      {/* Mode Description */}
      <View style={[styles.modeBar, { backgroundColor: `${modeColor}20` }]}>
        <Text style={[styles.modeDescription, { color: modeColor }]}>
          {description}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eyeIcon: {
    fontSize: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  flowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  node: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeHidden: {
    borderColor: '#9945FF',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(153, 69, 255, 0.1)',
  },
  nodeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  arrowContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowLine: {
    width: '80%',
    height: 2,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowDots: {
    fontSize: 14,
    color: '#9945FF',
    letterSpacing: 2,
  },
  arrowHead: {
    fontSize: 20,
    marginTop: -10,
  },
  arrowAmount: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    marginTop: 4,
  },
  arrowAmountHidden: {
    color: '#9945FF',
  },
  visibilityList: {
    gap: 8,
  },
  visibilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  visibilityIcon: {
    fontSize: 14,
    width: 24,
  },
  visibilityLabel: {
    fontSize: 13,
    color: '#fff',
    width: 70,
  },
  visibilityLabelHidden: {
    color: '#666',
  },
  visibilityDescription: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  modeBar: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  modeDescription: {
    fontSize: 13,
    fontWeight: '500',
  },
  // Compact styles
  compactContainer: {
    backgroundColor: '#0a0a0a',
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  compactTitle: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  compactFlow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  compactNode: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactNodeHidden: {
    borderColor: '#9945FF',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(153, 69, 255, 0.1)',
  },
  compactNodeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  compactArrow: {
    flex: 1,
    alignItems: 'center',
    maxWidth: 80,
  },
  compactArrowText: {
    fontSize: 16,
  },
  compactAmount: {
    fontSize: 10,
    color: '#888',
    marginTop: 2,
  },
  compactHidden: {
    fontSize: 10,
    color: '#9945FF',
    marginTop: 2,
  },
  compactDescription: {
    fontSize: 11,
    textAlign: 'center',
  },
});
