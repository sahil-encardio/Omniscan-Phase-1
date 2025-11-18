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

const SensorConfigurationScreen = ({ navigation, route }) => {
  const { sensorId, sensor } = route?.params || {};
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('Parameters');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({});

  const [sensorConfig, setSensorConfig] = useState({
    id: sensorId || 1,
    name: sensor?.name || 'Strain Gauge Load Cell',
    type: sensor?.type || 'Load Cell',
    serialNumber: sensor?.serialNumber || 'LC001234',
    location: sensor?.location || 'Bridge Deck - Span 1',
    status: sensor?.status || 'Online',
    parameters: {
      range: '0-50 kN',
      accuracy: '±0.1%',
      temperature: '-20°C to +60°C',
      calibrationDate: '15/01/2024',
      nextCalibration: '15/07/2024',
      samplingRate: '1 Hz',
      dataFormat: 'Digital',
      communicationProtocol: 'RS485',
      powerSupply: '24V DC',
      currentConsumption: '50 mA'
    },
    coefficients: {
      a0: 0.0,
      a1: 1.0,
      a2: 0.0,
      a3: 0.0,
      a4: 0.0,
      a5: 0.0
    },
    thresholds: {
      minValue: 0,
      maxValue: 50000,
      warningLow: 1000,
      warningHigh: 45000,
      alarmLow: 500,
      alarmHigh: 47500
    },
    readings: [
      { time: '12:00:00', value: '2,450.5 kN', status: 'Normal', raw: 2450.5 },
      { time: '11:59:30', value: '2,448.2 kN', status: 'Normal', raw: 2448.2 },
      { time: '11:59:00', value: '2,451.1 kN', status: 'Normal', raw: 2451.1 },
      { time: '11:58:30', value: '2,449.8 kN', status: 'Normal', raw: 2449.8 },
      { time: '11:58:00', value: '2,452.3 kN', status: 'Normal', raw: 2452.3 },
      { time: '11:57:30', value: '2,447.9 kN', status: 'Normal', raw: 2447.9 },
      { time: '11:57:00', value: '2,450.1 kN', status: 'Normal', raw: 2450.1 },
      { time: '11:56:30', value: '2,453.2 kN', status: 'Normal', raw: 2453.2 }
    ]
  });

  const tabs = ['Parameters', 'Coefficients', 'Thresholds', 'Readings'];

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 2000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Online': return '#10B981';
      case 'Offline': return '#6B7280';
      case 'Warning': return '#F59E0B';
      case 'Error': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Online': return 'checkmark-circle';
      case 'Offline': return 'close-circle';
      case 'Warning': return 'warning';
      case 'Error': return 'alert-circle';
      default: return 'help-circle';
    }
  };

  const getReadingStatusColor = (status) => {
    switch (status) {
      case 'Normal': return '#10B981';
      case 'Warning': return '#F59E0B';
      case 'Alarm': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const handleEdit = (section) => {
    setEditData(sensorConfig[section] || {});
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    setSensorConfig(prev => ({
      ...prev,
      [Object.keys(editData)[0]]: editData
    }));
    setShowEditModal(false);
    setEditData({});
    Alert.alert('Success', 'Configuration updated successfully!');
  };

  const renderParametersTab = () => (
    <View style={styles.tabContent}>
      <Card style={styles.configCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Basic Parameters</Text>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => handleEdit('parameters')}
          >
            <Ionicons name="create" size={16} color="#2241DD" />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.parametersGrid}>
          <View style={styles.parameterItem}>
            <Text style={styles.parameterLabel}>Range</Text>
            <Text style={styles.parameterValue}>{sensorConfig.parameters.range}</Text>
          </View>
          <View style={styles.parameterItem}>
            <Text style={styles.parameterLabel}>Accuracy</Text>
            <Text style={styles.parameterValue}>{sensorConfig.parameters.accuracy}</Text>
          </View>
          <View style={styles.parameterItem}>
            <Text style={styles.parameterLabel}>Temperature Range</Text>
            <Text style={styles.parameterValue}>{sensorConfig.parameters.temperature}</Text>
          </View>
          <View style={styles.parameterItem}>
            <Text style={styles.parameterLabel}>Calibration Date</Text>
            <Text style={styles.parameterValue}>{sensorConfig.parameters.calibrationDate}</Text>
          </View>
          <View style={styles.parameterItem}>
            <Text style={styles.parameterLabel}>Next Calibration</Text>
            <Text style={styles.parameterValue}>{sensorConfig.parameters.nextCalibration}</Text>
          </View>
          <View style={styles.parameterItem}>
            <Text style={styles.parameterLabel}>Sampling Rate</Text>
            <Text style={styles.parameterValue}>{sensorConfig.parameters.samplingRate}</Text>
          </View>
          <View style={styles.parameterItem}>
            <Text style={styles.parameterLabel}>Data Format</Text>
            <Text style={styles.parameterValue}>{sensorConfig.parameters.dataFormat}</Text>
          </View>
          <View style={styles.parameterItem}>
            <Text style={styles.parameterLabel}>Communication</Text>
            <Text style={styles.parameterValue}>{sensorConfig.parameters.communicationProtocol}</Text>
          </View>
          <View style={styles.parameterItem}>
            <Text style={styles.parameterLabel}>Power Supply</Text>
            <Text style={styles.parameterValue}>{sensorConfig.parameters.powerSupply}</Text>
          </View>
          <View style={styles.parameterItem}>
            <Text style={styles.parameterLabel}>Current Consumption</Text>
            <Text style={styles.parameterValue}>{sensorConfig.parameters.currentConsumption}</Text>
          </View>
        </View>
      </Card>
    </View>
  );

  const renderCoefficientsTab = () => (
    <View style={styles.tabContent}>
      <Card style={styles.configCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Calibration Coefficients</Text>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => handleEdit('coefficients')}
          >
            <Ionicons name="create" size={16} color="#2241DD" />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.coefficientsGrid}>
          {Object.entries(sensorConfig.coefficients).map(([key, value]) => (
            <View key={key} style={styles.coefficientItem}>
              <Text style={styles.coefficientLabel}>A{key.slice(1)}</Text>
              <Text style={styles.coefficientValue}>{value}</Text>
            </View>
          ))}
        </View>
      </Card>
    </View>
  );

  const renderThresholdsTab = () => (
    <View style={styles.tabContent}>
      <Card style={styles.configCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Alarm Thresholds</Text>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => handleEdit('thresholds')}
          >
            <Ionicons name="create" size={16} color="#2241DD" />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.thresholdsGrid}>
          <View style={styles.thresholdItem}>
            <Text style={styles.thresholdLabel}>Minimum Value</Text>
            <Text style={styles.thresholdValue}>{sensorConfig.thresholds.minValue}</Text>
          </View>
          <View style={styles.thresholdItem}>
            <Text style={styles.thresholdLabel}>Maximum Value</Text>
            <Text style={styles.thresholdValue}>{sensorConfig.thresholds.maxValue}</Text>
          </View>
          <View style={styles.thresholdItem}>
            <Text style={styles.thresholdLabel}>Warning Low</Text>
            <Text style={styles.thresholdValue}>{sensorConfig.thresholds.warningLow}</Text>
          </View>
          <View style={styles.thresholdItem}>
            <Text style={styles.thresholdLabel}>Warning High</Text>
            <Text style={styles.thresholdValue}>{sensorConfig.thresholds.warningHigh}</Text>
          </View>
          <View style={styles.thresholdItem}>
            <Text style={styles.thresholdLabel}>Alarm Low</Text>
            <Text style={styles.thresholdValue}>{sensorConfig.thresholds.alarmLow}</Text>
          </View>
          <View style={styles.thresholdItem}>
            <Text style={styles.thresholdLabel}>Alarm High</Text>
            <Text style={styles.thresholdValue}>{sensorConfig.thresholds.alarmHigh}</Text>
          </View>
        </View>
      </Card>
    </View>
  );

  const renderReadingsTab = () => (
    <View style={styles.tabContent}>
      <Card style={styles.configCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Live Readings</Text>
          <TouchableOpacity style={styles.refreshButton}>
            <Ionicons name="refresh" size={16} color="#2241DD" />
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.readingsList}>
          {sensorConfig.readings.map((reading, index) => (
            <View key={index} style={styles.readingItem}>
              <View style={styles.readingTime}>
                <Text style={styles.readingTimeText}>{reading.time}</Text>
              </View>
              <View style={styles.readingValue}>
                <Text style={styles.readingValueText}>{reading.value}</Text>
                <Text style={styles.readingRawText}>Raw: {reading.raw}</Text>
              </View>
              <View style={styles.readingStatus}>
                <View style={[styles.statusDot, { 
                  backgroundColor: getReadingStatusColor(reading.status) 
                }]} />
                <Text style={styles.readingStatusText}>{reading.status}</Text>
              </View>
            </View>
          ))}
        </View>
      </Card>
    </View>
  );

  const renderCurrentTab = () => {
    switch (selectedTab) {
      case 'Parameters': return renderParametersTab();
      case 'Coefficients': return renderCoefficientsTab();
      case 'Thresholds': return renderThresholdsTab();
      case 'Readings': return renderReadingsTab();
      default: return renderParametersTab();
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader 
        title="Sensor Configuration" 
        navigation={navigation}
        showLogo={true}
      />

      {/* Sensor Info Header */}
      <Card style={styles.sensorInfoCard}>
        <View style={styles.sensorHeader}>
          <View style={styles.sensorInfo}>
            <Text style={styles.sensorName}>{sensorConfig.name}</Text>
            <Text style={styles.sensorSerial}>SN: {sensorConfig.serialNumber}</Text>
            <Text style={styles.sensorLocation}>{sensorConfig.location}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(sensorConfig.status) }]}>
            <Ionicons name={getStatusIcon(sensorConfig.status)} size={16} color="#FFFFFF" />
            <Text style={styles.statusText}>{sensorConfig.status}</Text>
          </View>
        </View>
      </Card>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, selectedTab === tab && styles.activeTab]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text style={[styles.tabText, selectedTab === tab && styles.activeTabText]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderCurrentTab()}
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowEditModal(false)}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Configuration</Text>
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleSaveEdit}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {Object.entries(editData).map(([key, value]) => (
              <View key={key} style={styles.formGroup}>
                <Text style={styles.formLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
                <TextInput
                  style={styles.formInput}
                  value={value.toString()}
                  onChangeText={(text) => setEditData(prev => ({ ...prev, [key]: text }))}
                />
              </View>
            ))}
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
  sensorInfoCard: {
    margin: 16,
    padding: 16,
  },
  sensorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  sensorSerial: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 2,
  },
  sensorLocation: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  activeTab: {
    backgroundColor: '#2241DD',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  tabContent: {
    paddingVertical: 16,
  },
  configCard: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#2241DD',
    gap: 4,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2241DD',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#2241DD',
    gap: 4,
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2241DD',
  },
  parametersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  parameterItem: {
    width: '48%',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  parameterLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  parameterValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  coefficientsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  coefficientItem: {
    width: '30%',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  coefficientLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  coefficientValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  thresholdsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  thresholdItem: {
    width: '48%',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  thresholdLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  thresholdValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  readingsList: {
    gap: 8,
  },
  readingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  readingTime: {
    width: 80,
  },
  readingTimeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  readingValue: {
    flex: 1,
    marginLeft: 12,
  },
  readingValueText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  readingRawText: {
    fontSize: 10,
    fontWeight: '400',
    color: '#9CA3AF',
  },
  readingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  readingStatusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
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

export default SensorConfigurationScreen;






