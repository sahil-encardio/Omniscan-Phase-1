import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BLEPermissionModal = ({ visible, onClose, onRequestPermissions }) => {
  const handleOpenSettings = () => {
    Linking.openSettings();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          <View style={styles.modal}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <Ionicons name="bluetooth" size={48} color="#2241DD" />
            </View>

            {/* Title */}
            <Text style={styles.title}>Bluetooth Permissions Required</Text>

            {/* Description */}
            <Text style={styles.description}>
              This app needs Bluetooth and Location permissions to scan and connect to nearby
              BLE devices like sensors and data loggers.
            </Text>

            {/* Permission List */}
            <View style={styles.permissionList}>
              <View style={styles.permissionItem}>
                <View style={styles.permissionIconContainer}>
                  <Ionicons name="bluetooth" size={20} color="#2241DD" />
                </View>
                <View style={styles.permissionInfo}>
                  <Text style={styles.permissionTitle}>Bluetooth Access</Text>
                  <Text style={styles.permissionDescription}>
                    Required to scan and connect to BLE devices
                  </Text>
                </View>
              </View>

              <View style={styles.permissionItem}>
                <View style={styles.permissionIconContainer}>
                  <Ionicons name="location" size={20} color="#2241DD" />
                </View>
                <View style={styles.permissionInfo}>
                  <Text style={styles.permissionTitle}>Location Access</Text>
                  <Text style={styles.permissionDescription}>
                    {Platform.OS === 'android'
                      ? 'Required by Android to scan for nearby BLE devices'
                      : 'Used to detect nearby BLE devices'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Info Note */}
            <View style={styles.infoNote}>
              <Ionicons name="information-circle" size={16} color="#6B7280" />
              <Text style={styles.infoText}>
                Your location data is never collected or stored. This permission is only used
                for Bluetooth device scanning.
              </Text>
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={onRequestPermissions}
              >
                <Text style={styles.primaryButtonText}>Grant Permissions</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleOpenSettings}
              >
                <Ionicons name="settings-outline" size={18} color="#2241DD" />
                <Text style={styles.secondaryButtonText}>Open Settings</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.textButton} onPress={onClose}>
                <Text style={styles.textButtonText}>Maybe Later</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '100%',
    paddingHorizontal: 20,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    fontWeight: '400',
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  permissionList: {
    marginBottom: 20,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  permissionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  permissionInfo: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  permissionDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
    lineHeight: 18,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '400',
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
    lineHeight: 16,
  },
  buttonContainer: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#2241DD',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#2241DD',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: '#2241DD',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2241DD',
    fontFamily: 'Inter-SemiBold',
  },
  textButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  textButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
    fontFamily: 'Inter-Medium',
  },
});

export default BLEPermissionModal;


