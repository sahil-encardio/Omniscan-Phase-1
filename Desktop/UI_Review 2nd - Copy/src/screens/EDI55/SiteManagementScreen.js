import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius } from '../../styles/DesignSystem';
import DatabaseManager from '../../database/DatabaseManager';
import SiteModel from '../../models/SiteModel';
import SiteCard from '../../components/EDI55/SiteCard';
import { SUCCESS_MESSAGES, VALIDATION_MESSAGES, DEFAULT_SITE_NAME } from '../../constants/EDI55Constants';

const SiteManagementScreen = ({ navigation }) => {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSite, setEditingSite] = useState(null);
  const [formData, setFormData] = useState({ name: '', comments: '' });

  useFocusEffect(
    useCallback(() => {
      initializeAndLoadSites();
    }, [])
  );

  const initializeAndLoadSites = async () => {
    try {
      setLoading(true);
      console.log('Site Management: Starting initialization...');
      
      // Ensure database is initialized
      await DatabaseManager.initialize();
      console.log('Site Management: Database initialized');
      
      // Force create default site
      try {
        await DatabaseManager.addSite(DEFAULT_SITE_NAME, 'Default site for EDI-55 port-based readings');
        console.log('Site Management: Default site created/ensured');
      } catch (siteError) {
        // Site might already exist, that's okay
        console.log('Site Management: Default site already exists or creation failed:', siteError.message);
      }
      
      await loadSites();
      console.log('Site Management: Sites loaded');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      Alert.alert('Error', 'Failed to initialize database');
    } finally {
      setLoading(false);
    }
  };

  const loadSites = async () => {
    try {
      const allSites = await DatabaseManager.getAllSites();
      console.log('Site Management: Loaded sites:', allSites.length, allSites.map(s => s.name));
      const siteModels = allSites.map(s => SiteModel.fromDatabase(s));
      setSites(siteModels);
    } catch (error) {
      console.error('Failed to load sites:', error);
      Alert.alert('Error', 'Failed to load sites');
    }
  };

  const handleAddSite = () => {
    setEditingSite(null);
    setFormData({ name: '', comments: '' });
    setModalVisible(true);
  };

  const handleEditSite = (site) => {
    setEditingSite(site);
    setFormData({ name: site.name, comments: site.comments });
    setModalVisible(true);
  };

  const handleDeleteSite = (site) => {
    if (site.isDefault()) {
      Alert.alert('Cannot Delete', 'The default site cannot be deleted');
      return;
    }

    Alert.alert(
      'Delete Site',
      `Are you sure you want to delete "${site.name}"? This will also delete all sensors associated with this site.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await DatabaseManager.deleteSite(site.id);
              Alert.alert('Success', SUCCESS_MESSAGES.SITE_DELETED);
              loadSites();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete site');
            }
          },
        },
      ]
    );
  };

  const handleSaveSite = async () => {
    try {
      const site = new SiteModel(formData);
      const validation = site.validate();

      if (!validation.isValid) {
        Alert.alert('Validation Error', validation.errors.join('\n'));
        return;
      }

      if (editingSite) {
        // Update existing site
        await DatabaseManager.updateSite(editingSite.id, formData.name, formData.comments);
        Alert.alert('Success', SUCCESS_MESSAGES.SITE_UPDATED);
      } else {
        // Add new site
        await DatabaseManager.addSite(formData.name, formData.comments);
        Alert.alert('Success', SUCCESS_MESSAGES.SITE_ADDED);
      }

      setModalVisible(false);
      loadSites();
    } catch (error) {
      if (error.message.includes('already exists')) {
        Alert.alert('Error', 'A site with this name already exists');
      } else {
        Alert.alert('Error', 'Failed to save site');
      }
    }
  };

  const handleSelectSite = (site) => {
    // Navigate to sensor configuration with selected site
    navigation.navigate('SensorConfiguration', { siteId: site.id, siteName: site.name });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading sites...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Site Management</Text>
        <TouchableOpacity onPress={handleAddSite} style={styles.addButton}>
          <Ionicons name="add-circle" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {sites.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyText}>No sites available</Text>
            <Text style={styles.emptySubtext}>Tap the + button to add a site</Text>
          </View>
        ) : (
          <>
            {sites.map((site) => (
              <SiteCard
                key={site.id}
                site={site}
                onPress={() => handleSelectSite(site)}
                onEdit={handleEditSite}
                onDelete={handleDeleteSite}
              />
            ))}
          </>
        )}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      {/* Add/Edit Site Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingSite ? 'Edit Site' : 'Add New Site'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <Text style={styles.label}>Site Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Enter site name"
                placeholderTextColor="#9CA3AF"
                maxLength={100}
              />

              <Text style={styles.label}>Comments</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.comments}
                onChangeText={(text) => setFormData({ ...formData, comments: text })}
                placeholder="Enter comments (optional)"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                maxLength={500}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleSaveSite}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
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
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    padding: Spacing.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
    marginTop: Spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  form: {
    padding: Spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#111827',
    marginBottom: Spacing.md,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    marginRight: Spacing.sm,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  saveButton: {
    backgroundColor: '#2241DD',
    marginLeft: Spacing.sm,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});

export default SiteManagementScreen;

