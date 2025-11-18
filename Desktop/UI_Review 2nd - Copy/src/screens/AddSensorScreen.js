import React, { useState } from 'react';
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
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../styles/DesignSystem';
import ScreenHeader from './components/ScreenHeader';
import Card from '../components/Card';

const { width, height } = Dimensions.get('window');

const AddSensorScreen = ({ navigation, route }) => {
  const { projectId } = route?.params || {};
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSensorType, setSelectedSensorType] = useState('');
  const [sensorData, setSensorData] = useState({
    name: '',
    type: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    location: '',
    parameters: {
      range: '',
      accuracy: '',
      temperature: '',
      calibrationDate: '',
      nextCalibration: ''
    }
  });

  const sensorTypes = [
    { id: 'strain-gauge', name: 'Strain Gauge Load Cell', icon: 'pulse' },
    { id: 'potentiometric', name: 'Potentiometric', icon: 'trending-up' },
    { id: 'voltage-output', name: 'Voltage Output', icon: 'flash' },
    { id: 'electrolytic-tiltmeter', name: 'Electrolytic Tiltmeter', icon: 'swap-vertical' },
    { id: 'biaxial-tiltmeter', name: 'Uni/Biaxial Tiltmeter', icon: 'swap-vertical' },
    { id: '4-20ma', name: '4 to 20mA', icon: 'analytics' },
    { id: 'vibrating-wire', name: 'Vibrating Wire', icon: 'radio' },
    { id: 'thermistor', name: 'Thermistor', icon: 'thermometer' },
    { id: 'rtd', name: 'RTD', icon: 'thermometer' }
  ];

  const manufacturers = [
    'Encardio-Rite',
    'Geokon',
    'Honeywell',
    'Sensata',
    'Vibrating Wire',
    'Campbell Scientific',
    'Roctest',
    'Other'
  ];

  const locations = [
    'Site A - Main Structure',
    'Site B - Foundation',
    'Site C - Bridge Deck',
    'Site D - Retaining Wall',
    'Laboratory',
    'Warehouse',
    'Field Office',
    'Other'
  ];

  const handleSensorTypeSelect = (type) => {
    setSelectedSensorType(type);
    setSensorData(prev => ({ ...prev, type: type.name }));
    setCurrentStep(2);
  };

  const handleNext = () => {
    if (currentStep === 2 && !sensorData.manufacturer) {
      Alert.alert('Error', 'Please select a manufacturer');
      return;
    }
    if (currentStep === 3 && !sensorData.location) {
      Alert.alert('Error', 'Please select a location');
      return;
    }
    if (currentStep === 4 && !sensorData.serialNumber) {
      Alert.alert('Error', 'Please enter serial number');
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = () => {
    if (!sensorData.name || !sensorData.serialNumber) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    Alert.alert(
      'Success', 
      'Sensor added successfully!',
      [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]
    );
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Select Sensor Type</Text>
      <Text style={styles.stepDescription}>Choose the type of sensor you want to add</Text>
      
      <View style={styles.sensorTypesGrid}>
        {sensorTypes.map((sensor) => (
          <TouchableOpacity
            key={sensor.id}
            style={styles.sensorTypeCard}
            onPress={() => handleSensorTypeSelect(sensor)}
          >
            <View style={styles.sensorTypeIcon}>
              <Ionicons name={sensor.icon} size={24} color="#2241DD" />
            </View>
            <Text style={styles.sensorTypeName}>{sensor.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Select Manufacturer</Text>
      <Text style={styles.stepDescription}>Choose the sensor manufacturer</Text>
      
      <View style={styles.optionsList}>
        {manufacturers.map((manufacturer) => (
          <TouchableOpacity
            key={manufacturer}
            style={[
              styles.optionItem,
              sensorData.manufacturer === manufacturer && styles.selectedOptionItem
            ]}
            onPress={() => setSensorData(prev => ({ ...prev, manufacturer }))}
          >
            <Text style={[
              styles.optionText,
              sensorData.manufacturer === manufacturer && styles.selectedOptionText
            ]}>
              {manufacturer}
            </Text>
            {sensorData.manufacturer === manufacturer && (
              <Ionicons name="checkmark" size={20} color="#2241DD" />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Select Location</Text>
      <Text style={styles.stepDescription}>Choose where the sensor will be installed</Text>
      
      <View style={styles.optionsList}>
        {locations.map((location) => (
          <TouchableOpacity
            key={location}
            style={[
              styles.optionItem,
              sensorData.location === location && styles.selectedOptionItem
            ]}
            onPress={() => setSensorData(prev => ({ ...prev, location }))}
          >
            <Text style={[
              styles.optionText,
              sensorData.location === location && styles.selectedOptionText
            ]}>
              {location}
            </Text>
            {sensorData.location === location && (
              <Ionicons name="checkmark" size={20} color="#2241DD" />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Enter Sensor Details</Text>
      <Text style={styles.stepDescription}>Provide the sensor information</Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Sensor Name *</Text>
        <TextInput
          style={styles.formInput}
          placeholder="Enter sensor name"
          placeholderTextColor="#9CA3AF"
          value={sensorData.name}
          onChangeText={(text) => setSensorData(prev => ({ ...prev, name: text }))}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Model Number</Text>
        <TextInput
          style={styles.formInput}
          placeholder="Enter model number"
          placeholderTextColor="#9CA3AF"
          value={sensorData.model}
          onChangeText={(text) => setSensorData(prev => ({ ...prev, model: text }))}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Serial Number *</Text>
        <TextInput
          style={styles.formInput}
          placeholder="Enter serial number"
          placeholderTextColor="#9CA3AF"
          value={sensorData.serialNumber}
          onChangeText={(text) => setSensorData(prev => ({ ...prev, serialNumber: text }))}
        />
      </View>
    </View>
  );

  const renderStep5 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Sensor Parameters</Text>
      <Text style={styles.stepDescription}>Configure sensor specifications</Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Range</Text>
        <TextInput
          style={styles.formInput}
          placeholder="e.g., 0-50 kN"
          placeholderTextColor="#9CA3AF"
          value={sensorData.parameters.range}
          onChangeText={(text) => setSensorData(prev => ({ 
            ...prev, 
            parameters: { ...prev.parameters, range: text }
          }))}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Accuracy</Text>
        <TextInput
          style={styles.formInput}
          placeholder="e.g., ±0.1%"
          placeholderTextColor="#9CA3AF"
          value={sensorData.parameters.accuracy}
          onChangeText={(text) => setSensorData(prev => ({ 
            ...prev, 
            parameters: { ...prev.parameters, accuracy: text }
          }))}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Temperature Range</Text>
        <TextInput
          style={styles.formInput}
          placeholder="e.g., -20°C to +60°C"
          placeholderTextColor="#9CA3AF"
          value={sensorData.parameters.temperature}
          onChangeText={(text) => setSensorData(prev => ({ 
            ...prev, 
            parameters: { ...prev.parameters, temperature: text }
          }))}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Calibration Date</Text>
        <TextInput
          style={styles.formInput}
          placeholder="DD/MM/YYYY"
          placeholderTextColor="#9CA3AF"
          value={sensorData.parameters.calibrationDate}
          onChangeText={(text) => setSensorData(prev => ({ 
            ...prev, 
            parameters: { ...prev.parameters, calibrationDate: text }
          }))}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Next Calibration</Text>
        <TextInput
          style={styles.formInput}
          placeholder="DD/MM/YYYY"
          placeholderTextColor="#9CA3AF"
          value={sensorData.parameters.nextCalibration}
          onChangeText={(text) => setSensorData(prev => ({ 
            ...prev, 
            parameters: { ...prev.parameters, nextCalibration: text }
          }))}
        />
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return renderStep1();
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader 
        title="Add Sensor" 
        navigation={navigation}
        showLogo={true}
      />
      
      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(currentStep / 5) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>Step {currentStep} of 5</Text>
      </View>

      {/* Step Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderCurrentStep()}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity 
          style={[styles.navButton, styles.previousButton]}
          onPress={handlePrevious}
          disabled={currentStep === 1}
        >
          <Ionicons name="chevron-back" size={20} color={currentStep === 1 ? "#9CA3AF" : "#6B7280"} />
          <Text style={[styles.navButtonText, currentStep === 1 && styles.disabledText]}>
            Previous
          </Text>
        </TouchableOpacity>

        {currentStep < 5 ? (
          <TouchableOpacity 
            style={styles.navButton}
            onPress={handleNext}
          >
            <Text style={styles.navButtonText}>Next</Text>
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.navButton, styles.saveButton]}
            onPress={handleSave}
          >
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
            <Text style={styles.navButtonText}>Save</Text>
          </TouchableOpacity>
        )}
      </View>
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
    paddingHorizontal: 20,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2241DD',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  stepContainer: {
    paddingVertical: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  sensorTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  sensorTypeCard: {
    width: (width - 64) / 2,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sensorTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  sensorTypeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  optionsList: {
    gap: 8,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectedOptionItem: {
    backgroundColor: '#E0E7FF',
    borderColor: '#2241DD',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  selectedOptionText: {
    color: '#2241DD',
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
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
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#2241DD',
    gap: 8,
  },
  previousButton: {
    backgroundColor: '#F3F4F6',
  },
  saveButton: {
    backgroundColor: '#10B981',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disabledText: {
    color: '#9CA3AF',
  },
});

export default AddSensorScreen;






