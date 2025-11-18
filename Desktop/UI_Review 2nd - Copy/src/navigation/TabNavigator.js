import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../styles/DesignSystem';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import BLEDiagnosticScreen from '../screens/BLEDiagnosticScreen';
import ProjectManagementScreen from '../screens/ProjectManagementScreen';
import SensorManagementScreen from '../screens/SensorManagementScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'BLEDiagnostic') {
            iconName = focused ? 'bug' : 'bug-outline';
          } else if (route.name === 'Projects') {
            iconName = focused ? 'folder' : 'folder-outline';
          } else if (route.name === 'SensorManagement') {
            iconName = focused ? 'hardware-chip' : 'hardware-chip-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2241DD',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingBottom: 8,
          paddingTop: 8,
          height: 70,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          fontFamily: 'Inter-Medium',
          marginTop: 4,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen 
        name="BLEDiagnostic" 
        component={BLEDiagnosticScreen}
        options={{
          tabBarLabel: 'Debug',
        }}
      />
      <Tab.Screen 
        name="Projects" 
        component={ProjectManagementScreen}
        options={{
          tabBarLabel: 'Projects',
        }}
      />
      <Tab.Screen 
        name="SensorManagement" 
        component={SensorManagementScreen}
        options={{
          tabBarLabel: 'Sensors',
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;








