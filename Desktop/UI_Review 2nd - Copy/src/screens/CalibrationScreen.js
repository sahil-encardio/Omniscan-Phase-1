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

const CalibrationScreen = ({ navigation, route }) => {
  const { sensorId } = route?.params || {};
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('Pending');
  const [showCalibrationModal, setShowCalibrationModal] = useState(false);
  const [calibrationData, setCalibrationData] = useState({
    sensorId: '',
    calibrationDate: '',
    technician: '',
    method: '',
    temperature: '',
    humidity: '',
    referenceValue: '',
    measuredValue: '',
    error: '',
    status: 'Pending'
  });

  const [calibrations, setCalibrations] = useState([
    {
      id: 1,
      sensorId: 'LC001234',
      sensorName: 'Strain Gauge Load Cell',
      calibrationDate: '15/01/2024',
      dueDate: '15/07/2024',
      technician: 'John Smith',
      method: 'Dead Weight',
      status: 'Completed',
      accuracy: '±0.05%',
      temperature: '23°C',
      humidity: '45%',
      results: {
        referenceValue: '10.000 kN',
        measuredValue: '9.995 kN',
        error: '-0.05%',
        uncertainty: '±0.02%'
      }
    },
    {
      id: 2,
      sensorId: 'TILT002345',
      sensorName: 'Potentiometric Tiltmeter',
      calibrationDate: '20/01/2024',
      dueDate: '20/07/2024',
      technician: 'Sarah Johnson',
      method: 'Optical Level',
      status: 'In Progress',
      accuracy: '±0.01°',
      temperature: '22°C',
      humidity: '50%',
      results: null
    },
    {
      id: 3,
      sensorId: 'VWS003456',
      sensorName: 'Vibrating Wire Strain Gauge',
      calibrationDate: '25/01/2024',
      dueDate: '25/07/2024',
      technician: 'Mike Chen',
      method: 'Reference Gauge',
      status: 'Pending',
      accuracy: '±0.1%',
      temperature: '24°C',
      humidity: '48%',
      results: null
    },
    {
      id: 4,
      sensorId: 'RTD004567',
      sensorName: 'RTD Temperature Sensor',
      calibrationDate: '30/01/2024',
      dueDate: '30/07/2024',
      technician: 'Alice Wilson',
      method: 'Ice Point',
      status: 'Overdue',
      accuracy: '±0.1°C',
      temperature: '25°C',
      humidity: '52%',
      results: null
    }
  ]);

  const tabs = ['Pending', 'In Progress', 'Completed', 'Overdue'];

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 2000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return '#10B981';
      case 'In Progress': return '#3B82F6';
      case 'Pending': return '#F59E0B';
      case 'Overdue': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed': return 'checkmark-circle';
      case 'In Progress': return 'time';
      case 'Pending': return 'hourglass';
      case 'Overdue': return 'warning';
      default: return 'help-circle';
    }
  };

  const filteredCalibrations = calibrations.filter(cal => {
    if (selectedTab === 'Pending') return cal.status === 'Pending';
    if (selectedTab === 'In Progress') return cal.status === 'In Progress';
    if (selectedTab === 'Completed') return cal.status === 'Completed';
    if (selectedTab === 'Overdue') return cal.status === 'Overdue';
    return true;
  });

  const handleStartCalibration = (calibration) => {
    setCalibrationData({
      ...calibrationData,
      sensorId: calibration.sensorId,
      sensorName: calibration.sensorName
    });
    setShowCalibrationModal(true);
  };

  const handleSaveCalibration = () => {
    if (!calibrationData.technician || !calibrationData.method) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const newCalibration = {
      ...calibrationData,
      id: Date.now(),
      calibrationDate: new Date().toLocaleDateString('en-GB'),
      status: 'Completed'
    };

    setCalibrations(prev => [newCalibration, ...prev]);
    setShowCalibrationModal(false);
    setCalibrationData({
      sensorId: '',
      calibrationDate: '',
      technician: '',
      method: '',
      temperature: '',
      humidity: '',
      referenceValue: '',
      measuredValue: '',
      error: '',
      status: 'Pending'
    });
    Alert.alert('Success', 'Calibration completed successfully!');
  };

  const renderCalibrationCard = (calibration) => (
    <Card key={calibration.id} style={styles.calibrationCard}>
      <View style={styles.cardHeader}>
        <View style={styles.sensorInfo}>
          <Text style={styles.sensorName}>{calibration.sensorName}</Text>
          <Text style={styles.sensorId}>ID: {calibration.sensorId}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(calibration.status) }]}>
          <Ionicons name={getStatusIcon(calibration.status)} size={16} color="#FFFFFF" />
          <Text style={styles.statusText}>{calibration.status}</Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Calibration Date</Text>
            <Text style={styles.detailValue}>{calibration.calibrationDate}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Due Date</Text>
            <Text style={styles.detailValue}>{calibration.dueDate}</Text>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Technician</Text>
            <Text style={styles.detailValue}>{calibration.technician}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Method</Text>
            <Text style={styles.detailValue}>{calibration.method}</Text>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Temperature</Text>
            <Text style={styles.detailValue}>{calibration.temperature}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Humidity</Text>
            <Text style={styles.detailValue}>{calibration.humidity}</Text>
          </View>
        </View>

        {calibration.results && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>Calibration Results:</Text>
            <View style={styles.resultsGrid}>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Reference</Text>
                <Text style={styles.resultValue}>{calibration.results.referenceValue}</Text>
              </View>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Measured</Text>
                <Text style={styles.resultValue}>{calibration.results.measuredValue}</Text>
              </View>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Error</Text>
                <Text style={styles.resultValue}>{calibration.results.error}</Text>
              </View>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Uncertainty</Text>
                <Text style={styles.resultValue}>{calibration.results.uncertainty}</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      <View style={styles.cardActions}>
        {calibration.status === 'Pending' && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleStartCalibration(calibration)}
          >
            <Ionicons name="play" size={16} color="#2241DD" />
            <Text style={styles.actionButtonText}>Start Calibration</Text>
          </TouchableOpacity>
        )}
        
        {calibration.status === 'In Progress' && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleStartCalibration(calibration)}
          >
            <Ionicons name="checkmark" size={16} color="#10B981" />
            <Text style={styles.actionButtonText}>Complete</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.viewButton}>
          <Ionicons name="eye" size={16} color="#6B7280" />
          <Text style={styles.viewButtonText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader 
        title="Calibration" 
        navigation={navigation}
        showLogo={true}
        rightAction={
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowCalibrationModal(true)}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

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
            <View style={[styles.tabBadge, selectedTab === tab && styles.activeTabBadge]}>
              <Text style={[styles.tabBadgeText, selectedTab === tab && styles.activeTabBadgeText]}>
                {filteredCalibrations.length}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Calibrations List */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredCalibrations.length > 0 ? (
          filteredCalibrations.map(renderCalibrationCard)
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyStateTitle}>No Calibrations</Text>
            <Text style={styles.emptyStateText}>
              {selectedTab === 'Pending' ? 'No pending calibrations' :
               selectedTab === 'In Progress' ? 'No calibrations in progress' :
               selectedTab === 'Completed' ? 'No completed calibrations' :
               'No overdue calibrations'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Calibration Modal */}
      <Modal
        visible={showCalibrationModal}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowCalibrationModal(false)}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Calibration Details</Text>
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleSaveCalibration}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Sensor ID</Text>
              <TextInput
                style={[styles.formInput, styles.disabledInput]}
                value={calibrationData.sensorId}
                editable={false}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Technician *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter technician name"
                placeholderTextColor="#9CA3AF"
                value={calibrationData.technician}
                onChangeText={(text) => setCalibrationData(prev => ({ ...prev, technician: text }))}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Calibration Method *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter calibration method"
                placeholderTextColor="#9CA3AF"
                value={calibrationData.method}
                onChangeText={(text) => setCalibrationData(prev => ({ ...prev, method: text }))}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Temperature</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter temperature"
                placeholderTextColor="#9CA3AF"
                value={calibrationData.temperature}
                onChangeText={(text) => setCalibrationData(prev => ({ ...prev, temperature: text }))}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Humidity</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter humidity"
                placeholderTextColor="#9CA3AF"
                value={calibrationData.humidity}
                onChangeText={(text) => setCalibrationData(prev => ({ ...prev, humidity: text }))}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Reference Value</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter reference value"
                placeholderTextColor="#9CA3AF"
                value={calibrationData.referenceValue}
                onChangeText={(text) => setCalibrationData(prev => ({ ...prev, referenceValue: text }))}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Measured Value</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter measured value"
                placeholderTextColor="#9CA3AF"
                value={calibrationData.measuredValue}
                onChangeText={(text) => setCalibrationData(prev => ({ ...prev, measuredValue: text }))}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Error</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter error percentage"
                placeholderTextColor="#9CA3AF"
                value={calibrationData.error}
                onChangeText={(text) => setCalibrationData(prev => ({ ...prev, error: text }))}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    marginRight: 6,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  tabBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  activeTabBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabBadgeText: {
    color: '#FFFFFF',
  },
  calibrationCard: {
    marginBottom: 16,
    padding: 16,
  },
  cardHeader: {
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
  sensorId: {
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
  cardContent: {
    marginBottom: 16,
  },
  detailsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailItem: {
    flex: 1,
    marginRight: 12,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  resultsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  resultsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  resultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  resultItem: {
    flex: 1,
    minWidth: '45%',
  },
  resultLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 2,
  },
  resultValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#2241DD',
    gap: 4,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2241DD',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 4,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
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
  disabledInput: {
    backgroundColor: '#F3F4F6',
    color: '#9CA3AF',
  },
});

export default CalibrationScreen;