import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Spacing, BorderRadius, Shadows } from '../styles/DesignSystem';

const QuickActionCard = ({
  icon,
  title,
  subtitle,
  onPress,
  color = '#2241DD',
  disabled = false,
  style,
}) => {
  const getGradientColors = () => {
    const baseColor = disabled ? '#CCCCCC' : color;
    return [
      `${baseColor}20`,
      `${baseColor}10`,
      `${baseColor}05`,
    ];
  };

  const getIconBackgroundColor = () => {
    return disabled ? '#E5E5E5' : `${color}40`;
  };

  const getTextColor = () => {
    return disabled ? '#999999' : '#000000';
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.container, style]}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.iconContainer}>
          {icon}
        </View>
        
        <View style={styles.content}>
          <Text style={[styles.title, { color: getTextColor() }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: disabled ? '#999999' : '#666666' }]} numberOfLines={2}>
              {subtitle}
            </Text>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '48%',
    marginBottom: 6,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  gradient: {
    padding: Spacing.md,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2241DD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 16, // Increased from 14sp for better visibility
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 15, // Increased from 14sp for better visibility
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
});

export default QuickActionCard;
