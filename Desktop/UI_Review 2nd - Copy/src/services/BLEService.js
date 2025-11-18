import { Platform } from 'react-native';
import { Buffer } from 'buffer';

// Lazy import of BleManager to prevent crashes if native module isn't available
let BleManager = null;
let BleManagerLoaded = false;

const loadBleManager = () => {
  if (!BleManagerLoaded) {
    try {
      BleManager = require('react-native-ble-plx').BleManager;
      BleManagerLoaded = true;
    } catch (error) {
      console.error('Failed to load BLE module:', error);
      BleManager = null;
      BleManagerLoaded = true; // Mark as loaded (failed) to prevent retries
    }
  }
  return BleManager;
};

class BLEService {
  constructor() {
    this.manager = null;
    this.connectedDevice = null;
    this.scanSubscription = null;
  }

  /**
   * Lazy initialization of BLE Manager
   */
  _ensureManager() {
    if (!this.manager) {
      try {
        const BleManagerClass = loadBleManager();
        if (!BleManagerClass) {
          console.error('BLE Manager class not available');
          return null;
        }
        this.manager = new BleManagerClass();
      } catch (error) {
        console.error('Failed to initialize BLE Manager:', error);
        // Return null instead of throwing to prevent crashes
        return null;
      }
    }
    return this.manager;
  }

  /**
   * Initialize BLE Manager and check state
   */
  async initializeBLE() {
    try {
    const manager = this._ensureManager();
      if (!manager) {
        console.error('BLE Manager not available');
        return false;
      }
    const state = await manager.state();
    console.log('BLE State:', state);
    return state === 'PoweredOn';
    } catch (error) {
      console.error('Error in initializeBLE:', error);
      return false;
    }
  }

  /**
   * Monitor BLE state changes
   */
  onStateChange(callback) {
    try {
    const manager = this._ensureManager();
      if (!manager) {
        console.error('BLE Manager not available');
        // Return a dummy subscription object
        return {
          remove: () => {},
        };
      }
    return manager.onStateChange((state) => {
      console.log('BLE State Changed:', state);
      callback(state);
    }, true);
    } catch (error) {
      console.error('Error in onStateChange:', error);
      // Return a dummy subscription object to prevent crashes
      return {
        remove: () => {},
      };
    }
  }

  /**
   * Start scanning for BLE devices
   * @param {Function} onDeviceFound - Callback when device is discovered
   * @param {Array} serviceUUIDs - Optional array of service UUIDs to filter
   */
  startScanning(onDeviceFound, serviceUUIDs = null) {
    try {
    console.log('Starting BLE scan...');
    
    const manager = this._ensureManager();
      if (!manager) {
        console.error('BLE Manager not available for scanning');
        return;
      }
    
    // Stop any existing scan
    this.stopScanning();

    this.scanSubscription = manager.startDeviceScan(
      serviceUUIDs,
      { allowDuplicates: false },
      (error, device) => {
        if (error) {
          console.error('Scan error:', error);
          return;
        }

        if (device) {
          console.log('Device found:', device.name || 'Unknown', device.id);
          onDeviceFound({
            id: device.id,
            name: device.name || 'Unknown Device',
            rssi: device.rssi,
            serviceUUIDs: device.serviceUUIDs || [],
            manufacturerData: device.manufacturerData,
          });
        }
      }
    );
    } catch (error) {
      console.error('Error in startScanning:', error);
    }
  }

  /**
   * Stop scanning for devices
   */
  stopScanning() {
    if (this.scanSubscription && this.manager) {
      console.log('Stopping BLE scan...');
      this.manager.stopDeviceScan();
      this.scanSubscription = null;
    }
  }

