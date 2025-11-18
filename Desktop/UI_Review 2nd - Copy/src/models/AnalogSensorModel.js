import { SENSOR_TYPE_LABELS } from '../constants/EDI55Constants';

/**
 * Analog Sensor Model
 * Represents an analog sensor configured on a site
 */
export class AnalogSensorModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.siteId = data.siteId || data.site_id || null;
    this.sensorId = data.sensorId || data.sensor_id || '';
    this.sensorType = data.sensorType !== undefined ? data.sensorType : (data.sensor_type || 0);
    this.manufacturer = data.manufacturer || '';
    this.model = data.model || '';
    this.serialNumber = data.serialNumber || data.serial_number || '';
    this.calibrationFactor = data.calibrationFactor !== undefined ? data.calibrationFactor : (data.calibration_factor || 1.0);
    this.offset = data.offset !== undefined ? data.offset : 0.0;
    this.unit = data.unit || '';
    this.locationNorth = data.locationNorth || data.location_north || '';
    this.locationEast = data.locationEast || data.location_east || '';
    this.comments = data.comments || '';
    this.isActive = data.isActive !== undefined ? data.isActive : (data.is_active !== undefined ? data.is_active : 1);
    this.created_at = data.created_at || Math.floor(Date.now() / 1000);
    this.updated_at = data.updated_at || Math.floor(Date.now() / 1000);
  }

  /**
   * Validate sensor data
   */
  validate() {
    const errors = [];

    if (!this.siteId) {
      errors.push('Site ID is required');
    }

    if (!this.sensorId || this.sensorId.trim() === '') {
      errors.push('Sensor ID is required');
    }

    if (this.sensorId && this.sensorId.length > 50) {
      errors.push('Sensor ID must be less than 50 characters');
    }

    if (this.sensorType < 0 || this.sensorType > 8) {
      errors.push('Invalid sensor type');
    }

    if (this.calibrationFactor <= 0) {
      errors.push('Calibration factor must be greater than 0');
    }

    if (this.comments && this.comments.length > 500) {
      errors.push('Comments must be less than 500 characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Convert to database format
   */
  toDatabase() {
    return {
      siteId: this.siteId,
      sensorId: this.sensorId.trim(),
      sensorType: this.sensorType,
      manufacturer: this.manufacturer.trim(),
      model: this.model.trim(),
      serialNumber: this.serialNumber.trim(),
      calibrationFactor: this.calibrationFactor,
      offset: this.offset,
      unit: this.unit.trim(),
      locationNorth: this.locationNorth.trim(),
      locationEast: this.locationEast.trim(),
      comments: this.comments.trim(),
      isActive: this.isActive ? 1 : 0,
    };
  }

  /**
   * Create from database row
   */
  static fromDatabase(row) {
    return new AnalogSensorModel({
      id: row.id,
      site_id: row.site_id,
      sensor_id: row.sensor_id,
      sensor_type: row.sensor_type,
      manufacturer: row.manufacturer,
      model: row.model,
      serial_number: row.serial_number,
      calibration_factor: row.calibration_factor,
      offset: row.offset,
      unit: row.unit,
      location_north: row.location_north,
      location_east: row.location_east,
      comments: row.comments,
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  }

  /**
   * Get sensor type label
   */
  getSensorTypeLabel() {
    return SENSOR_TYPE_LABELS[this.sensorType] || 'Unknown';
  }

  /**
   * Get display name
   */
  getDisplayName() {
    return this.sensorId || `Sensor ${this.id}`;
  }

  /**
   * Get full description
   */
  getFullDescription() {
    const parts = [this.sensorId, this.getSensorTypeLabel()];
    if (this.manufacturer) {
      parts.push(this.manufacturer);
    }
    if (this.model) {
      parts.push(this.model);
    }
    return parts.join(' - ');
  }

  /**
   * Check if sensor is active
   */
  isActiveStatus() {
    return this.isActive === 1 || this.isActive === true;
  }

  /**
   * Get location string
   */
  getLocationString() {
    if (this.locationNorth || this.locationEast) {
      return `N: ${this.locationNorth || 'N/A'}, E: ${this.locationEast || 'N/A'}`;
    }
    return 'Location not set';
  }
}

export default AnalogSensorModel;









