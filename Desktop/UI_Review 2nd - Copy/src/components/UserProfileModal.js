import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Dimensions,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Typography, Spacing, BorderRadius } from '../styles/DesignSystem';

const { width, height } = Dimensions.get('window');

const UserProfileModal = ({ visible, onClose, userData, onUpdateUser }) => {
  console.log('UserProfileModal rendered with userData:', userData);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(userData);

  // Update editedUser when userData changes
  React.useEffect(() => {
    console.log('UserData changed, updating editedUser:', userData);
    setEditedUser(userData);
  }, [userData]);

  const handleImagePicker = async () => {
    console.log('Image picker triggered');
    
    try {
      // Request permissions for both camera and media library
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      console.log('Camera permission:', cameraPermission);
      console.log('Media permission:', mediaPermission);
      
      if (cameraPermission.granted === false && mediaPermission.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera and photo library is required!');
        return;
      }

      // Show action sheet to choose between camera and gallery
      Alert.alert(
        'Select Photo',
        'Choose an option',
        [
          { text: 'Photo Library', onPress: () => openGallery() },
          { text: 'Camera', onPress: () => openCamera() },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } catch (error) {
      console.error('Error in handleImagePicker:', error);
      Alert.alert('Error', 'Failed to open image picker: ' + error.message);
    }
  };

  const openCamera = async () => {
    try {
      console.log('Opening camera...');
      
      // Try different mediaTypes approaches
      let mediaTypes = 'images';
      if (ImagePicker.MediaType && ImagePicker.MediaType.Images) {
        mediaTypes = ImagePicker.MediaType.Images;
      } else if (ImagePicker.MediaTypeOptions && ImagePicker.MediaTypeOptions.Images) {
        mediaTypes = ImagePicker.MediaTypeOptions.Images;
      }
      
      console.log('Using mediaTypes:', mediaTypes);
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: mediaTypes,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      console.log('Camera result:', result);
      handleImageResult(result);
    } catch (error) {
      console.error('Error opening camera:', error);
      Alert.alert('Error', 'Failed to open camera: ' + error.message);
    }
  };

  const openGallery = async () => {
    try {
      console.log('Opening gallery...');
      
      // Try different mediaTypes approaches
      let mediaTypes = 'images';
      if (ImagePicker.MediaType && ImagePicker.MediaType.Images) {
        mediaTypes = ImagePicker.MediaType.Images;
      } else if (ImagePicker.MediaTypeOptions && ImagePicker.MediaTypeOptions.Images) {
        mediaTypes = ImagePicker.MediaTypeOptions.Images;
      }
      
      console.log('Using mediaTypes:', mediaTypes);
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: mediaTypes,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      console.log('Gallery result:', result);
      handleImageResult(result);
    } catch (error) {
      console.error('Error opening gallery:', error);
      Alert.alert('Error', 'Failed to open photo library: ' + error.message);
    }
  };

  const handleImageResult = (result) => {
    console.log('Image picker result:', result);

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setEditedUser({
        ...editedUser,
        photo: result.assets[0].uri,
      });
      console.log('Photo updated:', result.assets[0].uri);
      
      // Automatically save the photo
      onUpdateUser({
        ...editedUser,
        photo: result.assets[0].uri,
      });
      Alert.alert('Success', 'Profile photo updated successfully!');
    }
  };

  const handleSave = () => {
    console.log('Saving user profile with photo:', editedUser.photo);
    onUpdateUser(editedUser);
    setIsEditing(false);
    Alert.alert('Success', 'Profile updated successfully!');
  };

  const handleCancel = () => {
    setEditedUser(userData);
    setIsEditing(false);
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'Administrator': return '#DC2626';
      case 'Project Manager': return '#2241DD';
      case 'Senior Engineer': return '#059669';
      case 'Field Technician': return '#7C3AED';
      default: return '#6B7280';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <LinearGradient
          colors={['#2241DD', '#1E3A8A']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Profile</Text>
            <TouchableOpacity 
              style={styles.editButton} 
              onPress={() => {
                console.log('Edit button pressed, current editing state:', isEditing);
                setIsEditing(!isEditing);
              }}
            >
              <Ionicons name={isEditing ? "checkmark" : "create"} size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

          {/* Profile Photo Section */}
          <View style={styles.photoSection}>
            <TouchableOpacity 
              style={styles.photoContainer}
              onPress={() => {
                console.log('Photo container pressed');
                handleImagePicker();
              }}
            >
              {editedUser.photo ? (
                <Image source={{ uri: editedUser.photo }} style={styles.profilePhoto} />
              ) : (
                <View style={[styles.profilePhoto, styles.photoPlaceholder]}>
                  <Text style={styles.initialsText}>
                    {getInitials(editedUser.name)}
                  </Text>
                </View>
              )}
              {isEditing && (
                <View style={styles.editPhotoOverlay}>
                  <Ionicons name="camera" size={20} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.userName}>{editedUser.name}</Text>
            <View style={[styles.roleBadge, { backgroundColor: getRoleColor(editedUser.role) }]}>
              <Text style={styles.roleText}>{editedUser.role}</Text>
            </View>
          </View>

          {/* User Details */}
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            <View style={styles.detailItem}>
              <Ionicons name="person" size={20} color="#6B7280" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Full Name</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.detailInput}
                    value={editedUser.name}
                    onChangeText={(text) => setEditedUser({...editedUser, name: text})}
                  />
                ) : (
                  <Text style={styles.detailValue}>{editedUser.name}</Text>
                )}
              </View>
            </View>

            <View style={styles.detailItem}>
              <Ionicons name="mail" size={20} color="#6B7280" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Email</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.detailInput}
                    value={editedUser.email}
                    onChangeText={(text) => setEditedUser({...editedUser, email: text})}
                    keyboardType="email-address"
                  />
                ) : (
                  <Text style={styles.detailValue}>{editedUser.email}</Text>
                )}
              </View>
            </View>

            <View style={styles.detailItem}>
              <Ionicons name="briefcase" size={20} color="#6B7280" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Role</Text>
                <Text style={styles.detailValue}>{editedUser.role}</Text>
              </View>
            </View>
          </View>

          {/* Project Statistics */}
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Project Statistics</Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="folder" size={24} color="#2241DD" />
                </View>
                <Text style={styles.statNumber}>{editedUser.totalProjects}</Text>
                <Text style={styles.statLabel}>Total Projects</Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                </View>
                <Text style={styles.statNumber}>{editedUser.completedProjects}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="time" size={24} color="#F59E0B" />
                </View>
                <Text style={styles.statNumber}>{editedUser.activeProjects}</Text>
                <Text style={styles.statLabel}>Active</Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="trending-up" size={24} color="#8B5CF6" />
                </View>
                <Text style={styles.statNumber}>{editedUser.activityScore}</Text>
                <Text style={styles.statLabel}>Activity Score</Text>
              </View>
            </View>
          </View>


          {/* Action Buttons */}
          {isEditing && (
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  photoContainer: {
    position: 'relative',
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  photoPlaceholder: {
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontSize: 32,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
  },
  editPhotoOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2241DD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginTop: 16,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  detailsSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailContent: {
    flex: 1,
    marginLeft: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
  },
  detailInput: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
  },
  statsSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingBottom: 40,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#2241DD',
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
});

export default UserProfileModal;
