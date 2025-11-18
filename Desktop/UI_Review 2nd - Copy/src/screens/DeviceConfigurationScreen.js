import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../components/Card';
import ScreenHeader from './components/ScreenHeader';
import { Spacing, Typography, Colors, BorderRadius, Shadows } from '../styles/DesignSystem';

// Sensor Setup Modal Component
const SensorSetupModal = ({ visible, sensor, node, onClose, onSave }) => {
  const [sensorConfig, setSensorConfig] = useState({
    type: '',
    serialNumber: '',
    calibrationCoeff: '',
    unit: '',
    range: '',
    accuracy: '',
  });
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [useCalibraOne, setUseCalibraOne] = useState(false);
  const [calibraOneLoading, setCalibraOneLoading] = useState(false);

  const sensorTypes = [
    'Vibrating Wire',
    'SDI-12',
    'Analog Voltage',
    'Analog Current',
    'Digital Input',
    'Temperature',
    'Pressure',
    'Tiltmeter',
    'Accelerometer',
    'Laser',
  ];

  const tryCalibraOne = () => {
    setCalibraOneLoading(true);
    setTimeout(() => {
      setCalibraOneLoading(false);
      if (sensorConfig.serialNumber && sensorConfig.serialNumber.toUpperCase().includes('OK')) {
        setSensorConfig(prev => ({
          ...prev,
          type: prev.type || 'Vibrating Wire',
          calibrationCoeff: 'A0=0.123, A1=0.004, A2=0.0001',
          unit: 'kPa',
          range: '0-1000',
          accuracy: '±0.1%',
        }));
        Alert.alert('CalibraOne', 'Calibration auto-populated from CalibraOne.');
      } else {
        Alert.alert('CalibraOne', 'No match found. Please enter calibration from sheet.');
      }
    }, 1200);
  };

  const handleSave = () => {
    if (!sensorConfig.type || !sensorConfig.serialNumber) {
      Alert.alert('Error', 'Please fill in sensor type and serial number');
      return;
    }
    onSave(sensorConfig);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Configure Sensor</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalList}>
            <View style={styles.sensorInfo}>
              <Text style={styles.sensorInfoText}>Node: {node?.name}</Text>
              <Text style={styles.sensorInfoText}>Port: {sensor?.port}</Text>
              <Text style={styles.sensorInfoText}>Sensor: {sensor?.name}</Text>
            </View>

            {/* CalibraOne toggle */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Use CalibraOne API</Text>
              <TouchableOpacity
                style={[styles.toggle, useCalibraOne && styles.toggleOn]}
                onPress={() => setUseCalibraOne(v => !v)}
              >
                <Text style={[styles.toggleText, useCalibraOne && styles.toggleTextOn]}>
                  {useCalibraOne ? 'ENABLED' : 'DISABLED'}
                </Text>
              </TouchableOpacity>
            </View>

            {useCalibraOne && (
              <TouchableOpacity style={styles.secondaryBtn} onPress={tryCalibraOne} disabled={calibraOneLoading}>
                <Ionicons name="cloud-download" size={16} color="#2241DD" />
                <Text style={styles.secondaryBtnText}>{calibraOneLoading ? 'Checking…' : 'Fetch from CalibraOne'}</Text>
              </TouchableOpacity>
            )}

            {/* Sensor Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Sensor Type *</Text>
              <TouchableOpacity 
                style={styles.dropdown}
                onPress={() => setShowTypePicker(true)}
              >
                <Text style={styles.dropdownText}>
                  {sensorConfig.type || 'Select sensor type'}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Serial Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Serial Number *</Text>
              <TextInput
                style={styles.textInput}
                value={sensorConfig.serialNumber}
                onChangeText={(text) => setSensorConfig({ ...sensorConfig, serialNumber: text })}
                placeholder="Enter sensor serial number"
              />
            </View>

            {/* Calibration Coefficients */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Calibration Coefficients</Text>
              <TextInput
                style={styles.textInput}
                value={sensorConfig.calibrationCoeff}
                onChangeText={(text) => setSensorConfig({ ...sensorConfig, calibrationCoeff: text })}
                placeholder="e.g., A0=0.123, A1=0.004, A2=0.0001"
              />
            </View>

            {/* Unit */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Unit</Text>
              <TextInput
                style={styles.textInput}
                value={sensorConfig.unit}
                onChangeText={(text) => setSensorConfig({ ...sensorConfig, unit: text })}
                placeholder="e.g., kPa, mm, °C"
              />
            </View>

            {/* Range */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Range</Text>
              <TextInput
                style={styles.textInput}
                value={sensorConfig.range}
                onChangeText={(text) => setSensorConfig({ ...sensorConfig, range: text })}
                placeholder="e.g., 0-1000"
              />
            </View>

            {/* Accuracy */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Accuracy</Text>
              <TextInput
                style={styles.textInput}
                value={sensorConfig.accuracy}
                onChangeText={(text) => setSensorConfig({ ...sensorConfig, accuracy: text })}
                placeholder="e.g., ±0.1%"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save Configuration</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Sensor Type Picker */}
          <Modal
            visible={showTypePicker}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowTypePicker(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Sensor Type</Text>
                  <TouchableOpacity onPress={() => setShowTypePicker(false)}>
                    <Ionicons name="close" size={24} color="#6B7280" />
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.modalList}>
                  {sensorTypes.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.modalItem,
                        sensorConfig.type === type && styles.modalItemSelected
                      ]}
                      onPress={() => {
                        setSensorConfig({ ...sensorConfig, type });
                        setShowTypePicker(false);
                      }}
                    >
                      <Text style={[
                        styles.modalItemText,
                        sensorConfig.type === type && styles.modalItemTextSelected
                      ]}>
                        {type}
                      </Text>
                      {sensorConfig.type === type && (
                        <Ionicons name="checkmark" size={20} color="#2241DD" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>
        </View>
      </View>
    </Modal>
  );
};

const DeviceConfigurationScreen = ({ navigation, route }) => {
  const { project } = route.params;
  const [isScanning, setIsScanning] = useState(false);
  const [scannedDevices, setScannedDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [configurationStep, setConfigurationStep] = useState('scan'); // scan, deviceInfo, sensorDetails, gatewayNetworkSettings, schedule
  const [deviceInfo, setDeviceInfo] = useState({
    name: '',
    projectId: project.id,
    location: '',
  });
  const [sensorDetails, setSensorDetails] = useState({
    type: '',
    serialNumber: '',
    calibrationCoeff: '',
  });
  const [showSensorTypePicker, setShowSensorTypePicker] = useState(false);
  const [showSensorSetupModal, setShowSensorSetupModal] = useState(false);
  const [selectedSensorForSetup, setSelectedSensorForSetup] = useState(null);
  const [configuredSensors, setConfiguredSensors] = useState({}); // Store configured sensor data
  const [schedule, setSchedule] = useState({
    loggingInterval: '5',
    uploadInterval: '1',
  });
  const [useTemplate, setUseTemplate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const scheduleTemplates = [
    { id: 'fast', name: 'Fast (1 min log, 15 min upload)', logging: '1', upload: '0.25' },
    { id: 'balanced', name: 'Balanced (5 min log, 1 hr upload)', logging: '5', upload: '1' },
    { id: 'power-save', name: 'Power Save (30 min log, 6 hr upload)', logging: '30', upload: '6' },
  ];

  const [useCalibraOne, setUseCalibraOne] = useState(false);
  const [calibraOneLoading, setCalibraOneLoading] = useState(false);

  // Connection and discovery states
  const [connectionMethod, setConnectionMethod] = useState(null); // 'Bluetooth' | 'Ethernet/USB-C'
  const [gatewayConnected, setGatewayConnected] = useState(false);
  const [discoveredNodes, setDiscoveredNodes] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);

  // Bulk schedule mode
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkSchedule, setBulkSchedule] = useState({
    loggingMinutes: '30',
    triggerThreshold: '0.5',
    uploadHours: '4',
  });

  // Gateway network settings
  const [network, setNetwork] = useState({
    primary: 'LoRA', // LoRA | WiFi | 4G | NTN
    apn: '',
    testing: false,
  });
  
  // Communication parameters for different protocols
  const [communicationParams, setCommunicationParams] = useState({
    LoRA: {
      frequency: '868.1',
      spreadingFactor: 'SF7',
      bandwidth: '125',
      codingRate: '4/5',
      power: '14',
    },
    WiFi: {
      ssid: '',
      password: '',
      security: 'WPA2',
      channel: 'Auto',
    },
    '4G': {
      apn: '',
      username: '',
      password: '',
      networkType: 'LTE',
    },
    NTN: {
      satelliteProvider: 'Starlink',
      planType: 'Standard',
      dataLimit: 'Unlimited',
    },
  });
  
  // Current time state
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Configuration data storage
  const [configurationData, setConfigurationData] = useState({
    gatewayId: '',
    nodeId: '',
    protocol: '',
    parameters: {},
    timestamp: '',
    status: 'pending',
  });
  const serverCredentials = {
    url: 'https://cloud.encardio-rite.example/api',
    apiKey: 'PRECONFIGURED-****-READONLY',
  };

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Function to update communication parameters based on selected protocol
  const updateCommunicationParams = (protocol, paramKey, value) => {
    setCommunicationParams(prev => ({
      ...prev,
      [protocol]: {
        ...prev[protocol],
        [paramKey]: value,
      },
    }));
  };

  // Function to save configuration data
  const saveConfigurationData = () => {
    const configData = {
      gatewayId: selectedDevice?.deviceId || 'Unknown',
      nodeId: selectedNode?.deviceId || 'Unknown',
      protocol: network.primary,
      parameters: communicationParams[network.primary],
      timestamp: currentTime.toISOString(),
      status: 'saved',
    };
    
    setConfigurationData(configData);
    
    // Here you would typically save to AsyncStorage or send to server
    console.log('Configuration saved:', configData);
    
    Alert.alert(
      'Configuration Saved',
      `Gateway network settings saved successfully for ${network.primary} protocol.`,
      [{ text: 'OK' }]
    );
  };

  const deviceTypes = [
    { id: 'esdl30', name: 'ESDL-30 Datalogger', icon: 'hardware-chip' },
    { id: 'escl10vt', name: 'ESCL-10VT Datalogger', icon: 'hardware-chip' },
    { id: 'ewg01', name: 'EWG-01 Gateway', icon: 'radio' },
    { id: 'ewn', name: 'EWN Series Node', icon: 'radio' },
  ];

  const sensorTypes = [
    'Vibrating Wire',
    'SDI-12',
    'Analog Voltage',
    'Analog Current',
    'Digital Input',
    'Temperature',
    'Pressure',
  ];

  const scanForDevices = async () => {
    setIsScanning(true);
    
    // Simulate scanning process
    setTimeout(() => {
      const mockScannedDevices = [
        {
          id: 'scan-1',
          deviceId: 'ESDL-30-001',
          type: 'ESDL-30 Datalogger',
          signalStrength: -45,
          batteryLevel: 85,
          isConfigured: false,
        },
        {
          id: 'scan-2',
          deviceId: 'EWG-01-002',
          type: 'EWG-01 Gateway',
          signalStrength: -52,
          batteryLevel: 100,
          isConfigured: false,
        },
        {
          id: 'scan-3',
          deviceId: 'EWN-01V-003',
          type: 'EWN-01V Node',
          signalStrength: -38,
          batteryLevel: 45,
          isConfigured: false,
        },
      ];
      setScannedDevices(mockScannedDevices);
      setIsScanning(false);
    }, 3000);
  };

  // New: Connect via Bluetooth or Ethernet/USB-C
  const initiateConnection = (method) => {
    setConnectionMethod(method);
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      // Assume we connected to gateway for discovery
      setGatewayConnected(true);
      // Discover nodes linked to the gateway
      const nodes = [
        { id: 'node-1', name: 'Vibrating Wire Node', deviceId: 'EWN-01V-003', powered: true, sensors: [
          { id: 'P1', port: 1, name: 'Piezometer (VW)' },
        ]},
        { id: 'node-2', name: 'Digital Node', deviceId: 'EWN-02A-007', powered: true, sensors: [
          { id: 'P1', port: 1, name: 'Tiltmeter' },
          { id: 'P2', port: 2, name: 'Thermistor' },
        ]},
      ];
      setDiscoveredNodes(nodes);
      setConfigurationStep('sensorDetails');
    }, 2000);
  };

  const autoPassThroughToNode = (node) => {
    // Connect to node through gateway link (simulated)
    setSelectedNode(node);
    setConfigurationStep('gatewayNetworkSettings');
  };

  const tryCalibraOne = () => {
    setCalibraOneLoading(true);
    // Simulate API lookup: success if serial contains 'OK'
    setTimeout(() => {
      setCalibraOneLoading(false);
      if (sensorDetails.serialNumber && sensorDetails.serialNumber.toUpperCase().includes('OK')) {
        setSensorDetails(prev => ({
          ...prev,
          type: prev.type || 'Vibrating Wire',
          calibrationCoeff: 'A0=0.123, A1=0.004, A2=0.0001',
        }));
        Alert.alert('CalibraOne', 'Calibration auto-populated from CalibraOne.');
      } else {
        Alert.alert('CalibraOne', 'No match found. Please enter calibration from sheet.');
      }
    }, 1200);
  };

  const applyAndPushConfiguration = () => {
    Alert.alert(
      'Apply & Push Configuration',
      bulkMode
        ? `Apply bulk schedule to ${discoveredNodes.length} nodes and the gateway?`
        : `Apply sensor and schedule settings to node ${selectedNode?.deviceId}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Apply', onPress: () => Alert.alert('Success', 'Configuration pushed to gateway and nodes.') },
      ]
    );
  };


  const openSensorSetup = (sensor) => {
    setSelectedSensorForSetup(sensor);
    setShowSensorSetupModal(true);
  };

  const saveSensorConfiguration = (sensorConfig) => {
    const sensorKey = `${selectedNode?.id}-${selectedSensorForSetup?.id}`;
    setConfiguredSensors(prev => ({
      ...prev,
      [sensorKey]: {
        ...sensorConfig,
        nodeId: selectedNode?.id,
        nodeName: selectedNode?.name,
        port: selectedSensorForSetup?.port,
        sensorName: selectedSensorForSetup?.name,
      }
    }));
    setShowSensorSetupModal(false);
    Alert.alert('Success', `Sensor ${selectedSensorForSetup?.name} configured successfully`);
  };

  const selectDevice = (device) => {
    setSelectedDevice(device);
    setConfigurationStep('deviceInfo');
  };

  const handleDeviceInfoNext = () => {
    if (!deviceInfo.name.trim()) {
      Alert.alert('Error', 'Please enter a device name');
      return;
    }
    setConfigurationStep('sensorDetails');
  };

  const handleSensorDetailsNext = () => {
    if (!sensorDetails.type || !sensorDetails.serialNumber) {
      Alert.alert('Error', 'Please fill in all sensor details');
      return;
    }
    setConfigurationStep('schedule');
  };

  const completeConfiguration = () => {
    Alert.alert(
      'Configuration Complete',
      `Device ${deviceInfo.name} has been successfully configured and added to project ${project.name}`,
      [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]
    );
  };

  const renderScanStep = () => (
    <View>
      {/* Connection Choice */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Connection</Text>
        <Text style={styles.cardSubtitle}>Choose how to connect to the target device</Text>
        <View style={styles.connectRow}>
          <TouchableOpacity
            style={[styles.connectBtn, connectionMethod === 'Bluetooth' && styles.connectBtnActive]}
            onPress={() => initiateConnection('Bluetooth')}
            disabled={isScanning}
          >
            <Ionicons name="bluetooth" size={16} color="#FFFFFF" />
            <Text style={styles.connectBtnText}>{isScanning && connectionMethod==='Bluetooth' ? 'Connecting…' : 'Scan via Bluetooth'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.connectBtn, connectionMethod === 'Ethernet/USB-C' && styles.connectBtnActive]}
            onPress={() => initiateConnection('Ethernet/USB-C')}
            disabled={isScanning}
          >
            <Ionicons name="usb" size={16} color="#FFFFFF" />
            <Text style={styles.connectBtnText}>{isScanning && connectionMethod==='Ethernet/USB-C' ? 'Connecting…' : 'Connect via Ethernet/USB C'}</Text>
          </TouchableOpacity>
        </View>
        {gatewayConnected && (
          <View style={styles.discoveryBanner}>
            <Ionicons name="radio" size={16} color="#10B981" />
            <Text style={styles.discoveryText}>Gateway connected. Discovered {discoveredNodes.length} nodes.</Text>
          </View>
        )}
      </Card>
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Scan for New Devices</Text>
        <Text style={styles.cardSubtitle}>
          Enable Bluetooth and scan for unconfigured Encardio-rite devices in the vicinity
        </Text>
        
        <TouchableOpacity
          style={[styles.scanButton, isScanning && styles.buttonDisabled]}
          onPress={scanForDevices}
          disabled={isScanning}
        >
          {isScanning ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Ionicons name="bluetooth" size={20} color="#FFFFFF" />
          )}
          <Text style={styles.scanButtonText}>
            {isScanning ? 'Scanning...' : 'Start Scanning'}
          </Text>
        </TouchableOpacity>
      </Card>

      {scannedDevices.length > 0 && (
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Found Devices</Text>
          {scannedDevices.map((device) => (
            <TouchableOpacity
              key={device.id}
              style={styles.deviceItem}
              onPress={() => selectDevice(device)}
            >
              <View style={styles.deviceHeader}>
                <View style={styles.deviceIcon}>
                  <Ionicons name="hardware-chip" size={20} color="#2241DD" />
                </View>
                <View style={styles.deviceInfo}>
                  <Text style={styles.deviceId}>{device.deviceId}</Text>
                  <Text style={styles.deviceType}>{device.type}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6B7280" />
              </View>
              
              <View style={styles.deviceStats}>
                <View style={styles.statItem}>
                  <Ionicons name="cellular" size={14} color="#6B7280" />
                  <Text style={styles.statText}>{device.signalStrength} dBm</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="battery-half" size={14} color="#10B981" />
                  <Text style={styles.statText}>{device.batteryLevel}%</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </Card>
      )}
    </View>
  );

  const renderDeviceInfoStep = () => (
    <Card style={styles.card}>
      <Text style={styles.cardTitle}>Device Information</Text>
      <Text style={styles.cardSubtitle}>Enter basic information for {selectedDevice?.deviceId}</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Device Name *</Text>
        <TextInput
          style={styles.textInput}
          value={deviceInfo.name}
          onChangeText={(text) => setDeviceInfo({ ...deviceInfo, name: text })}
          placeholder="Enter device name"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Location</Text>
        <TextInput
          style={styles.textInput}
          value={deviceInfo.location}
          onChangeText={(text) => setDeviceInfo({ ...deviceInfo, location: text })}
          placeholder="Enter device location"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Project</Text>
        <View style={styles.projectDisplay}>
          <Ionicons name="folder" size={16} color="#2241DD" />
          <Text style={styles.projectText}>{project.name}</Text>
        </View>
      </View>
      
      <TouchableOpacity style={styles.nextButton} onPress={handleDeviceInfoNext}>
        <Text style={styles.nextButtonText}>Next: Sensor Details</Text>
        <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
      </TouchableOpacity>
    </Card>
  );

  const renderSensorDetailsStep = () => (
    <Card style={styles.card}>
      <Text style={styles.cardTitle}>Sensor Details</Text>
      <Text style={styles.cardSubtitle}>Configure sensors for the selected node</Text>

      {/* Node list when gateway is connected */}
      {gatewayConnected && discoveredNodes.length > 0 && (
        <View style={{ marginBottom: Spacing.md }}>
          <Text style={styles.inputLabel}>Nodes linked to Gateway</Text>
          {discoveredNodes.map((n) => (
            <TouchableOpacity key={n.id} style={styles.nodeRow} onPress={() => autoPassThroughToNode(n)}>
              <Ionicons name="radio" size={16} color="#2241DD" />
              <Text style={styles.nodeText}>{n.name} ({n.deviceId})</Text>
              {selectedNode?.id === n.id && (
                <View style={styles.nodeActiveBadge}><Text style={styles.nodeActiveText}>Selected</Text></View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {selectedNode && (
        <View style={{ marginBottom: Spacing.md }}>
          <Text style={styles.inputLabel}>Sensors on {selectedNode.name}</Text>
          {selectedNode.sensors.map((s) => (
            <View key={s.id} style={styles.sensorRow}>
              <Text style={styles.sensorPort}>Port {s.port}</Text>
              <Text style={styles.sensorName}>{s.name}</Text>
              <TouchableOpacity 
                style={[
                  styles.setupBtn, 
                  configuredSensors[`${selectedNode?.id}-${s.id}`] && styles.setupBtnConfigured
                ]} 
                onPress={() => openSensorSetup(s)}
              >
                <Text style={[
                  styles.setupBtnText,
                  configuredSensors[`${selectedNode?.id}-${s.id}`] && styles.setupBtnTextConfigured
                ]}>
                  {configuredSensors[`${selectedNode?.id}-${s.id}`] ? 'Configured' : 'Set Up Sensor'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
      
      {/* CalibraOne toggle */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Use CalibraOne API</Text>
        <TouchableOpacity
          style={[styles.toggle, useCalibraOne && styles.toggleOn]}
          onPress={() => setUseCalibraOne((v) => !v)}
        >
          <Text style={[styles.toggleText, useCalibraOne && styles.toggleTextOn]}>
            {useCalibraOne ? 'ENABLED' : 'DISABLED'}
          </Text>
        </TouchableOpacity>
      </View>

      {useCalibraOne && (
        <TouchableOpacity style={styles.secondaryBtn} onPress={tryCalibraOne} disabled={calibraOneLoading}>
          <Ionicons name="cloud-download" size={16} color="#2241DD" />
          <Text style={styles.secondaryBtnText}>{calibraOneLoading ? 'Checking…' : 'Fetch from CalibraOne'}</Text>
        </TouchableOpacity>
      )}

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Sensor Type *</Text>
        <TouchableOpacity 
          style={styles.dropdown}
          onPress={() => setShowSensorTypePicker(true)}
        >
          <Text style={styles.dropdownText}>
            {sensorDetails.type || 'Select sensor type'}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#6B7280" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Serial Number *</Text>
        <TextInput
          style={styles.textInput}
          value={sensorDetails.serialNumber}
          onChangeText={(text) => setSensorDetails({ ...sensorDetails, serialNumber: text })}
          placeholder="Enter sensor serial number"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Calibration Coefficients</Text>
        <TextInput
          style={styles.textInput}
          value={sensorDetails.calibrationCoeff}
          onChangeText={(text) => setSensorDetails({ ...sensorDetails, calibrationCoeff: text })}
          placeholder="e.g., A=0.1, B=0.0"
        />
      </View>
      
      <TouchableOpacity style={styles.nextButton} onPress={handleSensorDetailsNext}>
        <Text style={styles.nextButtonText}>Next: Schedule</Text>
        <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
      </TouchableOpacity>
    </Card>
  );

  const renderGatewayNetworkSettingsStep = () => (
    <Card style={styles.card}>
      <Text style={styles.cardTitle}>Gateway Network Settings</Text>
      <Text style={styles.cardSubtitle}>Configure communication parameters for {selectedNode?.name}</Text>

      {/* Current Time Display */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Current Time</Text>
        <View style={styles.timeDisplay}>
          <Ionicons name="time" size={16} color="#2241DD" />
          <Text style={styles.timeText}>
            {currentTime.toLocaleString('en-US', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </Text>
        </View>
      </View>

      {/* Primary Connection Type Selection */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Primary Connection Type *</Text>
        <View style={styles.protocolContainer}>
          {['LoRA', 'WiFi', '4G', 'NTN'].map((protocol) => (
            <TouchableOpacity
              key={protocol}
              style={[
                styles.protocolButton,
                network.primary === protocol && styles.protocolButtonActive
              ]}
              onPress={() => setNetwork(prev => ({ ...prev, primary: protocol }))}
            >
              <Ionicons 
                name={
                  protocol === 'LoRA' ? 'radio' :
                  protocol === 'WiFi' ? 'wifi' :
                  protocol === '4G' ? 'cellular' :
                  'satellite'
                } 
                size={20} 
                color={network.primary === protocol ? "#FFFFFF" : "#2241DD"} 
              />
              <Text style={[
                styles.protocolButtonText,
                network.primary === protocol && styles.protocolButtonTextActive
              ]}>
                {protocol}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Dynamic Communication Parameters based on selected protocol */}
      {network.primary === 'LoRA' && (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>LoRA Communication Parameters</Text>
          
          <View style={styles.paramRow}>
            <View style={styles.paramItem}>
              <Text style={styles.paramLabel}>Frequency (MHz)</Text>
              <TextInput
                style={styles.paramInput}
                value={communicationParams.LoRA.frequency}
                onChangeText={(text) => updateCommunicationParams('LoRA', 'frequency', text)}
                placeholder="868.1"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.paramItem}>
              <Text style={styles.paramLabel}>Spreading Factor</Text>
              <TextInput
                style={styles.paramInput}
                value={communicationParams.LoRA.spreadingFactor}
                onChangeText={(text) => updateCommunicationParams('LoRA', 'spreadingFactor', text)}
                placeholder="SF7"
              />
            </View>
          </View>
          
          <View style={styles.paramRow}>
            <View style={styles.paramItem}>
              <Text style={styles.paramLabel}>Bandwidth (kHz)</Text>
              <TextInput
                style={styles.paramInput}
                value={communicationParams.LoRA.bandwidth}
                onChangeText={(text) => updateCommunicationParams('LoRA', 'bandwidth', text)}
                placeholder="125"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.paramItem}>
              <Text style={styles.paramLabel}>Coding Rate</Text>
              <TextInput
                style={styles.paramInput}
                value={communicationParams.LoRA.codingRate}
                onChangeText={(text) => updateCommunicationParams('LoRA', 'codingRate', text)}
                placeholder="4/5"
              />
            </View>
          </View>
          
          <View style={styles.paramRow}>
            <View style={styles.paramItem}>
              <Text style={styles.paramLabel}>Power (dBm)</Text>
              <TextInput
                style={styles.paramInput}
                value={communicationParams.LoRA.power}
                onChangeText={(text) => updateCommunicationParams('LoRA', 'power', text)}
                placeholder="14"
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>
      )}

      {network.primary === 'WiFi' && (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>WiFi Communication Parameters</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>SSID</Text>
            <TextInput
              style={styles.textInput}
              value={communicationParams.WiFi.ssid}
              onChangeText={(text) => updateCommunicationParams('WiFi', 'ssid', text)}
              placeholder="Enter WiFi network name"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.textInput}
              value={communicationParams.WiFi.password}
              onChangeText={(text) => updateCommunicationParams('WiFi', 'password', text)}
              placeholder="Enter WiFi password"
              secureTextEntry
            />
          </View>
          
          <View style={styles.paramRow}>
            <View style={styles.paramItem}>
              <Text style={styles.paramLabel}>Security</Text>
              <TextInput
                style={styles.paramInput}
                value={communicationParams.WiFi.security}
                onChangeText={(text) => updateCommunicationParams('WiFi', 'security', text)}
                placeholder="WPA2"
              />
            </View>
            <View style={styles.paramItem}>
              <Text style={styles.paramLabel}>Channel</Text>
              <TextInput
                style={styles.paramInput}
                value={communicationParams.WiFi.channel}
                onChangeText={(text) => updateCommunicationParams('WiFi', 'channel', text)}
                placeholder="Auto"
              />
            </View>
          </View>
        </View>
      )}

      {network.primary === '4G' && (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>4G Communication Parameters</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>APN</Text>
            <TextInput
              style={styles.textInput}
              value={communicationParams['4G'].apn}
              onChangeText={(text) => updateCommunicationParams('4G', 'apn', text)}
              placeholder="internet"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Username</Text>
            <TextInput
              style={styles.textInput}
              value={communicationParams['4G'].username}
              onChangeText={(text) => updateCommunicationParams('4G', 'username', text)}
              placeholder="Enter username"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.textInput}
              value={communicationParams['4G'].password}
              onChangeText={(text) => updateCommunicationParams('4G', 'password', text)}
              placeholder="Enter password"
              secureTextEntry
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Network Type</Text>
            <TextInput
              style={styles.textInput}
              value={communicationParams['4G'].networkType}
              onChangeText={(text) => updateCommunicationParams('4G', 'networkType', text)}
              placeholder="LTE"
            />
          </View>
        </View>
      )}

      {network.primary === 'NTN' && (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>NTN Communication Parameters</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Satellite Provider</Text>
            <TextInput
              style={styles.textInput}
              value={communicationParams.NTN.satelliteProvider}
              onChangeText={(text) => updateCommunicationParams('NTN', 'satelliteProvider', text)}
              placeholder="Starlink"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Plan Type</Text>
            <TextInput
              style={styles.textInput}
              value={communicationParams.NTN.planType}
              onChangeText={(text) => updateCommunicationParams('NTN', 'planType', text)}
              placeholder="Standard"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Data Limit</Text>
            <TextInput
              style={styles.textInput}
              value={communicationParams.NTN.dataLimit}
              onChangeText={(text) => updateCommunicationParams('NTN', 'dataLimit', text)}
              placeholder="Unlimited"
            />
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.saveConfigButton} onPress={saveConfigurationData}>
          <Ionicons name="save" size={20} color="#FFFFFF" />
          <Text style={styles.saveConfigButtonText}>Save Configuration</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.nextButton} 
          onPress={() => setConfigurationStep('schedule')}
        >
          <Text style={styles.nextButtonText}>Next: Schedule</Text>
          <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderScheduleStep = () => (
    <Card style={styles.card}>
      <Text style={styles.cardTitle}>Configuration and scheduling</Text>
      <Text style={styles.cardSubtitle}>Configure sensors and set scheduling parameters</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Scan start time</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter scan start time"
          keyboardType="numeric"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Number of sensors</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter number of sensors"
          keyboardType="numeric"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Connected sensor(s) ID</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter sensor IDs"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Sensor parameters</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter sensor parameters"
          multiline
          numberOfLines={3}
        />
        
        {/* Use CalibraOne API Button */}
        <TouchableOpacity 
          style={styles.secondaryBtn} 
          onPress={tryCalibraOne} 
          disabled={calibraOneLoading}
        >
          <Ionicons name="cloud-download" size={16} color="#2241DD" />
          <Text style={styles.secondaryBtnText}>
            {calibraOneLoading ? 'Checking…' : 'Use CalibraOne API'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Scan interval</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter scan interval"
          keyboardType="numeric"
        />
      </View>
      
      <TouchableOpacity style={styles.completeButton} onPress={applyAndPushConfiguration}>
        <Ionicons name="cloud-upload" size={20} color="#FFFFFF" />
        <Text style={styles.completeButtonText}>Apply & Push Configuration</Text>
      </TouchableOpacity>
    </Card>
  );


  return (
    <View style={styles.container}>
      <ScreenHeader 
        title="Device Configuration" 
        navigation={navigation}
        showLogo={true}
        rightAction={null}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Progress Indicator */}
        <Card style={styles.card}>
          <View style={styles.progressContainer}>
            <View style={styles.progressStep}>
              <View style={[styles.progressDot, configurationStep === 'scan' && styles.progressDotActive]} />
              <Text style={[styles.progressText, configurationStep === 'scan' && styles.progressTextActive]}>
                Scan
              </Text>
            </View>
            <View style={styles.progressLine} />
            <View style={styles.progressStep}>
              <View style={[styles.progressDot, configurationStep === 'sensorDetails' && styles.progressDotActive]} />
              <Text style={[styles.progressText, configurationStep === 'sensorDetails' && styles.progressTextActive]}>
                Sensor
              </Text>
            </View>
            <View style={styles.progressLine} />
            <View style={styles.progressStep}>
              <View style={[styles.progressDot, configurationStep === 'gatewayNetworkSettings' && styles.progressDotActive]} />
              <Text style={[styles.progressText, configurationStep === 'gatewayNetworkSettings' && styles.progressTextActive]}>
                Gateway
              </Text>
            </View>
            <View style={styles.progressLine} />
            <View style={styles.progressStep}>
              <View style={[styles.progressDot, configurationStep === 'schedule' && styles.progressDotActive]} />
              <Text style={[styles.progressText, configurationStep === 'schedule' && styles.progressTextActive]}>
                Schedule
              </Text>
            </View>
          </View>
        </Card>

        {/* Configuration Steps */}
        {configurationStep === 'scan' && renderScanStep()}
        {configurationStep === 'sensorDetails' && renderSensorDetailsStep()}
        {configurationStep === 'gatewayNetworkSettings' && renderGatewayNetworkSettingsStep()}
        {configurationStep === 'schedule' && renderScheduleStep()}

        {/* Instructions */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Configuration Instructions</Text>
          <View style={styles.instructionsList}>
            <Text style={styles.instructionItem}>
              • Enable Bluetooth on your device before scanning
            </Text>
            <Text style={styles.instructionItem}>
              • Select an unconfigured device from the scan results
            </Text>
            <Text style={styles.instructionItem}>
              • Enter device name and associate with current project
            </Text>
            <Text style={styles.instructionItem}>
              • Configure sensor details and calibration parameters
            </Text>
            <Text style={styles.instructionItem}>
              • Set measurement and upload schedules
            </Text>
          </View>
        </Card>
      </ScrollView>
      
      {/* Sensor Type Picker Modal */}
      <Modal
        visible={showSensorTypePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSensorTypePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Sensor Type</Text>
              <TouchableOpacity onPress={() => setShowSensorTypePicker(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalList}>
              {sensorTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.modalItem,
                    sensorDetails.type === type && styles.modalItemSelected
                  ]}
                  onPress={() => {
                    setSensorDetails({ ...sensorDetails, type });
                    setShowSensorTypePicker(false);
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    sensorDetails.type === type && styles.modalItemTextSelected
                  ]}>
                    {type}
                  </Text>
                  {sensorDetails.type === type && (
                    <Ionicons name="checkmark" size={20} color="#2241DD" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Sensor Setup Modal */}
      <SensorSetupModal
        visible={showSensorSetupModal}
        sensor={selectedSensorForSetup}
        node={selectedNode}
        onClose={() => setShowSensorSetupModal(false)}
        onSave={saveSensorConfiguration}
      />
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
  progressContainer: {
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressStep: {
    alignItems: 'center',
    flexDirection: 'column',
    minWidth: 56,
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
    marginBottom: Spacing.xs,
  },
  progressDotActive: {
    backgroundColor: '#2241DD',
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
  },
  progressTextActive: {
    color: '#2241DD',
    fontWeight: '600',
  },
  progressLine: {
    width: 24,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 6,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2241DD',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  scanButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: '#FFFFFF',
    marginLeft: Spacing.sm,
  },
  deviceItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  deviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceId: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  deviceType: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  deviceStats: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginLeft: Spacing.xs,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
    backgroundColor: '#FFFFFF',
  },
  projectDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  projectText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    marginLeft: Spacing.sm,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#FFFFFF',
  },
  dropdownText: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
    color: '#111827',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2241DD',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginRight: Spacing.sm,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginLeft: Spacing.sm,
  },
  connectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    flexBasis: '48%',
    backgroundColor: '#2241DD',
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  connectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  connectBtnActive: {
    backgroundColor: '#1E3A8A',
  },
  connectBtnText: {
    color: '#FFFFFF',
    marginLeft: Spacing.xs,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  discoveryBanner: {
    marginTop: Spacing.sm,
    backgroundColor: '#ECFDF5',
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  discoveryText: {
    color: '#065F46',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  nodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: '#F9FAFB',
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  nodeText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#111827',
  },
  nodeActiveBadge: {
    backgroundColor: '#2241DD',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  nodeActiveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  sensorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 6,
  },
  sensorPort: {
    width: 60,
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  sensorName: {
    flex: 1,
    color: '#111827',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  setupBtn: {
    borderWidth: 1,
    borderColor: '#2241DD',
    borderRadius: BorderRadius.sm,
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
  },
  setupBtnText: {
    color: '#2241DD',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  secondaryBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#2241DD',
    borderRadius: BorderRadius.sm,
    paddingVertical: 6,
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  secondaryBtnText: {
    color: '#2241DD',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  readonlyBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    gap: 4,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  modalList: {
    maxHeight: 300,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalItemSelected: {
    backgroundColor: '#EEF2FF',
  },
  modalItemText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
  },
  modalItemTextSelected: {
    color: '#2241DD',
    fontWeight: Typography.fontWeight.semibold,
  },
  // Sensor setup modal styles
  sensorInfo: {
    backgroundColor: '#F3F4F6',
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  sensorInfoText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.secondary,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#2241DD',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: '#FFFFFF',
  },
  setupBtnConfigured: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  setupBtnTextConfigured: {
    color: '#FFFFFF',
  },
  toggle: {
    alignSelf: 'flex-start',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: BorderRadius.sm,
    paddingVertical: 2,
    paddingHorizontal: Spacing.sm,
    backgroundColor: '#FFFFFF',
  },
  toggleOn: {
    borderColor: '#2241DD',
    backgroundColor: '#2241DD',
  },
  toggleText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
  },
  toggleTextOn: {
    color: '#FFFFFF',
    fontWeight: Typography.fontWeight.semibold,
  },
  templateChip: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: BorderRadius.sm,
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    backgroundColor: '#FFFFFF',
  },
  templateChipActive: {
    borderColor: '#2241DD',
    backgroundColor: '#EEF2FF',
  },
  templateChipText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
  },
  templateChipTextActive: {
    color: '#2241DD',
    fontWeight: Typography.fontWeight.semibold,
  },
  instructionsList: {
    paddingLeft: Spacing.sm,
  },
  instructionItem: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  // Gateway Network Settings Styles
  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#2241DD',
    marginLeft: 6,
  },
  protocolContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  protocolButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#2241DD',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
    minWidth: 80,
    justifyContent: 'center',
  },
  protocolButtonActive: {
    backgroundColor: '#2241DD',
  },
  protocolButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#2241DD',
  },
  protocolButtonTextActive: {
    color: '#FFFFFF',
  },
  paramRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  paramItem: {
    flex: 1,
  },
  paramLabel: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 4,
  },
  paramInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
    backgroundColor: '#FFFFFF',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  saveConfigButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xs,
  },
  saveConfigButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginLeft: 6,
  },
});

export default DeviceConfigurationScreen;
