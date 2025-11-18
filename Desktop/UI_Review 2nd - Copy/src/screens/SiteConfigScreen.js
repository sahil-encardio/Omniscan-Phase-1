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
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../styles/DesignSystem';
import ScreenHeader from './components/ScreenHeader';
import Card from '../components/Card';

const { width, height } = Dimensions.get('window');

const SiteConfigScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('Configuration');

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 2000);
  };

  const siteData = {
    siteName: "Main Street Bridge",
    location: "Downtown District",
    coordinates: "40.7128° N, 74.0060° W",
    elevation: "15.2m",
    installationDate: "15/01/2024",
    lastCalibration: "20/01/2024",
    nextCalibration: "20/02/2024",
    status: "Active"
  };

  const sensorConfigs = [
    {
      id: 1,
      name: "Load Cell LC-001",
      type: "Load Cell",
      location: "Bridge North - Pier 1",
      status: "Active",
      batteryLevel: 89,
      lastReading: "2,450.5 kg",
      lastUpdate: "2 min ago"
    },
    {
      id: 2,
      name: "Temperature TS-002",
      type: "Temperature",
      location: "Bridge North - Deck",
      status: "Active",
      batteryLevel: 76,
      lastReading: "23.5°C",
      lastUpdate: "1 min ago"
    },
    {
      id: 3,
      name: "Pressure PS-003",
      type: "Pressure",
      location: "Bridge Foundation",
      status: "Warning",
      batteryLevel: 45,
      lastReading: "1013.2 hPa",
      lastUpdate: "5 min ago"
    }
  ];

  const tabs = [
    { id: 'Configuration', label: 'Configuration', icon: 'settings' },
    { id: 'Sensors', label: 'Sensors', icon: 'hardware-chip' },
    { id: 'Alerts', label: 'Alerts', icon: 'notifications' }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return '#10B981';
      case 'Warning': return '#F59E0B';
      case 'Error': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getBatteryColor = (level) => {
    if (level > 70) return '#10B981';
    if (level > 40) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <View style={styles.container}>
      <ScreenHeader 
        title="Site Configuration"
        subtitle="Bridge Monitoring Setup"
        navigation={navigation}
        showBackButton={true}
        showLogo={true}
        rightAction={
          <TouchableOpacity style={styles.saveButton}>
            <Ionicons name="save" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />
      
      {/* Navigation Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              selectedTab === tab.id && styles.activeTab
            ]}
            onPress={() => setSelectedTab(tab.id)}
          >
            <Ionicons 
              name={tab.icon} 
              size={20} 
              color={selectedTab === tab.id ? "#FFFFFF" : "#6B7280"} 
            />
            <Text style={[
              styles.tabText,
              selectedTab === tab.id && styles.activeTabText
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Site Information Card */}
        <Card style={styles.siteCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Site Information</Text>
            <TouchableOpacity style={styles.editButton}>
              <Ionicons name="create" size={20} color="#2241DD" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.siteDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Site Name:</Text>
              <Text style={styles.detailValue}>{siteData.siteName}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Location:</Text>
              <Text style={styles.detailValue}>{siteData.location}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Coordinates:</Text>
              <Text style={styles.detailValue}>{siteData.coordinates}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Elevation:</Text>
              <Text style={styles.detailValue}>{siteData.elevation}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Installation Date:</Text>
              <Text style={styles.detailValue}>{siteData.installationDate}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Last Calibration:</Text>
              <Text style={styles.detailValue}>{siteData.lastCalibration}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Next Calibration:</Text>
              <Text style={styles.detailValue}>{siteData.nextCalibration}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status:</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(siteData.status) }]}>
                <Text style={styles.statusText}>{siteData.status}</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Sensor Configuration Card */}
        <Card style={styles.sensorsCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Sensor Configuration</Text>
            <TouchableOpacity style={styles.addButton}>
              <Ionicons name="add" size={20} color="#2241DD" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.sensorsList}>
            {sensorConfigs.map((sensor) => (
              <View key={sensor.id} style={styles.sensorItem}>
                <View style={styles.sensorHeader}>
                  <View style={styles.sensorInfo}>
                    <Text style={styles.sensorName}>{sensor.name}</Text>
                    <Text style={styles.sensorType}>{sensor.type}</Text>
                    <Text style={styles.sensorLocation}>{sensor.location}</Text>
                  </View>
                  <View style={styles.sensorActions}>
                    <View style={[styles.sensorStatus, { backgroundColor: getStatusColor(sensor.status) }]}>
                      <Text style={styles.sensorStatusText}>{sensor.status}</Text>
                    </View>
                    <TouchableOpacity style={styles.sensorMenu}>
                      <Ionicons name="ellipsis-vertical" size={16} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                </View>
                
                <View style={styles.sensorMetrics}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Battery</Text>
                    <View style={styles.batteryContainer}>
                      <View style={styles.batteryBar}>
                        <View 
                          style={[
                            styles.batteryFill, 
                            { 
                              width: `${sensor.batteryLevel}%`,
                              backgroundColor: getBatteryColor(sensor.batteryLevel)
                            }
                          ]} 
                        />
                      </View>
                      <Text style={[styles.batteryText, { color: getBatteryColor(sensor.batteryLevel) }]}>
                        {sensor.batteryLevel}%
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Last Reading</Text>
                    <Text style={styles.metricValue}>{sensor.lastReading}</Text>
                  </View>
                  
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Last Update</Text>
                    <Text style={styles.metricValue}>{sensor.lastUpdate}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: '#2241DD',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 8,
    fontFamily: 'Inter-Medium',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  siteCard: {
    marginTop: 16,
    marginBottom: 16,
  },
  sensorsCard: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter-Bold',
  },
  editButton: {
    padding: 4,
  },
  addButton: {
    padding: 4,
  },
  siteDetails: {
    gap: 16,
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
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
  sensorsList: {
    gap: 16,
  },
  sensorItem: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sensorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sensorInfo: {
    flex: 1,
  },
  sensorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  sensorType: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2241DD',
    fontFamily: 'Inter-Medium',
    marginBottom: 2,
  },
  sensorLocation: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  sensorActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sensorStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sensorStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
  sensorMenu: {
    padding: 4,
  },
  sensorMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  metricItem: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: 'Inter-Medium',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  batteryBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  batteryFill: {
    height: '100%',
    borderRadius: 3,
  },
  batteryText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
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

export default SiteConfigScreen;


