import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius } from '../../styles/DesignSystem';
import DatabaseManager from '../../database/DatabaseManager';
import AnalogSensorModel from '../../models/AnalogSensorModel';
import SensorCard from '../../components/EDI55/SensorCard';
import {
  SENSOR_TYPE_LABELS,
  SUCCESS_MESSAGES,
  VALIDATION_MESSAGES,
} from '../../constants/EDI55Constants';

const SensorConfigurationScreen = ({ navigation, route }) => {
  const { siteId, siteName } = route.params || {};
  const [sites, setSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState(siteId || null);
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSensor, setEditingSensor] = useState(null);
  const [formData, setFormData] = useState({
    sensorId: '',
    sensorType: 0,
    manufacturer: '',
    model: '',
    serialNumber: '',
    calibrationFactor: '1.0',
    offset: '0.0',
    unit: '',
    locationNorth: '',
    locationEast: '',
    comments: '',
  });

  useFocusEffect(
    useCallback(() => {
      initializeAndLoad();
    }, [selectedSiteId])
  );

  const initializeAndLoad = async () => {
    try {
      // Ensure database is initialized
      await DatabaseManager.initialize();
      await loadSites();
      if (selectedSiteId) {
        await loadSensors(selectedSiteId);
      }
    } catch (error) {
      console.error('Failed to initialize:', error);
    }
  };

  const loadSites = async () => {
    try {
      const allSites = await DatabaseManager.getAllSites();
      setSites(allSites);
      if (!selectedSiteId && allSites.length > 0) {
        setSelectedSiteId(allSites[0].id);
      }
    } catch (error) {
      console.error('Failed to load sites:', error);
    }
  };

  const loadSensors = async (sId) => {
    try {
      setLoading(true);
      const allSensors = await DatabaseManager.getSensorsBySiteId(sId);
      const sensorModels = allSensors.map(s => AnalogSensorModel.fromDatabase(s));
      setSensors(sensorModels);
    } catch (error) {
      console.error('Failed to load sensors:', error);
      Alert.alert('Error', 'Failed to load sensors');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSensor = () => {
    if (!selectedSiteId) {
      Alert.alert('No Site Selected', 'Please select a site first');
      return;
    }

    setEditingSensor(null);
    setFormData({
      sensorId: '',
      sensorType: 0,
      manufacturer: '',
      model: '',
      serialNumber: '',
      calibrationFactor: '1.0',
      offset: '0.0',
      unit: '',
      locationNorth: '',
      locationEast: '',
      comments: '',
    });
    setModalVisible(true);
  };

  const handleEditSensor = (sensor) => {
    setEditingSensor(sensor);
    setFormData({
      sensorId: sensor.sensorId,
      sensorType: sensor.sensorType,
      manufacturer: sensor.manufacturer || '',
      model: sensor.model || '',
      serialNumber: sensor.serialNumber || '',
      calibrationFactor: String(sensor.calibrationFactor || 1.0),
      offset: String(sensor.offset || 0.0),
      unit: sensor.unit || '',
      locationNorth: sensor.locationNorth || '',
      locationEast: sensor.locationEast || '',
      comments: sensor.comments || '',
    });
    setModalVisible(true);
  };

  const handleDeleteSensor = (sensor) => {
    Alert.alert(
      'Delete Sensor',
      `Are you sure you want to delete sensor "${sensor.sensorId}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await DatabaseManager.deleteSensor(sensor.id);
              Alert.alert('Success', SUCCESS_MESSAGES.SENSOR_DELETED);
              loadSensors(selectedSiteId);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete sensor');
            }
          },
        },
      ]
    );
  };

  const handleToggleActive = async (sensor) => {
    try {
      const newActiveState = !sensor.isActiveStatus();
      await DatabaseManager.toggleSensorActive(sensor.id, newActiveState);
      loadSensors(selectedSiteId);
    } catch (error) {
      Alert.alert('Error', 'Failed to toggle sensor active state');
    }
  };

  const handleSaveSensor = async () => {
    try {
      const sensorData = {
        siteId: selectedSiteId,
        sensorId: formData.sensorId,
        sensorType: formData.sensorType,
        manufacturer: formData.manufacturer,
        model: formData.model,
        serialNumber: formData.serialNumber,
        calibrationFactor: parseFloat(formData.calibrationFactor) || 1.0,
        offset: parseFloat(formData.offset) || 0.0,
        unit: formData.unit,
        locationNorth: formData.locationNorth,
        locationEast: formData.locationEast,
        comments: formData.comments,
      };

      const sensor = new AnalogSensorModel(sensorData);
      const validation = sensor.validate();

      if (!validation.isValid) {
        Alert.alert('Validation Error', validation.errors.join('\n'));
        return;
      }

      if (editingSensor) {
        // Update existing sensor
        await DatabaseManager.updateSensor(editingSensor.id, sensorData);
        Alert.alert('Success', SUCCESS_MESSAGES.SENSOR_UPDATED);
      } else {
        // Add new sensor
        await DatabaseManager.addSensor(sensorData);
        Alert.alert('Success', SUCCESS_MESSAGES.SENSOR_ADDED);
      }

      setModalVisible(false);
      loadSensors(selectedSiteId);
    } catch (error) {
      if (error.message.includes('already exists')) {
        Alert.alert('Error', 'A sensor with this ID already exists for this site');
      } else {
        Alert.alert('Error', 'Failed to save sensor');
      }
    }
  };

  const handleSiteChange = (sId) => {
    setSelectedSiteId(sId);
    loadSensors(sId);
  };

  const selectedSite = sites.find(s => s.id === selectedSiteId);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sensor Configuration</Text>
        <TouchableOpacity onPress={handleAddSensor} style={styles.addButton}>
          <Ionicons name="add-circle" size={28} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Site Selector */}
        <View style={styles.selectorCard}>
          <Text style={styles.selectorLabel}>Select Site</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedSiteId}
              onValueChange={handleSiteChange}
              style={styles.picker}
            >
              {sites.map((site) => (
                <Picker.Item
                  key={site.id}
                  label={site.name}
                  value={site.id}
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* Sensors List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : sensors.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="hardware-chip-outline" size={64} color={Colors.text.disabled} />
            <Text style={styles.emptyText}>No sensors configured</Text>
            <Text style={styles.emptySubtext}>Tap the + button to add a sensor</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>
              Sensors ({sensors.length})
            </Text>
            {sensors.map((sensor) => (
              <SensorCard
                key={sensor.id}
                sensor={sensor}
                onEdit={handleEditSensor}
                onDelete={handleDeleteSensor}
                onToggleActive={handleToggleActive}
              />
            ))}
          </>
        )}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      {/* Add/Edit Sensor Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingSensor ? 'Edit Sensor' : 'Add New Sensor'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Sensor ID *</Text>
              <TextInput
                style={styles.input}
                value={formData.sensorId}
                onChangeText={(text) => setFormData({ ...formData, sensorId: text })}
                placeholder="Enter sensor ID"
                placeholderTextColor={Colors.text.disabled}
                maxLength={50}
                editable={!editingSensor}
              />

              <Text style={styles.label}>Sensor Type *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.sensorType}
                  onValueChange={(value) => setFormData({ ...formData, sensorType: value })}
                  style={styles.picker}
                  enabled={!editingSensor}
                >
                  {SENSOR_TYPE_LABELS.map((label, index) => (
                    <Picker.Item key={index} label={label} value={index} />
                  ))}
                </Picker>
              </View>

              <Text style={styles.label}>Manufacturer</Text>
              <TextInput
                style={styles.input}
                value={formData.manufacturer}
                onChangeText={(text) => setFormData({ ...formData, manufacturer: text })}
                placeholder="Enter manufacturer"
                placeholderTextColor={Colors.text.disabled}
              />

              <Text style={styles.label}>Model</Text>
              <TextInput
                style={styles.input}
                value={formData.model}
                onChangeText={(text) => setFormData({ ...formData, model: text })}
                placeholder="Enter model"
                placeholderTextColor={Colors.text.disabled}
              />

              <Text style={styles.label}>Serial Number</Text>
              <TextInput
                style={styles.input}
                value={formData.serialNumber}
                onChangeText={(text) => setFormData({ ...formData, serialNumber: text })}
                placeholder="Enter serial number"
                placeholderTextColor={Colors.text.disabled}
              />

              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <Text style={styles.label}>Calibration Factor</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.calibrationFactor}
                    onChangeText={(text) => setFormData({ ...formData, calibrationFactor: text })}
                    placeholder="1.0"
                    placeholderTextColor={Colors.text.disabled}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.halfWidth}>
                  <Text style={styles.label}>Offset</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.offset}
                    onChangeText={(text) => setFormData({ ...formData, offset: text })}
                    placeholder="0.0"
                    placeholderTextColor={Colors.text.disabled}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={styles.label}>Unit</Text>
              <TextInput
                style={styles.input}
                value={formData.unit}
                onChangeText={(text) => setFormData({ ...formData, unit: text })}
                placeholder="e.g., mm, °C, mV"
                placeholderTextColor={Colors.text.disabled}
              />

              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <Text style={styles.label}>Location North</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.locationNorth}
                    onChangeText={(text) => setFormData({ ...formData, locationNorth: text })}
                    placeholder="Northing"
                    placeholderTextColor={Colors.text.disabled}
                  />
                </View>

                <View style={styles.halfWidth}>
                  <Text style={styles.label}>Location East</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.locationEast}
                    onChangeText={(text) => setFormData({ ...formData, locationEast: text })}
                    placeholder="Easting"
                    placeholderTextColor={Colors.text.disabled}
                  />
                </View>
              </View>

              <Text style={styles.label}>Comments</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.comments}
                onChangeText={(text) => setFormData({ ...formData, comments: text })}
                placeholder="Enter comments (optional)"
                placeholderTextColor={Colors.text.disabled}
                multiline
                numberOfLines={4}
                maxLength={500}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleSaveSensor}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>

              <View style={{ height: Spacing.xl }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    padding: Spacing.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  selectorCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  selectorLabel: {
    ...Typography.body1,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  pickerContainer: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  picker: {
    ...Typography.body1,
    color: Colors.text.primary,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  loadingContainer: {
    paddingVertical: Spacing.xl * 2,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  emptyText: {
    ...Typography.h3,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
  },
  emptySubtext: {
    ...Typography.body2,
    color: Colors.text.disabled,
    marginTop: Spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    ...Typography.h2,
    color: Colors.text.primary,
  },
  form: {
    padding: Spacing.lg,
  },
  label: {
    ...Typography.body1,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    fontWeight: '600',
  },
  input: {
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.body1,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.background.tertiary,
    marginRight: Spacing.sm,
  },
  cancelButtonText: {
    ...Typography.button,
    color: Colors.text.primary,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    marginLeft: Spacing.sm,
  },
  saveButtonText: {
    ...Typography.button,
    color: Colors.surface,
  },
});

export default SensorConfigurationScreen;

