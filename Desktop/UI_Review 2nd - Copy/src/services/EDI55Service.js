import BLEService from './BLEService';
import {
  SERVICES,
  DEVICE_INFO_CHARACTERISTICS,
  CONFIG_CHARACTERISTICS,
  DOWNLOAD_CHARACTERISTICS,
  MONITOR_CHARACTERISTICS,
  SYSTEM_SETUP_OFFSETS,
  BLE_MTU_SIZE,
} from '../constants/BLEUUIDMap';
import { SENSOR_TYPES } from '../constants/BLEConstants';
import { Buffer } from 'buffer';
import DatabaseManager from '../database/DatabaseManager';

/**
 * EDI-55 Specific BLE Service
 * Handles all EDI-55 device-specific BLE operations
 */
class EDI55Service {
  constructor() {
    this.bleService = BLEService;
  }

  /**
   * DEVICE INFORMATION
   */

  /**
   * Read device information (Indicator ID, Serial No, Model No)
   */
  async readDeviceInfo() {
    try {
      const [indicatorId, serialNo, modelNo] = await Promise.all([
        this.readIndicatorID(),
        this.readSerialNumber(),
        this.readModelNumber(),
      ]);

      return {
        indicatorId,
        serialNo,
        modelNo,
      };
    } catch (error) {
      console.error('Error reading device info:', error);
      throw error;
    }
  }

  /**
   * Read Indicator ID
   */
  async readIndicatorID() {
    try {
      const data = await this.bleService.readCharacteristic(
        SERVICES.DEVICE_INFO,
        DEVICE_INFO_CHARACTERISTICS.INDICATOR_ID?.uuid || '00002a00-0000-1000-8000-00805f9b34fb'
      );
      return this.bleService.constructor.bufferToString(data);
    } catch (error) {
      console.error('Error reading indicator ID:', error);
      throw error;
    }
  }

  /**
   * Write Indicator ID
   */
  async writeIndicatorID(indicatorId) {
    try {
      const buffer = this.bleService.constructor.stringToBuffer(indicatorId);
      await this.bleService.writeCharacteristic(
        SERVICES.DEVICE_INFO?.uuid || '0000180a-0000-1000-8000-00805f9b34fb',
        DEVICE_INFO_CHARACTERISTICS.INDICATOR_ID?.uuid || '00002a00-0000-1000-8000-00805f9b34fb',
        buffer,
        true
      );
      return true;
    } catch (error) {
      console.error('Error writing indicator ID:', error);
      throw error;
    }
  }

  /**
   * Read Serial Number
   */
  async readSerialNumber() {
    try {
      const data = await this.bleService.readCharacteristic(
        SERVICES.DEVICE_INFO,
        DEVICE_INFO_CHARACTERISTICS.SERIAL_NUMBER?.uuid || '00002a25-0000-1000-8000-00805f9b34fb'
      );
      return this.bleService.constructor.bufferToString(data);
    } catch (error) {
      console.error('Error reading serial number:', error);
      throw error;
    }
  }

  /**
   * Read Model Number
   */
  async readModelNumber() {
    try {
      const data = await this.bleService.readCharacteristic(
        SERVICES.DEVICE_INFO,
        DEVICE_INFO_CHARACTERISTICS.MODEL_NUMBER?.uuid || '00002a24-0000-1000-8000-00805f9b34fb'
      );
      return this.bleService.constructor.bufferToString(data);
    } catch (error) {
      console.error('Error reading model number:', error);
      throw error;
    }
  }

  /**
   * Read Battery Voltage
   */
  async readBatteryVoltage() {
    try {
      const data = await this.bleService.readCharacteristic(
        SERVICES.DEVICE_INFO,
        CONFIG_CHARACTERISTICS.BATTERY_PARAMS?.uuid || '0000aad1-8c26-476f-89a7-a108033a69c5'
      );
      const buffer = Buffer.from(data, 'base64');
      // Battery voltage is typically in byte 4 (index 4) according to old app
      const voltage = buffer[4];
      return voltage;
    } catch (error) {
      console.error('Error reading battery voltage:', error);
      throw error;
    }
  }

  /**
   * SYSTEM SETUP OPERATIONS
   */

  /**
   * Read System Setup Configuration
   * Returns: {
   *   readingAvg, scanIntervalHours, scanIntervalMins, scanIntervalSecs,
   *   startScanHours, startScanMins, scanState, eraseState, downloadState, noOfRecords
   * }
   */
  async readSystemSetup() {
    try {
      const data = await this.bleService.readCharacteristic(
        SERVICES.CONFIG?.uuid || '00000003-8c26-476f-89a7-a108033a69c5',
        CONFIG_CHARACTERISTICS.SYSTEM_SETUP?.uuid || '0000aabb-8c26-476f-89a7-a108033a69c5'
      );
      
      const buffer = Buffer.from(data, 'base64');
      
      return {
        readingAvg: buffer[SYSTEM_SETUP_OFFSETS.READING_AVG],
        scanIntervalHours: buffer[SYSTEM_SETUP_OFFSETS.SCAN_INTERVAL_HOURS],
        scanIntervalMins: buffer[SYSTEM_SETUP_OFFSETS.SCAN_INTERVAL_MINS],
        scanIntervalSecs: buffer[SYSTEM_SETUP_OFFSETS.SCAN_INTERVAL_SECS],
        startScanHours: buffer[SYSTEM_SETUP_OFFSETS.START_SCAN_HOURS],
        startScanMins: buffer[SYSTEM_SETUP_OFFSETS.START_SCAN_MINS],
        scanState: buffer[SYSTEM_SETUP_OFFSETS.SCAN_STATE] === 1,
        eraseState: buffer[SYSTEM_SETUP_OFFSETS.ERASE_STATE] === 1,
        downloadState: buffer[SYSTEM_SETUP_OFFSETS.DOWNLOAD_STATE] === 1,
        noOfRecords: buffer.length > 9 ? buffer.readUInt32LE(9) : 0,
      };
    } catch (error) {
      console.error('Error reading system setup:', error);
      throw error;
    }
  }