  /**
   * Connect to a BLE device
   * @param {string} deviceId - Device ID to connect to
   */
  async connectToDevice(deviceId) {
    try {
      console.log('Connecting to device:', deviceId);
      
      const manager = this._ensureManager();
      
      // Stop scanning before connecting
      this.stopScanning();

      // Connect to device
      const device = await manager.connectToDevice(deviceId, {
        autoConnect: false,
        requestMTU: 512,
      });

      console.log('Connected to:', device.name || device.id);

      // Discover services and characteristics
      await device.discoverAllServicesAndCharacteristics();
      
      this.connectedDevice = device;
      return device;
    } catch (error) {
      console.error('Connection error:', error);
      throw error;
    }
  }

  /**
   * Disconnect from connected device
   */
  async disconnectFromDevice() {
    if (this.connectedDevice) {
      try {
        console.log('Disconnecting from:', this.connectedDevice.id);
        await this.connectedDevice.cancelConnection();
        this.connectedDevice = null;
      } catch (error) {
        console.error('Disconnect error:', error);
        throw error;
      }
    }
  }

  /**
   * Monitor device connection state
   */
  onDeviceDisconnected(deviceId, callback) {
    const manager = this._ensureManager();
    return manager.onDeviceDisconnected(deviceId, (error, device) => {
      console.log('Device disconnected:', device?.id);
      if (this.connectedDevice?.id === device?.id) {
        this.connectedDevice = null;
      }
      callback(error, device);
    });
  }

  /**
   * Get all services for connected device
   */
  async getServices() {
    if (!this.connectedDevice) {
      throw new Error('No device connected');
    }

    try {
      const services = await this.connectedDevice.services();
      console.log('Services found:', services.length);
      
      const servicesWithCharacteristics = await Promise.all(
        services.map(async (service) => {
          const characteristics = await this.connectedDevice.characteristicsForService(
            service.uuid
          );
          
          return {
            uuid: service.uuid,
            characteristics: characteristics.map((char) => ({
              uuid: char.uuid,
              serviceUUID: char.serviceUUID,
              isReadable: char.isReadable,
              isWritableWithResponse: char.isWritableWithResponse,
              isWritableWithoutResponse: char.isWritableWithoutResponse,
              isNotifiable: char.isNotifiable,
              isIndicatable: char.isIndicatable,
              value: null,
            })),
          };
        })
      );

      return servicesWithCharacteristics;
    } catch (error) {
      console.error('Error getting services:', error);
      throw error;
    }
  }

  /**
   * Read characteristic value
   * @param {string} serviceUUID - Service UUID
   * @param {string} characteristicUUID - Characteristic UUID
   */
  async readCharacteristic(serviceUUID, characteristicUUID) {
    if (!this.connectedDevice) {
      throw new Error('No device connected');
    }

    try {
      console.log('Reading characteristic:', characteristicUUID);
      const characteristic = await this.connectedDevice.readCharacteristicForService(
        serviceUUID,
        characteristicUUID
      );

      const value = characteristic.value;
      return value ? Buffer.from(value, 'base64') : null;
    } catch (error) {
      console.error('Error reading characteristic:', error);
      throw error;
    }
  }

