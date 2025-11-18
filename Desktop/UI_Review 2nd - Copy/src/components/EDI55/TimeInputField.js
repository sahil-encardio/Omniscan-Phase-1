import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../styles/DesignSystem';

const TimeInputField = ({ 
  label, 
  hours, 
  minutes, 
  seconds, 
  onHoursChange, 
  onMinutesChange, 
  onSecondsChange,
  maxHours = 23,
  maxMinutes = 59,
  maxSeconds = 59,
  showSeconds = true,
  editable = true,
}) => {
  const handleChange = (value, max, onChange) => {
    // Allow empty string for editing
    if (value === '') {
      onChange('');
      return;
    }

    // Parse and validate
    const num = parseInt(value, 10);
    if (isNaN(num)) {
      return;
    }

    // Clamp to valid range
    const clamped = Math.max(0, Math.min(max, num));
    onChange(clamped.toString());
  };

  const formatValue = (value) => {
    if (value === '' || value === undefined || value === null) {
      return '00';
    }
    return String(value).padStart(2, '0');
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={styles.inputRow}>
        <View style={styles.inputGroup}>
          <TextInput
            style={[styles.input, !editable && styles.disabledInput]}
            value={hours}
            onChangeText={(value) => handleChange(value, maxHours, onHoursChange)}
            keyboardType="number-pad"
            maxLength={3}
            placeholder="00"
            editable={editable}
          />
          <Text style={styles.unitLabel}>h</Text>
        </View>

        <Text style={styles.separator}>:</Text>

        <View style={styles.inputGroup}>
          <TextInput
            style={[styles.input, !editable && styles.disabledInput]}
            value={minutes}
            onChangeText={(value) => handleChange(value, maxMinutes, onMinutesChange)}
            keyboardType="number-pad"
            maxLength={2}
            placeholder="00"
            editable={editable}
          />
          <Text style={styles.unitLabel}>m</Text>
        </View>

        {showSeconds && (
          <>
            <Text style={styles.separator}>:</Text>
            <View style={styles.inputGroup}>
              <TextInput
                style={[styles.input, !editable && styles.disabledInput]}
                value={seconds}
                onChangeText={(value) => handleChange(value, maxSeconds, onSecondsChange)}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="00"
                editable={editable}
              />
              <Text style={styles.unitLabel}>s</Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.body1,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.h3,
    color: Colors.text.primary,
    textAlign: 'center',
    minWidth: 60,
  },
  disabledInput: {
    backgroundColor: Colors.background.tertiary,
    color: Colors.text.disabled,
  },
  unitLabel: {
    ...Typography.body2,
    color: Colors.text.secondary,
    marginLeft: Spacing.xs,
    marginRight: Spacing.sm,
  },
  separator: {
    ...Typography.h2,
    color: Colors.text.primary,
    marginHorizontal: Spacing.xs,
  },
});

export default TimeInputField;






