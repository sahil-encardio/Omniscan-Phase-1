import { SENSOR_TYPES, SENSOR_TYPE_NAMES, SENSOR_OFFSETS, SENSOR_UNITS } from './BLEConstants';

// Default site name for port-based sensor configuration
export const DEFAULT_SITE_NAME = 'Default Site';

// Port to reading offset mapping for default site
// Port 1 -> Offset 0, Port 2 -> Offset 1, Port 3 -> Offset 2
export const DEFAULT_SITE_PORT_OFFSETS = {
  1: 0,  // Port 1 maps to offset 0 (Load Cell position)
  2: 1,  // Port 2 maps to offset 1 (Potentiometric position)
  3: 2,  // Port 3 maps to offset 2 (Voltage Output position)
};

// Re-export sensor types for convenience
export { SENSOR_TYPES };

// Sensor type labels (for UI display)
export const SENSOR_TYPE_LABELS = {
  [SENSOR_TYPES.LOAD_CELL]: 'Load Cell',
  [SENSOR_TYPES.POTENTIOMETRIC]: 'Potentiometric',
  [SENSOR_TYPES.VTG_OUTPUT]: 'Voltage Output',
  [SENSOR_TYPES.EL_TILTMETER]: 'EL Tiltmeter',
  [SENSOR_TYPES.MEMS_TILTMETER]: 'MEMS Tiltmeter',
  [SENSOR_TYPES.ANA_4_20]: '4-20mA',
  [SENSOR_TYPES.VW_FREQ]: 'VW Frequency',
  [SENSOR_TYPES.THERMISTOR]: 'Thermistor',
  [SENSOR_TYPES.RTD]: 'RTD',
};

// Reading offsets (matching SENSOR_OFFSETS but with cleaner names)
export const READING_OFFSETS = {
  LOAD_CELL: SENSOR_OFFSETS.LOAD_CELL_OFFSET,
  POTENTIOMETRIC: SENSOR_OFFSETS.POTENTIOMETRIC_OFFSET,
  VTG_OUTPUT: SENSOR_OFFSETS.VTG_OUTPUT_OFFSET,
  EL_TILT: SENSOR_OFFSETS.EL_TILT_OFFSET,
  EL_TILT_TEMP: SENSOR_OFFSETS.EL_TILT_TEMP_OFFSET,
  MEMS_TILT1: SENSOR_OFFSETS.MEMS_TILT1_OFFSET,
  MEMS_TILT2: SENSOR_OFFSETS.MEMS_TILT2_OFFSET,
  ANA_4TO20: SENSOR_OFFSETS.ANA_4TO20_OFFSET,
  VW_OUTPUT: SENSOR_OFFSETS.VW_OUTPUT_OFFSET,
  VW_TEMP: SENSOR_OFFSETS.VW_TEMP_OFFSET,
  THERMISTOR: SENSOR_OFFSETS.THERMISTOR_OFFSET,
  RTD: SENSOR_OFFSETS.RTD_OFFSET,
};

// Re-export sensor units
export { SENSOR_UNITS };

// Maximum sensors that can be selected at once
export const MAX_SENSOR_AT_TIME = 3;

// Success messages
export const SUCCESS_MESSAGES = {
  SITE_ADDED: 'Site added successfully',
  SITE_UPDATED: 'Site updated successfully',
  SITE_DELETED: 'Site deleted successfully',
  SENSOR_ADDED: 'Sensor added successfully',
  SENSOR_UPDATED: 'Sensor updated successfully',
  SENSOR_DELETED: 'Sensor deleted successfully',
  READING_SAVED: 'Reading saved successfully',
};

// Validation messages
export const VALIDATION_MESSAGES = {
  SITE_NAME_REQUIRED: 'Site name is required',
  SITE_NAME_EXISTS: 'A site with this name already exists',
  SENSOR_NAME_REQUIRED: 'Sensor name is required',
  SENSOR_NAME_EXISTS: 'A sensor with this name already exists for this site',
  MAX_SENSORS_REACHED: 'Maximum 3 sensors can be selected',
  DUPLICATE_SENSOR_TYPE: 'Cannot select two sensors of the same type',
  DEFAULT_SITE_READING: 'Cannot take reading with default site',
  SENSOR_NOT_SELECTED: 'Please select at least one sensor',
  CANNOT_START_SCAN_WITH_RECORDS: 'Cannot start scan with existing records. Please download or clear records first.',
  STOP_SCAN_FIRST: 'Please stop the scan first',
  NO_RECORDS_AVAILABLE: 'No records available',
};

// System constants (if needed)
export const SYSTEM_CONSTANTS = {
  MAX_SENSOR_AT_TIME: MAX_SENSOR_AT_TIME,
};
