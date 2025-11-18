import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBLE } from '../context/BLEContext';
import { Colors, Spacing, Typography, BorderRadius } from '../styles/DesignSystem';
import { formatSensorValue } from '../utils/sensorDataParser';

const { width } = Dimensions.get('window');

const LiveSensorsScreen = ({ navigation }) => {
  const {
    connectedDevice,
    sensorData,
    isMonitoring,
    lastReadingTime,
    readSensorData,
    startMonitoring,
    stopMonitoring,
    rssi,
  } = useBLE();

  const [mode, setMode] = useState('manual'); // 'manual' or 'realtime'
  const [refreshing, setRefreshing] = useState(false);
  const [isReading, setIsReading] = useState(false);

  // Handle manual reading
  const handleTakeReading = async () => {
    if (!connectedDevice) {
      Alert.alert('Not Connected', 'Please connect to your EDI-55 device first.');
      return;
    }

    setIsReading(true);
    try {
      // Add a small delay to ensure device is ready
      await new Promise(resolve => setTimeout(resolve, 500));
      await readSensorData();
    } catch (error) {
      console.error('Failed to take reading:', error);
      Alert.alert(
        'Read Error',
        'Failed to read sensor data. Please ensure:\n\n• Device is connected\n• Sensors are configured\n• Device is in Monitor Mode',
        [{ text: 'OK' }]
      );
    } finally {
      setIsReading(false);
    }
  };

  // Handle pull to refresh
  const onRefresh = async () => {
    if (mode === 'manual') {
      setRefreshing(true);
      await handleTakeReading();
      setRefreshing(false);
    }
  };

  // Handle monitoring toggle
  const handleMonitoringToggle = async () => {
    if (isMonitoring) {
      stopMonitoring();
    } else {
      await startMonitoring();
    }
  };

  // Cleanup monitoring when switching to manual mode
  useEffect(() => {
    if (mode === 'manual' && isMonitoring) {
      stopMonitoring();
    }
  }, [mode, isMonitoring, stopMonitoring]);

  // Format timestamp
  const formatTime = (date) => {
    if (!date) return '--';
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // seconds

    if (diff < 5) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return date.toLocaleTimeString();
  };

  // Render empty state
  if (!connectedDevice) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="bluetooth-outline" size={80} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No Device Connected</Text>
          <Text style={styles.emptySubtitle}>
            Connect to your EDI-55 device from the Home tab to view sensor data
          </Text>
          <TouchableOpacity
            style={styles.goToHomeButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Ionicons name="home-outline" size={20} color="#FFFFFF" />
            <Text style={styles.goToHomeText}>Go to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Live Sensor Data</Text>
          <View style={styles.connectionBadge}>
            <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.connectionText}>Connected</Text>
          </View>
        </View>
        <View style={styles.deviceInfo}>
          <Ionicons name="bluetooth" size={16} color="#6B7280" />
          <Text style={styles.deviceName}>{connectedDevice.name || connectedDevice.id}</Text>
          {rssi !== null && (
            <Text style={styles.rssiText}>• {rssi} dBm</Text>
          )}
        </View>
        {lastReadingTime && (
          <Text style={styles.lastUpdate}>
            Last update: {formatTime(lastReadingTime)}
          </Text>
        )}
      </View>

      {/* Mode Toggle */}
      <View style={styles.modeToggleContainer}>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'manual' && styles.modeButtonActive]}
          onPress={() => setMode('manual')}
        >
          <Ionicons
            name="hand-left-outline"
            size={20}
            color={mode === 'manual' ? '#FFFFFF' : '#6B7280'}
          />
          <Text style={[styles.modeButtonText, mode === 'manual' && styles.modeButtonTextActive]}>
            Manual
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeButton, mode === 'realtime' && styles.modeButtonActive]}
          onPress={() => setMode('realtime')}
        >
          <Ionicons
            name="pulse-outline"
            size={20}
            color={mode === 'realtime' ? '#FFFFFF' : '#6B7280'}
          />
          <Text style={[styles.modeButtonText, mode === 'realtime' && styles.modeButtonTextActive]}>
            Real-time
          </Text>
        </TouchableOpacity>
      </View>

      {/* Action Button */}
      <View style={styles.actionContainer}>
        {mode === 'manual' ? (
          <TouchableOpacity
            style={[styles.actionButton, isReading && styles.actionButtonDisabled]}
            onPress={handleTakeReading}
            disabled={isReading}
          >
            {isReading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Ionicons name="radio-button-on-outline" size={24} color="#FFFFFF" />
            )}
            <Text style={styles.actionButtonText}>
              {isReading ? 'Reading...' : 'Take Reading'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.actionButton,
              isMonitoring && styles.actionButtonStop,
            ]}
            onPress={handleMonitoringToggle}
          >
            <Ionicons
              name={isMonitoring ? 'stop-circle-outline' : 'play-circle-outline'}
              size={24}
              color="#FFFFFF"
            />
            <Text style={styles.actionButtonText}>
              {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Sensor Data List */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            enabled={mode === 'manual'}
          />
        }
      >
        {sensorData.length === 0 ? (
          <View style={styles.noDataState}>
            <Ionicons name="analytics-outline" size={64} color="#D1D5DB" />
            <Text style={styles.noDataTitle}>No Sensor Data</Text>
            <Text style={styles.noDataSubtitle}>
              {mode === 'manual'
                ? 'Tap "Take Reading" to read sensor values'
                : 'Tap "Start Monitoring" to begin real-time updates'}
            </Text>
          </View>
        ) : (
          <View style={styles.sensorGrid}>
            {sensorData.map((sensor) => (
              <View
                key={sensor.sensorId}
                style={[styles.sensorCard, { borderLeftColor: sensor.color }]}
              >
                <View style={styles.sensorHeader}>
                  <View style={[styles.sensorIconContainer, { backgroundColor: sensor.color + '20' }]}>
                    <Ionicons name={sensor.icon} size={24} color={sensor.color} />
                  </View>
                  <View style={styles.sensorHeaderText}>
                    <Text style={styles.sensorName}>{sensor.sensorTypeName}</Text>
                    <Text style={styles.sensorId}>ID: {sensor.sensorId}</Text>
                  </View>
                </View>

                <View style={styles.sensorValueContainer}>
                  <Text style={styles.sensorValue}>
                    {formatSensorValue(sensor.value)}
                  </Text>
                  <Text style={styles.sensorUnits}>{sensor.units}</Text>
                </View>

                {sensor.temperature !== null && sensor.temperature !== undefined && (
                  <View style={styles.sensorTempContainer}>
                    <Ionicons name="thermometer-outline" size={14} color="#6B7280" />
                    <Text style={styles.sensorTemp}>
                      {formatSensorValue(sensor.temperature, 1)}°C
                    </Text>
                  </View>
                )}

                <Text style={styles.sensorTimestamp}>
                  {formatTime(sensor.timestamp)}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.lg,
    paddingTop: Spacing.xl + 40, // Account for status bar
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.text,
  },
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B98120',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  connectionText: {
    ...Typography.caption,
    color: '#10B981',
    fontWeight: '600',
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  deviceName: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginLeft: 6,
  },
  rssiText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  lastUpdate: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  modeToggleContainer: {
    flexDirection: 'row',
    margin: Spacing.lg,
    backgroundColor: '#F3F4F6',
    borderRadius: BorderRadius.lg,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
  },
  modeButtonActive: {
    backgroundColor: Colors.primary,
  },
  modeButtonText: {
    ...Typography.button,
    color: '#6B7280',
    marginLeft: 8,
  },
  modeButtonTextActive: {
    color: '#FFFFFF',
  },
  actionContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: BorderRadius.lg,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  actionButtonStop: {
    backgroundColor: '#EF4444',
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    ...Typography.button,
    color: '#FFFFFF',
    marginLeft: 8,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  sensorGrid: {
    padding: Spacing.lg,
  },
  sensorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  sensorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sensorIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  sensorHeaderText: {
    flex: 1,
  },
  sensorName: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: 2,
  },
  sensorId: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  sensorValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.sm,
  },
  sensorValue: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'Inter-Bold',
  },
  sensorUnits: {
    ...Typography.h4,
    color: Colors.textSecondary,
    marginLeft: 8,
    fontWeight: '600',
  },
  sensorTempContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sensorTemp: {
    ...Typography.body,
    color: '#6B7280',
    marginLeft: 4,
  },
  sensorTimestamp: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  goToHomeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
  },
  goToHomeText: {
    ...Typography.button,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  noDataState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    marginTop: 60,
  },
  noDataTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  noDataSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default LiveSensorsScreen;

