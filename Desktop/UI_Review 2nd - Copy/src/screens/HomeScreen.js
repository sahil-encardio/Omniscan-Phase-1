import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions,
  SafeAreaView,
  RefreshControl,
  Image,
  Modal,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons, Materia3lIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, Shadows } from '../styles/DesignSystem';
import ScreenHeader from './components/ScreenHeader';
import StatusIndicator from '../components/StatusIndicator';
import Card from '../components/Card';
import RecentActivity from '../components/RecentActivity';
import UserProfileModal from '../components/UserProfileModal';
import BLEDeviceScannerModal from '../components/BLEDeviceScannerModal';
import BLEDeviceDetailModal from '../components/BLEDeviceDetailModal';
import BLEPermissionModal from '../components/BLEPermissionModal';
import { useAuth } from '../context/AuthContext';
import { useBLE } from '../context/BLEContext';

const { width, height } = Dimensions.get('window');


const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { 
    connectedDevice, 
    disconnectFromDevice, 
    bleState, 
    permissionsGranted,
    checkPermissions,
    requestPermissions,
    rssi,
    initializeBLE,
    bleInitialized,
    readSensorData 
  } = useBLE();
  
  const [selectedTab, setSelectedTab] = useState('Today');
  const [refreshing, setRefreshing] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(85);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showBLEScanner, setShowBLEScanner] = useState(false);
  const [showBLEDetail, setShowBLEDetail] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  
  // User profile data
  const [userProfile, setUserProfile] = useState({
    name: 'Sahil Das',
    email: 'sahil.das@nexawave.com',
    role: 'Project Manager',
    photo: null, // Will be set to uploaded photo URI
    totalProjects: 12,
    completedProjects: 8,
    activeProjects: 4,
    activityScore: 95,
    notifications: [
      {
        id: 1,
        type: 'success',
        icon: 'checkmark-circle',
        title: 'Project Completed',
        message: 'Bridge Monitoring project has been successfully completed',
        time: '2 hours ago',
        unread: true
      },
      {
        id: 2,
        type: 'info',
        icon: 'person-add',
        title: 'Team Member Added',
        message: 'Sarah Johnson has been added to Dam Safety project',
        time: '1 day ago',
        unread: true
      },
      {
        id: 3,
        type: 'warning',
        icon: 'warning',
        title: 'Sensor Alert',
        message: 'Temperature sensor in Highway Monitoring showing unusual readings',
        time: '2 days ago',
        unread: false
      },
      {
        id: 4,
        type: 'info',
        icon: 'settings',
        title: 'Settings Updated',
        message: 'Project settings for Highway Monitoring have been modified',
        time: '3 days ago',
        unread: false
      },
      {
        id: 5,
        type: 'success',
        icon: 'trending-up',
        title: 'Report Generated',
        message: 'Monthly performance report has been generated and sent',
        time: '1 week ago',
        unread: false
      },
      {
        id: 6,
        type: 'info',
        icon: 'sync',
        title: 'Data Sync',
        message: 'Cloud synchronization completed successfully',
        time: '1 week ago',
        unread: false
      }
    ]
  });

  // Function to get greeting based on time of day
  const getGreeting = () => {
    const currentHour = new Date().getHours();
    
    if (currentHour >= 5 && currentHour < 12) {
      return 'Good Morning!';
    } else if (currentHour >= 12 && currentHour < 17) {
      return 'Good Afternoon!';
    } else if (currentHour >= 17 && currentHour < 21) {
      return 'Good Evening!';
    } else {
      return 'Good Night!';
    }
  };

  // Slider images array
  const sliderImages = [
    require('../assets/slider8.png'),
    require('../assets/slider2.png'),
    require('../assets/slider6.png'),
    require('../assets/slider4.png'),
    require('../assets/slider7.png'),
  ];

  // Auto-slide effect - Optimized for emulator performance
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlideIndex((prevIndex) => 
        prevIndex === sliderImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 4000); // Increased to 4 seconds for better performance

    return () => clearInterval(interval);
  }, []);

  // Performance monitoring for emulator debugging
  useEffect(() => {
    console.log('HomeScreen rendered - Current slide:', currentSlideIndex);
  }, [currentSlideIndex]);

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => setRefreshing(false), 2000);
  };

  const handleUpdateUser = (updatedUser) => {
    console.log('Updating user profile with:', updatedUser);
    console.log('Photo URI:', updatedUser.photo);
    setUserProfile(updatedUser);
  };

  const toggleConnection = async () => {
    if (connectedDevice) {
      // Disconnect from current device
      try {
        await disconnectFromDevice();
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    } else {
      // Initialize BLE if not already initialized
      if (!bleInitialized) {
        initializeBLE();
      }
      
      // Wait a moment for BLE to initialize and get state
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check BLE state after initialization
      if (bleState !== 'PoweredOn' && bleState !== 'Unknown') {
        Alert.alert(
          'Bluetooth Required',
          'Please turn on Bluetooth to scan for devices.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Retry', 
              onPress: () => {
                setTimeout(() => toggleConnection(), 1000);
              }
            }
          ]
        );
        return;
      }

      // Check permissions
      const hasPermissions = await checkPermissions();
      
      if (hasPermissions) {
        setShowBLEScanner(true);
      } else {
        setShowPermissionModal(true);
      }
    }
  };

  const handleDeviceSelect = async (device) => {
    setShowBLEScanner(false);
    // Connection will be handled by BLE context
    // Show detail modal after successful connection
  };

  const handlePermissionRequest = async () => {
    setShowPermissionModal(false);
    const granted = await requestPermissions();
    if (granted) {
      setShowBLEScanner(true);
    }
  };

  // Show device detail modal when connected
  useEffect(() => {
    if (connectedDevice) {
      setShowBLEDetail(true);
      
      // Show navigation hint to user (delayed to avoid crash)
      setTimeout(() => {
        Alert.alert(
          'Connected Successfully!',
          'Your EDI-55 device is connected. Navigate to the "Live Data" tab to monitor your sensors.',
          [{ text: 'Got it', style: 'default' }]
        );
      }, 1500);
    } else {
      setShowBLEDetail(false);
    }
  }, [connectedDevice]);

  // Memoized slider indicators for better performance
  const sliderIndicators = useMemo(() => {
    return sliderImages.map((_, index) => (
      <View
        key={index}
        style={[
          styles.indicator,
          index === currentSlideIndex && styles.activeIndicator
        ]}
      />
    ));
  }, [currentSlideIndex]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScreenHeader 
        title={getGreeting()}
        subtitle={userProfile.name}
        navigation={navigation}
        showBackButton={false}
        showLogo={true}
        rightAction={
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.userIconButton}
              onPress={() => {
                console.log('User icon pressed, opening profile modal');
                console.log('Current photo state:', userProfile.photo);
                setShowUserProfile(true);
              }}
            >
              {userProfile.photo ? (
                <Image 
                  source={{ uri: userProfile.photo }} 
                  style={styles.userIcon}
                  onError={(error) => console.log('Header photo load error:', error)}
                  onLoad={() => console.log('Header photo loaded successfully')}
                />
              ) : (
                <View style={styles.userIconPlaceholder}>
                  <Text style={styles.userIconText}>
                    {userProfile.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => setShowNotifications(true)}
          >
            <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
          </View>
        }
        leftAction={
          <View style={styles.leftHeaderActions}>
            <TouchableOpacity 
              style={styles.navigationButton}
              onPress={() => {/* Add navigation drawer or menu functionality */}}
            >
              <Ionicons name="menu" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.logoContainer}>
              <Image 
                source={require('../assets/nexa2.png')} 
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </View>
        }
      />
      
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        // Performance optimizations for emulator
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={10}
      >
        {/* Stats Overview */}
        <View style={styles.statsOverview}>
          <View style={styles.statCard}>
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>24</Text>
              <Text style={styles.statLabel}>Active Loggers</Text>
            </View>
            <View style={styles.statIconContainer}>
              <Ionicons name="phone-portrait" size={20} color="#2241DD" />
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>98</Text>
              <Text style={styles.statLabel}>Total Sensors</Text>
              </View>
            <View style={styles.statIconContainer}>
              <Ionicons name="cellular" size={20} color="#2241DD" />
              </View>
            </View>
          
          <View style={styles.statCard}>
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>10</Text>
              <Text style={styles.statLabel}>Current Projects</Text>
            </View>
            <View style={styles.statIconContainer}>
              <Ionicons name="folder" size={20} color="#2241DD" />
            </View>
          </View>
          </View>
          
        {/* Slider Card - Optimized for emulator performance */}
        <View style={styles.greetingCard}>
          <LinearGradient
            colors={['#6B7280', '#4B5563', '#374151']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          />
          <Image
            source={sliderImages[currentSlideIndex]}
            style={styles.sliderImage}
            resizeMode="cover"
            fadeDuration={200}
            onLoadStart={() => console.log('Image loading started')}
            onLoad={() => console.log('Image loaded successfully')}
            onError={(error) => console.log('Image load error:', error)}
          />
          {/* Slider Indicators - Memoized for performance */}
          <View style={styles.sliderIndicators}>
            {sliderIndicators}
          </View>
        </View>

        {/* Device Status - Compact Professional Design */}
        <Card style={[
          styles.statusCard,
          {
            borderColor: connectedDevice ? '#10B981' : '#EF4444',
            borderWidth: 2,
          }
        ]}>
          <View style={styles.statusCardHeader}>
            <View style={styles.statusHeaderLeft}>
              <View style={styles.deviceIconContainer}>
                <Ionicons name="hardware-chip" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.deviceInfo}>
                <View style={styles.deviceNameRow}>
                <Text style={styles.deviceName}>
                  {connectedDevice ? connectedDevice.name : 'No Device'}
                </Text>
                  <TouchableOpacity 
                    style={styles.connectionButton} 
                    onPress={toggleConnection}
                  >
                    <View style={[
                      styles.connectionBadge, 
                      !connectedDevice && styles.disconnectedBadge
                    ]}>
                      <View style={[
                        styles.connectionDot,
                        !connectedDevice && styles.disconnectedDot
                      ]} />
                      <Text style={[
                        styles.connectionText,
                        !connectedDevice && styles.disconnectedText
                      ]}>
                        {connectedDevice ? 'Disconnect' : 'Connect'}
                      </Text>
              </View>
                  </TouchableOpacity>
            </View>
                <Text style={styles.deviceModel}>
                  {connectedDevice ? connectedDevice.id : 'Tap Connect to scan for BLE devices'}
                </Text>
              </View>
            </View>
          </View>
          
          {/* Compact Status Metrics */}
          <View style={styles.statusMetricsContainer}>
            <View style={[styles.statusMetric, styles.batteryMetric]}>
              <Ionicons name="battery-half" size={20} color="#2241DD" />
              <Text style={styles.metricValue}>
                {connectedDevice ? `${batteryLevel}%` : '---'}
              </Text>
            </View>
            
            <View style={[styles.statusMetric, styles.signalMetric]}>
              <Ionicons name="cellular" size={20} color="#2241DD" />
              <Text style={styles.metricValue}>
                {connectedDevice && rssi ? `${rssi} dBm` : '---'}
              </Text>
            </View>
            
            <View style={[styles.statusMetric, styles.connectionMetric]}>
              <Ionicons name="bluetooth" size={20} color="#2241DD" />
              <Text style={styles.metricValue}>
                {connectedDevice ? 'Connected' : 'Disconnected'}
              </Text>
            </View>
            
            <View style={[styles.statusMetric, styles.cloudMetric]}>
              <Ionicons name="cloud-done" size={20} color="#2241DD" />
              <Text style={styles.metricValue}>
                {connectedDevice ? 'Online' : '---'}
              </Text>
            </View>
          </View>
          
        </Card>



        {/* Recent Activity */}
        <RecentActivity 
          onViewAll={() => {
            console.log('View all activities');
            // Navigate to full activity screen
          }}
          onActivityPress={(activity) => {
            console.log('Activity pressed:', activity);
            // Handle activity press
          }}
        />
        
        
        <View style={styles.bottomSpacing} />
        </ScrollView>
        
        {/* User Profile Modal */}
        <UserProfileModal
          visible={showUserProfile}
          onClose={() => setShowUserProfile(false)}
          userData={userProfile}
          onUpdateUser={handleUpdateUser}
        />

        {/* Notifications Modal */}
        <Modal
          visible={showNotifications}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowNotifications(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
            <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowNotifications(false)}
            >
                <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
        </View>
        
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {userProfile.notifications.map((notification) => (
                <View key={notification.id} style={styles.notificationItem}>
                  <View style={styles.notificationIconContainer}>
                    <Ionicons 
                      name={notification.icon} 
                      size={22} 
                      color="#2241DD"
                    />
                  </View>
                  <View style={styles.notificationContent}>
                    <View style={styles.notificationHeader}>
                      <Text style={styles.notificationTitle}>{notification.title}</Text>
                      {notification.unread && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.notificationMessage}>{notification.message}</Text>
                    <Text style={styles.notificationTime}>{notification.time}</Text>
                  </View>
                </View>
              ))}
        </ScrollView>
          </View>
        </Modal>

        {/* BLE Device Scanner Modal */}
        <BLEDeviceScannerModal
          visible={showBLEScanner}
          onClose={() => setShowBLEScanner(false)}
          onDeviceSelect={handleDeviceSelect}
          navigation={navigation}
        />

        {/* BLE Device Detail Modal */}
        <BLEDeviceDetailModal
          visible={showBLEDetail}
          onClose={() => setShowBLEDetail(false)}
        />

        {/* BLE Permission Modal */}
        <BLEPermissionModal
          visible={showPermissionModal}
          onClose={() => setShowPermissionModal(false)}
          onRequestPermissions={handlePermissionRequest}
        />
    </View>
  );
};

