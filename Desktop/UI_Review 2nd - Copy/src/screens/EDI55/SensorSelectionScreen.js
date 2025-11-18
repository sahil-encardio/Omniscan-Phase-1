import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Typography, Spacing, BorderRadius } from '../../styles/DesignSystem';
import DatabaseManager from '../../database/DatabaseManager';
import { 
  SENSOR_TYPE_LABELS, 
  SENSOR_UNITS, 
  VALIDATION_MESSAGES,
  SYSTEM_CONSTANTS,
  DEFAULT_SITE_NAME,
  SUCCESS_MESSAGES,
} from '../../constants/EDI55Constants';

const SELECTED_SITE_KEY = 'EDI55_SELECTED_SITE';
const SELECTED_SENSORS_KEY = 'EDI55_SELECTED_SENSORS';

const SensorSelectionScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [sites, setSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState(null);
  const [selectedSiteName, setSelectedSiteName] = useState(null);
  const [sensors, setSensors] = useState([]);
  
  // Selected sensors (max 3)
  const [sensor1, setSensor1] = useState(null);
  const [sensor2, setSensor2] = useState(null);
  const [sensor3, setSensor3] = useState(null);

  useFocusEffect(
    useCallback(() => {
      initializeAndLoad();
    }, [])
  );

  const initializeAndLoad = async () => {
    try {
      setLoading(true);
      
      // Initialize database with error handling
      try {
        await DatabaseManager.initialize();
      } catch (dbError) {
        console.error('Database initialization error:', dbError);
        // Continue even if database init fails
      }
      
      // Load all sites with error handling
      let allSites = [];
      try {
        allSites = await DatabaseManager.getAllSites() || [];
      } catch (sitesError) {
        console.error('Error loading sites:', sitesError);
        allSites = [];
      }
      
      setSites(allSites);

      // Restore selected site from AsyncStorage
      try {
        const savedSiteName = await AsyncStorage.getItem(SELECTED_SITE_KEY);
        if (savedSiteName && allSites.length > 0) {
          const savedSite = allSites.find(s => s.name === savedSiteName);
          if (savedSite && savedSite.name !== DEFAULT_SITE_NAME && savedSite.id !== 0) {
            setSelectedSiteId(savedSite.id);
            setSelectedSiteName(savedSite.name);
            await loadSensorsForSite(savedSite.id);
            // Restore sensor selections after sensors are loaded
            // Use setTimeout to ensure sensors state is updated
            setTimeout(async () => {
              await restoreSensorSelections();
            }, 100);
            return; // Early return if restored successfully
          }
        }
      } catch (storageError) {
        console.error('Error restoring site from storage:', storageError);
      }

      // If no saved site, auto-select first non-default site
      if (allSites.length > 0) {
        const nonDefaultSite = allSites.find(s => s.name !== DEFAULT_SITE_NAME && s.id !== 0);
        if (nonDefaultSite) {
          setSelectedSiteId(nonDefaultSite.id);
          setSelectedSiteName(nonDefaultSite.name);
          try {
            await loadSensorsForSite(nonDefaultSite.id);
          } catch (sensorError) {
            console.error('Error loading sensors:', sensorError);
          }
        }
      }
    } catch (error) {
      console.error('Failed to initialize:', error);
      // Don't show alert if it's a minor error
      if (error.message && !error.message.includes('non-fatal')) {
        Alert.alert('Error', 'Failed to load sensor configuration');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadSensorsForSite = async (siteId) => {
    try {
      const sensorNames = await DatabaseManager.getAnalogSensorNameBySiteId(siteId);
      const sensorObjects = await Promise.all(
        sensorNames.map(async (name) => {
          const sensor = await DatabaseManager.getAnalogSensorBySiteIdAndSensorID(siteId, name);
          return sensor;
        })
      );
      setSensors(sensorObjects.filter(s => s !== null));
    } catch (error) {
      console.error('Failed to load sensors:', error);
      setSensors([]);
    }
  };

  const handleSiteChange = async (siteName) => {
    try {
      const site = await DatabaseManager.getSiteFromName(siteName);
      if (!site) {
        Alert.alert('Error', 'Site not found');
        return;
      }

      // Validate: Cannot select default site for readings
      if (site.name === DEFAULT_SITE_NAME || site.id === 0) {
        Alert.alert('Validation Error', 'Cannot take reading with default site');
        return;
      }

      setSelectedSiteId(site.id);
      setSelectedSiteName(site.name);
      
      // Save selected site to AsyncStorage
      try {
        await AsyncStorage.setItem(SELECTED_SITE_KEY, site.name);
      } catch (storageError) {
        console.error('Error saving site to storage:', storageError);
      }
      
      // Reset sensor selections when site changes
      setSensor1(null);
      setSensor2(null);
      setSensor3(null);
      await saveSensorSelections(); // Clear saved sensors
      
      await loadSensorsForSite(site.id);
    } catch (error) {
      console.error('Failed to change site:', error);
      Alert.alert('Error', 'Failed to change site');
    }
  };

  const handleSensor1Change = (sensorIdStr) => {
    if (sensorIdStr === 'none') {
      setSensor1(null);
      setSensor2(null);
      setSensor3(null);
    } else {
      setSensor1(sensorIdStr);
      setSensor2(null);
      setSensor3(null);
    }
    saveSensorSelections();
  };

  const handleSensor2Change = (sensorIdStr) => {
    if (sensorIdStr === 'none') {
      setSensor2(null);
      setSensor3(null);
    } else {
      setSensor2(sensorIdStr);
      setSensor3(null);
    }
    saveSensorSelections();
  };

  const handleSensor3Change = (sensorIdStr) => {
    if (sensorIdStr === 'none') {
      setSensor3(null);
    } else {
      setSensor3(sensorIdStr);
    }
    saveSensorSelections();
  };

  const saveSensorSelections = async () => {
    try {
      const selectedSensors = [sensor1, sensor2, sensor3]
        .filter(s => s !== null && s !== 'none');
      await AsyncStorage.setItem(SELECTED_SENSORS_KEY, JSON.stringify(selectedSensors));
    } catch (error) {
      console.error('Error saving sensor selections:', error);
    }
  };

  const restoreSensorSelections = async () => {
    try {
      const savedData = await AsyncStorage.getItem(SELECTED_SENSORS_KEY);
      if (savedData) {
        const savedSensors = JSON.parse(savedData);
        if (Array.isArray(savedSensors) && savedSensors.length > 0) {
          // Validate that saved sensors still exist in current site
          const validSensors = savedSensors.filter(sensorIdStr =>
            sensors.some(s => s.sensorIdStr === sensorIdStr)
          );
          
          if (validSensors.length > 0) {
            setSensor1(validSensors[0] || null);
            setSensor2(validSensors[1] || null);
            setSensor3(validSensors[2] || null);
          }
        }
      }
    } catch (error) {
      console.error('Error restoring sensor selections:', error);
    }
  };

  const validateSensorSelection = () => {
    const selectedSensors = [sensor1, sensor2, sensor3].filter(s => s !== null && s !== 'none');
    
    // Check: At least one sensor selected
    if (selectedSensors.length === 0) {
      Alert.alert('Validation Error', VALIDATION_MESSAGES.SENSOR_NOT_SELECTED);
      return false;
    }

    // Check: No duplicate sensor types
    const sensorObjects = selectedSensors.map(sensorIdStr => 
      sensors.find(s => s.sensorIdStr === sensorIdStr)
    ).filter(s => s !== undefined);

    const sensorTypes = sensorObjects.map(s => s.sensorType);
    const uniqueTypes = new Set(sensorTypes);
    if (sensorTypes.length !== uniqueTypes.size) {
      Alert.alert('Validation Error', VALIDATION_MESSAGES.DUPLICATE_SENSOR_TYPE);
      return false;
    }

    // Check: Not using default site
    if (!selectedSiteId || selectedSiteName === DEFAULT_SITE_NAME) {
      Alert.alert('Validation Error', 'Cannot take reading with default sensor');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateSensorSelection()) {
      return;
    }

    // Save sensor selections to AsyncStorage
    await saveSensorSelections();
    
    Alert.alert('Success', SUCCESS_MESSAGES.SENSOR_ADDED || 'Sensor selection saved. You can now proceed to "Take Reading" screen.');
  };

  const getSelectedSensorObjects = () => {
    const selectedSensors = [sensor1, sensor2, sensor3]
      .filter(s => s !== null && s !== 'none')
      .map(sensorIdStr => sensors.find(s => s.sensorIdStr === sensorIdStr))
      .filter(s => s !== undefined);
    return selectedSensors;
  };

  const getAvailableSensorsForDropdown = (excludeSensor1 = null, excludeSensor2 = null) => {
    return sensors.filter(s => 
      s.sensorIdStr !== excludeSensor1 && 
      s.sensorIdStr !== excludeSensor2
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading sensor configuration...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Sensor Selection</Text>
        </View>

        <Text style={styles.subtitle}>
          Select up to 3 sensors for reading. No duplicate sensor types allowed.
        </Text>

        {/* Site Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Site Selection</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedSiteName || ''}
              onValueChange={handleSiteChange}
              style={styles.picker}
            >
              <Picker.Item label="Select a site..." value="" />
              {sites
                .filter(site => site.name !== DEFAULT_SITE_NAME && site.id !== 0)
                .map(site => (
                  <Picker.Item key={site.id} label={site.name} value={site.name} />
                ))}
            </Picker>
          </View>
          {selectedSiteName && (
            <Text style={styles.siteInfo}>Selected: {selectedSiteName}</Text>
          )}
        </View>

        {/* Sensor 1 Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sensor 1</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={sensor1 || 'none'}
              onValueChange={handleSensor1Change}
              style={styles.picker}
              enabled={selectedSiteId !== null}
            >
              <Picker.Item label="No Selected Sensor" value="none" />
              {sensors.map(sensor => (
                <Picker.Item
                  key={sensor.sensorCommId}
                  label={`${sensor.sensorIdStr} - ${SENSOR_TYPE_LABELS[sensor.sensorType] || 'Unknown'}`}
                  value={sensor.sensorIdStr}
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* Sensor 2 Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sensor 2</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={sensor2 || 'none'}
              onValueChange={handleSensor2Change}
              style={styles.picker}
              enabled={sensor1 !== null && sensor1 !== 'none'}
            >
              <Picker.Item label="No Selected Sensor" value="none" />
              {getAvailableSensorsForDropdown(sensor1).map(sensor => (
                <Picker.Item
                  key={sensor.sensorCommId}
                  label={`${sensor.sensorIdStr} - ${SENSOR_TYPE_LABELS[sensor.sensorType] || 'Unknown'}`}
                  value={sensor.sensorIdStr}
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* Sensor 3 Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sensor 3</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={sensor3 || 'none'}
              onValueChange={handleSensor3Change}
              style={styles.picker}
              enabled={sensor2 !== null && sensor2 !== 'none'}
            >
              <Picker.Item label="No Selected Sensor" value="none" />
              {getAvailableSensorsForDropdown(sensor1, sensor2).map(sensor => (
                <Picker.Item
                  key={sensor.sensorCommId}
                  label={`${sensor.sensorIdStr} - ${SENSOR_TYPE_LABELS[sensor.sensorType] || 'Unknown'}`}
                  value={sensor.sensorIdStr}
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* Selected Sensors Summary */}
        {getSelectedSensorObjects().length > 0 && (
          <View style={styles.summarySection}>
            <Text style={styles.summaryTitle}>Selected Sensors ({getSelectedSensorObjects().length})</Text>
            {getSelectedSensorObjects().map(sensor => (
              <View key={sensor.sensorCommId} style={styles.summaryItem}>
                <Text style={styles.summaryText}>
                  {sensor.sensorIdStr} - {SENSOR_TYPE_LABELS[sensor.sensorType]}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Save Button */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            (!selectedSiteId || getSelectedSensorObjects().length === 0) && styles.saveButtonDisabled
          ]}
          onPress={handleSave}
          disabled={!selectedSiteId || getSelectedSensorObjects().length === 0}
        >
          <Text style={styles.saveButtonText}>Save Selection</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  backButton: {
    marginRight: Spacing.md,
    padding: Spacing.xs,
  },
  title: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.text,
    flex: 1,
  },
  subtitle: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semiBold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    color: Colors.text,
  },
  siteInfo: {
    fontSize: Typography.size.sm,
    color: Colors.primary,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
  summarySection: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryTitle: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semiBold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  summaryItem: {
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  summaryText: {
    fontSize: Typography.size.sm,
    color: Colors.text,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.border,
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semiBold,
    color: Colors.white,
  },
});

export default SensorSelectionScreen;

