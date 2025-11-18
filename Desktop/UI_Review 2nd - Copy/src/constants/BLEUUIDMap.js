/**
 * Complete UUID mapping for EDI-55 BLE device
 * Based on ENC002-EDI55-BLE_DesignDocument.xlsx
 */

// ============================================================================
// SERVICES
// ============================================================================

export const SERVICES = {
  // Standard BLE Services
  GENERIC_ACCESS: {
    uuid: '00001800-0000-1000-8000-00805f9b34fb',
    name: 'Generic Access',
    description: 'Standard BLE Generic Access Service'
  },
  
  GENERIC_ATTRIBUTE: {
    uuid: '00001801-0000-1000-8000-00805f9b34fb',
    name: 'Generic Attribute',
    description: 'Standard BLE Generic Attribute Service'
  },
  
  // Device Information Service (Standard BLE)
  DEVICE_INFO: {
    uuid: '0000180a-0000-1000-8000-00805f9b34fb',
    name: 'Device Information',
    description: 'Standard device information'
  },
  
  // EDI-55 Custom Services
  MONITOR: {
    uuid: '00000001-8c26-476f-89a7-a108033a69c7',
    name: 'Monitor Mode Service',
    description: 'Real-time sensor monitoring'
  },
  
  DOWNLOAD: {
    uuid: '00000002-8c26-476f-89a7-a108033a69c6',
    name: 'Download Service',
    description: 'Historical data download'
  },
  
  CONFIG: {
    uuid: '00000003-8c26-476f-89a7-a108033a69c5',
    name: 'Config Service',
    description: 'Device configuration and settings'
  },
  
  FIRMWARE: {
    uuid: '00000004-8c26-476f-89a7-a108033a69c4',
    name: 'Firmware Update Service',
    description: 'OTA firmware updates'
  }
};

// ============================================================================
// MONITOR MODE CHARACTERISTICS
// ============================================================================

export const MONITOR_CHARACTERISTICS = {
  // Analog Sensor (48 bytes = 12 floats)
  ANALOG_SENSOR: {
    uuid: '0000aa01-8c26-476f-89a7-a108033a69c7',
    name: 'Analog Sensor Data',
    description: '12 sensor readings (48 bytes)',
    properties: ['NOTIFY'],
    format: '12 × 4-byte floats',
    sensors: [
      '1) Load Cell Output',
      '2) Potentiometric',
      '3) Voltage Output',
      '4) Tilt Meter Output (EL)',
      '5) Tilt Temp (EL)',
      '6) Tilt Meter Output 1 (MEMS)',
      '7) Tilt Meter Output 2 (MEMS)',
      '8) 4-20mA Output',
      '9) VW Output (Frequency)',
      '10) VW Temperature',
      '11) Temperature (Thermistor)',
      '12) Temperature (RTD)'
    ]
  },
  
  // SDI Sensor
  SDI_SENSOR: {
    uuid: '0000aa03-8c26-476f-89a7-a108033a69c7',
    name: 'SDI Sensor Data',
    description: 'SDI-12 sensor readings',
    properties: ['NOTIFY'],
    format: '1 byte sensor type + 1 byte reserved + 4 byte float'
  }
};

// Modbus Sensors (0xBB00 to 0xBB1F = 32 sensors)
for (let i = 0; i < 32; i++) {
  const hexNum = (0xBB00 + i).toString(16).toUpperCase();
  MONITOR_CHARACTERISTICS[`MODBUS_SENSOR_${i + 1}`] = {
    uuid: `0000${hexNum.toLowerCase()}-8c26-476f-89a7-a108033a69c7`,
    name: `Modbus Sensor ${i + 1}`,
    description: `Modbus sensor ${i + 1} parameters (up to 10)`,
    properties: ['NOTIFY'],
    format: '1 byte sensor index + 1 byte slave addr + 1 byte param count + up to 10 × 4-byte floats'
  };
}

// ============================================================================
// DOWNLOAD CHARACTERISTICS
// ============================================================================

