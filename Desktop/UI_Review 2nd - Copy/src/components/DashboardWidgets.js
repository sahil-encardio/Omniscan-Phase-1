import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const WidgetCard = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color, 
  trend, 
  onPress,
  style 
}) => (
  <TouchableOpacity style={[styles.widgetCard, style]} onPress={onPress}>
    <View style={styles.widgetHeader}>
      <View style={styles.widgetIconContainer}>
        <Ionicons name={icon} size={24} color="#FFFFFF" />
      </View>
      {trend && (
        <View style={[styles.trendContainer, { backgroundColor: trend.positive ? '#22c55e1A' : '#ef44441A' }]}>
          <Ionicons 
            name={trend.positive ? 'trending-up' : 'trending-down'} 
            size={12} 
            color={trend.positive ? '#22c55e' : '#ef4444'} 
          />
          <Text style={[styles.trendText, { color: trend.positive ? '#22c55e' : '#ef4444' }]}>
            {trend.value}%
          </Text>
        </View>
      )}
    </View>
    <Text style={styles.widgetValue}>{value}</Text>
    <Text style={styles.widgetTitle}>{title}</Text>
    {subtitle && <Text style={styles.widgetSubtitle}>{subtitle}</Text>}
  </TouchableOpacity>
);

const DashboardWidgets = ({ 
  widgets = [], 
  onWidgetPress,
  style 
}) => {
  const defaultWidgets = [
    {
      id: 1,
      title: 'Active Sensors',
      value: '12',
      subtitle: 'All systems operational',
      icon: 'hardware-chip',
      color: '#3B82F6',
      trend: { positive: true, value: 5.2 },
    },
    {
      id: 2,
      title: 'Data Points',
      value: '2,847',
      subtitle: 'Last 24 hours',
      icon: 'analytics',
      color: '#8B5CF6',
      trend: { positive: true, value: 12.1 },
    },
    {
      id: 3,
      title: 'Battery Level',
      value: '85%',
      subtitle: 'Device power',
      icon: 'battery-half',
      color: '#22C55E',
      trend: { positive: false, value: 2.3 },
    },
    {
      id: 4,
      title: 'Sync Status',
      value: 'Online',
      subtitle: 'Last sync: 2 min ago',
      icon: 'cloud-done',
      color: '#0EA5E9',
      trend: null,
    },
  ];

  const displayWidgets = widgets.length > 0 ? widgets : defaultWidgets;

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.sectionTitle}>Dashboard Overview</Text>
      <View style={styles.widgetsGrid}>
        {displayWidgets.map((widget) => (
          <WidgetCard
            key={widget.id}
            title={widget.title}
            value={widget.value}
            subtitle={widget.subtitle}
            icon={widget.icon}
            color={widget.color}
            trend={widget.trend}
            onPress={() => onWidgetPress?.(widget)}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22, // Increased from 20sp for better visibility
    fontWeight: '700',
    color: '#000000', // Pure black for maximum contrast
    fontFamily: 'Inter-Bold',
    marginBottom: 16,
  },
  widgetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  widgetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 6,
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
  widgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  widgetIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#2241DD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  trendText: {
    fontSize: 15, // Increased from 14sp for better visibility
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginLeft: 2,
  },
  widgetValue: {
    fontSize: 18, // Increased from 16sp for better visibility
    fontWeight: '700',
    color: '#000000', // Pure black for maximum contrast
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  widgetTitle: {
    fontSize: 16, // Increased from 14sp for better visibility
    fontWeight: '600',
    color: '#000000', // Pure black for maximum contrast
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  widgetSubtitle: {
    fontSize: 15, // Increased from 14sp for better visibility
    fontWeight: '500',
    color: '#374151', // High contrast gray
    fontFamily: 'Inter-Medium',
  },
});

export default DashboardWidgets;
