import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Dimensions,
  RefreshControl,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../styles/DesignSystem';
import ScreenHeader from './components/ScreenHeader';
import Card from '../components/Card';

const { width, height } = Dimensions.get('window');

const SensorManagementScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState('All');

  const [sensorStats, setSensorStats] = useState({
    total: 24,
    online: 18,
    offline: 4,
    warning: 2,
    error: 0,
    calibrating: 3,
    maintenance: 1
  });

  const [projects, setProjects] = useState([
    { id: 1, name: 'Bridge Monitoring', sensorCount: 12, status: 'Active' },
    { id: 2, name: 'Foundation Analysis', sensorCount: 8, status: 'Active' },
    { id: 3, name: 'Retaining Wall', sensorCount: 4, status: 'Inactive' }
  ]);

  const [recentSensors, setRecentSensors] = useState([
    {
      id: 1,
      name: 'Strain Gauge Load Cell',
      serialNumber: 'LC001234',
      project: 'Bridge Monitoring',
      status: 'Online',
      lastReading: '2 min ago',
      value: '2,450.5 kN'
    },
    {
      id: 2,
      name: 'Potentiometric Tiltmeter',
      serialNumber: 'TILT002345',
      project: 'Foundation Analysis',
      status: 'Online',
      lastReading: '1 min ago',
      value: '0.15°'
    },
    {
      id: 3,
      name: 'Vibrating Wire Strain Gauge',
      serialNumber: 'VWS003456',
      project: 'Retaining Wall',
      status: 'Offline',
      lastReading: '2 hours ago',
      value: '1,250 με'
    },
    {
      id: 4,
      name: 'RTD Temperature Sensor',
      serialNumber: 'RTD004567',
      project: 'Bridge Monitoring',
      status: 'Warning',
      lastReading: '5 min ago',
      value: '28.5°C'
    }
  ]);

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
      case 'Calibrating': return '#3B82F6';
      case 'Maintenance': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Online': return 'checkmark-circle';
      case 'Offline': return 'close-circle';
      case 'Warning': return 'warning';
      case 'Error': return 'alert-circle';
      case 'Calibrating': return 'time';
      case 'Maintenance': return 'construct';
      default: return 'help-circle';
    }
  };

  const filteredSensors = recentSensors.filter(sensor => {
    const matchesSearch = sensor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         sensor.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         sensor.project.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject = selectedProject === 'All' || sensor.project === selectedProject;
    return matchesSearch && matchesProject;
  });

  const quickActions = [
    {
      title: 'Sensor Library',
      subtitle: 'Browse all sensors',
      icon: 'library',
      color: '#2241DD',
      onPress: () => {
        console.log('Navigating to SensorLibrary');
        try {
          navigation.navigate('SensorLibrary');
        } catch (error) {
          console.error('Navigation error:', error);
          Alert.alert('Error', 'Unable to navigate to Sensor Library');
        }
      }
    },
    {
      title: 'Add New Sensor',
      subtitle: 'Install new sensor',
      icon: 'add-circle',
      color: '#10B981',
      onPress: () => {
        console.log('Navigating to AddSensor');
        try {
          navigation.navigate('AddSensor');
        } catch (error) {
          console.error('Navigation error:', error);
          Alert.alert('Error', 'Unable to navigate to Add Sensor');
        }
      }
    },
    {
      title: 'Calibration',
      subtitle: 'Manage calibrations',
      icon: 'settings',
      color: '#F59E0B',
      onPress: () => {
        console.log('Navigating to Calibration');
        try {
          navigation.navigate('Calibration');
        } catch (error) {
          console.error('Navigation error:', error);
          Alert.alert('Error', 'Unable to navigate to Calibration');
        }
      }
    },
    {
      title: 'Sensor Status',
      subtitle: 'Monitor sensors',
      icon: 'pulse',
      color: '#8B5CF6',
      onPress: () => {
        console.log('Navigating to SensorStatus');
        try {
          navigation.navigate('SensorStatus');
        } catch (error) {
          console.error('Navigation error:', error);
          Alert.alert('Error', 'Unable to navigate to Sensor Status');
        }
      }
    }
  ];

  const renderStatsCard = () => (
    <Card style={styles.statsCard}>
      <Text style={styles.statsTitle}>Sensor Overview</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{sensorStats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#10B981' }]}>{sensorStats.online}</Text>
          <Text style={styles.statLabel}>Online</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#6B7280' }]}>{sensorStats.offline}</Text>
          <Text style={styles.statLabel}>Offline</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#F59E0B' }]}>{sensorStats.warning}</Text>
          <Text style={styles.statLabel}>Warning</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#EF4444' }]}>{sensorStats.error}</Text>
          <Text style={styles.statLabel}>Error</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#3B82F6' }]}>{sensorStats.calibrating}</Text>
          <Text style={styles.statLabel}>Calibrating</Text>
        </View>
      </View>
    </Card>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionsGrid}>
        {quickActions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.quickActionCard, { borderLeftColor: action.color }]}
            onPress={action.onPress}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}>
              <Ionicons name={action.icon} size={24} color="#FFFFFF" />
            </View>
            <View style={styles.quickActionContent}>
              <Text style={styles.quickActionTitle}>{action.title}</Text>
              <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderProjectFilter = () => (
    <View style={styles.filterContainer}>
      <Text style={styles.sectionTitle}>Filter by Project</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.projectFilter}
        contentContainerStyle={styles.projectFilterContent}
      >
        <TouchableOpacity
          style={[styles.projectButton, selectedProject === 'All' && styles.selectedProjectButton]}
          onPress={() => setSelectedProject('All')}
        >
          <Text style={[styles.projectButtonText, selectedProject === 'All' && styles.selectedProjectButtonText]}>
            All Projects
          </Text>
        </TouchableOpacity>
        {projects.map((project) => (
          <TouchableOpacity
            key={project.id}
            style={[styles.projectButton, selectedProject === project.name && styles.selectedProjectButton]}
            onPress={() => setSelectedProject(project.name)}
          >
            <Text style={[styles.projectButtonText, selectedProject === project.name && styles.selectedProjectButtonText]}>
              {project.name}
            </Text>
            <View style={[styles.projectBadge, selectedProject === project.name && styles.selectedProjectBadge]}>
              <Text style={[styles.projectBadgeText, selectedProject === project.name && styles.selectedProjectBadgeText]}>
                {project.sensorCount}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderRecentSensors = () => (
    <View style={styles.recentSensorsContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Sensors</Text>
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={() => {
            try {
              navigation.navigate('SensorStatus');
            } catch (error) {
              console.error('Navigation error:', error);
              Alert.alert('Error', 'Unable to navigate to Sensor Status');
            }
          }}
        >
          <Text style={styles.viewAllButtonText}>View All</Text>
          <Ionicons name="chevron-forward" size={16} color="#2241DD" />
        </TouchableOpacity>
      </View>
      
      {filteredSensors.map((sensor) => (
        <TouchableOpacity
          key={sensor.id}
          style={styles.sensorCard}
          onPress={() => {
            try {
              navigation.navigate('SensorConfiguration', { sensorId: sensor.id, sensor });
            } catch (error) {
              console.error('Navigation error:', error);
              Alert.alert('Error', 'Unable to navigate to Sensor Configuration');
            }
          }}
        >
          <View style={styles.sensorHeader}>
            <View style={styles.sensorInfo}>
              <Text style={styles.sensorName}>{sensor.name}</Text>
              <Text style={styles.sensorSerial}>SN: {sensor.serialNumber}</Text>
              <Text style={styles.sensorProject}>{sensor.project}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(sensor.status) }]}>
              <Ionicons name={getStatusIcon(sensor.status)} size={16} color="#FFFFFF" />
              <Text style={styles.statusText}>{sensor.status}</Text>
            </View>
          </View>
          
          <View style={styles.sensorDetails}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Last Reading</Text>
              <Text style={styles.detailValue}>{sensor.value}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue}>{sensor.lastReading}</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader 
        title="Sensor Management" 
        navigation={navigation} 
        showLogo={true}
        rightAction={
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => {
              try {
                navigation.navigate('AddSensor');
              } catch (error) {
                console.error('Navigation error:', error);
                Alert.alert('Error', 'Unable to navigate to Add Sensor');
              }
            }}
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

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderStatsCard()}
        {renderQuickActions()}
        {renderProjectFilter()}
        {renderRecentSensors()}
        
        {/* Test Navigation Button */}
        <View style={styles.testContainer}>
          <TouchableOpacity 
            style={styles.testButton}
            onPress={() => {
              console.log('Testing navigation to TestSensor');
              try {
                navigation.navigate('TestSensor');
              } catch (error) {
                console.error('Test navigation error:', error);
                Alert.alert('Error', 'Test navigation failed: ' + error.message);
              }
            }}
          >
            <Text style={styles.testButtonText}>Test Navigation</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  statsCard: {
    margin: 16,
    padding: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    width: (width - 80) / 3,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  quickActionsContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  quickActionsGrid: {
    gap: 12,
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderLeftWidth: 4,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  projectFilter: {
    marginTop: 8,
  },
  projectFilterContent: {
    paddingRight: 16,
  },
  projectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    gap: 6,
  },
  selectedProjectButton: {
    backgroundColor: '#2241DD',
  },
  projectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  selectedProjectButtonText: {
    color: '#FFFFFF',
  },
  projectBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  selectedProjectBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  projectBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  selectedProjectBadgeText: {
    color: '#FFFFFF',
  },
  recentSensorsContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2241DD',
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
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  sensorSerial: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 2,
  },
  sensorProject: {
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
  sensorDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  detailItem: {
    flex: 1,
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
  testContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  testButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SensorManagementScreen;