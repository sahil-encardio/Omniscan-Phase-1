import AsyncStorage from '@react-native-async-storage/async-storage';
import DatabaseManager from '../database/DatabaseManager';

const SENSOR_TYPES = {
  SENS_LOAD_CELL: 0,
  SENS_POTENTIOMETRIC: 1,
  SENS_VTG_OUTPUT: 2,
  SENS_EL_TILTMETER: 3,
  SENS_MEMS_TILMETER: 4,
  SENS_ANA_4_20: 5,
  SENS_VW_FREQ: 6,
  SENS_THERMISTOR: 7,
  SENS_RTD: 8,
};

const DEFAULT_SITE_NAME = 'Default Site';

export async function initializeDefaultData() {
  // Check if already initialized
  const isInitialized = await AsyncStorage.getItem('DEFAULT_DATA_INITIALIZED');
  
  if (isInitialized === 'true') {
    console.log('Default data already initialized');
    return;
  }

  console.log('=== Initializing default data ===');

  try {
    // Ensure database is initialized
    await DatabaseManager.initialize();

    // Step 1: Create Default Site in site_table
    const siteId = await DatabaseManager.insertSiteToTable(DEFAULT_SITE_NAME, 'Default');
    console.log('✓ Default Site created with ID:', siteId);

    // Step 2: Create Manufacturer
    const mfrId = await DatabaseManager.insertMFR('Encardio-rite', true);
    console.log('✓ Manufacturer created with ID:', mfrId);

    // Step 3: Create All Sensor Models (required before creating sensors)
    await createAllSensorModels(mfrId);

    // Step 4: Create All Default Sensors
    await createAllDefaultSensors(siteId, mfrId);

    // Mark as initialized
    await AsyncStorage.setItem('DEFAULT_DATA_INITIALIZED', 'true');
    await AsyncStorage.setItem('SELECTED_SITE', DEFAULT_SITE_NAME);
    
    console.log('✓ Default data initialization complete!');
  } catch (error) {
    console.error('❌ Error initializing default data:', error);
    throw error;
  }
}

