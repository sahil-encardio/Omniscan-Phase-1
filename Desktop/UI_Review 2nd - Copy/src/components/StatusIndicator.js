import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Spacing, BorderRadius } from '../styles/DesignSystem';

const StatusIndicator = ({
  status,
  label,
  showDot = true,
  size = 'medium',
  style,
}) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'connected':
      case 'online':
      case 'active':
      case 'success':
        return '#059669'; // High contrast green
      case 'disconnected':
      case 'offline':
      case 'inactive':
      case 'error':
        return '#DC2626'; // High contrast red
      case 'warning':
        return '#D97706'; // High contrast orange
      case 'pending':
      case 'loading':
        return '#374151'; // High contrast gray
      default:
        return '#374151'; // High contrast gray
    }
  };

  const getSizeStyles = () => {
    const sizes = {
      small: {
        dotSize: 8,
        fontSize: 15, // Increased from 14sp for better visibility
        padding: Spacing.xs,
      },
      medium: {
        dotSize: 10,
        fontSize: 16, // Increased from 14sp for better visibility
        padding: Spacing.sm,
      },
      large: {
        dotSize: 12,
        fontSize: 17, // Increased from 14sp for better visibility
        padding: Spacing.md,
      },
    };
    return sizes[size];
  };

  const sizeStyles = getSizeStyles();
  const statusColor = getStatusColor(status);

  return (
    <View style={[styles.container, style]}>
      {showDot && (
        <View
          style={[
            styles.dot,
            {
              width: sizeStyles.dotSize,
              height: sizeStyles.dotSize,
              backgroundColor: statusColor,
              borderRadius: sizeStyles.dotSize / 2,
            },
          ]}
        />
      )}
      {label && (
        <Text
          style={[
            {
              fontSize: 16, // Increased from 14sp for better visibility
              fontWeight: '500',
              fontFamily: 'Inter-Medium',
              color: statusColor,
              marginLeft: showDot ? Spacing.sm : 0,
              textTransform: 'capitalize',
            },
          ]}
        >
          {label}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    // Dynamic styles applied inline
  },
  label: {
    // Typography styles applied inline
  },
});

export default StatusIndicator;