  /**
   * Write characteristic value
   * @param {string} serviceUUID - Service UUID
   * @param {string} characteristicUUID - Characteristic UUID
   * @param {Buffer|string} value - Value to write
   * @param {boolean} withResponse - Write with or without response
   */
  async writeCharacteristic(serviceUUID, characteristicUUID, value, withResponse = true) {
    // Validate inputs
    if (!serviceUUID || !characteristicUUID) {
      const error = new Error('Service UUID and Characteristic UUID are required');
      console.error('❌ Write error:', error.message);
      throw error;
    }

    if (!this.connectedDevice) {
      const error = new Error('No device connected');
      console.error('❌ Write error:', error.message);
      throw error;
    }

    // Check if device is still connected
    try {
      if (!this.connectedDevice.id) {
        throw new Error('Device connection lost - device ID is missing');
      }
    } catch (connectionCheckError) {
      console.error('❌ Connection check failed:', connectionCheckError);
      throw new Error('Device connection lost');
    }

    try {
      console.log('=== Writing to Characteristic ===');
      console.log('Service UUID:', serviceUUID);
      console.log('Characteristic UUID:', characteristicUUID);
      console.log('Value type:', typeof value);
      console.log('Value length:', value?.length || 'unknown');
      
      // Convert value to base64 safely
      let base64Value;
      try {
        if (Buffer.isBuffer(value)) {
          base64Value = value.toString('base64');
        } else if (typeof value === 'string') {
          // Check if it's already base64
          if (value.match(/^[A-Za-z0-9+/=]+$/)) {
            base64Value = value;
          } else {
            base64Value = Buffer.from(value).toString('base64');
          }
        } else {
          base64Value = Buffer.from(String(value)).toString('base64');
        }
        
        if (!base64Value || base64Value.length === 0) {
          throw new Error('Converted base64 value is empty');
        }
        
        console.log('Base64 value length:', base64Value.length);
      } catch (conversionError) {
        console.error('❌ Value conversion error:', conversionError);
        throw new Error(`Failed to convert value to base64: ${conversionError.message}`);
      }

      // Add timeout to prevent hanging
      const writePromise = this.connectedDevice.writeCharacteristicWithResponseForService(
        serviceUUID,
        characteristicUUID,
        base64Value
      );

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('BLE write operation timed out after 10 seconds'));
        }, 10000);
      });

      await Promise.race([writePromise, timeoutPromise]);

      console.log('✓ Write successful');
    } catch (error) {
      console.error('❌❌❌ Error writing characteristic:', error);
      console.error('Error type:', typeof error);
      console.error('Error message:', error?.message || 'No message');
      console.error('Error name:', error?.name || 'No name');
      
      // Check if device is still connected
      if (!this.connectedDevice || !this.connectedDevice.id) {
        console.error('Device connection lost during write');
        throw new Error('Device connection lost during write operation');
      }
      
      // Re-throw with more context
      const enhancedError = new Error(
        `BLE write failed: ${error?.message || 'Unknown error'} (Service: ${serviceUUID}, Characteristic: ${characteristicUUID})`
      );
      enhancedError.originalError = error;
      throw enhancedError;
    }
  }

  /**
   * Subscribe to characteristic notifications
   * @param {string} serviceUUID - Service UUID
   * @param {string} characteristicUUID - Characteristic UUID
   * @param {Function} callback - Callback when notification received
   */
  async subscribeToCharacteristic(serviceUUID, characteristicUUID, callback) {
    if (!this.connectedDevice) {
      throw new Error('No device connected');
    }

    try {
      console.log('=== Subscribing to Characteristic ===');
      console.log('Service UUID:', serviceUUID);
      console.log('Characteristic UUID:', characteristicUUID);
      console.log('Device ID:', this.connectedDevice.id);
      
      // Enable notifications first (this is critical for BLE)
      // react-native-ble-manager's monitorCharacteristicForService should handle this,
      // but we'll add explicit logging
      console.log('Calling monitorCharacteristicForService...');
      
      const subscription = this.connectedDevice.monitorCharacteristicForService(
        serviceUUID,
        characteristicUUID,
        (error, characteristic) => {
          // DEBUG: Log what we're receiving
          console.log('=== BLE Callback Received ===');
          console.log('Error param:', error ? (typeof error === 'string' ? error.substring(0, 50) + '...' : error) : 'null');
          console.log('Error type:', typeof error);
          console.log('Characteristic param:', characteristic ? (typeof characteristic === 'object' ? 'object' : characteristic) : 'null');
          console.log('Characteristic type:', typeof characteristic);
          
          // Handle case where data might be passed as first parameter (some BLE libraries do this)
          // Check if first parameter is actually data (base64 string) - this happens when library passes data directly
          if (error && typeof error === 'string' && error.length > 10 && !error.message && !error.stack) {
            // This is actually data, not an error! (base64 strings are long and don't have .message)
            console.log('✓ BLE notification received (data as first param - treating as data)');
            console.log('  Base64 length:', error.length);
            console.log('  First 50 chars:', error.substring(0, 50));
            callback(null, error); // Pass as data, not error
            return;
          }
          
          // Handle actual errors (Error objects have .message or .stack)
          if (error && (error.message || error.stack || typeof error === 'object')) {
            console.error('❌ Notification error:', error);
            console.error('Error type:', typeof error);
            console.error('Error message:', error.message || error);
            callback(error, null);
            return;
          }

          // Normal case: characteristic object with value property
          if (!characteristic) {
            console.warn('⚠ Notification received but characteristic is null/undefined');
            callback(null, null);
            return;
          }

          // Pass the raw base64 string to callback, let the parser handle conversion
          // This allows us to handle different data formats and add better debugging
          const value = characteristic.value || null;
          
          if (value) {
            console.log('✓ BLE notification received (normal path)');
            console.log('  Base64 length:', value.length);
            console.log('  Characteristic UUID:', characteristic.uuid);
            console.log('  Calling callback with data...');
            console.log('  Callback type:', typeof callback);
            console.log('  Value preview:', value.substring(0, 50) + '...');
            
            // CRITICAL: Ensure we pass (error, data) in the correct order
            // Some BLE libraries might expect (data, error) - we use standard (error, data)
            try {
              // Pass as (null, value) - standard Node.js callback pattern
              callback(null, value);
              console.log('  ✓ Callback executed successfully with (null, value)');
            } catch (callbackError) {
              console.error('  ❌ Callback execution failed:', callbackError);
              console.error('  Error stack:', callbackError?.stack);
            }
          } else {
            console.warn('⚠ Notification received but value is null/undefined');
            console.warn('  Calling callback with null...');
            try {
              callback(null, null);
            } catch (callbackError) {
              console.error('  ❌ Callback execution failed:', callbackError);
            }
          }
        }
      );

      console.log('✓ Subscription object created');
      console.log('✓ monitorCharacteristicForService called - notifications should be enabled');
      console.log('  Waiting for device to send data...');
      
      return subscription;
    } catch (error) {
      console.error('❌ Error subscribing to characteristic:', error);
      console.error('Error message:', error.message || error);
      console.error('Error stack:', error.stack);
      throw error;
    }
  }

  /**
   * Read RSSI for connected device
   */
  async readRSSI() {
    if (!this.connectedDevice) {
      throw new Error('No device connected');
    }

    try {
      const device = await this.connectedDevice.readRSSI();
      return device.rssi;
    } catch (error) {
      console.error('Error reading RSSI:', error);
      return null;
    }
  }

  /**
   * Cleanup and destroy manager
   */
  destroy() {
    this.stopScanning();
    if (this.connectedDevice) {
      this.disconnectFromDevice();
    }
    if (this.manager) {
      this.manager.destroy();
      this.manager = null;
    }
  }

  /**
   * Convert Buffer to hex string
   */
  static bufferToHex(buffer) {
    if (!buffer) return '';
    return '0x' + Array.from(buffer)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Read analog sensor data from connected device
   * EDI-55 sends data via NOTIFICATIONS in Monitor Mode
   * We'll subscribe briefly, wait for one notification, then unsubscribe
   * @returns {Promise<string>} Base64 encoded sensor data
   */
  async readAnalogData() {
    try {
      if (!this.connectedDevice) {
        throw new Error('No device connected');
      }

      const manager = this._ensureManager();
      // Monitor Mode Service and Characteristic for live sensor reading
      const MONITOR_SERVICE = '00000001-8c26-476f-89a7-a108033a69c7';
      const MONITOR_ANALOG_SENSOR = '0000aa01-8c26-476f-89a7-a108033a69c7';

      console.log('=== Reading Analog Data (via notification) ===');
      console.log('Device ID:', this.connectedDevice.id);
      console.log('Service UUID:', MONITOR_SERVICE);
      console.log('Characteristic UUID:', MONITOR_ANALOG_SENSOR);

      // EDI-55 documentation: "In monitor mode BLE characteristics are sent as notification packet"
      // So we subscribe, wait for one notification, then unsubscribe
      return new Promise((resolve, reject) => {
        let subscription = null;
        const timeout = setTimeout(() => {
          if (subscription) subscription.remove();
          reject(new Error('Timeout waiting for sensor data notification'));
        }, 10000);

        subscription = manager.monitorCharacteristicForDevice(
          this.connectedDevice.id,
          MONITOR_SERVICE,
          MONITOR_ANALOG_SENSOR,
          (error, characteristic) => {
            if (error) {
              clearTimeout(timeout);
              if (subscription) subscription.remove();
              console.error('❌ Notification error:', error.message);
              reject(error);
              return;
            }

            if (characteristic && characteristic.value) {
              clearTimeout(timeout);
              if (subscription) subscription.remove();
              console.log('✅ Received sensor data via notification');
              console.log('Data length (base64):', characteristic.value.length);
              resolve(characteristic.value);
            }
          }
        );
      });
    } catch (error) {
      console.error('❌ Error reading analog data:', error.message);
      
      // Provide more helpful error messages
      if (error.message.includes('Service') || error.message.includes('service')) {
        throw new Error('Monitor Service not found. Ensure device is in Monitor Mode.');
      } else if (error.message.includes('Characteristic') || error.message.includes('characteristic')) {
        throw new Error('Analog sensor characteristic not found on device.');
      } else if (error.message.includes('timeout') || error.message.includes('Timeout')) {
        throw new Error('No sensor data received. Device might not be in Monitor Mode.');
      }
      
      throw error;
    }
  }

  /**
   * Subscribe to analog data notifications
   * @param {Function} callback - Called when new data is received
   * @returns {Object} Subscription object
   */
  async subscribeToAnalogData(callback) {
    try {
      if (!this.connectedDevice) {
        throw new Error('No device connected');
      }

      const manager = this._ensureManager();
      // Monitor Mode Service and Characteristic for live sensor reading
      const MONITOR_SERVICE = '00000001-8c26-476f-89a7-a108033a69c7';
      const MONITOR_ANALOG_SENSOR = '0000aa01-8c26-476f-89a7-a108033a69c7';

      console.log('Subscribing to analog data notifications...');

      // Monitor the characteristic for notifications
      const subscription = manager.monitorCharacteristicForDevice(
        this.connectedDevice.id,
        MONITOR_SERVICE,
        MONITOR_ANALOG_SENSOR,
        (error, characteristic) => {
          if (error) {
            console.error('Analog data notification error:', error);
            callback(null, error);
            return;
          }

          if (characteristic && characteristic.value) {
            console.log('Received analog data notification, length:', characteristic.value.length);
            callback(characteristic.value, null);
          }
        }
      );

      return subscription;
    } catch (error) {
      console.error('Error subscribing to analog data:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from analog data notifications
   * @param {Object} subscription - Subscription object from subscribeToAnalogData
   */
  unsubscribeFromAnalogData(subscription) {
    if (subscription && subscription.remove) {
      subscription.remove();
      console.log('Unsubscribed from analog data');
    }
  }

  /**
   * Convert hex string to Buffer
   */
  static hexToBuffer(hexString) {
    // Remove 0x prefix if present
    const hex = hexString.replace(/^0x/, '');
    
    // Ensure even length
    const paddedHex = hex.length % 2 === 0 ? hex : '0' + hex;
    
    // Convert to buffer
    const bytes = [];
    for (let i = 0; i < paddedHex.length; i += 2) {
      bytes.push(parseInt(paddedHex.substr(i, 2), 16));
    }
    
    return Buffer.from(bytes);
  }

  /**
   * Convert Buffer to UTF-8 string
   */
  static bufferToString(buffer) {
    if (!buffer) return '';
    try {
      return buffer.toString('utf8');
    } catch (error) {
      return '';
    }
  }

  /**
   * Convert string to Buffer
   */
  static stringToBuffer(string) {
    return Buffer.from(string, 'utf8');
  }
}

// Export singleton instance
export default new BLEService();