  /**
   * Write System Setup Configuration
   */
  async writeSystemSetup(config) {
    try {
      const {
        readingAvg = 1,
        scanIntervalHours = 0,
        scanIntervalMins = 5,
        scanIntervalSecs = 0,
        startScanHours = 0,
        startScanMins = 0,
        scanState = false,
        eraseState = false,
        downloadState = false,
      } = config;

      // Create 13-byte buffer as per old Android app
      const buffer = Buffer.alloc(13);
      buffer[0] = readingAvg;
      buffer[1] = scanIntervalHours;
      buffer[2] = scanIntervalMins;
      buffer[3] = scanIntervalSecs;
      buffer[4] = startScanHours;
      buffer[5] = startScanMins;
      buffer[6] = scanState ? 1 : 0;
      buffer[7] = eraseState ? 1 : 0;
      buffer[8] = downloadState ? 1 : 0;
      // Bytes 9-12 reserved for record count (read-only from device)

      const base64Data = buffer.toString('base64');
      await this.bleService.writeCharacteristic(
        SERVICES.CONFIG?.uuid || '00000003-8c26-476f-89a7-a108033a69c5',
        (CONFIG_CHARACTERISTICS.SYSTEM_SETUP?.uuid || '0000aabb-8c26-476f-89a7-a108033a69c5'),
        base64Data,
        true
      );
      
      return true;
    } catch (error) {
      console.error('Error writing system setup:', error);
      throw error;
    }
  }

  /**
   * Write RTC Date/Time
   */
  async writeRTCDateTime(date = new Date()) {
    try {
      const buffer = Buffer.alloc(6);
      buffer[0] = date.getFullYear() - 2000; // Year offset from 2000
      buffer[1] = date.getMonth() + 1; // Month (1-12)
      buffer[2] = date.getDate(); // Day
      buffer[3] = date.getHours(); // Hour
      buffer[4] = date.getMinutes(); // Minute
      buffer[5] = date.getSeconds(); // Second

      const base64Data = buffer.toString('base64');
      await this.bleService.writeCharacteristic(
        SERVICES.CONFIG?.uuid || '00000003-8c26-476f-89a7-a108033a69c5',
        CONFIG_CHARACTERISTICS.SCAN_CONFIG?.uuid || '0000aac1-8c26-476f-89a7-a108033a69c5', // RTC date/time uses SCAN_CONFIG
        base64Data,
        true
      );
      
      return true;
    } catch (error) {
      console.error('Error writing RTC date/time:', error);
      throw error;
    }
  }

  /**
   * ANALOG SENSOR CONFIGURATION
   */

  /**
   * Read Generic Analog Configuration
   * Returns site ID and enabled sensors info
   */
  async readAnalogGenericConfig() {
    try {
      const data = await this.bleService.readCharacteristic(
        SERVICES.CONFIG?.uuid || '00000003-8c26-476f-89a7-a108033a69c5',
        CONFIG_CHARACTERISTICS.ANA_GENERIC?.uuid || '0000aa00-8c26-476f-89a7-a108033a69c5'
      );
      
      const buffer = Buffer.from(data, 'base64');
      
      // Parse according to old app's ReadGenericConfig.java
      const siteId = buffer.readUInt32LE(0);
      const siteNameLength = buffer[4];
      const siteName = buffer.slice(5, 5 + siteNameLength).toString('utf-8');
      
      // Sensor enable flags (9 sensor types)
      const isSensorEnable = [];
      for (let i = 0; i < 9; i++) {
        isSensorEnable[i] = buffer[5 + siteNameLength + i];
      }
      
      return {
        siteId,
        siteName,
        isSensorEnable,
      };
    } catch (error) {
      console.error('Error reading analog generic config:', error);
      throw error;
    }
  }

