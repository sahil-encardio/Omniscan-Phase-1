/**
 * Site Model
 * Represents a physical site/location where sensors are installed
 */
export class SiteModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.name = data.name || '';
    this.comments = data.comments || '';
    this.created_at = data.created_at || Math.floor(Date.now() / 1000);
    this.updated_at = data.updated_at || Math.floor(Date.now() / 1000);
  }

  /**
   * Validate site data
   */
  validate() {
    const errors = [];

    if (!this.name || this.name.trim() === '') {
      errors.push('Site name is required');
    }

    if (this.name && this.name.length > 100) {
      errors.push('Site name must be less than 100 characters');
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
      name: this.name.trim(),
      comments: this.comments.trim(),
    };
  }

  /**
   * Create from database row
   */
  static fromDatabase(row) {
    return new SiteModel({
      id: row.id,
      name: row.name,
      comments: row.comments,
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  }

  /**
   * Get display name
   */
  getDisplayName() {
    return this.name;
  }

  /**
   * Check if this is the default site
   */
  isDefault() {
    return this.name === 'Default Site';
  }
}

export default SiteModel;









