import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  TextInput,
  Modal,
  Alert
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../styles/DesignSystem';
import ScreenHeader from './components/ScreenHeader';
import Card from '../components/Card';
import { useTeam } from '../context/TeamContext';

const ProjectManagementScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Get team context functions
  const { addTeamMember, getCurrentTeamMembers, getTeamMembersByProject } = useTeam();
  
  // Function to get member count for a project from TeamContext
  const getProjectMemberCount = (projectId) => {
    const teamMembers = getTeamMembersByProject(projectId.toString());
    return teamMembers.length;
  };
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [newProject, setNewProject] = useState({
    title: '',
    location: '',
    description: '',
    priority: 'Medium',
    status: 'Active',
    startDate: '',
    deadline: '',
    sensors: [],
    members: [],
  });
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showSensorModal, setShowSensorModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [newSensor, setNewSensor] = useState({ name: '', type: '', location: '' });
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    role: 'Field Technician',
    permissions: []
  });


  const [projects, setProjects] = useState([
    {
      id: 1,
      title: 'Lucknow Metro Project',
      location: 'Lucknow,Uttar Pradesh',
      description: ' Real-time monitoring through advanced dataloggers and a web-based system.',
      priority: 'High',
      status: 'Active',
      progress: 75,
      sensors: '15',
      members: 3,
      alerts: 2,
      startDate: '15/01/2025',
      deadline: '30/06/2026',
      lastActivity: '2 hours ago',
      // Preconfigured project data
      clientId: 'CLIENT-001',
      clientProject: 'LUCKNOW-METRO-2025',
      gatewayCount: 2,
      nodeCount: 6,
      sensorCount: 15,
      installationStatus: 'In Progress',
      siteSetupComplete: false,
      // Setup process compliance
      gatewayPreconfigured: true,
      gatewayLinkedToNodes: true,
      connectionMethod: 'Bluetooth', // Bluetooth, Ethernet, USB-C
      nodesPowered: false,
      connectivityVerified: false,
      sensorsChecked: false,
      calibraOneSetup: false,
      schedulingConfigured: false,
      backhaulConfigured: false,
    },
    {
      id: 2,
      title: 'Bogibeel Rail Project',
      location: 'Dibrugarh,Assam',
      description: 'Installed by Encardio Rite, the instrumentation captures strain development, temperature variations, and displacement at the bridge span bearings.',
      priority: 'Critical',
      status: 'Active',
      progress: 95,
      sensors: '23',
      members: 3,
      alerts: 5,
      startDate: '01/02/2025',
      deadline: '15/08/2026',
      lastActivity: '1 day ago',
      // Preconfigured project data
      clientId: 'CLIENT-002',
      clientProject: 'BOGIBEEL-RAIL-2025',
      gatewayCount: 1,
      nodeCount: 8,
      sensorCount: 23,
      installationStatus: 'In Progress',
      siteSetupComplete: false,
      // Setup process compliance
      gatewayPreconfigured: true,
      gatewayLinkedToNodes: true,
      connectionMethod: 'Ethernet', // Bluetooth, Ethernet, USB-C
      nodesPowered: false,
      connectivityVerified: false,
      sensorsChecked: false,
      calibraOneSetup: false,
      schedulingConfigured: false,
      backhaulConfigured: false,
    },
    {
      id: 3,
      title: 'Allahabad Bypass Bridge',
      location: 'Allahabad, India',
      description: 'Dual Parallel Bridges Spanning the Ganga River and 87 km of 4-Lane Road Construction.',
      priority: 'Medium',
      status: 'Active',
      progress: 30,
      sensors: '16',
      members: 3,
      alerts: 1,
      startDate: '01/03/2025',
      deadline: '30/09/2026',
      lastActivity: '4 hours ago',
      // Preconfigured project data
      clientId: 'CLIENT-003',
      clientProject: 'ALLAHABAD-BYPASS-2025',
      gatewayCount: 1,
      nodeCount: 5,
      sensorCount: 16,
      installationStatus: 'In Progress',
      siteSetupComplete: false,
      // Setup process compliance
      gatewayPreconfigured: true,
      gatewayLinkedToNodes: true,
      connectionMethod: 'USB-C', // Bluetooth, Ethernet, USB-C
      nodesPowered: false,
      connectivityVerified: false,
      sensorsChecked: false,
      calibraOneSetup: false,
      schedulingConfigured: false,
      backhaulConfigured: false,
    },
    {
      id: 4,
      title: 'Anthochori Tunnel',
      location: 'Northern Greece',
      description: 'Encardio-rite provided advanced geotechnical monitoring solutions to ensure safety and structural integrity.',
      priority: 'Low',
      status: 'Completed',
      progress: 100,
      sensors: '12/12',
      members: 2,
      alerts: 0,
      startDate: '01/01/2024',
      deadline: '31/03/2024',
      lastActivity: '1 week ago',
      // Preconfigured project data
      clientId: 'CLIENT-004',
      clientProject: 'ANTHOCHORI-TUNNEL-2024',
      gatewayCount: 1,
      nodeCount: 4,
      sensorCount: 12,
      installationStatus: 'Completed',
      siteSetupComplete: true,
      // Setup process compliance
      gatewayPreconfigured: true,
      gatewayLinkedToNodes: true,
      connectionMethod: 'Bluetooth', // Bluetooth, Ethernet, USB-C
      nodesPowered: true,
      connectivityVerified: true,
      sensorsChecked: true,
      calibraOneSetup: true,
      schedulingConfigured: true,
      backhaulConfigured: true,
    },
    {
      id: 5,
      title: 'Pir Panjal Railway Tunnel',
      location: 'Jammu & Kashmir',
      description: 'The tunnel is a part of the 202 km Udhampur – Srinagar – Baramulla rail link project undertaken by the Northern Railways.',
      priority: 'High',
      status: 'Completed',
      progress: 100,
      sensors: '8',
      members: 4,
      alerts: 0,
      startDate: '15/07/2025',
      deadline: '28/02/2026',
      lastActivity: '2 weeks ago',
      // Preconfigured project data
      clientId: 'CLIENT-005',
      clientProject: 'PIR-PANJAL-RAILWAY-2025',
      gatewayCount: 1,
      nodeCount: 3,
      sensorCount: 8,
      installationStatus: 'Completed',
      siteSetupComplete: true,
      // Setup process compliance
      gatewayPreconfigured: true,
      gatewayLinkedToNodes: true,
      connectionMethod: 'Ethernet', // Bluetooth, Ethernet, USB-C
      nodesPowered: true,
      connectivityVerified: true,
      sensorsChecked: true,
      calibraOneSetup: true,
      schedulingConfigured: true,
      backhaulConfigured: true,
    },
  ]);

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleAddProject = () => {
    if (!newProject.title.trim() || !newProject.location.trim()) {
      Alert.alert('Error', 'Please fill in all required fields (Title and Location)');
      return;
    }

    // Generate new project ID
    const newId = Math.max(...projects.map(p => p.id)) + 1;
    
    // Create new project object
    const projectToAdd = {
      id: newId,
      title: newProject.title.trim(),
      location: newProject.location.trim(),
      description: newProject.description.trim(),
      priority: newProject.priority,
      status: newProject.status,
      progress: 0,
      sensors: `${newProject.sensors?.length || 0}/${newProject.sensors?.length || 0}`,
      members: newProject.members?.length || 0,
      alerts: 0,
      startDate: newProject.startDate || new Date().toLocaleDateString('en-GB'),
      deadline: newProject.deadline,
      lastActivity: 'Just now',
      sensorList: newProject.sensors || [],
      memberList: newProject.members || [],
    };

    // Add to projects array (in a real app, this would be saved to backend)
    setProjects(prevProjects => [projectToAdd, ...prevProjects]);
    
    // Add members to TeamContext
    if (newProject.members && newProject.members.length > 0) {
      newProject.members.forEach(member => {
        addTeamMember(member, newId.toString());
      });
    }
    
    // Reset form and close modal
    setNewProject({
      title: '',
      location: '',
      description: '',
      priority: 'Medium',
      status: 'Active',
      startDate: '',
      deadline: '',
    });
    setShowAddProjectModal(false);
    
    Alert.alert('Success', 'Project added successfully!');
  };

  const resetForm = () => {
    setNewProject({
      title: '',
      location: '',
      description: '',
      priority: 'Medium',
      status: 'Active',
      startDate: '',
      deadline: '',
      sensors: [],
      members: [],
    });
    setNewSensor({ name: '', type: '', location: '' });
    setNewMember({ 
      name: '', 
      email: '', 
      role: 'Field Technician', 
      permissions: [] 
    });
  };

  const addSensor = () => {
    if (!newSensor.name.trim() || !newSensor.type.trim()) {
      Alert.alert('Error', 'Please fill in sensor name and type');
      return;
    }
    
    const sensorToAdd = {
      id: Date.now(),
      name: newSensor.name.trim(),
      type: newSensor.type.trim(),
      location: newSensor.location.trim(),
    };
    
    setNewProject(prev => ({
      ...prev,
      sensors: [...(prev.sensors || []), sensorToAdd]
    }));
    
    setNewSensor({ name: '', type: '', location: '' });
    setShowSensorModal(false);
  };

  const addMember = () => {
    if (!newMember.name.trim() || !newMember.email.trim()) {
      Alert.alert('Error', 'Please fill in member name and email');
      return;
    }
    
    const memberToAdd = {
      id: Date.now(),
      name: newMember.name.trim(),
      email: newMember.email.trim(),
      role: newMember.role,
      permissions: newMember.permissions,
      status: 'online',
      lastSeen: 'Now',
      joined: new Date().toLocaleDateString('en-GB'),
      projects: 1,
      roleColor: getRoleColor(newMember.role),
      permissionsList: newMember.permissions
    };
    
    setNewProject(prev => ({
      ...prev,
      members: [...(prev.members || []), memberToAdd]
    }));
    
    setNewMember({ 
      name: '', 
      email: '', 
      role: 'Field Technician', 
      permissions: [] 
    });
    setShowMemberModal(false);
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

  const removeSensor = (sensorId) => {
    setNewProject(prev => ({
      ...prev,
      sensors: (prev.sensors || []).filter(sensor => sensor.id !== sensorId)
    }));
  };

  const removeMember = (memberId) => {
    setNewProject(prev => ({
      ...prev,
      members: (prev.members || []).filter(member => member.id !== memberId)
    }));
  };

  const handleDateChange = (event, selectedDate, dateType) => {
    if (dateType === 'start') {
      setShowStartDatePicker(false);
      if (selectedDate) {
        setNewProject(prev => ({
          ...prev,
          startDate: selectedDate.toLocaleDateString('en-GB')
        }));
      }
    } else {
      setShowEndDatePicker(false);
      if (selectedDate) {
        setNewProject(prev => ({
          ...prev,
          deadline: selectedDate.toLocaleDateString('en-GB')
        }));
      }
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


  // Search function - only search project titles
  const searchProjects = (query, projectList) => {
    if (!query.trim()) return projectList;
    
    const lowercaseQuery = query.toLowerCase();
    return projectList.filter(project => 
      project.title.toLowerCase().includes(lowercaseQuery)
    );
  };

  // Filter projects based on active filter
  const filteredProjects = projects.filter(project => {
    switch (activeFilter) {
      case 'active':
        return project.status === 'Active';
      case 'completed':
        return project.status === 'Completed';
      default:
        return true; // Show all projects
    }
  });

  // Apply search to filtered projects
  const searchAndFilteredProjects = searchProjects(searchQuery, filteredProjects);

  // Get counts for each filter
  const allCount = projects.length;
  const activeCount = projects.filter(p => p.status === 'Active').length;
  const completedCount = projects.filter(p => p.status === 'Completed').length;

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical': return '#EF4444';
      case 'High': return '#F59E0B';
      case 'Medium': return '#3B82F6';
      case 'Low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return '#10B981';
      case 'Paused': return '#F59E0B';
      case 'Completed': return '#3B82F6';
      case 'Cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader 
        title="Project Management" 
        navigation={navigation}
        showLogo={true}
        rightAction={
          <TouchableOpacity 
            style={styles.circularAddButton}
            onPress={() => setShowAddProjectModal(true)}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search projects..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
            >
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
      </View>
      </View>
      
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Filter Tabs */}
        <View style={styles.filterTabsContainer}>
          <TouchableOpacity 
            style={[
              styles.filterTab, 
              activeFilter === 'all' && styles.activeFilterTab
            ]}
            onPress={() => setActiveFilter('all')}
          >
            <Text style={[
              styles.filterTabText,
              activeFilter === 'all' && styles.activeFilterTabText
            ]}>
              All Projects
            </Text>
            <View style={[
              styles.filterTabCount,
              activeFilter === 'all' && styles.activeFilterTabCount
            ]}>
              <Text style={[
                styles.filterTabCountText,
                activeFilter === 'all' && styles.activeFilterTabCountText
              ]}>
                {allCount}
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterTab, 
              activeFilter === 'active' && styles.activeFilterTab
            ]}
            onPress={() => setActiveFilter('active')}
          >
            <Text style={[
              styles.filterTabText,
              activeFilter === 'active' && styles.activeFilterTabText
            ]}>
              Active
            </Text>
            <View style={[
              styles.filterTabCount,
              activeFilter === 'active' && styles.activeFilterTabCount
            ]}>
              <Text style={[
                styles.filterTabCountText,
                activeFilter === 'active' && styles.activeFilterTabCountText
              ]}>
                {activeCount}
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterTab, 
              activeFilter === 'completed' && styles.activeFilterTab
            ]}
            onPress={() => setActiveFilter('completed')}
          >
            <Text style={[
              styles.filterTabText,
              activeFilter === 'completed' && styles.activeFilterTabText
            ]}>
              Completed
            </Text>
            <View style={[
              styles.filterTabCount,
              activeFilter === 'completed' && styles.activeFilterTabCount
            ]}>
              <Text style={[
                styles.filterTabCountText,
                activeFilter === 'completed' && styles.activeFilterTabCountText
              ]}>
                {completedCount}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Search Results Info */}
        {searchQuery.length > 0 && (
          <View style={styles.searchResultsInfo}>
            <Text style={styles.searchResultsText}>
              {searchAndFilteredProjects.length} project{searchAndFilteredProjects.length !== 1 ? 's' : ''} found for "{searchQuery}"
            </Text>
          </View>
        )}

        {/* Projects List */}
        {searchAndFilteredProjects.length > 0 ? (
          searchAndFilteredProjects.map((project) => (
          <TouchableOpacity 
            key={project.id} 
            onPress={() => handleViewProject(project)}
            activeOpacity={0.7}
          >
            <Card style={styles.projectCard}>
            {/* Project Header */}
            <View style={styles.projectHeader}>
              <View style={styles.projectInfo}>
                <Text style={styles.projectTitle}>{project.title}</Text>
                <Text style={styles.projectLocation}>{project.location}</Text>
                <Text style={styles.projectDescription}>{project.description}</Text>
              </View>
              <View style={styles.projectStatus}>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(project.priority) }]}>
                  <Text style={styles.priorityText}>{project.priority}</Text>
                </View>
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(project.status) }]} />
                  <Text style={styles.statusText}>{project.status}</Text>
                </View>
              </View>
            </View>

            {/* Metrics */}
            <View style={styles.metricsContainer}>
              <View style={styles.metricItem}>
                <Ionicons name="hardware-chip" size={18} color="#2241DD" />
                <Text style={styles.metricText}>{project.sensors} sensors</Text>
              </View>
              <View style={styles.metricItem}>
                <Ionicons name="people" size={18} color="#2241DD" />
                <Text style={styles.metricText}>{getProjectMemberCount(project.id)} members</Text>
              </View>
              <View style={styles.metricItem}>
                <Ionicons name="warning" size={18} color="#F59E0B" />
                <Text style={styles.metricText}>{project.alerts} alerts</Text>
              </View>
            </View>

            {/* Project Dates */}
            <View style={styles.datesContainer}>
              <View style={styles.dateItem}>
                <Text style={styles.dateLabel}>Started</Text>
                <Text style={styles.dateValue}>{project.startDate}</Text>
              </View>
              <View style={styles.dateItem}>
                <Text style={styles.dateLabel}>Deadline</Text>
                <Text style={styles.dateValue}>{project.deadline}</Text>
              </View>
              <View style={styles.dateItem}>
                <Text style={styles.dateLabel}>Last Activity</Text>
                <Text style={styles.dateValue}>{project.lastActivity}</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => navigation.navigate('ProjectDetail', { 
                  project: project,
                  projectId: project.id
                })}
              >
                <Ionicons name="eye" size={18} color="#2241DD" />
                <Text style={styles.actionButtonText}>View</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => navigation.navigate('TakeReading', { 
                  project: project,
                  projectId: project.id
                })}
              >
                <Ionicons name="radio" size={18} color="#2241DD" />
                <Text style={styles.actionButtonText}>Take Reading</Text>
              </TouchableOpacity>
            </View>
            
            {/* Second Row of Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => navigation.navigate('DeviceConfiguration', { 
                  project: project,
                  projectId: project.id
                })}
              >
                <Ionicons name="settings" size={18} color="#2241DD" />
                <Text style={styles.actionButtonText}>Configuration</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => navigation.navigate('SendData', { 
                  project: project,
                  projectId: project.id
                })}
              >
                <Ionicons name="cloud-upload" size={18} color="#2241DD" />
                <Text style={styles.actionButtonText}>Send Data</Text>
              </TouchableOpacity>
            </View>
          </Card>
          </TouchableOpacity>
          ))
        ) : (
          <Card style={styles.emptyStateCard}>
            <View style={styles.emptyStateContent}>
              <Ionicons 
                name={searchQuery.length > 0 ? "search" : "folder-open"} 
                size={48} 
                color="#9CA3AF" 
              />
              <Text style={styles.emptyStateTitle}>
                {searchQuery.length > 0 ? 'No projects found' : 'No projects available'}
              </Text>
              <Text style={styles.emptyStateSubtitle}>
                {searchQuery.length > 0 
                  ? `No projects match "${searchQuery}" in ${activeFilter === 'all' ? 'all projects' : activeFilter + ' projects'}`
                  : 'There are no projects to display at the moment'
                }
              </Text>
              {searchQuery.length > 0 && (
                <TouchableOpacity 
                  style={styles.clearSearchButton}
                  onPress={() => setSearchQuery('')}
                >
                  <Text style={styles.clearSearchButtonText}>Clear Search</Text>
                </TouchableOpacity>
              )}
            </View>
          </Card>
        )}


        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Add Project Modal */}
      <Modal
        visible={showAddProjectModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddProjectModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => {
                setShowAddProjectModal(false);
                resetForm();
              }}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add New Project</Text>
            <TouchableOpacity 
              style={styles.modalSaveButton}
              onPress={handleAddProject}
            >
              <Text style={styles.modalSaveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Project Title *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter project title"
                placeholderTextColor="#9CA3AF"
                value={newProject.title}
                onChangeText={(text) => setNewProject({...newProject, title: text})}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Location *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter project location"
                placeholderTextColor="#9CA3AF"
                value={newProject.location}
                onChangeText={(text) => setNewProject({...newProject, location: text})}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.formInput, styles.textAreaInput]}
                placeholder="Enter project description"
                placeholderTextColor="#9CA3AF"
                value={newProject.description}
                onChangeText={(text) => setNewProject({...newProject, description: text})}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Priority</Text>
              <View style={styles.priorityContainer}>
                {['Low', 'Medium', 'High', 'Critical'].map((priority) => (
                  <TouchableOpacity
                    key={priority}
                    style={[
                      styles.priorityOption,
                      newProject.priority === priority && styles.selectedPriorityOption
                    ]}
                    onPress={() => setNewProject({...newProject, priority})}
                  >
                    <Text style={[
                      styles.priorityOptionText,
                      newProject.priority === priority && styles.selectedPriorityOptionText
                    ]}>
                      {priority}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Start Date</Text>
              <View style={styles.dateInputContainer}>
                <TextInput
                  style={styles.dateTextInput}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor="#9CA3AF"
                  value={newProject.startDate}
                  onChangeText={(text) => setNewProject({...newProject, startDate: text})}
                />
                <TouchableOpacity 
                  style={styles.calendarButton}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Ionicons name="calendar" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Deadline</Text>
              <View style={styles.dateInputContainer}>
                <TextInput
                  style={styles.dateTextInput}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor="#9CA3AF"
                  value={newProject.deadline}
                  onChangeText={(text) => setNewProject({...newProject, deadline: text})}
                />
                <TouchableOpacity 
                  style={styles.calendarButton}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Ionicons name="calendar" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Sensors Section */}
            <View style={styles.formGroup}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Sensors ({newProject.sensors?.length || 0})</Text>
                <TouchableOpacity 
                  style={styles.circularAddButton}
                  onPress={() => setShowSensorModal(true)}
                >
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              {newProject.sensors && newProject.sensors.length > 0 ? (
                <View style={styles.listContainer}>
                  {newProject.sensors.map((sensor) => (
                    <View key={sensor.id} style={styles.listItem}>
                      <View style={styles.listItemContent}>
                        <Text style={styles.listItemTitle}>{sensor.name}</Text>
                        <Text style={styles.listItemSubtitle}>{sensor.type} • {sensor.location}</Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.removeButton}
                        onPress={() => removeSensor(sensor.id)}
                      >
                        <Ionicons name="close" size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>No sensors added yet</Text>
              )}
            </View>

            {/* Members Section */}
            <View style={styles.formGroup}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Team Members ({newProject.members?.length || 0})</Text>
                <TouchableOpacity 
                  style={styles.circularAddButton}
                  onPress={() => setShowMemberModal(true)}
                >
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              {newProject.members && newProject.members.length > 0 ? (
                <View style={styles.listContainer}>
                  {newProject.members.map((member) => (
                    <View key={member.id} style={styles.listItem}>
                      <View style={styles.listItemContent}>
                        <Text style={styles.listItemTitle}>{member.name}</Text>
                        <Text style={styles.listItemSubtitle}>{member.role} • {member.email}</Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.removeButton}
                        onPress={() => removeMember(member.id)}
                      >
                        <Ionicons name="close" size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>No members added yet</Text>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Date Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={newProject.startDate ? new Date(newProject.startDate.split('/').reverse().join('-')) : new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => handleDateChange(event, selectedDate, 'start')}
        />
      )}
      
      {showEndDatePicker && (
        <DateTimePicker
          value={newProject.deadline ? new Date(newProject.deadline.split('/').reverse().join('-')) : new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => handleDateChange(event, selectedDate, 'end')}
        />
      )}

      {/* Add Sensor Modal */}
      <Modal
        visible={showSensorModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSensorModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowSensorModal(false)}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Sensor</Text>
            <TouchableOpacity 
              style={styles.modalSaveButton}
              onPress={addSensor}
            >
              <Text style={styles.modalSaveButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Sensor Name *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter sensor name"
                placeholderTextColor="#9CA3AF"
                value={newSensor.name}
                onChangeText={(text) => setNewSensor({...newSensor, name: text})}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Sensor Type *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g., Temperature, Pressure, Vibration"
                placeholderTextColor="#9CA3AF"
                value={newSensor.type}
                onChangeText={(text) => setNewSensor({...newSensor, type: text})}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Location</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Sensor installation location"
                placeholderTextColor="#9CA3AF"
                value={newSensor.location}
                onChangeText={(text) => setNewSensor({...newSensor, location: text})}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Add Member Modal */}
      <Modal
        visible={showMemberModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMemberModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Team Member</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowMemberModal(false)}
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
                onPress={() => setShowMemberModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={addMember}
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
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  circularAddButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2241DD',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2241DD',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterTabsContainer: {
    flexDirection: 'row',
    marginTop: 6,
    marginBottom: 6,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 4,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  activeFilterTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterTabText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginRight: 6,
  },
  activeFilterTabText: {
    color: '#2241DD',
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  filterTabCount: {
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  activeFilterTabCount: {
    backgroundColor: '#2241DD',
  },
  filterTabCountText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
  },
  activeFilterTabCountText: {
    color: '#FFFFFF',
  },
  projectCard: {
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
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  projectInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  projectTitle: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  projectLocation: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#2241DD',
    marginBottom: 6,
  },
  projectDescription: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#374151',
    lineHeight: 22,
  },
  projectStatus: {
    alignItems: 'flex-end',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 6,
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
  },
  progressSection: {
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 8,
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
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingVertical: 12,
    borderTopWidth: 2,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginHorizontal: -4,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  metricText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginLeft: 8,
  },
  datesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  dateItem: {
    flex: 1,
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 4,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    marginHorizontal: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#2241DD',
    marginLeft: 6,
  },
  bottomSpacing: {
    height: Spacing.xl,
  },
  // Search Bar Styles
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
    paddingVertical: 4,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  // Search Results Info
  searchResultsInfo: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchResultsText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    textAlign: 'center',
  },
  // Empty State
  emptyStateCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  emptyStateContent: {
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  clearSearchButton: {
    backgroundColor: '#2241DD',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  clearSearchButtonText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderBottomWidth: 0,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    fontFamily: 'Inter-ExtraBold',
    color: '#0F172A',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 20,
    letterSpacing: 0.5,
  },
  modalSaveButton: {
    backgroundColor: '#2241DD',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: '#2241DD',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#1D4ED8',
  },
  modalSaveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  formLabel: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
    backgroundColor: '#FAFBFC',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  textAreaInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  priorityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  priorityOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  selectedPriorityOption: {
    backgroundColor: '#2241DD',
    borderColor: '#1D4ED8',
    shadowColor: '#2241DD',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  priorityOptionText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#64748B',
  },
  selectedPriorityOptionText: {
    color: '#FFFFFF',
  },
  // Date Input Styles
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    backgroundColor: '#FAFBFC',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  dateTextInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
  },
  calendarButton: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderLeftWidth: 1,
    borderLeftColor: '#E5E7EB',
  },
  // Section Header Styles
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: '#0F172A',
    letterSpacing: 0.3,
  },
  // List Styles
  listContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    marginTop: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
    marginBottom: 4,
  },
  listItemSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 28,
    fontStyle: 'italic',
  },
  // Enhanced Member Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
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
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
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
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
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
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  selectedRoleOption: {
    backgroundColor: '#2241DD',
    borderColor: '#2241DD',
  },
  roleOptionText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
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
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  selectedPermissionOption: {
    backgroundColor: '#F0F9FF',
    borderColor: '#2241DD',
  },
  permissionOptionText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginLeft: 8,
  },
  selectedPermissionOptionText: {
    color: '#2241DD',
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
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  addButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#2241DD',
    alignItems: 'center',
    shadowColor: '#2241DD',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#1D4ED8',
  },
  circularAddButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2241DD',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2241DD',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});

export default ProjectManagementScreen;