const ActivityItem = ({ icon, title, time, status }) => (
  <View style={styles.activityItem}>
    <View style={[styles.activityIcon, { backgroundColor: '#F5F5F5' }]}>
      {icon}
    </View>
    <View style={styles.activityContent}>
      <Text style={[styles.activityTitle, { color: '#000000' }]}>{title}</Text>
      <Text style={[styles.activityTime, { color: '#666666' }]}>{time}</Text>
    </View>
    <View style={styles.activityStatus}>
      <StatusIndicator status={status} size="small" />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // White background
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  navigationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  leftHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  logoImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  notificationButton: {
    position: 'relative',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF4444',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  // Greeting Card Styles
  greetingCard: {
    backgroundColor: '#2241DD',
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    overflow: 'hidden',
    height: 200,
    minHeight: 200,
  },
  cardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  sliderImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    backgroundColor: '#2241DD', // Fallback color
    top: 0,
    left: 0,
    borderRadius: 16,
    // Performance optimizations for emulator
    shouldRasterizeIOS: true,
    renderToHardwareTextureAndroid: true,
  },
  sliderOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 20,
    justifyContent: 'space-between',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 15,
    left: 0,
    right: 0,
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  activeIndicator: {
    backgroundColor: '#FFFFFF',
    width: 16,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2241DD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  greetingText: {
    fontSize: 16, // Increased from 14sp for better visibility
    fontWeight: '500',
    color: '#FFFFFF', // White for video overlay
    fontFamily: 'Inter-Medium',
  },
  userNameText: {
    fontSize: 18, // Increased from 16sp for better visibility
    fontWeight: '700',
    color: '#FFFFFF', // White for video overlay
    fontFamily: 'Inter-Bold',
    marginTop: 2,
  },
  projectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB', // Light gray border
  },
  projectIndicator: {
    width: 4,
    height: 40,
    backgroundColor: '#10B981', // Bright green for contrast
    borderRadius: 2,
    marginRight: 12,
  },
  projectTextContainer: {
    flex: 1,
  },
  projectLabel: {
    fontSize: 16, // Increased from 14sp for better visibility
    fontWeight: '600',
    color: '#FFFFFF', // White for video overlay
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  projectName: {
    fontSize: 18, // Increased from 16sp for better visibility
    fontWeight: '700',
    color: '#FFFFFF', // White for video overlay
    fontFamily: 'Inter-Bold',
  },
  statusCard: {
    marginBottom: 8,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  // Stats Overview Styles
  statsOverview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
    paddingHorizontal: 4,
    marginTop: Spacing.sm,
    gap: 6,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 70,
  },
  statContent: {
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2241DD',
    fontFamily: 'Inter-Bold',
    marginBottom: 1,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: 'Inter-Medium',
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(34, 65, 221, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Quick Actions Styles
  sectionContainer: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 22, // Increased from 20sp for better visibility
    fontWeight: '700',
    color: '#000000', // Pure black for maximum contrast
    fontFamily: 'Inter-Bold',
    marginBottom: 16,
  },
  statusCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2241DD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  deviceName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: 'Inter-SemiBold',
    flex: 1,
  },
  deviceModel: {
    fontSize: 16,
    fontWeight: '400',
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8DC63F',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginRight: Spacing.xs,
  },
  connectionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
  connectionButton: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  disconnectedBadge: {
    backgroundColor: '#EF4444',
  },
  disconnectedDot: {
    backgroundColor: '#FFFFFF',
  },
  disconnectedText: {
    color: '#FFFFFF',
  },
  statusMetricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingHorizontal: 4,
  },
  statusMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginHorizontal: 2,
  },
  batteryMetric: {
    flex: 1,
  },
  signalMetric: {
    flex: 1,
  },
  connectionMetric: {
    flex: 1.5,
  },
  cloudMetric: {
    flex: 1,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    fontFamily: 'Inter-SemiBold',
    marginLeft: 6,
  },
  activityCard: {
    marginBottom: Spacing.xl,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  viewAllText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2241DD',
    fontFamily: 'Inter-SemiBold',
  },
  activityList: {
    // Container for activity items
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    fontFamily: 'Inter-SemiBold',
    marginBottom: Spacing.xs,
  },
  activityTime: {
    fontSize: 12,
    fontWeight: '400',
    color: '#666666',
    fontFamily: 'Inter-Regular',
  },
  activityStatus: {
    marginLeft: Spacing.sm,
  },
  bottomSpacing: {
    height: Spacing.xl,
  },
  // User Icon Styles
  userIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  userIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  userIconPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userIconText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  // Notification Modal Styles
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
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  notificationItem: {
    flexDirection: 'row',
    paddingVertical: 18,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  notificationIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: '#111827',
    flex: 1,
    letterSpacing: 0.3,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2241DD',
    marginLeft: 10,
  },
  notificationMessage: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
    letterSpacing: 0.2,
  },
});

export default HomeScreen;