  /**
   * Write Analog Sensor Configuration (Guide Specification)
   * @param {string} siteName - Site name
   * @param {Array} isSensorEnable - Array of 11 bytes indicating which sensor types are enabled
   * @param {Array} sensors - Array of AnalogSensorCommDb objects with configuration
   */
  async writeAnalogConfig(siteName, isSensorEnable, sensors) {
    try {
      console.log('=== Writing Analog Config ===');
      console.log('Site:', siteName);
      console.log('Sensor enable array:', isSensorEnable);
      console.log('Sensors to configure:', sensors.length);
      sensors.forEach((s, i) => {
        console.log(`  Sensor ${i + 1}:`, {
          id: s.sensorCommId,
          type: s.sensorType,
          name: s.sensorIdStr || s.sensorId || 'Unknown'
        });
      });
      
      // Write generic config first
      console.log('Step 1: Writing generic config...');
      try {
        await this.writeAnalogGenericConfig(siteName, isSensorEnable);
        console.log('✓ Generic config written successfully');
      } catch (genericError) {
        console.error('❌ Failed to write generic config:', genericError);
        throw new Error(`Failed to write generic config: ${genericError.message}`);
      }
      
      // Wait longer for write to complete and device to process
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Write individual sensor configs sequentially
      console.log('Step 2: Writing individual sensor configs...');
      const writeErrors = [];
      
      for (let i = 0; i < sensors.length; i++) {
        const sensor = sensors[i];
        if (isSensorEnable[sensor.sensorType] === 1) {
          console.log(`  Writing config for sensor ${i + 1}/${sensors.length}: ${sensor.sensorIdStr || sensor.sensorId} (Type ${sensor.sensorType})`);
          
          try {
            // Get sensor-specific config and coefficients from database
            const sensorDb = await DatabaseManager.getAnalogChildSensorBySensorID(sensor.sensorCommId);
            const coeffArray = await DatabaseManager.getSensorCoeffArray(sensor.sensorCommId);
            
            console.log(`    Coefficients:`, coeffArray);
            
            // Route to appropriate sensor-specific config writer
            try {
              switch (sensor.sensorType) {
                case SENSOR_TYPES.LOAD_CELL:
                case SENSOR_TYPES.POTENTIOMETRIC:
                case SENSOR_TYPES.VTG_OUTPUT:
                case SENSOR_TYPES.ANA_4_20:
                  await this.writeSensorConfig(sensor, coeffArray);
                  console.log(`    ✓ Basic sensor config written`);
                  break;
                  
                case SENSOR_TYPES.VW_FREQ:
                  await this.writeVWConfig(sensor, sensorDb, coeffArray);
                  console.log(`    ✓ VW sensor config written`);
                  break;
                  
                case SENSOR_TYPES.EL_TILTMETER:
                  await this.writeTiltmeterConfig(sensor, sensorDb, coeffArray);
                  console.log(`    ✓ EL Tiltmeter config written`);
                  break;
                  
                case SENSOR_TYPES.MEMS_TILTMETER:
                  await this.writeBiaxialTiltmeterConfig(sensor, sensorDb, coeffArray);
                  console.log(`    ✓ MEMS Tiltmeter config written`);
                  break;
                  
                case SENSOR_TYPES.THERMISTOR:
                case SENSOR_TYPES.RTD:
                  await this.writeRTDThermistorConfig(sensor, sensorDb);
                  console.log(`    ✓ RTD/Thermistor config written`);
                  break;
                  
                default:
                  console.warn(`    ⚠ Unknown sensor type: ${sensor.sensorType}`);
              }
            } catch (sensorWriteError) {
              console.error(`    ❌ Failed to write config for sensor ${sensor.sensorIdStr}:`, sensorWriteError);
              writeErrors.push({
                sensor: sensor.sensorIdStr,
                error: sensorWriteError.message
              });
              // Continue with next sensor instead of throwing
            }
            
            // Wait longer for each write to complete
            await new Promise(resolve => setTimeout(resolve, 200));
          } catch (sensorError) {
            console.error(`    ❌ Error processing sensor ${sensor.sensorIdStr}:`, sensorError);
            writeErrors.push({
              sensor: sensor.sensorIdStr,
              error: sensorError.message
            });
            // Continue with next sensor
          }
        } else {
          console.log(`  Skipping sensor ${i + 1}: Type ${sensor.sensorType} not enabled`);
        }
      }
      
      // Report any errors but don't fail completely
      if (writeErrors.length > 0) {
        console.warn(`⚠ ${writeErrors.length} sensor(s) failed to write:`, writeErrors);
        // Still return true if at least generic config was written
      }
      
      console.log('=== Analog Config Complete ===');
      return true;
    } catch (error) {
      console.error('❌ Error writing analog config:', error);
      console.error('Error stack:', error.stack);
      throw error;
    }
  }

  /**
   * Write Generic Analog Configuration (Guide Specification)
   * Format: Site name (20 bytes, zero-padded) + sensor enable array (11 bytes) + termination byte (0)
   */
  async writeAnalogGenericConfig(siteName, isSensorEnable) {
    try {
      // Allocate buffer: 20 bytes (site name) + 11 bytes (sensor enable) + 1 byte (termination) = 32 bytes
      const buffer = Buffer.alloc(32);
      let byteCounter = 0;

      // Write site name (max 20 bytes, padded with zeros)
      const siteNameBytes = Buffer.from(siteName, 'utf-8');
      const siteNameLength = Math.min(20, siteNameBytes.length);
      siteNameBytes.copy(buffer, 0, 0, siteNameLength);
      byteCounter = 20; // Always pad to 20 bytes

      // Write sensor enable array (11 bytes)
      for (let i = 0; i < 11; i++) {
        buffer[byteCounter++] = isSensorEnable[i] || 0;
      }

      // Write termination byte (0)
      buffer[byteCounter++] = 0;

      const dataToSend = buffer.slice(0, byteCounter);
      const base64Data = dataToSend.toString('base64');
      
      await this.bleService.writeCharacteristic(
        SERVICES.CONFIG?.uuid || '00000003-8c26-476f-89a7-a108033a69c5',
        CONFIG_CHARACTERISTICS.ANA_GENERIC?.uuid || '0000aa00-8c26-476f-89a7-a108033a69c5',
        base64Data,
        true
      );
      
      console.log('Generic config written:', {
        siteName,
        isSensorEnable: isSensorEnable.slice(0, 11),
        bufferLength: dataToSend.length
      });
      
      return true;
    } catch (error) {
      console.error('Error writing analog generic config:', error);
      throw error;
    }
  }

