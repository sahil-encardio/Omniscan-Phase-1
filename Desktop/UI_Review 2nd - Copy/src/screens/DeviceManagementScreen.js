import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, BorderRadius, Shadows } from '../styles/DesignSystem';
import ScreenHeader from './components/ScreenHeader';
import Card from '../components/Card';
import Button from '../components/Button';
import StatusIndicator from '../components/StatusIndicator';

const DeviceManagementScreen = ({ navigation }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [devices, setDevices] = useState([
    { 
      id: 1, 
      name: 'Omniscan-001', 
      status: 'connected', 
      battery: 85, 
      signal: -45,
      lastConnected: '2 minutes ago',
      firmware: '2.1.4'
    },
    { 
      id: 2, 
      name: 'Omniscan-002', 
      status: 'disconnected', 
      battery: 0, 
      signal: 0,
      lastConnected: '1 hour ago',
      firmware: '2.1.3'
    },
    { 
      id: 3, 
      name: 'Omniscan-003', 
      status: 'connecting', 
      battery: 92, 
      signal: -38,
      lastConnected: 'Just now',
      firmware: '2.1.4'
    },
  ]);

  const [firmwareUpdate, setFirmwareUpdate] = useState({
    currentVersion: '2.1.4',
    availableVersion: '2.1.5',
    isUpToDate: false,
    updateProgress: 0,
  });

  const startScanning = () => {
    setIsScanning(true);
    // Simulate scanning
    setTimeout(() => {
      setIsScanning(false);
      Alert.alert('Scan Complete', 'Found 3 devices');
    }, 3000);
  };

  const connectDevice = (deviceId) => {
    setDevices(devices.map(device => 
      device.id === deviceId 
        ? { ...device, status: 'connecting' }
        : device
    ));
    
    // Simulate connection
    setTimeout(() => {
      setDevices(devices.map(device => 
        device.id === deviceId 
          ? { ...device, status: 'connected' }
          : device
      ));
    }, 2000);
  };

  const disconnectDevice = (deviceId) => {
    setDevices(devices.map(device => 
      device.id === deviceId 
        ? { ...device, status: 'disconnected' }
        : device
    ));
  };

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => setRefreshing(false), 2000);
  };

  const handleFirmwareUpdate = () => {
    Alert.alert(
      'Firmware Update',
      'This will update the device firmware. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Update', onPress: () => {
          // Simulate firmware update
          setFirmwareUpdate(prev => ({ ...prev, updateProgress: 50 }));
        }}
      ]
    );
  };

  const handleFactoryReset = () => {
    Alert.alert(
      'Factory Reset',
      'This will erase all data and restore factory settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => {
          Alert.alert('Reset Complete', 'Device has been reset to factory settings');
        }}
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Device Management" navigation={navigation} />
      
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Bluetooth Scanner */}
        <Card style={styles.scannerCard}>
          <View style={styles.scannerHeader}>
            <Ionicons name="bluetooth" size={24} color="#2241DD" />
            <Text style={styles.sectionTitle}>Bluetooth Scanner</Text>
          </View>
          <Text style={styles.scannerDescription}>
            Discover and connect to nearby Omniscan devices
          </Text>
          <Button
            title={isScanning ? 'Scanning...' : 'Start Scan'}
            onPress={startScanning}
            disabled={isScanning}
            loading={isScanning}
            icon={<Ionicons name="search" size={16} color="#FFFFFF" />}
          />
        </Card>

        {/* Available Devices */}
        <Card style={styles.devicesCard}>
          <Text style={styles.sectionTitle}>Available Devices</Text>
          <Text style={styles.devicesCount}>{devices.length} devices found</Text>
          
          {devices.map(device => (
            <View key={device.id} style={styles.deviceItem}>
              <View style={styles.deviceInfo}>
                <View style={styles.deviceHeader}>
                  <Text style={styles.deviceName}>{device.name}</Text>
                  <StatusIndicator 
                    status={device.status} 
                    label={device.status.charAt(0).toUpperCase() + device.status.slice(1)}
                    size="small"
                  />
                </View>
                
                <View style={styles.deviceDetails}>
                  <View style={styles.detailItem}>
                    <Ionicons name="battery-half" size={16} color="#8DC63F" />
                    <Text style={styles.detailText}>{device.battery}%</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="cellular" size={16} color="#FAB900" />
                    <Text style={styles.detailText}>{device.signal} dBm</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="time" size={16} color="#666666" />
                    <Text style={styles.detailText}>{device.lastConnected}</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.deviceActions}>
                {device.status === 'connected' ? (
                  <Button
                    title="Disconnect"
                    variant="secondary"
                    size="small"
                    onPress={() => disconnectDevice(device.id)}
                  />
                ) : (
                  <Button
                    title="Connect"
                    size="small"
                    onPress={() => connectDevice(device.id)}
                    disabled={device.status === 'connecting'}
                    loading={device.status === 'connecting'}
                  />
                )}
              </View>
            </View>
          ))}
        </Card>

        {/* Device Settings */}
        <Card style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>Device Settings</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="settings" size={20} color="#2241DD" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>System Configuration</Text>
              <Text style={styles.settingDescription}>Configure device parameters and settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#666666" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="time" size={20} color="#2241DD" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Timing Settings</Text>
              <Text style={styles.settingDescription}>Set data collection intervals and timing</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#666666" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="cloud-upload" size={20} color="#8DC63F" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>FTP Configuration</Text>
              <Text style={styles.settingDescription}>Configure data upload settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#666666" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="wifi" size={20} color="#FAB900" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Network Settings</Text>
              <Text style={styles.settingDescription}>Configure WiFi and network connections</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#666666" />
          </TouchableOpacity>
        </Card>

        {/* Firmware Management */}
        <Card style={styles.firmwareCard}>
          <View style={styles.firmwareHeader}>
            <Ionicons name="hardware-chip" size={24} color="#2241DD" />
            <Text style={styles.sectionTitle}>Firmware Management</Text>
          </View>
          
          <View style={styles.firmwareInfo}>
            <View style={styles.firmwareRow}>
              <Text style={styles.firmwareLabel}>Current Version:</Text>
              <Text style={styles.firmwareValue}>{firmwareUpdate.currentVersion}</Text>
            </View>
            <View style={styles.firmwareRow}>
              <Text style={styles.firmwareLabel}>Available Version:</Text>
              <Text style={styles.firmwareValue}>{firmwareUpdate.availableVersion}</Text>
            </View>
            <View style={styles.firmwareRow}>
              <Text style={styles.firmwareLabel}>Status:</Text>
              <StatusIndicator 
                status={firmwareUpdate.isUpToDate ? 'success' : 'warning'}
                label={firmwareUpdate.isUpToDate ? 'Up to date' : 'Update available'}
                size="small"
              />
            </View>
          </View>
          
          {!firmwareUpdate.isUpToDate && (
            <Button
              title="Update Firmware"
              onPress={handleFirmwareUpdate}
              icon={<Ionicons name="download" size={16} color="#FFFFFF" />}
            />
          )}
        </Card>

        {/* Device Information */}
        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Device Information</Text>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Ionicons name="barcode" size={20} color="#666666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Serial Number</Text>
                <Text style={styles.infoValue}>OS-2024-001</Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <Ionicons name="cube" size={20} color="#666666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Model</Text>
                <Text style={styles.infoValue}>Omniscan Pro</Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <Ionicons name="battery-half" size={20} color="#8DC63F" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Battery Status</Text>
                <Text style={styles.infoValue}>Good (85%)</Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <Ionicons name="hardware-chip" size={20} color="#666666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Hardware Version</Text>
                <Text style={styles.infoValue}>v1.2</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Factory Reset */}
        <Card style={styles.resetCard}>
          <View style={styles.resetHeader}>
            <Ionicons name="warning" size={24} color="#FF0000" />
            <Text style={styles.sectionTitle}>Factory Reset</Text>
          </View>
          <Text style={styles.resetWarning}>
            This will erase all data and restore factory settings. This action cannot be undone.
          </Text>
          <Button
            title="Factory Reset"
            variant="danger"
            onPress={handleFactoryReset}
            icon={<Ionicons name="refresh" size={16} color="#FFFFFF" />}
          />
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  scannerCard: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  scannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#000000',
    marginLeft: Spacing.sm,
  },
  scannerDescription: {
    fontSize: 15,
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
    color: '#666666',
    marginBottom: Spacing.lg,
  },
  devicesCard: {
    marginBottom: Spacing.lg,
  },
  devicesCount: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter-SemiBold',
    color: '#666666',
    marginBottom: Spacing.md,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: '#F8F9FA',
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#000000',
  },
  deviceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter-SemiBold',
    color: '#666666',
    marginLeft: Spacing.xs,
  },
  deviceActions: {
    marginLeft: Spacing.md,
  },
  settingsCard: {
    marginBottom: Spacing.lg,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#000000',
    marginBottom: Spacing.xs,
  },
  settingDescription: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter-SemiBold',
    color: '#666666',
  },
  firmwareCard: {
    marginBottom: Spacing.lg,
  },
  firmwareHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  firmwareInfo: {
    marginBottom: Spacing.lg,
  },
  firmwareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  firmwareLabel: {
    fontSize: 15,
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
    color: '#666666',
  },
  firmwareValue: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#000000',
  },
  infoCard: {
    marginBottom: Spacing.lg,
  },
  infoGrid: {
    // Container for info items
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  infoContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter-SemiBold',
    color: '#666666',
    marginBottom: Spacing.xs,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#000000',
  },
  resetCard: {
    marginBottom: Spacing.lg,
  },
  resetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  resetWarning: {
    fontSize: 15,
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
    color: '#FF0000',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
});

export default DeviceManagementScreen;