export const DOWNLOAD_CHARACTERISTICS = {
  DOWNLOAD_DATA: {
    uuid: '0000aa02-8c26-476f-89a7-a108033a69c6',
    name: 'Download Data',
    description: 'Historical sensor data (512 byte frames)',
    properties: ['READ', 'NOTIFY'],
    format: '2 byte UUID + 4 byte frame size + 1 byte new log flag + 6 byte timestamp + sensor data'
  }
};

// ============================================================================
// CONFIG CHARACTERISTICS
// ============================================================================

export const CONFIG_CHARACTERISTICS = {
  // Analog Sensor Generic Configuration
  ANA_GENERIC: {
    uuid: '0000aa00-8c26-476f-89a7-a108033a69c5',
    name: 'Analog Generic Config',
    description: 'Generic analog sensor configuration (site name, sensor enable flags)',
    properties: ['READ', 'WRITE']
  },
  
  // Analog Sensor Type-Specific Configurations (indexed by sensor type)
  // Sensor type 0-8 map to these UUIDs
  ANA_SENSORS: {
    0: '0000aa01-8c26-476f-89a7-a108033a69c5', // Load Cell
    1: '0000aa02-8c26-476f-89a7-a108033a69c5', // Potentiometric
    2: '0000aa03-8c26-476f-89a7-a108033a69c5', // Voltage Output
    3: '0000aa04-8c26-476f-89a7-a108033a69c5', // EL Tiltmeter
    4: '0000aa05-8c26-476f-89a7-a108033a69c5', // MEMS Tiltmeter
    5: '0000aa06-8c26-476f-89a7-a108033a69c5', // 4-20mA
    6: '0000aa07-8c26-476f-89a7-a108033a69c5', // VW Frequency
    7: '0000aa08-8c26-476f-89a7-a108033a69c5', // Thermistor
    8: '0000aa09-8c26-476f-89a7-a108033a69c5', // RTD
  },
  
  // System Setup
  SYSTEM_SETUP: {
    uuid: '0000aabb-8c26-476f-89a7-a108033a69c5',
    name: 'System Setup',
    description: 'Device name, Site ID, scan interval, etc.',
    properties: ['READ', 'WRITE']
  },
  
  SENSOR_CONFIG: {
    uuid: '0000aab1-8c26-476f-89a7-a108033a69c5',
    name: 'Sensor Config',
    description: 'Analog sensor configuration',
    properties: ['READ', 'WRITE']
  },
  
  MODBUS_CLUSTER_CONFIG: {
    uuid: '0000aab2-8c26-476f-89a7-a108033a69c5',
    name: 'Modbus Cluster Config',
    description: 'Modbus sensors configuration',
    properties: ['READ', 'WRITE']
  },
  
  INDICATOR_ID: {
    uuid: '0000aab3-8c26-476f-89a7-a108033a69c5',
    name: 'Indicator ID',
    description: 'Device indicator settings',
    properties: ['READ', 'WRITE']
  },
  
  SCAN_CONFIG: {
    uuid: '0000aac1-8c26-476f-89a7-a108033a69c5',
    name: 'Scan Config',
    description: 'Scanning interval and start time',
    properties: ['READ', 'WRITE']
  },
  
  SCAN_CONTROL: {
    uuid: '0000aac2-8c26-476f-89a7-a108033a69c5',
    name: 'Scan Control',
    description: 'Start/Stop scanning, erase memory',
    properties: ['READ', 'WRITE']
  },
  
  READING_AVG: {
    uuid: '0000aacc-8c26-476f-89a7-a108033a69c5',
    name: 'Reading Average',
    description: 'Number of readings to average',
    properties: ['READ', 'WRITE']
  },
  
  // Battery Characteristics
  BATTERY_PARAMS: {
    uuid: '0000aad1-8c26-476f-89a7-a108033a69c5',
    name: 'Battery Parameters',
    description: 'Voltage, level, health, charging status, calibration factor',
    properties: ['READ'],
    format: '4 byte voltage + 1 byte level + 1 byte health + 1 byte charging + 4 byte calibration'
  },
  
  BATTERY_CHANGED: {
    uuid: '0000aad2-8c26-476f-89a7-a108033a69c5',
    name: 'Battery Changed',
    description: 'Battery replacement status',
    properties: ['READ', 'WRITE'],
    format: '1 byte bool (0 = not changed, 1 = changed)'
  },
  
  CHARGER_CONNECTED: {
    uuid: '0000aad3-8c26-476f-89a7-a108033a69c5',
    name: 'Charger Last Connected',
    description: 'Last time charger was connected',
    properties: ['READ'],
    format: '6 bytes: year + month + date + hours + minutes + seconds'
  },
  
  BATTERY_FULL_CHARGE: {
    uuid: '0000aad4-8c26-476f-89a7-a108033a69c5',
    name: 'Battery Last Full Charge',
    description: 'Last time battery was fully charged',
    properties: ['READ'],
    format: '6 bytes: year + month + date + hours + minutes + seconds'
  }
};

