import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ProjectsScreen() {
  const projects = [
    {
      id: '1',
      name: 'Johnson Kitchen Remodel',
      client: 'John & Sarah Johnson',
      status: 'active',
      progress: 65,
      dueDate: '2025-03-15',
      address: '123 Main St, Richmond',
    },
    {
      id: '2',
      name: 'Miller Bathroom Renovation',
      client: 'Mike Miller',
      status: 'active',
      progress: 30,
      dueDate: '2025-04-01',
      address: '456 Oak Ave, Midlothian',
    },
    {
      id: '3',
      name: 'Davis Deck Construction',
      client: 'Emily Davis',
      status: 'planning',
      progress: 10,
      dueDate: '2025-05-20',
      address: '789 Pine Rd, Glen Allen',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>3</Text>
          <Text style={styles.summaryLabel}>Active Projects</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>2</Text>
          <Text style={styles.summaryLabel}>Due This Month</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>$45K</Text>
          <Text style={styles.summaryLabel}>Total Value</Text>
        </View>
      </View>

      {/* Projects List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Projects</Text>
        {projects.map((project) => (
          <TouchableOpacity key={project.id} style={styles.projectCard}>
            <View style={styles.projectHeader}>
              <Text style={styles.projectName}>{project.name}</Text>
              <View style={[styles.statusBadge, 
                project.status === 'active' ? styles.activeStatus : styles.planningStatus
              ]}>
                <Text style={[styles.statusText,
                  project.status === 'active' ? styles.activeText : styles.planningText
                ]}>{project.status}</Text>
              </View>
            </View>
            
            <Text style={styles.clientName}>{project.client}</Text>
            <Text style={styles.address}>{project.address}</Text>
            
            <View style={styles.progressContainer}>
              <Text style={styles.progressLabel}>Progress: {project.progress}%</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${project.progress}%` }]} />
              </View>
            </View>

            <View style={styles.projectFooter}>
              <View style={styles.dueDateContainer}>
                <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                <Text style={styles.dueDate}>Due: {project.dueDate}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="add-circle-outline" size={24} color="#2563EB" />
          <Text style={styles.actionButtonText}>Create New Project</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="camera-outline" size={24} color="#059669" />
          <Text style={styles.actionButtonText}>Log Daily Progress</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="people-outline" size={24} color="#7C3AED" />
          <Text style={styles.actionButtonText}>Schedule Team Meeting</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2563EB',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  projectCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeStatus: {
    backgroundColor: '#D1FAE5',
  },
  planningStatus: {
    backgroundColor: '#DBEAFE',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  activeText: {
    color: '#065F46',
  },
  planningText: {
    color: '#1E40AF',
  },
  clientName: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 3,
  },
  projectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueDate: {
    marginLeft: 6,
    fontSize: 14,
    color: '#6B7280',
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
});