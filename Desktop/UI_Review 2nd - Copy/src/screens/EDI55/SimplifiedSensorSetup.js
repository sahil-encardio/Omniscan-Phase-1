import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius } from '../../styles/DesignSystem';
import DatabaseManager from '../../database/DatabaseManager';
import { SENSOR_TYPE_LABELS, SENSOR_UNITS } from '../../constants/EDI55Constants';

const SimplifiedSensorSetup = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [defaultSite, setDefaultSite] = useState(null);
  const [connections, setConnections] = useState([]);

  useFocusEffect(
    useCallback(() => {
      initializeAndLoad();
    }, [])
  );

  const initializeAndLoad = async () => {
    try {
      setLoading(true);
      await DatabaseManager.initialize();
      
      // Get or create default site
      let site = await DatabaseManager.getDefaultSite();
      if (!site) {
        await DatabaseManager.addSite('Default Site', 'Default site for EDI-55');
        site = await DatabaseManager.getDefaultSite();
      }
      setDefaultSite(site);

      // Load existing sensors for default site
      if (site) {
        const sensors = await DatabaseManager.getSensorsBySiteId(site.id);
        
        // Initialize connections array (1-9)
        const initialConnections = Array.from({ length: 9 }, (_, index) => {
          const connectionNumber = index + 1;
          const existingSensor = sensors.find(s => parseInt(s.sensor_id) === connectionNumber);
          
          return {
            connectionNumber,
            isActive: existingSensor ? existingSensor.is_active === 1 : false,
            sensorType: existingSensor ? existingSensor.sensor_type : 0,
            label: existingSensor?.comments || `Connection ${connectionNumber}`,
            dbId: existingSensor?.id || null,
          };
        });
        
        setConnections(initialConnections);
      }
    } catch (error) {
      console.error('Failed to initialize:', error);
      Alert.alert('Error', 'Failed to load sensor configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleConnection = (index) => {
    const updatedConnections = [...connections];
    updatedConnections[index].isActive = !updatedConnections[index].isActive;
    setConnections(updatedConnections);
  };

  const handleSensorTypeChange = (index, sensorType) => {
    const updatedConnections = [...connections];
    updatedConnections[index].sensorType = sensorType;
    setConnections(updatedConnections);
  };

  const handleSaveConfiguration = async () => {
    try {
      setSaving(true);

      if (!defaultSite) {
        Alert.alert('Error', 'Default site not found');
        return;
      }

      // Save each connection
      for (const connection of connections) {
        const sensorData = {
          siteId: defaultSite.id,
          sensorId: connection.connectionNumber.toString(),
          sensorType: connection.sensorType,
          manufacturer: '',
          model: '',
          serialNumber: '',
          calibrationFactor: 1.0,
          offset: 0.0,
          unit: SENSOR_UNITS[connection.sensorType] || '',
          locationNorth: '',
          locationEast: '',
          comments: connection.label,
        };

        if (connection.dbId) {
          // Update existing sensor
          await DatabaseManager.updateSensor(connection.dbId, sensorData);
          await DatabaseManager.toggleSensorActive(connection.dbId, connection.isActive);
        } else if (connection.isActive) {
          // Add new sensor only if active
          const newSensorId = await DatabaseManager.addSensor(sensorData);
          console.log(`Added sensor ${connection.connectionNumber} with ID: ${newSensorId}`);
        } else if (!connection.isActive && connection.dbId) {
          // Sensor was toggled off - deactivate it
          await DatabaseManager.toggleSensorActive(connection.dbId, false);
        }
      }

      // Reload sensors to get updated state
      await initializeAndLoad();
      
      Alert.alert('Success', `Sensor configuration saved successfully. Active sensors: ${connections.filter(c => c.isActive).length}`);
    } catch (error) {
      console.error('Failed to save configuration:', error);
      Alert.alert('Error', `Failed to save sensor configuration: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const renderConnectionCard = (connection, index) => {
    return (
      <View key={index} style={styles.connectionCard}>
        <View style={styles.connectionHeader}>
          <View style={styles.connectionTitleRow}>
            <Ionicons 
              name="hardware-chip" 
              size={24} 
              color={connection.isActive ? Colors.primary : Colors.text.secondary} 
            />
            <Text style={styles.connectionNumber}>Connection {connection.connectionNumber}</Text>
          </View>
          <Switch
            value={connection.isActive}
            onValueChange={() => handleToggleConnection(index)}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor={Colors.surface}
          />
        </View>

        {connection.isActive && (
          <View style={styles.connectionDetails}>
            <Text style={styles.label}>Sensor Type</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={connection.sensorType}
                onValueChange={(value) => handleSensorTypeChange(index, value)}
                style={styles.picker}
              >
                {SENSOR_TYPE_LABELS.map((label, typeIndex) => (
                  <Picker.Item 
                    key={typeIndex} 
                    label={`${label} (${SENSOR_UNITS[typeIndex]})`} 
                    value={typeIndex} 
                  />
                ))}
              </Picker>
            </View>

            <View style={styles.sensorInfo}>
              <Ionicons name="information-circle-outline" size={16} color={Colors.text.secondary} />
              <Text style={styles.sensorInfoText}>
                Unit: {SENSOR_UNITS[connection.sensorType]}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading configuration...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const activeConnectionsCount = connections.filter(c => c.isActive).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Sensor Setup</Text>
          <Text style={styles.headerSubtitle}>Default Site</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={Colors.primary} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Hardware Connections</Text>
            <Text style={styles.infoText}>
              Toggle connections on/off and select sensor types. Active: {activeConnectionsCount}/9
            </Text>
          </View>
        </View>

        {connections.map((connection, index) => renderConnectionCard(connection, index))}

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSaveConfiguration}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={Colors.surface} />
          ) : (
            <Ionicons name="checkmark-circle" size={24} color={Colors.surface} />
          )}
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Save Configuration'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.body1,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.text.primary,
  },
  headerSubtitle: {
    ...Typography.body2,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: `${Colors.primary}15`,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  infoTitle: {
    ...Typography.body1,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoText: {
    ...Typography.body2,
    color: Colors.text.secondary,
  },
  connectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: Colors.text.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  connectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  connectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  connectionNumber: {
    ...Typography.h3,
    color: Colors.text.primary,
  },
  connectionDetails: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  label: {
    ...Typography.body2,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  pickerContainer: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  sensorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  sensorInfoText: {
    ...Typography.body2,
    color: Colors.text.secondary,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    ...Typography.h3,
    color: Colors.surface,
  },
});

export default SimplifiedSensorSetup;