// Modbus Config Characteristics (0xAA21 to 0xAA3F)
for (let i = 0; i < 31; i++) {
  const hexNum = (0xAA21 + i).toString(16).toUpperCase();
  CONFIG_CHARACTERISTICS[`MODBUS_SENSOR_${i + 1}_CONFIG`] = {
    uuid: `0000${hexNum.toLowerCase()}-8c26-476f-89a7-a108033a69c5`,
    name: `Modbus Sensor ${i + 1} Config`,
    description: `Configuration for Modbus sensor ${i + 1}`,
    properties: ['READ', 'WRITE']
  };
}

// ============================================================================
// VERIFY CONFIG CHARACTERISTICS
// ============================================================================

export const VERIFY_CHARACTERISTICS = {
  VERIFY_SYSTEM: {
    uuid: '0000aa00-8c26-476f-89a7-a108033a69c5',
    name: 'Verify System Setup',
    description: 'Read back system configuration',
    properties: ['READ']
  },
  
  VERIFY_SENSOR: {
    uuid: '0000aa04-8c26-476f-89a7-a108033a69c5',
    name: 'Verify Sensor Config',
    description: 'Read back sensor configuration',
    properties: ['READ']
  },
  
  // Add other verify characteristics (0xAA05 - 0xAA11)
  ...Array.from({ length: 14 }, (_, i) => {
    const hexNum = (0xAA04 + i).toString(16).toUpperCase();
    return {
      [`VERIFY_${i + 1}`]: {
        uuid: `0000${hexNum.toLowerCase()}-8c26-476f-89a7-a108033a69c5`,
        name: `Verify Config ${i + 1}`,
        description: `Verification characteristic ${i + 1}`,
        properties: ['READ']
      }
    };
  }).reduce((acc, obj) => ({ ...acc, ...obj }), {})
};

// ============================================================================
// STANDARD BLE CHARACTERISTICS
// ============================================================================

export const GENERIC_ACCESS_CHARACTERISTICS = {
  DEVICE_NAME: {
    uuid: '00002a00-0000-1000-8000-00805f9b34fb',
    name: 'Device Name',
    description: 'Name of the device',
    properties: ['READ', 'WRITE']
  },
  
  APPEARANCE: {
    uuid: '00002a01-0000-1000-8000-00805f9b34fb',
    name: 'Appearance',
    description: 'External appearance of device',
    properties: ['READ']
  }
};

export const GENERIC_ATTRIBUTE_CHARACTERISTICS = {
  SERVICE_CHANGED: {
    uuid: '00002a05-0000-1000-8000-00805f9b34fb',
    name: 'Service Changed',
    description: 'Indicates service changes',
    properties: ['INDICATE']
  }
};