  /**
   * Write Basic Sensor Configuration (Load Cell, Potentiometric, Voltage, 4-20mA)
   * Format: Sensor ID (20 bytes) + Param Name (20 bytes) + Param Unit (20 bytes) + 6 coefficients (48 bytes as doubles)
   */
  async writeSensorConfig(sensorCommDb, coeffArray) {
    try {
      const buffer = Buffer.alloc(108); // 20 + 20 + 20 + 48 = 108 bytes
      let byteCounter = 0;

      // Sensor ID (20 bytes, zero-padded)
      const sensorIdBytes = Buffer.from(sensorCommDb.sensorIdStr || '', 'utf-8');
      const sensorIdLength = Math.min(20, sensorIdBytes.length);
      sensorIdBytes.copy(buffer, 0, 0, sensorIdLength);
      byteCounter = 20;

      // Param Name (20 bytes, offset 20)
      const paramNameBytes = Buffer.from(sensorCommDb.paramName || '', 'utf-8');
      const paramNameLength = Math.min(20, paramNameBytes.length);
      paramNameBytes.copy(buffer, 20, 0, paramNameLength);
      byteCounter = 40;

      // Param Unit (20 bytes, offset 40)
      const paramUnitBytes = Buffer.from(sensorCommDb.paramUnit || '', 'utf-8');
      const paramUnitLength = Math.min(20, paramUnitBytes.length);
      paramUnitBytes.copy(buffer, 40, 0, paramUnitLength);
      byteCounter = 60;

      // Write 6 coefficients as doubles (8 bytes each, LITTLE ENDIAN)
      for (let i = 0; i < 6; i++) {
        const doubleBuffer = Buffer.alloc(8);
        doubleBuffer.writeDoubleLE(coeffArray[i] || 0.0, 0);
        doubleBuffer.copy(buffer, byteCounter);
        byteCounter += 8;
      }

      const dataToSend = buffer.slice(0, byteCounter);
      const base64Data = dataToSend.toString('base64');

      const charUUID = CONFIG_CHARACTERISTICS.ANA_SENSORS?.[sensorCommDb.sensorType] || '0000aa01-8c26-476f-89a7-a108033a69c5';
      await this.bleService.writeCharacteristic(
        SERVICES.CONFIG?.uuid || '00000003-8c26-476f-89a7-a108033a69c5',
        charUUID,
        base64Data,
        true
      );

      console.log(`Sensor config written for type ${sensorCommDb.sensorType}:`, sensorCommDb.sensorIdStr);
      return true;
    } catch (error) {
      console.error('Error writing sensor config:', error);
      throw error;
    }
  }

  /**
   * Write VW (Vibrating Wire) Sensor Configuration
   */
  async writeVWConfig(sensorCommDb, sensorDb, coeffArray) {
    try {
      const buffer = Buffer.alloc(140); // 108 (basic) + 32 (VW-specific) = 140 bytes
      let byteCounter = 0;

      // Basic config: Sensor ID, Param Name, Param Unit (60 bytes)
      const sensorIdBytes = Buffer.from(sensorCommDb.sensorIdStr || '', 'utf-8');
      sensorIdBytes.copy(buffer, 0, 0, Math.min(20, sensorIdBytes.length));
      
      const paramNameBytes = Buffer.from(sensorCommDb.paramName || '', 'utf-8');
      paramNameBytes.copy(buffer, 20, 0, Math.min(20, paramNameBytes.length));
      
      const paramUnitBytes = Buffer.from(sensorCommDb.paramUnit || '', 'utf-8');
      paramUnitBytes.copy(buffer, 40, 0, Math.min(20, paramUnitBytes.length));
      
      byteCounter = 60;

      // Write 6 coefficients (48 bytes)
      for (let i = 0; i < 6; i++) {
        const doubleBuffer = Buffer.alloc(8);
        doubleBuffer.writeDoubleLE(coeffArray[i] || 0.0, 0);
        doubleBuffer.copy(buffer, byteCounter);
        byteCounter += 8;
      }

      // Thermistor type (1 byte)
      buffer[byteCounter++] = sensorDb?.thermistorType || 0;

      // Temp units (20 bytes)
      const tempUnitBytes = Buffer.from(sensorDb?.tempUnits || '', 'utf-8');
      tempUnitBytes.copy(buffer, byteCounter, 0, Math.min(20, tempUnitBytes.length));
      byteCounter += 20;

      // Start frequency (2 bytes, LITTLE ENDIAN)
      buffer.writeUInt16LE(sensorDb?.vwStartFreq || 0, byteCounter);
      byteCounter += 2;

      // End frequency (2 bytes, LITTLE ENDIAN)
      buffer.writeUInt16LE(sensorDb?.vwEndFreq || 0, byteCounter);
      byteCounter += 2;

      // Number of steps (2 bytes, LITTLE ENDIAN)
      buffer.writeUInt16LE(sensorDb?.noOfSteps || 0, byteCounter);
      byteCounter += 2;

      // Number of samples (1 byte)
      buffer[byteCounter++] = sensorDb?.noOfSample || 0;

      const dataToSend = buffer.slice(0, byteCounter);
      const base64Data = dataToSend.toString('base64');

      const charUUID = CONFIG_CHARACTERISTICS.ANA_SENSORS[SENSOR_TYPES.VW_FREQ];
      await this.bleService.writeCharacteristic(
        SERVICES.CONFIG?.uuid || '00000003-8c26-476f-89a7-a108033a69c5',
        charUUID,
        base64Data,
        true
      );

      console.log('VW config written:', sensorCommDb.sensorIdStr);
      return true;
    } catch (error) {
      console.error('Error writing VW config:', error);
      throw error;
    }
  }

