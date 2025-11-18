import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from './components/ScreenHeader';
import Card from '../components/Card';
import { Spacing, Typography, Colors, BorderRadius, Shadows } from '../styles/DesignSystem';

const ProjectOnboardingScreen = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState('client-creation');
  const [clientData, setClientData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    companyName: '',
    adminAccessGranted: false,
  });
  const [projectData, setProjectData] = useState({
    projectName: '',
    projectLocation: '',
    projectType: '',
    assignedLoggers: [],
    assignedSensors: [],
    assignedTeams: [],
  });
  const [workflowStatus, setWorkflowStatus] = useState({
    step1Complete: false,
    step2Complete: false,
    readyForFieldWork: false,
  });

  // Available devices for assignment
  const availableDevices = [
    { id: 'EDI-55-001', name: 'EDI-55 Indicator', type: 'Indicator', status: 'Available' },
    { id: 'ESDL-30-001', name: 'ESDL-30 Datalogger', type: 'Datalogger', status: 'Available' },
    { id: 'ESCL-10VT-001', name: 'ESCL-10VT Datalogger', type: 'Datalogger', status: 'Available' },
    { id: 'EWG-01-001', name: 'EWG-01 Gateway', type: 'Gateway', status: 'Available' },
    { id: 'EWN-01V-001', name: 'EWN-01V Node', type: 'Node', status: 'Available' },
    { id: 'EWN-02A-001', name: 'EWN-02A Node', type: 'Node', status: 'Available' },
  ];

  // Available sensors for assignment
  const availableSensors = [
    { id: 'TILT-001', name: 'Tiltmeter Sensor', type: 'Tiltmeter', status: 'Available' },
    { id: 'ACCEL-001', name: 'Accelerometer Sensor', type: 'Accelerometer', status: 'Available' },
    { id: 'LASER-001', name: 'Laser Sensor', type: 'Laser', status: 'Available' },
    { id: 'VW-001', name: 'Vibrating Wire Sensor', type: 'Vibrating Wire', status: 'Available' },
    { id: 'DIGITAL-001', name: 'Digital Sensor', type: 'Digital', status: 'Available' },
    { id: 'THERM-001', name: 'Thermistor Sensor', type: 'Thermistor', status: 'Available' },
  ];

  // Available teams for assignment
  const availableTeams = [
    { id: 'TEAM-001', name: 'Installation Team Alpha', role: 'Installation', status: 'Available' },
    { id: 'TEAM-002', name: 'Maintenance Team Beta', role: 'Maintenance', status: 'Available' },
    { id: 'TEAM-003', name: 'Data Analysis Team Gamma', role: 'Analysis', status: 'Available' },
    { id: 'TEAM-004', name: 'Field Support Team Delta', role: 'Support', status: 'Available' },
  ];

  const handleClientCreation = () => {
    if (!clientData.clientName || !clientData.clientEmail || !clientData.companyName) {
      Alert.alert('Validation Error', 'Please fill in all required client information.');
      return;
    }

    Alert.alert(
      'Client Creation',
      'Create client on backend and grant admin access to our system?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Create Client', onPress: () => {
          setClientData(prev => ({ ...prev, adminAccessGranted: true }));
          setWorkflowStatus(prev => ({ ...prev, step1Complete: true }));
          setCurrentStep('project-setup');
          Alert.alert('Success', 'Client created and admin access granted!');
        }}
      ]
    );
  };

  const handleDeviceAssignment = (device, type) => {
    if (type === 'logger') {
      setProjectData(prev => ({
        ...prev,
        assignedLoggers: [...prev.assignedLoggers, device]
      }));
    } else if (type === 'sensor') {
      setProjectData(prev => ({
        ...prev,
        assignedSensors: [...prev.assignedSensors, device]
      }));
    }
  };

  const handleTeamAssignment = (team) => {
    setProjectData(prev => ({
      ...prev,
      assignedTeams: [...prev.assignedTeams, team]
    }));
  };

  const handleProjectSetup = () => {
    if (!projectData.projectName || !projectData.projectLocation) {
      Alert.alert('Validation Error', 'Please fill in project name and location.');
      return;
    }

    if (projectData.assignedLoggers.length === 0) {
      Alert.alert('Validation Error', 'Please assign at least one logger/sensor.');
      return;
    }

    if (projectData.assignedTeams.length === 0) {
      Alert.alert('Validation Error', 'Please assign at least one team.');
      return;
    }

    Alert.alert(
      'Project Setup Complete',
      'Project setup completed in office. Ready for field work?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Complete Setup', onPress: () => {
          setWorkflowStatus(prev => ({ 
            ...prev, 
            step2Complete: true,
            readyForFieldWork: true 
          }));
          Alert.alert('Success', 'Project is ready for field work!');
        }}
      ]
    );
  };

  const renderClientCreation = () => (
    <Card style={styles.card}>
      <Text style={styles.cardTitle}>Step 1: Backend Client Creation</Text>
      <Text style={styles.cardSubtitle}>Create client on backend and grant admin access</Text>
      
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Client Information</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Client Name *</Text>
          <TextInput
            style={styles.textInput}
            value={clientData.clientName}
            onChangeText={(text) => setClientData(prev => ({ ...prev, clientName: text }))}
            placeholder="Enter client name"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Client Email *</Text>
          <TextInput
            style={styles.textInput}
            value={clientData.clientEmail}
            onChangeText={(text) => setClientData(prev => ({ ...prev, clientEmail: text }))}
            placeholder="Enter client email"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Company Name *</Text>
          <TextInput
            style={styles.textInput}
            value={clientData.companyName}
            onChangeText={(text) => setClientData(prev => ({ ...prev, companyName: text }))}
            placeholder="Enter company name"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Phone Number</Text>
          <TextInput
            style={styles.textInput}
            value={clientData.clientPhone}
            onChangeText={(text) => setClientData(prev => ({ ...prev, clientPhone: text }))}
            placeholder="Enter phone number"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.switchGroup}>
          <Text style={styles.inputLabel}>Admin Access Granted</Text>
          <Switch
            value={clientData.adminAccessGranted}
            onValueChange={(value) => setClientData(prev => ({ ...prev, adminAccessGranted: value }))}
            trackColor={{ false: '#E5E7EB', true: '#2241DD' }}
            thumbColor={clientData.adminAccessGranted ? '#FFFFFF' : '#FFFFFF'}
          />
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.actionButton, !clientData.adminAccessGranted && styles.disabledButton]} 
        onPress={handleClientCreation}
        disabled={!clientData.adminAccessGranted}
      >
        <Text style={styles.actionButtonText}>Create Client & Grant Admin Access</Text>
        <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
      </TouchableOpacity>
    </Card>
  );

  const renderProjectSetup = () => (
    <Card style={styles.card}>
      <Text style={styles.cardTitle}>Step 2: Project Setup (Office)</Text>
      <Text style={styles.cardSubtitle}>Create project, assign loggers/sensors and teams</Text>
      
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Project Information</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Project Name *</Text>
          <TextInput
            style={styles.textInput}
            value={projectData.projectName}
            onChangeText={(text) => setProjectData(prev => ({ ...prev, projectName: text }))}
            placeholder="Enter project name"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Project Location *</Text>
          <TextInput
            style={styles.textInput}
            value={projectData.projectLocation}
            onChangeText={(text) => setProjectData(prev => ({ ...prev, projectLocation: text }))}
            placeholder="Enter project location"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Project Type</Text>
          <TextInput
            style={styles.textInput}
            value={projectData.projectType}
            onChangeText={(text) => setProjectData(prev => ({ ...prev, projectType: text }))}
            placeholder="e.g., Bridge, Tunnel, Dam"
          />
        </View>
      </View>

      {/* Device Assignment */}
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Assign Loggers/Sensors</Text>
        <ScrollView style={styles.deviceList} nestedScrollEnabled>
          {availableDevices.map((device) => (
            <TouchableOpacity
              key={device.id}
              style={styles.deviceItem}
              onPress={() => handleDeviceAssignment(device, 'logger')}
            >
              <View style={styles.deviceInfo}>
                <Text style={styles.deviceName}>{device.name}</Text>
                <Text style={styles.deviceType}>{device.type}</Text>
              </View>
              <Ionicons name="add-circle" size={20} color="#2241DD" />
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        <Text style={styles.sectionTitle}>Assign Sensors</Text>
        <ScrollView style={styles.deviceList} nestedScrollEnabled>
          {availableSensors.map((sensor) => (
            <TouchableOpacity
              key={sensor.id}
              style={styles.deviceItem}
              onPress={() => handleDeviceAssignment(sensor, 'sensor')}
            >
              <View style={styles.deviceInfo}>
                <Text style={styles.deviceName}>{sensor.name}</Text>
                <Text style={styles.deviceType}>{sensor.type}</Text>
              </View>
              <Ionicons name="add-circle" size={20} color="#2241DD" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Team Assignment */}
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Assign Teams</Text>
        <ScrollView style={styles.deviceList} nestedScrollEnabled>
          {availableTeams.map((team) => (
            <TouchableOpacity
              key={team.id}
              style={styles.deviceItem}
              onPress={() => handleTeamAssignment(team)}
            >
              <View style={styles.deviceInfo}>
                <Text style={styles.deviceName}>{team.name}</Text>
                <Text style={styles.deviceType}>{team.role}</Text>
              </View>
              <Ionicons name="add-circle" size={20} color="#2241DD" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <TouchableOpacity 
        style={styles.actionButton} 
        onPress={handleProjectSetup}
      >
        <Text style={styles.actionButtonText}>Complete Project Setup</Text>
        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
      </TouchableOpacity>
    </Card>
  );

  const renderWorkflowStatus = () => (
    <Card style={styles.card}>
      <Text style={styles.cardTitle}>Workflow Status</Text>
      
      <View style={styles.statusGrid}>
        <View style={styles.statusItem}>
          <Ionicons 
            name={workflowStatus.step1Complete ? "checkmark-circle" : "close-circle"} 
            size={24} 
            color={workflowStatus.step1Complete ? "#10B981" : "#EF4444"} 
          />
          <Text style={styles.statusText}>Step 1: Client Created</Text>
        </View>
        
        <View style={styles.statusItem}>
          <Ionicons 
            name={workflowStatus.step2Complete ? "checkmark-circle" : "close-circle"} 
            size={24} 
            color={workflowStatus.step2Complete ? "#10B981" : "#EF4444"} 
          />
          <Text style={styles.statusText}>Step 2: Project Setup</Text>
        </View>
        
        <View style={styles.statusItem}>
          <Ionicons 
            name={workflowStatus.readyForFieldWork ? "checkmark-circle" : "close-circle"} 
            size={24} 
            color={workflowStatus.readyForFieldWork ? "#10B981" : "#EF4444"} 
          />
          <Text style={styles.statusText}>Ready for Field Work</Text>
        </View>
      </View>

      {workflowStatus.readyForFieldWork && (
        <TouchableOpacity 
          style={styles.successButton} 
          onPress={() => navigation.navigate('ProjectManagement')}
        >
          <Text style={styles.successButtonText}>Go to Project Management</Text>
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </Card>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader 
        title="Project Onboarding" 
        subtitle="When we Get a Project"
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView style={styles.content}>
        {renderWorkflowStatus()}
        
        {currentStep === 'client-creation' && renderClientCreation()}
        {currentStep === 'project-setup' && renderProjectSetup()}
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
  formSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.md,
    backgroundColor: '#FFFFFF',
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  deviceList: {
    maxHeight: 200,
    marginBottom: Spacing.md,
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.sm,
    backgroundColor: '#F9FAFB',
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
  },
  deviceType: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2241DD',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  actionButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: '#FFFFFF',
    marginRight: Spacing.sm,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    minWidth: '45%',
  },
  statusText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    marginLeft: Spacing.sm,
  },
  successButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#10B981',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
  successButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: '#FFFFFF',
    marginRight: Spacing.sm,
  },
});

export default ProjectOnboardingScreen;

