import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../components/Card';
import ScreenHeader from './components/ScreenHeader';
import { Spacing, Typography, Colors, BorderRadius, Shadows } from '../styles/DesignSystem';

const SiteInstallationScreen = ({ navigation, route }) => {
  const { project } = route.params;
  const [currentStep, setCurrentStep] = useState('overview');
  const [setupCompliance, setSetupCompliance] = useState({
    gatewayPreconfigured: true,
    gatewayLinkedToNodes: true,
    connectionMethod: 'Bluetooth', // Bluetooth, Ethernet, USB-C
    nodesPowered: false,
    connectivityVerified: false,
    sensorsChecked: false,
    calibraOneSetup: false,
    schedulingConfigured: false,
    backhaulConfigured: false,
  }); // overview, gateway, nodes, sensors, power, connectivity, test, setup
  const [installationData, setInstallationData] = useState({
    gatewayInstalled: false,
    nodesInstalled: [],
    sensorsInstalled: [],
    powerConnected: false,
    backhaul: 'LTE', // LTE | WiFi | Starlink
    connectivityTested: false,
    testModePassed: false,
    locationChecked: false,
    zeroReadingTaken: false,
  });

  // Node types as described
  const nodeTypes = [
    { 
      id: 'tiltmeter', 
      name: 'Tiltmeter Node', 
      icon: 'phone-portrait', 
      description: 'Built-in tilt sensor for angle measurement',
      isSensor: true,
      sensorType: 'Tilt'
    },
    { 
      id: 'accelerometer', 
      name: 'Accelerometer Node', 
      icon: 'phone-portrait', 
      description: 'Built-in accelerometer for vibration measurement',
      isSensor: true,
      sensorType: 'Acceleration'
    },
    { 
      id: 'laser', 
      name: 'Laser Node', 
      icon: 'phone-portrait', 
      description: 'Built-in laser sensor for distance measurement',
      isSensor: true,
      sensorType: 'Distance'
    },
    { 
      id: 'vibrating_wire', 
      name: 'Vibrating Wire Node', 
      icon: 'radio', 
      description: 'Connects to piezometer sensors',
      isSensor: false,
      sensorType: 'Piezometer'
    },
    { 
      id: 'digital', 
      name: 'Digital Node', 
      icon: 'radio', 
      description: 'Connects to in-place inclinometer',
      isSensor: false,
      sensorType: 'Inclinometer'
    },
    { 
      id: 'thermistor', 
      name: 'Thermistor Node', 
      icon: 'radio', 
      description: 'Connects to temperature sensors',
      isSensor: false,
      sensorType: 'Temperature'
    },
  ];

  const installationSteps = [
    { id: 'overview', title: 'Project Overview', icon: 'information-circle' },
    { id: 'gateway', title: 'Gateway Installation', icon: 'hardware-chip' },
    { id: 'nodes', title: 'Node Installation', icon: 'radio' },
    { id: 'sensors', title: 'Sensor Installation', icon: 'cellular' },
    { id: 'power', title: 'Power Setup', icon: 'battery-charging' },
    { id: 'connectivity', title: 'Connectivity Test', icon: 'bluetooth' },
    { id: 'test', title: 'Test Mode', icon: 'checkmark-circle' },
    { id: 'setup', title: 'Site Setup', icon: 'location' },
  ];

  const handleGatewayInstallation = () => {
    Alert.alert(
      'Gateway Installation',
      'Install the gateway unless it has been added through cloud. Ensure proper mounting and positioning.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Mark Installed', onPress: () => {
          setInstallationData(prev => ({ ...prev, gatewayInstalled: true }));
          // Gateway is always preconfigured and linked to nodes
          setSetupCompliance(prev => ({
            ...prev,
            gatewayPreconfigured: true,
            gatewayLinkedToNodes: true
          }));
          setCurrentStep('nodes');
        }}
      ]
    );
  };

  const handleNodeInstallation = (nodeType) => {
    Alert.alert(
      `Install ${nodeType.name}`,
      `Install the ${nodeType.name} at the designated location. ${nodeType.description}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Mark Installed', onPress: () => {
          setInstallationData(prev => ({
            ...prev,
            nodesInstalled: [...prev.nodesInstalled, nodeType.id]
          }));
        }}
      ]
    );
  };

  const handleSensorInstallation = (nodeId) => {
    const nodeType = nodeTypes.find(n => n.id === nodeId);
    if (!nodeType.isSensor) {
      Alert.alert(
        `Install Sensor for ${nodeType.name}`,
        `Connect the ${nodeType.sensorType} sensor to the ${nodeType.name}. Ensure proper wiring and calibration.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Mark Installed', onPress: () => {
            setInstallationData(prev => ({
              ...prev,
              sensorsInstalled: [...prev.sensorsInstalled, nodeId]
            }));
          }}
        ]
      );
    }
  };

  const handlePowerSetup = () => {
    Alert.alert(
      'Power Setup',
      '1. Insert battery in gateway\n2. Plug in power supply\n3. Verify power indicators are on',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Mark Complete', onPress: () => {
          setInstallationData(prev => ({ ...prev, powerConnected: true }));
          // Mark nodes as powered
          setSetupCompliance(prev => ({
            ...prev,
            nodesPowered: true
          }));
          setCurrentStep('connectivity');
        }}
      ]
    );
  };

  const handleConnectivityTest = () => {
    Alert.alert(
      'Connectivity Test',
      'Test mobile app connectivity to nodes. Check if all sensors send data to nodes.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start Test', onPress: () => {
          // Simulate connectivity test
          setTimeout(() => {
            setInstallationData(prev => ({ ...prev, connectivityTested: true }));
            // Mark connectivity as verified
            setSetupCompliance(prev => ({
              ...prev,
              connectivityVerified: true
            }));
            setCurrentStep('test');
            Alert.alert('Connectivity Test', 'All nodes are responding correctly!');
          }, 2000);
        }}
      ]
    );
  };

  const handleTestMode = () => {
    Alert.alert(
      'Test Mode',
      'Verify data is coming from all sensors. Check signal strength and data quality.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Run Test', onPress: () => {
          // Simulate test mode
          setTimeout(() => {
            setInstallationData(prev => ({ ...prev, testModePassed: true }));
            // Mark sensors as checked
            setSetupCompliance(prev => ({
              ...prev,
              sensorsChecked: true
            }));
            setCurrentStep('setup');
            Alert.alert('Test Mode', 'All sensors are sending data correctly!');
          }, 3000);
        }}
      ]
    );
  };

  const handleLocationCheck = () => {
    Alert.alert(
      'Location Check',
      'Verify GPS coordinates and site location accuracy.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Mark Checked', onPress: () => {
          setInstallationData(prev => ({ ...prev, locationChecked: true }));
        }}
      ]
    );
  };

  const handleZeroReading = () => {
    Alert.alert(
      'Zero Reading',
      'Take initial zero reading from all sensors for baseline calibration.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Reading', onPress: () => {
          setInstallationData(prev => ({ ...prev, zeroReadingTaken: true }));
        }}
      ]
    );
  };

  const completeSetup = () => {
    // Mark all remaining compliance items as complete
    setSetupCompliance(prev => ({
      ...prev,
      calibraOneSetup: true,
      schedulingConfigured: true,
      backhaulConfigured: true
    }));
    
    Alert.alert(
      'Setup Complete',
      'Site installation and setup is now complete! All systems are operational.',
      [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]
    );
  };

  const renderOverview = () => (
    <Card style={styles.card}>
      <Text style={styles.cardTitle}>Project Overview</Text>
      <Text style={styles.cardSubtitle}>Preconfigured project details</Text>
      
      <View style={styles.projectInfo}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Client ID:</Text>
          <Text style={styles.infoValue}>{project.clientId}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Client Project:</Text>
          <Text style={styles.infoValue}>{project.clientProject}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Gateways:</Text>
          <Text style={styles.infoValue}>{project.gatewayCount}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Nodes:</Text>
          <Text style={styles.infoValue}>{project.nodeCount}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Sensors:</Text>
          <Text style={styles.infoValue}>{project.sensorCount}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Installation Status:</Text>
          <Text style={[styles.infoValue, { color: project.installationStatus === 'Completed' ? '#10B981' : '#F59E0B' }]}>
            {project.installationStatus}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Connection Method:</Text>
          <Text style={styles.infoValue}>{setupCompliance.connectionMethod}</Text>
        </View>
      </View>
      
      {/* Setup Process Compliance Status */}
      <View style={styles.complianceStatus}>
        <Text style={styles.complianceTitle}>Setup Process Compliance</Text>
        <View style={styles.complianceGrid}>
          <View style={styles.complianceItem}>
            <Ionicons 
              name={setupCompliance.gatewayPreconfigured ? "checkmark-circle" : "close-circle"} 
              size={16} 
              color={setupCompliance.gatewayPreconfigured ? "#10B981" : "#EF4444"} 
            />
            <Text style={styles.complianceText}>Gateway Preconfigured</Text>
          </View>
          <View style={styles.complianceItem}>
            <Ionicons 
              name={setupCompliance.nodesPowered ? "checkmark-circle" : "close-circle"} 
              size={16} 
              color={setupCompliance.nodesPowered ? "#10B981" : "#EF4444"} 
            />
            <Text style={styles.complianceText}>Nodes Powered</Text>
          </View>
          <View style={styles.complianceItem}>
            <Ionicons 
              name={setupCompliance.connectivityVerified ? "checkmark-circle" : "close-circle"} 
              size={16} 
              color={setupCompliance.connectivityVerified ? "#10B981" : "#EF4444"} 
            />
            <Text style={styles.complianceText}>Connectivity Verified</Text>
          </View>
          <View style={styles.complianceItem}>
            <Ionicons 
              name={setupCompliance.sensorsChecked ? "checkmark-circle" : "close-circle"} 
              size={16} 
              color={setupCompliance.sensorsChecked ? "#10B981" : "#EF4444"} 
            />
            <Text style={styles.complianceText}>Sensors Checked</Text>
          </View>
          <View style={styles.complianceItem}>
            <Ionicons 
              name={setupCompliance.calibraOneSetup ? "checkmark-circle" : "close-circle"} 
              size={16} 
              color={setupCompliance.calibraOneSetup ? "#10B981" : "#EF4444"} 
            />
            <Text style={styles.complianceText}>CalibraOne Setup</Text>
          </View>
          <View style={styles.complianceItem}>
            <Ionicons 
              name={setupCompliance.schedulingConfigured ? "checkmark-circle" : "close-circle"} 
              size={16} 
              color={setupCompliance.schedulingConfigured ? "#10B981" : "#EF4444"} 
            />
            <Text style={styles.complianceText}>Scheduling Configured</Text>
          </View>
          <View style={styles.complianceItem}>
            <Ionicons 
              name={setupCompliance.backhaulConfigured ? "checkmark-circle" : "close-circle"} 
              size={16} 
              color={setupCompliance.backhaulConfigured ? "#10B981" : "#EF4444"} 
            />
            <Text style={styles.complianceText}>Backhaul Configured</Text>
          </View>
        </View>
      </View>
      
      <TouchableOpacity style={styles.nextButton} onPress={() => setCurrentStep('gateway')}>
        <Text style={styles.nextButtonText}>Start Installation</Text>
        <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
      </TouchableOpacity>
    </Card>
  );

  const renderGatewayInstallation = () => (
    <Card style={styles.card}>
      <Text style={styles.cardTitle}>Gateway Installation</Text>
      <Text style={styles.cardSubtitle}>Install gateway unless already added through cloud</Text>
      
      <View style={styles.installationStep}>
        <View style={styles.stepIcon}>
          <Ionicons name="hardware-chip" size={24} color="#2241DD" />
        </View>
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Gateway Setup</Text>
          <Text style={styles.stepDescription}>
            • Mount gateway at designated location{'\n'}
            • Ensure proper positioning for signal coverage{'\n'}
            • Check mounting stability and weather protection
          </Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={[styles.installButton, installationData.gatewayInstalled && styles.buttonCompleted]}
        onPress={handleGatewayInstallation}
      >
        <Ionicons 
          name={installationData.gatewayInstalled ? "checkmark-circle" : "add-circle"} 
          size={20} 
          color="#FFFFFF" 
        />
        <Text style={styles.installButtonText}>
          {installationData.gatewayInstalled ? 'Gateway Installed' : 'Mark Gateway Installed'}
        </Text>
      </TouchableOpacity>
    </Card>
  );

  const renderNodeInstallation = () => (
    <Card style={styles.card}>
      <Text style={styles.cardTitle}>Node Installation</Text>
      <Text style={styles.cardSubtitle}>Install nodes at designated locations</Text>
      
      {nodeTypes.map((nodeType) => (
        <TouchableOpacity
          key={nodeType.id}
          style={[
            styles.nodeItem,
            installationData.nodesInstalled.includes(nodeType.id) && styles.nodeItemCompleted
          ]}
          onPress={() => handleNodeInstallation(nodeType)}
        >
          <View style={styles.nodeHeader}>
            <View style={styles.nodeIcon}>
              <Ionicons name={nodeType.icon} size={20} color="#2241DD" />
            </View>
            <View style={styles.nodeInfo}>
              <Text style={styles.nodeName}>{nodeType.name}</Text>
              <Text style={styles.nodeDescription}>{nodeType.description}</Text>
            </View>
            <View style={styles.nodeStatus}>
              {installationData.nodesInstalled.includes(nodeType.id) ? (
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              ) : (
                <Ionicons name="add-circle" size={20} color="#6B7280" />
              )}
            </View>
          </View>
        </TouchableOpacity>
      ))}
      
      <TouchableOpacity 
        style={styles.nextButton} 
        onPress={() => setCurrentStep('sensors')}
        disabled={installationData.nodesInstalled.length === 0}
      >
        <Text style={styles.nextButtonText}>Continue to Sensors</Text>
        <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
      </TouchableOpacity>
    </Card>
  );

  const renderSensorInstallation = () => (
    <Card style={styles.card}>
      <Text style={styles.cardTitle}>Sensor Installation</Text>
      <Text style={styles.cardSubtitle}>Connect sensors to nodes</Text>
      
      {installationData.nodesInstalled.map((nodeId) => {
        const nodeType = nodeTypes.find(n => n.id === nodeId);
        return (
          <TouchableOpacity
            key={nodeId}
            style={[
              styles.sensorItem,
              installationData.sensorsInstalled.includes(nodeId) && styles.sensorItemCompleted
            ]}
            onPress={() => handleSensorInstallation(nodeId)}
          >
            <View style={styles.sensorHeader}>
              <View style={styles.sensorIcon}>
                <Ionicons name="cellular" size={20} color="#2241DD" />
              </View>
              <View style={styles.sensorInfo}>
                <Text style={styles.sensorName}>{nodeType.name}</Text>
                <Text style={styles.sensorDescription}>
                  {nodeType.isSensor ? 'Built-in sensor' : `Connect ${nodeType.sensorType} sensor`}
                </Text>
              </View>
              <View style={styles.sensorStatus}>
                {installationData.sensorsInstalled.includes(nodeId) ? (
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                ) : (
                  <Ionicons name="add-circle" size={20} color="#6B7280" />
                )}
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
      
      <TouchableOpacity 
        style={styles.nextButton} 
        onPress={() => setCurrentStep('power')}
        disabled={installationData.sensorsInstalled.length === 0}
      >
        <Text style={styles.nextButtonText}>Continue to Power Setup</Text>
        <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
      </TouchableOpacity>
    </Card>
  );

  const renderPowerSetup = () => (
    <Card style={styles.card}>
      <Text style={styles.cardTitle}>Power Setup</Text>
      <Text style={styles.cardSubtitle}>Connect power to gateway and verify operation</Text>
      
      <View style={styles.powerSteps}>
        <View style={styles.powerStep}>
          <View style={styles.stepNumber}>1</View>
          <Text style={styles.stepText}>Insert battery in gateway</Text>
        </View>
        <View style={styles.powerStep}>
          <View style={styles.stepNumber}>2</View>
          <Text style={styles.stepText}>Plug in power supply</Text>
        </View>
        <View style={styles.powerStep}>
          <View style={styles.stepNumber}>3</View>
          <Text style={styles.stepText}>Verify power indicators are on</Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={[styles.installButton, installationData.powerConnected && styles.buttonCompleted]}
        onPress={handlePowerSetup}
      >
        <Ionicons 
          name={installationData.powerConnected ? "checkmark-circle" : "battery-charging"} 
          size={20} 
          color="#FFFFFF" 
        />
        <Text style={styles.installButtonText}>
          {installationData.powerConnected ? 'Power Connected' : 'Mark Power Connected'}
        </Text>
      </TouchableOpacity>
    </Card>
  );

  const renderConnectivityTest = () => (
    <Card style={styles.card}>
      <Text style={styles.cardTitle}>Connectivity Test</Text>
      <Text style={styles.cardSubtitle}>Test mobile app connectivity to nodes</Text>
      
      {/* Backhaul Selection */}
      <View style={styles.backhaulSection}>
        <Text style={styles.backhaulLabel}>Select Backhaul</Text>
        <View style={styles.backhaulRow}>
          {['LTE', 'WiFi', 'Starlink'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.backhaulChip,
                installationData.backhaul === type && styles.backhaulChipActive,
              ]}
              onPress={() => setInstallationData((prev) => ({ ...prev, backhaul: type }))}
            >
              <Ionicons
                name={installationData.backhaul === type ? 'radio-button-on' : 'radio-button-off'}
                size={14}
                color={installationData.backhaul === type ? '#FFFFFF' : '#2241DD'}
              />
              <Text
                style={[
                  styles.backhaulChipText,
                  installationData.backhaul === type && styles.backhaulChipTextActive,
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.backhaulHint}>Current: {installationData.backhaul}</Text>
      </View>

      <View style={styles.testInfo}>
        <Text style={styles.testDescription}>
          • Check if all sensors send data to nodes{'\n'}
          • Verify communication between mobile app and nodes{'\n'}
          • Test signal strength and data transmission
        </Text>
      </View>
      
      <TouchableOpacity 
        style={[styles.testButton, installationData.connectivityTested && styles.buttonCompleted]}
        onPress={handleConnectivityTest}
      >
        <Ionicons 
          name={installationData.connectivityTested ? "checkmark-circle" : "bluetooth"} 
          size={20} 
          color="#FFFFFF" 
        />
        <Text style={styles.testButtonText}>
          {installationData.connectivityTested ? 'Connectivity Verified' : `Test ${installationData.backhaul} Connectivity`}
        </Text>
      </TouchableOpacity>
    </Card>
  );

  const renderTestMode = () => (
    <Card style={styles.card}>
      <Text style={styles.cardTitle}>Test Mode</Text>
      <Text style={styles.cardSubtitle}>Verify data flow and signal strength</Text>
      
      <View style={styles.testInfo}>
        <Text style={styles.testDescription}>
          • Verify data is coming from all sensors{'\n'}
          • Check signal strength and quality{'\n'}
          • Monitor data transmission rates{'\n'}
          • Validate sensor readings
        </Text>
      </View>
      
      <TouchableOpacity 
        style={[styles.testButton, installationData.testModePassed && styles.buttonCompleted]}
        onPress={handleTestMode}
      >
        <Ionicons 
          name={installationData.testModePassed ? "checkmark-circle" : "checkmark-circle-outline"} 
          size={20} 
          color="#FFFFFF" 
        />
        <Text style={styles.testButtonText}>
          {installationData.testModePassed ? 'Test Mode Passed' : 'Run Test Mode'}
        </Text>
      </TouchableOpacity>
    </Card>
  );

  const renderSiteSetup = () => (
    <Card style={styles.card}>
      <Text style={styles.cardTitle}>Site Setup</Text>
      <Text style={styles.cardSubtitle}>Final site configuration and calibration</Text>
      
      <View style={styles.setupSteps}>
        <TouchableOpacity 
          style={[styles.setupStep, installationData.locationChecked && styles.stepCompleted]}
          onPress={handleLocationCheck}
        >
          <View style={styles.stepIcon}>
            <Ionicons name="location" size={20} color="#2241DD" />
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Check Location</Text>
            <Text style={styles.stepDescription}>Verify GPS coordinates and site location</Text>
          </View>
          {installationData.locationChecked && (
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.setupStep, installationData.zeroReadingTaken && styles.stepCompleted]}
          onPress={handleZeroReading}
        >
          <View style={styles.stepIcon}>
            <Ionicons name="radio" size={20} color="#2241DD" />
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Take Zero Reading</Text>
            <Text style={styles.stepDescription}>Take initial zero reading for baseline calibration</Text>
          </View>
          {installationData.zeroReadingTaken && (
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          )}
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        style={[styles.completeButton, 
          (!installationData.locationChecked || !installationData.zeroReadingTaken) && styles.buttonDisabled
        ]}
        onPress={completeSetup}
        disabled={!installationData.locationChecked || !installationData.zeroReadingTaken}
      >
        <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
        <Text style={styles.completeButtonText}>Complete Setup</Text>
      </TouchableOpacity>
    </Card>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Site Installation"
        subtitle={`Project: ${project.title}`}
        onBack={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Progress Indicator */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Installation Progress</Text>
          <View style={styles.progressContainer}>
            {installationSteps.map((step, index) => (
              <View key={step.id} style={styles.progressStep}>
                <View style={[
                  styles.progressDot,
                  currentStep === step.id && styles.progressDotActive,
                  (installationData.gatewayInstalled && step.id === 'gateway') && styles.progressDotCompleted,
                  (installationData.nodesInstalled.length > 0 && step.id === 'nodes') && styles.progressDotCompleted,
                  (installationData.sensorsInstalled.length > 0 && step.id === 'sensors') && styles.progressDotCompleted,
                  (installationData.powerConnected && step.id === 'power') && styles.progressDotCompleted,
                  (installationData.connectivityTested && step.id === 'connectivity') && styles.progressDotCompleted,
                  (installationData.testModePassed && step.id === 'test') && styles.progressDotCompleted,
                  (installationData.locationChecked && installationData.zeroReadingTaken && step.id === 'setup') && styles.progressDotCompleted,
                ]}>
                  <Ionicons name={step.icon} size={12} color="#FFFFFF" />
                </View>
                <Text style={[
                  styles.progressText,
                  currentStep === step.id && styles.progressTextActive
                ]}>
                  {step.title}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Current Step Content */}
        {currentStep === 'overview' && renderOverview()}
        {currentStep === 'gateway' && renderGatewayInstallation()}
        {currentStep === 'nodes' && renderNodeInstallation()}
        {currentStep === 'sensors' && renderSensorInstallation()}
        {currentStep === 'power' && renderPowerSetup()}
        {currentStep === 'connectivity' && renderConnectivityTest()}
        {currentStep === 'test' && renderTestMode()}
        {currentStep === 'setup' && renderSiteSetup()}
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
  projectInfo: {
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  infoLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.secondary,
  },
  infoValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2241DD',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  nextButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: '#FFFFFF',
    marginRight: Spacing.sm,
  },
  progressContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  progressStep: {
    alignItems: 'center',
    width: '12%',
    marginBottom: Spacing.sm,
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  progressDotActive: {
    backgroundColor: '#2241DD',
  },
  progressDotCompleted: {
    backgroundColor: '#10B981',
  },
  progressText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  progressTextActive: {
    color: '#2241DD',
    fontWeight: Typography.fontWeight.semibold,
  },
  installationStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  stepIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  stepDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  installButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2241DD',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  buttonCompleted: {
    backgroundColor: '#10B981',
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  installButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: '#FFFFFF',
    marginLeft: Spacing.sm,
  },
  nodeItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  nodeItemCompleted: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
  },
  nodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nodeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  nodeInfo: {
    flex: 1,
  },
  nodeName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  nodeDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  nodeStatus: {
    alignItems: 'center',
  },
  sensorItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sensorItemCompleted: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
  },
  sensorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sensorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  sensorInfo: {
    flex: 1,
  },
  sensorName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  sensorDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  sensorStatus: {
    alignItems: 'center',
  },
  powerSteps: {
    marginBottom: Spacing.md,
  },
  powerStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2241DD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  stepText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    fontWeight: Typography.fontSize.medium,
  },
  testInfo: {
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  testDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2241DD',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  testButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: '#FFFFFF',
    marginLeft: Spacing.sm,
  },
  // Backhaul styles
  backhaulSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  backhaulLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  backhaulRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  backhaulChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderWidth: 2,
    borderColor: '#2241DD',
  },
  backhaulChipActive: {
    backgroundColor: '#2241DD',
  },
  backhaulChipText: {
    fontSize: Typography.fontSize.sm,
    color: '#2241DD',
    marginLeft: Spacing.xs,
  },
  backhaulChipTextActive: {
    color: '#FFFFFF',
  },
  backhaulHint: {
    marginTop: Spacing.xs,
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
  },
  setupSteps: {
    marginBottom: Spacing.md,
  },
  setupStep: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  stepCompleted: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  completeButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: '#FFFFFF',
    marginLeft: Spacing.sm,
  },
  complianceStatus: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  complianceTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  complianceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  complianceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    minWidth: '45%',
  },
  complianceText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    marginLeft: Spacing.xs,
    flex: 1,
  },
});

export default SiteInstallationScreen;