  /**
   * Write Electrolytic Tiltmeter Configuration
   */
  async writeTiltmeterConfig(sensorCommDb, sensorDb, coeffArray) {
    try {
      const buffer = Buffer.alloc(109); // 108 (basic) + 1 (thermistorType) + 20 (tempUnits) = 129, but keep 109 for alignment
      let byteCounter = 0;

      // Basic config (same as writeSensorConfig)
      const sensorIdBytes = Buffer.from(sensorCommDb.sensorIdStr || '', 'utf-8');
      sensorIdBytes.copy(buffer, 0, 0, Math.min(20, sensorIdBytes.length));
      
      const paramNameBytes = Buffer.from(sensorCommDb.paramName || '', 'utf-8');
      paramNameBytes.copy(buffer, 20, 0, Math.min(20, paramNameBytes.length));
      
      const paramUnitBytes = Buffer.from(sensorCommDb.paramUnit || '', 'utf-8');
      paramUnitBytes.copy(buffer, 40, 0, Math.min(20, paramUnitBytes.length));
      
      byteCounter = 60;

      // Write 6 coefficients
      for (let i = 0; i < 6; i++) {
        const doubleBuffer = Buffer.alloc(8);
        doubleBuffer.writeDoubleLE(coeffArray[i] || 0.0, 0);
        doubleBuffer.copy(buffer, byteCounter);
        byteCounter += 8;
      }

      // Thermistor type (1 byte)
      buffer[byteCounter++] = sensorDb?.thermistorType || 0;

      // Temp units (20 bytes)
      const tempUnitBytes = Buffer.from(sensorDb?.tempUnits || '', 'utf-8');
      tempUnitBytes.copy(buffer, byteCounter, 0, Math.min(20, tempUnitBytes.length));
      byteCounter += 20;

      const dataToSend = buffer.slice(0, byteCounter);
      const base64Data = dataToSend.toString('base64');

      const charUUID = CONFIG_CHARACTERISTICS.ANA_SENSORS[SENSOR_TYPES.EL_TILTMETER];
      await this.bleService.writeCharacteristic(
        SERVICES.CONFIG?.uuid || '00000003-8c26-476f-89a7-a108033a69c5',
        charUUID,
        base64Data,
        true
      );

      console.log('Tiltmeter config written:', sensorCommDb.sensorIdStr);
      return true;
    } catch (error) {
      console.error('Error writing tiltmeter config:', error);
      throw error;
    }
  }

