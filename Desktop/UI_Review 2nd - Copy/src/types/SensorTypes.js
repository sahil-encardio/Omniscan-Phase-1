import PropTypes from 'prop-types';

/**
 * Sensor Reading Data Structure
 */
export const SensorReading = {
  sensorId: PropTypes.number.isRequired,
  sensorType: PropTypes.number.isRequired, // 0-8 for sensor types
  sensorTypeName: PropTypes.string.isRequired, // 'Load Cell', 'VW Frequency', etc.
  value: PropTypes.number.isRequired,
  units: PropTypes.string.isRequired,
  temperature: PropTypes.number, // Optional temperature reading
  timestamp: PropTypes.instanceOf(Date).isRequired,
  isActive: PropTypes.bool.isRequired,
  color: PropTypes.string, // UI color for the sensor
  icon: PropTypes.string, // Ionicon name
};

/**
 * Sensor Reading Shape for PropTypes validation
 */
export const SensorReadingShape = PropTypes.shape(SensorReading);

/**
 * Array of Sensor Readings
 */
export const SensorReadingsArray = PropTypes.arrayOf(SensorReadingShape);

/**
 * Create a default sensor reading object
 */
export const createSensorReading = ({
  sensorId,
  sensorType,
  sensorTypeName,
  value,
  units,
  temperature = null,
  timestamp = new Date(),
  isActive = true,
  color = '#2241DD',
  icon = 'pulse-outline',
}) => ({
  sensorId,
  sensorType,
  sensorTypeName,
  value,
  units,
  temperature,
  timestamp,
  isActive,
  color,
  icon,
});

/**
 * Monitoring Mode Type
 */
export const MonitoringMode = PropTypes.oneOf(['manual', 'realtime']);













