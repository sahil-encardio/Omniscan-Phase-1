import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ActivityItem = ({ icon, color, title, time, isNew = false, onPress }) => (
  <TouchableOpacity style={styles.activityItem} onPress={onPress}>
    <View style={styles.activityIconContainer}>
      <Ionicons name={icon} size={24} color="#FFFFFF" />
    </View>
    <View style={styles.activityTextContainer}>
      <Text style={styles.activityTitle}>{title}</Text>
      <Text style={styles.activityTime}>{time}</Text>
    </View>
    {isNew && <View style={[styles.activityStatusDot, { backgroundColor: color }]} />}
  </TouchableOpacity>
);

const RecentActivity = ({ 
  activities = [], 
  onViewAll, 
  onActivityPress,
  style 
}) => {
  const defaultActivities = [
    {
      id: 1,
      icon: 'save',
      color: '#22c55e',
      title: 'Reading saved for Site A',
      time: '2 mins ago',
      isNew: true,
    },
    {
      id: 2,
      icon: 'bluetooth',
      color: '#3b82f6',
      title: 'Device connection established',
      time: '10 mins ago',
      isNew: false,
    },
    {
      id: 3,
      icon: 'cloud-upload',
      color: '#f59e0b',
      title: 'Synced 12 records to cloud',
      time: '1 hr ago',
      isNew: false,
    },
    {
      id: 4,
      icon: 'alert-circle',
      color: '#ef4444',
      title: 'Sensor calibration required',
      time: '2 hrs ago',
      isNew: false,
    },
  ];

  const displayActivities = activities.length > 0 ? activities : defaultActivities;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Activity</Text>
        <TouchableOpacity onPress={onViewAll}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.activityList}
        showsVerticalScrollIndicator={false}
      >
        {displayActivities.map((activity) => (
          <ActivityItem
            key={activity.id}
            icon={activity.icon}
            color={activity.color}
            title={activity.title}
            time={activity.time}
            isNew={activity.isNew}
            onPress={() => onActivityPress?.(activity)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 8,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22, // Increased from 20sp for better visibility
    fontWeight: '700',
    color: '#000000', // Pure black for maximum contrast
    fontFamily: 'Inter-Bold',
  },
  viewAllText: {
    fontSize: 16, // Increased from 14sp for better visibility
    fontWeight: '600',
    color: '#1D4ED8', // High contrast blue
    fontFamily: 'Inter-SemiBold',
  },
  activityList: {
    maxHeight: 200,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB', // Light gray border
  },
  activityIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2241DD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityTextContainer: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16, // Increased from 14sp for better visibility
    fontWeight: '600',
    color: '#000000', // Pure black for maximum contrast
    fontFamily: 'Inter-SemiBold',
  },
  activityTime: {
    fontSize: 15, // Increased from 14sp for better visibility
    fontWeight: '500',
    color: '#374151', // High contrast gray
    marginTop: 2,
    fontFamily: 'Inter-Medium',
  },
  activityStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default RecentActivity;
