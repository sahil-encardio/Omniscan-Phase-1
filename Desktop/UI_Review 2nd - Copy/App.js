import React from 'react';
import { View, Text } from 'react-native';
import ErrorBoundary from './src/components/ErrorBoundary';

// Try to load GestureHandlerRootView, make it optional
let GestureHandlerRootView = null;
try {
  const gestureModule = require('react-native-gesture-handler');
  GestureHandlerRootView = gestureModule.GestureHandlerRootView;
} catch (error) {
  console.error('Failed to load gesture handler:', error);
  GestureHandlerRootView = ({ children, style }) => {
    const { View } = require('react-native');
    return <View style={style}>{children}</View>;
  };
}

// Try to import components with error handling
let AuthProvider, TeamProvider, BLEProvider, AppNavigator;

// Font loading will be handled differently to avoid hook violations
let FontLoader = null;
try {
  const fontsModule = require('@expo-google-fonts/inter');
  const { useFonts: useFontsHook, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } = fontsModule;
  
  // Create a component that uses the hook properly
  FontLoader = ({ children }) => {
    try {
      const [fontsLoaded] = useFontsHook({
    'Inter-Regular': Inter_400Regular,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  if (!fontsLoaded) {
        const { View, Text } = require('react-native');
        return (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
            <Text>Loading fonts...</Text>
          </View>
        );
      }
      return children;
    } catch (hookError) {
      console.error('Error in FontLoader hook:', hookError);
      // Fallback: return children anyway
      return children;
    }
  };
} catch (error) {
  console.error('Failed to load fonts:', error);
  // Create a passthrough component if fonts fail to load
  FontLoader = ({ children }) => children;
}

// Ensure FontLoader is always defined
if (!FontLoader) {
  FontLoader = ({ children }) => children;
}

try {
  AuthProvider = require('./src/context/AuthContext').AuthProvider;
} catch (error) {
  console.error('Failed to load AuthContext:', error);
  AuthProvider = ({ children }) => children;
}

try {
  TeamProvider = require('./src/context/TeamContext').TeamProvider;
} catch (error) {
  console.error('Failed to load TeamContext:', error);
  TeamProvider = ({ children }) => children;
}

try {
  BLEProvider = require('./src/context/BLEContext').BLEProvider;
} catch (error) {
  console.error('Failed to load BLEContext:', error);
  BLEProvider = ({ children }) => children;
}

try {
  AppNavigator = require('./src/navigation/AppNavigator').default;
} catch (error) {
  console.error('Failed to load AppNavigator:', error);
  AppNavigator = () => {
    const { View, Text, StyleSheet } = require('react-native');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Navigation Error</Text>
      </View>
    );
  };
}

export default function App() {
  // Initialize default data on app start
  React.useEffect(() => {
    console.log('App component mounted - initializing...');
    initializeApp();
  }, []);

  async function initializeApp() {
    try {
      // Initialize database
      const DatabaseManager = require('./src/database/DatabaseManager').default;
      await DatabaseManager.initialize();
      
      // Initialize default site and sensors (only on first launch)
      const { initializeDefaultData } = require('./src/utils/DefaultDataInitializer');
      await initializeDefaultData();
      
      console.log('✓ App initialized successfully');
    } catch (error) {
      console.error('❌ App initialization error:', error);
    }
  }

  // Always render something visible
  const renderContent = () => {
    try {
  return (
        <FontLoader>
          <GestureHandlerRootView style={{ flex: 1 }}>
    <AuthProvider>
      <TeamProvider>
        <BLEProvider>
          <AppNavigator />
        </BLEProvider>
      </TeamProvider>
    </AuthProvider>
          </GestureHandlerRootView>
        </FontLoader>
      );
    } catch (err) {
      console.error('Error rendering app content:', err);
      const { View, Text } = require('react-native');
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
          <Text style={{ fontSize: 18, marginBottom: 10 }}>Rendering Error</Text>
          <Text style={{ fontSize: 14, color: '#666' }}>{err.message || 'Unknown error'}</Text>
        </View>
      );
    }
  };

  return (
    <ErrorBoundary>
      <React.Suspense 
        fallback={
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
            <Text>Loading...</Text>
          </View>
        }
      >
        {renderContent()}
      </React.Suspense>
    </ErrorBoundary>
  );
}
