import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Modal,
  Alert,
  Dimensions,
  SafeAreaView,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../styles/DesignSystem';
import ScreenHeader from './components/ScreenHeader';
import Card from '../components/Card';

const { width, height } = Dimensions.get('window');

const SensorLibraryScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAddSensorModal, setShowAddSensorModal] = useState(false);
  const [newSensor, setNewSensor] = useState({
    name: '',
    type: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    location: '',
    status: 'Available'
  });

  const [sensors, setSensors] = useState([
    {
      id: 1,
      name: 'Strain Gauge Load Cell',
      type: 'Load Cell',
      manufacturer: 'Encardio-Rite',
      model: 'LC-001',
      serialNumber: 'LC001234',
      location: 'Warehouse A',
      status: 'Available',
      parameters: {
        range: '0-50 kN',
        accuracy: '±0.1%',
        temperature: '-20°C to +60°C'
      }
    },
    {
      id: 2,
      name: 'Potentiometric Tiltmeter',
      type: 'Tiltmeter',
      manufacturer: 'Geokon',
      model: 'TILT-002',
      serialNumber: 'TILT002345',
      location: 'Site B',
      status: 'In Use',
      parameters: {
        range: '±15°',
        accuracy: '±0.01°',
        temperature: '-40°C to +80°C'
      }
    },
    {
      id: 3,
      name: 'Vibrating Wire Strain Gauge',
      type: 'Strain Gauge',
      manufacturer: 'Geokon',
      model: 'VWS-003',
      serialNumber: 'VWS003456',
      location: 'Lab C',
      status: 'Calibrating',
      parameters: {
        range: '0-3000 με',
        accuracy: '±0.1%',
        temperature: '-20°C to +70°C'
      }
    },
    {
      id: 4,
      name: 'RTD Temperature Sensor',
      type: 'Temperature',
      manufacturer: 'Honeywell',
      model: 'RTD-004',
      serialNumber: 'RTD004567',
      location: 'Warehouse A',
      status: 'Available',
      parameters: {
        range: '-200°C to +600°C',
        accuracy: '±0.1°C',
        temperature: '-200°C to +600°C'
      }
    },
    {
      id: 5,
      name: '4-20mA Pressure Transducer',
      type: 'Pressure',
      manufacturer: 'Sensata',
      model: 'PRS-005',
      serialNumber: 'PRS005678',
      location: 'Site A',
      status: 'In Use',
      parameters: {
        range: '0-100 bar',
        accuracy: '±0.25%',
        temperature: '-40°C to +85°C'
      }
    }
  ]);

  const categories = ['All', 'Load Cell', 'Tiltmeter', 'Strain Gauge', 'Temperature', 'Pressure'];

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 2000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available': return '#10B981';
      case 'In Use': return '#F59E0B';
      case 'Calibrating': return '#3B82F6';
      case 'Maintenance': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'Available': return 'Available';
      case 'In Use': return 'In Use';
      case 'Calibrating': return 'Calibrating';
      case 'Maintenance': return 'Maintenance';
      default: return 'Unknown';
    }
  };

  const filteredSensors = sensors.filter(sensor => {
    const matchesSearch = sensor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         sensor.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         sensor.manufacturer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || sensor.type === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddSensor = () => {
    if (!newSensor.name || !newSensor.type || !newSensor.manufacturer) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const sensor = {
      ...newSensor,
      id: Date.now(),
      parameters: {
        range: '0-100',
        accuracy: '±0.1%',
        temperature: '-20°C to +60°C'
      }
    };

    setSensors(prev => [sensor, ...prev]);
    setNewSensor({
      name: '',
      type: '',
      manufacturer: '',
      model: '',
      serialNumber: '',
      location: '',
      status: 'Available'
    });
    setShowAddSensorModal(false);
    Alert.alert('Success', 'Sensor added successfully!');
  };

  const handleAddToProject = (sensor) => {
    Alert.alert(
      'Add to Project',
      `Add ${sensor.name} to a project?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Add', onPress: () => {
          // Navigate to project selection or add directly
          Alert.alert('Success', `${sensor.name} added to project!`);
        }}
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader 
        title="Sensor Library" 
        navigation={navigation}
        showLogo={true}
        rightAction={
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddSensorModal(true)}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search sensors..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Category Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
        contentContainerStyle={styles.categoryContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.selectedCategoryButton
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[
              styles.categoryButtonText,
              selectedCategory === category && styles.selectedCategoryButtonText
            ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sensors List */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredSensors.map((sensor) => (
          <Card key={sensor.id} style={styles.sensorCard}>
            <View style={styles.sensorHeader}>
              <View style={styles.sensorInfo}>
                <Text style={styles.sensorName}>{sensor.name}</Text>
                <Text style={styles.sensorType}>{sensor.type}</Text>
              </View>
              <View style={styles.sensorActions}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(sensor.status) }]}>
                  <Text style={styles.statusText}>{getStatusText(sensor.status)}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => handleAddToProject(sensor)}
                >
                  <Ionicons name="add-circle" size={20} color="#2241DD" />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.sensorDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Manufacturer:</Text>
                <Text style={styles.detailValue}>{sensor.manufacturer}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Model:</Text>
                <Text style={styles.detailValue}>{sensor.model}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Serial:</Text>
                <Text style={styles.detailValue}>{sensor.serialNumber}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Location:</Text>
                <Text style={styles.detailValue}>{sensor.location}</Text>
              </View>
            </View>

            <View style={styles.parametersContainer}>
              <Text style={styles.parametersTitle}>Specifications:</Text>
              <View style={styles.parametersGrid}>
                <View style={styles.parameterItem}>
                  <Text style={styles.parameterLabel}>Range</Text>
                  <Text style={styles.parameterValue}>{sensor.parameters.range}</Text>
                </View>
                <View style={styles.parameterItem}>
                  <Text style={styles.parameterLabel}>Accuracy</Text>
                  <Text style={styles.parameterValue}>{sensor.parameters.accuracy}</Text>
                </View>
                <View style={styles.parameterItem}>
                  <Text style={styles.parameterLabel}>Temperature</Text>
                  <Text style={styles.parameterValue}>{sensor.parameters.temperature}</Text>
                </View>
              </View>
            </View>
          </Card>
        ))}
      </ScrollView>

      {/* Add Sensor Modal */}
      <Modal
        visible={showAddSensorModal}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowAddSensorModal(false)}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add New Sensor</Text>
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleAddSensor}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Sensor Name *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter sensor name"
                placeholderTextColor="#9CA3AF"
                value={newSensor.name}
                onChangeText={(text) => setNewSensor({...newSensor, name: text})}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Sensor Type *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter sensor type"
                placeholderTextColor="#9CA3AF"
                value={newSensor.type}
                onChangeText={(text) => setNewSensor({...newSensor, type: text})}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Manufacturer *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter manufacturer"
                placeholderTextColor="#9CA3AF"
                value={newSensor.manufacturer}
                onChangeText={(text) => setNewSensor({...newSensor, manufacturer: text})}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Model</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter model number"
                placeholderTextColor="#9CA3AF"
                value={newSensor.model}
                onChangeText={(text) => setNewSensor({...newSensor, model: text})}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Serial Number</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter serial number"
                placeholderTextColor="#9CA3AF"
                value={newSensor.serialNumber}
                onChangeText={(text) => setNewSensor({...newSensor, serialNumber: text})}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Location</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter location"
                placeholderTextColor="#9CA3AF"
                value={newSensor.location}
                onChangeText={(text) => setNewSensor({...newSensor, location: text})}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2241DD',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2241DD',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  categoryContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  categoryContent: {
    paddingRight: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  selectedCategoryButton: {
    backgroundColor: '#2241DD',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  selectedCategoryButtonText: {
    color: '#FFFFFF',
  },
  sensorCard: {
    marginBottom: 16,
    padding: 16,
  },
  sensorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sensorInfo: {
    flex: 1,
  },
  sensorName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  sensorType: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  sensorActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionButton: {
    padding: 8,
  },
  sensorDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  parametersContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  parametersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  parametersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  parameterItem: {
    flex: 1,
    minWidth: '30%',
  },
  parameterLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 2,
  },
  parameterValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: '#111827',
    letterSpacing: 0.3,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  saveButton: {
    backgroundColor: '#2241DD',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#2241DD',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#F8FAFC',
  },
});

export default SensorLibraryScreen;






