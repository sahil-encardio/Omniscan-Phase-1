import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions,
  SafeAreaView,
  RefreshControl,
  ProgressBarAndroid,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../styles/DesignSystem';
import ScreenHeader from './components/ScreenHeader';
import Card from '../components/Card';

const { width, height } = Dimensions.get('window');

const ProjectSyncScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, completed, error
  const [syncProgress, setSyncProgress] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState('2 hours ago');

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 2000);
  };

  const startSync = () => {
    setSyncStatus('syncing');
    setSyncProgress(0);
    
    // Simulate sync progress
    const interval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setSyncStatus('completed');
          setLastSyncTime('Just now');
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const syncData = {
    totalRecords: 15420,
    syncedRecords: 12350,
    pendingRecords: 3070,
    lastSync: "15/01/2024 14:30",
    nextSync: "15/01/2024 15:00",
    dataSize: "2.4 GB",
    syncFrequency: "Every 30 minutes"
  };

  const syncHistory = [
    {
      id: 1,
      time: "15/01/2024 14:30",
      status: "Success",
      records: 15420,
      duration: "2m 15s"
    },
    {
      id: 2,
      time: "15/01/2024 14:00",
      status: "Success",
      records: 15200,
      duration: "1m 45s"
    },
    {
      id: 3,
      time: "15/01/2024 13:30",
      status: "Failed",
      records: 0,
      duration: "0s",
      error: "Network timeout"
    },
    {
      id: 4,
      time: "15/01/2024 13:00",
      status: "Success",
      records: 14800,
      duration: "2m 30s"
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Success': return '#10B981';
      case 'Failed': return '#EF4444';
      case 'syncing': return '#2241DD';
      case 'completed': return '#10B981';
      case 'error': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Success': return 'checkmark-circle';
      case 'Failed': return 'close-circle';
      case 'syncing': return 'sync';
      case 'completed': return 'checkmark-circle';
      case 'error': return 'close-circle';
      default: return 'time';
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader 
        title="Project Sync"
        subtitle="Data Synchronization"
        navigation={navigation}
        showBackButton={true}
        showLogo={true}
        rightAction={
          <TouchableOpacity style={styles.syncButton} onPress={startSync}>
            <Ionicons name="sync" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Sync Status Card */}
        <Card style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle}>Sync Status</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(syncStatus) }]}>
              <Ionicons 
                name={getStatusIcon(syncStatus)} 
                size={16} 
                color="#FFFFFF" 
              />
              <Text style={styles.statusText}>
                {syncStatus === 'syncing' ? 'Syncing...' : 
                 syncStatus === 'completed' ? 'Completed' : 
                 syncStatus === 'error' ? 'Error' : 'Ready'}
              </Text>
            </View>
          </View>

          {syncStatus === 'syncing' && (
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Syncing data...</Text>
                <Text style={styles.progressPercent}>{syncProgress}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${syncProgress}%` }
                  ]} 
                />
              </View>
            </View>
          )}

          <View style={styles.statusInfo}>
            <View style={styles.statusItem}>
              <Text style={styles.statusItemLabel}>Last Sync:</Text>
              <Text style={styles.statusItemValue}>{lastSyncTime}</Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusItemLabel}>Next Sync:</Text>
              <Text style={styles.statusItemValue}>{syncData.nextSync}</Text>
            </View>
          </View>
        </Card>

        {/* Sync Data Card */}
        <Card style={styles.dataCard}>
          <Text style={styles.cardTitle}>Sync Data</Text>
          <View style={styles.dataMetrics}>
            <View style={styles.metricItem}>
              <Text style={styles.metricNumber}>{syncData.totalRecords.toLocaleString()}</Text>
              <Text style={styles.metricLabel}>Total Records</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={[styles.metricNumber, { color: '#10B981' }]}>
                {syncData.syncedRecords.toLocaleString()}
              </Text>
              <Text style={styles.metricLabel}>Synced</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={[styles.metricNumber, { color: '#F59E0B' }]}>
                {syncData.pendingRecords.toLocaleString()}
              </Text>
              <Text style={styles.metricLabel}>Pending</Text>
            </View>
          </View>
          
          <View style={styles.dataDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Data Size:</Text>
              <Text style={styles.detailValue}>{syncData.dataSize}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Sync Frequency:</Text>
              <Text style={styles.detailValue}>{syncData.syncFrequency}</Text>
            </View>
          </View>
        </Card>

        {/* Sync History Card */}
        <Card style={styles.historyCard}>
          <View style={styles.historyHeader}>
            <Text style={styles.cardTitle}>Sync History</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.historyList}>
            {syncHistory.map((item) => (
              <View key={item.id} style={styles.historyItem}>
                <View style={styles.historyIconContainer}>
                  <Ionicons 
                    name={getStatusIcon(item.status)} 
                    size={20} 
                    color={getStatusColor(item.status)} 
                  />
                </View>
                <View style={styles.historyContent}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyTime}>{item.time}</Text>
                    <View style={[styles.historyStatus, { backgroundColor: getStatusColor(item.status) }]}>
                      <Text style={styles.historyStatusText}>{item.status}</Text>
                    </View>
                  </View>
                  <View style={styles.historyDetails}>
                    <Text style={styles.historyRecords}>
                      {item.records.toLocaleString()} records
                    </Text>
                    <Text style={styles.historyDuration}>
                      Duration: {item.duration}
                    </Text>
                    {item.error && (
                      <Text style={styles.historyError}>
                        Error: {item.error}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        </Card>

        {/* Sync Actions Card */}
        <Card style={styles.actionsCard}>
          <Text style={styles.cardTitle}>Sync Actions</Text>
          <View style={styles.actionsList}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={startSync}
              disabled={syncStatus === 'syncing'}
            >
              <Ionicons name="sync" size={20} color="#2241DD" />
              <Text style={styles.actionButtonText}>Start Sync</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="pause" size={20} color="#F59E0B" />
              <Text style={styles.actionButtonText}>Pause Sync</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="settings" size={20} color="#6B7280" />
              <Text style={styles.actionButtonText}>Sync Settings</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Checking for new update...</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  syncButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  statusCard: {
    marginTop: 16,
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter-Bold',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    fontFamily: 'Inter-Medium',
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2241DD',
    fontFamily: 'Inter-SemiBold',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2241DD',
    borderRadius: 4,
  },
  statusInfo: {
    gap: 8,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusItemLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: 'Inter-Medium',
  },
  statusItemValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
  },
  dataCard: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter-Bold',
    marginBottom: 16,
  },
  dataMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2241DD',
    fontFamily: 'Inter-Bold',
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: 'Inter-Medium',
    marginTop: 4,
  },
  dataDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: 'Inter-Medium',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
  },
  historyCard: {
    marginBottom: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2241DD',
    fontFamily: 'Inter-Medium',
  },
  historyList: {
    gap: 16,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  historyIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  historyTime: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    fontFamily: 'Inter-Medium',
  },
  historyStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  historyStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
  historyDetails: {
    gap: 2,
  },
  historyRecords: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: 'Inter-Medium',
  },
  historyDuration: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  historyError: {
    fontSize: 14,
    fontWeight: '400',
    color: '#EF4444',
    fontFamily: 'Inter-Regular',
  },
  actionsCard: {
    marginBottom: 16,
  },
  actionsList: {
    gap: 0,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2241DD',
    fontFamily: 'Inter-Medium',
    marginLeft: 12,
  },
  footer: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
});

export default ProjectSyncScreen;


