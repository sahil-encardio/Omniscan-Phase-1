/**
 * Reading Model
 * Represents a sensor reading with deviation calculations
 */
class ReadingModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.sensorId = data.sensorId || '';
    this.siteId = data.siteId || null;
    this.value = data.value || 0;
    this.temperature = data.temperature || null;
    this.timestamp = data.timestamp || Date.now();
    this.referenceValue = data.referenceValue || 0;
    this.lastSavedValue = data.lastSavedValue || 0;
  }

  /**
   * Calculate deviation from reference reading
   */
  getDeviationFromReference() {
    return this.value - this.referenceValue;
  }

  /**
   * Calculate deviation from last saved reading
   */
  getDeviationFromLastSaved() {
    return this.value - this.lastSavedValue;
  }

  /**
   * Format deviation with +/- sign
   */
  static formatDeviation(deviation) {
    if (deviation === 0) return '0.00';
    const sign = deviation > 0 ? '+' : '';
    return `${sign}${deviation.toFixed(2)}`;
  }

  /**
   * Convert to database format
   */
  toDatabase() {
    return {
      sensorId: this.sensorId,
      siteId: this.siteId,
      value: this.value,
      temperature: this.temperature,
      timestamp: this.timestamp,
    };
  }

  /**
   * Create from database row
   */
  static fromDatabase(row) {
    return new ReadingModel({
      id: row.id,
      sensorId: row.sensorId,
      siteId: row.siteId,
      value: row.value,
      temperature: row.temperature,
      timestamp: row.timestamp,
    });
  }

  /**
   * Validate reading data
   */
  validate() {
    const errors = [];

    if (!this.sensorId) {
      errors.push('Sensor ID is required');
    }

    if (this.value === null || this.value === undefined) {
      errors.push('Value is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export default ReadingModel;









