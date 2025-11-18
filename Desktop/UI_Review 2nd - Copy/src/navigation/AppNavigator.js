import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from '../components/LoadingScreen';

// Lazy load navigators with error handling
let TabNavigator = null;
let EDI55Navigator = null;
try {
  TabNavigator = require('./TabNavigator').default;
} catch (error) {
  console.error('Failed to load TabNavigator:', error);
  TabNavigator = () => {
    const { View, Text } = require('react-native');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Tab Navigator Error</Text>
      </View>
    );
  };
}

try {
  EDI55Navigator = require('./EDI55Navigator').default;
} catch (error) {
  console.error('Failed to load EDI55Navigator:', error);
  EDI55Navigator = () => {
    const { View, Text } = require('react-native');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>EDI55 Navigator Error</Text>
      </View>
    );
  };
}

// Create error screen component
const ErrorScreen = (screenName) => {
  const { View, Text } = require('react-native');
  return () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 16, color: '#666' }}>{screenName} unavailable</Text>
    </View>
  );
};

// Lazy load screens with error handling (static requires)
let LoginScreen = ErrorScreen('LoginScreen');
let DeviceManagementScreen = ErrorScreen('DeviceManagementScreen');
let DataCollectionScreen = ErrorScreen('DataCollectionScreen');
let DataVisualizationScreen = ErrorScreen('DataVisualizationScreen');
let CalibrationScreen = ErrorScreen('CalibrationScreen');
let ReportingScreen = ErrorScreen('ReportingScreen');
let HelpSupportScreen = ErrorScreen('HelpSupportScreen');
let OfflineModeScreen = ErrorScreen('OfflineModeScreen');
let ProjectDetailScreen = ErrorScreen('ProjectDetailScreen');
let SiteConfigScreen = ErrorScreen('SiteConfigScreen');
let UserManagementScreen = ErrorScreen('UserManagementScreen');
let ProjectSettingsScreen = ErrorScreen('ProjectSettingsScreen');
let ProjectSyncScreen = ErrorScreen('ProjectSyncScreen');
let SensorLibraryScreen = ErrorScreen('SensorLibraryScreen');
let AddSensorScreen = ErrorScreen('AddSensorScreen');
let SensorStatusScreen = ErrorScreen('SensorStatusScreen');
let SensorConfigurationScreen = ErrorScreen('SensorConfigurationScreen');
let TestSensorScreen = ErrorScreen('TestSensorScreen');
let TakeReadingScreen = ErrorScreen('TakeReadingScreen');
let DeviceConfigurationScreen = ErrorScreen('DeviceConfigurationScreen');
let SendDataScreen = ErrorScreen('SendDataScreen');

// Try to load screens with fallback
try {
  LoginScreen = require('../screens/LoginScreen').default;
} catch (e) { console.error('LoginScreen load error:', e); }

try {
  DeviceManagementScreen = require('../screens/DeviceManagementScreen').default;
} catch (e) { console.error('DeviceManagementScreen load error:', e); }

try {
  DataCollectionScreen = require('../screens/DataCollectionScreen').default;
} catch (e) { console.error('DataCollectionScreen load error:', e); }

try {
  DataVisualizationScreen = require('../screens/DataVisualizationScreen').default;
} catch (e) { console.error('DataVisualizationScreen load error:', e); }

try {
  CalibrationScreen = require('../screens/CalibrationScreen').default;
} catch (e) { console.error('CalibrationScreen load error:', e); }

try {
  ReportingScreen = require('../screens/ReportingScreen').default;
} catch (e) { console.error('ReportingScreen load error:', e); }

try {
  HelpSupportScreen = require('../screens/HelpSupportScreen').default;
} catch (e) { console.error('HelpSupportScreen load error:', e); }

try {
  OfflineModeScreen = require('../screens/OfflineModeScreen').default;
} catch (e) { console.error('OfflineModeScreen load error:', e); }

try {
  ProjectDetailScreen = require('../screens/ProjectDetailScreen').default;
} catch (e) { console.error('ProjectDetailScreen load error:', e); }

try {
  SiteConfigScreen = require('../screens/SiteConfigScreen').default;
} catch (e) { console.error('SiteConfigScreen load error:', e); }

try {
  UserManagementScreen = require('../screens/UserManagementScreen').default;
} catch (e) { console.error('UserManagementScreen load error:', e); }

try {
  ProjectSettingsScreen = require('../screens/ProjectSettingsScreen').default;
} catch (e) { console.error('ProjectSettingsScreen load error:', e); }

try {
  ProjectSyncScreen = require('../screens/ProjectSyncScreen').default;
} catch (e) { console.error('ProjectSyncScreen load error:', e); }

try {
  SensorLibraryScreen = require('../screens/SensorLibraryScreen').default;
} catch (e) { console.error('SensorLibraryScreen load error:', e); }

try {
  AddSensorScreen = require('../screens/AddSensorScreen').default;
} catch (e) { console.error('AddSensorScreen load error:', e); }

try {
  SensorStatusScreen = require('../screens/SensorStatusScreen').default;
} catch (e) { console.error('SensorStatusScreen load error:', e); }

try {
  SensorConfigurationScreen = require('../screens/SensorConfigurationScreen').default;
} catch (e) { console.error('SensorConfigurationScreen load error:', e); }

try {
  TestSensorScreen = require('../screens/TestSensorScreen').default;
} catch (e) { console.error('TestSensorScreen load error:', e); }

