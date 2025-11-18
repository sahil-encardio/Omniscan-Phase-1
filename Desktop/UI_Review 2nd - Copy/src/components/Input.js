import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Shadows } from '../styles/DesignSystem';

const Input = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  disabled = false,
  secureTextEntry = false,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  leftIcon,
  rightIcon,
  style,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const getInputStyle = () => {
    const baseStyle = {
      backgroundColor: disabled ? '#F5F5F5' : '#FFFFFF',
      borderWidth: 1,
      borderColor: error ? '#FF0000' : (isFocused ? '#2241DD' : '#E5E5E5'),
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      fontSize: 16,
      fontWeight: '400',
      color: disabled ? '#999999' : '#000000',
    };

    if (isFocused && !error) {
      return {
        ...baseStyle,
        ...Shadows.sm,
      };
    }

    return baseStyle;
  };

  const getLabelStyle = () => {
    return {
      fontSize: 16,
      fontWeight: '600',
      color: error ? '#FF0000' : '#000000',
      marginBottom: Spacing.sm,
    };
  };

  const getErrorStyle = () => {
    return {
      fontSize: 14,
      fontWeight: '400',
      color: '#FF0000',
      marginTop: Spacing.sm,
    };
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={getLabelStyle()}>{label}</Text>}
      
      <View style={styles.inputContainer}>
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            {leftIcon}
          </View>
        )}
        
        <TextInput
          style={[
            getInputStyle(),
            leftIcon && styles.inputWithLeftIcon,
            rightIcon && styles.inputWithRightIcon,
            multiline && styles.multilineInput,
          ]}
          placeholder={placeholder}
          placeholderTextColor="#999999"
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={!disabled}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          {...props}
        />
        
        {rightIcon && (
          <View style={styles.rightIconContainer}>
            {rightIcon}
          </View>
        )}
      </View>
      
      {error && <Text style={getErrorStyle()}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  inputContainer: {
    position: 'relative',
  },
  leftIconContainer: {
    position: 'absolute',
    left: Spacing.lg,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 1,
  },
  rightIconContainer: {
    position: 'absolute',
    right: Spacing.lg,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 1,
  },
  inputWithLeftIcon: {
    paddingLeft: Spacing.xl + Spacing.lg,
  },
  inputWithRightIcon: {
    paddingRight: Spacing.xl + Spacing.lg,
  },
  multilineInput: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
});

export default Input;
