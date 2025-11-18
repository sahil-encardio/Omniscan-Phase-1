import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Buffer } from 'buffer';
import { Colors, Typography, Spacing, BorderRadius } from '../../styles/DesignSystem';
import DatabaseManager from '../../database/DatabaseManager';
import edi55Service from '../../services/EDI55Service';
import ReadingModel from '../../models/ReadingModel';
import BLEService from '../../services/BLEService';
import InAppLogViewer from '../../components/InAppLogViewer';
import { 
  SENSOR_TYPE_LABELS, 
  SENSOR_UNITS, 
  READING_OFFSETS,
  SENSOR_TYPES,
} from '../../constants/EDI55Constants';

const EDI55ReadingsScreen = ({ route, navigation }) => {
  const { siteId, sensors: initialSensors } = route.params || {};
  
  const [sensors, setSensors] = useState(initialSensors || []);
  const [sensorReadings, setSensorReadings] = useState({});
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState(null);
  const [hasReceivedData, setHasReceivedData] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  const monitorSubscription = useRef(null);
  const sensorsRef = useRef([]);
  const dataTimeoutRef = useRef(null);

  useEffect(() => {
    console.log('=== EDI55ReadingsScreen Mounted ===');
    console.log('Route params:', route.params);
    console.log('Initial sensors:', initialSensors);
    console.log('Sensors state:', sensors);
    console.log('Sensors length:', sensors?.length);
    
    if (sensors && sensors.length > 0) {
      sensorsRef.current = sensors;
      // Initialize sensor readings
      const initialReadings = {};
      sensors.forEach((sensor) => {
        // Use sensorCommId if available, otherwise use a temporary ID
        const sensorId = sensor.sensorCommId || sensor.sensorIdStr || `temp_${sensor.portNumber || 'unknown'}`;
        initialReadings[sensorId] = {
          value: 0,
          temperature: null,
          timestamp: Date.now(),
        };
      });
      setSensorReadings(initialReadings);
      
      // Start monitoring automatically after a short delay
      setTimeout(() => {
        console.log('Starting monitoring...');
        startMonitoring();
      }, 500);
    } else {
      console.warn('⚠ No sensors provided to readings screen');
      Alert.alert(
        'No Sensors',
        'No sensors configured. Please go back and select sensors first.'
      );
    }

    return () => {
      console.log('=== EDI55ReadingsScreen Unmounting ===');
      stopMonitoring();
    };
  }, [sensors.length]); // Re-run if sensors change

  const writeConfigurationToDevice = async () => {
    try {
      const site = await DatabaseManager.getSiteById(siteId);
      if (!site) {
        console.error('Site not found');
        return;
      }

      const siteName = site.name || 'Default Site';
      const isSensorEnable = new Array(12).fill(0);
      
      sensors.forEach((sensor) => {
        if (sensor.sensorType !== undefined && sensor.sensorType !== null) {
          isSensorEnable[sensor.sensorType] = 1;
        }
      });

      await edi55Service.writeAnalogConfig(siteName, isSensorEnable, sensors);
      console.log('✓ Configuration written to device before monitoring');
    } catch (error) {
      console.error('Failed to write configuration to device:', error);
    }
  };

  const startMonitoring = async () => {
    if (isMonitoring) {
      console.log('⚠ Monitoring already active - stopping and restarting...');
      stopMonitoring();
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    if (!BLEService.connectedDevice) {
      console.error('❌ Cannot start monitoring - BLE device not connected');
      Alert.alert(
        'Device Not Connected',
        'Please connect to EDI-55 device via Bluetooth before taking readings.\n\n' +
        'Go to Device Management to connect.'
      );
      return;
    }

    try {
      setIsMonitoring(true);
      setRefreshing(true);
      console.log('=== Starting Monitor Subscription ===');

      await writeConfigurationToDevice();
      await new Promise(resolve => setTimeout(resolve, 500));

      monitorSubscription.current = await edi55Service.subscribeToAnalogMonitor(
        (data, error) => {
          let actualData = data;
          let actualError = error;
          
          if (error && typeof error === 'string' && error.length > 20) {
            const base64Pattern = /^[A-Za-z0-9+/=]+$/;
            if (base64Pattern.test(error) && !error.message && !error.stack) {
              actualData = error;
              actualError = null;
            }
          }
          
          if (!actualData && error && typeof error === 'string' && error.length > 20) {
            const base64Pattern = /^[A-Za-z0-9+/=]+$/;
            if (base64Pattern.test(error)) {
              actualData = error;
              actualError = null;
            }
          }
          
          if (actualError) {
            console.error('❌ Monitor subscription error:', actualError);
            return;
          }

          if (actualData) {
            setHasReceivedData(true);
            if (dataTimeoutRef.current) {
              clearTimeout(dataTimeoutRef.current);
              dataTimeoutRef.current = null;
            }
            
            const parsed = edi55Service.parseAnalogMonitorFrame(actualData);
            if (parsed && parsed.readings) {
              updateSensorReading(parsed);
            }
          }
        }
      );
      
      setHasReceivedData(false);
      const dataTimeout = setTimeout(() => {
        if (isMonitoring) {
          console.warn('⚠⚠⚠ WARNING: No data received after 5 seconds');
        }
      }, 5000);
      dataTimeoutRef.current = dataTimeout;
    } catch (error) {
      console.error('❌ Failed to start monitoring:', error);
      Alert.alert('Monitor Error', `Failed to start real-time monitoring: ${error.message}`);
      setIsMonitoring(false);
    } finally {
      setRefreshing(false);
    }
  };

  const stopMonitoring = () => {
    if (dataTimeoutRef.current) {
      clearTimeout(dataTimeoutRef.current);
      dataTimeoutRef.current = null;
    }
    
    if (monitorSubscription.current) {
      try {
        console.log('Stopping monitoring subscription...');
        monitorSubscription.current.remove();
        monitorSubscription.current = null;
        console.log('✓ Monitoring subscription stopped');
      } catch (error) {
        console.error('Error stopping monitoring:', error);
      }
    }
    setIsMonitoring(false);
    setHasReceivedData(false);
  };

  const updateSensorReading = (parsedData) => {
    const { readings, timestamp } = parsedData;

    if (!readings || readings.length !== 12) {
      console.warn('Invalid readings array:', readings);
      return;
    }

    sensorsRef.current.forEach((sensor) => {
      let paraPos = null;
      let tempParaPos = null;

      const sensorType = sensor.sensorType;
      
      switch (sensorType) {
        case SENSOR_TYPES.LOAD_CELL:
          paraPos = READING_OFFSETS.LOAD_CELL;
          break;
        case SENSOR_TYPES.POTENTIOMETRIC:
          paraPos = READING_OFFSETS.POTENTIOMETRIC;
          break;
        case SENSOR_TYPES.VTG_OUTPUT:
          paraPos = READING_OFFSETS.VTG_OUTPUT;
          break;
        case SENSOR_TYPES.EL_TILTMETER:
          paraPos = READING_OFFSETS.EL_TILT;
          tempParaPos = READING_OFFSETS.EL_TILT_TEMP;
          break;
        case SENSOR_TYPES.MEMS_TILTMETER:
          paraPos = READING_OFFSETS.MEMS_TILT1;
          tempParaPos = READING_OFFSETS.MEMS_TILT2;
          break;
        case SENSOR_TYPES.ANA_4_20:
          paraPos = READING_OFFSETS.ANA_4TO20;
          break;
        case SENSOR_TYPES.VW_FREQ:
          paraPos = READING_OFFSETS.VW_OUTPUT;
          tempParaPos = READING_OFFSETS.VW_TEMP;
          break;
        case SENSOR_TYPES.THERMISTOR:
          paraPos = READING_OFFSETS.THERMISTOR;
          break;
        case SENSOR_TYPES.RTD:
          paraPos = READING_OFFSETS.RTD;
          break;
        default:
          return;
      }

      if (paraPos === null || paraPos === undefined) {
        return;
      }

      // Use sensorCommId if available, otherwise use a temporary ID
      const sensorId = sensor.sensorCommId || sensor.sensorIdStr || `temp_${sensor.portNumber || 'unknown'}`;

      // If sensorCommId exists, try to get coefficients, otherwise use raw values
      if (sensor.sensorCommId) {
        DatabaseManager.getSensorCoeffArray(sensor.sensorCommId).then(coeffArray => {
          const offset = coeffArray[0] || 0.0;
          const factor = coeffArray[1] || 1.0;
          const rawValue = readings[paraPos];
          const calibratedValue = (rawValue * factor) + offset;

          let temperature = null;
          if (tempParaPos !== null && tempParaPos < readings.length) {
            temperature = readings[tempParaPos];
          }

          setSensorReadings(prev => ({
            ...prev,
            [sensorId]: {
              value: calibratedValue,
              temperature,
              timestamp,
            },
          }));
        }).catch(error => {
          console.error('Error getting coefficients:', error);
          const rawValue = readings[paraPos];
          setSensorReadings(prev => ({
            ...prev,
            [sensorId]: {
              value: rawValue,
              temperature: tempParaPos !== null ? readings[tempParaPos] : null,
              timestamp,
            },
          }));
        });
      } else {
        // No sensorCommId - use raw values directly
        const rawValue = readings[paraPos];
        let temperature = null;
        if (tempParaPos !== null && tempParaPos < readings.length) {
          temperature = readings[tempParaPos];
        }
        
        setSensorReadings(prev => ({
          ...prev,
          [sensorId]: {
            value: rawValue,
            temperature,
            timestamp,
          },
        }));
      }
    });
  };

  const handleAcceptReadings = async () => {
    try {
      const timestamp = Date.now();
      
      const savePromises = sensors.map(async (sensor) => {
        const reading = sensorReadings[sensor.sensorCommId];
        if (!reading || reading.value === undefined || reading.value === null) {
          return;
        }

        let paraPos = sensor.paraPos;
        if (paraPos === undefined || paraPos === null) {
          switch (sensor.sensorType) {
            case SENSOR_TYPES.LOAD_CELL:
              paraPos = READING_OFFSETS.LOAD_CELL;
              break;
            case SENSOR_TYPES.POTENTIOMETRIC:
              paraPos = READING_OFFSETS.POTENTIOMETRIC;
              break;
            case SENSOR_TYPES.VTG_OUTPUT:
              paraPos = READING_OFFSETS.VTG_OUTPUT;
              break;
            default:
              paraPos = 0;
          }
        }

        await DatabaseManager.insertAvoidDuplicate(
          sensor.sensorCommId,
          paraPos,
          reading.value,
          timestamp
        );
      });

      await Promise.all(savePromises);
      setLastSaveTime(timestamp);
      
      Alert.alert('Success', 'Readings saved successfully');
    } catch (error) {
      console.error('Error accepting readings:', error);
      Alert.alert('Error', 'Failed to save readings');
    }
  };

  const renderSensorCard = (sensor) => {
    // Use sensorCommId if available, otherwise use a temporary ID
    const sensorId = sensor.sensorCommId || sensor.sensorIdStr || `temp_${sensor.portNumber || 'unknown'}`;
    const reading = sensorReadings[sensorId];
    const readingValue = reading?.value ?? 0;
    const readingTemperature = reading?.temperature ?? null;
    
    let displayLabel = sensor.sensorIdStr || 'Sensor';
    let sensorTypeName = SENSOR_TYPE_LABELS[sensor.sensorType] || 'Unknown';
    let unit = SENSOR_UNITS[sensor.sensorType] || sensor.paramUnit || 'Unit';
    
    if (sensor.portNumber) {
      displayLabel = `Port ${sensor.portNumber}`;
      sensorTypeName = `${SENSOR_TYPE_LABELS[sensor.sensorType] || 'Sensor'}`;
      unit = SENSOR_UNITS[sensor.sensorType] || sensor.paramUnit || 'Unit';
    }

    const devReference = readingValue - (sensor.referenceValue || 0);
    const devLastSaved = readingValue - (sensor.lastSavedValue || 0);
    const statusBarColor = Math.abs(devReference) > 10 ? '#FF6B6B' : '#4CAF50';
    
    return (
      <View key={sensorId} style={[styles.sensorCard, { borderLeftColor: statusBarColor }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.connectionBadge}>{displayLabel}</Text>
            <Text style={styles.sensorTypeLabel}>{sensorTypeName}</Text>
          </View>
          <View style={styles.cardHeaderRight}>
            <Text style={styles.avgLabel}>Avg: N.A</Text>
          </View>
        </View>

        <View style={styles.mainReadingSection}>
          <Text style={styles.parameterName}>{getParameterName(sensor.sensorType)}</Text>
          <Text style={[styles.mainValue, { color: readingValue !== 0 ? '#2196F3' : '#9E9E9E' }]}>
            {readingValue.toFixed(2)}
          </Text>
          <Text style={styles.unitLabel}>{unit}</Text>
        </View>

        <View style={styles.deviationsRow}>
          <View style={styles.deviationColumn}>
            <Text style={styles.deviationValue}>
              {devReference >= 0 ? '+' : ''}{devReference.toFixed(2)}
            </Text>
            <Text style={styles.deviationLabel}>Dev. Reference</Text>
            <Text style={styles.deviationValue}>{(sensor.referenceValue || 0).toFixed(2)}</Text>
            <Text style={styles.deviationLabel}>Reference</Text>
          </View>

          <View style={styles.deviationColumn}>
            <Text style={styles.deviationValue}>
              {devLastSaved >= 0 ? '+' : ''}{devLastSaved.toFixed(2)}
            </Text>
            <Text style={styles.deviationLabel}>Dev. Last Read</Text>
            <Text style={styles.deviationValue}>{(sensor.lastSavedValue || 0).toFixed(2)}</Text>
            <Text style={styles.deviationLabel}>Last Saved</Text>
          </View>
        </View>

        {readingTemperature !== null && readingTemperature !== undefined && (
          <View style={styles.temperatureSection}>
            <Text style={styles.temperatureLabel}>Temperature</Text>
            <Text style={styles.temperatureValue}>{readingTemperature.toFixed(2)}</Text>
            <Text style={styles.temperatureUnit}>°C</Text>
          </View>
        )}
      </View>
    );
  };

  const getParameterName = (sensorType) => {
    const paramNames = {
      [SENSOR_TYPES.LOAD_CELL]: 'Load',
      [SENSOR_TYPES.POTENTIOMETRIC]: 'Displacement',
      [SENSOR_TYPES.VTG_OUTPUT]: 'Voltage',
      [SENSOR_TYPES.EL_TILTMETER]: 'Tilt',
      [SENSOR_TYPES.MEMS_TILTMETER]: 'Tilt',
      [SENSOR_TYPES.ANA_4_20]: 'Current',
      [SENSOR_TYPES.VW_FREQ]: 'Freq',
      [SENSOR_TYPES.THERMISTOR]: 'Temperature',
      [SENSOR_TYPES.RTD]: 'Temperature',
    };
    return paramNames[sensorType] || 'Value';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Readings</Text>
        <TouchableOpacity onPress={() => setShowLogs(true)} style={styles.logsButton}>
          <Ionicons name="document-text-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {refreshing && (
        <View style={styles.refreshIndicator}>
          <ActivityIndicator size="small" color="#2196F3" />
          <Text style={styles.refreshText}>Connecting...</Text>
        </View>
      )}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {sensors.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="pulse-outline" size={64} color="#9E9E9E" />
            <Text style={styles.emptyText}>No Sensors Configured</Text>
          </View>
        ) : (
          sensors.map(renderSensorCard)
        )}
        <View style={{ height: 120 }} />
      </ScrollView>

      {sensors.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.lastSaveSection}>
            <Text style={styles.lastSaveLabel}>Last Save</Text>
            <Text style={styles.lastSaveColon}>:</Text>
            <Text style={styles.lastSaveTime}>
              {lastSaveTime ? new Date(lastSaveTime).toLocaleString() : 'Never'}
            </Text>
          </View>

          <View style={styles.footerActions}>
            <TouchableOpacity style={styles.acceptButton} onPress={handleAcceptReadings}>
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Modal
        visible={showLogs}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowLogs(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Console Logs</Text>
            <TouchableOpacity onPress={() => setShowLogs(false)} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <InAppLogViewer />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5', // Light background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#2196F3',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
    marginLeft: Spacing.md,
  },
  logsButton: {
    padding: Spacing.sm,
  },
  refreshIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    backgroundColor: '#E3F2FD',
  },
  refreshText: {
    marginLeft: Spacing.sm,
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  sensorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderLeftWidth: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  connectionBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
    fontFamily: 'Inter-SemiBold',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  sensorTypeLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#424242',
    fontFamily: 'Inter-Bold',
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avgLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#757575',
    fontFamily: 'Inter-SemiBold',
  },
  mainReadingSection: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
    marginVertical: Spacing.md,
  },
  parameterName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#757575',
    fontFamily: 'Inter-SemiBold',
    marginBottom: Spacing.sm,
  },
  mainValue: {
    fontSize: 48,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    marginBottom: Spacing.xs,
  },
  unitLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#757575',
    fontFamily: 'Inter-SemiBold',
  },
  deviationsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  deviationColumn: {
    flex: 1,
  },
  deviationValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#424242',
    fontFamily: 'Inter-SemiBold',
    marginBottom: Spacing.xs,
  },
  deviationLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9E9E9E',
    fontFamily: 'Inter-Medium',
    marginBottom: Spacing.sm,
  },
  temperatureSection: {
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  temperatureLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#757575',
    fontFamily: 'Inter-SemiBold',
    marginBottom: Spacing.xs,
  },
  temperatureValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF9800',
    fontFamily: 'Inter-Bold',
  },
  temperatureUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: '#757575',
    fontFamily: 'Inter-SemiBold',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl * 3,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9E9E9E',
    marginTop: Spacing.lg,
  },
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  lastSaveSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    backgroundColor: '#F5F5F5',
    padding: Spacing.md,
    borderRadius: 8,
  },
  lastSaveLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    fontFamily: 'Inter-SemiBold',
  },
  lastSaveColon: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    marginHorizontal: Spacing.sm,
  },
  lastSaveTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    fontFamily: 'Inter-SemiBold',
    flex: 1,
  },
  footerActions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: Spacing.xl * 2,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#2196F3',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
  },
  closeButton: {
    padding: Spacing.sm,
  },
});

export default EDI55ReadingsScreen;

