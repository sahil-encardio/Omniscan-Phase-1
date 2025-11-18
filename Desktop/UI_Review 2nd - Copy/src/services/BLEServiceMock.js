// Mock BLE Service for testing UI without native modules
// Use this while waiting for the native build to complete

const { Buffer } = require('buffer');

class BLEServiceMock {
  constructor() {
    this.manager = null;
    this.connectedDevice = null;
    this.scanSubscription = null;
    this.isScanning = false;
  }

  _ensureManager() {
    console.log('[MOCK BLE] Manager ready');
    return true;
  }

  async initializeBLE() {
    console.log('[MOCK BLE] Initialized');
    return true;
  }

  onStateChange(callback) {
    console.log('[MOCK BLE] State change listener added');
    setTimeout(() => callback('PoweredOn'), 100);
    return { remove: () => console.log('[MOCK BLE] State listener removed') };
  }

  startScanning(onDeviceFound, serviceUUIDs = null) {
    console.log('[MOCK BLE] Starting scan...');
    this.isScanning = true;
    
    // Simulate finding devices
    const mockDevices = [
      {
        id: 'MOCK:AA:BB:CC:DD:EE:01',
        name: 'Mock Sensor Pro',
        rssi: -45,
        serviceUUIDs: ['180F', '180A'],
      },
      {
        id: 'MOCK:AA:BB:CC:DD:EE:02',
        name: 'Test Device',
        rssi: -67,
        serviceUUIDs: ['180D', '181A'],
      },
      {
        id: 'MOCK:AA:BB:CC:DD:EE:03',
        name: 'BLE Logger 001',
        rssi: -52,
        serviceUUIDs: ['180F'],
      },
      {
        id: 'MOCK:AA:BB:CC:DD:EE:04',
        name: 'Unknown Device',
        rssi: -78,
        serviceUUIDs: [],
      },
    ];

    mockDevices.forEach((device, index) => {
      setTimeout(() => {
        if (this.isScanning) {
          onDeviceFound(device);
        }
      }, (index + 1) * 800);
    });
  }

  stopScanning() {
    console.log('[MOCK BLE] Stopping scan');
    this.isScanning = false;
  }

  async connectToDevice(deviceId) {
    console.log('[MOCK BLE] Connecting to:', deviceId);
    return new Promise((resolve) => {
      setTimeout(() => {
        this.connectedDevice = {
          id: deviceId,
          name: deviceId.includes('Sensor') ? 'Mock Sensor Pro' : 'Mock Device',
          discoverAllServicesAndCharacteristics: async () => {
            console.log('[MOCK BLE] Discovering services...');
          },
        };
        resolve(this.connectedDevice);
      }, 1500);
    });
  }

  async disconnectFromDevice() {
    console.log('[MOCK BLE] Disconnecting');
    this.connectedDevice = null;
  }

  onDeviceDisconnected(deviceId, callback) {
    console.log('[MOCK BLE] Disconnect listener added for:', deviceId);
    return { remove: () => console.log('[MOCK BLE] Disconnect listener removed') };
  }

  async getServices() {
    console.log('[MOCK BLE] Getting services...');
    return [
      {
        uuid: '180F',
        characteristics: [
          {
            uuid: '2A19',
            serviceUUID: '180F',
            isReadable: true,
            isWritableWithResponse: false,
            isWritableWithoutResponse: false,
            isNotifiable: true,
            isIndicatable: false,
            value: null,
          },
        ],
      },
      {
        uuid: '180A',
        characteristics: [
          {
            uuid: '2A29',
            serviceUUID: '180A',
            isReadable: true,
            isWritableWithResponse: false,
            isWritableWithoutResponse: false,
            isNotifiable: false,
            isIndicatable: false,
            value: null,
          },
          {
            uuid: '2A24',
            serviceUUID: '180A',
            isReadable: true,
            isWritableWithResponse: false,
            isWritableWithoutResponse: false,
            isNotifiable: false,
            isIndicatable: false,
            value: null,
          },
        ],
      },
      {
        uuid: 'CUSTOM-001',
        characteristics: [
          {
            uuid: 'CUSTOM-CHAR-001',
            serviceUUID: 'CUSTOM-001',
            isReadable: true,
            isWritableWithResponse: true,
            isWritableWithoutResponse: false,
            isNotifiable: true,
            isIndicatable: false,
            value: null,
          },
        ],
      },
    ];
  }

  async readCharacteristic(serviceUUID, characteristicUUID) {
    console.log('[MOCK BLE] Reading characteristic:', characteristicUUID);
    
    // Simulate different responses based on characteristic
    let mockValue;
    if (characteristicUUID === '2A19') {
      // Battery level
      mockValue = Buffer.from([85]); // 85%
    } else if (characteristicUUID === '2A29') {
      // Manufacturer name
      mockValue = Buffer.from('NexaWave Industries');
    } else if (characteristicUUID === '2A24') {
      // Model number
      mockValue = Buffer.from('NS-PRO-2024');
    } else {
      // Random data
      mockValue = Buffer.from('Hello from BLE!');
    }
    
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockValue), 500);
    });
  }

  async writeCharacteristic(serviceUUID, characteristicUUID, value, withResponse = true) {
    console.log('[MOCK BLE] Writing characteristic:', characteristicUUID);
    console.log('[MOCK BLE] Value:', value);
    return new Promise((resolve) => {
      setTimeout(() => resolve(), 500);
    });
  }

  async subscribeToCharacteristic(serviceUUID, characteristicUUID, callback) {
    console.log('[MOCK BLE] Subscribing to characteristic:', characteristicUUID);
    
    // Simulate notifications every 2 seconds
    const interval = setInterval(() => {
      if (characteristicUUID === '2A19') {
        // Battery level changing
        const batteryLevel = 70 + Math.floor(Math.random() * 20);
        callback(null, Buffer.from([batteryLevel]));
      } else {
        // Random temperature data
        const temp = (20 + Math.random() * 10).toFixed(1);
        callback(null, Buffer.from(temp));
      }
    }, 2000);

    return {
      remove: () => {
        console.log('[MOCK BLE] Unsubscribing from:', characteristicUUID);
        clearInterval(interval);
      },
    };
  }

  async readRSSI() {
    // Simulate RSSI changing
    const baseRSSI = -50;
    const variation = Math.floor(Math.random() * 20);
    return baseRSSI - variation;
  }

  destroy() {
    console.log('[MOCK BLE] Destroying service');
    this.stopScanning();
    this.connectedDevice = null;
  }

  static bufferToHex(buffer) {
    if (!buffer) return '';
    return '0x' + Array.from(buffer)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  static hexToBuffer(hexString) {
    const hex = hexString.replace(/^0x/, '');
    const paddedHex = hex.length % 2 === 0 ? hex : '0' + hex;
    const bytes = [];
    for (let i = 0; i < paddedHex.length; i += 2) {
      bytes.push(parseInt(paddedHex.substr(i, 2), 16));
    }
    return Buffer.from(bytes);
  }

  static bufferToString(buffer) {
    if (!buffer) return '';
    try {
      return buffer.toString('utf8');
    } catch (error) {
      return '';
    }
  }

  static stringToBuffer(string) {
    return Buffer.from(string, 'utf8');
  }
}

export default new BLEServiceMock();


