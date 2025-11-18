import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../components/Card';
import ScreenHeader from './components/ScreenHeader';
import { Spacing, Typography, Colors, BorderRadius, Shadows } from '../styles/DesignSystem';

const ChooseExistingScreen = ({ navigation, route }) => {
  const { project } = route.params;
  const [selectedProject, setSelectedProject] = useState(project);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);

  // Mock projects data
  const projects = [
    { id: '1', name: 'Bridge Monitoring Project', deviceCount: 12 },
    { id: '2', name: 'Dam Safety Monitoring', deviceCount: 8 },
    { id: '3', name: 'Tunnel Deformation Study', deviceCount: 15 },
    { id: '4', name: 'Building Foundation', deviceCount: 6 },
  ];

  // Mock devices data
  const mockDevices = [
    {
      id: '1',
      deviceId: 'ESDL-30-001',
      type: 'ESDL-30 Datalogger',
      status: 'online',
      lastSync: '2024-01-15 14:30',
      location: 'Sensor Point A',
      batteryLevel: 85,
    },
    {
      id: '2',
      deviceId: 'EWG-01-002',
      type: 'EWG-01 Gateway',
      status: 'online',
      lastSync: '2024-01-15 14:25',
      location: 'Control Room',
      batteryLevel: 100,
    },
    {
      id: '3',
      deviceId: 'EWN-01V-003',
      type: 'EWN-01V Node',
      status: 'offline',
      lastSync: '2024-01-14 09:15',
      location: 'Sensor Point B',
      batteryLevel: 45,
    },
    {
      id: '4',
      deviceId: 'ESCL-10VT-004',
      type: 'ESCL-10VT Datalogger',
      status: 'online',
      lastSync: '2024-01-15 14:28',
      location: 'Sensor Point C',
      batteryLevel: 92,
    },
  ];

  useEffect(() => {
    loadDevices();
  }, [selectedProject]);

  const loadDevices = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setDevices(mockDevices);
      setLoading(false);
    }, 1000);
  };

  const handleProjectSelection = (project) => {
    setSelectedProject(project);
  };

  const handleDeviceSelection = (device) => {
    Alert.alert(
      'Device Selected',
      `Selected: ${device.deviceId}\nType: ${device.type}\nLocation: ${device.location}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'View Details', onPress: () => viewDeviceDetails(device) },
        { text: 'Configure', onPress: () => configureDevice(device) }
      ]
    );
  };

  const viewDeviceDetails = (device) => {
    navigation.navigate('DeviceDetails', { device, project: selectedProject });
  };

  const configureDevice = (device) => {
    navigation.navigate('DeviceConfiguration', { device, project: selectedProject });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return '#10B981';
      case 'offline': return '#EF4444';
      case 'warning': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online': return 'checkmark-circle';
      case 'offline': return 'close-circle';
      case 'warning': return 'warning';
      default: return 'help-circle';
    }
  };

  const getBatteryColor = (level) => {
    if (level > 70) return '#10B981';
    if (level > 30) return '#F59E0B';
    return '#EF4444';
  };

  const renderDeviceItem = ({ item }) => (
    <TouchableOpacity
      style={styles.deviceItem}
      onPress={() => handleDeviceSelection(item)}
    >
      <View style={styles.deviceHeader}>
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceId}>{item.deviceId}</Text>
          <Text style={styles.deviceType}>{item.type}</Text>
        </View>
        <View style={styles.statusContainer}>
          <Ionicons 
            name={getStatusIcon(item.status)} 
            size={16} 
            color={getStatusColor(item.status)} 
          />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>
      
      <View style={styles.deviceDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="location" size={14} color="#6B7280" />
          <Text style={styles.detailText}>{item.location}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="time" size={14} color="#6B7280" />
          <Text style={styles.detailText}>Last sync: {item.lastSync}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="battery-half" size={14} color={getBatteryColor(item.batteryLevel)} />
          <Text style={[styles.detailText, { color: getBatteryColor(item.batteryLevel) }]}>
            Battery: {item.batteryLevel}%
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Choose Existing Devices"
        subtitle="Select from configured dataloggers, gateways, and nodes"
        onBack={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Project Selection */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Select Project</Text>
          <Text style={styles.cardSubtitle}>Choose a project to view its assigned devices</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.projectScroll}>
            {projects.map((proj) => (
              <TouchableOpacity
                key={proj.id}
                style={[
                  styles.projectCard,
                  selectedProject.id === proj.id && styles.projectCardSelected
                ]}
                onPress={() => handleProjectSelection(proj)}
              >
                <Text style={[
                  styles.projectName,
                  selectedProject.id === proj.id && styles.projectNameSelected
                ]}>
                  {proj.name}
                </Text>
                <Text style={[
                  styles.projectCount,
                  selectedProject.id === proj.id && styles.projectCountSelected
                ]}>
                  {proj.deviceCount} devices
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Card>

        {/* Selected Project Info */}
        <Card style={styles.card}>
          <View style={styles.projectInfo}>
            <View style={styles.projectIcon}>
              <Ionicons name="folder" size={24} color="#2241DD" />
            </View>
            <View style={styles.projectDetails}>
              <Text style={styles.selectedProjectName}>{selectedProject.name}</Text>
              <Text style={styles.selectedProjectCount}>
                {devices.length} configured devices
              </Text>
            </View>
          </View>
        </Card>

        {/* Devices List */}
        <Card style={styles.card}>
          <View style={styles.devicesHeader}>
            <Text style={styles.cardTitle}>Configured Devices</Text>
            <TouchableOpacity onPress={loadDevices}>
              <Ionicons name="refresh" size={20} color="#2241DD" />
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading devices...</Text>
            </View>
          ) : (
            <FlatList
              data={devices}
              renderItem={renderDeviceItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}
        </Card>

        {/* Instructions */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Instructions</Text>
          <View style={styles.instructionsList}>
            <Text style={styles.instructionItem}>
              • Select a project to view all assigned devices
            </Text>
            <Text style={styles.instructionItem}>
              • Each device shows its ID, type, and connection status
            </Text>
            <Text style={styles.instructionItem}>
              • Tap a device to view details or configure settings
            </Text>
            <Text style={styles.instructionItem}>
              • Status indicators show online/offline and battery levels
            </Text>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  card: {
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  cardSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
  projectScroll: {
    marginHorizontal: -Spacing.md,
  },
  projectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginHorizontal: Spacing.sm,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    minWidth: 200,
  },
  projectCardSelected: {
    backgroundColor: '#2241DD',
    borderColor: '#2241DD',
  },
  projectName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  projectNameSelected: {
    color: '#FFFFFF',
  },
  projectCount: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  projectCountSelected: {
    color: '#E5E7EB',
  },
  projectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  projectDetails: {
    flex: 1,
  },
  selectedProjectName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  selectedProjectCount: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  devicesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  loadingContainer: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
  },
  deviceItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceId: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  deviceType: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    marginLeft: Spacing.xs,
  },
  deviceDetails: {
    gap: Spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginLeft: Spacing.sm,
  },
  separator: {
    height: Spacing.sm,
  },
  instructionsList: {
    paddingLeft: Spacing.sm,
  },
  instructionItem: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
});

export default ChooseExistingScreen;
