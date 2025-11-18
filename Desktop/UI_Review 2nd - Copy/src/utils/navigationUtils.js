// Navigation utility functions
export const navigateToScreen = (navigation, screenName, params = {}) => {
  navigation.navigate(screenName, params);
};

export const navigateToTab = (navigation, tabName, screenName = null, params = {}) => {
  if (screenName) {
    navigation.navigate('MainTabs', {
      screen: tabName,
      params: {
        screen: screenName,
        params: params
      }
    });
  } else {
    navigation.navigate('MainTabs', {
      screen: tabName,
      params: params
    });
  }
};

export const navigateToDrawer = (navigation, screenName, params = {}) => {
  navigation.navigate('Drawer', {
    screen: screenName,
    params: params
  });
};

export const resetNavigation = (navigation, screenName, params = {}) => {
  navigation.reset({
    index: 0,
    routes: [{ name: screenName, params: params }],
  });
};

export const goBack = (navigation) => {
  if (navigation.canGoBack()) {
    navigation.goBack();
  }
};

// Screen names constants
export const SCREEN_NAMES = {
  // Auth
  LOGIN: 'Login',
  
  // Main Tabs
  HOME: 'Home',
  COLLECT: 'Collect',
  VISUALIZE: 'Visualize',
  PROJECTS: 'Projects',
  SETTINGS: 'Settings',
  
  // Drawer Screens
  DEVICE_MANAGEMENT: 'DeviceManagement',
  SENSOR_MANAGEMENT: 'SensorManagement',
  CLOUD_SYNC: 'CloudSync',
  CALIBRATION: 'Calibration',
  REPORTING: 'Reporting',
  HELP_SUPPORT: 'HelpSupport',
  OFFLINE_MODE: 'OfflineMode',
  
  // Navigators
  MAIN_TABS: 'MainTabs',
  DRAWER: 'Drawer',
};

// Tab names constants
export const TAB_NAMES = {
  HOME: 'Home',
  COLLECT: 'Collect',
  VISUALIZE: 'Visualize',
  PROJECTS: 'Projects',
  SETTINGS: 'Settings',
};

