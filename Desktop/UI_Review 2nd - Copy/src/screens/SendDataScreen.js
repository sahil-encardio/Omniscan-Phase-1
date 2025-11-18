import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../components/Card';
import ScreenHeader from './components/ScreenHeader';
import { Spacing, Typography, Colors, BorderRadius, Shadows } from '../styles/DesignSystem';

const SendDataScreen = ({ navigation, route }) => {
  const { project } = route.params;
  const [sendMode, setSendMode] = useState('local'); // local, device, pickDevice
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [localDataFiles, setLocalDataFiles] = useState([]);
  const [availableDevices, setAvailableDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);

  // Mock local data files
  const mockLocalFiles = [
    {
      id: '1',
      fileName: 'ESDL-30-001_data_20240115.csv',
      deviceId: 'ESDL-30-001',
      recordCount: 1440,
      dateRange: '2024-01-15 00:00 - 23:59',
      fileSize: '2.3 MB',
      status: 'ready',
    },
    {
      id: '2',
      fileName: 'EWG-01-002_data_20240114.csv',
      deviceId: 'EWG-01-002',
      recordCount: 2880,
      dateRange: '2024-01-14 00:00 - 23:59',
      fileSize: '4.1 MB',
      status: 'ready',
    },
    {
      id: '3',
      fileName: 'EWN-01V-003_data_20240113.csv',
      deviceId: 'EWN-01V-003',
      recordCount: 720,
      dateRange: '2024-01-13 00:00 - 23:59',
      fileSize: '1.2 MB',
      status: 'uploading',
    },
  ];

  // Mock available devices
  const mockDevices = [
    {
      id: '1',
      deviceId: 'ESDL-30-001',
      type: 'ESDL-30 Datalogger',
      status: 'online',
      lastSync: '2024-01-15 14:30',
      dataRecords: 1440,
      connectionType: 'USB/RS-232',
    },
    {
      id: '2',
      deviceId: 'EWG-01-002',
      type: 'EWG-01 Gateway',
      status: 'online',
      lastSync: '2024-01-15 14:25',
      dataRecords: 2880,
      connectionType: 'Cellular',
    },
    {
      id: '3',
      deviceId: 'ESCL-10VT-004',
      type: 'ESCL-10VT Datalogger',
      status: 'offline',
      lastSync: '2024-01-14 09:15',
      dataRecords: 720,
      connectionType: 'USB/RS-232',
    },
  ];

  useEffect(() => {
    loadLocalDataFiles();
    loadAvailableDevices();
  }, []);

  const loadLocalDataFiles = () => {
    setLocalDataFiles(mockLocalFiles);
  };

  const loadAvailableDevices = () => {
    setAvailableDevices(mockDevices);
  };

  const uploadLocalData = async () => {
    if (localDataFiles.length === 0) {
      Alert.alert('No Data', 'No local data files found to upload');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload process
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          Alert.alert('Upload Complete', 'All local data files have been successfully uploaded to the cloud');
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const uploadFromDevice = async (device) => {
    if (!device) {
      Alert.alert('No Device', 'Please select a device first');
      return;
    }

    if (device.status !== 'online') {
      Alert.alert('Device Offline', 'Selected device is currently offline and cannot upload data');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate device upload process
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          Alert.alert('Upload Complete', `Data from ${device.deviceId} has been successfully uploaded to the cloud`);
          return 100;
        }
        return prev + 15;
      });
    }, 300);
  };

  const selectDevice = (device) => {
    setSelectedDevice(device);
    setSendMode('device');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return '#10B981';
      case 'offline': return '#EF4444';
      case 'uploading': return '#F59E0B';
      case 'ready': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online': return 'checkmark-circle';
      case 'offline': return 'close-circle';
      case 'uploading': return 'cloud-upload';
      case 'ready': return 'checkmark-circle';
      default: return 'help-circle';
    }
  };

  const renderLocalDataFiles = () => (
    <Card style={styles.card}>
      <Text style={styles.cardTitle}>Local Data Files</Text>
      <Text style={styles.cardSubtitle}>Upload manually downloaded data files to the cloud</Text>
      
      {localDataFiles.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="document" size={48} color="#9CA3AF" />
          <Text style={styles.emptyStateText}>No local data files found</Text>
          <Text style={styles.emptyStateSubtext}>
            Download data from devices first to upload locally stored files
          </Text>
        </View>
      ) : (
        <FlatList
          data={localDataFiles}
          renderItem={({ item }) => (
            <View style={styles.fileItem}>
              <View style={styles.fileHeader}>
                <View style={styles.fileIcon}>
                  <Ionicons name="document-text" size={20} color="#2241DD" />
                </View>
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName}>{item.fileName}</Text>
                  <Text style={styles.fileDetails}>
                    {item.recordCount} records • {item.fileSize}
                  </Text>
                </View>
                <View style={styles.fileStatus}>
                  <Ionicons 
                    name={getStatusIcon(item.status)} 
                    size={16} 
                    color={getStatusColor(item.status)} 
                  />
                </View>
              </View>
              <Text style={styles.fileDateRange}>{item.dateRange}</Text>
            </View>
          )}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
        />
      )}
      
      <TouchableOpacity
        style={[styles.uploadButton, isUploading && styles.buttonDisabled]}
        onPress={uploadLocalData}
        disabled={isUploading || localDataFiles.length === 0}
      >
        {isUploading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Ionicons name="cloud-upload" size={20} color="#FFFFFF" />
        )}
        <Text style={styles.uploadButtonText}>
          {isUploading ? 'Uploading...' : 'Upload All Files'}
        </Text>
      </TouchableOpacity>
    </Card>
  );

  const renderDeviceSelection = () => (
    <Card style={styles.card}>
      <Text style={styles.cardTitle}>Select Device</Text>
      <Text style={styles.cardSubtitle}>Choose a device to upload data from</Text>
      
      <FlatList
        data={availableDevices}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.deviceItem}
            onPress={() => selectDevice(item)}
          >
            <View style={styles.deviceHeader}>
              <View style={styles.deviceIcon}>
                <Ionicons name="hardware-chip" size={20} color="#2241DD" />
              </View>
              <View style={styles.deviceInfo}>
                <Text style={styles.deviceId}>{item.deviceId}</Text>
                <Text style={styles.deviceType}>{item.type}</Text>
              </View>
              <View style={styles.deviceStatus}>
                <Ionicons 
                  name={getStatusIcon(item.status)} 
                  size={16} 
                  color={getStatusColor(item.status)} 
                />
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                  {item.status.toUpperCase()}
                </Text>
              </View>
            </View>
            
            <View style={styles.deviceDetails}>
              <Text style={styles.detailText}>
                {item.dataRecords} records • Last sync: {item.lastSync}
              </Text>
              <Text style={styles.detailText}>
                Connection: {item.connectionType}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
      />
    </Card>
  );

  const renderSelectedDevice = () => (
    <Card style={styles.card}>
      <View style={styles.selectedDeviceHeader}>
        <View style={styles.selectedDeviceInfo}>
          <Text style={styles.selectedDeviceTitle}>Selected Device</Text>
          <Text style={styles.selectedDeviceId}>{selectedDevice?.deviceId}</Text>
          <Text style={styles.selectedDeviceType}>{selectedDevice?.type}</Text>
        </View>
        <TouchableOpacity onPress={() => setSelectedDevice(null)}>
          <Ionicons name="close-circle" size={24} color="#EF4444" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.deviceStats}>
        <View style={styles.statItem}>
          <Ionicons name="document-text" size={16} color="#6B7280" />
          <Text style={styles.statText}>{selectedDevice?.dataRecords} records</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="time" size={16} color="#6B7280" />
          <Text style={styles.statText}>Last sync: {selectedDevice?.lastSync}</Text>
        </View>
      </View>
      
      <TouchableOpacity
        style={[styles.uploadButton, isUploading && styles.buttonDisabled]}
        onPress={() => uploadFromDevice(selectedDevice)}
        disabled={isUploading || selectedDevice?.status !== 'online'}
      >
        {isUploading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Ionicons name="cloud-upload" size={20} color="#FFFFFF" />
        )}
        <Text style={styles.uploadButtonText}>
          {isUploading ? 'Uploading...' : 'Upload from Device'}
        </Text>
      </TouchableOpacity>
    </Card>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Send Data"
        subtitle={`Project: ${project.name}`}
        onBack={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Upload Mode Selection */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Upload Mode</Text>
          <Text style={styles.cardSubtitle}>Choose how you want to send data to the cloud</Text>
          
          <View style={styles.modeButtons}>
            <TouchableOpacity
              style={[styles.modeButton, sendMode === 'local' && styles.modeButtonActive]}
              onPress={() => setSendMode('local')}
            >
              <Ionicons 
                name="document" 
                size={20} 
                color={sendMode === 'local' ? '#FFFFFF' : '#2241DD'} 
              />
              <Text style={[
                styles.modeButtonText,
                sendMode === 'local' && styles.modeButtonTextActive
              ]}>
                Local Data
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modeButton, sendMode === 'pickDevice' && styles.modeButtonActive]}
              onPress={() => setSendMode('pickDevice')}
            >
              <Ionicons 
                name="hardware-chip" 
                size={20} 
                color={sendMode === 'pickDevice' ? '#FFFFFF' : '#2241DD'} 
              />
              <Text style={[
                styles.modeButtonText,
                sendMode === 'pickDevice' && styles.modeButtonTextActive
              ]}>
                Pick Device
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Upload Progress */}
        {isUploading && (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Upload Progress</Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
              </View>
              <Text style={styles.progressText}>{uploadProgress}%</Text>
            </View>
          </Card>
        )}

        {/* Content based on mode */}
        {sendMode === 'local' && renderLocalDataFiles()}
        {sendMode === 'pickDevice' && !selectedDevice && renderDeviceSelection()}
        {sendMode === 'pickDevice' && selectedDevice && renderSelectedDevice()}

        {/* Instructions */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Data Upload Instructions</Text>
          <View style={styles.instructionsList}>
            <Text style={styles.instructionItem}>
              • <Text style={styles.instructionBold}>Local Data:</Text> Upload manually downloaded files stored on your device
            </Text>
            <Text style={styles.instructionItem}>
              • <Text style={styles.instructionBold}>Pick Device:</Text> Connect directly to a datalogger or gateway to upload stored data
            </Text>
            <Text style={styles.instructionItem}>
              • Data is uploaded to the cloud server and linked to the correct project
            </Text>
            <Text style={styles.instructionItem}>
              • Ensure stable internet connection for successful uploads
            </Text>
          </View>
        </Card>
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
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  card: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#374151',
    lineHeight: 22,
    marginBottom: 16,
  },
  modeButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  modeButtonActive: {
    backgroundColor: '#2241DD',
    borderColor: '#2241DD',
  },
  modeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#2241DD',
    marginLeft: 6,
  },
  modeButtonTextActive: {
    color: '#FFFFFF',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2241DD',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#2241DD',
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.lg,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: '#374151',
    marginTop: 8,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  fileItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  fileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  fileIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 4,
  },
  fileDetails: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  fileStatus: {
    alignItems: 'center',
  },
  fileDateRange: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  deviceItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  deviceIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceId: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 4,
  },
  deviceType: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  deviceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginLeft: 6,
  },
  deviceDetails: {
    gap: Spacing.xs,
  },
  detailText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  selectedDeviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  selectedDeviceInfo: {
    flex: 1,
  },
  selectedDeviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
    marginBottom: 4,
  },
  selectedDeviceId: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 4,
  },
  selectedDeviceType: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  deviceStats: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginLeft: 6,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2241DD',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  instructionsList: {
    paddingLeft: Spacing.sm,
  },
  instructionItem: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 8,
    lineHeight: 22,
  },
  instructionBold: {
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
});

export default SendDataScreen;
