import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CalendarScreen() {
  const upcomingEvents = [
    {
      id: '1',
      title: 'Client Meeting - Johnson Kitchen',
      time: '9:00 AM',
      type: 'meeting',
      status: 'confirmed',
    },
    {
      id: '2',
      title: 'Site Inspection - Bathroom Remodel',
      time: '2:00 PM',
      type: 'inspection',
      status: 'pending',
    },
    {
      id: '3',
      title: 'Material Delivery - Tiles',
      time: '4:00 PM',
      type: 'delivery',
      status: 'confirmed',
    },
  ];

  const quickActions = [
    {
      id: '1',
      title: 'Start Meeting',
      icon: 'videocam-outline',
      color: '#2563EB',
    },
    {
      id: '2',
      title: 'Progress Update',
      icon: 'camera-outline',
      color: '#059669',
    },
    {
      id: '3',
      title: 'Research',
      icon: 'search-outline',
      color: '#7C3AED',
    },
    {
      id: '4',
      title: 'Send Invoice',
      icon: 'card-outline',
      color: '#DC2626',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Weather Widget */}
      <View style={styles.weatherCard}>
        <View style={styles.weatherContent}>
          <Ionicons name="sunny" size={24} color="#F59E0B" />
          <Text style={styles.weatherText}>72°F - Perfect for outdoor work</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity key={action.id} style={styles.actionCard}>
              <Ionicons name={action.icon as any} size={24} color={action.color} />
              <Text style={styles.actionText}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Today's Schedule */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Schedule</Text>
        {upcomingEvents.map((event) => (
          <TouchableOpacity key={event.id} style={styles.eventCard}>
            <View style={styles.eventTime}>
              <Text style={styles.timeText}>{event.time}</Text>
            </View>
            <View style={styles.eventContent}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <View style={styles.eventMeta}>
                <View style={[styles.statusBadge, 
                  event.status === 'confirmed' ? styles.confirmed : styles.pending
                ]}>
                  <Text style={[styles.statusText,
                    event.status === 'confirmed' ? styles.confirmedText : styles.pendingText
                  ]}>{event.status}</Text>
                </View>
                <Ionicons 
                  name={
                    event.type === 'meeting' ? 'people-outline' :
                    event.type === 'inspection' ? 'checkmark-circle-outline' :
                    'cube-outline'
                  } 
                  size={16} 
                  color="#6B7280" 
                />
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Project Status Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Projects</Text>
        <View style={styles.projectCard}>
          <View style={styles.projectHeader}>
            <Text style={styles.projectTitle}>Johnson Kitchen Remodel</Text>
            <Text style={styles.projectProgress}>65% Complete</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '65%' }]} />
          </View>
          <Text style={styles.projectNext}>Next: Electrical Inspection (Tomorrow)</Text>
        </View>

        <View style={styles.projectCard}>
          <View style={styles.projectHeader}>
            <Text style={styles.projectTitle}>Miller Bathroom</Text>
            <Text style={styles.projectProgress}>30% Complete</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '30%' }]} />
          </View>
          <Text style={styles.projectNext}>Next: Plumbing Rough-in (Friday)</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  weatherCard: {
    backgroundColor: '#FEF3C7',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  weatherContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
    color: '#92400E',
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
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
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
  actionText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  eventCard: {
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
  eventTime: {
    width: 80,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  eventContent: {
    flex: 1,
    marginLeft: 12,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  confirmed: {
    backgroundColor: '#D1FAE5',
  },
  pending: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  confirmedText: {
    color: '#065F46',
  },
  pendingText: {
    color: '#92400E',
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
    alignItems: 'center',
    marginBottom: 8,
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  projectProgress: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2563EB',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 2,
  },
  projectNext: {
    fontSize: 14,
    color: '#6B7280',
  },
});