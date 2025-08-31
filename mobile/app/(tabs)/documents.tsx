import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function DocumentsScreen() {
  const recentFiles = [
    {
      id: '1',
      name: 'Kitchen Plans v3.pdf',
      type: 'pdf',
      size: '2.4 MB',
      project: 'Johnson Kitchen',
      modified: '2 hours ago',
      thumbnail: null,
    },
    {
      id: '2',
      name: 'Progress Photo - Drywall',
      type: 'image',
      size: '1.8 MB',
      project: 'Miller Bathroom',
      modified: '5 hours ago',
      thumbnail: 'https://via.placeholder.com/60x60/E5E7EB/6B7280?text=IMG',
    },
    {
      id: '3',
      name: 'Electrical Permit',
      type: 'pdf',
      size: '890 KB',
      project: 'Johnson Kitchen',
      modified: '1 day ago',
      thumbnail: null,
    },
    {
      id: '4',
      name: 'Before Photo - Kitchen',
      type: 'image',
      size: '2.1 MB',
      project: 'Johnson Kitchen',
      modified: '3 days ago',
      thumbnail: 'https://via.placeholder.com/60x60/E5E7EB/6B7280?text=IMG',
    },
  ];

  const folderStats = [
    { type: 'Plans', count: 12, icon: 'document-outline', color: '#2563EB' },
    { type: 'Photos', count: 48, icon: 'camera-outline', color: '#059669' },
    { type: 'Permits', count: 6, icon: 'shield-checkmark-outline', color: '#DC2626' },
    { type: 'Contracts', count: 3, icon: 'clipboard-outline', color: '#7C3AED' },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Quick Upload */}
      <View style={styles.uploadSection}>
        <TouchableOpacity style={styles.uploadButton}>
          <Ionicons name="camera" size={24} color="#FFFFFF" />
          <Text style={styles.uploadButtonText}>Take Photo</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.uploadButton}>
          <Ionicons name="document" size={24} color="#FFFFFF" />
          <Text style={styles.uploadButtonText}>Upload File</Text>
        </TouchableOpacity>
      </View>

      {/* Document Stats */}
      <View style={styles.statsContainer}>
        {folderStats.map((stat) => (
          <TouchableOpacity key={stat.type} style={styles.statCard}>
            <Ionicons name={stat.icon as any} size={24} color={stat.color} />
            <Text style={styles.statCount}>{stat.count}</Text>
            <Text style={styles.statLabel}>{stat.type}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Files */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Files</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        {recentFiles.map((file) => (
          <TouchableOpacity key={file.id} style={styles.fileCard}>
            <View style={styles.fileIcon}>
              {file.type === 'image' && file.thumbnail ? (
                <Image source={{ uri: file.thumbnail }} style={styles.thumbnail} />
              ) : (
                <Ionicons 
                  name={file.type === 'pdf' ? 'document-text-outline' : 'image-outline'} 
                  size={24} 
                  color={file.type === 'pdf' ? '#DC2626' : '#059669'} 
                />
              )}
            </View>
            
            <View style={styles.fileInfo}>
              <Text style={styles.fileName}>{file.name}</Text>
              <Text style={styles.fileProject}>{file.project}</Text>
              <View style={styles.fileMetaRow}>
                <Text style={styles.fileSize}>{file.size}</Text>
                <Text style={styles.fileModified}>{file.modified}</Text>
              </View>
            </View>
            
            <TouchableOpacity style={styles.fileMenu}>
              <Ionicons name="ellipsis-vertical" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity style={styles.actionCard}>
          <Ionicons name="search-outline" size={24} color="#2563EB" />
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Search Documents</Text>
            <Text style={styles.actionDescription}>Find files by name, project, or type</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard}>
          <Ionicons name="cloud-upload-outline" size={24} color="#059669" />
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Bulk Upload</Text>
            <Text style={styles.actionDescription}>Upload multiple files at once</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard}>
          <Ionicons name="folder-outline" size={24} color="#7C3AED" />
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Organize by Project</Text>
            <Text style={styles.actionDescription}>View files organized by project</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
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
  uploadSection: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  uploadButton: {
    flex: 1,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  uploadButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
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
  statCount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  seeAllText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
  },
  fileCard: {
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
  fileIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  fileProject: {
    fontSize: 14,
    color: '#2563EB',
    marginBottom: 4,
  },
  fileMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fileSize: {
    fontSize: 12,
    color: '#6B7280',
  },
  fileModified: {
    fontSize: 12,
    color: '#6B7280',
  },
  fileMenu: {
    padding: 8,
  },
  actionCard: {
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
  actionContent: {
    flex: 1,
    marginLeft: 16,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
});