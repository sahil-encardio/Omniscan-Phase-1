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

const SensorStatusScreen = ({ navigation, route }) => {
  const { projectId } = route?.params || {};
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState({
    status: 'All',
    type: 'All',
    location: 'All'
  });

  const [sensors, setSensors] = useState([
    {
      id: 1,
      name: 'Strain Gauge Load Cell',
      type: 'Load Cell',
      serialNumber: 'LC001234',
      location: 'Bridge Deck - Span 1',
      status: 'Online',
      batteryLevel: 85,
      signalStrength: 95,
      lastReading: '2 minutes ago',
      lastValue: '2,450.5 kN',
      temperature: '23.5°C',
      humidity: '45%',
      readings: [
        { time: '12:00', value: '2,450.5 kN', status: 'Normal' },
        { time: '11:58', value: '2,448.2 kN', status: 'Normal' },
        { time: '11:56', value: '2,451.1 kN', status: 'Normal' },
        { time: '11:54', value: '2,449.8 kN', status: 'Normal' },
        { time: '11:52', value: '2,452.3 kN', status: 'Normal' }
      ]
    },
    {
      id: 2,
      name: 'Potentiometric Tiltmeter',
      type: 'Tiltmeter',
      serialNumber: 'TILT002345',
      location: 'Foundation - Pier 2',
      status: 'Online',
      batteryLevel: 92,
      signalStrength: 88,
      lastReading: '1 minute ago',
      lastValue: '0.15°',
      temperature: '22.8°C',
      humidity: '48%',
      readings: [
        { time: '12:00', value: '0.15°', status: 'Normal' },
        { time: '11:58', value: '0.14°', status: 'Normal' },
        { time: '11:56', value: '0.16°', status: 'Normal' },
        { time: '11:54', value: '0.15°', status: 'Normal' },
        { time: '11:52', value: '0.17°', status: 'Normal' }
      ]
    },
    {
      id: 3,
      name: 'Vibrating Wire Strain Gauge',
      type: 'Strain Gauge',
      serialNumber: 'VWS003456',
      location: 'Retaining Wall - Section A',
      status: 'Offline',
      batteryLevel: 15,
      signalStrength: 0,
      lastReading: '2 hours ago',
      lastValue: '1,250 με',
      temperature: '24.1°C',
      humidity: '52%',
      readings: [
        { time: '10:00', value: '1,250 με', status: 'Normal' },
        { time: '09:58', value: '1,248 με', status: 'Normal' },
        { time: '09:56', value: '1,252 με', status: 'Normal' },
        { time: '09:54', value: '1,249 με', status: 'Normal' },
        { time: '09:52', value: '1,251 με', status: 'Normal' }
      ]
    },
    {
      id: 4,
      name: 'RTD Temperature Sensor',
      type: 'Temperature',
      serialNumber: 'RTD004567',
      location: 'Concrete Core - Column 3',
      status: 'Warning',
      batteryLevel: 45,
      signalStrength: 75,
      lastReading: '5 minutes ago',
      lastValue: '28.5°C',
      temperature: '28.5°C',
      humidity: '55%',
      readings: [
        { time: '12:00', value: '28.5°C', status: 'Warning' },
        { time: '11:58', value: '28.2°C', status: 'Normal' },
        { time: '11:56', value: '28.8°C', status: 'Warning' },
        { time: '11:54', value: '28.1°C', status: 'Normal' },
        { time: '11:52', value: '28.9°C', status: 'Warning' }
      ]
    },
    {
      id: 5,
      name: '4-20mA Pressure Transducer',
      type: 'Pressure',
      serialNumber: 'PRS005678',
      location: 'Hydraulic System - Pump 1',
      status: 'Error',
      batteryLevel: 0,
      signalStrength: 0,
      lastReading: '1 day ago',
      lastValue: 'N/A',
      temperature: 'N/A',
      humidity: 'N/A',
      readings: []
    }
  ]);

  const statusOptions = ['All', 'Online', 'Offline', 'Warning', 'Error'];
  const typeOptions = ['All', 'Load Cell', 'Tiltmeter', 'Strain Gauge', 'Temperature', 'Pressure'];
  const locationOptions = ['All', 'Bridge Deck', 'Foundation', 'Retaining Wall', 'Concrete Core', 'Hydraulic System'];

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

  const getBatteryColor = (level) => {
    if (level > 50) return '#10B981';
    if (level > 20) return '#F59E0B';
    return '#EF4444';
  };

  const getSignalColor = (strength) => {
    if (strength > 80) return '#10B981';
    if (strength > 50) return '#F59E0B';
    return '#EF4444';
  };

  const filteredSensors = sensors.filter(sensor => {
    const matchesSearch = sensor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         sensor.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         sensor.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filters.status === 'All' || sensor.status === filters.status;
    const matchesType = filters.type === 'All' || sensor.type === filters.type;
    const matchesLocation = filters.location === 'All' || sensor.location.includes(filters.location);
    return matchesSearch && matchesStatus && matchesType && matchesLocation;
  });

  const handleSensorPress = (sensor) => {
    navigation.navigate('SensorConfiguration', { sensorId: sensor.id, sensor });
  };

  const renderSensorCard = (sensor) => (
    <TouchableOpacity 
      key={sensor.id} 
      style={styles.sensorCard}
      onPress={() => handleSensorPress(sensor)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.sensorInfo}>
          <Text style={styles.sensorName}>{sensor.name}</Text>
          <Text style={styles.sensorSerial}>SN: {sensor.serialNumber}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(sensor.status) }]}>
          <Ionicons name={getStatusIcon(sensor.status)} size={16} color="#FFFFFF" />
          <Text style={styles.statusText}>{sensor.status}</Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.locationRow}>
          <Ionicons name="location" size={16} color="#6B7280" />
          <Text style={styles.locationText}>{sensor.location}</Text>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Last Reading</Text>
            <Text style={styles.metricValue}>{sensor.lastValue}</Text>
            <Text style={styles.metricTime}>{sensor.lastReading}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Battery</Text>
            <View style={styles.batteryContainer}>
              <View style={[styles.batteryBar, { 
                width: `${sensor.batteryLevel}%`, 
                backgroundColor: getBatteryColor(sensor.batteryLevel) 
              }]} />
            </View>
            <Text style={styles.metricValue}>{sensor.batteryLevel}%</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Signal</Text>
            <View style={styles.signalContainer}>
              <View style={[styles.signalBar, { 
                width: `${sensor.signalStrength}%`, 
                backgroundColor: getSignalColor(sensor.signalStrength) 
              }]} />
            </View>
            <Text style={styles.metricValue}>{sensor.signalStrength}%</Text>
          </View>
        </View>

        <View style={styles.environmentRow}>
          <View style={styles.envItem}>
            <Ionicons name="thermometer" size={14} color="#6B7280" />
            <Text style={styles.envText}>{sensor.temperature}</Text>
          </View>
          <View style={styles.envItem}>
            <Ionicons name="water" size={14} color="#6B7280" />
            <Text style={styles.envText}>{sensor.humidity}</Text>
          </View>
        </View>

        {sensor.readings.length > 0 && (
          <View style={styles.readingsContainer}>
            <Text style={styles.readingsTitle}>Recent Readings:</Text>
            <View style={styles.readingsList}>
              {sensor.readings.slice(0, 3).map((reading, index) => (
                <View key={index} style={styles.readingItem}>
                  <Text style={styles.readingTime}>{reading.time}</Text>
                  <Text style={styles.readingValue}>{reading.value}</Text>
                  <View style={[styles.readingStatus, { 
                    backgroundColor: reading.status === 'Normal' ? '#10B981' : 
                                   reading.status === 'Warning' ? '#F59E0B' : '#EF4444'
                  }]} />
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader 
        title="Sensor Status" 
        navigation={navigation}
        showLogo={true}
        rightAction={
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Ionicons name="filter" size={24} color="#FFFFFF" />
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

      {/* Status Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.statusContainer}
        contentContainerStyle={styles.statusContent}
      >
        {statusOptions.map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.statusButton,
              selectedStatus === status && styles.selectedStatusButton
            ]}
            onPress={() => setSelectedStatus(status)}
          >
            <Text style={[
              styles.statusButtonText,
              selectedStatus === status && styles.selectedStatusButtonText
            ]}>
              {status}
            </Text>
            <View style={[styles.statusCount, selectedStatus === status && styles.selectedStatusCount]}>
              <Text style={[styles.statusCountText, selectedStatus === status && styles.selectedStatusCountText]}>
                {sensors.filter(s => status === 'All' || s.status === status).length}
              </Text>
            </View>
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
        {filteredSensors.map(renderSensorCard)}
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowFilterModal(false)}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Filter Sensors</Text>
            <TouchableOpacity 
              style={styles.applyButton}
              onPress={() => setShowFilterModal(false)}
            >
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Status</Text>
              {statusOptions.map((status) => (
                <TouchableOpacity
                  key={status}
                  style={styles.filterOption}
                  onPress={() => setFilters(prev => ({ ...prev, status }))}
                >
                  <Text style={styles.filterOptionText}>{status}</Text>
                  {filters.status === status && (
                    <Ionicons name="checkmark" size={20} color="#2241DD" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Type</Text>
              {typeOptions.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={styles.filterOption}
                  onPress={() => setFilters(prev => ({ ...prev, type }))}
                >
                  <Text style={styles.filterOptionText}>{type}</Text>
                  {filters.type === type && (
                    <Ionicons name="checkmark" size={20} color="#2241DD" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Location</Text>
              {locationOptions.map((location) => (
                <TouchableOpacity
                  key={location}
                  style={styles.filterOption}
                  onPress={() => setFilters(prev => ({ ...prev, location }))}
                >
                  <Text style={styles.filterOptionText}>{location}</Text>
                  {filters.location === location && (
                    <Ionicons name="checkmark" size={20} color="#2241DD" />
                  )}
                </TouchableOpacity>
              ))}
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
  filterButton: {
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
  statusContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statusContent: {
    paddingRight: 16,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    gap: 6,
  },
  selectedStatusButton: {
    backgroundColor: '#2241DD',
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  selectedStatusButtonText: {
    color: '#FFFFFF',
  },
  statusCount: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  selectedStatusCount: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  statusCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  selectedStatusCountText: {
    color: '#FFFFFF',
  },
  sensorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  sensorSerial: {
    fontSize: 12,
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
    gap: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  metricTime: {
    fontSize: 10,
    fontWeight: '400',
    color: '#9CA3AF',
  },
  batteryContainer: {
    width: 40,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginBottom: 4,
  },
  batteryBar: {
    height: '100%',
    borderRadius: 3,
  },
  signalContainer: {
    width: 40,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginBottom: 4,
  },
  signalBar: {
    height: '100%',
    borderRadius: 3,
  },
  environmentRow: {
    flexDirection: 'row',
    gap: 16,
  },
  envItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  envText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  readingsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  readingsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  readingsList: {
    gap: 4,
  },
  readingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  readingTime: {
    fontSize: 10,
    fontWeight: '500',
    color: '#9CA3AF',
    width: 40,
  },
  readingValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginLeft: 8,
  },
  readingStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
  applyButton: {
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
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filterOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
});

export default SensorStatusScreen;






