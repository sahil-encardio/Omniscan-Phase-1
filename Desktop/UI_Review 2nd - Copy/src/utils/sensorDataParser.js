import { Buffer } from 'buffer';
import {
  SENSOR_TYPES,
  SENSOR_TYPE_NAMES,
  SENSOR_UNITS,
  SENSOR_COLORS,
  SENSOR_ICONS,
  SENSOR_OFFSETS,
  MONITOR_DATA_SIZE,
} from '../constants/BLEConstants';
import { createSensorReading } from '../types/SensorTypes';

/**
 * Parse analog sensor data from base64 encoded value
 * This matches the exact implementation from TakeReadingActivity.java
 * 
 * The Monitor Analog Sensor characteristic returns 48 bytes (12 floats)
 * Each float is at position: offset * 4 bytes
 * 
 * @param {string} base64Value - Base64 encoded byte array from BLE characteristic
 * @returns {Array} Array of SensorReading objects
 */
export const parseAnalogFrame = (base64Value) => {
  try {
    if (!base64Value) {
      console.warn('No data received from analog sensor');
      return [];
    }

    // Decode base64 to buffer
    const buffer = Buffer.from(base64Value, 'base64');
    
    console.log('📊 Parsing analog data...');
    console.log('Buffer length:', buffer.length, 'bytes');
    console.log('Buffer hex:', buffer.toString('hex'));

    // According to EDI-55 documentation:
    // Monitor Mode sends: 2-byte header + (12 × 4-byte floats) = 50 bytes total
    // OR sometimes just 48 bytes (12 floats directly)
    
    let startOffset = 0;
    let expectedLength = MONITOR_DATA_SIZE; // 48
    
    if (buffer.length === 50) {
      // Has 2-byte header, skip it
      startOffset = 2;
      console.log('📦 Detected 2-byte header, skipping to float data at offset 2');
    } else if (buffer.length === 48) {
      // No header, start directly
      startOffset = 0;
      console.log('📦 No header detected, reading floats from offset 0');
    } else {
      console.error(`❌ Invalid data length: ${buffer.length} bytes (expected 48 or 50)`);
      // Try to parse anyway
      startOffset = 0;
    }

    // Parse ALL 12 floats from the buffer (matching TakeReadingActivity.java line 397-406)
    const floatArray = [];
    for (let i = 0; i < 12; i++) {
      // Read 4 bytes as float, little-endian, at position: startOffset + (i * 4)
      const bytePosition = startOffset + (i * 4);
      if (bytePosition + 4 <= buffer.length) {
        floatArray[i] = buffer.readFloatLE(bytePosition);
      } else {
        floatArray[i] = 0;
        console.warn(`⚠️ Not enough bytes for float at position ${i}`);
      }
    }

    console.log('📈 All 12 float values:', floatArray);

    const sensorReadings = [];

    // Parse Load Cell (offset 0)
    if (isValidSensorValue(floatArray[SENSOR_OFFSETS.LOAD_CELL_OFFSET])) {
      sensorReadings.push(
        createSensorReading({
          sensorId: SENSOR_OFFSETS.LOAD_CELL_OFFSET,
          sensorType: SENSOR_TYPES.LOAD_CELL,
          sensorTypeName: SENSOR_TYPE_NAMES[SENSOR_TYPES.LOAD_CELL],
          value: floatArray[SENSOR_OFFSETS.LOAD_CELL_OFFSET],
          units: SENSOR_UNITS[SENSOR_TYPES.LOAD_CELL],
          color: SENSOR_COLORS[SENSOR_TYPES.LOAD_CELL],
          icon: SENSOR_ICONS[SENSOR_TYPES.LOAD_CELL],
        })
      );
    }

    // Parse Potentiometric (offset 1)
    if (isValidSensorValue(floatArray[SENSOR_OFFSETS.POTENTIOMETRIC_OFFSET])) {
      sensorReadings.push(
        createSensorReading({
          sensorId: SENSOR_OFFSETS.POTENTIOMETRIC_OFFSET,
          sensorType: SENSOR_TYPES.POTENTIOMETRIC,
          sensorTypeName: SENSOR_TYPE_NAMES[SENSOR_TYPES.POTENTIOMETRIC],
          value: floatArray[SENSOR_OFFSETS.POTENTIOMETRIC_OFFSET],
          units: SENSOR_UNITS[SENSOR_TYPES.POTENTIOMETRIC],
          color: SENSOR_COLORS[SENSOR_TYPES.POTENTIOMETRIC],
          icon: SENSOR_ICONS[SENSOR_TYPES.POTENTIOMETRIC],
        })
      );
    }

    // Parse Voltage Output (offset 2)
    if (isValidSensorValue(floatArray[SENSOR_OFFSETS.VTG_OUTPUT_OFFSET])) {
      sensorReadings.push(
        createSensorReading({
          sensorId: SENSOR_OFFSETS.VTG_OUTPUT_OFFSET,
          sensorType: SENSOR_TYPES.VTG_OUTPUT,
          sensorTypeName: SENSOR_TYPE_NAMES[SENSOR_TYPES.VTG_OUTPUT],
          value: floatArray[SENSOR_OFFSETS.VTG_OUTPUT_OFFSET],
          units: SENSOR_UNITS[SENSOR_TYPES.VTG_OUTPUT],
          color: SENSOR_COLORS[SENSOR_TYPES.VTG_OUTPUT],
          icon: SENSOR_ICONS[SENSOR_TYPES.VTG_OUTPUT],
        })
      );
    }

    // Parse EL Tiltmeter (offset 3 for tilt, offset 4 for temp)
    const elTiltValue = floatArray[SENSOR_OFFSETS.EL_TILT_OFFSET];
    const elTiltTemp = floatArray[SENSOR_OFFSETS.EL_TILT_TEMP_OFFSET];
    if (isValidSensorValue(elTiltValue)) {
      sensorReadings.push(
        createSensorReading({
          sensorId: SENSOR_OFFSETS.EL_TILT_OFFSET,
          sensorType: SENSOR_TYPES.EL_TILTMETER,
          sensorTypeName: SENSOR_TYPE_NAMES[SENSOR_TYPES.EL_TILTMETER],
          value: elTiltValue,
          units: SENSOR_UNITS[SENSOR_TYPES.EL_TILTMETER],
          temperature: isValidSensorValue(elTiltTemp) ? elTiltTemp : null,
          color: SENSOR_COLORS[SENSOR_TYPES.EL_TILTMETER],
          icon: SENSOR_ICONS[SENSOR_TYPES.EL_TILTMETER],
        })
      );
    }

    // Parse MEMS Tiltmeter (offset 5 & 6 for axes, offset 7 would be temp but it's at ANA_4TO20)
    const memsTilt1 = floatArray[SENSOR_OFFSETS.MEMS_TILT1_OFFSET];
    const memsTilt2 = floatArray[SENSOR_OFFSETS.MEMS_TILT2_OFFSET];
    
    if (isValidSensorValue(memsTilt1)) {
      sensorReadings.push(
        createSensorReading({
          sensorId: SENSOR_OFFSETS.MEMS_TILT1_OFFSET,
          sensorType: SENSOR_TYPES.MEMS_TILTMETER,
          sensorTypeName: `${SENSOR_TYPE_NAMES[SENSOR_TYPES.MEMS_TILTMETER]} X`,
          value: memsTilt1,
          units: SENSOR_UNITS[SENSOR_TYPES.MEMS_TILTMETER],
          color: SENSOR_COLORS[SENSOR_TYPES.MEMS_TILTMETER],
          icon: SENSOR_ICONS[SENSOR_TYPES.MEMS_TILTMETER],
        })
      );
    }

    if (isValidSensorValue(memsTilt2)) {
      sensorReadings.push(
        createSensorReading({
          sensorId: SENSOR_OFFSETS.MEMS_TILT2_OFFSET,
          sensorType: SENSOR_TYPES.MEMS_TILTMETER,
          sensorTypeName: `${SENSOR_TYPE_NAMES[SENSOR_TYPES.MEMS_TILTMETER]} Y`,
          value: memsTilt2,
          units: SENSOR_UNITS[SENSOR_TYPES.MEMS_TILTMETER],
          color: SENSOR_COLORS[SENSOR_TYPES.MEMS_TILTMETER],
          icon: SENSOR_ICONS[SENSOR_TYPES.MEMS_TILTMETER],
        })
      );
    }

    // Parse 4-20mA Sensor (offset 7)
    if (isValidSensorValue(floatArray[SENSOR_OFFSETS.ANA_4TO20_OFFSET])) {
      sensorReadings.push(
        createSensorReading({
          sensorId: SENSOR_OFFSETS.ANA_4TO20_OFFSET,
          sensorType: SENSOR_TYPES.ANA_4_20,
          sensorTypeName: SENSOR_TYPE_NAMES[SENSOR_TYPES.ANA_4_20],
          value: floatArray[SENSOR_OFFSETS.ANA_4TO20_OFFSET],
          units: SENSOR_UNITS[SENSOR_TYPES.ANA_4_20],
          color: SENSOR_COLORS[SENSOR_TYPES.ANA_4_20],
          icon: SENSOR_ICONS[SENSOR_TYPES.ANA_4_20],
        })
      );
    }

    // Parse VW Frequency/Output (offset 8, with temp at offset 9)
    const vwValue = floatArray[SENSOR_OFFSETS.VW_OUTPUT_OFFSET];
    const vwTemp = floatArray[SENSOR_OFFSETS.VW_TEMP_OFFSET];
    if (isValidSensorValue(vwValue)) {
      sensorReadings.push(
        createSensorReading({
          sensorId: SENSOR_OFFSETS.VW_OUTPUT_OFFSET,
          sensorType: SENSOR_TYPES.VW_FREQ,
          sensorTypeName: SENSOR_TYPE_NAMES[SENSOR_TYPES.VW_FREQ],
          value: vwValue,
          units: SENSOR_UNITS[SENSOR_TYPES.VW_FREQ],
          temperature: isValidSensorValue(vwTemp) ? vwTemp : null,
          color: SENSOR_COLORS[SENSOR_TYPES.VW_FREQ],
          icon: SENSOR_ICONS[SENSOR_TYPES.VW_FREQ],
        })
      );
    }

    // Parse Thermistor (offset 10)
    if (isValidSensorValue(floatArray[SENSOR_OFFSETS.THERMISTOR_OFFSET])) {
      sensorReadings.push(
        createSensorReading({
          sensorId: SENSOR_OFFSETS.THERMISTOR_OFFSET,
          sensorType: SENSOR_TYPES.THERMISTOR,
          sensorTypeName: SENSOR_TYPE_NAMES[SENSOR_TYPES.THERMISTOR],
          value: floatArray[SENSOR_OFFSETS.THERMISTOR_OFFSET],
          units: SENSOR_UNITS[SENSOR_TYPES.THERMISTOR],
          color: SENSOR_COLORS[SENSOR_TYPES.THERMISTOR],
          icon: SENSOR_ICONS[SENSOR_TYPES.THERMISTOR],
        })
      );
    }

    // Parse RTD (offset 11)
    if (isValidSensorValue(floatArray[SENSOR_OFFSETS.RTD_OFFSET])) {
      sensorReadings.push(
        createSensorReading({
          sensorId: SENSOR_OFFSETS.RTD_OFFSET,
          sensorType: SENSOR_TYPES.RTD,
          sensorTypeName: SENSOR_TYPE_NAMES[SENSOR_TYPES.RTD],
          value: floatArray[SENSOR_OFFSETS.RTD_OFFSET],
          units: SENSOR_UNITS[SENSOR_TYPES.RTD],
          color: SENSOR_COLORS[SENSOR_TYPES.RTD],
          icon: SENSOR_ICONS[SENSOR_TYPES.RTD],
        })
      );
    }

    console.log(`✅ Parsed ${sensorReadings.length} active sensors`);
    sensorReadings.forEach(s => {
      console.log(`  - ${s.sensorTypeName}: ${s.value} ${s.units}${s.temperature ? ` (Temp: ${s.temperature}°C)` : ''}`);
    });

    return sensorReadings;
  } catch (error) {
    console.error('❌ Error parsing analog data:', error);
    console.error('Stack:', error.stack);
    return [];
  }
};

