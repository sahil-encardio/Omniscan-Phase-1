import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Try to load dependencies with fallbacks
let Ionicons = null;
try {
  Ionicons = require('@expo/vector-icons').Ionicons;
} catch (e) {
  console.error('Failed to load Ionicons:', e);
  Ionicons = ({ name, size, color }) => {
    const { Text } = require('react-native');
    return <Text style={{ fontSize: size, color }}>●</Text>;
  };
}

let useBLE = null;
try {
  useBLE = require('../../context/BLEContext').useBLE;
} catch (e) {
  console.error('Failed to load useBLE:', e);
  useBLE = () => ({ connectedDevice: null, disconnectFromDevice: () => {} });
}

let Colors, Typography, Spacing, BorderRadius;
try {
  const designSystem = require('../../styles/DesignSystem');
  Colors = designSystem.Colors;
  Typography = designSystem.Typography;
  Spacing = designSystem.Spacing;
  BorderRadius = designSystem.BorderRadius;
} catch (e) {
  console.error('Failed to load DesignSystem:', e);
  Colors = { primary: '#2241DD', background: '#F9FAFB', text: '#111827' };
  Typography = {};
  Spacing = {};
  BorderRadius = {};
}

let edi55Service = null;
try {
  edi55Service = require('../../services/EDI55Service').default;
} catch (e) {
  console.error('Failed to load edi55Service:', e);
  edi55Service = { readDeviceInfo: async () => null };
}

let DatabaseManager = null;
try {
  DatabaseManager = require('../../database/DatabaseManager').default;
} catch (e) {
  console.error('Failed to load DatabaseManager:', e);
  DatabaseManager = { initialize: async () => {} };
}

const EDI55ConfigurationHub = ({ navigation }) => {
  const { connectedDevice, disconnectFromDevice } = useBLE();
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingDeviceInfo, setLoadingDeviceInfo] = useState(false);

  useEffect(() => {
    initializeDatabase();
  }, []);

  const initializeDatabase = async () => {
    try {
      // Ensure database is initialized
      await DatabaseManager.initialize();
      console.log('Database initialized in Configuration Hub');
    } catch (error) {
      console.error('Failed to initialize:', error);
    }
  };

  const loadDeviceInfo = async () => {
    try {
      setLoadingDeviceInfo(true);
      const info = await edi55Service.readDeviceInfo();
      setDeviceInfo(info);
      console.log('Device info loaded:', info);
      Alert.alert('Success', 'Device information loaded successfully');
    } catch (error) {
      console.error('Failed to load device info:', error);
      Alert.alert('Error', 'Failed to load device information. Please try again.');
    } finally {
      setLoadingDeviceInfo(false);
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect Device',
      'Are you sure you want to disconnect from the EDI-55 device?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await disconnectFromDevice();
            navigation.goBack();
          },
        },
      ]
    );
  };

  const ConfigCard = ({ icon, title, description, onPress, color = Colors.primary }) => (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={32} color={color} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDescription}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color={Colors.text.secondary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>EDI-55</Text>
          <Text style={styles.headerSubtitle}>
            {connectedDevice?.name || 'Connected Device'}
          </Text>
        </View>
        <TouchableOpacity onPress={handleDisconnect} style={styles.disconnectButton}>
          <Ionicons name="power" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Primary Action Cards - Site Management and Take Reading */}
        <View style={styles.primaryActionsContainer}>
          <TouchableOpacity
            style={styles.primaryCard}
            onPress={() => navigation.navigate('SiteManagement')}
            activeOpacity={0.8}
          >
            <View style={[styles.primaryCardIconContainer, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
              <Ionicons name="location" size={40} color="#FFFFFF" />
            </View>
            <Text style={styles.primaryCardTitle}>Site Management</Text>
            <Text style={styles.primaryCardDescription}>Create and manage sites for your sensors</Text>
            <View style={styles.primaryCardArrow}>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryCard}
            onPress={() => navigation.navigate('TakeReading')}
            activeOpacity={0.8}
          >
            <View style={[styles.primaryCardIconContainer, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
              <Ionicons name="pulse" size={40} color="#FFFFFF" />
            </View>
            <Text style={styles.primaryCardTitle}>Take Reading</Text>
            <Text style={styles.primaryCardDescription}>Start real-time sensor monitoring</Text>
            <View style={styles.primaryCardArrow}>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Device Information Card */}
        {deviceInfo && (
          <View style={styles.deviceInfoCard}>
            <Text style={styles.deviceInfoTitle}>Device Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Indicator ID:</Text>
              <Text style={styles.infoValue}>{deviceInfo?.indicatorId || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Serial Number:</Text>
              <Text style={styles.infoValue}>{deviceInfo?.serialNo || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Model:</Text>
              <Text style={styles.infoValue}>{deviceInfo?.modelNo || 'N/A'}</Text>
            </View>
          </View>
        )}

        {/* Secondary Options */}
        <Text style={styles.sectionTitle}>More Options</Text>

        <TouchableOpacity
          style={styles.secondaryCard}
          onPress={() => navigation.navigate('SensorSelection')}
          activeOpacity={0.7}
        >
          <View style={styles.secondaryCardIconContainer}>
            <Ionicons name="hardware-chip" size={24} color="#2241DD" />
          </View>
          <View style={styles.secondaryCardContent}>
            <Text style={styles.secondaryCardTitle}>Sensor Selection</Text>
            <Text style={styles.secondaryCardDescription}>Select up to 3 sensors for reading</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#6B7280" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryCard}
          onPress={() => navigation.navigate('SystemSetup')}
          activeOpacity={0.7}
        >
          <View style={styles.secondaryCardIconContainer}>
            <Ionicons name="settings" size={24} color="#2241DD" />
          </View>
          <View style={styles.secondaryCardContent}>
            <Text style={styles.secondaryCardTitle}>System Setup</Text>
            <Text style={styles.secondaryCardDescription}>Scan intervals, download, and erase</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#6B7280" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryCard}
          onPress={loadDeviceInfo}
          disabled={loadingDeviceInfo}
          activeOpacity={0.7}
        >
          <View style={styles.secondaryCardIconContainer}>
            {loadingDeviceInfo ? (
              <ActivityIndicator size="small" color="#2241DD" />
            ) : (
              <Ionicons name="information-circle" size={24} color="#2241DD" />
            )}
          </View>
          <View style={styles.secondaryCardContent}>
            <Text style={styles.secondaryCardTitle}>Device Info</Text>
            <Text style={styles.secondaryCardDescription}>
              {loadingDeviceInfo ? 'Loading device information...' : 'Load device information'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#6B7280" />
        </TouchableOpacity>

        <View style={{ height: Spacing.xl * 2 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginTop: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: '#2241DD',
  },
  backButton: {
    padding: Spacing.sm,
    marginRight: Spacing.sm,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  disconnectButton: {
    padding: Spacing.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  primaryActionsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  primaryCard: {
    flex: 1,
    backgroundColor: '#2241DD',
    borderRadius: 16,
    padding: Spacing.lg,
    minHeight: 180,
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryCardIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  primaryCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: Spacing.xs,
  },
  primaryCardDescription: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
  },
  primaryCardArrow: {
    alignSelf: 'flex-end',
    marginTop: Spacing.md,
  },
  deviceInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  deviceInfoTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
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
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  secondaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  secondaryCardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(34, 65, 221, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  secondaryCardContent: {
    flex: 1,
  },
  secondaryCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 2,
  },
  secondaryCardDescription: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: Spacing.xs,
  },
  cardDescription: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#111827',
    marginLeft: Spacing.sm,
  },
});

export default EDI55ConfigurationHub;

