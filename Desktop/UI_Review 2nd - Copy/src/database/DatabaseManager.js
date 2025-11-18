import * as SQLite from 'expo-sqlite';
import { DEFAULT_SITE_NAME } from '../constants/EDI55Constants';

/**
 * Database Manager for EDI-55 Local Storage
 * Manages sites, sensors, and sensor readings using SQLite
 */
class DatabaseManager {
  constructor() {
    this.db = null;
    this.initialized = false;
  }

  /**
   * Initialize database and create tables
   */
  async initialize() {
    if (this.initialized && this.db) {
      return;
    }

    try {
      console.log('Opening database: edi55.db');
      this.db = await SQLite.openDatabaseAsync('edi55.db');
      console.log('✓ Database opened successfully');
      
      if (!this.db) {
        throw new Error('Database instance is null after opening');
      }
      
      // Create tables first
      console.log('Creating database tables...');
      await this.createTables();
      console.log('✓ Tables created');
      
      // Run migration from old schema to new schema (non-blocking, errors are caught)
      try {
        await this.migrateData();
      } catch (migrationError) {
        console.error('Migration error (non-fatal):', migrationError);
        // Continue even if migration fails
      }
      
      // Initialize default data (will be done by DefaultDataInitializer)
      // Don't call initializeDefaultData here - it's called from App.tsx
      console.log('✓ Database ready for initialization');
      
      this.initialized = true;
      console.log('✓ Database initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize database:', error);
      console.error('Error details:', error.message, error.stack);
      // Don't throw - prevent app crash
      // Set initialized to false so retries can happen
      this.initialized = false;
      this.db = null;
      // Log error but don't rethrow to prevent app crash
    }
  }

  /**
   * Create database tables - Updated to match guide schema
   */
  async createTables() {
    try {
      // Step 1: Site Table (as per guide)
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS site_table (
          siteId INTEGER PRIMARY KEY AUTOINCREMENT,
          siteName TEXT NOT NULL,
          comments TEXT
        );
      `);

      // Keep old sites table for backward compatibility (will migrate)
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS sites (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          comments TEXT,
          isSensorEnable BLOB,
          created_at INTEGER DEFAULT (strftime('%s', 'now')),
          updated_at INTEGER DEFAULT (strftime('%s', 'now'))
        );
      `);

      // Step 2: Manufacturer Table (NEW - as per guide)
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS mfr_table (
          mfrId INTEGER PRIMARY KEY AUTOINCREMENT,
          mfrName TEXT NOT NULL,
          isActive INTEGER DEFAULT 1
        );
      `);

      // Step 3: Analog Model Table (NEW - as per guide)
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS analog_model_table (
          modelId INTEGER PRIMARY KEY AUTOINCREMENT,
          mfrId INTEGER,
          sensorType INTEGER,
          modelName TEXT NOT NULL,
          isActive INTEGER DEFAULT 1,
          vwStartFreq INTEGER DEFAULT 0,
          vwEndFreq INTEGER DEFAULT 0,
          noOfSteps INTEGER DEFAULT 0,
          noOfSample INTEGER DEFAULT 0,
          FOREIGN KEY (mfrId) REFERENCES mfr_table(mfrId)
        );
      `);