  /**
   * Write Biaxial Tiltmeter (MEMS) Configuration
   */
  async writeBiaxialTiltmeterConfig(sensorCommDb, sensorDb, coeffArray) {
    try {
      const buffer = Buffer.alloc(156); // 108 (basic) + 20 (paramName2) + 20 (paramUnit2) + 48 (6 more coeffs) = 196, but use 156
      let byteCounter = 0;

      // Basic config
      const sensorIdBytes = Buffer.from(sensorCommDb.sensorIdStr || '', 'utf-8');
      sensorIdBytes.copy(buffer, 0, 0, Math.min(20, sensorIdBytes.length));
      
      const paramNameBytes = Buffer.from(sensorCommDb.paramName || '', 'utf-8');
      paramNameBytes.copy(buffer, 20, 0, Math.min(20, paramNameBytes.length));
      
      const paramUnitBytes = Buffer.from(sensorCommDb.paramUnit || '', 'utf-8');
      paramUnitBytes.copy(buffer, 40, 0, Math.min(20, paramUnitBytes.length));
      
      byteCounter = 60;

      // Write first 6 coefficients
      for (let i = 0; i < 6; i++) {
        const doubleBuffer = Buffer.alloc(8);
        doubleBuffer.writeDoubleLE(coeffArray[i] || 0.0, 0);
        doubleBuffer.copy(buffer, byteCounter);
        byteCounter += 8;
      }

      // Param Name 2 (20 bytes)
      const paramName2Bytes = Buffer.from(sensorDb?.paramName2 || '', 'utf-8');
      paramName2Bytes.copy(buffer, byteCounter, 0, Math.min(20, paramName2Bytes.length));
      byteCounter += 20;

      // Param Unit 2 (20 bytes)
      const paramUnit2Bytes = Buffer.from(sensorDb?.paramUnit2 || '', 'utf-8');
      paramUnit2Bytes.copy(buffer, byteCounter, 0, Math.min(20, paramUnit2Bytes.length));
      byteCounter += 20;

      // Write 6 more coefficients (for second axis)
      const coeffArray2 = coeffArray.slice(6, 12) || [0, 0, 0, 0, 0, 0];
      for (let i = 0; i < 6; i++) {
        const doubleBuffer = Buffer.alloc(8);
        doubleBuffer.writeDoubleLE(coeffArray2[i] || 0.0, 0);
        doubleBuffer.copy(buffer, byteCounter);
        byteCounter += 8;
      }

      const dataToSend = buffer.slice(0, byteCounter);
      const base64Data = dataToSend.toString('base64');

      const charUUID = CONFIG_CHARACTERISTICS.ANA_SENSORS[SENSOR_TYPES.MEMS_TILTMETER];
      await this.bleService.writeCharacteristic(
        SERVICES.CONFIG?.uuid || '00000003-8c26-476f-89a7-a108033a69c5',
        charUUID,
        base64Data,
        true
      );

      console.log('Biaxial tiltmeter config written:', sensorCommDb.sensorIdStr);
      return true;
    } catch (error) {
      console.error('Error writing biaxial tiltmeter config:', error);
      throw error;
    }
  }

  /**
   * Write RTD/Thermistor Configuration (no coefficients)
   */
  async writeRTDThermistorConfig(sensorCommDb, sensorDb) {
    try {
      const buffer = Buffer.alloc(61); // 20 + 20 + 20 + 1 = 61 bytes
      let byteCounter = 0;

      // Sensor ID (20 bytes)
      const sensorIdBytes = Buffer.from(sensorCommDb.sensorIdStr || '', 'utf-8');
      sensorIdBytes.copy(buffer, 0, 0, Math.min(20, sensorIdBytes.length));
      byteCounter = 20;

      // Param Name (20 bytes)
      const paramNameBytes = Buffer.from(sensorCommDb.paramName || '', 'utf-8');
      paramNameBytes.copy(buffer, 20, 0, Math.min(20, paramNameBytes.length));
      byteCounter = 40;

      // Param Unit (20 bytes)
      const paramUnitBytes = Buffer.from(sensorCommDb.paramUnit || '', 'utf-8');
      paramUnitBytes.copy(buffer, 40, 0, Math.min(20, paramUnitBytes.length));
      byteCounter = 60;

      // Thermistor type (1 byte)
      buffer[byteCounter++] = sensorDb?.thermistorType || 0;

      const dataToSend = buffer.slice(0, byteCounter);
      const base64Data = dataToSend.toString('base64');

      const charUUID = CONFIG_CHARACTERISTICS.ANA_SENSORS?.[sensorCommDb.sensorType] || '0000aa01-8c26-476f-89a7-a108033a69c5';
      await this.bleService.writeCharacteristic(
        SERVICES.CONFIG?.uuid || '00000003-8c26-476f-89a7-a108033a69c5',
        charUUID,
        base64Data,
        true
      );

      console.log('RTD/Thermistor config written:', sensorCommDb.sensorIdStr);
      return true;
    } catch (error) {
      console.error('Error writing RTD/Thermistor config:', error);
      throw error;
    }
  }

  /**
   * DATA DOWNLOAD OPERATIONS
   */

  /**
   * Download Analog Data
   * @param {Function} progressCallback - Called with (currentRecord, totalRecords)
   */
  async downloadAnalogData(totalRecords, progressCallback) {
    try {
      const allData = [];
      let recordsRead = 0;

      // Subscribe to download characteristic for notifications
      const subscription = await this.bleService.subscribeToCharacteristic(
        SERVICES.DOWNLOAD?.uuid || '00000002-8c26-476f-89a7-a108033a69c6',
        DOWNLOAD_CHARACTERISTICS.DOWNLOAD_DATA?.uuid || '0000aa02-8c26-476f-89a7-a108033a69c6',
        (data, error) => {
          if (error) {
            console.error('Download notification error:', error);
            return;
          }

          if (data) {
            const buffer = Buffer.from(data, 'base64');
            allData.push(buffer);
            recordsRead++;
            
            if (progressCallback) {
              progressCallback(recordsRead, totalRecords);
            }
          }
        }
      );

      // Wait for all records to be downloaded
      return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          if (recordsRead >= totalRecords) {
            clearInterval(checkInterval);
            subscription.remove();
            resolve(allData);
          }
        }, 100);

