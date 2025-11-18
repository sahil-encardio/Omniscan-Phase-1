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
  TextInput,
  Modal,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../styles/DesignSystem';
import ScreenHeader from './components/ScreenHeader';
import Card from '../components/Card';
import { useTeam } from '../context/TeamContext';

const { width, height } = Dimensions.get('window');

const UserManagementScreen = ({ navigation, route }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All Users');
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    role: 'Field Technician',
    permissions: []
  });

  // Get project ID from route params
  const projectId = route?.params?.projectId || 'bridge-monitoring';

  // Use shared team context
  const { 
    teamMembers, 
    addTeamMember, 
    getTeamOverview, 
    getFilteredMembers,
    setCurrentProject,
    getCurrentTeamMembers
  } = useTeam();
  
  // Set current project when component mounts
  React.useEffect(() => {
    setCurrentProject(projectId);
  }, [projectId, setCurrentProject]);
  
  // Get team members for current project
  const currentTeamMembers = getCurrentTeamMembers();

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 2000);
  };

  // Get team overview from context for current project
  const teamOverview = getTeamOverview(projectId);

  const filters = [
    { id: 'All Users', label: 'All Users', count: currentTeamMembers.length },
    { id: 'Admins', label: 'Admins', count: currentTeamMembers.filter(member => member.role === 'Administrator').length },
    { id: 'Engineers', label: 'Engineers', count: currentTeamMembers.filter(member => member.role === 'Senior Engineer').length },
    { id: 'Technicians', label: 'Technicians', count: currentTeamMembers.filter(member => member.role === 'Field Technician').length }
  ];

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getStatusColor = (status) => {
    return status === 'online' ? '#10B981' : '#EF4444';
  };

  // Get filtered members from context for current project
  const filteredMembers = getFilteredMembers(selectedFilter, projectId);

  const addNewMember = () => {
    if (!newMember.name || !newMember.email) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Add the new member using context for current project
    addTeamMember(newMember, projectId);
    
    // Reset form and close modal
    setNewMember({
      name: '',
      email: '',
      role: 'Field Technician',
      permissions: []
    });
    setShowAddMemberModal(false);
    
    Alert.alert('Success', 'Team member added successfully!');
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'Administrator': return '#DC2626';
      case 'Senior Engineer': return '#2241DD';
      case 'Field Technician': return '#059669';
      case 'Project Manager': return '#7C3AED';
      default: return '#6B7280';
    }
  };

  const availableRoles = [
    'Administrator',
    'Senior Engineer', 
    'Field Technician',
    'Project Manager'
  ];

  const availablePermissions = [
    'View Data',
    'Edit Data', 
    'Admin Access',
    'Delete Data'
  ];

  const togglePermission = (permission) => {
    setNewMember(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  return (
    <View style={styles.container}>
      <ScreenHeader 
        title="User Management"
        subtitle={`Team Management - ${projectId && typeof projectId === 'string' ? projectId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Project'}`}
        navigation={navigation}
        showBackButton={true}
        showLogo={true}
        rightAction={
          <TouchableOpacity 
            style={styles.addUserButton}
            onPress={() => setShowAddMemberModal(true)}
          >
            <Ionicons name="person-add" size={24} color="#FFFFFF" />
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
        {/* Team Overview Card */}
        <Card style={styles.overviewCard}>
          <Text style={styles.overviewTitle}>Team Overview</Text>
          <View style={styles.overviewMetrics}>
            <View style={styles.metricItem}>
              <Text style={styles.metricNumber}>{teamOverview.totalMembers}</Text>
              <Text style={styles.metricLabel}>Total Members</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={[styles.metricNumber, { color: '#10B981' }]}>{teamOverview.activeNow}</Text>
              <Text style={styles.metricLabel}>Active Now</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={[styles.metricNumber, { color: '#2241DD' }]}>{teamOverview.admins}</Text>
              <Text style={styles.metricLabel}>Admins</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={[styles.metricNumber, { color: '#F59E0B' }]}>{teamOverview.pending}</Text>
              <Text style={styles.metricLabel}>Pending</Text>
            </View>
          </View>
        </Card>

        {/* Filter Tabs - Slidable */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterScrollContainer}
          contentContainerStyle={styles.filterContainer}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterTab,
                selectedFilter === filter.id && styles.activeFilterTab
              ]}
              onPress={() => setSelectedFilter(filter.id)}
            >
              <Text style={[
                styles.filterTabText,
                selectedFilter === filter.id && styles.activeFilterTabText
              ]}>
                {filter.label}
              </Text>
              <View style={[
                styles.filterBadge,
                selectedFilter === filter.id && styles.activeFilterBadge
              ]}>
                <Text style={[
                  styles.filterBadgeText,
                  selectedFilter === filter.id && styles.activeFilterBadgeText
                ]}>
                  {filter.count}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Team Members Section */}
        <View style={styles.membersHeader}>
          <Text style={styles.membersTitle}>Team Members</Text>
          <Text style={styles.membersCount}>{filteredMembers.length} members</Text>
        </View>

        {filteredMembers.length > 0 ? (
          filteredMembers.map((member) => (
            <Card key={member.id} style={styles.memberCard}>
            <View style={styles.memberHeader}>
              <View style={styles.memberInfo}>
                <View style={[styles.avatar, { backgroundColor: member.roleColor }]}>
                  <Text style={styles.avatarText}>{getInitials(member.name)}</Text>
                </View>
                <View style={styles.memberDetails}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberEmail}>{member.email}</Text>
                </View>
              </View>
              <View style={styles.memberActions}>
                <View style={[styles.roleBadge, { backgroundColor: member.roleColor }]}>
                  <Text style={styles.roleText}>{member.role}</Text>
                </View>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(member.status) }]} />
                <TouchableOpacity style={styles.moreButton}>
                  <Ionicons name="ellipsis-vertical" size={16} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.memberStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{member.projects}</Text>
                <Text style={styles.statLabel}>Projects</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{member.permissions}</Text>
                <Text style={styles.statLabel}>Permissions</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{member.lastSeen}</Text>
                <Text style={styles.statLabel}>Last Seen</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{member.joined}</Text>
                <Text style={styles.statLabel}>Joined</Text>
              </View>
            </View>

            <View style={styles.permissionsSection}>
              <Text style={styles.permissionsTitle}>Permissions</Text>
              <View style={styles.permissionsList}>
                {member.permissionsList.map((permission, index) => (
                  <View key={index} style={styles.permissionBadge}>
                    <Ionicons name="checkmark" size={12} color="#10B981" />
                    <Text style={styles.permissionText}>{permission}</Text>
                  </View>
                ))}
              </View>
            </View>
          </Card>
          ))
        ) : (
          <Card style={styles.emptyStateCard}>
            <View style={styles.emptyStateContent}>
              <Ionicons name="people-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateTitle}>No members found</Text>
              <Text style={styles.emptyStateSubtitle}>
                {selectedFilter === 'All Users' 
                  ? 'No team members available' 
                  : `No ${selectedFilter.toLowerCase()} found`}
              </Text>
            </View>
          </Card>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Checking for new update...</Text>
      </View>

      {/* Add Member Modal */}
      <Modal
        visible={showAddMemberModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddMemberModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Team Member</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowAddMemberModal(false)}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Name Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newMember.name}
                  onChangeText={(text) => setNewMember(prev => ({ ...prev, name: text }))}
                  placeholder="Enter full name"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newMember.email}
                  onChangeText={(text) => setNewMember(prev => ({ ...prev, email: text }))}
                  placeholder="Enter email address"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Role Selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Role</Text>
                <View style={styles.roleContainer}>
                  {availableRoles.map((role) => (
                    <TouchableOpacity
                      key={role}
                      style={[
                        styles.roleOption,
                        newMember.role === role && styles.selectedRoleOption
                      ]}
                      onPress={() => setNewMember(prev => ({ ...prev, role }))}
                    >
                      <Text style={[
                        styles.roleOptionText,
                        newMember.role === role && styles.selectedRoleOptionText
                      ]}>
                        {role}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Permissions Selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Permissions</Text>
                <View style={styles.permissionsContainer}>
                  {availablePermissions.map((permission) => (
                    <TouchableOpacity
                      key={permission}
                      style={[
                        styles.permissionOption,
                        newMember.permissions.includes(permission) && styles.selectedPermissionOption
                      ]}
                      onPress={() => togglePermission(permission)}
                    >
                      <Ionicons 
                        name={newMember.permissions.includes(permission) ? "checkmark" : "add"} 
                        size={16} 
                        color={newMember.permissions.includes(permission) ? "#10B981" : "#6B7280"} 
                      />
                      <Text style={[
                        styles.permissionOptionText,
                        newMember.permissions.includes(permission) && styles.selectedPermissionOptionText
                      ]}>
                        {permission}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowAddMemberModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={addNewMember}
              >
                <Text style={styles.addButtonText}>Add Member</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  addUserButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  overviewCard: {
    marginTop: 16,
    marginBottom: 16,
  },
  overviewTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter-Bold',
    marginBottom: 16,
  },
  overviewMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
  filterScrollContainer: {
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  activeFilterTab: {
    backgroundColor: '#2241DD',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: 'Inter-Medium',
    marginRight: 8,
  },
  activeFilterTabText: {
    color: '#FFFFFF',
  },
  filterBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activeFilterBadge: {
    backgroundColor: '#FFFFFF',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: 'Inter-SemiBold',
  },
  activeFilterBadgeText: {
    color: '#2241DD',
  },
  membersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  membersTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
  },
  membersCount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: 'Inter-Medium',
  },
  memberCard: {
    marginBottom: 16,
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  memberActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  moreButton: {
    padding: 4,
  },
  memberStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2241DD',
    fontFamily: 'Inter-SemiBold',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: 'Inter-Medium',
    marginTop: 2,
  },
  permissionsSection: {
    marginTop: 8,
  },
  permissionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  permissionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  permissionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  permissionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#059669',
    fontFamily: 'Inter-Medium',
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxHeight: '80%',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter-Bold',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '400',
    color: '#111827',
    fontFamily: 'Inter-Regular',
    backgroundColor: '#FFFFFF',
  },
  roleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedRoleOption: {
    backgroundColor: '#2241DD',
    borderColor: '#2241DD',
  },
  roleOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: 'Inter-Medium',
  },
  selectedRoleOptionText: {
    color: '#FFFFFF',
  },
  permissionsContainer: {
    gap: 8,
  },
  permissionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  selectedPermissionOption: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
  },
  permissionOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: 'Inter-Medium',
  },
  selectedPermissionOptionText: {
    color: '#059669',
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: 'Inter-SemiBold',
  },
  addButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#2241DD',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
  // Empty state styles
  emptyStateCard: {
    marginBottom: 16,
  },
  emptyStateContent: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: 'Inter-SemiBold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#9CA3AF',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
});

export default UserManagementScreen;