async function createAllSensorModels(mfrId) {
  console.log('Creating sensor models...');
  
  // Load Cell models
  await DatabaseManager.insertAnalogModel(mfrId, SENSOR_TYPES.SENS_LOAD_CELL, 'ELC-30S', true, 0, 0, 0, 0);
  await DatabaseManager.insertAnalogModel(mfrId, SENSOR_TYPES.SENS_LOAD_CELL, 'ELC-30S-H', true, 0, 0, 0, 0);
  await DatabaseManager.insertAnalogModel(mfrId, SENSOR_TYPES.SENS_LOAD_CELL, 'ELC-210S', true, 0, 0, 0, 0);
  await DatabaseManager.insertAnalogModel(mfrId, SENSOR_TYPES.SENS_LOAD_CELL, 'ELC-150S-H', true, 0, 0, 0, 0);
  await DatabaseManager.insertAnalogModel(mfrId, SENSOR_TYPES.SENS_LOAD_CELL, 'ESC-30C', true, 0, 0, 0, 0);
  await DatabaseManager.insertAnalogModel(mfrId, SENSOR_TYPES.SENS_LOAD_CELL, 'EPS-30V-C', true, 0, 0, 0, 0);
  await DatabaseManager.insertAnalogModel(mfrId, SENSOR_TYPES.SENS_LOAD_CELL, 'EPS-30V-S', true, 0, 0, 0, 0);
  await DatabaseManager.insertAnalogModel(mfrId, SENSOR_TYPES.SENS_LOAD_CELL, 'EPS-30V-I', true, 0, 0, 0, 0);
  await DatabaseManager.insertAnalogModel(mfrId, SENSOR_TYPES.SENS_LOAD_CELL, 'EPS-30V-J', true, 0, 0, 0, 0);

  // Potentiometric models
  await DatabaseManager.insertAnalogModel(mfrId, SENSOR_TYPES.SENS_POTENTIOMETRIC, 'EDE-Pxx', true, 0, 0, 0, 0);
  await DatabaseManager.insertAnalogModel(mfrId, SENSOR_TYPES.SENS_POTENTIOMETRIC, 'EEG-10', true, 0, 0, 0, 0);
  await DatabaseManager.insertAnalogModel(mfrId, SENSOR_TYPES.SENS_POTENTIOMETRIC, 'EMA-11', true, 0, 0, 0, 0);

  // Voltage Output models
  await DatabaseManager.insertAnalogModel(mfrId, SENSOR_TYPES.SENS_VTG_OUTPUT, 'EAN-90MU', true, 0, 0, 0, 0);
  await DatabaseManager.insertAnalogModel(mfrId, SENSOR_TYPES.SENS_VTG_OUTPUT, 'EAN-90MB', true, 0, 0, 0, 0);
  await DatabaseManager.insertAnalogModel(mfrId, SENSOR_TYPES.SENS_VTG_OUTPUT, 'EAN-91MU', true, 0, 0, 0, 0);
  await DatabaseManager.insertAnalogModel(mfrId, SENSOR_TYPES.SENS_VTG_OUTPUT, 'EAN-91MB', true, 0, 0, 0, 0);
  await DatabaseManager.insertAnalogModel(mfrId, SENSOR_TYPES.SENS_VTG_OUTPUT, 'EAN-41M', true, 0, 0, 0, 0);

  // Electrolytic Tiltmeter models
  await DatabaseManager.insertAnalogModel(mfrId, SENSOR_TYPES.SENS_EL_TILTMETER, 'EAN-31EL-B', true, 0, 0, 0, 0);
  await DatabaseManager.insertAnalogModel(mfrId, SENSOR_TYPES.SENS_EL_TILTMETER, 'EAN-41EL-B', true, 0, 0, 0, 0);

  // MEMS Tiltmeter models
  await DatabaseManager.insertAnalogModel(mfrId, SENSOR_TYPES.SENS_MEMS_TILMETER, 'EAN-70M', true, 0, 0, 0, 0);
  await DatabaseManager.insertAnalogModel(mfrId, SENSOR_TYPES.SENS_MEMS_TILMETER, 'EAN-90M', true, 0, 0, 0, 0);
  await DatabaseManager.insertAnalogModel(mfrId, SENSOR_TYPES.SENS_MEMS_TILMETER, 'EAN-91M', true, 0, 0, 0, 0);
  await DatabaseManager.insertAnalogModel(mfrId, SENSOR_TYPES.SENS_MEMS_TILMETER, 'EAN-91M-B', true, 0, 0, 0, 0);
  await DatabaseManager.insertAnalogModel(mfrId, SENSOR_TYPES.SENS_MEMS_TILMETER, 'EAN-41M-B', true, 0, 0, 0, 0);

  // 4-20mA models
  await DatabaseManager.insertAnalogModel(mfrId, SENSOR_TYPES.SENS_ANA_4_20, 'EDS-51', true, 0, 0, 0, 0);
  await DatabaseManager.insertAnalogModel(mfrId, SENSOR_TYPES.SENS_ANA_4_20, 'EVS-52', true, 0, 0, 0, 0);
  await DatabaseManager.insertAnalogModel(mfrId, SENSOR_TYPES.SENS_ANA_4_20, 'ELS-56', true, 0, 0, 0, 0);

  // VW Frequency models
  await DatabaseManager.insertAnalogModel(mfrId, SENSOR_TYPES.SENS_VW_FREQ, 'EPP-30V', true, 1500, 3500, 100, 0);
  await DatabaseManager.insertAnalogModel(mfrId, SENSOR_TYPES.SENS_VW_FREQ, 'EPP-40V', true, 1500, 3500, 100, 0);
  await DatabaseManager.insertAnalogModel(mfrId, SENSOR_TYPES.SENS_VW_FREQ, 'EPP-50V', true, 1500, 3500, 100, 0);
  await DatabaseManager.insertAnalogModel(mfrId, SENSOR_TYPES.SENS_VW_FREQ, 'EPP-60V', true, 1500, 3500, 100, 0);
  await DatabaseManager.insertAnalogModel(mfrId, SENSOR_TYPES.SENS_VW_FREQ, 'EPU-20V/20G', true, 1500, 3500, 100, 0);
  await DatabaseManager.insertAnalogModel(mfrId, SENSOR_TYPES.SENS_VW_FREQ, 'EDS20V-E', true, 400, 6000, 100, 0);
  await DatabaseManager.insertAnalogModel(mfrId, SENSOR_TYPES.SENS_VW_FREQ, 'EDS-20V-AW', true, 400, 6000, 100, 0);
  await DatabaseManager.insertAnalogModel(mfrId, SENSOR_TYPES.SENS_VW_FREQ, 'EDS-20V-SW', true, 400, 6000, 100, 0);
  await DatabaseManager.insertAnalogModel(mfrId, SENSOR_TYPES.SENS_VW_FREQ, 'EDS-11V', true, 400, 6000, 100, 0);
  await DatabaseManager.insertAnalogModel(mfrId, SENSOR_TYPES.SENS_VW_FREQ, 'EDS-12V', true, 400, 6000, 100, 0);
  await DatabaseManager.insertAnalogModel(mfrId, SENSOR_TYPES.SENS_VW_FREQ, 'EDS-12V-EX', true, 400, 6000, 100, 0);
  await DatabaseManager.insertAnalogModel(mfrId, SENSOR_TYPES.SENS_VW_FREQ, 'ELC-31V', true, 400, 6000, 100, 0);
  await DatabaseManager.insertAnalogModel(mfrId, SENSOR_TYPES.SENS_VW_FREQ, 'ELC-32V', true, 400, 6000, 100, 0);
  await DatabaseManager.insertAnalogModel(mfrId, SENSOR_TYPES.SENS_VW_FREQ, 'ETT-10V', true, 400, 6000, 100, 0);

  // Thermistor models
  await DatabaseManager.insertAnalogModel(mfrId, SENSOR_TYPES.SENS_THERMISTOR, 'ETT-10TH', true, 0, 0, 0, 0);

  // RTD models
  await DatabaseManager.insertAnalogModel(mfrId, SENSOR_TYPES.SENS_RTD, 'ETT-10PT', true, 0, 0, 0, 0);
  await DatabaseManager.insertAnalogModel(mfrId, SENSOR_TYPES.SENS_RTD, 'ETT-10', true, 0, 0, 0, 0);

  console.log('✓ All sensor models created');
}

