import React from 'react';
import { View, Text } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';

// Create error screen component
const ErrorScreen = (screenName) => {
  const { View, Text } = require('react-native');
  return () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 20 }}>
      <Text style={{ fontSize: 18, color: '#000', marginBottom: 10 }}>Screen Error</Text>
      <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
        {screenName} is unavailable
      </Text>
      <Text style={{ fontSize: 12, color: '#999', marginTop: 10, textAlign: 'center' }}>
        Please check the console for details
      </Text>
    </View>
  );
};

// Lazy load EDI-55 screens with error handling
let EDI55ConfigurationHub = ErrorScreen('EDI55ConfigurationHub');
let SiteManagementScreen = ErrorScreen('SiteManagementScreen');
let SensorConfigurationScreen = ErrorScreen('SensorConfigurationScreen');
let SensorSelectionScreen = ErrorScreen('SensorSelectionScreen');
let SystemSetupScreen = ErrorScreen('SystemSetupScreen');
let EDI55TakeReadingScreen = ErrorScreen('EDI55TakeReadingScreen');

// Try to load screens with fallback
try {
  EDI55ConfigurationHub = require('../screens/EDI55/EDI55ConfigurationHub').default;
} catch (e) {
  console.error('EDI55ConfigurationHub load error:', e);
}

try {
  SiteManagementScreen = require('../screens/EDI55/SiteManagementScreen').default;
} catch (e) {
  console.error('SiteManagementScreen load error:', e);
}

try {
  SensorConfigurationScreen = require('../screens/EDI55/SensorConfigurationScreen').default;
} catch (e) {
  console.error('SensorConfigurationScreen load error:', e);
}

try {
  SensorSelectionScreen = require('../screens/EDI55/SensorSelectionScreen').default;
} catch (e) {
  console.error('SensorSelectionScreen load error:', e);
}

try {
  SystemSetupScreen = require('../screens/EDI55/SystemSetupScreen').default;
} catch (e) {
  console.error('SystemSetupScreen load error:', e);
}

try {
  EDI55TakeReadingScreen = require('../screens/EDI55/EDI55TakeReadingScreen').default;
} catch (e) {
  console.error('EDI55TakeReadingScreen load error:', e);
}

const Stack = createStackNavigator();

const EDI55Navigator = () => {
  try {
    return (
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
        initialRouteName="ConfigurationHub"
      >
        <Stack.Screen 
          name="ConfigurationHub" 
          component={EDI55ConfigurationHub}
          options={{ title: 'EDI-55 Configuration' }}
        />
        <Stack.Screen 
          name="SiteManagement" 
          component={SiteManagementScreen}
          options={{ title: 'Site Management' }}
        />
        <Stack.Screen 
          name="SensorConfiguration" 
          component={SensorConfigurationScreen}
          options={{ title: 'Sensor Configuration' }}
        />
        <Stack.Screen 
          name="SensorSelection" 
          component={SensorSelectionScreen}
          options={{ title: 'Sensor Selection' }}
        />
        <Stack.Screen 
          name="SystemSetup" 
          component={SystemSetupScreen}
          options={{ title: 'System Setup' }}
        />
        <Stack.Screen 
          name="TakeReading" 
          component={EDI55TakeReadingScreen}
          options={{ title: 'Take Reading' }}
        />
      </Stack.Navigator>
    );
  } catch (error) {
    console.error('Error rendering EDI55Navigator:', error);
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 20 }}>
        <Text style={{ fontSize: 18, color: '#000', marginBottom: 10 }}>EDI-55 Navigation Error</Text>
        <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
          {error.message || 'Failed to initialize EDI-55 navigation'}
        </Text>
        <Text style={{ fontSize: 12, color: '#999', marginTop: 10, textAlign: 'center' }}>
          Please restart the app or check the console for details
        </Text>
      </View>
    );
  }
};

export default EDI55Navigator;