try {
  TakeReadingScreen = require('../screens/TakeReadingScreen').default;
} catch (e) { console.error('TakeReadingScreen load error:', e); }

let EDI55ReadingsScreen = ErrorScreen('EDI55ReadingsScreen');
try {
  EDI55ReadingsScreen = require('../screens/EDI55/EDI55ReadingsScreen').default;
} catch (e) { console.error('EDI55ReadingsScreen load error:', e); }

try {
  DeviceConfigurationScreen = require('../screens/DeviceConfigurationScreen').default;
} catch (e) { console.error('DeviceConfigurationScreen load error:', e); }

try {
  SendDataScreen = require('../screens/SendDataScreen').default;
} catch (e) { console.error('SendDataScreen load error:', e); }

const Stack = createStackNavigator();

// Main Stack Navigator with authentication flow
const AppNavigator = () => {
  const [fallbackUsed, setFallbackUsed] = React.useState(false);
  let isAuthenticated = false;
  let isLoading = true;

  try {
    const authContext = useAuth();
    isAuthenticated = authContext.isAuthenticated;
    isLoading = authContext.isLoading;
  } catch (error) {
    console.error('Error accessing auth context:', error);
    // Continue with default values
    isLoading = false; // Force loading to false if context fails
  }

  // Safety timeout: If still loading after 5 seconds, force render
  React.useEffect(() => {
  if (isLoading) {
      const timeout = setTimeout(() => {
        console.log('Navigation timeout - forcing render');
        setFallbackUsed(true);
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [isLoading]);

  if (isLoading && !fallbackUsed) {
    try {
    return <LoadingScreen message="Initializing..." />;
    } catch (error) {
      console.error('Error rendering LoadingScreen:', error);
      const { View, Text } = require('react-native');
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#2241DD' }}>
          <Text style={{ color: '#FFFFFF', fontSize: 18 }}>Loading...</Text>
        </View>
      );
    }
  }

  // Ensure we always have a default screen to render
  if (!isAuthenticated) {
    // Will show Login screen
  } else {
    // Will show MainTabs
  }

  // Render navigation with comprehensive error handling
  const renderNavigation = () => {
    try {
  return (
        <NavigationContainer
          onReady={() => {
            console.log('NavigationContainer is ready');
          }}
          onStateChange={(state) => {
            console.log('Navigation state changed');
          }}
          fallback={
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#2241DD' }}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', marginTop: 10 }}>Initializing navigation...</Text>
            </View>
          }
        >
          <Stack.Navigator 
            screenOptions={{ headerShown: false }}
            initialRouteName={!isAuthenticated ? "Login" : "MainTabs"}
          >
        {!isAuthenticated ? (
              // Auth Stack - Always show Login screen
              <Stack.Screen 
                name="Login" 
                component={LoginScreen}
                options={{ animationEnabled: true }}
              />
        ) : (
          // Main App Stack with Tab Navigator
          <>
            <Stack.Screen name="MainTabs" component={TabNavigator} />
            <Stack.Screen name="DeviceManagement" component={DeviceManagementScreen} />
            <Stack.Screen name="DataCollection" component={DataCollectionScreen} />
            <Stack.Screen name="DataVisualization" component={DataVisualizationScreen} />
            <Stack.Screen name="Calibration" component={CalibrationScreen} />
            <Stack.Screen name="Reporting" component={ReportingScreen} />
            <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
            <Stack.Screen name="OfflineMode" component={OfflineModeScreen} />
            
            {/* New Project Management Screens */}
            <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} />
            <Stack.Screen name="SiteConfig" component={SiteConfigScreen} />
            <Stack.Screen name="UserManagement" component={UserManagementScreen} />
            <Stack.Screen name="ProjectSettings" component={ProjectSettingsScreen} />
            <Stack.Screen name="ProjectSync" component={ProjectSyncScreen} />
            
            {/* Sensor Management Screens */}
            <Stack.Screen name="SensorLibrary" component={SensorLibraryScreen} />
            <Stack.Screen name="AddSensor" component={AddSensorScreen} />
            <Stack.Screen name="SensorStatus" component={SensorStatusScreen} />
            <Stack.Screen name="SensorConfiguration" component={SensorConfigurationScreen} />
            <Stack.Screen name="TestSensor" component={TestSensorScreen} />
            
            {/* New Encardio-rite Functionality Screens */}
            <Stack.Screen name="TakeReading" component={TakeReadingScreen} />
            <Stack.Screen name="EDI55Readings" component={EDI55ReadingsScreen} />
            <Stack.Screen name="DeviceConfiguration" component={DeviceConfigurationScreen} />
            <Stack.Screen name="SendData" component={SendDataScreen} />
              
              {/* EDI-55 Configuration Stack */}
              <Stack.Screen name="EDI55Config" component={EDI55Navigator} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
    } catch (error) {
      console.error('Error rendering NavigationContainer:', error);
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
          <Text style={{ fontSize: 18, marginBottom: 10, color: '#000' }}>Navigation Error</Text>
          <Text style={{ fontSize: 14, color: '#666', textAlign: 'center', paddingHorizontal: 20 }}>
            {error.message || 'Failed to initialize navigation'}
          </Text>
          <Text style={{ fontSize: 12, color: '#999', marginTop: 20 }}>
            Please restart the app
          </Text>
        </View>
      );
    }
  };

  return renderNavigation();
};

export default AppNavigator;