export const DEVICE_INFO_CHARACTERISTICS = {
  MANUFACTURER: {
    uuid: '00002a29-0000-1000-8000-00805f9b34fb',
    name: 'Manufacturer Name',
    description: 'Manufacturer name string',
    properties: ['READ']
  },
  
  MODEL_NUMBER: {
    uuid: '00002a24-0000-1000-8000-00805f9b34fb',
    name: 'Model Number',
    description: 'Model number string',
    properties: ['READ']
  },
  
  SERIAL_NUMBER: {
    uuid: '00002a25-0000-1000-8000-00805f9b34fb',
    name: 'Serial Number',
    description: 'Serial number string',
    properties: ['READ']
  },
  
  HARDWARE_REV: {
    uuid: '00002a27-0000-1000-8000-00805f9b34fb',
    name: 'Hardware Revision',
    description: 'Hardware revision string',
    properties: ['READ']
  },
  
  FIRMWARE_REV: {
    uuid: '00002a26-0000-1000-8000-00805f9b34fb',
    name: 'Firmware Version',
    description: 'Firmware version string (e.g., "01.00.00")',
    properties: ['READ']
  },
  
  FIRMWARE_DATE: {
    uuid: '00002a30-0000-1000-8000-00805f9b34fb',
    name: 'Firmware Revision Date',
    description: 'Firmware date string (e.g., "2023/03/08")',
    properties: ['READ']
  },
  
  CALIBRATION_DATE: {
    uuid: '00002a31-0000-1000-8000-00805f9b34fb',
    name: 'Calibration Date',
    description: 'Calibration date string (e.g., "2023/03/08")',
    properties: ['READ']
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get characteristic name from UUID
 */
export function getCharacteristicName(uuid) {
  if (!uuid || typeof uuid !== 'string') {
    return null;
  }
  
  const normalizedUUID = uuid.toLowerCase();
  
  // Check all characteristic collections
  const collections = [
    GENERIC_ACCESS_CHARACTERISTICS,
    GENERIC_ATTRIBUTE_CHARACTERISTICS,
    DEVICE_INFO_CHARACTERISTICS,
    MONITOR_CHARACTERISTICS,
    DOWNLOAD_CHARACTERISTICS,
    CONFIG_CHARACTERISTICS,
    VERIFY_CHARACTERISTICS
  ];
  
  for (const collection of collections) {
    for (const char of Object.values(collection)) {
      if (char && char.uuid && typeof char.uuid === 'string' && char.uuid.toLowerCase() === normalizedUUID) {
        return char.name;
      }
    }
  }
  
  return null;
}

/**
 * Get characteristic description from UUID
 */
export function getCharacteristicDescription(uuid) {
  if (!uuid || typeof uuid !== 'string') {
    return '';
  }
  
  const normalizedUUID = uuid.toLowerCase();
  
  const collections = [
    GENERIC_ACCESS_CHARACTERISTICS,
    GENERIC_ATTRIBUTE_CHARACTERISTICS,
    DEVICE_INFO_CHARACTERISTICS,
    MONITOR_CHARACTERISTICS,
    DOWNLOAD_CHARACTERISTICS,
    CONFIG_CHARACTERISTICS,
    VERIFY_CHARACTERISTICS
  ];
  
  for (const collection of collections) {
    for (const char of Object.values(collection)) {
      if (char && char.uuid && typeof char.uuid === 'string' && char.uuid.toLowerCase() === normalizedUUID) {
        return char.description || '';
      }
    }
  }
  
  return '';
}

/**
 * Get service name from UUID
 */
export function getServiceName(uuid) {
  if (!uuid || typeof uuid !== 'string') {
    return null;
  }
  
  const normalizedUUID = uuid.toLowerCase();
  
  for (const service of Object.values(SERVICES)) {
    if (service && service.uuid && typeof service.uuid === 'string' && service.uuid.toLowerCase() === normalizedUUID) {
      return service.name;
    }
  }
  
  return null;
}

/**
 * Get service description from UUID
 */
export function getServiceDescription(uuid) {
  if (!uuid || typeof uuid !== 'string') {
    return '';
  }
  
  const normalizedUUID = uuid.toLowerCase();
  
  for (const service of Object.values(SERVICES)) {
    if (service && service.uuid && typeof service.uuid === 'string' && service.uuid.toLowerCase() === normalizedUUID) {
      return service.description || '';
    }
  }
  
  return '';
}

/**
 * Format data based on characteristic type
 */
export function formatCharacteristicValue(uuid, base64Value) {
  // This will be implemented to parse specific characteristic formats
  // For now, return null and let the diagnostic tool handle it
  return null;
}