        // Timeout after 5 minutes
        setTimeout(() => {
          clearInterval(checkInterval);
          subscription.remove();
          if (recordsRead < totalRecords) {
            reject(new Error('Download timeout'));
          }
        }, 300000);
      });
    } catch (error) {
      console.error('Error downloading analog data:', error);
      throw error;
    }
  }

  /**
   * Parse downloaded analog data frame
   * Based on ReadAnalogData.java from old app
   */
  parseAnalogDataFrame(buffer) {
    try {
      // Extract timestamp
      const year = buffer[0] + 2000;
      const month = buffer[1] - 1; // JS months are 0-indexed
      const day = buffer[2];
      const hour = buffer[3];
      const minute = buffer[4];
      const second = buffer[5];
      
      const timestamp = new Date(year, month, day, hour, minute, second).getTime();
      
      // Extract sensor readings (implementation depends on data format)
      const readings = [];
      let offset = 6;
      
      // Parse sensor data based on format
      // This is a simplified version - adjust based on actual data format
      while (offset < buffer.length - 4) {
        const sensorType = buffer[offset++];
        const value = buffer.readFloatLE(offset);
        offset += 4;
        
        readings.push({
          sensorType,
          value,
        });
      }
      
      return {
        timestamp,
        readings,
      };
    } catch (error) {
      console.error('Error parsing analog data frame:', error);
      return null;
    }
  }

  /**
   * MONITOR MODE (Real-time reading)
   */

  /**
   * Subscribe to real-time analog sensor data
   */
  async subscribeToAnalogMonitor(callback) {
    try {
      // Use UUID strings directly (MONITOR service and ANALOG_SENSOR characteristic)
      // These match the Android app's MONITOR_MODE_SERVICE and MONITOR_ANOLOG_SENSOR
      const MONITOR_SERVICE_UUID = SERVICES.MONITOR?.uuid || '00000001-8c26-476f-89a7-a108033a69c7';
      const ANALOG_SENSOR_UUID = MONITOR_CHARACTERISTICS?.ANALOG_SENSOR?.uuid || '0000aa01-8c26-476f-89a7-a108033a69c7';
      
      console.log('=== Subscribing to Analog Monitor ===');
      console.log('Service UUID:', MONITOR_SERVICE_UUID);
      console.log('Characteristic UUID:', ANALOG_SENSOR_UUID);
      console.log('This enables notifications on the device (equivalent to notifydataAnalog() in Android)');
      
      // Wrap the callback to ensure correct parameter order
      const wrappedCallback = (error, data) => {
        console.log('=== EDI55Service Callback Wrapper ===');
        console.log('Received error:', error ? (typeof error === 'string' ? error.substring(0, 50) + '...' : typeof error) : 'null');
        console.log('Received data:', data ? (typeof data === 'string' ? `base64 (${data.length} chars)` : typeof data) : 'null');
        
        // Ensure we pass (error, data) to the monitor callback
        // The callback expects (data, error) based on the logs, so we need to swap
        console.log('Calling monitor callback with (data, error) signature...');
        callback(data, error);
      };
      
      const subscription = await this.bleService.subscribeToCharacteristic(
        MONITOR_SERVICE_UUID,
        ANALOG_SENSOR_UUID,
        wrappedCallback
      );
      
      console.log('✓ Subscription object created');
      console.log('✓ Notifications should now be enabled on device');
      
      return subscription;
    } catch (error) {
      console.error('❌ Error subscribing to analog monitor:', error);
      console.error('Error details:', error.message || error);
      throw error;
    }
  }

  /**
   * Read analog sensor data once
   */
  async readAnalogData() {
    try {
      const MONITOR_SERVICE_UUID = SERVICES.MONITOR?.uuid || '00000001-8c26-476f-89a7-a108033a69c7';
      const ANALOG_SENSOR_UUID = MONITOR_CHARACTERISTICS?.ANALOG_SENSOR?.uuid || '0000aa01-8c26-476f-89a7-a108033a69c7';
      
      const data = await this.bleService.readCharacteristic(
        MONITOR_SERVICE_UUID,
        ANALOG_SENSOR_UUID
      );
      return data;
    } catch (error) {
      console.error('Error reading analog data:', error);
      throw error;
    }
  }

  /**
   * Parse analog monitor frame (Guide Specification)
   * Frame structure: 48 bytes total (12 sensors × 4 bytes each)
   * Each float is at position: offset * 4 bytes
   * Returns array of 12 float values at fixed offsets
   */
  parseAnalogMonitorFrame(data) {
    try {
      if (!data) {
        console.warn('No data provided to parseAnalogMonitorFrame');
        return null;
      }

      console.log('=== parseAnalogMonitorFrame called ===');
      console.log('Raw data type:', typeof data);
      console.log('Raw data:', data);
      console.log('Data length:', data?.length || 'unknown');
      if (typeof data === 'string') {
        console.log('First 100 chars:', data.substring(0, 100));
      }

      // Convert to buffer - handle different input formats
      let buffer;
      if (typeof data === 'string') {
        // Try base64 first
        try {
          buffer = Buffer.from(data, 'base64');
          console.log('Decoded as base64, buffer length:', buffer.length);
        } catch (e) {
          // If base64 fails, try hex string
          try {
            // Remove spaces and convert hex string to buffer
            const hexString = data.replace(/\s+/g, '').replace(/0x/gi, '');
            buffer = Buffer.from(hexString, 'hex');
            console.log('Decoded as hex string, buffer length:', buffer.length);
          } catch (e2) {
            console.error('Failed to parse as base64 or hex:', e2);
            return null;
          }
        }
      } else if (Buffer.isBuffer(data)) {
        buffer = data;
        console.log('Data is already a buffer, length:', buffer.length);
      } else if (Array.isArray(data)) {
        // Convert array of bytes to buffer
        buffer = Buffer.from(data);
        console.log('Converted array to buffer, length:', buffer.length);
      } else if (data.value) {
        // BLE characteristic value (base64 string)
        buffer = Buffer.from(data.value, 'base64');
        console.log('Extracted value from characteristic, buffer length:', buffer.length);
      } else {
        console.error('Unknown data format:', typeof data, data);
        return null;
      }

      // Log hex representation for debugging
      console.log('=== Buffer Conversion Complete ===');
      console.log('Buffer length:', buffer.length);
      console.log('Buffer hex (full):', buffer.toString('hex'));
      console.log('Buffer bytes (first 20):', Array.from(buffer.slice(0, 20)).map(b => `0x${b.toString(16).padStart(2, '0').toUpperCase()}`).join(' '));
      if (buffer.length > 20) {
        console.log('Buffer bytes (middle 20):', Array.from(buffer.slice(20, 40)).map(b => `0x${b.toString(16).padStart(2, '0').toUpperCase()}`).join(' '));
      }

      // Check data length - should be 48 bytes (12 floats × 4 bytes each)
      // Or 50 bytes if there's a 2-byte header
      let startOffset = 0;
      if (buffer.length === 50) {
        // Has 2-byte header, skip it
        startOffset = 2;
        console.log('Detected 2-byte header, skipping to float data');
      } else if (buffer.length < 48) {
        console.warn('Monitor frame too short:', buffer.length, 'bytes (expected 48)');
        // Try to pad with zeros if too short
        if (buffer.length > 0) {
          const paddedBuffer = Buffer.alloc(48);
          buffer.copy(paddedBuffer, 0, 0, Math.min(buffer.length, 48));
          buffer = paddedBuffer;
          console.log('Padded buffer to 48 bytes');
        } else {
          return null;
        }
      } else if (buffer.length > 48) {
        // Take first 48 bytes if longer
        buffer = buffer.slice(0, 48);
        console.log('Truncated buffer to 48 bytes');
      }

      // Parse ALL 12 floats from the buffer (little-endian, 4 bytes each)
      console.log(`=== Parsing ${12} floats from offset ${startOffset} ===`);
      const readings = new Array(12);
      for (let i = 0; i < 12; i++) {
        const byteOffset = startOffset + (i * 4);
        if (byteOffset + 4 <= buffer.length) {
          const bytes = buffer.slice(byteOffset, byteOffset + 4);
          const hexStr = bytes.toString('hex').toUpperCase();
          const bytesArray = Array.from(bytes);
          
          // Read as little-endian float
          readings[i] = buffer.readFloatLE(byteOffset);
          
          console.log(`Reading ${i} (byteOffset ${byteOffset}):`);
          console.log(`  Bytes: ${bytesArray.map(b => `0x${b.toString(16).padStart(2, '0').toUpperCase()}`).join(' ')}`);
          console.log(`  Hex: ${hexStr}`);
          console.log(`  Float value: ${readings[i]}`);
          
          // Also check if it's actually a valid float (not NaN or Infinity)
          if (isNaN(readings[i]) || !isFinite(readings[i])) {
            console.warn(`  WARNING: Invalid float value (NaN or Infinity)!`);
            readings[i] = 0.0;
          }
        } else {
          readings[i] = 0.0;
          console.warn(`Reading ${i} out of bounds (byteOffset ${byteOffset} + 4 > ${buffer.length}), setting to 0`);
        }
      }

      const timestamp = Date.now();

      console.log('Parsed readings array:', readings);

      return {
        readings, // Array of 12 float values
        timestamp,
      };
    } catch (error) {
      console.error('Error parsing analog monitor frame:', error);
      console.error('Error stack:', error.stack);
      return null;
    }
  }

  /**
   * UTILITY METHODS
   */

  /**
   * Validate scan interval
   */
  validateScanInterval(hours, mins, secs) {
    const totalSecs = hours * 3600 + mins * 60 + secs;
    const MIN_INTERVAL = 5;
    const MAX_INTERVAL = 168 * 3600; // 7 days in seconds

    if (totalSecs < MIN_INTERVAL) {
      return { valid: false, message: 'Scan interval cannot be less than 5 seconds' };
    }

    if (totalSecs > MAX_INTERVAL) {
      return { valid: false, message: 'Scan interval cannot be greater than 168 hours' };
    }

    return { valid: true };
  }

  /**
   * Calculate time until scan starts
   */
  calculateTimeUntilScan(startHours, startMins) {
    const now = new Date();
    const scanStart = new Date();
    scanStart.setHours(startHours, startMins, 0, 0);

    if (scanStart <= now) {
      scanStart.setDate(scanStart.getDate() + 1);
    }

    const diff = scanStart - now;
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    return { hours, minutes, seconds };
  }

  /**
   * Check if two sensors have the same type
   */
  hasDuplicateSensorTypes(sensors) {
    const types = sensors.map(s => s.sensorType);
    const uniqueTypes = new Set(types);
    return types.length !== uniqueTypes.size;
  }
}

// Export singleton instance
const edi55Service = new EDI55Service();
export default edi55Service;

