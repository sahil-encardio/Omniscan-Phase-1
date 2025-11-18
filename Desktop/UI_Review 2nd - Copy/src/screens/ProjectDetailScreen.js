import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions,
  SafeAreaView,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../styles/DesignSystem';
import ScreenHeader from './components/ScreenHeader';
import Card from '../components/Card';
import { useTeam } from '../context/TeamContext';

const { width, height } = Dimensions.get('window');

const ProjectDetailScreen = ({ navigation, route }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('Overview');
  
  // Get project data from route params
  const project = route?.params?.project;
  const projectId = route?.params?.projectId || project?.id || 'bridge-monitoring';
  
  // Use shared team context
  const { teamMembers, setCurrentProject, getCurrentTeamMembers } = useTeam();
  
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical': return '#FEF2F2';
      case 'High': return '#FEF3C7';
      case 'Medium': return '#DBEAFE';
      case 'Low': return '#D1FAE5';
      default: return '#F3F4F6';
    }
  };

  const getPriorityTextColor = (priority) => {
    switch (priority) {
      case 'Critical': return '#DC2626';
      case 'High': return '#D97706';
      case 'Medium': return '#2563EB';
      case 'Low': return '#059669';
      default: return '#6B7280';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return '#D1FAE5';
      case 'Paused': return '#FEF3C7';
      case 'Completed': return '#DBEAFE';
      case 'Cancelled': return '#FEF2F2';
      default: return '#F3F4F6';
    }
  };

  // Use project data from route params or fallback to default
  const projectData = project ? {
    title: project.title,
    location: project.location,
    description: project.description,
    startDate: project.startDate,
    endDate: project.deadline,
    priority: project.priority,
    status: project.status,
    progress: project.progress,
    lastActivity: project.lastActivity,
    sensors: project.sensorList || [],
    members: currentTeamMembers || [] // Use TeamContext data instead of static data
  } : {
    title: "Bridge Monitoring System",
    location: "Main Street Bridge, Downtown",
    description: "Structural health monitoring of the Main Street Bridge.",
    startDate: "15/01/2024",
    endDate: "30/06/2024",
    priority: "High",
    status: "Active",
    progress: 75,
    lastActivity: "2 hours ago",
    sensors: [],
    members: currentTeamMembers || [] // Use TeamContext data instead of static data
  };

  const recentActivities = [
    {
      id: 1,
      icon: "trending-up",
      iconColor: "#10B981",
      title: "Load Cell LC-001 recorded new reading: 2,450.5 kg",
      time: "2 minutes ago",
      system: "System"
    },
    {
      id: 2,
      icon: "warning",
      iconColor: "#F59E0B",
      title: "Battery low warning for Pressure",
      time: "1 hour ago",
      system: "System"
    }
  ];

  const tabs = [
    { id: 'Overview', label: 'Overview', icon: 'information-circle' },
    { id: 'Sensors', label: 'Sensors', icon: 'hardware-chip' },
    { id: 'Team', label: 'Team', icon: 'people' }
  ];

  return (
    <View style={styles.container}>
      <ScreenHeader 
        title={projectData.title}
        subtitle="Project Details"
        navigation={navigation}
        showBackButton={true}
        showLogo={true}
        rightAction={
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />
      
      {/* Navigation Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              selectedTab === tab.id && styles.activeTab
            ]}
            onPress={() => setSelectedTab(tab.id)}
          >
            <Ionicons 
              name={tab.icon} 
              size={20} 
              color={selectedTab === tab.id ? "#FFFFFF" : "#6B7280"} 
            />
            <Text style={[
              styles.tabText,
              selectedTab === tab.id && styles.activeTabText
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Project Information Card */}
        <Card style={styles.projectCard}>
          <View style={styles.projectHeader}>
            <Text style={styles.projectTitle}>Project Information</Text>
          </View>
          
          <View style={styles.projectDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Description:</Text>
              <Text style={styles.detailValue}>{projectData.description}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Location:</Text>
              <Text style={styles.detailValue}>{projectData.location}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Start Date:</Text>
              <Text style={styles.detailValue}>{projectData.startDate}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>End Date:</Text>
              <Text style={styles.detailValue}>{projectData.endDate}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Priority:</Text>
              <View style={[styles.priorityContainer, { backgroundColor: getPriorityColor(projectData.priority) }]}>
                <Text style={[styles.priorityText, { color: getPriorityTextColor(projectData.priority) }]}>{projectData.priority}</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status:</Text>
              <View style={[styles.statusContainer, { backgroundColor: getStatusColor(projectData.status) }]}>
                <Text style={styles.statusText}>{projectData.status}</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Progress:</Text>
              <Text style={styles.detailValue}>{projectData.progress}%</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Last Activity:</Text>
              <Text style={styles.detailValue}>{projectData.lastActivity}</Text>
            </View>
          </View>
        </Card>

        {/* Conditional Content Based on Selected Tab */}
        {selectedTab === 'Overview' && (
          <>
            {/* Recent Activity Card */}
            <Card style={styles.activityCard}>
              <View style={styles.activityHeader}>
                <Text style={styles.activityTitle}>Recent Activity</Text>
                <TouchableOpacity>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.activityList}>
                {recentActivities.map((activity) => (
                  <View key={activity.id} style={styles.activityItem}>
                    <View style={styles.activityIconContainer}>
                      <Ionicons 
                        name={activity.icon} 
                        size={20} 
                        color={activity.iconColor} 
                      />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityText}>{activity.title}</Text>
                      <Text style={styles.activityTime}>{activity.system} • {activity.time}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </Card>
          </>
        )}

        {selectedTab === 'Sensors' && (
          <Card style={styles.sensorsCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Project Sensors ({projectData.sensors.length})</Text>
              <TouchableOpacity style={styles.addButton}>
                <Ionicons name="add" size={20} color="#2241DD" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.sensorsList}>
              {projectData.sensors.length > 0 ? (
                projectData.sensors.map((sensor) => (
                  <View key={sensor.id} style={styles.sensorItem}>
                    <View style={styles.sensorInfo}>
                      <Text style={styles.sensorName}>{sensor.name}</Text>
                      <Text style={styles.sensorType}>{sensor.type}</Text>
                      <Text style={styles.sensorLocation}>{sensor.location}</Text>
                    </View>
                    <View style={styles.sensorStatus}>
                      <Text style={styles.sensorReading}>--</Text>
                      <Text style={styles.sensorUpdate}>Not connected</Text>
                      <View style={styles.statusIndicator}>
                        <View style={[styles.statusDot, { backgroundColor: '#6B7280' }]} />
                        <Text style={styles.statusText}>0%</Text>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="hardware-chip" size={48} color="#D1D5DB" />
                  <Text style={styles.emptyStateTitle}>No Sensors Added</Text>
                  <Text style={styles.emptyStateText}>Add sensors to monitor this project</Text>
                </View>
              )}
            </View>
          </Card>
        )}

        {selectedTab === 'Team' && (
          <Card style={styles.teamCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Team Members ({projectData.members.length})</Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => navigation.navigate('UserManagement', { projectId })}
              >
                <Ionicons name="person-add" size={20} color="#2241DD" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.teamList}>
              {projectData.members.length > 0 ? (
                projectData.members.map((member) => {
                  const getInitials = (name) => {
                    return name.split(' ').map(n => n[0]).join('').toUpperCase();
                  };
                  
                  const getRoleColor = (role) => {
                    switch (role.toLowerCase()) {
                      case 'manager': return '#7C3AED';
                      case 'engineer': return '#2563EB';
                      case 'technician': return '#059669';
                      default: return '#6B7280';
                    }
                  };

                  return (
                    <View key={member.id} style={styles.teamMember}>
                      <View style={[styles.memberAvatar, { backgroundColor: getRoleColor(member.role) }]}>
                        <Text style={styles.memberInitials}>{getInitials(member.name)}</Text>
                      </View>
                      <View style={styles.memberInfo}>
                        <Text style={styles.memberName}>{member.name}</Text>
                        <Text style={styles.memberRole}>{member.role}</Text>
                        <Text style={styles.memberEmail}>{member.email}</Text>
                      </View>
                      <View style={styles.memberStatus}>
                        <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
                        <Text style={styles.statusText}>Active</Text>
                      </View>
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="people" size={48} color="#D1D5DB" />
                  <Text style={styles.emptyStateTitle}>No Team Members</Text>
                  <Text style={styles.emptyStateText}>Add team members to collaborate on this project</Text>
                </View>
              )}
            </View>
          </Card>
        )}
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
  settingsButton: {
    padding: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: '#2241DD',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 8,
    fontFamily: 'Inter-Medium',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  projectCard: {
    marginTop: 16,
    marginBottom: 16,
  },
  projectHeader: {
    marginBottom: 20,
  },
  projectTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter-Bold',
  },
  projectDetails: {
    gap: 16,
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
  priorityContainer: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D97706',
    fontFamily: 'Inter-SemiBold',
  },
  activityCard: {
    marginBottom: 16,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  activityTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter-Bold',
  },
  viewAllText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2241DD',
    fontFamily: 'Inter-Medium',
  },
  activityList: {
    gap: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    fontFamily: 'Inter-Medium',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
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
  // New styles for conditional content
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    padding: 4,
  },
  sensorsCard: {
    marginBottom: 16,
  },
  sensorsList: {
    gap: 16,
  },
  sensorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sensorInfo: {
    flex: 1,
  },
  sensorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  sensorType: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2241DD',
    fontFamily: 'Inter-Medium',
    marginBottom: 2,
  },
  sensorLocation: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  sensorStatus: {
    alignItems: 'flex-end',
  },
  sensorReading: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  sensorUpdate: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: 'Inter-Medium',
  },
  teamCard: {
    marginBottom: 16,
  },
  teamList: {
    gap: 16,
  },
  teamMember: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberInitials: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  memberRole: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2241DD',
    fontFamily: 'Inter-Medium',
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  memberStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  // New styles for enhanced project details
  statusContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  emptyState: {
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
  emptyStateText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#9CA3AF',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
});

export default ProjectDetailScreen;
