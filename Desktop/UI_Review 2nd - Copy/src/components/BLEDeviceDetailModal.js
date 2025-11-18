import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBLE } from '../context/BLEContext';
import { Colors, Spacing, BorderRadius } from '../styles/DesignSystem';

const BLEDeviceDetailModal = ({ visible, onClose }) => {
  const {
    connectedDevice,
    services,
    disconnectFromDevice,
    readCharacteristic,
    writeCharacteristic,
    subscribeToCharacteristic,
    rssi,
    bufferToHex,
    hexToBuffer,
    bufferToString,
    stringToBuffer,
  } = useBLE();

  const [expandedServices, setExpandedServices] = useState({});
  const [characteristicValues, setCharacteristicValues] = useState({});
  const [characteristicFormats, setCharacteristicFormats] = useState({});
  const [subscriptions, setSubscriptions] = useState({});
  const [writeValues, setWriteValues] = useState({});
  const [loading, setLoading] = useState({});

  const getSignalStrength = (rssi) => {
    if (!rssi) return { color: '#9CA3AF', label: 'Unknown' };
    
    if (rssi > -60) {
      return { color: '#10B981', label: 'Excellent' };
    } else if (rssi > -70) {
      return { color: '#8DC63F', label: 'Good' };
    } else if (rssi > -80) {
      return { color: '#F59E0B', label: 'Fair' };
    } else {
      return { color: '#EF4444', label: 'Poor' };
    }
  };

  const toggleService = (serviceUUID) => {
    setExpandedServices((prev) => ({
      ...prev,
      [serviceUUID]: !prev[serviceUUID],
    }));
  };

  const toggleFormat = (charKey) => {
    setCharacteristicFormats((prev) => ({
      ...prev,
      [charKey]: prev[charKey] === 'hex' ? 'text' : 'hex',
    }));
  };

  const getCharKey = (serviceUUID, charUUID) => `${serviceUUID}-${charUUID}`;

  const formatValue = (buffer, format) => {
    if (!buffer) return 'No data';
    
    try {
      if (format === 'hex') {
        return bufferToHex(buffer);
      } else {
        const text = bufferToString(buffer);
        return text || bufferToHex(buffer);
      }
    } catch (error) {
      return 'Error formatting';
    }
  };

  const handleRead = async (serviceUUID, charUUID) => {
    const charKey = getCharKey(serviceUUID, charUUID);
    
    try {
      setLoading((prev) => ({ ...prev, [charKey]: true }));
      
      const value = await readCharacteristic(serviceUUID, charUUID);
      
      setCharacteristicValues((prev) => ({
        ...prev,
        [charKey]: value,
      }));

      // Set default format if not set
      if (!characteristicFormats[charKey]) {
        setCharacteristicFormats((prev) => ({
          ...prev,
          [charKey]: 'hex',
        }));
      }
    } catch (error) {
      Alert.alert('Read Error', error.message);
    } finally {
      setLoading((prev) => ({ ...prev, [charKey]: false }));
    }
  };

  const handleWrite = async (serviceUUID, charUUID) => {
    const charKey = getCharKey(serviceUUID, charUUID);
    const inputValue = writeValues[charKey];
    
    if (!inputValue) {
      Alert.alert('Write Error', 'Please enter a value to write');
      return;
    }

    try {
      setLoading((prev) => ({ ...prev, [charKey]: true }));
      
      const format = characteristicFormats[charKey] || 'hex';
      let buffer;
      
      if (format === 'hex') {
        buffer = hexToBuffer(inputValue);
      } else {
        buffer = stringToBuffer(inputValue);
      }

      await writeCharacteristic(serviceUUID, charUUID, buffer);
      
      Alert.alert('Success', 'Value written successfully');
      
      // Clear input
      setWriteValues((prev) => ({ ...prev, [charKey]: '' }));
    } catch (error) {
      Alert.alert('Write Error', error.message);
    } finally {
      setLoading((prev) => ({ ...prev, [charKey]: false }));
    }
  };

  const handleSubscribe = async (serviceUUID, charUUID) => {
    const charKey = getCharKey(serviceUUID, charUUID);
    
    try {
      setLoading((prev) => ({ ...prev, [charKey]: true }));
      
      const subscription = await subscribeToCharacteristic(
        serviceUUID,
        charUUID,
        (error, value) => {
          if (error) {
            console.error('Notification error:', error);
            return;
          }

          setCharacteristicValues((prev) => ({
            ...prev,
            [charKey]: value,
          }));
        }
      );

      setSubscriptions((prev) => ({
        ...prev,
        [charKey]: subscription,
      }));

      // Set default format if not set
      if (!characteristicFormats[charKey]) {
        setCharacteristicFormats((prev) => ({
          ...prev,
          [charKey]: 'hex',
        }));
      }
    } catch (error) {
      Alert.alert('Subscribe Error', error.message);
    } finally {
      setLoading((prev) => ({ ...prev, [charKey]: false }));
    }
  };

  const handleUnsubscribe = (serviceUUID, charUUID) => {
    const charKey = getCharKey(serviceUUID, charUUID);
    const subscription = subscriptions[charKey];
    
    if (subscription) {
      subscription.remove();
      setSubscriptions((prev) => {
        const updated = { ...prev };
        delete updated[charKey];
        return updated;
      });
    }
  };

  const handleDisconnect = async () => {
    // Cleanup subscriptions
    Object.values(subscriptions).forEach((sub) => sub.remove());
    setSubscriptions({});
    
    await disconnectFromDevice();
    onClose();
  };

  const renderCharacteristic = (serviceUUID, char) => {
    const charKey = getCharKey(serviceUUID, char.uuid);
    const value = characteristicValues[charKey];
    const format = characteristicFormats[charKey] || 'hex';
    const isSubscribed = !!subscriptions[charKey];
    const isLoading = loading[charKey];

    return (
      <View key={char.uuid} style={styles.characteristicItem}>
        {/* Characteristic Header */}
        <View style={styles.charHeader}>
          <Text style={styles.charUUID} numberOfLines={1}>
            {char.uuid}
          </Text>
          <View style={styles.charProperties}>
            {char.isReadable && (
              <View style={styles.propertyBadge}>
                <Text style={styles.propertyText}>R</Text>
              </View>
            )}
            {(char.isWritableWithResponse || char.isWritableWithoutResponse) && (
              <View style={styles.propertyBadge}>
                <Text style={styles.propertyText}>W</Text>
              </View>
            )}
            {(char.isNotifiable || char.isIndicatable) && (
              <View style={styles.propertyBadge}>
                <Text style={styles.propertyText}>N</Text>
              </View>
            )}
          </View>
        </View>

        {/* Value Display */}
        {value !== undefined && (
          <View style={styles.valueContainer}>
            <View style={styles.valueHeader}>
              <Text style={styles.valueLabel}>Value:</Text>
              <View style={styles.formatToggle}>
                <Text style={styles.formatLabel}>Format:</Text>
                <TouchableOpacity
                  style={[styles.formatButton, format === 'hex' && styles.formatButtonActive]}
                  onPress={() => toggleFormat(charKey)}
                >
                  <Text style={[styles.formatButtonText, format === 'hex' && styles.formatButtonTextActive]}>
                    Hex
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.formatButton, format === 'text' && styles.formatButtonActive]}
                  onPress={() => toggleFormat(charKey)}
                >
                  <Text style={[styles.formatButtonText, format === 'text' && styles.formatButtonTextActive]}>
                    Text
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.valueBox}>
              <Text style={styles.valueText} selectable>
                {formatValue(value, format)}
              </Text>
            </View>
          </View>
        )}

        {/* Write Input */}
        {(char.isWritableWithResponse || char.isWritableWithoutResponse) && (
          <View style={styles.writeContainer}>
            <TextInput
              style={styles.writeInput}
              placeholder={`Enter value (${format})`}
              value={writeValues[charKey] || ''}
              onChangeText={(text) =>
                setWriteValues((prev) => ({ ...prev, [charKey]: text }))
              }
              placeholderTextColor="#9CA3AF"
            />
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.charActions}>
          {char.isReadable && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleRead(serviceUUID, char.uuid)}
              disabled={isLoading}
            >
              {isLoading && !isSubscribed ? (
                <ActivityIndicator size="small" color="#2241DD" />
              ) : (
                <>
                  <Ionicons name="eye-outline" size={16} color="#2241DD" />
                  <Text style={styles.actionButtonText}>Read</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {(char.isWritableWithResponse || char.isWritableWithoutResponse) && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleWrite(serviceUUID, char.uuid)}
              disabled={isLoading}
            >
              {isLoading && !isSubscribed ? (
                <ActivityIndicator size="small" color="#2241DD" />
              ) : (
                <>
                  <Ionicons name="create-outline" size={16} color="#2241DD" />
                  <Text style={styles.actionButtonText}>Write</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {(char.isNotifiable || char.isIndicatable) && (
            <TouchableOpacity
              style={[styles.actionButton, isSubscribed && styles.actionButtonActive]}
              onPress={() =>
                isSubscribed
                  ? handleUnsubscribe(serviceUUID, char.uuid)
                  : handleSubscribe(serviceUUID, char.uuid)
              }
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={isSubscribed ? '#FFFFFF' : '#2241DD'} />
              ) : (
                <>
                  <Ionicons
                    name={isSubscribed ? 'notifications' : 'notifications-outline'}
                    size={16}
                    color={isSubscribed ? '#FFFFFF' : '#2241DD'}
                  />
                  <Text
                    style={[
                      styles.actionButtonText,
                      isSubscribed && styles.actionButtonTextActive,
                    ]}
                  >
                    {isSubscribed ? 'Subscribed' : 'Subscribe'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderService = (service) => {
    const isExpanded = expandedServices[service.uuid];

    return (
      <View key={service.uuid} style={styles.serviceItem}>
        <TouchableOpacity
          style={styles.serviceHeader}
          onPress={() => toggleService(service.uuid)}
        >
          <View style={styles.serviceHeaderLeft}>
            <Ionicons
              name={isExpanded ? 'chevron-down' : 'chevron-forward'}
              size={20}
              color="#6B7280"
            />
            <View style={styles.serviceIconContainer}>
              <Ionicons name="server-outline" size={20} color="#2241DD" />
            </View>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceUUID} numberOfLines={1}>
                {service.uuid}
              </Text>
              <Text style={styles.serviceCount}>
                {service.characteristics.length} characteristic
                {service.characteristics.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.characteristicsList}>
            {service.characteristics.map((char) =>
              renderCharacteristic(service.uuid, char)
            )}
          </View>
        )}
      </View>
    );
  };

  if (!connectedDevice) {
    return null;
  }

  const signalInfo = getSignalStrength(rssi);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="hardware-chip" size={24} color="#2241DD" />
            <View>
              <Text style={styles.headerTitle}>{connectedDevice.name}</Text>
              <Text style={styles.headerSubtitle}>{connectedDevice.id}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Connection Status */}
        <View style={styles.statusBar}>
          <View style={styles.statusItem}>
            <Ionicons name="bluetooth" size={20} color="#10B981" />
            <Text style={styles.statusLabel}>Connected</Text>
          </View>
          {rssi !== null && (
            <View style={styles.statusItem}>
              <Ionicons name="cellular" size={20} color={signalInfo.color} />
              <Text style={[styles.statusLabel, { color: signalInfo.color }]}>
                {rssi} dBm ({signalInfo.label})
              </Text>
            </View>
          )}
        </View>

        {/* Services List */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {services.length === 0 ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color="#2241DD" />
              <Text style={styles.emptyStateText}>Loading services...</Text>
            </View>
          ) : (
            services.map(renderService)
          )}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.disconnectButton}
            onPress={handleDisconnect}
          >
            <Ionicons name="close-circle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.disconnectButtonText}>Disconnect</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter-Bold',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    fontFamily: 'Inter-SemiBold',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  serviceItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  serviceHeader: {
    padding: 16,
  },
  serviceHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  serviceIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceUUID: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  serviceCount: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  characteristicsList: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  characteristicItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  charHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  charUUID: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    fontFamily: 'Inter-Medium',
    flex: 1,
    marginRight: 8,
  },
  charProperties: {
    flexDirection: 'row',
    gap: 4,
  },
  propertyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: '#2241DD',
  },
  propertyText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
  valueContainer: {
    marginBottom: 12,
  },
  valueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  valueLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: 'Inter-SemiBold',
  },
  formatToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  formatLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
    fontFamily: 'Inter-Medium',
  },
  formatButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  formatButtonActive: {
    backgroundColor: '#2241DD',
    borderColor: '#2241DD',
  },
  formatButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: 'Inter-SemiBold',
  },
  formatButtonTextActive: {
    color: '#FFFFFF',
  },
  valueBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  valueText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#111827',
    fontFamily: 'Inter-Regular',
  },
  writeContainer: {
    marginBottom: 12,
  },
  writeInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    fontSize: 13,
    fontWeight: '400',
    color: '#111827',
    fontFamily: 'Inter-Regular',
  },
  charActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2241DD',
  },
  actionButtonActive: {
    backgroundColor: '#2241DD',
    borderColor: '#2241DD',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2241DD',
    fontFamily: 'Inter-SemiBold',
  },
  actionButtonTextActive: {
    color: '#FFFFFF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: 'Inter-Medium',
    marginTop: 16,
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  disconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#EF4444',
  },
  disconnectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
});

export default BLEDeviceDetailModal;


