import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../styles/DesignSystem';

const SystemStatusCard = ({ systemSetup }) => {
  const {
    scanState = false,
    noOfRecords = 0,
    scanIntervalHours = 0,
    scanIntervalMins = 0,
    scanIntervalSecs = 0,
  } = systemSetup || {};

  const scanInterval = `${String(scanIntervalHours).padStart(2, '0')}:${String(scanIntervalMins).padStart(2, '0')}:${String(scanIntervalSecs).padStart(2, '0')}`;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="analytics" size={24} color={Colors.primary} />
        <Text style={styles.title}>System Status</Text>
      </View>

      <View style={styles.statusGrid}>
        <View style={styles.statusItem}>
          <Text style={styles.label}>Scan State</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, scanState ? styles.activeDot : styles.inactiveDot]} />
            <Text style={[styles.value, scanState ? styles.activeText : styles.inactiveText]}>
              {scanState ? 'Running' : 'Stopped'}
            </Text>
          </View>
        </View>

        <View style={styles.statusItem}>
          <Text style={styles.label}>Records</Text>
          <Text style={styles.value}>{noOfRecords}</Text>
        </View>

        <View style={styles.statusItem}>
          <Text style={styles.label}>Scan Interval</Text>
          <Text style={styles.value}>{scanInterval}</Text>
        </View>

        <View style={styles.statusItem}>
          <Text style={styles.label}>Memory</Text>
          <Text style={styles.value}>
            {noOfRecords > 0 ? 'Data Available' : 'Empty'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: Colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.h3,
    color: Colors.text.primary,
    marginLeft: Spacing.sm,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.sm,
  },
  statusItem: {
    width: '50%',
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    ...Typography.h3,
    color: Colors.text.primary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.xs,
  },
  activeDot: {
    backgroundColor: Colors.success,
  },
  inactiveDot: {
    backgroundColor: Colors.error,
  },
  activeText: {
    color: Colors.success,
  },
  inactiveText: {
    color: Colors.error,
  },
});

export default SystemStatusCard;









