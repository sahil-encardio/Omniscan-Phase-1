import React, { useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBLE } from '../context/BLEContext';
import { Colors, Spacing, BorderRadius } from '../styles/DesignSystem';

const BLEDeviceScannerModal = ({ visible, onClose, onDeviceSelect, navigation }) => {
  const { isScanning, devices, startScan, stopScan, bleState, connectToDevice } = useBLE();

  useEffect(() => {
    if (visible && (bleState === 'PoweredOn' || bleState === 'Unknown')) {
      startScan();
    }

    return () => {
      stopScan();
    };
  }, [visible, bleState]);

  const getSignalStrength = (rssi) => {
    if (!rssi) return { bars: 1, color: '#EF4444', label: 'Poor' };
    
    if (rssi > -60) {
      return { bars: 4, color: '#10B981', label: 'Excellent' };
    } else if (rssi > -70) {
      return { bars: 3, color: '#8DC63F', label: 'Good' };
    } else if (rssi > -80) {
      return { bars: 2, color: '#F59E0B', label: 'Fair' };
    } else {
      return { bars: 1, color: '#EF4444', label: 'Poor' };
    }
  };

  const SignalStrengthIndicator = ({ rssi }) => {
    const { bars, color } = getSignalStrength(rssi);

    return (
      <View style={styles.signalBars}>
        {[1, 2, 3, 4].map((bar) => (
          <View
            key={bar}
            style={[
              styles.signalBar,
              { height: bar * 4 + 4 },
              bar <= bars && { backgroundColor: color },
            ]}
          />
        ))}
      </View>
    );
  };

  const handleDevicePress = async (device) => {
    try {
      await connectToDevice(device.id);
      
      // Check if device name contains "EDI" (case insensitive) to navigate to EDI55 config
      if (device.name && device.name.toUpperCase().includes('EDI')) {
        console.log('EDI device detected, navigating to EDI55 Config');
        onClose();
        // Navigate after a short delay to ensure modal is closed
        setTimeout(() => {
          navigation.navigate('EDI55Config');
        }, 300);
      } else {
      onClose();
      }
      
      if (onDeviceSelect) {
        onDeviceSelect(device);
      }
    } catch (error) {
      console.error('Connection error:', error);
    }
  };

  const renderDevice = ({ item }) => {
    const { color } = getSignalStrength(item.rssi);

    return (
      <TouchableOpacity
        style={styles.deviceItem}
        onPress={() => handleDevicePress(item)}
      >
        <View style={styles.deviceIconContainer}>
          <Ionicons name="bluetooth" size={24} color="#2241DD" />
        </View>

        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName}>{item.name}</Text>
          <Text style={styles.deviceId} numberOfLines={1}>
            {item.id}
          </Text>
          {item.serviceUUIDs && item.serviceUUIDs.length > 0 && (
            <Text style={styles.deviceServices}>
              {item.serviceUUIDs.length} service{item.serviceUUIDs.length > 1 ? 's' : ''}
            </Text>
          )}
        </View>

        <View style={styles.deviceMeta}>
          <SignalStrengthIndicator rssi={item.rssi} />
          <Text style={[styles.rssiText, { color }]}>
            {item.rssi ? `${item.rssi} dBm` : 'N/A'}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    if (isScanning) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#2241DD" />
          <Text style={styles.emptyStateText}>Scanning for devices...</Text>
          <Text style={styles.emptyStateSubtext}>
            Make sure your device is powered on and nearby
          </Text>
        </View>
      );
    }

    if (bleState !== 'PoweredOn' && bleState !== 'Unknown') {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="bluetooth-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyStateText}>Bluetooth is Off</Text>
          <Text style={styles.emptyStateSubtext}>
            Please turn on Bluetooth to scan for devices
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Ionicons name="search-outline" size={64} color="#D1D5DB" />
        <Text style={styles.emptyStateText}>No Devices Found</Text>
        <Text style={styles.emptyStateSubtext}>
          Tap the scan button to search again
        </Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="bluetooth" size={24} color="#2241DD" />
            <Text style={styles.headerTitle}>BLE Devices</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Scan Status Bar */}
        <View style={styles.statusBar}>
          <View style={styles.statusInfo}>
            {isScanning && (
              <ActivityIndicator size="small" color="#2241DD" style={styles.statusSpinner} />
            )}
            <Text style={styles.statusText}>
              {isScanning
                ? `Scanning... (${devices.length} found)`
                : `${devices.length} device${devices.length !== 1 ? 's' : ''} found`}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.scanButton, isScanning && styles.scanButtonActive]}
            onPress={isScanning ? stopScan : startScan}
            disabled={bleState !== 'PoweredOn'}
          >
            <Ionicons
              name={isScanning ? 'stop-circle-outline' : 'scan-circle-outline'}
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.scanButtonText}>
              {isScanning ? 'Stop' : 'Scan'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Device List */}
        <FlatList
          data={devices}
          renderItem={renderDevice}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter-Bold',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusSpinner: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: 'Inter-SemiBold',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2241DD',
  },
  scanButtonActive: {
    backgroundColor: '#EF4444',
  },
  scanButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  deviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deviceInfo: {
    flex: 1,
    marginRight: 12,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  deviceId: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
    marginBottom: 2,
  },
  deviceServices: {
    fontSize: 11,
    fontWeight: '500',
    color: '#2241DD',
    fontFamily: 'Inter-Medium',
  },
  deviceMeta: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  signalBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 20,
    marginBottom: 4,
  },
  signalBar: {
    width: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
  },
  rssiText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    fontFamily: 'Inter-SemiBold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: '#9CA3AF',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default BLEDeviceScannerModal;

