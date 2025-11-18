import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { Colors, Typography, Spacing, BorderRadius } from '../../styles/DesignSystem';
import edi55Service from '../../services/EDI55Service';
import DatabaseManager from '../../database/DatabaseManager';
import {
  READING_AVG_OPTIONS,
  SUCCESS_MESSAGES,
  VALIDATION_MESSAGES,
} from '../../constants/EDI55Constants';

// Lazy load EDI-55 components with error handling
let SystemStatusCard = null;
let TimeInputField = null;
let ProgressIndicator = null;

try {
  SystemStatusCard = require('../../components/EDI55/SystemStatusCard').default;
} catch (e) {
  console.error('Failed to load SystemStatusCard:', e);
  SystemStatusCard = () => {
    const { View, Text } = require('react-native');
    return <View><Text>SystemStatusCard unavailable</Text></View>;
  };
}

try {
  TimeInputField = require('../../components/EDI55/TimeInputField').default;
} catch (e) {
  console.error('Failed to load TimeInputField:', e);
  TimeInputField = () => {
    const { View, Text } = require('react-native');
    return <View><Text>TimeInputField unavailable</Text></View>;
  };
}

try {
  ProgressIndicator = require('../../components/EDI55/ProgressIndicator').default;
} catch (e) {
  console.error('Failed to load ProgressIndicator:', e);
  ProgressIndicator = () => {
    const { View, Text } = require('react-native');
    return <View><Text>ProgressIndicator unavailable</Text></View>;
  };
}

const SystemSetupScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [systemSetup, setSystemSetup] = useState(null);
  const [indicatorId, setIndicatorId] = useState('');
  
  // Form state
  const [readingAvg, setReadingAvg] = useState(1);
  const [scanHours, setScanHours] = useState('0');
  const [scanMins, setScanMins] = useState('5');
  const [scanSecs, setScanSecs] = useState('0');
  const [startHours, setStartHours] = useState('0');
  const [startMins, setStartMins] = useState('0');
  
  // Operation states
  const [isStartingScan, setIsStartingScan] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    loadSystemSetup();
    loadIndicatorId();
    
    // Periodic refresh while on this screen
    const interval = setInterval(loadSystemSetup, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadSystemSetup = async () => {
    try {
      const setup = await edi55Service.readSystemSetup();
      setSystemSetup(setup);
      
      // Update form fields
      setReadingAvg(setup.readingAvg || 1);
      setScanHours(String(setup.scanIntervalHours || 0));
      setScanMins(String(setup.scanIntervalMins || 5));
      setScanSecs(String(setup.scanIntervalSecs || 0));
      setStartHours(String(setup.startScanHours || 0));
      setStartMins(String(setup.startScanMins || 0));
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to load system setup:', error);
      setLoading(false);
    }
  };

  const loadIndicatorId = async () => {
    try {
      const id = await edi55Service.readIndicatorID();
      setIndicatorId(id);
    } catch (error) {
      console.error('Failed to load indicator ID:', error);
    }
  };

  const handleUpdateIndicatorId = async () => {
    if (!indicatorId || indicatorId.trim() === '') {
      Alert.alert('Error', 'Please enter a valid Indicator ID');
      return;
    }

    try {
      await edi55Service.writeIndicatorID(indicatorId);
      Alert.alert('Success', SUCCESS_MESSAGES.INDICATOR_ID_UPDATED);
    } catch (error) {
      Alert.alert('Error', 'Failed to update Indicator ID');
    }
  };

  const handleUpdateScanInterval = async () => {
    const validation = edi55Service.validateScanInterval(
      parseInt(scanHours) || 0,
      parseInt(scanMins) || 0,
      parseInt(scanSecs) || 0
    );

    if (!validation.valid) {
      Alert.alert('Validation Error', validation.message);
      return;
    }

    try {
      await edi55Service.writeSystemSetup({
        ...systemSetup,
        scanIntervalHours: parseInt(scanHours) || 0,
        scanIntervalMins: parseInt(scanMins) || 0,
        scanIntervalSecs: parseInt(scanSecs) || 0,
      });
      Alert.alert('Success', SUCCESS_MESSAGES.SCAN_INTERVAL_UPDATED);
      await loadSystemSetup();
    } catch (error) {
      Alert.alert('Error', 'Failed to update scan interval');
    }
  };

  const handleUpdateScanStartTime = async () => {
    try {
      await edi55Service.writeSystemSetup({
        ...systemSetup,
        startScanHours: parseInt(startHours) || 0,
        startScanMins: parseInt(startMins) || 0,
      });
      Alert.alert('Success', SUCCESS_MESSAGES.SCAN_START_TIME_UPDATED);
      await loadSystemSetup();
    } catch (error) {
      Alert.alert('Error', 'Failed to update scan start time');
    }
  };

  const handleUpdateReadingAvg = async () => {
    try {
      await edi55Service.writeSystemSetup({
        ...systemSetup,
        readingAvg,
      });
      Alert.alert('Success', SUCCESS_MESSAGES.READING_AVG_UPDATED);
      await loadSystemSetup();
    } catch (error) {
      Alert.alert('Error', 'Failed to update reading average');
    }
  };

  const handleStartStopScan = async () => {
    if (systemSetup.scanState) {
      // Stop scan
      try {
        setIsStartingScan(true);
        await edi55Service.writeSystemSetup({
          ...systemSetup,
          scanState: false,
        });
        Alert.alert('Success', SUCCESS_MESSAGES.SCAN_STOPPED);
        await loadSystemSetup();
      } catch (error) {
        Alert.alert('Error', 'Failed to stop scan');
      } finally {
        setIsStartingScan(false);
      }
    } else {
      // Start scan - validate first
      if (systemSetup.noOfRecords > 0) {
        Alert.alert('Error', VALIDATION_MESSAGES.CANNOT_START_SCAN_WITH_RECORDS);
        return;
      }

      const validation = edi55Service.validateScanInterval(
        parseInt(scanHours) || 0,
        parseInt(scanMins) || 0,
        parseInt(scanSecs) || 0
      );

      if (!validation.valid) {
        Alert.alert('Validation Error', validation.message);
        return;
      }

      // Show time until scan starts
      const timeUntil = edi55Service.calculateTimeUntilScan(
        parseInt(startHours) || 0,
        parseInt(startMins) || 0
      );

      Alert.alert(
        'Start Scan',
        `Scan will start in ${timeUntil.hours}h ${timeUntil.minutes}m ${timeUntil.seconds}s`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Start',
            onPress: async () => {
              try {
                setIsStartingScan(true);
                
                // Write all configuration
                await edi55Service.writeSystemSetup({
                  readingAvg,
                  scanIntervalHours: parseInt(scanHours) || 0,
                  scanIntervalMins: parseInt(scanMins) || 0,
                  scanIntervalSecs: parseInt(scanSecs) || 0,
                  startScanHours: parseInt(startHours) || 0,
                  startScanMins: parseInt(startMins) || 0,
                  scanState: true,
                  eraseState: false,
                  downloadState: false,
                });

                // Write sensor configuration to device
                // TODO: This would require getting active sensors and writing them
                
                Alert.alert('Success', SUCCESS_MESSAGES.CONFIG_WRITTEN);
                await loadSystemSetup();
              } catch (error) {
                Alert.alert('Error', 'Failed to start scan');
              } finally {
                setIsStartingScan(false);
              }
            },
          },
        ]
      );
    }
  };

  const handleDownloadData = async () => {
    if (systemSetup.scanState) {
      Alert.alert('Error', VALIDATION_MESSAGES.STOP_SCAN_FIRST);
      return;
    }

    if (systemSetup.noOfRecords < 1) {
      Alert.alert('Error', VALIDATION_MESSAGES.NO_RECORDS_AVAILABLE);
      return;
    }

    Alert.alert(
      'Download Data',
      `Download ${systemSetup.noOfRecords} records from the device?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Download',
          onPress: async () => {
            try {
              setIsDownloading(true);
              setDownloadProgress(0);

              // Set download state
              await edi55Service.writeSystemSetup({
                ...systemSetup,
                downloadState: true,
                scanState: false,
                eraseState: false,
              });

              // Start download with progress callback
              const data = await edi55Service.downloadAnalogData(
                systemSetup.noOfRecords,
                (current, total) => {
                  setDownloadProgress(current);
                }
              );

              // Parse and save data
              // TODO: Parse downloaded data and save to database

              // Reset download state
              await edi55Service.writeSystemSetup({
                ...systemSetup,
                downloadState: false,
              });

              Alert.alert('Success', SUCCESS_MESSAGES.DOWNLOAD_COMPLETE);
              await loadSystemSetup();
            } catch (error) {
              console.error('Download error:', error);
              Alert.alert('Error', 'Failed to download data');
            } finally {
              setIsDownloading(false);
              setDownloadProgress(0);
            }
          },
        },
      ]
    );
  };

  const handleEraseMemory = async () => {
    if (systemSetup.scanState) {
      Alert.alert('Error', VALIDATION_MESSAGES.STOP_SCAN_FIRST);
      return;
    }

    if (systemSetup.noOfRecords < 1) {
      Alert.alert('Error', VALIDATION_MESSAGES.NO_RECORDS_AVAILABLE);
      return;
    }

    Alert.alert(
      'Erase Memory',
      'Are you sure you want to erase all data from the device? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Erase',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsErasing(true);

              // Set erase state
              await edi55Service.writeSystemSetup({
                ...systemSetup,
                eraseState: true,
                scanState: false,
                downloadState: false,
              });

              // Wait for erase to complete (poll for status)
              let attempts = 0;
              const maxAttempts = 12; // 60 seconds with 5-second intervals

              const checkEraseComplete = async () => {
                const status = await edi55Service.readSystemSetup();
                if (!status.eraseState) {
                  // Erase complete
                  Alert.alert('Success', SUCCESS_MESSAGES.ERASE_COMPLETE);
                  await loadSystemSetup();
                  setIsErasing(false);
                } else if (attempts < maxAttempts) {
                  attempts++;
                  setTimeout(checkEraseComplete, 5000);
                } else {
                  Alert.alert('Error', 'Erase operation timed out');
                  setIsErasing(false);
                }
              };

              setTimeout(checkEraseComplete, 5000);
            } catch (error) {
              console.error('Erase error:', error);
              Alert.alert('Error', 'Failed to erase memory');
              setIsErasing(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading system setup...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>System Setup</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* System Status */}
        <SystemStatusCard systemSetup={systemSetup} />

        {/* Indicator ID */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Indicator ID</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, styles.flex1]}
              value={indicatorId}
              onChangeText={setIndicatorId}
              placeholder="Enter Indicator ID"
              placeholderTextColor={Colors.text.disabled}
            />
            <TouchableOpacity
              style={styles.updateButton}
              onPress={handleUpdateIndicatorId}
            >
              <Text style={styles.updateButtonText}>Update</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Reading Average */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reading Average</Text>
          <View style={styles.inputRow}>
            <View style={[styles.pickerContainer, styles.flex1]}>
              <Picker
                selectedValue={readingAvg}
                onValueChange={setReadingAvg}
                style={styles.picker}
              >
                {READING_AVG_OPTIONS.map((opt) => (
                  <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                ))}
              </Picker>
            </View>
            <TouchableOpacity
              style={styles.updateButton}
              onPress={handleUpdateReadingAvg}
            >
              <Text style={styles.updateButtonText}>Update</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Scan Interval */}
        <View style={styles.section}>
          <TimeInputField
            label="Scan Interval"
            hours={scanHours}
            minutes={scanMins}
            seconds={scanSecs}
            onHoursChange={setScanHours}
            onMinutesChange={setScanMins}
            onSecondsChange={setScanSecs}
            maxHours={168}
          />
          <TouchableOpacity
            style={styles.fullWidthButton}
            onPress={handleUpdateScanInterval}
          >
            <Text style={styles.fullWidthButtonText}>Update Scan Interval</Text>
          </TouchableOpacity>
        </View>

        {/* Scan Start Time */}
        <View style={styles.section}>
          <TimeInputField
            label="Scan Start Time"
            hours={startHours}
            minutes={startMins}
            seconds="0"
            onHoursChange={setStartHours}
            onMinutesChange={setStartMins}
            onSecondsChange={() => {}}
            showSeconds={false}
          />
          <TouchableOpacity
            style={styles.fullWidthButton}
            onPress={handleUpdateScanStartTime}
          >
            <Text style={styles.fullWidthButtonText}>Update Start Time</Text>
          </TouchableOpacity>
        </View>

        {/* Scan Control */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scan Control</Text>
          <TouchableOpacity
            style={[
              styles.actionButton,
              systemSetup.scanState ? styles.stopButton : styles.startButton,
              isStartingScan && styles.disabledButton,
            ]}
            onPress={handleStartStopScan}
            disabled={isStartingScan}
          >
            {isStartingScan ? (
              <ActivityIndicator color={Colors.surface} />
            ) : (
              <>
                <Ionicons
                  name={systemSetup.scanState ? 'stop-circle' : 'play-circle'}
                  size={24}
                  color={Colors.surface}
                />
                <Text style={styles.actionButtonText}>
                  {systemSetup.scanState ? 'Stop Scan' : 'Start Scan'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Data Operations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Operations</Text>
          
          {isDownloading && (
            <View style={styles.progressContainer}>
              <ProgressIndicator
                progress={downloadProgress}
                total={systemSetup.noOfRecords}
                label="Downloading Data"
              />
            </View>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.downloadButton, (isDownloading || isErasing) && styles.disabledButton]}
            onPress={handleDownloadData}
            disabled={isDownloading || isErasing}
          >
            {isDownloading ? (
              <ActivityIndicator color={Colors.surface} />
            ) : (
              <>
                <Ionicons name="download" size={24} color={Colors.surface} />
                <Text style={styles.actionButtonText}>Download Data</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.eraseButton, (isDownloading || isErasing) && styles.disabledButton]}
            onPress={handleEraseMemory}
            disabled={isDownloading || isErasing}
          >
            {isErasing ? (
              <ActivityIndicator color={Colors.surface} />
            ) : (
              <>
                <Ionicons name="trash" size={24} color={Colors.surface} />
                <Text style={styles.actionButtonText}>Erase Memory</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.body1,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: Colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.body1,
    color: Colors.text.primary,
  },
  flex1: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  pickerContainer: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  picker: {
    ...Typography.body1,
    color: Colors.text.primary,
  },
  updateButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  updateButtonText: {
    ...Typography.button,
    color: Colors.surface,
    fontSize: 14,
  },
  fullWidthButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  fullWidthButtonText: {
    ...Typography.button,
    color: Colors.surface,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  actionButtonText: {
    ...Typography.button,
    color: Colors.surface,
    marginLeft: Spacing.sm,
  },
  startButton: {
    backgroundColor: Colors.success,
  },
  stopButton: {
    backgroundColor: Colors.error,
  },
  downloadButton: {
    backgroundColor: Colors.primary,
  },
  eraseButton: {
    backgroundColor: Colors.error,
  },
  disabledButton: {
    opacity: 0.5,
  },
  progressContainer: {
    marginBottom: Spacing.md,
  },
});

export default SystemSetupScreen;






