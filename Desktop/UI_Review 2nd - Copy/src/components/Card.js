import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Shadows } from '../styles/DesignSystem';

const Card = ({
  children,
  variant = 'default',
  padding = 'medium',
  style,
  ...props
}) => {
  const getCardStyle = () => {
    const baseStyle = {
      backgroundColor: '#FFFFFF',
      borderRadius: BorderRadius.xl,
    };

    const variantStyles = {
      default: {
        ...Shadows.md,
      },
      elevated: {
        ...Shadows.lg,
      },
      outlined: {
        borderWidth: 1,
        borderColor: '#E5E5E5',
      },
      filled: {
        backgroundColor: '#F8F9FA',
      },
    };

    const paddingStyles = {
      none: {},
      small: { padding: Spacing.md },
      medium: { padding: Spacing.lg },
      large: { padding: Spacing.xl },
    };

    return {
      ...baseStyle,
      ...variantStyles[variant],
      ...paddingStyles[padding],
    };
  };

  return (
    <View style={[getCardStyle(), style]} {...props}>
      {children}
    </View>
  );
};

export default Card;
