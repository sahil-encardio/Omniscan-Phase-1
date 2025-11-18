import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Platform, PermissionsAndroid, Alert, Linking } from 'react-native';

// Real BLE service for actual device scanning and connection
import BLEService from '../services/BLEService';
// import BLEService from '../services/BLEServiceMock'; // For UI testing only

// Import sensor data parser (lazy/optional)
let parseAnalogFrame = null;
try {
  const parserModule = require('../utils/sensorDataParser');
  parseAnalogFrame = parserModule.parseAnalogFrame;
} catch (error) {
  console.error('Failed to load sensorDataParser:', error);
  parseAnalogFrame = () => null; // Dummy function
}

// Import database manager for EDI-55
import DatabaseManager from '../database/DatabaseManager';

const BLEContext = createContext();

export const BLEProvider = ({ children }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [services, setServices] = useState([]);
  const [bleState, setBleState] = useState('Unknown');
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [rssi, setRssi] = useState(null);

  // Initialize BLE state monitoring only when needed
  // Don't initialize BLE manager on app load to prevent crashes
  const [bleInitialized, setBleInitialized] = useState(false);
  const [stateSubscription, setStateSubscription] = useState(null);

  // Sensor data state
  const [sensorData, setSensorData] = useState([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastReadingTime, setLastReadingTime] = useState(null);
  
  // Use ref to store monitoring subscription
  const monitoringSubscription = useRef(null);
  const monitoringInterval = useRef(null);

  // EDI-55 device info state
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [navigationCallback, setNavigationCallback] = useState(null);

  const initializeBLE = useCallback(async () => {
    if (bleInitialized) return;

    try {
      // Try to initialize BLE service
      let subscription = null;
      try {
        subscription = BLEService.onStateChange((state) => {
        console.log('BLE State updated:', state);
        setBleState(state);
        if (state !== 'PoweredOn') {
          setConnectedDevice(null);
          setIsScanning(false);
        }
      });
      } catch (bleError) {
        console.error('Failed to initialize BLE service:', bleError);
        setBleState('Unsupported');
        // Don't throw - allow app to continue without BLE
        return;
      }
      
      if (subscription) {
      setStateSubscription(subscription);
      }
      setBleInitialized(true);
      console.log('BLE initialized successfully');

      // Initialize EDI-55 database (non-blocking, don't fail if it errors)
      try {
        await DatabaseManager.initialize();
        console.log('EDI-55 database initialized');
      } catch (error) {
        console.error('Failed to initialize EDI-55 database (non-fatal):', error);
        // Don't throw - allow app to continue
      }
    } catch (error) {
      console.error('Failed to initialize BLE:', error);
      setBleState('Unsupported');
      // Don't show alert - just continue without BLE
      // Alert.alert('BLE Not Available', 'Bluetooth Low Energy is not available on this device.');
    }
  }, [bleInitialized]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try {
        if (stateSubscription) {
          stateSubscription.remove();
        }
        BLEService.destroy();
      } catch (error) {
        console.error('Error during BLE cleanup:', error);
      }
    };
  }, [stateSubscription]);

  /**
   * Request BLE permissions for Android
   */
  const requestAndroidPermissions = async () => {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      const apiLevel = Platform.Version;

      if (apiLevel >= 31) {
        // Android 12+ permissions
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

        const allGranted =
          granted['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED;

        return allGranted;
      } else {
        // Android 11 and below
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ]);

        const allGranted =
          granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED ||
          granted['android.permission.ACCESS_COARSE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED;

        return allGranted;
      }
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  };

  /**
   * Check if permissions are granted
   */
  const checkPermissions = async () => {
    if (Platform.OS === 'ios') {
      // iOS permissions are handled automatically
      setPermissionsGranted(true);
      return true;
    }

    if (Platform.OS === 'android') {
      const apiLevel = Platform.Version;

      if (apiLevel >= 31) {
        const scanGranted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN
        );
        const connectGranted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
        );
        const locationGranted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );

        const granted = scanGranted && connectGranted && locationGranted;
        setPermissionsGranted(granted);
        return granted;
      } else {
        const locationGranted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        setPermissionsGranted(locationGranted);
        return locationGranted;
      }
    }

    return false;
  };

  /**
   * Request permissions with user-friendly flow
   */
  const requestPermissions = async () => {
    const hasPermissions = await checkPermissions();
    if (hasPermissions) {
      return true;
    }

    const granted = await requestAndroidPermissions();
    setPermissionsGranted(granted);

    if (!granted) {
      Alert.alert(
        'Permissions Required',
        'Bluetooth and Location permissions are required to scan for devices. Please grant permissions in Settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
    }

    return granted;
  };

  /**
   * Start scanning for BLE devices
   */
  const startScan = useCallback(async () => {
    try {
      // Initialize BLE if not already initialized
      if (!bleInitialized) {
        initializeBLE();
        // Wait for initialization
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // Don't check state strictly - let the scan attempt happen
      // The BLE manager will handle errors if Bluetooth is actually off
      
      // Check permissions
      const hasPermissions = await checkPermissions();
      if (!hasPermissions) {
        const granted = await requestPermissions();
        if (!granted) {
          return;
        }
      }

      // Clear previous devices
      setDevices([]);
      setIsScanning(true);

      // Start scanning
      BLEService.startScanning((device) => {
        setDevices((prevDevices) => {
          // Check if device already exists
          const existingIndex = prevDevices.findIndex((d) => d.id === device.id);
          
          if (existingIndex !== -1) {
            // Update existing device
            const updated = [...prevDevices];
            updated[existingIndex] = { ...updated[existingIndex], ...device };
            return updated;
          } else {
            // Add new device
            return [...prevDevices, device];
          }
        });
      });

      // Auto-stop after 10 seconds
      setTimeout(() => {
        stopScan();
      }, 10000);
    } catch (error) {
      console.error('Scan error:', error);
      setIsScanning(false);
      Alert.alert('Scan Error', error.message || 'Failed to start scanning for devices.');
    }
  }, [bleInitialized, initializeBLE, checkPermissions, requestPermissions]);

  /**
   * Stop scanning
   */
  const stopScan = useCallback(() => {
    BLEService.stopScanning();
    setIsScanning(false);
  }, []);

  /**
   * Connect to a device
   */
  const connectToDevice = useCallback(async (deviceId) => {
    try {
      stopScan();

      const device = await BLEService.connectToDevice(deviceId);
      
      setConnectedDevice({
        id: device.id,
        name: device.name || 'Unknown Device',
      });

      // Setup disconnect listener
      BLEService.onDeviceDisconnected(device.id, (error, disconnectedDevice) => {
        console.log('Device disconnected in context');
        setConnectedDevice(null);
        setServices([]);
        setRssi(null);
      });

      // Discover services
      const discoveredServices = await BLEService.getServices();
      setServices(discoveredServices);

      // Read initial RSSI
      const initialRssi = await BLEService.readRSSI();
      setRssi(initialRssi);

      // Update RSSI periodically
      const rssiInterval = setInterval(async () => {
        try {
          const currentRssi = await BLEService.readRSSI();
          setRssi(currentRssi);
        } catch (error) {
          clearInterval(rssiInterval);
        }
      }, 5000);

      // Trigger navigation callback if set (for EDI-55 configuration)
      if (navigationCallback) {
        navigationCallback(device);
      }

      return device;
    } catch (error) {
      console.error('Connection error:', error);
      Alert.alert('Connection Failed', `Failed to connect to device: ${error.message}`);
      throw error;
    }
  }, [stopScan]);

  /**
   * Disconnect from device
   */
  const disconnectFromDevice = useCallback(async () => {
    try {
      await BLEService.disconnectFromDevice();
      setConnectedDevice(null);
      setServices([]);
      setRssi(null);
    } catch (error) {
      console.error('Disconnect error:', error);
      Alert.alert('Disconnect Failed', 'Failed to disconnect from device.');
    }
  }, []);

  /**
   * Read characteristic
   */
  const readCharacteristic = useCallback(async (serviceUUID, characteristicUUID) => {
    try {
      const value = await BLEService.readCharacteristic(serviceUUID, characteristicUUID);
      return value;
    } catch (error) {
      console.error('Read error:', error);
      throw error;
    }
  }, []);

  /**
   * Write characteristic
   */
  const writeCharacteristic = useCallback(
    async (serviceUUID, characteristicUUID, value, withResponse = true) => {
      try {
        await BLEService.writeCharacteristic(
          serviceUUID,
          characteristicUUID,
          value,
          withResponse
        );
      } catch (error) {
        console.error('Write error:', error);
        throw error;
      }
    },
    []
  );

  /**
   * Subscribe to characteristic
   */
  const subscribeToCharacteristic = useCallback(
    async (serviceUUID, characteristicUUID, callback) => {
      try {
        const subscription = await BLEService.subscribeToCharacteristic(
          serviceUUID,
          characteristicUUID,
          callback
        );
        return subscription;
      } catch (error) {
        console.error('Subscribe error:', error);
        throw error;
      }
    },
    []
  );

  /**
   * Read sensor data once
   */
  const readSensorData = useCallback(async () => {
    try {
      if (!connectedDevice) {
        throw new Error('No device connected');
      }

      console.log('Reading sensor data from device...');
      const base64Data = await BLEService.readAnalogData();
      
      if (base64Data) {
        console.log('Received data, parsing...');
        const parsedData = parseAnalogFrame ? parseAnalogFrame(base64Data) : null;
        setSensorData(parsedData);
        setLastReadingTime(new Date());
        console.log(`Successfully parsed ${parsedData.length} active sensors`);
        
        if (parsedData.length === 0) {
          console.warn('No active sensors found in data');
        }
        
        return parsedData;
      }

      console.warn('No data received from device');
      return [];
    } catch (error) {
      console.error('Error reading sensor data:', error);
      console.error('Error details:', error.message);
      
      // Only show alert if it's not a "service not found" error (which means device isn't ready)
      if (!error.message.includes('Service') && !error.message.includes('Characteristic')) {
        Alert.alert('Read Error', 'Failed to read sensor data from device.');
      }
      
      throw error;
    }
  }, [connectedDevice]);

  /**
   * Start real-time sensor monitoring
   */
  const startMonitoring = useCallback(async () => {
    try {
      if (!connectedDevice) {
        Alert.alert('Not Connected', 'Please connect to a device first.');
        return;
      }

      if (isMonitoring) {
        console.log('Already monitoring');
        return;
      }

      console.log('Starting sensor monitoring...');
      setIsMonitoring(true);

      // Subscribe to notifications
      const subscription = await BLEService.subscribeToAnalogData((data, error) => {
        if (error) {
          console.error('Monitoring error:', error);
          return;
        }

        if (data) {
          const parsedData = parseAnalogFrame ? parseAnalogFrame(data) : null;
          setSensorData(parsedData);
          setLastReadingTime(new Date());
        }
      });

      monitoringSubscription.current = subscription;

      // Also set up periodic reading as fallback (every 3 seconds)
      monitoringInterval.current = setInterval(async () => {
        try {
          const base64Data = await BLEService.readAnalogData();
          if (base64Data) {
            const parsedData = parseAnalogFrame ? parseAnalogFrame(base64Data) : null;
            setSensorData(parsedData);
            setLastReadingTime(new Date());
          }
        } catch (error) {
          console.error('Periodic read error:', error);
        }
      }, 3000);

      console.log('Sensor monitoring started');
    } catch (error) {
      console.error('Error starting monitoring:', error);
      setIsMonitoring(false);
      Alert.alert('Monitoring Error', 'Failed to start real-time monitoring.');
    }
  }, [connectedDevice, isMonitoring]);

  /**
   * Stop real-time sensor monitoring
   */
  const stopMonitoring = useCallback(() => {
    console.log('Stopping sensor monitoring...');
    
    // Unsubscribe from notifications
    if (monitoringSubscription.current) {
      BLEService.unsubscribeFromAnalogData(monitoringSubscription.current);
      monitoringSubscription.current = null;
    }

    // Clear periodic reading interval
    if (monitoringInterval.current) {
      clearInterval(monitoringInterval.current);
      monitoringInterval.current = null;
    }

    setIsMonitoring(false);
    console.log('Sensor monitoring stopped');
  }, []);

  // Cleanup monitoring on unmount or disconnect
  useEffect(() => {
    if (!connectedDevice && isMonitoring) {
      stopMonitoring();
    }
  }, [connectedDevice, isMonitoring, stopMonitoring]);

  /**
   * Set navigation callback for EDI-55 configuration
   * This callback will be triggered after successful connection
   */
  const setEDI55NavigationCallback = useCallback((callback) => {
    setNavigationCallback(() => callback);
  }, []);

  const value = {
    // State
    isScanning,
    devices,
    connectedDevice,
    services,
    bleState,
    permissionsGranted,
    rssi,
    bleInitialized,
    sensorData,
    isMonitoring,
    lastReadingTime,
    deviceInfo,

    // Actions
    startScan,
    stopScan,
    connectToDevice,
    disconnectFromDevice,
    readCharacteristic,
    writeCharacteristic,
    subscribeToCharacteristic,
    requestPermissions,
    checkPermissions,
    initializeBLE,
    readSensorData,
    startMonitoring,
    stopMonitoring,
    setEDI55NavigationCallback,

    // Utilities
    bufferToHex: BLEService.constructor.bufferToHex,
    hexToBuffer: BLEService.constructor.hexToBuffer,
    bufferToString: BLEService.constructor.bufferToString,
    stringToBuffer: BLEService.constructor.stringToBuffer,
  };

  return <BLEContext.Provider value={value}>{children}</BLEContext.Provider>;
};

export const useBLE = () => {
  const context = useContext(BLEContext);
  if (!context) {
    throw new Error('useBLE must be used within a BLEProvider');
  }
  return context;
};

