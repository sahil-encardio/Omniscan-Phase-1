import React, { createContext, useContext, useState } from 'react';

const TeamContext = createContext();

export const useTeam = () => {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
};

export const TeamProvider = ({ children }) => {
  // Store team members per project
  const [projectTeams, setProjectTeams] = useState({
    'bridge-monitoring': [
      {
        id: 1,
        name: "John Smith",
        email: "john.smith@company.com",
        role: "Project Manager",
        roleColor: "#2241DD",
        status: "online",
        lastSeen: "2 hours ago",
        projects: 5,
        permissions: 4,
        joined: "15/01/2024",
        permissionsList: ["View Data", "Edit Data", "Admin Access", "Delete Data"]
      },
      {
        id: 2,
        name: "Sarah Johnson",
        email: "sarah.johnson@company.com",
        role: "Senior Engineer",
        roleColor: "#2241DD",
        status: "online",
        lastSeen: "30 min ago",
        projects: 3,
        permissions: 3,
        joined: "20/01/2024",
        permissionsList: ["View Data", "Edit Data", "Admin Access"]
      },
      {
        id: 3,
        name: "Mike Chen",
        email: "mike.chen@company.com",
        role: "Field Technician",
        roleColor: "#2241DD",
        status: "offline",
        lastSeen: "1 day ago",
        projects: 2,
        permissions: 2,
        joined: "25/01/2024",
        permissionsList: ["View Data", "Edit Data"]
      }
    ],
    'dam-safety': [
      {
        id: 4,
        name: "Alice Wilson",
        email: "alice.wilson@company.com",
        role: "Administrator",
        roleColor: "#DC2626",
        status: "online",
        lastSeen: "1 hour ago",
        projects: 3,
        permissions: 4,
        joined: "10/01/2024",
        permissionsList: ["View Data", "Edit Data", "Admin Access", "Delete Data"]
      },
      {
        id: 5,
        name: "Bob Davis",
        email: "bob.davis@company.com",
        role: "Senior Engineer",
        roleColor: "#2241DD",
        status: "online",
        lastSeen: "45 min ago",
        projects: 2,
        permissions: 3,
        joined: "12/01/2024",
        permissionsList: ["View Data", "Edit Data", "Admin Access"]
      }
    ],
    'highway-monitoring': [
      {
        id: 6,
        name: "Carol Brown",
        email: "carol.brown@company.com",
        role: "Field Technician",
        roleColor: "#059669",
        status: "offline",
        lastSeen: "3 hours ago",
        projects: 1,
        permissions: 2,
        joined: "18/01/2024",
        permissionsList: ["View Data", "Edit Data"]
      }
    ]
  });

  const [currentProjectId, setCurrentProjectId] = useState('bridge-monitoring');

  // Get current project's team members
  const getCurrentTeamMembers = () => {
    return projectTeams[currentProjectId] || [];
  };

  // Get team members for a specific project
  const getTeamMembersByProject = (projectId) => {
    return projectTeams[projectId] || [];
  };

  // Set current project
  const setCurrentProject = (projectId) => {
    setCurrentProjectId(projectId);
  };

  const addTeamMember = (member, projectId = currentProjectId) => {
    const currentTeam = projectTeams[projectId] || [];
    const newMember = {
      ...member,
      id: Math.max(...currentTeam.map(m => m.id), 0) + 1,
      roleColor: getRoleColor(member.role),
      status: 'online',
      lastSeen: 'Just now',
      projects: 0,
      permissions: member.permissions.length,
      joined: new Date().toLocaleDateString('en-GB'),
      permissionsList: member.permissions
    };
    
    setProjectTeams(prev => ({
      ...prev,
      [projectId]: [...(prev[projectId] || []), newMember]
    }));
    return newMember;
  };

  const updateTeamMember = (id, updates, projectId = currentProjectId) => {
    setProjectTeams(prev => ({
      ...prev,
      [projectId]: (prev[projectId] || []).map(member => 
        member.id === id ? { ...member, ...updates } : member
      )
    }));
  };

  const deleteTeamMember = (id, projectId = currentProjectId) => {
    setProjectTeams(prev => ({
      ...prev,
      [projectId]: (prev[projectId] || []).filter(member => member.id !== id)
    }));
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

  const getTeamOverview = (projectId = currentProjectId) => {
    const teamMembers = projectTeams[projectId] || [];
    return {
      totalMembers: teamMembers.length,
      activeNow: teamMembers.filter(member => member.status === 'online').length,
      admins: teamMembers.filter(member => member.role === 'Administrator').length,
      pending: 0
    };
  };

  const getFilteredMembers = (filter, projectId = currentProjectId) => {
    const teamMembers = projectTeams[projectId] || [];
    switch (filter) {
      case 'Admins':
        return teamMembers.filter(member => member.role === 'Administrator');
      case 'Engineers':
        return teamMembers.filter(member => member.role === 'Senior Engineer');
      case 'Technicians':
        return teamMembers.filter(member => member.role === 'Field Technician');
      default:
        return teamMembers;
    }
  };

  const value = {
    teamMembers: getCurrentTeamMembers(),
    currentProjectId,
    setCurrentProject,
    addTeamMember,
    updateTeamMember,
    deleteTeamMember,
    getTeamOverview,
    getFilteredMembers,
    getRoleColor,
    getCurrentTeamMembers,
    getTeamMembersByProject
  };

  return (
    <TeamContext.Provider value={value}>
      {children}
    </TeamContext.Provider>
  );
};
