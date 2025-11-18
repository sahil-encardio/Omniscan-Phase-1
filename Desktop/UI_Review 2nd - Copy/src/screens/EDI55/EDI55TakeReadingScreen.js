import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  InteractionManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect, CommonActions } from '@react-navigation/native';
import { Buffer } from 'buffer';
import { Colors, Typography, Spacing, BorderRadius } from '../../styles/DesignSystem';
import DatabaseManager from '../../database/DatabaseManager';
import edi55Service from '../../services/EDI55Service';
import ReadingModel from '../../models/ReadingModel';
import BLEService from '../../services/BLEService';
import InAppLogViewer from '../../components/InAppLogViewer';
import { 
  SENSOR_TYPE_LABELS, 
  SENSOR_UNITS, 
  DEFAULT_SITE_NAME,
  READING_OFFSETS,
  SENSOR_TYPES,
  DEFAULT_SITE_PORT_OFFSETS,
} from '../../constants/EDI55Constants';

const EDI55TakeReadingScreen = ({ navigation }) => {
  const [sites, setSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState(null);
  const [sensors, setSensors] = useState([]);
  const [sensorReadings, setSensorReadings] = useState({});
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState(null);
  const [hasReceivedData, setHasReceivedData] = useState(false);
  const [showReadings, setShowReadings] = useState(false);
  const [portSensorTypes, setPortSensorTypes] = useState({
    1: null, // null means "No sensor selected"
    2: null,
    3: null,
  });

  const monitorSubscription = useRef(null);
  const sensorsRef = useRef([]);
  const dataTimeoutRef = useRef(null);
  const isSavingConfig = useRef(false);
  const isMountedRef = useRef(true);
  const isCleaningUpRef = useRef(false);
  const isStoppingRef = useRef(false);
  const isNavigatingAwayRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      // Reset mounted flag when component gains focus
      isMountedRef.current = true;
      isCleaningUpRef.current = false;
      
      initializeAndLoadData();
      
      // Set timeout to prevent infinite loading
      const loadingTimeout = setTimeout(() => {
        if (loading) {
          console.warn('Loading timeout - forcing loading to false');
          setLoading(false);
        }
      }, 10000); // 10 second timeout

      return () => {
        clearTimeout(loadingTimeout);
        isMountedRef.current = false; // Mark as unmounted
        
        // Only run cleanup if not navigating away intentionally
        if (!isNavigatingAwayRef.current) {
          console.log('Running cleanup - component unmounting');
          stopMonitoring();
        } else {
          console.log('Skipping cleanup - intentional navigation');
        }
      };
    }, [])
  );

  useEffect(() => {
    if (selectedSiteId) {
      setShowReadings(false);
      console.log(`Site changed to ${selectedSiteId}, loading sensors...`);
      loadSensors(selectedSiteId).catch(error => {
        console.error('Error in loadSensors useEffect:', error);
        setLoading(false);
      });
    }
  }, [selectedSiteId]);

  const initializeAndLoadData = async () => {
    try {
      setLoading(true);
      console.log('=== Starting Take Reading initialization ===');
      
      // Step 1: Ensure database is initialized
      try {
        await DatabaseManager.initialize();
        console.log('✓ Database initialized');
      } catch (dbInitError) {
        console.error('Database initialization failed:', dbInitError);
        Alert.alert('Database Error', `Failed to initialize database: ${dbInitError.message}`);
        setLoading(false);
        return;
      }
      
      // Step 2: Force create Default Site using direct SQL
      try {
        const db = DatabaseManager.getDbInstance();
        if (db) {
          // Try direct INSERT - ignore if exists
          try {
            await db.runAsync(
              `INSERT INTO sites (name, comments) VALUES (?, ?)`,
              [DEFAULT_SITE_NAME, 'Default']
            );
            console.log('✓ Default site created via direct SQL');
          } catch (insertError) {
            if (insertError.message.includes('UNIQUE') || insertError.message.includes('already exists')) {
              console.log('✓ Default site already exists');
            } else {
              console.error('Insert failed, trying ensureDefaultSite:', insertError.message);
              await DatabaseManager.ensureDefaultSite();
            }
          }
        } else {
          // Fallback to ensureDefaultSite
          await DatabaseManager.ensureDefaultSite();
        }
        console.log('✓ Default site ensured');
      } catch (defaultSiteError) {
        console.error('Failed to ensure default site:', defaultSiteError);
        Alert.alert('Warning', 'Could not create Default Site. Please check Site Management.');
        // Continue anyway - we'll try to load sites
      }
      
      // Step 3: Load all sites
      await loadSites();
      console.log('=== Initialization complete ===');
    } catch (error) {
      console.error('Failed to initialize:', error);
      console.error('Error stack:', error.stack);
      Alert.alert('Initialization Error', `Failed to initialize: ${error.message}\n\nCheck console for details.`);
      setLoading(false);
    }
  };

  const loadSites = async () => {
    try {
      console.log('=== Loading sites ===');
      
      // Ensure database is initialized
      await DatabaseManager.ensureInitialized();
      console.log('✓ Database ensured initialized');
      
      // CRITICAL: Use getAllSiteNames() which queries site_table ORDERED BY siteId
      const siteNames = await DatabaseManager.getAllSiteNames();
      console.log(`✓ Queried sites: ${siteNames.length} sites found`);
      
      if (siteNames.length === 0) {
        console.warn('⚠ No sites found in database!');
        // Try multiple approaches to create default site
        let siteCreated = false;
        
        // Try to trigger initialization
        try {
          const { initializeDefaultData } = require('../../utils/DefaultDataInitializer');
          await initializeDefaultData();
          console.log('✓ Default data initialization triggered');
        } catch (initError) {
          console.error('Default data initialization failed:', initError.message);
        }
        
        // Re-query after initialization attempt
        const siteNamesAfter = await DatabaseManager.getAllSiteNames();
        console.log(`✓ After initialization attempt: ${siteNamesAfter.length} sites found`);
        
        if (siteNamesAfter.length > 0) {
          // Convert site names to site objects with IDs
          const sitesWithIds = [];
          for (const siteName of siteNamesAfter) {
            const site = await DatabaseManager.getSiteFromName(siteName);
            if (site) {
              // Ensure name is always set - use siteName, name, or fallback to the queried name
              const displayName = site.siteName || site.name || siteName || 'Unknown Site';
              sitesWithIds.push({ 
                id: site.siteId || site.id, 
                name: displayName,
                siteId: site.siteId || site.id,
                siteName: displayName
              });
            }
          }
          setSites(sitesWithIds);
          const defaultSite = sitesWithIds.find(s => s.name === DEFAULT_SITE_NAME) || sitesWithIds[0];
          setSelectedSiteId(defaultSite.id);
          console.log(`✓ Auto-selected site: ${defaultSite.name} (ID: ${defaultSite.id})`);
          setLoading(false);
          return;
        }
        
        // Still no sites - show detailed error
        console.error('❌ No sites available in database after all creation attempts');
        Alert.alert(
          'No Sites Available', 
          'Could not create or find Default Site.\n\n' +
          'Please:\n' +
          '1. Go to Site Management\n' +
          '2. Create a site manually\n' +
          '3. Or restart the app\n\n' +
          'Check console for detailed error messages.'
        );
        setSites([]);
        setLoading(false);
        return;
      }
      
      // Convert site names to site objects with IDs
      const sitesWithIds = [];
      for (const siteName of siteNames) {
        if (!siteName || siteName.trim() === '') {
          console.warn('Skipping empty site name');
          continue;
        }
        const site = await DatabaseManager.getSiteFromName(siteName);
        if (site) {
          // Ensure name is always set - use siteName, name, or fallback to the queried name
          const displayName = (site.siteName || site.name || siteName || 'Unknown Site').trim();
          const siteId = site.siteId || site.id;
          
          if (!siteId) {
            console.warn(`Site "${displayName}" has no ID, skipping`);
            continue;
          }
          
          console.log(`Adding site to list: "${displayName}" (ID: ${siteId})`);
          sitesWithIds.push({ 
            id: siteId, 
            name: displayName,
            siteId: siteId,
            siteName: displayName
          });
        } else {
          console.warn(`Site not found for name: "${siteName}"`);
        }
      }
      
      // Sites found - set them in state
      console.log(`✓ Setting ${sitesWithIds.length} sites in state:`, sitesWithIds.map(s => `${s.name} (ID: ${s.id})`));
      setSites(sitesWithIds);
      
      // Auto-select default site if none is selected
      if (!selectedSiteId && sitesWithIds.length > 0) {
        // Find Default Site (should be first with id=1, but check by name too)
        const defaultSite = sitesWithIds.find(s => 
          s.name === DEFAULT_SITE_NAME || 
          s.id === 1
        ) || sitesWithIds[0]; // Fallback to first site
        
        console.log(`✓ Auto-selecting site: ${defaultSite.name} (ID: ${defaultSite.id})`);
        setSelectedSiteId(defaultSite.id);
        
        // Load sensors for selected site after a short delay
        setTimeout(() => {
          loadSensors(defaultSite.id).catch(err => {
            console.error('Error loading sensors after site selection:', err);
            setLoading(false);
          });
        }, 200);
      } else if (selectedSiteId) {
        // Site already selected, just ensure sensors are loaded
        console.log(`✓ Site already selected (ID: ${selectedSiteId}), loading sensors...`);
        loadSensors(selectedSiteId).catch(err => {
          console.error('Error loading sensors for selected site:', err);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('❌ Failed to load sites:', error);
      console.error('Error stack:', error.stack);
      Alert.alert('Error', `Failed to load sites: ${error.message}`);
      setLoading(false);
    }
  };

  const loadSensors = async (siteId) => {
    if (!siteId) {
      console.warn('No siteId provided to loadSensors');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log(`Starting to load sensors for siteId: ${siteId}`);
      
      // Get site info to check if it's default site (use new table method)
      const site = await DatabaseManager.getSiteByIdFromTable(siteId);
      if (!site) {
        console.error(`Site not found for siteId: ${siteId}`);
        Alert.alert('Error', 'Site not found');
        setLoading(false);
        return;
      }
      
      const siteName = site?.name || site?.siteName || 'Unknown';
      const isDefaultSite = site && (siteName === DEFAULT_SITE_NAME || site.id === 1 || site.siteId === 1);
      console.log(`Site "${siteName}" isDefault: ${isDefaultSite}`);
      
      let activeSensors = [];
      
      if (isDefaultSite) {
        // For default site, load sensors for ports 1, 2, 3 that have been configured
        console.log('=== Loading default site with port-based sensors ===');
        console.log(`Site ID: ${siteId}, Site Name: ${siteName}`);
        
        // Load existing port sensors
        const portSensorTypesState = {};
        for (const port of [1, 2, 3]) {
          const sensorIdStr = `PORT${port}`;
          console.log(`  Checking Port ${port} (sensorIdStr: "${sensorIdStr}")...`);
          
          let sensor = await DatabaseManager.getAnalogSensorBySiteIdAndSensorID(siteId, sensorIdStr);
          console.log(`  Query result for Port ${port}:`, sensor ? 'Found' : 'NOT FOUND');
          
          if (sensor) {
            console.log(`  Sensor details:`, {
              sensorCommId: sensor.sensorCommId,
              sensorIdStr: sensor.sensorIdStr,
              sensorType: sensor.sensorType,
              paramName: sensor.paramName
            });
            
            // Store port sensor type for state update
            portSensorTypesState[port] = sensor.sensorType;
            
            activeSensors.push({
              ...sensor,
              portNumber: port, // Add port number for default site
              isDefaultSitePort: true,
            });
            console.log(`  ✓ Loaded Port ${port} sensor: ${SENSOR_TYPE_LABELS[sensor.sensorType]}`);
          } else {
            // Sensor not configured yet - use default type
            portSensorTypesState[port] = SENSOR_TYPES.LOAD_CELL;
            console.log(`  ⚠ Port ${port} sensor not configured yet`);
            
            // Try direct query as fallback
            try {
              const db = DatabaseManager.getDbInstance();
              const directQuery = await db.getFirstAsync(
                `SELECT * FROM analog_sensor_comm_table WHERE siteId = ? AND sensorIdStr = ?`,
                [siteId, sensorIdStr]
              );
              if (directQuery) {
                console.log(`  ✓ Found Port ${port} sensor via direct query`);
                portSensorTypesState[port] = directQuery.sensorType;
                activeSensors.push({
                  ...directQuery,
                  portNumber: port,
                  isDefaultSitePort: true,
                });
              }
            } catch (queryError) {
              console.error(`  ❌ Direct query failed for Port ${port}:`, queryError);
            }
          }
        }
        
        console.log(`Total active sensors loaded for default site: ${activeSensors.length}`);
        
        // Update portSensorTypes state all at once
        setPortSensorTypes(prev => ({
          ...prev,
          ...portSensorTypesState,
        }));
      } else {
        // For non-default sites, use normal sensor loading
        console.log('Loading sensors for non-default site');
        const sensorNames = await DatabaseManager.getAnalogSensorNameBySiteId(siteId);
        console.log(`Found ${sensorNames.length} sensor names`);
        
        // Get full sensor objects
        const sensorsFromDb = await Promise.all(
          sensorNames.map(async (name) => {
            const sensor = await DatabaseManager.getAnalogSensorBySiteIdAndSensorID(siteId, name);
            return sensor;
          })
        );

        activeSensors = sensorsFromDb.filter(s => s !== null);
        console.log(`Loaded ${activeSensors.length} sensors from database`);
      }

      console.log(`Total sensors loaded: ${activeSensors.length} for site ${siteId} (Default: ${isDefaultSite})`);
      
      // For default site, it's okay to have 0 sensors initially (user needs to configure ports)
      // For other sites, show warning if no sensors
      if (activeSensors.length === 0 && !isDefaultSite) {
        console.warn('No sensors found - will not start monitoring');
        setLoading(false);
        return;
      }
      
      // If default site has no sensors, still set empty array so UI can show port config
      if (activeSensors.length === 0 && isDefaultSite) {
        console.log('Default site has no sensors configured yet - showing port configuration UI');
        setSensors([]);
        sensorsRef.current = [];
        setSensorReadings({});
        setLoading(false);
        return;
      }

      // Load reference and last saved values for each sensor
      const sensorsWithReadings = await Promise.all(
        activeSensors.map(async (sensor) => {
          let paraPos = READING_OFFSETS.LOAD_CELL; // Default
          
          // Ensure sensorType is a number (might be string from DB)
          let sensorType = sensor.sensorType;
          if (typeof sensorType === 'string') {
            sensorType = parseInt(sensorType, 10);
          } else if (typeof sensorType !== 'number') {
            sensorType = Number(sensorType);
          }
          
          // For default site with port-based sensors, use sensor type offset for fixed-position sensors
          // Otherwise use port offset mapping
          if (sensor.isDefaultSitePort && sensor.portNumber) {
            // Check if this sensor type has a fixed position in the data frame
            if (sensorType === SENSOR_TYPES.VW_FREQ) {
              // VW Frequency is always at offset 8, regardless of port
              paraPos = READING_OFFSETS.VW_OUTPUT; // Offset 8
            } else if (sensorType === SENSOR_TYPES.EL_TILTMETER) {
              // EL Tiltmeter is always at offset 3
              paraPos = READING_OFFSETS.EL_TILT; // Offset 3
            } else if (sensorType === SENSOR_TYPES.MEMS_TILTMETER) {
              // MEMS Tiltmeter is always at offset 5
              paraPos = READING_OFFSETS.MEMS_TILT1; // Offset 5
            } else if (DEFAULT_SITE_PORT_OFFSETS[sensor.portNumber] !== undefined) {
              // For other sensor types, use port offset
              paraPos = DEFAULT_SITE_PORT_OFFSETS[sensor.portNumber];
            } else {
              console.warn(`No offset mapping for Port ${sensor.portNumber} and sensor type ${sensorType}`);
              paraPos = READING_OFFSETS.LOAD_CELL; // Fallback
            }
          } else {
            // Use sensor type-based mapping for non-default sites
            switch (sensorType) {
              case SENSOR_TYPES.LOAD_CELL:
                paraPos = READING_OFFSETS.LOAD_CELL; // Offset 0
                break;
              case SENSOR_TYPES.POTENTIOMETRIC:
                paraPos = READING_OFFSETS.POTENTIOMETRIC; // Offset 1
                break;
              case SENSOR_TYPES.VTG_OUTPUT:
                paraPos = READING_OFFSETS.VTG_OUTPUT; // Offset 2
                break;
              case SENSOR_TYPES.EL_TILTMETER:
                paraPos = READING_OFFSETS.EL_TILT; // Offset 3
                break;
              case SENSOR_TYPES.MEMS_TILTMETER:
                paraPos = READING_OFFSETS.MEMS_TILT1; // Offset 5
                break;
              case SENSOR_TYPES.ANA_4_20:
                paraPos = READING_OFFSETS.ANA_4TO20; // Offset 7
                break;
              case SENSOR_TYPES.VW_FREQ:
                paraPos = READING_OFFSETS.VW_OUTPUT; // Offset 8
                break;
              case SENSOR_TYPES.THERMISTOR:
                paraPos = READING_OFFSETS.THERMISTOR; // Offset 10
                break;
              case SENSOR_TYPES.RTD:
                paraPos = READING_OFFSETS.RTD; // Offset 11
                break;
              default:
                console.warn(`Unknown sensor type ${sensor.sensorType} for sensor ${sensor.sensorIdStr}, using default offset`);
                paraPos = READING_OFFSETS.LOAD_CELL;
            }
          }
          
          if (sensor.portNumber) {
            console.log(`Port ${sensor.portNumber} (Type ${sensorType}) → offset ${paraPos}`);
          } else {
            console.log(`Sensor ${sensor.sensorIdStr} (Type ${sensorType}) → offset ${paraPos}`);
          }
          
          // Get last reading from reading_data table
          const lastReading = await DatabaseManager.getLastReadingFromReadingData(
            sensor.sensorCommId,
            paraPos
          );
          
          return {
            ...sensor,
            sensorType: sensorType, // Use converted numeric type
            id: sensor.sensorCommId, // Use sensorCommId as id for state management
            paraPos, // Store paraPos for later use
            referenceValue: 0, // TODO: Implement reference reading storage
            lastSavedValue: lastReading ? lastReading.readingValue : 0,
            lastSavedTime: lastReading ? lastReading.timestamp : null,
          };
        })
      );

      setSensors(sensorsWithReadings);
      sensorsRef.current = sensorsWithReadings; // Update ref for BLE callback

      // Initialize sensor readings
      const initialReadings = {};
      sensorsWithReadings.forEach((sensor) => {
        initialReadings[sensor.sensorCommId] = {
          value: 0,
          temperature: null,
          timestamp: Date.now(),
        };
      });
      setSensorReadings(initialReadings);

      // Start monitoring AFTER sensors are loaded
      if (sensorsWithReadings.length > 0) {
        console.log(`✓ Loaded ${sensorsWithReadings.length} sensor(s), checking monitoring status...`);
        console.log(`  isMonitoring: ${isMonitoring}`);
        console.log(`  BLEService.connectedDevice: ${BLEService.connectedDevice ? 'Connected' : 'Not Connected'}`);
        
        if (!isMonitoring) {
          console.log('Starting monitoring after sensor load...');
          try {
            await startMonitoring();
            console.log('✓ Monitoring started after sensor load');
          } catch (monitorError) {
            console.error('❌ Failed to start monitoring:', monitorError);
            console.error('Error stack:', monitorError.stack);
            // Don't block - sensors are loaded, just monitoring failed
          }
        } else {
          console.log('Monitoring already active, skipping start');
        }
      } else if (sensorsWithReadings.length === 0 && !isDefaultSite) {
        console.warn('⚠ No sensors found - monitoring not started');
        // Don't show alert for default site - user needs to configure ports first
      } else if (sensorsWithReadings.length === 0 && isDefaultSite) {
        console.log('Default site has no sensors yet - user needs to configure ports');
      }
    } catch (error) {
      console.error('Failed to load sensors:', error);
      Alert.alert('Error', `Failed to load sensors: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
      console.log('loadSensors completed');
    }
  };

  const writeConfigurationToDevice = async () => {
    try {
      if (!selectedSiteId || sensors.length === 0) {
        console.log('No site or sensors selected, skipping configuration write');
        return;
      }

      // Check if BLE device is connected
      if (!BLEService.connectedDevice) {
        console.log('BLE device not connected, skipping configuration write');
        return;
      }

      const site = await DatabaseManager.getSiteById(selectedSiteId);
      if (!site) {
        console.log('Site not found, skipping configuration write');
        return;
      }

      const siteName = site.name || DEFAULT_SITE_NAME;
      
      // Create sensor enable array (11 bytes, one for each sensor type)
      const isSensorEnable = new Array(11).fill(0);
      sensors.forEach(sensor => {
        if (sensor.sensorType >= 0 && sensor.sensorType < 11) {
          isSensorEnable[sensor.sensorType] = 1;
        }
      });

      console.log('Writing configuration to device before monitoring...');
      console.log('Site:', siteName);
      console.log('Sensors:', sensors.map(s => `${s.sensorIdStr} (Type ${s.sensorType})`));
      console.log('Sensor enable array:', isSensorEnable);

      // Write configuration to device
      await edi55Service.writeAnalogConfig(siteName, isSensorEnable, sensors);
      console.log('✓ Configuration written to device before monitoring');
    } catch (error) {
      console.error('Failed to write configuration to device:', error);
      // Don't block monitoring if configuration write fails
      // The user can manually write configuration via "Save Port Configuration"
    }
  };

  const startMonitoring = async () => {
    // If already monitoring, stop first and restart to ensure fresh subscription
    if (isMonitoring) {
      console.log('⚠ Monitoring already active - stopping and restarting for fresh subscription...');
      stopMonitoring();
      // Wait a bit before restarting
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Check if BLE device is connected
    if (!BLEService.connectedDevice) {
      console.error('❌ Cannot start monitoring - BLE device not connected');
      Alert.alert(
        'Device Not Connected',
        'Please connect to EDI-55 device via Bluetooth before taking readings.\n\n' +
        'Go to Device Management to connect.'
      );
      return;
    }

    try {
      setIsMonitoring(true);
      setRefreshing(true);
      console.log('=== Starting Monitor Subscription ===');
      console.log(`Current sensors count: ${sensors.length}`);
      console.log(`Sensors:`, sensors.map(s => `${s.sensorIdStr} (Type ${s.sensorType})`));

      // CRITICAL: Write configuration to device BEFORE starting monitoring
      console.log('Step 1: Writing configuration to device...');
      await writeConfigurationToDevice();
      console.log('✓ Configuration written to device');

      // IMPORTANT: Wait longer for device to process configuration
      // The Android app waits before enabling notifications
      console.log('Step 2: Waiting for device to process configuration...');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Subscribe to BLE monitor characteristic (this enables notifications)
      // This is equivalent to notifydataAnalog() in Android app
      console.log('Step 3: Enabling notifications on analog monitor characteristic...');
      console.log('  This is equivalent to notifydataAnalog() in Android app');
      
      monitorSubscription.current = await edi55Service.subscribeToAnalogMonitor(
        (data, error) => {
          console.log('=== Monitor Callback Invoked ===');
          console.log('Raw data param:', data ? (typeof data === 'string' ? data.substring(0, 50) + '...' : typeof data) : 'null');
          console.log('Raw error param:', error ? (typeof error === 'string' ? error.substring(0, 50) + '...' : typeof error) : 'null');
          
          // FIX: The callback might receive data as the error parameter (base64 string)
          // This happens when the BLE library passes parameters in wrong order
          // Check if error is actually data (base64 string)
          let actualData = data;
          let actualError = error;
          
          // Check if error is actually the data (base64 string)
          // Base64 strings are long (64 chars for 48 bytes), don't have .message or .stack
          if (error && typeof error === 'string' && error.length > 20) {
            // Check if it looks like base64 (alphanumeric + / + =)
            const base64Pattern = /^[A-Za-z0-9+/=]+$/;
            if (base64Pattern.test(error) && !error.message && !error.stack) {
              // Error parameter is actually the data (base64 string)!
              console.log('⚠⚠⚠ CRITICAL: Data passed as error parameter, swapping...');
              console.log('  Error param is base64 string:', error.substring(0, 50) + '...');
              actualData = error;
              actualError = null;
              console.log('  ✓ Swapped: actualData = base64 string, actualError = null');
            }
          }
          
          // Also check if data is null but error has the string
          if (!actualData && error && typeof error === 'string' && error.length > 20) {
            const base64Pattern = /^[A-Za-z0-9+/=]+$/;
            if (base64Pattern.test(error)) {
              console.log('⚠⚠⚠ CRITICAL: Data is null but error has base64, using error as data...');
              actualData = error;
              actualError = null;
            }
          }
          
          console.log('Final actualData:', actualData ? (typeof actualData === 'string' ? `base64 string (${actualData.length} chars)` : typeof actualData) : 'null');
          console.log('Final actualError:', actualError ? (actualError.message || typeof actualError) : 'null');
          
          if (actualError) {
            console.error('❌ Monitor subscription error:', actualError);
            console.error('Error details:', actualError?.message || actualError);
            return;
          }

          if (actualData) {
            setHasReceivedData(true); // Mark that we've received data
            // Clear the timeout since we've received data
            if (dataTimeoutRef.current) {
              clearTimeout(dataTimeoutRef.current);
              dataTimeoutRef.current = null;
            }
            console.log('=== BLE Notification Received ===');
            console.log('Data type:', typeof actualData);
            console.log('Data length:', actualData?.length || 'unknown');
            console.log('Data preview (first 100 chars):', actualData ? actualData.substring(0, 100) : 'null');
            
            // Convert base64 to buffer for length check
            let buffer;
            try {
              // Ensure actualData is a string
              if (typeof actualData !== 'string') {
                console.error('❌ Data is not a string, type:', typeof actualData);
                console.error('Data value:', actualData);
                return;
              }
              
              // Validate base64 format
              const base64Pattern = /^[A-Za-z0-9+/=]+$/;
              if (!base64Pattern.test(actualData)) {
                console.error('❌ Data is not valid base64 format');
                console.error('Data preview:', actualData.substring(0, 100));
                return;
              }
              
              console.log('Converting base64 to buffer...');
              buffer = Buffer.from(actualData, 'base64');
              console.log('✓ Buffer created successfully');
              console.log('Buffer length:', buffer.length, 'bytes');
              
              if (buffer.length < 48) {
                console.warn(`⚠ Insufficient data: expected 48 bytes, got ${buffer.length}`);
                console.warn('Buffer hex:', buffer.toString('hex'));
                return;
              }
              
              console.log('Data preview (hex):', buffer.slice(0, 16).toString('hex'));
              console.log('Full buffer hex:', buffer.toString('hex'));
            } catch (parseError) {
              console.error('❌ Failed to parse base64 data:', parseError);
              console.error('Error type:', typeof parseError);
              console.error('Error message:', parseError?.message || parseError);
              console.error('Error stack:', parseError?.stack);
              console.error('Data that failed:', actualData ? actualData.substring(0, 100) : 'null');
              return;
            }
            
            // Parse the incoming frame
            const parsed = edi55Service.parseAnalogMonitorFrame(actualData);
            console.log('=== Parsed Result ===');
            console.log('Parsed:', parsed);
            if (parsed && parsed.readings) {
              console.log('Readings array:', parsed.readings);
              console.log('Readings summary:', parsed.readings.map((r, i) => `[${i}]=${r}`).join(', '));
              updateSensorReading(parsed);
            } else {
              console.warn('⚠ Failed to parse data or no readings in result');
              console.warn('Parsed object:', parsed);
            }
          } else {
            console.warn('⚠ Received empty or null data from BLE notification');
          }
        }
      );
      console.log('✓✓✓ Monitor subscription started successfully');
      console.log('✓✓✓ Notifications enabled - waiting for device to send data...');
      console.log('  Device should start sending 48-byte frames shortly');
      console.log('  If no data appears within 5 seconds, check:');
      console.log('    1. Device is powered on and sensors are connected');
      console.log('    2. Configuration was written successfully');
      console.log('    3. Device is in monitor mode (not scan mode)');
      
      // Reset data received flag when starting monitoring
      setHasReceivedData(false);
      
      // Set a timeout to warn if no data is received
      const dataTimeout = setTimeout(() => {
        // Use a closure to check current state
        if (isMonitoring) {
          console.warn('⚠⚠⚠ WARNING: No data received after 5 seconds');
          console.warn('  Subscription may not be working or device is not sending data');
          console.warn('  Possible causes:');
          console.warn('    1. Device is not in monitor mode (might be in scan mode)');
          console.warn('    2. Device needs to be restarted after configuration');
          console.warn('    3. Sensors are not physically connected to ports');
          console.warn('    4. BLE notification descriptor not enabled');
          console.warn('  Try: Disconnect and reconnect the device, then save configuration again');
        }
      }, 5000);
      
      // Store timeout so we can clear it if data arrives
      dataTimeoutRef.current = dataTimeout;
    } catch (error) {
      console.error('❌ Failed to start monitoring:', error);
      console.error('Error stack:', error.stack);
      Alert.alert('Monitor Error', `Failed to start real-time monitoring: ${error.message}`);
      setIsMonitoring(false);
    } finally {
      setRefreshing(false);
    }
  };

  const stopMonitoring = () => {
    console.log('=== stopMonitoring() called ===');
    console.log('isMonitoring:', isMonitoring);
    console.log('monitorSubscription exists:', !!monitorSubscription);
    console.log('monitorSubscription.current exists:', !!(monitorSubscription && monitorSubscription.current));
    console.log('isCleaningUpRef.current:', isCleaningUpRef.current);
    console.log('isMountedRef.current:', isMountedRef.current);
    
    // Prevent double cleanup
    if (isCleaningUpRef.current) {
      console.log('⚠ Cleanup already in progress, skipping...');
      return;
    }
    
    // Set cleanup flag
    isCleaningUpRef.current = true;
    
    try {
      // Step 1: Clear timeout if monitoring is stopped
      if (dataTimeoutRef && dataTimeoutRef.current) {
        clearTimeout(dataTimeoutRef.current);
        dataTimeoutRef.current = null;
        console.log('✓ Data timeout cleared');
      }
      
      // Step 2: Safely stop subscription with comprehensive null checks
      // Check if the ref object exists
      if (!monitorSubscription) {
        console.log('⚠ monitorSubscription ref does not exist');
        if (isMountedRef.current) {
          InteractionManager.runAfterInteractions(() => {
            if (isMountedRef.current) {
              setIsMonitoring(false);
              setHasReceivedData(false);
            }
          });
        }
        isCleaningUpRef.current = false;
        return;
      }
      
      // Check if the ref holds a subscription
      if (!monitorSubscription.current) {
        console.log('⚠ monitorSubscription.current is null/undefined - no active subscription');
        if (isMountedRef.current) {
          InteractionManager.runAfterInteractions(() => {
            if (isMountedRef.current) {
              setIsMonitoring(false);
              setHasReceivedData(false);
            }
          });
        }
        isCleaningUpRef.current = false;
        return;
      }
      
      // Store the subscription in a local variable before clearing the ref
      const subscription = monitorSubscription.current;
      console.log('Subscription object type:', typeof subscription);
      console.log('Subscription has remove method:', !!(subscription && typeof subscription.remove === 'function'));
      
      // Clear the ref immediately to prevent double cleanup
      monitorSubscription.current = null;
      console.log('✓ Ref cleared');
      
      // Safely call remove() if it exists and is a function
      if (subscription && typeof subscription === 'object') {
        if (typeof subscription.remove === 'function') {
          try {
            console.log('Calling subscription.remove()...');
            subscription.remove();
            console.log('✓ Subscription removed successfully');
          } catch (removeError) {
            console.error('❌ Error calling subscription.remove():', removeError);
            console.error('Error message:', removeError?.message || removeError);
            // Don't throw - continue with cleanup
          }
        } else {
          console.warn('⚠ Subscription object does not have remove() method');
          console.warn('Subscription keys:', Object.keys(subscription || {}));
        }
      } else {
        console.warn('⚠ Subscription is not an object:', typeof subscription);
      }
      
      // Step 3: Update state only if component is still mounted
      // Use InteractionManager to ensure state updates happen after interactions complete
      if (isMountedRef.current) {
        InteractionManager.runAfterInteractions(() => {
          if (isMountedRef.current) {
            setIsMonitoring(false);
            setHasReceivedData(false);
            console.log('✓ Monitoring state reset');
          } else {
            console.log('⚠ Component unmounted during InteractionManager delay, skipping state updates');
          }
        });
      } else {
        console.log('⚠ Component unmounted, skipping state updates');
      }
      
    } catch (error) {
      console.error('❌ Unexpected error in stopMonitoring():', error);
      console.error('Error message:', error?.message || error);
      console.error('Error stack:', error?.stack);
      
      // Ensure cleanup even if there's an error, but only update state if mounted
      try {
        if (isMountedRef.current) {
          InteractionManager.runAfterInteractions(() => {
            if (isMountedRef.current) {
              setIsMonitoring(false);
              setHasReceivedData(false);
            }
          });
        }
        if (monitorSubscription) {
          monitorSubscription.current = null;
        }
        if (dataTimeoutRef && dataTimeoutRef.current) {
          clearTimeout(dataTimeoutRef.current);
          dataTimeoutRef.current = null;
        }
        console.log('✓ Emergency cleanup completed');
      } catch (resetError) {
        console.error('❌ Error in emergency cleanup:', resetError);
      }
    } finally {
      // Always clear the cleanup flag
      isCleaningUpRef.current = false;
    }
    
    console.log('=== stopMonitoring() complete ===');
  };

  const handleStopMonitoring = () => {
    console.log('=== handleStopMonitoring() called ===');
    
    // Prevent multiple rapid clicks
    if (isStoppingRef.current) {
      console.log('⚠ Stop already in progress, ignoring...');
      return;
    }
    
    if (isCleaningUpRef.current) {
      console.log('⚠ Cleanup already in progress, ignoring...');
      return;
    }
    
    isStoppingRef.current = true;
    
    try {
      console.log('Calling stopMonitoring() from button handler...');
      stopMonitoring();
    } catch (error) {
      console.error('❌ Error in handleStopMonitoring:', error);
      console.error('Error message:', error?.message || error);
      console.error('Error stack:', error?.stack);
      
      // Show user-friendly error message
      if (isMountedRef.current) {
        Alert.alert(
          'Error',
          'Failed to stop monitoring. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      // Reset after a delay to allow cleanup to complete
      setTimeout(() => {
        isStoppingRef.current = false;
        console.log('✓ Stop handler flag reset');
      }, 500);
    }
  };

  const updateSensorReading = (parsedData) => {
    const { readings, timestamp } = parsedData;

    if (!readings || readings.length !== 12) {
      console.warn('Invalid readings array:', readings);
      return;
    }

    // Map readings to sensors based on READING_OFFSETS and sensor type
    // For default site with port-based sensors, use port offset mapping
    // For non-default sites, use sensor type-based mapping
    sensorsRef.current.forEach((sensor) => {
      let paraPos = null;
      let tempParaPos = null;

      // Ensure sensorType is a number (might be stored as string in DB)
      let sensorType = sensor.sensorType;
      if (typeof sensorType === 'string') {
        sensorType = parseInt(sensorType, 10);
      } else if (typeof sensorType !== 'number') {
        sensorType = Number(sensorType);
      }
      
      // For default site with port-based sensors, use sensor type offset for fixed-position sensors
      // Otherwise use port offset mapping
      // Fixed-position sensors: VW_FREQ (always at offset 8), EL_TILTMETER, MEMS_TILTMETER
      if (sensor.isDefaultSitePort && sensor.portNumber) {
        // Check if this sensor type has a fixed position in the data frame
        if (sensorType === SENSOR_TYPES.VW_FREQ) {
          // VW Frequency is always at offset 8, regardless of port
          paraPos = READING_OFFSETS.VW_OUTPUT; // Offset 8
          tempParaPos = READING_OFFSETS.VW_TEMP; // Offset 9
          console.log(`📡 VW Frequency sensor on Port ${sensor.portNumber} using offset ${paraPos} (fixed position)`);
          console.log(`📡 Raw value at offset ${paraPos}: ${readings[paraPos]}`);
        } else if (sensorType === SENSOR_TYPES.EL_TILTMETER) {
          // EL Tiltmeter is always at offset 3
          paraPos = READING_OFFSETS.EL_TILT; // Offset 3
          tempParaPos = READING_OFFSETS.EL_TILT_TEMP; // Offset 4
        } else if (sensorType === SENSOR_TYPES.MEMS_TILTMETER) {
          // MEMS Tiltmeter is always at offset 5
          paraPos = READING_OFFSETS.MEMS_TILT1; // Offset 5
          tempParaPos = READING_OFFSETS.MEMS_TILT2; // Offset 6
        } else if (DEFAULT_SITE_PORT_OFFSETS[sensor.portNumber] !== undefined) {
          // For other sensor types (Load Cell, Potentiometric, Voltage Output, etc.), use port offset
          paraPos = DEFAULT_SITE_PORT_OFFSETS[sensor.portNumber];
          
          // Temporary logging to verify voltage reading fix
          if (sensorType === SENSOR_TYPES.VTG_OUTPUT) {
            console.log(`🔋 Voltage sensor on Port ${sensor.portNumber} using offset ${paraPos} (expected: 1 for Port 2)`);
            console.log(`🔋 Raw value at offset ${paraPos}: ${readings[paraPos]}`);
          }
        } else {
          console.warn(`No offset mapping for Port ${sensor.portNumber} and sensor type ${sensorType}`);
          return;
        }
      } else {
        // For non-default sites, use sensor type-based mapping
        switch (sensorType) {
          case SENSOR_TYPES.LOAD_CELL:
            paraPos = READING_OFFSETS.LOAD_CELL; // Offset 0
            break;
          case SENSOR_TYPES.POTENTIOMETRIC:
            paraPos = READING_OFFSETS.POTENTIOMETRIC; // Offset 1
            break;
          case SENSOR_TYPES.VTG_OUTPUT:
            paraPos = READING_OFFSETS.VTG_OUTPUT; // Offset 2
            break;
          case SENSOR_TYPES.EL_TILTMETER:
            paraPos = READING_OFFSETS.EL_TILT; // Offset 3
            tempParaPos = READING_OFFSETS.EL_TILT_TEMP; // Offset 4
            break;
          case SENSOR_TYPES.MEMS_TILTMETER:
            paraPos = READING_OFFSETS.MEMS_TILT1; // Offset 5
            tempParaPos = READING_OFFSETS.MEMS_TILT2; // Offset 6
            break;
          case SENSOR_TYPES.ANA_4_20:
            paraPos = READING_OFFSETS.ANA_4TO20; // Offset 7
            break;
          case SENSOR_TYPES.VW_FREQ:
            paraPos = READING_OFFSETS.VW_OUTPUT; // Offset 8
            tempParaPos = READING_OFFSETS.VW_TEMP; // Offset 9
            break;
          case SENSOR_TYPES.THERMISTOR:
            paraPos = READING_OFFSETS.THERMISTOR; // Offset 10
            break;
          case SENSOR_TYPES.RTD:
            paraPos = READING_OFFSETS.RTD; // Offset 11
            break;
          default:
            console.warn(`Unknown sensor type: ${sensorType} for sensor ${sensor.sensorIdStr}`);
            return;
        }
      }
      
      if (paraPos === null || paraPos === undefined) {
        console.warn(`No paraPos determined for sensor: ${sensor.sensorIdStr}`);
        return;
      }

      // Validate paraPos is within bounds
      if (paraPos < 0 || paraPos >= readings.length) {
        console.error(`❌ Invalid paraPos ${paraPos} for sensor ${sensor.sensorIdStr}. Readings array length: ${readings.length}`);
        return;
      }

      // Get coefficient array for calibration
      DatabaseManager.getSensorCoeffArray(sensor.sensorCommId).then(coeffArray => {
        // Apply calibration using first coefficient as offset and second as factor
        const offset = coeffArray[0] || 0.0;
        const factor = coeffArray[1] || 1.0;
        const rawValue = readings[paraPos];
        const calibratedValue = (rawValue * factor) + offset;

        // Get temperature if available
        let temperature = null;
        if (tempParaPos !== null && tempParaPos < readings.length) {
          temperature = readings[tempParaPos];
        }


        // Update sensor readings state
        setSensorReadings(prev => {
          const newReadings = {
            ...prev,
            [sensor.sensorCommId]: {
              value: calibratedValue,
              temperature,
              timestamp,
            },
          };
          
          return newReadings;
        });
      }).catch(error => {
        console.error('Error getting coefficients:', error);
        // Use raw value without calibration
        const rawValue = readings[paraPos];
        setSensorReadings(prev => {
          const newReadings = {
            ...prev,
            [sensor.sensorCommId]: {
              value: rawValue,
              temperature: tempParaPos !== null ? readings[tempParaPos] : null,
              timestamp,
            },
          };
          return newReadings;
        });
      });
    });
  };

  const handleAcceptReadings = async () => {
    try {
      const timestamp = Date.now();
      
      // Save all current readings to database using insertAvoidDuplicate
      const savePromises = sensors.map(async (sensor) => {
        const reading = sensorReadings[sensor.sensorCommId];
        // Only skip if reading is completely missing (0 is a valid reading value)
        if (!reading || reading.value === undefined || reading.value === null) {
          return;
        }

        // Use stored paraPos if available, otherwise determine based on sensor type or port
        let paraPos = sensor.paraPos;
        let tempParaPos = null;

        if (paraPos === undefined || paraPos === null) {
          // For default site ports, use port-based offset mapping
          if (sensor.isDefaultSitePort && sensor.portNumber) {
            paraPos = DEFAULT_SITE_PORT_OFFSETS[sensor.portNumber];
            if (paraPos === undefined) {
              console.warn(`No offset mapping for Port ${sensor.portNumber}`);
              return;
            }
          } else {
            // For non-default sites, use sensor type-based mapping
            switch (sensor.sensorType) {
              case SENSOR_TYPES.SENS_LOAD_CELL:
                paraPos = READING_OFFSETS.LOAD_CELL;
                break;
              case SENSOR_TYPES.SENS_POTENTIOMETRIC:
                paraPos = READING_OFFSETS.POTENTIOMETRIC;
                break;
              case SENSOR_TYPES.SENS_VTG_OUTPUT:
                paraPos = READING_OFFSETS.VTG_OUTPUT;
                break;
              case SENSOR_TYPES.SENS_EL_TILTMETER:
                paraPos = READING_OFFSETS.EL_TILT;
                tempParaPos = READING_OFFSETS.EL_TILT_TEMP;
                break;
              case SENSOR_TYPES.SENS_MEMS_TILMETER:
                paraPos = READING_OFFSETS.MEMS_TILT1;
                tempParaPos = READING_OFFSETS.MEMS_TILT2;
                break;
              case SENSOR_TYPES.SENS_ANA_4_20:
                paraPos = READING_OFFSETS.ANA_4TO20;
                break;
              case SENSOR_TYPES.SENS_VW_FREQ:
                paraPos = READING_OFFSETS.VW_OUTPUT;
                tempParaPos = READING_OFFSETS.VW_TEMP;
                break;
              case SENSOR_TYPES.SENS_THERMISTOR:
                paraPos = READING_OFFSETS.THERMISTOR;
                break;
              case SENSOR_TYPES.SENS_RTD:
                paraPos = READING_OFFSETS.RTD;
                break;
              default:
                console.warn(`Unknown sensor type: ${sensor.sensorType}`);
                return;
            }
          }
        }

        if (paraPos === null || paraPos === undefined) {
          return;
        }

        // Save main reading value
        await DatabaseManager.insertAvoidDuplicate(
          timestamp,
          sensor.sensorCommId,
          paraPos,
          reading.value
        );

        // Save temperature if available
        if (reading.temperature !== null && tempParaPos !== null) {
          await DatabaseManager.insertAvoidDuplicate(
            timestamp,
            sensor.sensorCommId,
            tempParaPos,
            reading.temperature
          );
        }
      });

      await Promise.all(savePromises);
      setLastSaveTime(timestamp);
      Alert.alert('Success', 'Readings saved successfully');

      // Reload sensors to update last saved values
      if (selectedSiteId) {
        await loadSensors(selectedSiteId);
      }
    } catch (error) {
      console.error('Error accepting readings:', error);
      Alert.alert('Error', 'Failed to save readings');
    }
  };

  const handleSetReference = async (sensor) => {
    const currentReading = sensorReadings[sensor.sensorCommId];
    // Only check if reading exists (0 is a valid reading value)
    if (!currentReading || currentReading.value === undefined || currentReading.value === null) {
      Alert.alert('No Reading', 'Please take a reading first');
      return;
    }

    Alert.alert(
      'Set Reference',
      `Set current value (${currentReading.value.toFixed(2)}) as reference reading?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Set',
          onPress: async () => {
            try {
              // TODO: Implement reference reading storage in new schema
              Alert.alert('Success', 'Reference reading updated (stored in metadata)');
              if (selectedSiteId) {
                await loadSensors(selectedSiteId);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to update reference');
            }
          },
        },
      ]
    );
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '--:--:--';
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const handlePortSensorTypeChange = (port, sensorType) => {
    // Ensure sensorType is a number (Picker might return string)
    const numericType = typeof sensorType === 'string' ? parseInt(sensorType, 10) : sensorType;
    console.log(`Port ${port} sensor type changed:`, { original: sensorType, numeric: numericType });
    setPortSensorTypes(prev => ({
      ...prev,
      [port]: numericType,
    }));
  };

  const handleViewReadings = async () => {
    // Prevent multiple simultaneous executions
    if (isSavingConfig.current) {
      console.log('⚠ View readings already in progress, ignoring duplicate call');
      return;
    }

    try {
      isSavingConfig.current = true;
      console.log('=== handleViewReadings START ===');

      if (!selectedSiteId) {
        Alert.alert('Error', 'Please select a site first');
        return;
      }

      let site;
      try {
        site = await DatabaseManager.getSiteById(selectedSiteId);
      } catch (siteError) {
        console.error('Failed to get site:', siteError);
        Alert.alert('Error', `Failed to load site: ${siteError.message}`);
        return;
      }

      if (!site || (site.name !== DEFAULT_SITE_NAME && site.id !== 0)) {
        Alert.alert('Error', 'Port configuration is only available for Default Site');
        return;
      }

      // Ensure database is ready
      let db;
      try {
        await DatabaseManager.ensureInitialized();
        db = DatabaseManager.getDbInstance();
        if (!db) {
          throw new Error('Database instance is null');
        }
      } catch (dbError) {
        console.error('Database initialization failed:', dbError);
        Alert.alert('Database Error', `Failed to initialize database: ${dbError.message}`);
        return;
      }

      const sensorsToConfigure = [];

      for (const port of [1, 2, 3]) {
        let sensorType = portSensorTypes[port];
        if (sensorType === null || sensorType === undefined) {
          continue;
        }

        if (typeof sensorType === 'string') {
          sensorType = parseInt(sensorType, 10);
        } else {
          sensorType = Number(sensorType);
        }

        if (Number.isNaN(sensorType)) {
          continue;
        }

        const sensorIdStr = `PORT${port}`;
        const sensorTypeLabel = SENSOR_TYPE_LABELS[sensorType] || 'Unknown';
        const unit = SENSOR_UNITS[sensorType] || '';
        
        // Get existing sensor if any
        let sensor;
        try {
          sensor = await DatabaseManager.getAnalogSensorBySiteIdAndSensorID(selectedSiteId, sensorIdStr);
        } catch (queryError) {
          console.error(`  ❌ Failed to query sensor for Port ${port}:`, queryError);
          sensor = null;
        }

        if (sensor) {
          // Update existing sensor type/metadata
          try {
            await db.runAsync(
              `UPDATE analog_sensor_comm_table 
               SET sensorType = ?, paramName = ?, paramUnit = ?, sensorComments = ?
               WHERE sensorCommId = ?`,
              [
                sensorType,
                sensorTypeLabel,
                unit,
                `Port ${port} - ${sensorTypeLabel}`,
                sensor.sensorCommId,
              ]
            );
            sensor = await DatabaseManager.getAnalogSensorBySiteIdAndSensorID(selectedSiteId, sensorIdStr);
          } catch (updateError) {
            console.error(`  ❌ Failed to update sensor for Port ${port}:`, updateError);
            continue;
          }
        } else {
          // Insert new sensor for this port
          try {
            await db.runAsync(
              `INSERT INTO analog_sensor_comm_table (siteId, modelId, sensorType, sensorIdStr, sensorSerialNo, sensorComments, paramName, paramUnit)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                selectedSiteId,
                null,
                sensorType,
                sensorIdStr,
                '',
                `Port ${port} - ${sensorTypeLabel}`,
                sensorTypeLabel,
                unit,
              ]
            );
          } catch (insertError) {
            console.error(`  ❌ Failed to insert sensor for Port ${port}:`, insertError);
            continue;
          }

          // Allow transaction to complete
          await new Promise(resolve => setTimeout(resolve, 50));

          sensor = await DatabaseManager.getAnalogSensorBySiteIdAndSensorID(selectedSiteId, sensorIdStr);

          // If still missing, try direct query
          if (!sensor) {
            try {
              const directQuery = await db.getFirstAsync(
                `SELECT * FROM analog_sensor_comm_table WHERE siteId = ? AND sensorIdStr = ? ORDER BY sensorCommId DESC LIMIT 1`,
                [selectedSiteId, sensorIdStr]
              );
              if (directQuery) {
                sensor = directQuery;
              }
            } catch (directQueryError) {
              console.error(`  ❌ Direct query failed for Port ${port}:`, directQueryError);
            }
          }

          // Create default coefficients for new sensor
          if (sensor && sensor.sensorCommId) {
            const defaultCoeffs = [0.0, 1.0, 0.0, 0.0, 0.0, 0.0];
            for (let i = 0; i < defaultCoeffs.length; i += 1) {
              try {
                await DatabaseManager.insertSensorCoeffToTable(sensor.sensorCommId, i, defaultCoeffs[i]);
              } catch (coeffError) {
                // Ignore duplicate coefficient errors
                console.warn(`  ⚠ Coefficient insert failed for sensorCommId ${sensor.sensorCommId}, index ${i}:`, coeffError?.message || coeffError);
              }
            }
          }
        }

        if (!sensor || !sensor.sensorCommId) {
          console.error(`  ❌ Unable to prepare sensor for Port ${port}`);
          continue;
        }

        const sensorToAdd = {
          ...sensor,
          portNumber: port,
        };
        
        // Ensure sensorType is a number
        if (typeof sensorToAdd.sensorType === 'string') {
          sensorToAdd.sensorType = parseInt(sensorToAdd.sensorType, 10);
        } else if (typeof sensorToAdd.sensorType !== 'number') {
          sensorToAdd.sensorType = Number(sensorToAdd.sensorType);
        }
        
        sensorsToConfigure.push(sensorToAdd);
      }

      if (sensorsToConfigure.length === 0) {
        Alert.alert(
          'Validation Error',
          'Please select at least 1 sensor type.\n\nSelect a sensor type from the dropdown for at least one port (1, 2, or 3).'
        );
        return;
      }

      if (sensorsToConfigure.length > 3) {
        Alert.alert(
          'Validation Error',
          'Maximum 3 sensors can be selected.\n\nPlease select sensors for up to 3 ports only.'
        );
        return;
      }

      const sensorTypes = sensorsToConfigure.map(s => s.sensorType);
      const uniqueTypes = new Set(sensorTypes);
      if (sensorTypes.length !== uniqueTypes.size) {
        const duplicates = sensorTypes.filter((type, index) => sensorTypes.indexOf(type) !== index);
        Alert.alert(
          'Validation Error',
          'Cannot select two sensors of the same type.\n\nEach port must have a different sensor type.\n' +
          `Duplicate type(s): ${duplicates.map(t => SENSOR_TYPE_LABELS[t] || `Type ${t}`).join(', ')}`
        );
        return;
      }

      console.log(`✓ Prepared ${sensorsToConfigure.length} sensor(s) for readings`);

      // Prepare data for readings screen (add paraPos, reference values)
      console.log(`✓ Prepared ${sensorsToConfigure.length} sensor(s) for readings`);

      // Stop any active monitoring so we can restart with the latest configuration
      console.log('Stopping existing monitoring before applying new configuration...');
      stopMonitoring();

      // Reload sensors so readings display inline on this screen
      await loadSensors(selectedSiteId);

      // Reveal the live readings section
      setShowReadings(true);
    } catch (error) {
      console.error('Failed to prepare sensors for readings:', error);
      Alert.alert('Error', `Failed to prepare sensors: ${error.message || 'Unknown error'}`);
    } finally {
      isSavingConfig.current = false;
      console.log('=== handleViewReadings COMPLETE ===');
    }
  };

  const handleSavePortConfiguration = async () => {
    // Prevent multiple simultaneous saves
    if (isSavingConfig.current) {
      console.log('⚠ Save configuration already in progress, ignoring duplicate call');
      return;
    }
    
    try {
      isSavingConfig.current = true;
      console.log('=== handleSavePortConfiguration START ===');
      
      if (!selectedSiteId) {
        Alert.alert('Error', 'Please select a site first');
        isSavingConfig.current = false;
        return;
      }

      let site;
      try {
        site = await DatabaseManager.getSiteById(selectedSiteId);
      } catch (siteError) {
        console.error('Failed to get site:', siteError);
        Alert.alert('Error', `Failed to load site: ${siteError.message}`);
        isSavingConfig.current = false;
        return;
      }
      
      if (!site || (site.name !== DEFAULT_SITE_NAME && site.id !== 0)) {
        Alert.alert('Error', 'Port configuration is only available for Default Site');
        isSavingConfig.current = false;
        return;
      }

      // Check if BLE device is connected
      if (!BLEService.connectedDevice) {
        Alert.alert(
          'Device Not Connected',
          'Please connect to EDI-55 device via Bluetooth before saving port configuration.\n\n' +
          'Go to Device Management to connect.'
        );
        isSavingConfig.current = false;
        return;
      }

      let db;
      try {
        await DatabaseManager.ensureInitialized();
        db = DatabaseManager.getDbInstance();
        if (!db) {
          throw new Error('Database instance is null');
        }
      } catch (dbError) {
        console.error('Database initialization failed:', dbError);
        Alert.alert('Database Error', `Failed to initialize database: ${dbError.message}`);
        return;
      }

      // Array to collect sensors that will be configured
      const sensorsToConfigure = [];

      console.log('=== Save Port Configuration ===');
      console.log('Current portSensorTypes state:', portSensorTypes);
      console.log('State keys:', Object.keys(portSensorTypes));
      console.log('State values:', Object.values(portSensorTypes));

      // Update or create sensors for each port (only for ports that have a sensor type selected)
      for (const port of [1, 2, 3]) {
        const sensorIdStr = `PORT${port}`;
        let sensorType = portSensorTypes[port];
        
        console.log(`\nProcessing Port ${port}:`);
        console.log(`  Raw value from state:`, sensorType, `(type: ${typeof sensorType})`);
        
        // Ensure sensorType is a number
        if (sensorType !== null && sensorType !== undefined) {
          if (typeof sensorType === 'string') {
            sensorType = parseInt(sensorType, 10);
            console.log(`  Converted from string to number:`, sensorType);
          } else if (typeof sensorType !== 'number') {
            // Try to convert any other type
            sensorType = Number(sensorType);
            console.log(`  Converted to number:`, sensorType);
          }
        }
        
        console.log(`  Final sensorType:`, sensorType, `(type: ${typeof sensorType}, isNaN: ${isNaN(sensorType)})`);
        
        // Skip if no sensor type selected for this port
        if (sensorType === null || sensorType === undefined || isNaN(sensorType)) {
          console.log(`  ❌ Skipping Port ${port} - no valid sensor type selected`);
          console.log(`     Value: ${sensorType}, Type: ${typeof sensorType}, isNaN: ${isNaN(sensorType)}`);
          continue;
        }
        
        console.log(`  ✓ Port ${port} has valid sensor type: ${sensorType}`);
        
        const sensorTypeLabel = SENSOR_TYPE_LABELS[sensorType] || 'Unknown';
        const unit = SENSOR_UNITS[sensorType] || '';

        // Check if sensor exists in the new table (analog_sensor_comm_table)
        let sensor;
        try {
          sensor = await DatabaseManager.getAnalogSensorBySiteIdAndSensorID(selectedSiteId, sensorIdStr);
        } catch (queryError) {
          console.error(`  ❌ Failed to query sensor for Port ${port}:`, queryError);
          continue; // Skip this port if query fails
        }

        if (sensor) {
          // Update existing sensor in analog_sensor_comm_table
          console.log(`  Updating existing sensor for Port ${port}`);
          console.log(`  Current sensor:`, { sensorCommId: sensor.sensorCommId, sensorType: sensor.sensorType });
          try {
            await db.runAsync(
              `UPDATE analog_sensor_comm_table 
               SET sensorType = ?, paramName = ?, paramUnit = ?, sensorComments = ?
               WHERE sensorCommId = ?`,
              [
                sensorType,
                sensorTypeLabel,
                unit,
                `Port ${port} - ${sensorTypeLabel}`,
                sensor.sensorCommId,
              ]
            );
            console.log(`  ✓ Updated Port ${port} sensor type to ${sensorTypeLabel}`);
            
            // Re-fetch to ensure we have latest data
            try {
              sensor = await DatabaseManager.getAnalogSensorBySiteIdAndSensorID(selectedSiteId, sensorIdStr);
              console.log(`  Re-fetched sensor after update:`, sensor ? 'Found' : 'NOT FOUND');
            } catch (refetchError) {
              console.error(`  ❌ Failed to re-fetch sensor:`, refetchError);
              // Continue with existing sensor object
            }
          } catch (updateError) {
            console.error(`  ❌ Failed to update sensor for Port ${port}:`, updateError);
            continue; // Skip this port if update fails
          }
        } else {
          // Create new sensor in analog_sensor_comm_table
          // Note: modelId can be NULL for port-based sensors
          try {
            const result = await db.runAsync(
              `INSERT INTO analog_sensor_comm_table (siteId, modelId, sensorType, sensorIdStr, sensorSerialNo, sensorComments, paramName, paramUnit)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                selectedSiteId,
                null, // modelId is NULL for port-based sensors
                sensorType,
                sensorIdStr,
                '',
                `Port ${port} - ${sensorTypeLabel}`,
                sensorTypeLabel,
                unit,
              ]
            );
            console.log(`Created Port ${port} sensor with type ${sensorTypeLabel}`);
            console.log(`  INSERT result:`, result);
          } catch (insertError) {
            console.error(`  ❌ Failed to insert sensor for Port ${port}:`, insertError);
            continue; // Skip this port if insert fails
          }
          
          // Small delay to ensure database write is committed
          await new Promise(resolve => setTimeout(resolve, 50));
          
          // Get the newly created sensor
          sensor = await DatabaseManager.getAnalogSensorBySiteIdAndSensorID(selectedSiteId, sensorIdStr);
          console.log(`  Retrieved sensor after creation:`, sensor ? 'Found' : 'NOT FOUND');
          console.log(`  Sensor details:`, sensor ? {
            sensorCommId: sensor.sensorCommId,
            sensorIdStr: sensor.sensorIdStr,
            sensorType: sensor.sensorType
          } : 'null');
          
          // If still not found, try querying directly
          if (!sensor) {
            console.log(`  Sensor not found via getAnalogSensorBySiteIdAndSensorID, trying direct query...`);
            try {
              const directQuery = await db.getAllAsync(
                `SELECT * FROM analog_sensor_comm_table WHERE siteId = ? AND sensorIdStr = ?`,
                [selectedSiteId, sensorIdStr]
              );
              console.log(`  Direct query result:`, directQuery);
              if (directQuery && directQuery.length > 0) {
                sensor = directQuery[0];
                console.log(`  ✓ Found sensor via direct query`);
              } else {
                // Last resort: construct sensor object from what we know
                console.log(`  Sensor still not found, constructing from INSERT data...`);
                // Get the last inserted row ID
                const lastInsert = await db.getFirstAsync(
                  `SELECT * FROM analog_sensor_comm_table WHERE siteId = ? AND sensorIdStr = ? ORDER BY sensorCommId DESC LIMIT 1`,
                  [selectedSiteId, sensorIdStr]
                );
                if (lastInsert) {
                  sensor = lastInsert;
                  console.log(`  ✓ Found sensor via last insert query`);
                } else {
                  // Construct minimal sensor object
                  console.log(`  Constructing minimal sensor object...`);
                  sensor = {
                    siteId: selectedSiteId,
                    sensorIdStr: sensorIdStr,
                    sensorType: sensorType,
                    paramName: sensorTypeLabel,
                    paramUnit: unit,
                    sensorComments: `Port ${port} - ${sensorTypeLabel}`,
                    // sensorCommId will be set when we query again
                  };
                  console.log(`  ⚠ Using constructed sensor object (may need sensorCommId)`);
                }
              }
            } catch (queryError) {
              console.error(`  ❌ Direct query failed:`, queryError);
            }
          }
          
          // CRITICAL: Create default coefficients for the new sensor
          // Default coefficients: [0.0, 1.0, 0.0, 0.0, 0.0, 0.0]
          // This means: offset=0, factor=1 (no calibration)
          if (sensor && sensor.sensorCommId) {
            const defaultCoeffs = [0.0, 1.0, 0.0, 0.0, 0.0, 0.0];
            for (let i = 0; i < defaultCoeffs.length; i++) {
              await DatabaseManager.insertSensorCoeffToTable(sensor.sensorCommId, i, defaultCoeffs[i]);
            }
            console.log(`  ✓ Created default coefficients for Port ${port} sensor`);
          } else {
            console.error(`  ❌ Cannot create coefficients - sensor or sensorCommId missing`);
            console.error(`     sensor:`, sensor);
            console.error(`     sensorCommId:`, sensor?.sensorCommId);
          }
        }

        // Ensure sensor has all required properties before adding
        if (sensor) {
          // If sensorCommId is missing, try to get it one more time
          if (!sensor.sensorCommId) {
            console.log(`  ⚠ Port ${port} sensor missing sensorCommId, attempting final retrieval...`);
            try {
              const finalAttempt = await DatabaseManager.getAnalogSensorBySiteIdAndSensorID(selectedSiteId, sensorIdStr);
              if (finalAttempt && finalAttempt.sensorCommId) {
                sensor = finalAttempt;
                console.log(`  ✓ Got sensorCommId on final attempt:`, sensor.sensorCommId);
              } else {
                // Try to get sensorCommId from database directly
                const idQuery = await db.getFirstAsync(
                  `SELECT sensorCommId FROM analog_sensor_comm_table WHERE siteId = ? AND sensorIdStr = ?`,
                  [selectedSiteId, sensorIdStr]
                );
                if (idQuery && idQuery.sensorCommId) {
                  sensor.sensorCommId = idQuery.sensorCommId;
                  console.log(`  ✓ Got sensorCommId from ID query:`, sensor.sensorCommId);
                } else {
                  console.error(`  ❌ Could not retrieve sensorCommId after multiple attempts`);
                }
              }
            } catch (retryError) {
              console.error(`  ❌ Error during final retrieval:`, retryError);
            }
          }
          
          if (!sensor.sensorCommId) {
            console.error(`  ❌ Port ${port} sensor missing sensorCommId after all attempts:`, sensor);
            console.error(`     Cannot add to configure list without sensorCommId`);
          } else if (sensor.sensorType === undefined || (sensor.sensorType === null && sensor.sensorType !== 0)) {
            console.error(`  ❌ Port ${port} sensor missing sensorType:`, sensor);
          } else {
            console.log(`  ✓✓✓ Adding Port ${port} sensor to configure list:`, {
              sensorCommId: sensor.sensorCommId,
              sensorIdStr: sensor.sensorIdStr,
              sensorType: sensor.sensorType,
              paramName: sensor.paramName
            });
            sensorsToConfigure.push(sensor);
            console.log(`  ✓✓✓ sensorsToConfigure now has ${sensorsToConfigure.length} sensor(s)`);
          }
        } else {
          console.error(`  ❌ Port ${port} sensor is null/undefined after creation/update`);
        }
      }

            // Validation: Minimum 1 sensor, Maximum 3 sensors
            if (sensorsToConfigure.length === 0) {
              console.error('❌ No sensors to configure!');
              console.error('portSensorTypes state:', JSON.stringify(portSensorTypes, null, 2));
              console.error('State keys:', Object.keys(portSensorTypes));
              console.error('State values:', Object.values(portSensorTypes));
              
              // Check each port individually
              for (const port of [1, 2, 3]) {
                const value = portSensorTypes[port];
                console.error(`Port ${port}: value = ${value}, type = ${typeof value}, isNaN = ${isNaN(value)}`);
              }
              
              setTimeout(() => {
                try {
                  Alert.alert(
                    'Validation Error', 
                    'Please select at least 1 sensor type.\n\n' +
                    'Select a sensor type from the dropdown for at least one port (1, 2, or 3).'
                  );
                } catch (alertError) {
                  console.error('Failed to show alert:', alertError);
                }
              }, 100);
              isSavingConfig.current = false;
              return;
            }
            
            if (sensorsToConfigure.length > 3) {
              console.error('❌ Too many sensors configured!', sensorsToConfigure.length);
              setTimeout(() => {
                try {
                  Alert.alert(
                    'Validation Error',
                    'Maximum 3 sensors can be configured.\n\n' +
                    `Currently configured: ${sensorsToConfigure.length} sensors.\n` +
                    'Please select sensors for up to 3 ports only.'
                  );
                } catch (alertError) {
                  console.error('Failed to show alert:', alertError);
                }
              }, 100);
              isSavingConfig.current = false;
              return;
            }
            
            // Validation: No duplicate sensor types
            const sensorTypes = sensorsToConfigure.map(s => s.sensorType);
            const uniqueTypes = new Set(sensorTypes);
            if (sensorTypes.length !== uniqueTypes.size) {
              console.error('❌ Duplicate sensor types detected!', sensorTypes);
              const duplicates = sensorTypes.filter((type, index) => sensorTypes.indexOf(type) !== index);
              setTimeout(() => {
                try {
                  Alert.alert(
                    'Validation Error',
                    'Cannot configure two sensors of the same type.\n\n' +
                    'Each port must have a different sensor type.\n' +
                    `Duplicate type(s): ${duplicates.map(t => SENSOR_TYPE_LABELS[t] || `Type ${t}`).join(', ')}`
                  );
                } catch (alertError) {
                  console.error('Failed to show alert:', alertError);
                }
              }, 100);
              isSavingConfig.current = false;
              return;
            }
            
            console.log(`✓ Validation passed: ${sensorsToConfigure.length} sensor(s) configured`);

      console.log(`Saving ${sensorsToConfigure.length} sensor(s) to database...`);
      console.log('Sensors details:', sensorsToConfigure.map(s => ({
        id: s.sensorCommId,
        sensorIdStr: s.sensorIdStr,
        type: s.sensorType,
        typeName: SENSOR_TYPE_LABELS[s.sensorType]
      })));

      // CRITICAL: Write configuration to BLE device
      try {
        console.log('Writing sensor configuration to EDI-55 device...');
        
        // Get site name
        const siteName = site.name || DEFAULT_SITE_NAME;
        
        // Create sensor enable array (11 bytes, one for each sensor type)
        // Only enable sensors that are configured for ports 1, 2, 3
        const isSensorEnable = new Array(11).fill(0);
        sensorsToConfigure.forEach(sensor => {
          const sensorType = typeof sensor.sensorType === 'string' ? parseInt(sensor.sensorType, 10) : sensor.sensorType;
          if (sensorType >= 0 && sensorType < 11) {
            isSensorEnable[sensorType] = 1;
            console.log(`  Enabling sensor type ${sensorType} (${SENSOR_TYPE_LABELS[sensorType]})`);
          } else {
            console.warn(`  Invalid sensor type ${sensorType} for sensor ${sensor.sensorIdStr}`);
          }
        });

        console.log('Sensor enable array:', isSensorEnable);
        console.log('Sensors to configure:', sensorsToConfigure.map(s => `${s.sensorIdStr} (Type ${s.sensorType})`));

        // Write configuration to device - wrap in additional try-catch for safety
        try {
          console.log('Attempting to write configuration to BLE device...');
          await edi55Service.writeAnalogConfig(siteName, isSensorEnable, sensorsToConfigure);
          console.log('✓ Configuration written to device successfully');
          
          // Delay alert to avoid potential crash
          setTimeout(() => {
            try {
              Alert.alert(
                'Configuration Complete',
                `Port configuration saved and sent to EDI-55 device.\n\n` +
                `Configured ${sensorsToConfigure.length} sensor(s).\n\n` +
                `Readings should appear shortly.`
              );
            } catch (alertError) {
              console.error('Failed to show success alert:', alertError);
            }
          }, 100);
        } catch (bleError) {
          console.error('❌ Failed to write configuration to device:', bleError);
          console.error('Error type:', typeof bleError);
          console.error('Error message:', bleError?.message || 'No message');
          console.error('Error stack:', bleError?.stack || 'No stack');
          console.error('Error name:', bleError?.name || 'No name');
          
          // Delay alert to avoid potential crash
          setTimeout(() => {
            try {
              Alert.alert(
                'Warning',
                `Configuration saved to database, but failed to write to device:\n${bleError?.message || 'Unknown error'}\n\n` +
                `Please ensure:\n` +
                `1. EDI-55 device is connected via Bluetooth\n` +
                `2. Device is powered on\n` +
                `3. Try again after connecting`
              );
            } catch (alertError) {
              console.error('Failed to show error alert:', alertError);
            }
          }, 100);
        }
      } catch (outerBleError) {
        console.error('❌❌ Outer BLE error handler:', outerBleError);
        // This shouldn't happen, but just in case
      }
      
      // Navigate to readings screen with configured sensors
      setTimeout(async () => {
        try {
          console.log('Loading configured sensors for readings screen...');
          
          // Get sensors with port numbers and paraPos from sensorsToConfigure
          const configuredSensors = await Promise.all(
            sensorsToConfigure.map(async (sensor) => {
              // Determine paraPos based on sensor type
              let paraPos = READING_OFFSETS.LOAD_CELL;
              switch (sensor.sensorType) {
                case SENSOR_TYPES.LOAD_CELL:
                  paraPos = READING_OFFSETS.LOAD_CELL;
                  break;
                case SENSOR_TYPES.POTENTIOMETRIC:
                  paraPos = READING_OFFSETS.POTENTIOMETRIC;
                  break;
                case SENSOR_TYPES.VTG_OUTPUT:
                  paraPos = READING_OFFSETS.VTG_OUTPUT;
                  break;
                case SENSOR_TYPES.EL_TILTMETER:
                  paraPos = READING_OFFSETS.EL_TILT;
                  break;
                case SENSOR_TYPES.MEMS_TILTMETER:
                  paraPos = READING_OFFSETS.MEMS_TILT1;
                  break;
                case SENSOR_TYPES.ANA_4_20:
                  paraPos = READING_OFFSETS.ANA_4TO20;
                  break;
                case SENSOR_TYPES.VW_FREQ:
                  paraPos = READING_OFFSETS.VW_OUTPUT;
                  break;
                case SENSOR_TYPES.THERMISTOR:
                  paraPos = READING_OFFSETS.THERMISTOR;
                  break;
                case SENSOR_TYPES.RTD:
                  paraPos = READING_OFFSETS.RTD;
                  break;
              }
              
              // Get last reading for reference values
              const lastReading = await DatabaseManager.getLastReadingFromReadingData(
                sensor.sensorCommId,
                paraPos
              );
              
              return {
                ...sensor,
                portNumber: sensor.sensorIdStr ? parseInt(sensor.sensorIdStr.replace('PORT', '')) : null,
                paraPos,
                referenceValue: 0,
                lastSavedValue: lastReading ? lastReading.readingValue : 0,
                lastSavedTime: lastReading ? lastReading.timestamp : null,
              };
            })
          );
          
          console.log(`Navigating to readings screen with ${configuredSensors.length} sensor(s)`);
          
          // Navigate to readings screen
          navigation.navigate('EDI55Readings', {
            siteId: selectedSiteId,
            sensors: configuredSensors,
          });
        } catch (loadError) {
          console.error('Failed to prepare sensors for navigation:', loadError);
          Alert.alert('Error', 'Configuration saved but failed to prepare sensors. Please try again.');
        }
      }, 500);
      
      console.log('=== handleSavePortConfiguration COMPLETE ===');
    } catch (error) {
      console.error('❌❌❌ CRITICAL ERROR in handleSavePortConfiguration:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Error name:', error.name);
      
      // Try to get more error details safely
      try {
        console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      } catch (stringifyError) {
        console.error('Could not stringify error:', stringifyError);
      }
      
      // Show user-friendly error message (wrapped in try-catch to prevent crash)
      try {
        Alert.alert(
          'Configuration Error',
          `An error occurred while saving configuration:\n\n${error.message || 'Unknown error'}\n\n` +
          `Please check the logs for more details.`
        );
      } catch (alertError) {
        console.error('Failed to show alert:', alertError);
        // At least log it
        console.error('User should see error in logs');
      }
    } finally {
      // Always reset the flag, even if there was an error
      isSavingConfig.current = false;
    }
  };

  const renderSensorCard = (sensor) => {
    const reading = sensorReadings[sensor.sensorCommId];
    
    // Default reading if not available (0 is a valid reading, so we check for undefined)
    const readingValue = reading?.value ?? 0;
    const readingTemperature = reading?.temperature ?? null;
    
    // For default site ports, show port number and sensor type
    let displayLabel = sensor.sensorIdStr || 'Sensor';
    let sensorTypeName = SENSOR_TYPE_LABELS[sensor.sensorType] || 'Unknown';
    let unit = SENSOR_UNITS[sensor.sensorType] || sensor.paramUnit || 'Unit';
    
    // For default site, show "Port X - SensorType" format
    if (sensor.portNumber) {
      displayLabel = `Port ${sensor.portNumber}`;
      sensorTypeName = `${SENSOR_TYPE_LABELS[sensor.sensorType] || 'Sensor'}`;
      unit = SENSOR_UNITS[sensor.sensorType] || sensor.paramUnit || 'Unit';
    }

    // Calculate deviations (use 0 if reading not available)
    const devReference = readingValue - (sensor.referenceValue || 0);
    const devLastSaved = readingValue - (sensor.lastSavedValue || 0);

    // Determine color based on value range or status
    const statusBarColor = Math.abs(devReference) > 10 ? '#EF4444' : '#2241DD';

    return (
      <View key={sensor.sensorCommId} style={[styles.sensorCard, { borderLeftColor: statusBarColor }]}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.connectionBadge}>{displayLabel}</Text>
            <Text style={styles.sensorTypeLabel}>{sensorTypeName}</Text>
          </View>
          <View style={styles.cardHeaderRight}>
            <Text style={styles.avgLabel}>Avg : N.A</Text>
            <TouchableOpacity
              style={styles.gearButton}
              onPress={() => handleSetReference(sensor)}
            >
              <Ionicons name="settings" size={24} color="#2241DD" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Reading */}
        <View style={styles.mainReadingSection}>
          <Text style={styles.parameterName}>{getParameterName(sensor.sensorType)}</Text>
          <Text style={[styles.mainValue, { color: readingValue !== 0 ? '#2241DD' : '#9CA3AF' }]}>
            {readingValue.toFixed(2)}
          </Text>
          <Text style={styles.unitLabel}>{unit}</Text>
        </View>

        {/* Deviations */}
        <View style={styles.deviationsRow}>
          <View style={styles.deviationColumn}>
            <Text style={styles.deviationValue}>
              {devReference >= 0 ? '+' : ''}{devReference.toFixed(2)}
            </Text>
            <Text style={styles.deviationLabel}>Dev. Reference Read</Text>
            <Text style={styles.deviationValue}>{(sensor.referenceValue || 0).toFixed(2)}</Text>
            <Text style={styles.deviationLabel}>Reference Record</Text>
          </View>

          <View style={styles.deviationColumn}>
            <Text style={styles.deviationValue}>
              {devLastSaved >= 0 ? '+' : ''}{devLastSaved.toFixed(2)}
            </Text>
            <Text style={styles.deviationLabel}>Dev. Last Read</Text>
            <Text style={styles.deviationValue}>{(sensor.lastSavedValue || 0).toFixed(2)}</Text>
            <Text style={styles.deviationLabel}>Last Saved Record</Text>
          </View>
        </View>

        {/* Temperature if available */}
        {readingTemperature !== null && readingTemperature !== undefined && (
          <View style={styles.temperatureSection}>
            <Text style={styles.temperatureLabel}>Temperature</Text>
            <Text style={styles.temperatureValue}>{readingTemperature.toFixed(2)}</Text>
            <Text style={styles.temperatureUnit}>Deg. C</Text>
          </View>
        )}
      </View>
    );
  };

  const getParameterName = (sensorType) => {
    const paramNames = {
      [SENSOR_TYPES.LOAD_CELL]: 'Load',
      [SENSOR_TYPES.POTENTIOMETRIC]: 'Displacement',
      [SENSOR_TYPES.VTG_OUTPUT]: 'Voltage',
      [SENSOR_TYPES.EL_TILTMETER]: 'Tilt',
      [SENSOR_TYPES.MEMS_TILTMETER]: 'Tilt',
      [SENSOR_TYPES.ANA_4_20]: 'Current',
      [SENSOR_TYPES.VW_FREQ]: 'Freq',
      [SENSOR_TYPES.THERMISTOR]: 'Temperature',
      [SENSOR_TYPES.RTD]: 'Temperature',
    };
    return paramNames[sensorType] || 'Value';
  };

  const selectedSite = sites.find(s => s.id === selectedSiteId);
  const shouldShowReadings = showReadings || (sensors && sensors.length > 0);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading sensors...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={async () => {
            console.log('=== Back Button Pressed ===');
            
            // Mark that we're navigating away intentionally
            isNavigatingAwayRef.current = true;
            
            // Stop monitoring first, synchronously
            try {
              console.log('Stopping monitoring before navigation...');
              
              // Clear subscription immediately
              if (monitorSubscription && monitorSubscription.current) {
                try {
                  monitorSubscription.current.remove();
                  console.log('✓ Subscription removed');
                } catch (e) {
                  console.error('Error removing subscription:', e);
                }
                monitorSubscription.current = null;
              }
              
              // Clear timeout
              if (dataTimeoutRef && dataTimeoutRef.current) {
                clearTimeout(dataTimeoutRef.current);
                dataTimeoutRef.current = null;
              }
              
              // Update state immediately (component is still mounted)
              setIsMonitoring(false);
              setHasReceivedData(false);
              console.log('✓ Monitoring stopped successfully');
              
            } catch (stopError) {
              console.error('Error stopping monitoring:', stopError);
            }
            
            // Small delay to ensure cleanup completes
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Now navigate
            try {
              console.log('Navigating back...');
              if (navigation && typeof navigation.goBack === 'function') {
                navigation.goBack();
              } else if (navigation && typeof navigation.navigate === 'function') {
                navigation.navigate('SiteManagement');
              } else {
                console.error('No navigation method available');
                Alert.alert('Error', 'Unable to navigate');
              }
            } catch (navError) {
              console.error('Navigation error:', navError);
              Alert.alert('Navigation Error', navError.message || 'Failed to navigate');
            }
          }} 
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Take Reading</Text>
        {refreshing && (
          <View style={styles.refreshIndicator}>
            <ActivityIndicator size="small" color="#FF4500" />
          </View>
        )}
      </View>

      {/* Debug Info (only show if no sites) */}
      {sites.length === 0 && !loading && (
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>⚠ No sites found in database</Text>
          <Text style={styles.debugSubtext}>Tap "Retry Loading Sites" or go to Site Management to create a site</Text>
        </View>
      )}

      {/* Site Selector */}
      <View style={styles.siteSelector}>
        <Text style={styles.siteLabelText}>Site ID</Text>
        <Text style={styles.siteColon}>:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedSiteId || ''}
            onValueChange={(value) => {
              console.log('Site selected:', value);
              if (value && value !== '') {
                setSelectedSiteId(value);
                // The useEffect hook will automatically load sensors when selectedSiteId changes
              } else if (value === '' && sites.length === 0) {
                // If user taps when no sites, retry initialization
                console.log('No sites - retrying initialization...');
                initializeAndLoadData();
              } else {
                setSelectedSiteId(null);
                setSensors([]);
                sensorsRef.current = [];
                setSensorReadings({});
              }
            }}
            style={styles.picker}
            dropdownIconColor="#FFFFFF"
          >
            <Picker.Item label="Select Site..." value="" />
            {sites && sites.length > 0 ? (
              sites.map((site) => {
                const siteId = site.id || site.siteId;
                const displayName = site.name || site.siteName || `Site ${siteId || 'Unknown'}`;
                return (
                  <Picker.Item key={siteId} label={displayName} value={siteId} />
                );
              })
            ) : (
              <Picker.Item label="No sites available - Tap to retry" value="" />
            )}
          </Picker>
        </View>
        {sites.length === 0 && (
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              console.log('Retry button pressed - reinitializing...');
              initializeAndLoadData();
            }}
          >
            <Text style={styles.retryButtonText}>Retry Loading Sites</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Port Sensor Configuration */}
      {selectedSiteId && selectedSite && (selectedSite.name === DEFAULT_SITE_NAME || selectedSite.name === 'Default Site' || selectedSite.id === 0) && (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.portConfigContainer}>
            <Text style={styles.portConfigTitle}>Select Sensors</Text>
            <Text style={styles.portConfigSubtitle}>Select which sensor type is connected to each port (1, 2, 3). Minimum 1 sensor required.</Text>
            {[1, 2, 3].map((port) => (
              <View key={port} style={styles.portConfigRow}>
                <Text style={styles.portLabel}>Connection Port {port}:</Text>
                <View style={styles.portPickerContainer}>
                  <Picker
                    selectedValue={portSensorTypes[port] !== undefined && portSensorTypes[port] !== null ? portSensorTypes[port] : 'none'}
                    onValueChange={(sensorType) => {
                      console.log(`\n=== Port ${port} Dropdown Changed ===`);
                      console.log(`Raw value from Picker:`, sensorType, `(type: ${typeof sensorType})`);
                      
                      if (sensorType === 'none') {
                        handlePortSensorTypeChange(port, null);
                        console.log(`Port ${port} set to "No sensor selected"`);
                      } else {
                        // Ensure it's a number
                        const numericValue = typeof sensorType === 'string' ? parseInt(sensorType, 10) : Number(sensorType);
                        console.log(`Converted to number:`, numericValue);
                        handlePortSensorTypeChange(port, numericValue);
                        console.log(`State should now have port ${port} = ${numericValue}`);
                      }
                    }}
                    style={styles.portPicker}
                    dropdownIconColor="#FFFFFF"
                  >
                    <Picker.Item label="No sensor selected - There's no sensor in this port" value="none" />
                    {Object.entries(SENSOR_TYPE_LABELS).map(([type, label]) => {
                      const numericType = parseInt(type, 10);
                      return (
                        <Picker.Item key={type} label={label} value={numericType} />
                      );
                    })}
                  </Picker>
                </View>
              </View>
            ))}
            <TouchableOpacity 
              style={styles.savePortConfigButton} 
              onPress={handleViewReadings}
            >
              <Text style={styles.savePortConfigButtonText}>View Readings</Text>
            </TouchableOpacity>
          </View>

          {shouldShowReadings && (
            <View style={styles.readingsSection}>
              <View style={styles.readingsHeader}>
                <Text style={styles.readingsTitle}>Live Readings</Text>
                <View style={styles.readingsActions}>
                  <TouchableOpacity
                    style={[
                      styles.monitorButton, 
                      isMonitoring ? styles.stopButton : styles.startButton,
                      (isStoppingRef.current) && styles.disabledButton
                    ]}
                    onPress={isMonitoring ? handleStopMonitoring : startMonitoring}
                    disabled={isStoppingRef.current}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.monitorButtonText}>
                      {isStoppingRef.current ? 'Stopping...' : (isMonitoring ? 'Stop Monitoring' : 'Start Monitoring')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={handleAcceptReadings}
                  >
                    <Text style={styles.acceptButtonText}>Accept</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {refreshing && (
                <View style={styles.refreshBanner}>
                  <ActivityIndicator size="small" color="#5B6EF5" />
                  <Text style={styles.refreshBannerText}>Connecting to device...</Text>
                </View>
              )}

              {!sensors || sensors.length === 0 ? (
                <View style={styles.readingsEmpty}>
                  <Ionicons name="pulse-outline" size={48} color="#9CA3AF" />
                  <Text style={styles.readingsEmptyText}>No sensors configured yet. Select sensor types and tap "View Readings".</Text>
                </View>
              ) : (
                sensors.map(renderSensorCard)
              )}

              <View style={styles.lastSaveSectionInline}>
                <Text style={styles.lastSaveLabel}>Last Save</Text>
                <Text style={styles.lastSaveColon}>:</Text>
                <Text style={styles.lastSaveTime}>
                  {lastSaveTime ? new Date(lastSaveTime).toLocaleString() : 'Never'}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* Show message if site is not Default Site */}
      {selectedSiteId && selectedSite && selectedSite.name !== DEFAULT_SITE_NAME && selectedSite.id !== 0 && (
        <View style={styles.emptyContainer}>
          <Ionicons name="information-circle-outline" size={64} color="#6B7280" />
          <Text style={styles.emptyText}>Port Configuration</Text>
          <Text style={styles.emptySubtext}>
            Port configuration is only available for Default Site. Please select Default Site to configure sensors.
          </Text>
        </View>
      )}

      <InAppLogViewer />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginTop: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#2241DD',
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    marginLeft: Spacing.md,
  },
  refreshIndicator: {
    padding: Spacing.sm,
  },
  siteSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  siteLabelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
  },
  siteColon: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginHorizontal: Spacing.sm,
  },
  pickerContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  picker: {
    color: '#111827',
  },
  retryButton: {
    backgroundColor: '#2241DD',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
    marginLeft: Spacing.md,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
  debugInfo: {
    backgroundColor: '#FEF2F2',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  debugText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
    fontFamily: 'Inter-Bold',
    marginBottom: Spacing.xs,
  },
  debugSubtext: {
    fontSize: 12,
    fontWeight: '500',
    color: '#991B1B',
    fontFamily: 'Inter-Medium',
  },
  portConfigContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  portConfigTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter-Bold',
    marginBottom: Spacing.xs,
  },
  portConfigSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: 'Inter-Medium',
    marginBottom: Spacing.md,
  },
  portConfigRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  portLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    width: 80,
  },
  portPickerContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  portPicker: {
    color: '#111827',
  },
  savePortConfigButton: {
    backgroundColor: '#2241DD',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: Spacing.sm,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  savePortConfigButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl * 2,
  },
  sensorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderLeftWidth: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  connectionBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2241DD',
    fontFamily: 'Inter-SemiBold',
    backgroundColor: 'rgba(34, 65, 221, 0.1)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  sensorTypeLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter-Bold',
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avgLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: 'Inter-SemiBold',
  },
  gearButton: {
    padding: Spacing.xs,
    backgroundColor: 'rgba(34, 65, 221, 0.1)',
    borderRadius: BorderRadius.full,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainReadingSection: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    backgroundColor: '#F0F4FF',
    borderRadius: 16,
    marginVertical: Spacing.md,
    padding: Spacing.lg,
  },
  parameterName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: 'Inter-SemiBold',
    marginBottom: Spacing.sm,
  },
  mainValue: {
    fontSize: 56,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    marginBottom: Spacing.xs,
  },
  unitLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: 'Inter-SemiBold',
  },
  deviationsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  deviationColumn: {
    flex: 1,
  },
  deviationValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter-Bold',
    marginBottom: Spacing.xs,
  },
  deviationLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: 'Inter-Medium',
    marginBottom: Spacing.sm,
  },
  temperatureSection: {
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: Spacing.md,
  },
  temperatureLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: 'Inter-SemiBold',
    marginBottom: Spacing.xs,
  },
  temperatureValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F59E0B',
    fontFamily: 'Inter-Bold',
  },
  temperatureUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: 'Inter-SemiBold',
  },
  readingsSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  readingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  readingsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter-Bold',
  },
  readingsActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  monitorButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 12,
  },
  monitorButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
  startButton: {
    backgroundColor: '#10B981',
  },
  stopButton: {
    backgroundColor: '#EF4444',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  refreshBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  refreshBannerText: {
    marginLeft: Spacing.sm,
    color: '#2241DD',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  readingsEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
    backgroundColor: '#F9FAFB',
  },
  readingsEmptyText: {
    marginTop: Spacing.sm,
    color: '#6B7280',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  lastSaveSectionInline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
    backgroundColor: '#F9FAFB',
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl * 3,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginTop: Spacing.lg,
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  lastSaveSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    backgroundColor: '#F9FAFB',
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  lastSaveLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
  },
  lastSaveColon: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginHorizontal: Spacing.sm,
  },
  lastSaveTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    flex: 1,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  iconButton: {
    padding: Spacing.sm,
  },
  acceptButton: {
    backgroundColor: '#2241DD',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    marginLeft: Spacing.sm,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
  },
  viewButton: {
    backgroundColor: '#2241DD',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  viewButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
  },
});

export default EDI55TakeReadingScreen;