/**
 * Check if a sensor value is valid (not zero, not NaN, not Infinity)
 * @param {number} value - Sensor value to check
 * @returns {boolean} True if valid
 */
const isValidSensorValue = (value) => {
  return (
    value !== undefined &&
    value !== null &&
    !isNaN(value) &&
    isFinite(value) &&
    Math.abs(value) > 0.0001 // Consider very small values as zero
  );
};

/**
 * Get sensor type name by type code
 * @param {number} typeCode - Sensor type code (0-8)
 * @returns {string} Sensor type name
 */
export const getSensorTypeName = (typeCode) => {
  return SENSOR_TYPE_NAMES[typeCode] || 'Unknown Sensor';
};

/**
 * Get default units for sensor type
 * @param {number} typeCode - Sensor type code (0-8)
 * @returns {string} Default units
 */
export const getSensorUnits = (typeCode) => {
  return SENSOR_UNITS[typeCode] || '';
};

/**
 * Get UI color for sensor type
 * @param {number} typeCode - Sensor type code (0-8)
 * @returns {string} Hex color code
 */
export const getSensorColor = (typeCode) => {
  return SENSOR_COLORS[typeCode] || '#2241DD';
};

/**
 * Get icon name for sensor type
 * @param {number} typeCode - Sensor type code (0-8)
 * @returns {string} Ionicon name
 */
export const getSensorIcon = (typeCode) => {
  return SENSOR_ICONS[typeCode] || 'pulse-outline';
};

/**
 * Format sensor value for display
 * @param {number} value - Raw sensor value
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted value
 */
export const formatSensorValue = (value, decimals = 2) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '--';
  }
  return value.toFixed(decimals);
};
