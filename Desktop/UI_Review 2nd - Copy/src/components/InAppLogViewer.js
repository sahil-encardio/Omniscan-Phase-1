import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const InAppLogViewer = () => {
  const [logs, setLogs] = useState([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Override console.log to capture logs
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    console.log = (...args) => {
      originalLog(...args);
      addLog('LOG', args);
    };

    console.warn = (...args) => {
      originalWarn(...args);
      addLog('WARN', args);
    };

    console.error = (...args) => {
      originalError(...args);
      addLog('ERROR', args);
    };

    const addLog = (level, args) => {
      setLogs(prev => {
        const newLog = {
          time: new Date().toLocaleTimeString(),
          level,
          message: args.map(a => {
            if (typeof a === 'object') {
              try {
                return JSON.stringify(a, null, 2);
              } catch (e) {
                return String(a);
              }
            }
            return String(a);
          }).join(' ')
        };
        // Keep only last 500 logs to prevent memory issues
        return [...prev.slice(-499), newLog];
      });
    };
    
    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);

  if (!visible) {
    return (
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <Ionicons name="document-text" size={20} color="#FFFFFF" />
        <Text style={styles.toggleText}>Logs</Text>
      </TouchableOpacity>
    );
  }

  const getLevelColor = (level) => {
    switch (level) {
      case 'ERROR':
        return '#FF4444';
      case 'WARN':
        return '#FFAA00';
      case 'LOG':
      default:
        return '#00FF00';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Console Logs ({logs.length})</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            onPress={() => setLogs([])} 
            style={styles.clearButton}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setVisible(false)} 
            style={styles.closeButton}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView 
        style={styles.logContainer}
        contentContainerStyle={styles.logContent}
      >
        {logs.length === 0 ? (
          <Text style={styles.emptyText}>No logs yet...</Text>
        ) : (
          logs.map((log, index) => (
            <View key={index} style={styles.logItem}>
              <View style={styles.logHeader}>
                <Text style={[styles.logLevel, { color: getLevelColor(log.level) }]}>
                  [{log.level}]
                </Text>
                <Text style={styles.logTime}>{log.time}</Text>
              </View>
              <Text style={styles.logText}>{log.message}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  toggleButton: {
    position: 'absolute',
    top: 60,
    right: 10,
    backgroundColor: '#5B6EF5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 9998,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toggleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  container: {
    position: 'absolute',
    top: 100,
    left: 10,
    right: 10,
    bottom: 100,
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 12,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FF4444',
    borderRadius: 6,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  closeButton: {
    padding: 4,
  },
  logContainer: {
    flex: 1,
  },
  logContent: {
    paddingBottom: 8,
  },
  logItem: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  logLevel: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  logTime: {
    color: '#888888',
    fontSize: 10,
    fontFamily: 'Inter-Regular',
  },
  logText: {
    color: '#00FF00',
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  emptyText: {
    color: '#666666',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
    fontFamily: 'Inter-Regular',
  },
});

export default InAppLogViewer;




