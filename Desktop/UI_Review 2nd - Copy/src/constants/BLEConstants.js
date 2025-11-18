// BLE Service and Characteristic UUIDs for EDI-55 Device
// Monitor Mode (for live/real-time sensor reading)
export const MONITOR_SERVICE = '00000001-8c26-476f-89a7-a108033a69c7';
export const MONITOR_ANALOG_SENSOR = '0000aa01-8c26-476f-89a7-a108033a69c7';

// Config Service (for configuration)
export const CONFIG_SERVICE = '00000003-8c26-476f-89a7-a108033a69c5';

// Download Service (for historical data - not used currently)
export const DOWNLOAD_SERVICE = '00000002-8c26-476f-89a7-a108033a69c6';
export const DOWNLOAD_DATA_ANALOG_CHAR = '0000aa01-8c26-476f-89a7-a108033a69c6';

// Analog Sensor Types (matching ConstantVariables.java exactly)
export const SENSOR_TYPES = {
  LOAD_CELL: 0,
  POTENTIOMETRIC: 1,
  VTG_OUTPUT: 2,
  EL_TILTMETER: 3,
  MEMS_TILTMETER: 4,
  ANA_4_20: 5,
  VW_FREQ: 6,          // Note: VW_FREQ type (6) but VW_OUTPUT_OFFSET (8)
  THERMISTOR: 7,
  RTD: 8,
};

// Sensor Type Names
export const SENSOR_TYPE_NAMES = {
  [SENSOR_TYPES.LOAD_CELL]: 'Load Cell',
  [SENSOR_TYPES.POTENTIOMETRIC]: 'Potentiometric',
  [SENSOR_TYPES.VTG_OUTPUT]: 'Voltage Output',
  [SENSOR_TYPES.EL_TILTMETER]: 'EL Tiltmeter',
  [SENSOR_TYPES.MEMS_TILTMETER]: 'MEMS Tiltmeter',
  [SENSOR_TYPES.ANA_4_20]: '4-20mA Sensor',
  [SENSOR_TYPES.VW_FREQ]: 'VW Frequency',
  [SENSOR_TYPES.THERMISTOR]: 'Thermistor',
  [SENSOR_TYPES.RTD]: 'RTD',
};

// Byte offsets in the analog data frame (matching ConstantVariables.java exactly)
export const SENSOR_OFFSETS = {
  LOAD_CELL_OFFSET: 0,
  POTENTIOMETRIC_OFFSET: 1,
  VTG_OUTPUT_OFFSET: 2,
  EL_TILT_OFFSET: 3,
  EL_TILT_TEMP_OFFSET: 4,
  MEMS_TILT1_OFFSET: 5,
  MEMS_TILT2_OFFSET: 6,
  ANA_4TO20_OFFSET: 7,        // Was at wrong position!
  VW_OUTPUT_OFFSET: 8,         // Renamed from VW_FREQ_OFFSET
  VW_TEMP_OFFSET: 9,
  THERMISTOR_OFFSET: 10,
  RTD_OFFSET: 11,
};

// Default units for sensor types
export const SENSOR_UNITS = {
  [SENSOR_TYPES.LOAD_CELL]: 'kN',
  [SENSOR_TYPES.POTENTIOMETRIC]: 'mm',
  [SENSOR_TYPES.VTG_OUTPUT]: 'V',
  [SENSOR_TYPES.EL_TILTMETER]: '°',
  [SENSOR_TYPES.MEMS_TILTMETER]: '°',
  [SENSOR_TYPES.ANA_4_20]: 'mA',
  [SENSOR_TYPES.VW_FREQ]: 'Hz',
  [SENSOR_TYPES.THERMISTOR]: '°C',
  [SENSOR_TYPES.RTD]: '°C',
};

// UI colors for sensor types
export const SENSOR_COLORS = {
  [SENSOR_TYPES.LOAD_CELL]: '#2241DD',
  [SENSOR_TYPES.POTENTIOMETRIC]: '#2241DD',
  [SENSOR_TYPES.VTG_OUTPUT]: '#2241DD',
  [SENSOR_TYPES.EL_TILTMETER]: '#8B5CF6',
  [SENSOR_TYPES.MEMS_TILTMETER]: '#8B5CF6',
  [SENSOR_TYPES.ANA_4_20]: '#2241DD',
  [SENSOR_TYPES.VW_FREQ]: '#10B981',
  [SENSOR_TYPES.THERMISTOR]: '#F59E0B',
  [SENSOR_TYPES.RTD]: '#F59E0B',
};

// Icons for sensor types (Ionicons)
export const SENSOR_ICONS = {
  [SENSOR_TYPES.LOAD_CELL]: 'barbell-outline',
  [SENSOR_TYPES.POTENTIOMETRIC]: 'analytics-outline',
  [SENSOR_TYPES.VTG_OUTPUT]: 'flash-outline',
  [SENSOR_TYPES.EL_TILTMETER]: 'phone-portrait-outline',
  [SENSOR_TYPES.MEMS_TILTMETER]: 'phone-portrait-outline',
  [SENSOR_TYPES.ANA_4_20]: 'pulse-outline',
  [SENSOR_TYPES.VW_FREQ]: 'radio-outline',
  [SENSOR_TYPES.THERMISTOR]: 'thermometer-outline',
  [SENSOR_TYPES.RTD]: 'thermometer-outline',
};

// Maximum number of sensors supported
export const MAX_SENSORS = 12;

// Expected data size from Monitor Analog Sensor characteristic
export const MONITOR_DATA_SIZE = 48; // 12 floats × 4 bytes each

// Monitoring interval (milliseconds)
export const MONITORING_INTERVAL = 3000; // 3 seconds

