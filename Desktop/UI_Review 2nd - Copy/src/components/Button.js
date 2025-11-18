import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Spacing, BorderRadius, Shadows } from '../styles/DesignSystem';

const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
  ...props
}) => {
  const getButtonStyle = () => {
    const baseStyle = {
      borderRadius: BorderRadius.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      ...Shadows.sm,
    };

    const sizeStyles = {
      small: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        minHeight: 36,
      },
      medium: {
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        minHeight: 44,
      },
      large: {
        paddingVertical: Spacing.lg,
        paddingHorizontal: Spacing.xl,
        minHeight: 52,
      },
    };

    const variantStyles = {
      primary: {
        backgroundColor: disabled ? '#CCCCCC' : '#2241DD',
      },
      secondary: {
        backgroundColor: disabled ? '#F5F5F5' : '#F8F9FA',
        borderWidth: 1,
        borderColor: disabled ? '#CCCCCC' : '#E5E5E5',
      },
      ghost: {
        backgroundColor: 'transparent',
      },
      danger: {
        backgroundColor: disabled ? '#CCCCCC' : '#FF0000',
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  const getTextStyle = () => {
    const baseTextStyle = {
      fontSize: 15,
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
      textAlign: 'center',
    };

    const variantTextStyles = {
      primary: {
        color: disabled ? '#999999' : '#FFFFFF',
      },
      secondary: {
        color: disabled ? '#999999' : '#000000',
      },
      ghost: {
        color: disabled ? '#999999' : '#2241DD',
      },
      danger: {
        color: disabled ? '#999999' : '#FFFFFF',
      },
    };

    return {
      ...baseTextStyle,
      ...variantTextStyles[variant],
    };
  };

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          size="small"
          color={variant === 'ghost' ? '#2241DD' : '#FFFFFF'}
        />
      );
    }

    return (
      <>
        {icon && <>{icon}</>}
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
      </>
    );
  };

  if (variant === 'primary' && !disabled) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        style={[getButtonStyle(), style]}
        activeOpacity={0.8}
        {...props}
      >
        <LinearGradient
          colors={['#2241DD', '#1E3A8A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        {renderContent()}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[getButtonStyle(), style]}
      activeOpacity={0.8}
      {...props}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

export default Button;