async function createAllDefaultSensors(siteId, mfrId) {
  console.log('Creating default sensors...');

  // 1. Load Cell Sensor
  const loadCellModelId = await DatabaseManager.getModelIdByName('ELC-30S');
  const loadCellSensorCommId = await DatabaseManager.insertAnalogSensorCommToTable(
    siteId,
    loadCellModelId,
    SENSOR_TYPES.SENS_LOAD_CELL,
    'Load Cell',
    'Voltage',
    'mV',
    'ER001',
    'Default Sensor Load Cell'
  );
  await createDefaultCoefficients(loadCellSensorCommId);

  // 2. Potentiometric Sensor
  const potentiometricModelId = await DatabaseManager.getModelIdByName('EDE-Pxx');
  const potentiometricSensorCommId = await DatabaseManager.insertAnalogSensorCommToTable(
    siteId,
    potentiometricModelId,
    SENSOR_TYPES.SENS_POTENTIOMETRIC,
    'Potentiometric',
    'Voltage',
    'Volt',
    'ER001',
    'Default Sensor Potentiometric'
  );
  await createDefaultCoefficients(potentiometricSensorCommId);

  // 3. Voltage Output Sensor
  const voltageModelId = await DatabaseManager.getModelIdByName('EAN-90MU');
  const voltageSensorCommId = await DatabaseManager.insertAnalogSensorCommToTable(
    siteId,
    voltageModelId,
    SENSOR_TYPES.SENS_VTG_OUTPUT,
    'Voltage Output',
    'Voltage',
    'Volt',
    'ER001',
    'Default Sensor voltage output'
  );
  await createDefaultCoefficients(voltageSensorCommId);

  // 4. EL Tiltmeter Sensor
  const elTiltModelId = await DatabaseManager.getModelIdByName('EAN-31EL-B');
  const elTiltSensorCommId = await DatabaseManager.insertAnalogSensorCommToTable(
    siteId,
    elTiltModelId,
    SENSOR_TYPES.SENS_EL_TILTMETER,
    'EL TiltMeter',
    'Tilt',
    'Volt',
    'ER001',
    'Default Sensor EL Tilt Meter'
  );
  await DatabaseManager.insertAnalogSensorToTable(elTiltSensorCommId, 0, 0, 0, 0, 0, 'Deg. C');
  await createDefaultCoefficients(elTiltSensorCommId);

  // 5. Uni-Axial Tiltmeter Sensor
  const uniAxialModelId = await DatabaseManager.getModelIdByName('EAN-70M');
  const uniAxialSensorCommId = await DatabaseManager.insertAnalogSensorCommToTable(
    siteId,
    uniAxialModelId,
    SENSOR_TYPES.SENS_MEMS_TILMETER,
    'Uni-Axial TiltMeter',
    'Tilt',
    'Volt',
    'ER001',
    'Default Sensor Uni-Axial TiltMeter'
  );
  await createDefaultCoefficients(uniAxialSensorCommId);

  // 6. Bi-Axial Tiltmeter Sensor
  const biAxialModelId = await DatabaseManager.getModelIdByName('EAN-70M');
  const biAxialSensorCommId = await DatabaseManager.insertAnalogSensorCommToTable(
    siteId,
    biAxialModelId,
    SENSOR_TYPES.SENS_MEMS_TILMETER,
    'Bi-Axial TiltMeter',
    'Tilt-X',
    'Volt',
    'ER001',
    'Default Sensor Bi-Axial TiltMeter'
  );
  await DatabaseManager.insertAnalogSensorToTable(biAxialSensorCommId, 0, 0, 0, 0, 0, null, 'Tilt-Y', 'Volt');
  // Bi-axial has 12 coefficients (6 for each axis)
  await createDefaultCoefficients(biAxialSensorCommId); // First 6
  await createDefaultCoefficients(biAxialSensorCommId, 6); // Second 6 (coeffIndex 6-11)

  // 7. 4-20mA Sensor
  const fourTo20ModelId = await DatabaseManager.getModelIdByName('EDS-51');
  const fourTo20SensorCommId = await DatabaseManager.insertAnalogSensorCommToTable(
    siteId,
    fourTo20ModelId,
    SENSOR_TYPES.SENS_ANA_4_20,
    '4-20mA',
    'Current',
    'mA',
    'ER001',
    'Default Sensor 4-20mA'
  );
  await createDefaultCoefficients(fourTo20SensorCommId);

  // 8. VW Range-A (400-6000Hz)
  const vwRangeAModelId = await DatabaseManager.getModelIdByName('EDS20V-E');
  const vwRangeASensorCommId = await DatabaseManager.insertAnalogSensorCommToTable(
    siteId,
    vwRangeAModelId,
    SENSOR_TYPES.SENS_VW_FREQ,
    'VW Range-A(400-6000Hz)',
    'Frequency',
    'Hertz',
    'ER001',
    'Default Sensor Range-A(400-6000Hz)'
  );
  await DatabaseManager.insertAnalogSensorToTable(vwRangeASensorCommId, 400, 6000, 150, 0, 0, 'Deg. C');
  await createDefaultCoefficients(vwRangeASensorCommId);

  // 9. VW Range-B (400-1500Hz)
  const vwRangeBModelId = await DatabaseManager.getModelIdByName('EPP-30V');
  const vwRangeBSensorCommId = await DatabaseManager.insertAnalogSensorCommToTable(
    siteId,
    vwRangeBModelId,
    SENSOR_TYPES.SENS_VW_FREQ,
    'VW Range-B(400-1500Hz)',
    'Frequency',
    'Hertz',
    'ER001',
    'Default Sensor Range-B(400-1500Hz)'
  );
  await DatabaseManager.insertAnalogSensorToTable(vwRangeBSensorCommId, 400, 1500, 150, 0, 0, 'Deg. C');
  await createDefaultCoefficients(vwRangeBSensorCommId);

  // 10. VW Range-C (1500-3500Hz)
  const vwRangeCModelId = await DatabaseManager.getModelIdByName('EPP-30V');
  const vwRangeCSensorCommId = await DatabaseManager.insertAnalogSensorCommToTable(
    siteId,
    vwRangeCModelId,
    SENSOR_TYPES.SENS_VW_FREQ,
    'VW Range-C(1500-3500Hz)',
    'Frequency',
    'Hertz',
    'ER001',
    'Default Sensor Range-B(1500-3500Hz)'
  );
  await DatabaseManager.insertAnalogSensorToTable(vwRangeCSensorCommId, 1500, 3500, 150, 0, 0, 'Deg. C');
  await createDefaultCoefficients(vwRangeCSensorCommId);

  // 11. VW Range-D (2500-6000Hz)
  const vwRangeDModelId = await DatabaseManager.getModelIdByName('EPP-30V');
  const vwRangeDSensorCommId = await DatabaseManager.insertAnalogSensorCommToTable(
    siteId,
    vwRangeDModelId,
    SENSOR_TYPES.SENS_VW_FREQ,
    'VW Range-D(2500-6000Hz)',
    'Frequency',
    'Hertz',
    'ER001',
    'Default Sensor Range-D(2500-6000Hz)'
  );
  await DatabaseManager.insertAnalogSensorToTable(vwRangeDSensorCommId, 2500, 6000, 150, 0, 0, 'Deg. C');
  await createDefaultCoefficients(vwRangeDSensorCommId);

  // 12. Thermistor Sensor
  const thermistorModelId = await DatabaseManager.getModelIdByName('ETT-10TH');
  const thermistorSensorCommId = await DatabaseManager.insertAnalogSensorCommToTable(
    siteId,
    thermistorModelId,
    SENSOR_TYPES.SENS_THERMISTOR,
    'Thermistor',
    'Temperature',
    'Deg. C',
    'ER001',
    'Default Sensor Thermistor'
  );
  await DatabaseManager.insertAnalogSensorToTable(thermistorSensorCommId, 0, 0, 0, 0, 0, 'Deg. C');

  // 13. RTD Sensor
  const rtdModelId = await DatabaseManager.getModelIdByName('ETT-10PT');
  const rtdSensorCommId = await DatabaseManager.insertAnalogSensorCommToTable(
    siteId,
    rtdModelId,
    SENSOR_TYPES.SENS_RTD,
    'RTD',
    'Temperature',
    'Deg. C',
    'ER001',
    'Default Sensor RTD'
  );
  await DatabaseManager.insertAnalogSensorToTable(rtdSensorCommId, 0, 0, 0, 0, 0, 'Deg. C');

  console.log('✓ All 13 default sensors created');
}

async function createDefaultCoefficients(sensorCommId, startIndex = 0) {
  // Default coefficients: [0.0, 1.0, 0.0, 0.0, 0.0, 0.0]
  const defaultCoeffs = [0.0, 1.0, 0.0, 0.0, 0.0, 0.0];
  
  for (let i = 0; i < defaultCoeffs.length; i++) {
    await DatabaseManager.insertSensorCoeffToTable(sensorCommId, startIndex + i, defaultCoeffs[i]);
  }
}




