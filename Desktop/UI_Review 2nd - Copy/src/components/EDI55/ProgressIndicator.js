import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../styles/DesignSystem';

const ProgressIndicator = ({ 
  progress = 0, 
  total = 100, 
  label = 'Downloading', 
  showPercentage = true,
  isIndeterminate = false,
}) => {
  const percentage = total > 0 ? Math.round((progress / total) * 100) : 0;
  const progressWidth = `${Math.min(percentage, 100)}%`;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {showPercentage && !isIndeterminate && (
          <Text style={styles.percentage}>{percentage}%</Text>
        )}
      </View>

      {isIndeterminate ? (
        <View style={styles.indeterminateContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: progressWidth }]} />
          </View>

          <Text style={styles.details}>
            {progress} / {total} records
          </Text>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  label: {
    ...Typography.body1,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  percentage: {
    ...Typography.h3,
    color: Colors.primary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
  details: {
    ...Typography.caption,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  indeterminateContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
});

export default ProgressIndicator;









