import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions,
  SafeAreaView,
  RefreshControl,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../styles/DesignSystem';
import ScreenHeader from './components/ScreenHeader';
import Card from '../components/Card';

const { width, height } = Dimensions.get('window');

const ProjectSettingsScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [settings, setSettings] = useState({
    autoSync: true,
    notifications: true,
    dataRetention: true,
    alerts: true,
    locationTracking: false,
    batteryOptimization: true
  });

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 2000);
  };

  const toggleSetting = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const projectInfo = {
    name: "Bridge Monitoring System",
    version: "v2.1.4",
    lastUpdated: "15/01/2024",
    dataSize: "2.4 GB",
    totalSensors: 12,
    activeSensors: 10
  };

  const settingsSections = [
    {
      title: "Data Management",
      items: [
        {
          key: "autoSync",
          title: "Auto Sync",
          subtitle: "Automatically sync data every 15 minutes",
          icon: "sync"
        },
        {
          key: "dataRetention",
          title: "Data Retention",
          subtitle: "Keep data for 1 year",
          icon: "time"
        },
        {
          key: "batteryOptimization",
          title: "Battery Optimization",
          subtitle: "Reduce battery usage during low power",
          icon: "battery-half"
        }
      ]
    },
    {
      title: "Notifications",
      items: [
        {
          key: "notifications",
          title: "Push Notifications",
          subtitle: "Receive alerts and updates",
          icon: "notifications"
        },
        {
          key: "alerts",
          title: "Critical Alerts",
          subtitle: "Immediate alerts for critical issues",
          icon: "warning"
        }
      ]
    },
    {
      title: "Privacy & Security",
      items: [
        {
          key: "locationTracking",
          title: "Location Tracking",
          subtitle: "Track device location for monitoring",
          icon: "location"
        }
      ]
    }
  ];

  return (
    <View style={styles.container}>
      <ScreenHeader 
        title="Project Settings"
        subtitle="Configuration & Preferences"
        navigation={navigation}
        showBackButton={true}
        showLogo={true}
        rightAction={
          <TouchableOpacity style={styles.saveButton}>
            <Ionicons name="checkmark" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Project Information Card */}
        <Card style={styles.projectCard}>
          <Text style={styles.cardTitle}>Project Information</Text>
          <View style={styles.projectDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Project Name:</Text>
              <Text style={styles.detailValue}>{projectInfo.name}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Version:</Text>
              <Text style={styles.detailValue}>{projectInfo.version}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Last Updated:</Text>
              <Text style={styles.detailValue}>{projectInfo.lastUpdated}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Data Size:</Text>
              <Text style={styles.detailValue}>{projectInfo.dataSize}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total Sensors:</Text>
              <Text style={styles.detailValue}>{projectInfo.totalSensors}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Active Sensors:</Text>
              <Text style={styles.detailValue}>{projectInfo.activeSensors}</Text>
            </View>
          </View>
        </Card>

        {/* Settings Sections */}
        {settingsSections.map((section, sectionIndex) => (
          <Card key={sectionIndex} style={styles.settingsCard}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.settingsList}>
              {section.items.map((item, itemIndex) => (
                <View 
                  key={item.key} 
                  style={[
                    styles.settingItem,
                    itemIndex < section.items.length - 1 && styles.settingItemBorder
                  ]}
                >
                  <View style={styles.settingInfo}>
                    <View style={styles.settingIconContainer}>
                      <Ionicons 
                        name={item.icon} 
                        size={20} 
                        color="#2241DD" 
                      />
                    </View>
                    <View style={styles.settingTextContainer}>
                      <Text style={styles.settingTitle}>{item.title}</Text>
                      <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                    </View>
                  </View>
                  <Switch
                    value={settings[item.key]}
                    onValueChange={() => toggleSetting(item.key)}
                    trackColor={{ false: '#E5E7EB', true: '#2241DD' }}
                    thumbColor={settings[item.key] ? '#FFFFFF' : '#FFFFFF'}
                  />
                </View>
              ))}
            </View>
          </Card>
        ))}

        {/* Action Buttons */}
        <Card style={styles.actionsCard}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="download" size={20} color="#2241DD" />
            <Text style={styles.actionButtonText}>Export Data</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="cloud-upload" size={20} color="#2241DD" />
            <Text style={styles.actionButtonText}>Backup Project</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="refresh" size={20} color="#2241DD" />
            <Text style={styles.actionButtonText}>Reset Settings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionButton, styles.dangerButton]}>
            <Ionicons name="trash" size={20} color="#EF4444" />
            <Text style={[styles.actionButtonText, styles.dangerText]}>Delete Project</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Checking for new update...</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  saveButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  projectCard: {
    marginTop: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter-Bold',
    marginBottom: 16,
  },
  projectDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: 'Inter-Medium',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
  },
  settingsCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  settingsList: {
    gap: 0,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  actionsCard: {
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2241DD',
    fontFamily: 'Inter-Medium',
    marginLeft: 12,
  },
  dangerButton: {
    borderBottomWidth: 0,
  },
  dangerText: {
    color: '#EF4444',
  },
  footer: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
});

export default ProjectSettingsScreen;