      // Old analog_sensors table (kept for migration)
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS analog_sensors (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          site_id INTEGER NOT NULL,
          sensor_id TEXT NOT NULL,
          sensor_type INTEGER NOT NULL,
          manufacturer TEXT,
          model TEXT,
          serial_number TEXT,
          calibration_factor REAL,
          offset REAL,
          unit TEXT,
          location_north TEXT,
          location_east TEXT,
          comments TEXT,
          is_active INTEGER DEFAULT 1,
          created_at INTEGER DEFAULT (strftime('%s', 'now')),
          updated_at INTEGER DEFAULT (strftime('%s', 'now')),
          FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
          UNIQUE(site_id, sensor_id)
        );
      `);

      // Step 4: Analog Sensor Communication Table (as per guide)
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS analog_sensor_comm_table (
          sensorCommId INTEGER PRIMARY KEY AUTOINCREMENT,
          siteId INTEGER NOT NULL,
          modelId INTEGER,
          sensorType INTEGER NOT NULL,
          sensorIdStr TEXT NOT NULL,
          sensorSerialNo TEXT,
          sensorComments TEXT,
          paramName TEXT,
          paramUnit TEXT,
          FOREIGN KEY (siteId) REFERENCES site_table(siteId) ON DELETE CASCADE,
          FOREIGN KEY (modelId) REFERENCES analog_model_table(modelId) ON DELETE CASCADE
        );
      `);

      // Keep old analog_sensor_comm for backward compatibility
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS analog_sensor_comm (
          sensorCommId INTEGER PRIMARY KEY AUTOINCREMENT,
          siteId INTEGER NOT NULL,
          sensorType INTEGER NOT NULL,
          sensorIdStr TEXT NOT NULL,
          sensorSerialNo TEXT,
          sensorComments TEXT,
          paramName TEXT,
          paramUnit TEXT,
          modelId INTEGER,
          FOREIGN KEY (siteId) REFERENCES sites(id) ON DELETE CASCADE,
          UNIQUE(siteId, sensorIdStr)
        );
      `);

      // Step 5: Analog Sensor Table (sensor-specific config - as per guide)
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS analog_sensor_table (
          sensorId INTEGER PRIMARY KEY AUTOINCREMENT,
          sensorCommId INTEGER NOT NULL,
          vwStartFreq INTEGER DEFAULT 0,
          vwEndFreq INTEGER DEFAULT 0,
          noOfSteps INTEGER DEFAULT 0,
          noOfSample INTEGER DEFAULT 0,
          thermistorType INTEGER DEFAULT 0,
          tempUnits TEXT,
          paramName2 TEXT,
          paramUnit2 TEXT,
          FOREIGN KEY (sensorCommId) REFERENCES analog_sensor_comm_table(sensorCommId) ON DELETE CASCADE
        );
      `);

      // Keep old analog_sensors_new for backward compatibility
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS analog_sensors_new (
          sensorId INTEGER PRIMARY KEY AUTOINCREMENT,
          sensorCommId INTEGER NOT NULL,
          vwStartFreq INTEGER,
          vwEndFreq INTEGER,
          noOfSteps INTEGER,
          noOfSample INTEGER,
          thermistorType INTEGER,
          tempUnits TEXT,
          paramName2 TEXT,
          paramUnit2 TEXT,
          FOREIGN KEY (sensorCommId) REFERENCES analog_sensor_comm(sensorCommId) ON DELETE CASCADE
        );
      `);

      // Step 6: Sensor Coefficients Table (as per guide)
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS sensor_coeff_table (
          coeffId INTEGER PRIMARY KEY AUTOINCREMENT,
          sensorCommId INTEGER NOT NULL,
          coeffIndex INTEGER NOT NULL,
          coeff REAL NOT NULL,
          FOREIGN KEY (sensorCommId) REFERENCES analog_sensor_comm_table(sensorCommId) ON DELETE CASCADE
        );
      `);

      // Keep old sensor_coeff for backward compatibility
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS sensor_coeff (
          coeffId INTEGER PRIMARY KEY AUTOINCREMENT,
          sensorCommId INTEGER NOT NULL,
          coeffIndex INTEGER NOT NULL,
          coeff REAL NOT NULL,
          FOREIGN KEY (sensorCommId) REFERENCES analog_sensor_comm(sensorCommId) ON DELETE CASCADE,
          UNIQUE(sensorCommId, coeffIndex)
        );
      `);

      // Old sensor readings table (kept for migration)
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS sensor_readings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          site_id INTEGER NOT NULL,
          sensor_id INTEGER NOT NULL,
          timestamp INTEGER NOT NULL,
          reading_value REAL,
          temperature REAL,
          battery_voltage REAL,
          signal_strength INTEGER,
          downloaded_at INTEGER DEFAULT (strftime('%s', 'now')),
          FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
          FOREIGN KEY (sensor_id) REFERENCES analog_sensors(id) ON DELETE CASCADE
        );
      `);

      // New reading_data table (replaces sensor_readings)
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS reading_data (
          readingId INTEGER PRIMARY KEY AUTOINCREMENT,
          timestamp INTEGER NOT NULL,
          sensorCommId INTEGER NOT NULL,
          paraPos INTEGER NOT NULL,
          readingValue REAL NOT NULL,
          FOREIGN KEY (sensorCommId) REFERENCES analog_sensor_comm(sensorCommId) ON DELETE CASCADE
        );
      `);

      // System configuration table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS system_config (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          reading_avg INTEGER DEFAULT 1,
          scan_interval_hours INTEGER DEFAULT 0,
          scan_interval_mins INTEGER DEFAULT 5,
          scan_interval_secs INTEGER DEFAULT 0,
          start_scan_hours INTEGER DEFAULT 0,
          start_scan_mins INTEGER DEFAULT 0,
          last_site_id INTEGER,
          updated_at INTEGER DEFAULT (strftime('%s', 'now'))
        );
      `);

      // Insert default system config if not exists
      await this.db.execAsync(`
        INSERT OR IGNORE INTO system_config (id) VALUES (1);
      `);

      console.log('Database tables created successfully');
    } catch (error) {
      console.error('Error creating tables:', error);
      throw error;
    }
  }

  /**
   * Initialize default site if database is empty
   * This should be called on first app launch
   */
  async initializeDefaultData() {
    try {
      const sites = await this.getAllSites();
      if (sites.length === 0) {
        console.log('No sites found, creating Default Site...');
        const siteId = await this.addSite(DEFAULT_SITE_NAME, 'Default');
        console.log('Default site created with ID:', siteId);
        return siteId;
      } else {
        console.log('Sites already exist:', sites.length);
        // Return the first site ID (should be Default Site with siteId = 1)
        return sites[0].id;
      }
    } catch (error) {
      console.error('Error initializing default data:', error);
      throw error;
    }
  }

  /**
   * Ensure default site exists - checks and creates if needed
   */
  async ensureDefaultSite() {
    try {
      await this.ensureInitialized();
      
      // First check if it exists
      const defaultSite = await this.getSiteByName(DEFAULT_SITE_NAME);
      if (defaultSite) {
        console.log('✓ Default site already exists with ID:', defaultSite.id);
        return defaultSite.id;
      }
      
      // Not found - create it
      console.log('Default site not found, creating it...');
      
      // Try direct SQL first (most reliable)
      if (this.db) {
        try {
          const result = await this.db.runAsync(
            `INSERT INTO sites (name, comments) VALUES (?, ?)`,
            [DEFAULT_SITE_NAME, 'Default']
          );
          const siteId = result.lastInsertRowId;
          console.log('✓ Default site created via direct SQL, ID:', siteId);
          return siteId;
        } catch (sqlError) {
          if (sqlError.message.includes('UNIQUE') || sqlError.message.includes('already exists')) {
            // Site was created between check and insert, get it
            const existing = await this.getSiteByName(DEFAULT_SITE_NAME);
            if (existing) {
              console.log('✓ Default site found after UNIQUE error, ID:', existing.id);
              return existing.id;
            }
          }
          console.log('Direct SQL failed, trying addSite:', sqlError.message);
        }
      }
      
      // Fallback to addSite
      const siteId = await this.addSite(DEFAULT_SITE_NAME, 'Default');
      console.log('✓ Default site created via addSite, ID:', siteId);
      return siteId;
    } catch (error) {
      console.error('❌ Error ensuring default site:', error);
      console.error('Error details:', error.message, error.stack);
      // Try one more time to get it
      try {
        const existingSite = await this.getSiteByName(DEFAULT_SITE_NAME);
        if (existingSite) {
          console.log('✓ Found default site on retry, ID:', existingSite.id);
          return existingSite.id;
        }
      } catch (retryError) {
        console.error('Retry getSiteByName also failed:', retryError);
      }
      throw error;
    }
  }

  /**
   * NEW TABLE METHODS (as per guide)
   * These methods work with site_table, analog_sensor_comm_table, etc.
   */

  /**
   * Insert Site into site_table (new table)
   */
  async insertSiteToTable(siteName, comments = '') {
    await this.ensureInitialized();
    try {
      const result = await this.db.runAsync(
        'INSERT INTO site_table (siteName, comments) VALUES (?, ?)',
        [siteName, comments]
      );
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Error inserting site to site_table:', error);
      throw error;
    }
  }

  /**
   * Get All Site Names from site_table - ORDERED BY siteId (CRITICAL!)
   */
  async getAllSiteNames() {
    await this.ensureInitialized();
    try {
      const result = await this.db.getAllAsync(
        'SELECT siteName FROM site_table ORDER BY siteId'
      );
      return result.map(row => row.siteName);
    } catch (error) {
      console.error('Error getting all site names:', error);
      return [];
    }
  }

  /**
   * Get Site from site_table by name
   */
  async getSiteFromName(siteName) {
    await this.ensureInitialized();
    try {
      const result = await this.db.getFirstAsync(
        'SELECT * FROM site_table WHERE siteName = ?',
        [siteName]
      );
      if (result) {
        // Ensure both name and siteName fields are available for compatibility
        const name = result.siteName || result.name || '';
        return {
          ...result,
          name: name,  // Add name field for compatibility
          siteName: name
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting site from name:', error);
      return null;
    }
  }

  /**
   * Get Site from site_table by ID
   */
  async getSiteByIdFromTable(siteId) {
    await this.ensureInitialized();
    try {
      const result = await this.db.getFirstAsync(
        'SELECT * FROM site_table WHERE siteId = ?',
        [siteId]
      );
      if (result) {
        // Map to match expected format - ensure both name and siteName are available
        const siteName = result.siteName || result.name || '';
        return { 
          id: result.siteId, 
          name: siteName,  // Primary field for compatibility
          siteId: result.siteId, 
          siteName: siteName 
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting site by ID from table:', error);
      return null;
    }
  }

  /**
   * Insert Manufacturer
   */
  async insertMFR(mfrName, isActive = true) {
    await this.ensureInitialized();
    try {
      const result = await this.db.runAsync(
        'INSERT INTO mfr_table (mfrName, isActive) VALUES (?, ?)',
        [mfrName, isActive ? 1 : 0]
      );
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Error inserting manufacturer:', error);
      throw error;
    }
  }

  /**
   * Insert Analog Model
   */
  async insertAnalogModel(mfrId, sensorType, modelName, isActive = true, vwStartFreq = 0, vwEndFreq = 0, noOfSteps = 0, noOfSample = 0) {
    await this.ensureInitialized();
    try {
      const result = await this.db.runAsync(
        `INSERT INTO analog_model_table 
         (mfrId, sensorType, modelName, isActive, vwStartFreq, vwEndFreq, noOfSteps, noOfSample) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [mfrId, sensorType, modelName, isActive ? 1 : 0, vwStartFreq, vwEndFreq, noOfSteps, noOfSample]
      );
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Error inserting analog model:', error);
      throw error;
    }
  }

  /**
   * Get Model ID by Name
   */
  async getModelIdByName(modelName) {
    await this.ensureInitialized();
    try {
      const result = await this.db.getFirstAsync(
        'SELECT modelId FROM analog_model_table WHERE modelName = ?',
        [modelName]
      );
      if (result) {
        return result.modelId;
      }
      throw new Error(`Model ${modelName} not found`);
    } catch (error) {
      console.error('Error getting model ID by name:', error);
      throw error;
    }
  }

  /**
   * Insert Analog Sensor Communication to analog_sensor_comm_table
   */
  async insertAnalogSensorCommToTable(siteId, modelId, sensorType, sensorIdStr, paramName, paramUnit, sensorSerialNo = 'ER001', sensorComments = '') {
    await this.ensureInitialized();
    try {
      const result = await this.db.runAsync(
        `INSERT INTO analog_sensor_comm_table 
         (siteId, modelId, sensorType, sensorIdStr, paramName, paramUnit, sensorSerialNo, sensorComments) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [siteId, modelId, sensorType, sensorIdStr, paramName, paramUnit, sensorSerialNo, sensorComments]
      );
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Error inserting analog sensor comm:', error);
      throw error;
    }
  }

  /**
   * Insert Analog Sensor to analog_sensor_table
   */
  async insertAnalogSensorToTable(sensorCommId, vwStartFreq = 0, vwEndFreq = 0, noOfSteps = 0, noOfSample = 0, thermistorType = 0, tempUnits = null, paramName2 = null, paramUnit2 = null) {
    await this.ensureInitialized();
    try {
      const result = await this.db.runAsync(
        `INSERT INTO analog_sensor_table 
         (sensorCommId, vwStartFreq, vwEndFreq, noOfSteps, noOfSample, thermistorType, tempUnits, paramName2, paramUnit2) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [sensorCommId, vwStartFreq, vwEndFreq, noOfSteps, noOfSample, thermistorType, tempUnits, paramName2, paramUnit2]
      );
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Error inserting analog sensor:', error);
      throw error;
    }
  }

  /**
   * Insert Sensor Coefficient to sensor_coeff_table
   */
  async insertSensorCoeffToTable(sensorCommId, coeffIndex, coeff) {
    await this.ensureInitialized();
    try {
      await this.db.runAsync(
        'INSERT INTO sensor_coeff_table (sensorCommId, coeffIndex, coeff) VALUES (?, ?, ?)',
        [sensorCommId, coeffIndex, coeff]
      );
    } catch (error) {
      console.error('Error inserting sensor coefficient:', error);
      throw error;
    }
  }

  /**
   * Get Analog Sensor Names by Site ID from analog_sensor_comm_table
   */
  async getAnalogSensorNameBySiteId(siteId) {
    await this.ensureInitialized();
    try {
      const result = await this.db.getAllAsync(
        'SELECT sensorIdStr FROM analog_sensor_comm_table WHERE siteId = ?',
        [siteId]
      );
      return result.map(row => row.sensorIdStr);
    } catch (error) {
      console.error('Error getting analog sensor names by site ID:', error);
      return [];
    }
  }

  /**
   * Get Analog Sensor by Site ID and Sensor ID String from analog_sensor_comm_table
   */
  async getAnalogSensorBySiteIdAndSensorID(siteId, sensorIdStr) {
    await this.ensureInitialized();
    try {
      const result = await this.db.getFirstAsync(
        'SELECT * FROM analog_sensor_comm_table WHERE siteId = ? AND sensorIdStr = ?',
        [siteId, sensorIdStr]
      );
      return result || null;
    } catch (error) {
      console.error('Error getting analog sensor by site ID and sensor ID:', error);
      return null;
    }
  }

  /**
   * Get Sensor Coefficients Array from sensor_coeff_table
   */
  async getSensorCoeffArray(sensorCommId) {
    await this.ensureInitialized();
    try {
      const result = await this.db.getAllAsync(
        'SELECT coeff FROM sensor_coeff_table WHERE sensorCommId = ? ORDER BY coeffIndex',
        [sensorCommId]
      );
      return result.map(row => row.coeff);
    } catch (error) {
      console.error('Error getting sensor coefficient array:', error);
      return [];
    }
  }

  /**
   * Get Analog Child Sensor by Sensor Comm ID from analog_sensor_table
   */
  async getAnalogChildSensorBySensorID(sensorCommId) {
    await this.ensureInitialized();
    try {
      const result = await this.db.getFirstAsync(
        'SELECT * FROM analog_sensor_table WHERE sensorCommId = ?',
        [sensorCommId]
      );
      return result || null;
    } catch (error) {
      console.error('Error getting analog child sensor by sensor ID:', error);
      return null;
    }
  }

  /**
   * SITE OPERATIONS (old methods - kept for backward compatibility)
   */

  async getAllSites() {
    await this.ensureInitialized();
    try {
      if (!this.db) {
        console.error('Database not initialized in getAllSites');
        await this.initialize();
      }
      
      if (!this.db) {
        console.error('Database still not available after initialization attempt');
        return [];
      }
      
      // Query ALL sites ordered by siteId (id) - this ensures Default Site (id=1) is first
      let result;
      try {
        result = await this.db.getAllAsync(
          'SELECT * FROM sites ORDER BY id ASC'
        );
      } catch (orderError) {
        // If ORDER BY fails, try without it
        console.log('ORDER BY failed, trying without:', orderError.message);
        try {
          result = await this.db.getAllAsync('SELECT * FROM sites');
        } catch (queryError) {
          console.error('Query failed completely:', queryError.message);
          return [];
        }
      }
      
      console.log('getAllSites query result:', result ? result.length : 0, 'sites');
      if (result && result.length > 0) {
        console.log('Site names:', result.map(s => `${s.name || 'Unknown'} (ID: ${s.id})`));
      } else {
        console.warn('getAllSites returned empty array - no sites found in database');
        // Debug: Check if table exists and has any rows
        try {
          const tableCheck = await this.db.getFirstAsync(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='sites'"
          );
          if (tableCheck) {
            console.log('✓ sites table exists');
            const rowCount = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM sites');
            console.log('Rows in sites table:', rowCount ? rowCount.count : 0);
          } else {
            console.error('✗ sites table does NOT exist!');
          }
        } catch (debugError) {
          console.error('Debug query failed:', debugError.message);
        }
      }
      return result || [];
    } catch (error) {
      console.error('Error getting all sites:', error);
      console.error('Error details:', error.message, error.stack);
      return [];
    }
  }

  /**
   * Get all site names (for dropdowns)
   * Returns array of site names ordered by siteId
   */
  async getAllSiteNames() {
    await this.ensureInitialized();
    try {
      const sites = await this.getAllSites();
      return sites.map(site => site.name || `Site ${site.id}`);
    } catch (error) {
      console.error('Error getting site names:', error);
      return [];
    }
  }

  async getSiteById(id) {
    await this.ensureInitialized();
    try {
      const result = await this.db.getFirstAsync(
        'SELECT * FROM sites WHERE id = ?',
        [id]
      );
      return result;
    } catch (error) {
      console.error('Error getting site by id:', error);
      return null;
    }
  }

  async getDefaultSite() {
    await this.ensureInitialized();
    try {
      const result = await this.db.getFirstAsync(
        'SELECT * FROM sites WHERE name = ?',
        [DEFAULT_SITE_NAME]
      );
      return result;
    } catch (error) {
      console.error('Error getting default site:', error);
      return null;
    }
  }

  async getSiteByName(name) {
    await this.ensureInitialized();
    try {
      const result = await this.db.getFirstAsync(
        'SELECT * FROM sites WHERE name = ?',
        [name]
      );
      return result;
    } catch (error) {
      console.error('Error getting site by name:', error);
      return null;
    }
  }

  async addSite(name, comments = '') {
    await this.ensureInitialized();
    try {
      const result = await this.db.runAsync(
        'INSERT INTO sites (name, comments) VALUES (?, ?)',
        [name, comments]
      );
      return result.lastInsertRowId;
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        throw new Error('Site with this name already exists');
      }
      console.error('Error adding site:', error);
      throw error;
    }
  }

  async updateSite(id, name, comments) {
    await this.ensureInitialized();
    try {
      await this.db.runAsync(
        'UPDATE sites SET name = ?, comments = ?, updated_at = strftime(\'%s\', \'now\') WHERE id = ?',
        [name, comments, id]
      );
      return true;
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        throw new Error('Site with this name already exists');
      }
      console.error('Error updating site:', error);
      throw error;
    }
  }

  async deleteSite(id) {
    await this.ensureInitialized();
    try {
      await this.db.runAsync('DELETE FROM sites WHERE id = ?', [id]);
      return true;
    } catch (error) {
      console.error('Error deleting site:', error);
      throw error;
    }
  }

  /**
   * ANALOG SENSOR OPERATIONS
   */

  async getSensorsBySiteId(siteId) {
    await this.ensureInitialized();
    try {
      const result = await this.db.getAllAsync(
        'SELECT * FROM analog_sensors WHERE site_id = ? ORDER BY created_at DESC',
        [siteId]
      );
      return result || [];
    } catch (error) {
      console.error('Error getting sensors by site:', error);
      return [];
    }
  }

  async getActiveSensorsBySiteId(siteId) {
    await this.ensureInitialized();
    try {
      const result = await this.db.getAllAsync(
        'SELECT * FROM analog_sensors WHERE site_id = ? AND is_active = 1 ORDER BY created_at DESC',
        [siteId]
      );
      return result || [];
    } catch (error) {
      console.error('Error getting active sensors:', error);
      return [];
    }
  }

  async getSensorById(id) {
    await this.ensureInitialized();
    try {
      const result = await this.db.getFirstAsync(
        'SELECT * FROM analog_sensors WHERE id = ?',
        [id]
      );
      return result;
    } catch (error) {
      console.error('Error getting sensor by id:', error);
      return null;
    }
  }

  async getSensorBySiteAndSensorId(siteId, sensorId) {
    await this.ensureInitialized();
    try {
      const result = await this.db.getFirstAsync(
        'SELECT * FROM analog_sensors WHERE site_id = ? AND sensor_id = ?',
        [siteId, sensorId]
      );
      return result;
    } catch (error) {
      console.error('Error getting sensor:', error);
      return null;
    }
  }

  async addSensor(sensorData) {
    await this.ensureInitialized();
    try {
      const {
        siteId,
        sensorId,
        sensorType,
        manufacturer = '',
        model = '',
        serialNumber = '',
        calibrationFactor = 1.0,
        offset = 0.0,
        unit = '',
        locationNorth = '',
        locationEast = '',
        comments = '',
      } = sensorData;

      const result = await this.db.runAsync(
        `INSERT INTO analog_sensors (
          site_id, sensor_id, sensor_type, manufacturer, model, serial_number,
          calibration_factor, offset, unit, location_north, location_east, comments
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          siteId,
          sensorId,
          sensorType,
          manufacturer,
          model,
          serialNumber,
          calibrationFactor,
          offset,
          unit,
          locationNorth,
          locationEast,
          comments,
        ]
      );
      return result.lastInsertRowId;
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        throw new Error('Sensor with this ID already exists for this site');
      }
      console.error('Error adding sensor:', error);
      throw error;
    }
  }

  async updateSensor(id, sensorData) {
    await this.ensureInitialized();
    try {
      const {
        sensorId,
        sensorType,
        manufacturer,
        model,
        serialNumber,
        calibrationFactor,
        offset,
        unit,
        locationNorth,
        locationEast,
        comments,
      } = sensorData;

      await this.db.runAsync(
        `UPDATE analog_sensors SET 
          sensor_id = ?, sensor_type = ?, manufacturer = ?, model = ?, serial_number = ?,
          calibration_factor = ?, offset = ?, unit = ?, location_north = ?, location_east = ?,
          comments = ?, updated_at = strftime('%s', 'now')
        WHERE id = ?`,
        [
          sensorId,
          sensorType,
          manufacturer,
          model,
          serialNumber,
          calibrationFactor,
          offset,
          unit,
          locationNorth,
          locationEast,
          comments,
          id,
        ]
      );
      return true;
    } catch (error) {
      console.error('Error updating sensor:', error);
      throw error;
    }
  }

  async deleteSensor(id) {
    await this.ensureInitialized();
    try {
      await this.db.runAsync('DELETE FROM analog_sensors WHERE id = ?', [id]);
      return true;
    } catch (error) {
      console.error('Error deleting sensor:', error);
      throw error;
    }
  }

  async toggleSensorActive(id, isActive) {
    await this.ensureInitialized();
    try {
      await this.db.runAsync(
        'UPDATE analog_sensors SET is_active = ?, updated_at = strftime(\'%s\', \'now\') WHERE id = ?',
        [isActive ? 1 : 0, id]
      );
      return true;
    } catch (error) {
      console.error('Error toggling sensor active state:', error);
      throw error;
    }
  }

  /**
   * SENSOR READINGS OPERATIONS
   */

  async addReading(readingData) {
    await this.ensureInitialized();
    try {
      const {
        siteId,
        sensorId,
        timestamp,
        readingValue,
        temperature,
        batteryVoltage,
        signalStrength,
      } = readingData;

      const result = await this.db.runAsync(
        `INSERT INTO sensor_readings (
          site_id, sensor_id, timestamp, reading_value, temperature, battery_voltage, signal_strength
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [siteId, sensorId, timestamp, readingValue, temperature, batteryVoltage, signalStrength]
      );
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Error adding reading:', error);
      throw error;
    }
  }

  async getReadingsBySensorId(sensorId, limit = 100) {
    await this.ensureInitialized();
    try {
      const result = await this.db.getAllAsync(
        'SELECT * FROM sensor_readings WHERE sensor_id = ? ORDER BY timestamp DESC LIMIT ?',
        [sensorId, limit]
      );
      return result || [];
    } catch (error) {
      console.error('Error getting readings:', error);
      return [];
    }
  }

  async getReadingsBySiteId(siteId, limit = 100) {
    await this.ensureInitialized();
    try {
      const result = await this.db.getAllAsync(
        'SELECT * FROM sensor_readings WHERE site_id = ? ORDER BY timestamp DESC LIMIT ?',
        [siteId, limit]
      );
      return result || [];
    } catch (error) {
      console.error('Error getting readings by site:', error);
      return [];
    }
  }

  /**
   * SYSTEM CONFIGURATION OPERATIONS
   */

  async getSystemConfig() {
    await this.ensureInitialized();
    try {
      const result = await this.db.getFirstAsync('SELECT * FROM system_config WHERE id = 1');
      return result;
    } catch (error) {
      console.error('Error getting system config:', error);
      return null;
    }
  }

  async updateSystemConfig(config) {
    await this.ensureInitialized();
    try {
      const {
        readingAvg,
        scanIntervalHours,
        scanIntervalMins,
        scanIntervalSecs,
        startScanHours,
        startScanMins,
        lastSiteId,
      } = config;

      await this.db.runAsync(
        `UPDATE system_config SET 
          reading_avg = ?, scan_interval_hours = ?, scan_interval_mins = ?, scan_interval_secs = ?,
          start_scan_hours = ?, start_scan_mins = ?, last_site_id = ?, updated_at = strftime('%s', 'now')
        WHERE id = 1`,
        [
          readingAvg,
          scanIntervalHours,
          scanIntervalMins,
          scanIntervalSecs,
          startScanHours,
          startScanMins,
          lastSiteId,
        ]
      );
      return true;
    } catch (error) {
      console.error('Error updating system config:', error);
      throw error;
    }
  }

  /**
   * READING OPERATIONS
   */

  /**
   * Save a sensor reading
   */
  async saveReading(reading) {
    await this.ensureInitialized();
    try {
      const result = await this.db.runAsync(
        `INSERT INTO sensor_readings (site_id, sensor_id, timestamp, reading_value, temperature)
         VALUES (?, ?, ?, ?, ?)`,
        [
          reading.siteId,
          reading.sensorId,
          reading.timestamp,
          reading.value,
          reading.temperature
        ]
      );
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Error saving reading:', error);
      throw error;
    }
  }

  /**
   * Get readings for a specific sensor within a date range
   */
  async getReadingsBySensor(sensorId, startDate, endDate) {
    await this.ensureInitialized();
    try {
      const startTimestamp = startDate ? new Date(startDate).getTime() : 0;
      const endTimestamp = endDate ? new Date(endDate).getTime() : Date.now();

      const readings = await this.db.getAllAsync(
        `SELECT * FROM sensor_readings
         WHERE sensor_id = ? AND timestamp >= ? AND timestamp <= ?
         ORDER BY timestamp DESC`,
        [sensorId, startTimestamp, endTimestamp]
      );
      return readings;
    } catch (error) {
      console.error('Error getting readings:', error);
      throw error;
    }
  }

  /**
   * Get last saved reading for a sensor
   */
  async getLastReading(sensorId) {
    await this.ensureInitialized();
    try {
      const reading = await this.db.getFirstAsync(
        `SELECT * FROM sensor_readings
         WHERE sensor_id = ?
         ORDER BY timestamp DESC
         LIMIT 1`,
        [sensorId]
      );
      return reading;
    } catch (error) {
      console.error('Error getting last reading:', error);
      return null;
    }
  }

  /**
   * Update reference reading for a sensor
   */
  async updateReferenceReading(sensorId, referenceValue) {
    await this.ensureInitialized();
    try {
      // Store reference value in a new column or in sensor metadata
      // For now, we'll add it to the analog_sensors table comments field as JSON
      const sensor = await this.getSensorById(sensorId);
      if (!sensor) {
        throw new Error('Sensor not found');
      }

      let metadata = {};
      try {
        metadata = sensor.comments ? JSON.parse(sensor.comments) : {};
      } catch {
        metadata = {};
      }

      metadata.referenceValue = referenceValue;
      metadata.referenceTimestamp = Date.now();

      await this.db.runAsync(
        `UPDATE analog_sensors SET comments = ? WHERE id = ?`,
        [JSON.stringify(metadata), sensorId]
      );
      return true;
    } catch (error) {
      console.error('Error updating reference reading:', error);
      throw error;
    }
  }

  /**
   * Get reference reading for a sensor
   */
  async getReferenceReading(sensorId) {
    await this.ensureInitialized();
    try {
      const sensor = await this.getSensorById(sensorId);
      if (!sensor || !sensor.comments) {
        return null;
      }

      try {
        const metadata = JSON.parse(sensor.comments);
        return metadata.referenceValue || null;
      } catch {
        return null;
      }
    } catch (error) {
      console.error('Error getting reference reading:', error);
      return null;
    }
  }

  /**
   * Get sensor by ID
   */
  async getSensorById(sensorId) {
    await this.ensureInitialized();
    try {
      const sensor = await this.db.getFirstAsync(
        'SELECT * FROM analog_sensors WHERE id = ?',
        [sensorId]
      );
      return sensor;
    } catch (error) {
      console.error('Error getting sensor by ID:', error);
      return null;
    }
  }

  /**
   * Delete readings for a sensor
   */
  async deleteReadingsBySensor(sensorId) {
    await this.ensureInitialized();
    try {
      await this.db.runAsync(
        'DELETE FROM sensor_readings WHERE sensor_id = ?',
        [sensorId]
      );
      return true;
    } catch (error) {
      console.error('Error deleting readings:', error);
      throw error;
    }
  }

  /**
   * NEW GUIDE-BASED METHODS
   */

  /**
   * Get all site names
   */
  async getAllSiteNames() {
    await this.ensureInitialized();
    try {
      const sites = await this.db.getAllAsync('SELECT name FROM sites ORDER BY name');
      return sites.map(s => s.name);
    } catch (error) {
      console.error('Error getting site names:', error);
      return [];
    }
  }

  /**
   * Get site from name (alias for getSiteByName)
   */
  async getSiteFromName(siteName) {
    return await this.getSiteByName(siteName);
  }

  /**
   * Get analog sensor names by site ID
   */
  async getAnalogSensorNameBySiteId(siteId) {
    await this.ensureInitialized();
    try {
      const sensors = await this.db.getAllAsync(
        'SELECT sensorIdStr FROM analog_sensor_comm WHERE siteId = ? ORDER BY sensorIdStr',
        [siteId]
      );
      return sensors.map(s => s.sensorIdStr);
    } catch (error) {
      console.error('Error getting sensor names:', error);
      return [];
    }
  }

  /**
   * Get analog sensor by site ID and sensor ID string
   */
  async getAnalogSensorBySiteIdAndSensorID(siteId, sensorId) {
    await this.ensureInitialized();
    try {
      const result = await this.db.getFirstAsync(
        'SELECT * FROM analog_sensor_comm WHERE siteId = ? AND sensorIdStr = ?',
        [siteId, sensorId]
      );
      return result;
    } catch (error) {
      console.error('Error getting sensor by site and ID:', error);
      return null;
    }
  }

  /**
   * Get analog sensor by sensorCommId
   */
  async getAnalogSensorBySensorID(sensorCommId) {
    await this.ensureInitialized();
    try {
      const result = await this.db.getFirstAsync(
        'SELECT * FROM analog_sensor_comm WHERE sensorCommId = ?',
        [sensorCommId]
      );
      return result;
    } catch (error) {
      console.error('Error getting sensor by comm ID:', error);
      return null;
    }
  }

  /**
   * Get sensor coefficient array (6 or 12 coefficients)
   */
  async getSensorCoeffArray(sensorCommId) {
    await this.ensureInitialized();
    try {
      const coeffs = await this.db.getAllAsync(
        'SELECT coeffIndex, coeff FROM sensor_coeff WHERE sensorCommId = ? ORDER BY coeffIndex',
        [sensorCommId]
      );
      
      // Build array, filling missing indices with 0
      const maxIndex = Math.max(...coeffs.map(c => c.coeffIndex), -1);
      const coeffArray = new Array(maxIndex + 1).fill(0);
      
      coeffs.forEach(c => {
        coeffArray[c.coeffIndex] = c.coeff;
      });
      
      // Ensure at least 6 coefficients
      while (coeffArray.length < 6) {
        coeffArray.push(0);
      }
      
      return coeffArray;
    } catch (error) {
      console.error('Error getting sensor coefficients:', error);
      return [0, 0, 0, 0, 0, 0]; // Default 6 coefficients
    }
  }

  /**
   * Get analog child sensor (sensor-specific configuration) by sensorCommId
   */
  async getAnalogChildSensorBySensorID(sensorCommId) {
    await this.ensureInitialized();
    try {
      const result = await this.db.getFirstAsync(
        'SELECT * FROM analog_sensors_new WHERE sensorCommId = ?',
        [sensorCommId]
      );
      return result;
    } catch (error) {
      console.error('Error getting child sensor:', error);
      return null;
    }
  }

  /**
   * Get last reading for a sensor from reading_data table
   */
  async getLastReadingFromReadingData(sensorCommId, paraPos) {
    await this.ensureInitialized();
    try {
      const reading = await this.db.getFirstAsync(
        `SELECT * FROM reading_data WHERE sensorCommId = ? AND paraPos = ? ORDER BY timestamp DESC LIMIT 1`,
        [sensorCommId, paraPos]
      );
      return reading;
    } catch (error) {
      console.error('Error getting last reading from reading_data:', error);
      return null;
    }
  }

  /**
   * Insert reading avoiding duplicates
   * Checks for existing reading with same timestamp, sensorCommId, and paraPos
   */
  async insertAvoidDuplicate(timestamp, sensorCommId, paraPos, readingValue) {
    await this.ensureInitialized();
    try {
      // Check if duplicate exists
      const existing = await this.db.getFirstAsync(
        'SELECT readingId FROM reading_data WHERE timestamp = ? AND sensorCommId = ? AND paraPos = ?',
        [timestamp, sensorCommId, paraPos]
      );

      if (existing) {
        // Update existing reading
        await this.db.runAsync(
          'UPDATE reading_data SET readingValue = ? WHERE readingId = ?',
          [readingValue, existing.readingId]
        );
        return existing.readingId;
      } else {
        // Insert new reading
        const result = await this.db.runAsync(
          'INSERT INTO reading_data (timestamp, sensorCommId, paraPos, readingValue) VALUES (?, ?, ?, ?)',
          [timestamp, sensorCommId, paraPos, readingValue]
        );
        return result.lastInsertRowId;
      }
    } catch (error) {
      console.error('Error inserting reading:', error);
      throw error;
    }
  }

  /**
   * DATA MIGRATION
   */

  /**
   * Migrate data from old schema to new schema
   */
  async migrateData() {
    try {
      // Check if new schema tables exist (they should have been created in createTables)
      const migrationCheck = await this.db.getFirstAsync(
        'SELECT name FROM sqlite_master WHERE type="table" AND name="analog_sensor_comm"'
      );
      
      if (!migrationCheck) {
        console.log('New schema tables not found yet, migration will happen later');
        return;
      }

      // Check if migration already ran (check if any data exists in new tables)
      const existingNewData = await this.db.getFirstAsync(
        'SELECT sensorCommId FROM analog_sensor_comm LIMIT 1'
      );
      
      if (existingNewData) {
        console.log('Migration already completed, skipping');
        return;
      }

      // Check if old data exists
      const oldSensorsResult = await this.db.getAllAsync('SELECT * FROM analog_sensors');
      const oldSensors = oldSensorsResult || [];
      
      if (oldSensors.length === 0) {
        console.log('No old sensor data to migrate');
        return;
      }

      console.log(`Migrating ${oldSensors.length} sensors from old schema to new schema...`);

      // Migrate each sensor from analog_sensors to analog_sensor_comm + analog_sensors_new
      for (const oldSensor of oldSensors) {
        // Insert into analog_sensor_comm
        const commResult = await this.db.runAsync(
          `INSERT INTO analog_sensor_comm (siteId, sensorType, sensorIdStr, sensorSerialNo, sensorComments, paramName, paramUnit)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            oldSensor.site_id,
            oldSensor.sensor_type,
            oldSensor.sensor_id,
            oldSensor.serial_number || '',
            oldSensor.comments || '',
            'Parameter', // Default paramName
            oldSensor.unit || '',
          ]
        );

        const sensorCommId = commResult.lastInsertRowId;

        // Insert into analog_sensors_new (only if there's specific config needed)
        // For now, we'll create empty entry - sensor-specific fields will be populated when needed

        // Migrate calibration data to sensor_coeff
        // Convert calibration_factor and offset to 6 coefficients
        // Standard format: [offset, calibration_factor, 0, 0, 0, 0]
        const coeffs = [
          oldSensor.offset || 0.0,
          oldSensor.calibration_factor || 1.0,
          0.0,
          0.0,
          0.0,
          0.0,
        ];

        for (let i = 0; i < coeffs.length; i++) {
          await this.db.runAsync(
            `INSERT OR REPLACE INTO sensor_coeff (sensorCommId, coeffIndex, coeff)
             VALUES (?, ?, ?)`,
            [sensorCommId, i, coeffs[i]]
          );
        }
      }

      // Migrate sensor_readings to reading_data
      const oldReadings = await this.db.getAllAsync(
        'SELECT * FROM sensor_readings ORDER BY timestamp'
      );

      if (oldReadings.length > 0) {
        console.log(`Migrating ${oldReadings.length} readings...`);

        for (const oldReading of oldReadings) {
          // Find corresponding sensorCommId by matching old sensor
          const oldSensor = await this.db.getFirstAsync(
            'SELECT sensor_id, sensor_type FROM analog_sensors WHERE id = ?',
            [oldReading.sensor_id]
          );

          if (oldSensor) {
            // Find the migrated sensor in analog_sensor_comm
            const sensorComm = await this.db.getFirstAsync(
              'SELECT sensorCommId, sensorType FROM analog_sensor_comm WHERE siteId = ? AND sensorIdStr = ?',
              [oldReading.site_id, oldSensor.sensor_id]
            );

            if (sensorComm) {
              // Use sensorType as paraPos (will be properly mapped when READING_OFFSETS is implemented)
              const paraPos = sensorComm.sensorType || 0;

              // Insert main reading
              await this.db.runAsync(
                `INSERT INTO reading_data (timestamp, sensorCommId, paraPos, readingValue)
                 VALUES (?, ?, ?, ?)`,
                [
                  oldReading.timestamp,
                  sensorComm.sensorCommId,
                  paraPos,
                  oldReading.reading_value || 0,
                ]
              );

              // Insert temperature if available (only for sensors with temperature offsets)
              // This will be properly handled once READING_OFFSETS constants are available
              if (oldReading.temperature !== null && oldReading.temperature !== undefined) {
                // For now, store temp at paraPos + 1 (will be corrected with proper offset mapping)
                await this.db.runAsync(
                  `INSERT INTO reading_data (timestamp, sensorCommId, paraPos, readingValue)
                   VALUES (?, ?, ?, ?)`,
                  [
                    oldReading.timestamp,
                    sensorComm.sensorCommId,
                    paraPos + 1,
                    oldReading.temperature,
                  ]
                );
              }
            }
          }
        }
      }

      console.log('Migration completed successfully');
    } catch (error) {
      console.error('Error during migration:', error);
      // Don't throw - allow app to continue with new schema
    }
  }

  /**
   * UTILITY METHODS
   */

  async ensureInitialized() {
    if (!this.initialized) {
      try {
        await this.initialize();
      } catch (error) {
        console.error('Error in ensureInitialized:', error);
        // Don't throw - return even if initialization failed
        // This allows the app to continue with degraded functionality
      }
    }
  }

  /**
   * Get database instance (for direct access when needed)
   */
  getDbInstance() {
    return this.db;
  }

  async clearAllData() {
    await this.ensureInitialized();
    try {
      await this.db.execAsync('DELETE FROM sensor_readings');
      await this.db.execAsync('DELETE FROM analog_sensors');
      await this.db.execAsync('DELETE FROM sites');
      await this.initializeDefaultData();
      console.log('All data cleared');
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }

  async close() {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      this.initialized = false;
    }
  }
}

// Export singleton instance
const dbManager = new DatabaseManager();
export default dbManager;

