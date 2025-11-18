import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../styles/DesignSystem';

const SensorCard = ({ sensor, onPress, onEdit, onDelete, onToggleActive, showActions = true }) => {
  const isActive = sensor.isActiveStatus ? sensor.isActiveStatus() : sensor.isActive;
  
  return (
    <TouchableOpacity
      style={[styles.card, !isActive && styles.inactiveCard]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={[styles.iconContainer, !isActive && styles.inactiveIcon]}>
          <Ionicons name="hardware-chip" size={24} color={isActive ? Colors.primary : Colors.text.disabled} />
        </View>
        
        <View style={styles.info}>
          <View style={styles.header}>
            <Text style={[styles.sensorId, !isActive && styles.inactiveText]}>
              {sensor.sensorId || sensor.sensor_id}
            </Text>
            {!isActive && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Inactive</Text>
              </View>
            )}
          </View>
          
          <Text style={[styles.sensorType, !isActive && styles.inactiveText]}>
            {sensor.getSensorTypeLabel ? sensor.getSensorTypeLabel() : 'Sensor'}
          </Text>
          
          {(sensor.manufacturer || sensor.model) && (
            <Text style={styles.details} numberOfLines={1}>
              {[sensor.manufacturer, sensor.model].filter(Boolean).join(' - ')}
            </Text>
          )}
          
          {sensor.comments && (
            <Text style={styles.comments} numberOfLines={2}>
              {sensor.comments}
            </Text>
          )}
        </View>
      </View>

      {showActions && (
        <View style={styles.actions}>
          {onToggleActive && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                onToggleActive(sensor);
              }}
            >
              <Ionicons 
                name={isActive ? "checkmark-circle" : "close-circle"} 
                size={22} 
                color={isActive ? Colors.success : Colors.text.disabled} 
              />
            </TouchableOpacity>
          )}
          
          {onEdit && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                onEdit(sensor);
              }}
            >
              <Ionicons name="create-outline" size={20} color={Colors.primary} />
            </TouchableOpacity>
          )}
          
          {onDelete && (
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={(e) => {
                e.stopPropagation();
                onDelete(sensor);
              }}
            >
              <Ionicons name="trash-outline" size={20} color={Colors.error} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: Colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inactiveCard: {
    opacity: 0.6,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  inactiveIcon: {
    backgroundColor: Colors.background.tertiary,
  },
  info: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  sensorId: {
    ...Typography.h3,
    color: Colors.text.primary,
    marginRight: Spacing.sm,
  },
  inactiveText: {
    color: Colors.text.disabled,
  },
  badge: {
    backgroundColor: Colors.background.tertiary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  badgeText: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontSize: 10,
  },
  sensorType: {
    ...Typography.body1,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  details: {
    ...Typography.body2,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  comments: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  actionButton: {
    padding: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  deleteButton: {
    // Additional styling if needed
  },
});

export default SensorCard;









