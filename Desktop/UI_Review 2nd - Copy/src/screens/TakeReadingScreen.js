import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../components/Card';
import ScreenHeader from './components/ScreenHeader';
import { Spacing, Typography, Colors, BorderRadius } from '../styles/DesignSystem';

// Helper to build a neutral device state
const buildDeviceState = (device) => ({
  ...device,
  found: false, // set true when discovered during scan
});

const TakeReadingScreen = ({ navigation, route }) => {
  const { project } = route.params;

  // UI / flow state
  const [isScanning, setIsScanning] = useState(false);
  const [scanEndsAt, setScanEndsAt] = useState(null); // Date
  const scanTimerRef = useRef(null);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [readingData, setReadingData] = useState(null);
  const [sensorReadings, setSensorReadings] = useState(null); // for node-wide readings
  const [bypassSchedule, setBypassSchedule] = useState(true);
  const autoRefreshRef = useRef(null);

  // Configured devices for this project (Gateway -> Dataloggers -> Nodes -> Sensors)
  const configured = useMemo(() => {
    return {
      gateway: buildDeviceState({
        id: 'gw-1',
        deviceId: 'EWG-01-1001',
        name: 'EWG Gateway',
        role: 'gateway',
        icon: 'wifi',
        connectionType: 'Bluetooth',
      }),
      dataloggers: [
        buildDeviceState({ id: 'dl-1', deviceId: 'ESDL-30-002', name: 'ESDL Datalogger', role: 'datalogger', icon: 'hardware-chip', connectionType: 'USB/RS-232' }),
        buildDeviceState({ id: 'dl-2', deviceId: 'ESCL-10VT-004', name: 'ESCL Datalogger', role: 'datalogger', icon: 'hardware-chip', connectionType: 'USB/RS-232' }),
      ],
      nodes: [
        {
          ...buildDeviceState({ id: 'nd-1', deviceId: 'EWN-01V-003', name: 'Vibrating Wire Node', role: 'node', icon: 'radio', connectionType: 'Bluetooth' }),
          sensors: [
            { id: 'sn-1', name: 'Tiltmeter', connectable: false, configured: true, type: 'Tiltmeter', serialNumber: 'TILT-001', unit: 'degrees' },
          ],
        },
        {
          ...buildDeviceState({ id: 'nd-2', deviceId: 'EWN-02A-007', name: 'Digital Node', role: 'node', icon: 'radio', connectionType: 'Bluetooth' }),
          sensors: [
            { id: 'sn-2', name: 'Piezometer (VW)', connectable: false, configured: true, type: 'Vibrating Wire', serialNumber: 'VW-002-OK', unit: 'kPa' },
            { id: 'sn-3', name: 'Thermistor', connectable: false, configured: false, type: '', serialNumber: '', unit: '' },
          ],
        },
      ],
    };
  }, [project.id]);

  const [deviceState, setDeviceState] = useState(configured);

  // Reset local state if project changes
  useEffect(() => {
    setDeviceState(configured);
  }, [configured]);

  // Start a 30s scan; mark devices as found as we "detect" them
  const startScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    const endsAt = new Date(Date.now() + 30000);
    setScanEndsAt(endsAt);

    // Clear previous found flags
    setDeviceState(prev => ({
      gateway: { ...prev.gateway, found: false },
      dataloggers: prev.dataloggers.map(d => ({ ...d, found: false })),
      nodes: prev.nodes.map(n => ({ ...n, found: false })),
    }));

    // Simulate staggered discoveries within 30s
    const markFound = (updater) => setDeviceState(prev => updater(prev));

    setTimeout(() => markFound(prev => ({ ...prev, gateway: { ...prev.gateway, found: true } })), 2000);
    setTimeout(() => markFound(prev => ({ ...prev, dataloggers: prev.dataloggers.map((d, i) => i === 0 ? { ...d, found: true } : d) })), 5000);
    setTimeout(() => markFound(prev => ({ ...prev, nodes: prev.nodes.map((n, i) => i === 0 ? { ...n, found: true } : n) })), 8000);
    setTimeout(() => markFound(prev => ({ ...prev, dataloggers: prev.dataloggers.map((d, i) => i === 1 ? { ...d, found: true } : d) })), 12000);
    setTimeout(() => markFound(prev => ({ ...prev, nodes: prev.nodes.map((n, i) => i === 1 ? { ...n, found: true } : n) })), 16000);

    // End scan after 30s
    scanTimerRef.current = setTimeout(() => {
      setIsScanning(false);
      setScanEndsAt(null);
    }, 30000);
  };

  const stopScan = () => {
    if (!isScanning) return;
    clearTimeout(scanTimerRef.current);
    setIsScanning(false);
    setScanEndsAt(null);
  };

  const connect = (dev) => {
    stopScan();
    Alert.alert('Connecting', `Connecting to ${dev.deviceId}...`);
    setConnectedDevice(dev);
    // Simulate short connect delay then start auto refresh
    setTimeout(() => {
      startAutoRefresh(dev);
    }, 1200);
  };

  const startAutoRefresh = (dev) => {
    // Reset previous states
    setReadingData(null);
    setSensorReadings(null);
    // Initial reading immediately
    if (dev.role === 'node') {
      setSensorReadings(buildNodeSensorReadings(dev));
      autoRefreshRef.current = setInterval(() => {
        setSensorReadings(buildNodeSensorReadings(dev));
      }, 5000);
    } else {
      setReadingData(buildReading(dev));
      // 5-second auto refresh
      autoRefreshRef.current = setInterval(() => {
        setReadingData(buildReading(dev));
      }, 5000);
    }
  };

  const buildReading = (dev) => {
    return {
      timestamp: new Date().toLocaleString(),
      deviceId: dev.deviceId,
      deviceType: dev.role,
      rawValue: Math.random() * 1000 + 500,
      engineeringValue: (Math.random() * 1000 + 500) * 0.1,
      unit: 'mm',
      status: 'Good',
    };
  };

  const buildNodeSensorReadings = (nodeDev) => {
    const timestamp = new Date().toLocaleString();
    return (nodeDev.sensors || []).map(s => ({
      sensorId: s.id,
      sensorName: s.name,
      sensorType: getSensorType(s.name),
      timestamp,
      rawValue: Math.random() * 1000 + 500,
      engineeringValue: (Math.random() * 1000 + 500) * 0.1,
      unit: getSensorUnit(s.name),
      status: 'Good',
    }));
  };

  const getSensorType = (sensorName) => {
    if (sensorName.includes('Tiltmeter')) return 'Tiltmeter';
    if (sensorName.includes('Piezometer') || sensorName.includes('VW')) return 'Vibrating Wire';
    if (sensorName.includes('Thermistor')) return 'Thermistor';
    if (sensorName.includes('Accelerometer')) return 'Accelerometer';
    if (sensorName.includes('Laser')) return 'Laser';
    if (sensorName.includes('Digital')) return 'Digital';
    return 'Unknown';
  };

  const getSensorUnit = (sensorName) => {
    if (sensorName.includes('Tiltmeter')) return 'degrees';
    if (sensorName.includes('Piezometer') || sensorName.includes('VW')) return 'kPa';
    if (sensorName.includes('Thermistor')) return '°C';
    if (sensorName.includes('Accelerometer')) return 'g';
    if (sensorName.includes('Laser')) return 'mm';
    if (sensorName.includes('Digital')) return 'counts';
    return 'units';
  };

  const saveAllSensorReadings = () => {
    if (!sensorReadings || sensorReadings.length === 0) {
      Alert.alert('No Data', 'No sensor readings to save');
      return;
    }

    Alert.alert(
      'Save All Sensor Readings',
      `Save ${sensorReadings.length} sensor readings from ${connectedDevice.deviceId}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Save', onPress: () => {
          // Simulate saving all sensor readings
          Alert.alert('Success', `Saved ${sensorReadings.length} sensor readings to project history`);
        }}
      ]
    );
  };

  const disconnect = () => {
    if (autoRefreshRef.current) {
      clearInterval(autoRefreshRef.current);
    }
    setConnectedDevice(null);
    setReadingData(null);
    setSensorReadings(null);
  };

  const renderStatusDot = (found) => (
    <View style={[styles.statusDot, found ? styles.statusDotGreen : styles.statusDotGrey, found && styles.blink]} />
  );

  return (
    <View style={styles.container}>
      <ScreenHeader 
        title="Take Reading" 
        navigation={navigation}
        showLogo={true}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Configured Devices</Text>
          <Text style={styles.cardSubtitle}>Gateway, Dataloggers, and Nodes for this project</Text>

          {/* Scan Button */}
          <TouchableOpacity
            style={[styles.scanButton, isScanning && styles.buttonDisabled]}
            onPress={isScanning ? stopScan : startScan}
          >
            {isScanning ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Ionicons name="search" size={18} color="#FFFFFF" />
            )}
            <Text style={styles.scanButtonText}>
              {isScanning ? 'Scanning…' : 'Scan'}
            </Text>
          </TouchableOpacity>

          {/* Gateway */}
          <View style={styles.itemRow}>
            <View style={styles.itemLeft}>
              {renderStatusDot(deviceState.gateway.found)}
              <Ionicons name="wifi" size={18} color="#2241DD" style={{ marginHorizontal: 6 }} />
              <Text style={styles.itemTitle}>Gateway: {deviceState.gateway.name} {deviceState.gateway.deviceId}</Text>
            </View>
            {deviceState.gateway.found && (
              <TouchableOpacity style={styles.connectBtn} onPress={() => connect(deviceState.gateway)}>
                <Text style={styles.connectText}>CONNECT</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Dataloggers */}
          {deviceState.dataloggers.map(dl => (
            <View key={dl.id} style={styles.itemRow}>
              <View style={styles.itemLeft}>
                {renderStatusDot(dl.found)}
                <Ionicons name="hardware-chip" size={18} color="#2241DD" style={{ marginHorizontal: 6 }} />
                <Text style={styles.itemTitle}>Datalogger: {dl.name} {dl.deviceId}</Text>
              </View>
              {dl.found && (
                <TouchableOpacity style={styles.connectBtn} onPress={() => connect(dl)}>
                  <Text style={styles.connectText}>CONNECT</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

          {/* Nodes + Sensors */}
          {deviceState.nodes.map(nd => (
            <View key={nd.id}>
              <View style={styles.itemRow}>
                <View style={styles.itemLeft}>
                  {renderStatusDot(nd.found)}
                  <Ionicons name="radio" size={18} color="#2241DD" style={{ marginHorizontal: 6 }} />
                  <Text style={styles.itemTitle}>Node: {nd.name} {nd.deviceId}</Text>
                </View>
                {nd.found && (
                  <TouchableOpacity style={styles.connectBtn} onPress={() => connect(nd)}>
                    <Text style={styles.connectText}>CONNECT</Text>
                  </TouchableOpacity>
                )}
              </View>
              {/* Sensors (not connectable) */}
              {nd.sensors.map(s => (
                <View key={s.id} style={styles.sensorRow}>
                  <Text style={styles.sensorBullet}>└──</Text>
                  <View style={styles.sensorInfo}>
                    <Text style={styles.sensorText}>Sensor: {s.name}</Text>
                    {s.configured ? (
                      <View style={styles.sensorConfigured}>
                        <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                        <Text style={styles.sensorConfiguredText}>
                          {s.type} • {s.serialNumber} • {s.unit}
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.sensorNotConfigured}>Not configured</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          ))}
        </Card>

        {/* Live Reading View */}
        {connectedDevice && (
          <Card style={styles.card}>
            <View style={styles.connectionHeader}>
              <View style={styles.connectionStatus}>
                <View style={[styles.statusDot, styles.statusDotGreen]} />
                <Text style={styles.statusText}>Connected</Text>
              </View>
              <TouchableOpacity onPress={disconnect}>
                <Ionicons name="close-circle" size={24} color="#EF4444" />
              </TouchableOpacity>
            </View>

            <Text style={styles.connectedDevice}>{connectedDevice.deviceId} - {connectedDevice.name}</Text>

            {/* Bypass schedule toggle */}
            <View style={styles.bypassRow}>
              <Ionicons name="timer" size={16} color="#6B7280" />
              <Text style={styles.bypassLabel}>Bypass logger schedule</Text>
              <TouchableOpacity
                style={[styles.bypassToggle, bypassSchedule && styles.bypassToggleOn]}
                onPress={() => setBypassSchedule(v => !v)}
              >
                <Text style={[styles.bypassToggleText, bypassSchedule && styles.bypassToggleTextOn]}>
                  {bypassSchedule ? 'ON' : 'OFF'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* If connected to a node, show all attached sensors with exact values */}
            {connectedDevice.role === 'node' && sensorReadings ? (
              <View style={styles.readingContainer}>
                <View style={styles.sensorHeader}>
                  <Text style={styles.sensorHeaderTitle}>Sensor Readings</Text>
                  <Text style={styles.sensorHeaderSubtitle}>{sensorReadings.length} sensors • Auto-refresh every 5s</Text>
                </View>
                
                {sensorReadings.map(sr => (
                  <View key={sr.sensorId} style={styles.sensorReadingCard}>
                    <View style={styles.sensorReadingHeader}>
                      <Text style={styles.sensorName}>{sr.sensorName}</Text>
                      <View style={styles.sensorTypeBadge}>
                        <Text style={styles.sensorTypeText}>{sr.sensorType}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.sensorValues}>
                      <View style={styles.valueRow}>
                        <Text style={styles.valueLabel}>Raw Value:</Text>
                        <Text style={styles.valueText}>{sr.rawValue.toFixed(2)}</Text>
                      </View>
                      <View style={styles.valueRow}>
                        <Text style={styles.valueLabel}>Engineering Value:</Text>
                        <Text style={[styles.valueText, styles.engineeringValue]}>
                          {sr.engineeringValue.toFixed(2)} {sr.unit}
                        </Text>
                      </View>
                      <View style={styles.valueRow}>
                        <Text style={styles.valueLabel}>Status:</Text>
                        <Text style={[styles.valueText, styles.statusGood]}>{sr.status}</Text>
                      </View>
                      <View style={styles.valueRow}>
                        <Text style={styles.valueLabel}>Timestamp:</Text>
                        <Text style={styles.valueTextSmall}>{sr.timestamp}</Text>
                      </View>
                    </View>
                  </View>
                ))}
                
                <View style={styles.actionButtons}>
                  <TouchableOpacity style={styles.secondaryButton} onPress={disconnect}>
                    <Ionicons name="close-circle" size={16} color="#2241DD" />
                    <Text style={styles.secondaryButtonText}>Disconnect</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.primaryButton} onPress={saveAllSensorReadings}>
                    <Ionicons name="save" size={16} color="#FFFFFF" />
                    <Text style={styles.primaryButtonText}>Save All Readings</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : readingData ? (
              <View style={styles.readingContainer}>
                <View style={styles.readingRow}>
                  <Text style={styles.readingLabel}>Timestamp:</Text>
                  <Text style={styles.readingValue}>{readingData.timestamp}</Text>
                </View>
                <View style={styles.readingRow}>
                  <Text style={styles.readingLabel}>Raw Value:</Text>
                  <Text style={styles.readingValue}>{readingData.rawValue.toFixed(2)}</Text>
                </View>
                <View style={styles.readingRow}>
                  <Text style={styles.readingLabel}>Engineering Value:</Text>
                  <Text style={[styles.readingValue, styles.engineeringValue]}>{readingData.engineeringValue.toFixed(2)} {readingData.unit}</Text>
                </View>
                <View style={styles.readingRow}>
                  <Text style={styles.readingLabel}>Status:</Text>
                  <Text style={[styles.readingValue, styles.statusGood]}>{readingData.status}</Text>
                </View>
              </View>
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: Spacing.md }}>
                <ActivityIndicator />
                <Text style={{ marginTop: 6 }}>Connecting…</Text>
              </View>
            )}
          </Card>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  card: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#374151',
    lineHeight: 22,
    marginBottom: 16,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusDotGrey: {
    backgroundColor: '#D1D5DB',
  },
  statusDotGreen: {
    backgroundColor: '#10B981',
  },
  blink: {
    opacity: 1,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  connectBtn: {
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: BorderRadius.sm,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#ECFDF5',
  },
  connectText: {
    color: '#059669',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  sensorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingLeft: 24,
  },
  sensorBullet: {
    color: '#6B7280',
    marginRight: 6,
  },
  sensorText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  sensorInfo: {
    flex: 1,
  },
  sensorConfigured: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  sensorConfiguredText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#10B981',
    marginLeft: 4,
  },
  sensorNotConfigured: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#EF4444',
    marginTop: 2,
    fontStyle: 'italic',
  },
  connectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: Spacing.sm,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#10B981',
  },
  connectedDevice: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 16,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2241DD',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    alignSelf: 'flex-start',
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  readingContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
  },
  readingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  readingLabel: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  readingValue: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  statusGood: {
    color: '#10B981',
  },
  instructionsList: {
    paddingLeft: Spacing.sm,
  },
  instructionItem: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 8,
    lineHeight: 22,
  },
  instructionBold: {
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  connectionDetails: {
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  connectionText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  liveReadingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginRight: Spacing.xs,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#EF4444',
    marginLeft: 4,
  },
  engineeringValue: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: '#2241DD',
  },
  bypassRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  bypassLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginLeft: 6,
  },
  bypassToggle: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: BorderRadius.sm,
    paddingVertical: 2,
    paddingHorizontal: Spacing.sm,
    backgroundColor: '#FFFFFF',
  },
  bypassToggleOn: {
    borderColor: '#2241DD',
    backgroundColor: '#2241DD',
  },
  bypassToggleText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  bypassToggleTextOn: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#2241DD',
    marginLeft: 6,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2241DD',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  // Enhanced sensor readings styles
  sensorHeader: {
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sensorHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 4,
  },
  sensorHeaderSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  sensorReadingCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sensorReadingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sensorName: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    flex: 1,
  },
  sensorTypeBadge: {
    backgroundColor: '#2241DD',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  sensorTypeText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  sensorValues: {
    gap: Spacing.xs,
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  valueLabel: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    flex: 1,
  },
  valueText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    flex: 2,
    textAlign: 'right',
  },
  valueTextSmall: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    flex: 2,
    textAlign: 'right',
  },
});

export default TakeReadingScreen;
