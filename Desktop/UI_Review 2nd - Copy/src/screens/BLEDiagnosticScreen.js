import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBLE } from '../context/BLEContext';
import { Colors, Spacing, Typography, BorderRadius } from '../styles/DesignSystem';
import BLEService from '../services/BLEService';
import { Buffer } from 'buffer';
import { getServiceName, getServiceDescription, getCharacteristicName, getCharacteristicDescription } from '../constants/BLEUUIDMap';

const BLEDiagnosticScreen = ({ navigation }) => {
  const { connectedDevice, rssi } = useBLE();
  const [services, setServices] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [expandedService, setExpandedService] = useState(null);
  const [characteristicData, setCharacteristicData] = useState({});

  // Discover all services and characteristics
  const discoverServices = async () => {
    if (!connectedDevice) {
      Alert.alert('Not Connected', 'Please connect to a device first.');
      return;
    }

    setIsScanning(true);
    try {
      console.log('🔍 Starting service discovery...');
      console.log('Device ID:', connectedDevice.id);
      
      const manager = BLEService._ensureManager();
      
      // Use the connected device from BLEService
      const device = BLEService.connectedDevice;
      
      if (!device) {
        throw new Error('Device not found in BLEService. Please reconnect.');
      }

      console.log('✅ Device found:', device.id);

      // Discover all services and characteristics
      await device.discoverAllServicesAndCharacteristics();
      
      const discoveredServices = await device.services();
      console.log(`✅ Found ${discoveredServices.length} services`);

      const servicesData = [];

      for (const service of discoveredServices) {
        console.log(`📦 Service: ${service.uuid}`);
        
        const characteristics = await service.characteristics();
        console.log(`  └─ ${characteristics.length} characteristics`);

        const characteristicsData = [];

        for (const char of characteristics) {
          console.log(`  └─ Characteristic: ${char.uuid}`);
          console.log(`     Properties: R=${char.isReadable} W=${char.isWritableWithResponse} N=${char.isNotifiable}`);

          characteristicsData.push({
            uuid: char.uuid,
            isReadable: char.isReadable,
            isWritable: char.isWritableWithResponse || char.isWritableWithoutResponse,
            isNotifiable: char.isNotifiable,
            isIndicatable: char.isIndicatable,
          });
        }

        servicesData.push({
          uuid: service.uuid,
          characteristics: characteristicsData,
        });
      }

      setServices(servicesData);
      console.log('✅ Service discovery complete');
      
    } catch (error) {
      console.error('❌ Service discovery error:', error);
      Alert.alert('Discovery Error', error.message || 'Failed to discover services');
    } finally {
      setIsScanning(false);
    }
  };

  // Read a characteristic
  const readCharacteristic = async (serviceUuid, charUuid) => {
    try {
      console.log(`📖 Reading ${charUuid}...`);
      
      const manager = BLEService._ensureManager();
      const characteristic = await manager.readCharacteristicForDevice(
        connectedDevice.id,
        serviceUuid,
        charUuid
      );

      if (characteristic && characteristic.value) {
        const buffer = Buffer.from(characteristic.value, 'base64');
        const hex = buffer.toString('hex');
        
        console.log(`✅ Read success: ${hex}`);
        console.log(`   Length: ${buffer.length} bytes`);

        // Try to parse as floats if length is multiple of 4
        let parsedFloats = null;
        if (buffer.length % 4 === 0 && buffer.length >= 4) {
          parsedFloats = [];
          for (let i = 0; i < buffer.length / 4; i++) {
            try {
              parsedFloats.push(buffer.readFloatLE(i * 4));
            } catch (e) {
              parsedFloats.push('Error');
            }
          }
        }

        setCharacteristicData(prev => ({
          ...prev,
          [`${serviceUuid}-${charUuid}`]: {
            hex,
            length: buffer.length,
            floats: parsedFloats,
            raw: characteristic.value,
          }
        }));

        return true;
      }

      Alert.alert('No Data', 'Characteristic returned no data');
      return false;
      
    } catch (error) {
      console.error(`❌ Read error:`, error);
      Alert.alert('Read Error', error.message || 'Failed to read characteristic');
      return false;
    }
  };

  // Subscribe to notifications
  const subscribeToNotifications = async (serviceUuid, charUuid) => {
    try {
      console.log(`🔔 Subscribing to notifications: ${charUuid}...`);
      
      const manager = BLEService._ensureManager();
      
      const subscription = manager.monitorCharacteristicForDevice(
        connectedDevice.id,
        serviceUuid,
        charUuid,
        (error, characteristic) => {
          if (error) {
            console.error('❌ Notification error:', error);
            return;
          }

          if (characteristic && characteristic.value) {
            const buffer = Buffer.from(characteristic.value, 'base64');
            const hex = buffer.toString('hex');
            
            console.log(`🔔 Notification received: ${hex}`);
            console.log(`   Length: ${buffer.length} bytes`);

            // Try to parse as floats
            let parsedFloats = null;
            if (buffer.length % 4 === 0 && buffer.length >= 4) {
              parsedFloats = [];
              for (let i = 0; i < buffer.length / 4; i++) {
                try {
                  parsedFloats.push(buffer.readFloatLE(i * 4));
                } catch (e) {
                  parsedFloats.push('Error');
                }
              }
            }

            setCharacteristicData(prev => ({
              ...prev,
              [`${serviceUuid}-${charUuid}`]: {
                hex,
                length: buffer.length,
                floats: parsedFloats,
                raw: characteristic.value,
                isNotification: true,
              }
            }));
          }
        }
      );

      Alert.alert('Subscribed', 'Listening for notifications... Data will appear when sent by device.');
      
      // Store subscription for cleanup
      setCharacteristicData(prev => ({
        ...prev,
        [`${serviceUuid}-${charUuid}-subscription`]: subscription,
      }));

    } catch (error) {
      console.error('❌ Subscribe error:', error);
      Alert.alert('Subscribe Error', error.message || 'Failed to subscribe');
    }
  };

  // Auto-discover on mount if connected
  useEffect(() => {
    if (connectedDevice && services.length === 0) {
      discoverServices();
    }
  }, [connectedDevice]);

  // Render empty state
  if (!connectedDevice) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="bluetooth-outline" size={80} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No Device Connected</Text>
          <Text style={styles.emptySubtitle}>
            Connect to your EDI-55 device from the Home tab first
          </Text>
          <TouchableOpacity
            style={styles.goToHomeButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Ionicons name="home-outline" size={20} color="#FFFFFF" />
            <Text style={styles.goToHomeText}>Go to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>BLE Diagnostic</Text>
          <Text style={styles.deviceName}>{connectedDevice.name || connectedDevice.id}</Text>
          {rssi !== null && <Text style={styles.rssi}>RSSI: {rssi} dBm</Text>}
        </View>
      </View>

      {/* Scan Button */}
      <View style={styles.scanContainer}>
        <TouchableOpacity
          style={[styles.scanButton, isScanning && styles.scanButtonDisabled]}
          onPress={discoverServices}
          disabled={isScanning}
        >
          {isScanning ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Ionicons name="search" size={20} color="#FFFFFF" />
          )}
          <Text style={styles.scanButtonText}>
            {isScanning ? 'Discovering...' : services.length > 0 ? 'Re-scan Services' : 'Discover Services'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.scanHint}>Found {services.length} services</Text>
      </View>

      {/* Services List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {services.map((service, serviceIndex) => (
          <View key={serviceIndex} style={styles.serviceCard}>
            <TouchableOpacity
              style={styles.serviceHeader}
              onPress={() => setExpandedService(expandedService === service.uuid ? null : service.uuid)}
            >
              <View style={styles.serviceHeaderLeft}>
                <Ionicons name="server-outline" size={20} color={Colors.primary} />
                <View style={styles.serviceHeaderText}>
                  <Text style={styles.serviceLabel}>
                    {getServiceName(service.uuid) || 'Service'}
                  </Text>
                  <Text style={styles.serviceUuid}>{service.uuid}</Text>
                  {getServiceDescription(service.uuid) && (
                    <Text style={styles.serviceDescription}>
                      {getServiceDescription(service.uuid)}
                    </Text>
                  )}
                </View>
              </View>
              <View style={styles.chevronContainer}>
                <Ionicons
                  name={expandedService === service.uuid ? 'chevron-up' : 'chevron-down'}
                  size={24}
                  color="#6B7280"
                />
              </View>
            </TouchableOpacity>

            {expandedService === service.uuid && (
              <View style={styles.characteristicsContainer}>
                {service.characteristics.map((char, charIndex) => {
                  const dataKey = `${service.uuid}-${char.uuid}`;
                  const data = characteristicData[dataKey];

                  return (
                    <View key={charIndex} style={styles.characteristicCard}>
                      <View style={styles.charHeader}>
                        <Text style={styles.charLabel}>
                          {getCharacteristicName(char.uuid) || 'Characteristic'}
                        </Text>
                        <Text style={styles.charUuid}>{char.uuid}</Text>
                        {getCharacteristicDescription(char.uuid) && (
                          <Text style={styles.charDescription}>
                            {getCharacteristicDescription(char.uuid)}
                          </Text>
                        )}
                      </View>

                      <View style={styles.charProperties}>
                        {char.isReadable && <View style={styles.propBadge}><Text style={styles.propText}>READ</Text></View>}
                        {char.isWritable && <View style={styles.propBadge}><Text style={styles.propText}>WRITE</Text></View>}
                        {char.isNotifiable && <View style={styles.propBadge}><Text style={styles.propText}>NOTIFY</Text></View>}
                        {char.isIndicatable && <View style={styles.propBadge}><Text style={styles.propText}>INDICATE</Text></View>}
                      </View>

                      <View style={styles.charActions}>
                        {char.isReadable && (
                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => readCharacteristic(service.uuid, char.uuid)}
                          >
                            <Ionicons name="eye-outline" size={16} color="#FFFFFF" />
                            <Text style={styles.actionButtonText}>Read</Text>
                          </TouchableOpacity>
                        )}
                        {char.isNotifiable && (
                          <TouchableOpacity
                            style={[styles.actionButton, styles.actionButtonNotify]}
                            onPress={() => subscribeToNotifications(service.uuid, char.uuid)}
                          >
                            <Ionicons name="notifications-outline" size={16} color="#FFFFFF" />
                            <Text style={styles.actionButtonText}>Subscribe</Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      {data && (
                        <View style={styles.dataContainer}>
                          <Text style={styles.dataLabel}>
                            {data.isNotification ? '🔔 Notification Data:' : '📖 Read Data:'}
                          </Text>
                          <Text style={styles.dataLength}>Length: {data.length} bytes</Text>
                          
                          {/* Hex Data */}
                          <View style={styles.hexSection}>
                            <Text style={styles.sectionTitle}>📦 Raw Hex Data:</Text>
                            <Text style={styles.dataHex}>{data.hex}</Text>
                          </View>
                          
                          {/* Float Decoding */}
                          {data.floats && data.floats.length > 0 && (
                            <View style={styles.floatsSection}>
                              <Text style={styles.sectionTitle} ellipsizeMode="clip">🧮 Decoded Floats (Little-Endian):</Text>
                              <View style={styles.floatsGrid}>
                                {data.floats.map((float, i) => {
                                  const value = typeof float === 'number' ? float : 0;
                                  const isActive = value !== 0;
                                  return (
                                    <View key={i} style={[styles.floatItem, isActive && styles.floatItemActive]}>
                                      <Text style={styles.floatIndex}>[{i}]</Text>
                                      <Text style={[styles.floatValue, isActive && styles.floatValueActive]}>
                                        {typeof float === 'number' ? float.toFixed(4) : float}
                                      </Text>
                                      {isActive && i === 1 && value < 10 && (
                                        <Text style={styles.floatHint}>reference factor</Text>
                                      )}
                                      {isActive && i === 7 && (
                                        <Text style={styles.floatHint}>4-20mA</Text>
                                      )}
                                      {isActive && i === 8 && value > 100 && (
                                        <Text style={styles.floatHint}>Frequency (Hz)</Text>
                                      )}
                                      {isActive && i === 9 && value > 0 && value < 100 && (
                                        <Text style={styles.floatHint}>Temperature (°C)</Text>
                                      )}
                                      {isActive && i === 10 && value > 0 && value < 100 && (
                                        <Text style={styles.floatHint}>Temperature (°C)</Text>
                                      )}
                                      {isActive && i === 11 && value > 0 && value < 100 && (
                                        <Text style={styles.floatHint}>Temperature (°C)</Text>
                                      )}
                                    </View>
                                  );
                                })}
                              </View>
                              
                              {/* Active Sensors Summary */}
                              <View style={styles.summarySection}>
                                <Text style={styles.summaryTitle} ellipsizeMode="clip">🧠 Active Sensors Detected:</Text>
                                {data.floats.map((float, i) => {
                                  const value = typeof float === 'number' ? float : 0;
                                  if (value === 0) return null;
                                  
                                  let sensorName = '';
                                  let interpretation = '';
                                  
                                  if (i === 0) { sensorName = 'Load Cell'; interpretation = `${value.toFixed(2)} units`; }
                                  else if (i === 1) { sensorName = 'Reference Factor'; interpretation = `${value.toFixed(3)}`; }
                                  else if (i === 2) { sensorName = 'Voltage Output'; interpretation = `${value.toFixed(2)} V`; }
                                  else if (i === 3) { sensorName = 'Tilt Meter (EL)'; interpretation = `${value.toFixed(2)}°`; }
                                  else if (i === 4) { sensorName = 'Tilt Temp (EL)'; interpretation = `${value.toFixed(2)} °C`; }
                                  else if (i === 5) { sensorName = 'Tilt X (MEMS)'; interpretation = `${value.toFixed(2)}°`; }
                                  else if (i === 6) { sensorName = 'Tilt Y (MEMS)'; interpretation = `${value.toFixed(2)}°`; }
                                  else if (i === 7) { sensorName = '4-20mA Sensor'; interpretation = `${value.toFixed(2)} mA`; }
                                  else if (i === 8) { sensorName = 'VW Frequency'; interpretation = `${value.toFixed(2)} Hz`; }
                                  else if (i === 9) { sensorName = 'VW Temperature'; interpretation = `${value.toFixed(2)} °C`; }
                                  else if (i === 10) { sensorName = 'Thermistor'; interpretation = `${value.toFixed(2)} °C`; }
                                  else if (i === 11) { sensorName = 'RTD'; interpretation = `${value.toFixed(2)} °C`; }
                                  
                                  return (
                                    <View key={i} style={styles.summaryItem}>
                                      <Text style={styles.summaryIndex}>[{i}]</Text>
                                      <Text style={styles.summarySensor} ellipsizeMode="clip">{sensorName}:</Text>
                                      <Text style={styles.summaryValue} ellipsizeMode="clip">{interpretation}</Text>
                                    </View>
                                  );
                                })}
                              </View>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ))}

        {services.length === 0 && !isScanning && (
          <View style={styles.noServices}>
            <Text style={styles.noServicesText}>Tap "Discover Services" to scan</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  deviceName: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  rssi: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  scanContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
  },
  scanButtonDisabled: {
    opacity: 0.6,
  },
  scanButtonText: {
    ...Typography.button,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  scanHint: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  scrollView: {
    flex: 1,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 80,
  },
  serviceHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  chevronContainer: {
    marginLeft: 8,
    marginTop: 8,
  },
  serviceHeaderText: {
    marginLeft: 12,
    flex: 1,
    paddingRight: 12,
  },
  serviceLabel: {
    ...Typography.caption,
    color: Colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
    lineHeight: 22,
  },
  serviceUuid: {
    //...Typography.body,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: 16,
    flexWrap: 'wrap',
    width: '100%',
  },
  serviceDescription: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 6,
    lineHeight: 19,
    flexWrap: 'wrap',
  },
  characteristicsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  characteristicCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: BorderRadius.md,
    marginBottom: 12,
  },
  charHeader: {
    marginBottom: 10,
  },
  charLabel: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    lineHeight: 20,
  },
  charUuid: {
    //...Typography.body,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: 16,
    flexWrap: 'wrap',
    width: '100%',
  },
  charDescription: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18,
    flexWrap: 'wrap',
  },
  charProperties: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  propBadge: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 4,
  },
  propText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3730A3',
  },
  charActions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    marginRight: 8,
  },
  actionButtonNotify: {
    backgroundColor: '#10B981',
  },
  actionButtonText: {
    color: '#FFFFFF',
    marginLeft: 6,
    fontWeight: '600',
    fontSize: 14,
  },
  dataContainer: {
    marginTop: 12,
    padding: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dataLabel: {
    color: Colors.text,
    fontWeight: '700',
    marginBottom: 8,
    fontSize: 15,
  },
  dataLength: {
    color: Colors.textSecondary,
    marginBottom: 12,
    fontSize: 13,
  },
  hexSection: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
  },
  sectionTitle: {
    color: Colors.text,
    fontWeight: '700',
    marginBottom: 8,
    fontSize: 15,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  dataHex: {
    //...Typography.caption,
    fontFamily: 'monospace',
    color: '#6B7280',
    fontSize: 10,
    lineHeight: 14,
    flexWrap: 'wrap',
    width: '100%',
  },
  floatsSection: {
    marginTop: 8,
    width: '100%',
  },
  floatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  floatItem: {
    backgroundColor: '#E5E7EB',
    padding: 10,
    borderRadius: 8,
    marginRight: 10,
    marginBottom: 10,
    minWidth: 120,
  },
  floatItemActive: {
    backgroundColor: '#DBEAFE',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  floatIndex: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '700',
  },
  floatValue: {
    fontFamily: 'monospace',
    color: '#4B5563',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  floatValueActive: {
    color: '#1E40AF',
  },
  floatHint: {
    color: '#6B7280',
    fontSize: 11,
    marginTop: 3,
    fontStyle: 'italic',
  },
  summarySection: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10B981',
    width: '100%',
  },
  summaryTitle: {
    color: '#059669',
    fontWeight: '700',
    marginBottom: 12,
    fontSize: 15,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    paddingVertical: 4,
  },
  summaryIndex: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '600',
    marginRight: 8,
    width: 28,
  },
  summarySensor: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  summaryValue: {
    fontFamily: 'monospace',
    color: '#059669',
    fontSize: 16,
    fontWeight: '700',
    flexShrink: 0,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  goToHomeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
  },
  goToHomeText: {
    ...Typography.button,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  noServices: {
    padding: 32,
    alignItems: 'center',
  },
  noServicesText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
});

export default BLEDiagnosticScreen;

