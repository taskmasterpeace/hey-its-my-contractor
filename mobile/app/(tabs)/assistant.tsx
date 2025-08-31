import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AssistantScreen() {
  const quickPrompts = [
    {
      id: '1',
      title: 'Find suppliers',
      description: 'Search for local material suppliers',
      icon: 'business-outline',
      color: '#2563EB',
    },
    {
      id: '2',
      title: 'Check codes',
      description: 'Look up building codes and regulations',
      icon: 'library-outline',
      color: '#059669',
    },
    {
      id: '3',
      title: 'Weather forecast',
      description: 'Get 7-day weather for project planning',
      icon: 'partly-sunny-outline',
      color: '#F59E0B',
    },
    {
      id: '4',
      title: 'Calculate materials',
      description: 'Estimate quantities and costs',
      icon: 'calculator-outline',
      color: '#7C3AED',
    },
  ];

  const recentQueries = [
    {
      id: '1',
      question: 'Local tile suppliers in Richmond area',
      timestamp: '2 hours ago',
      result: 'Found 8 suppliers with pricing',
    },
    {
      id: '2',
      question: 'Virginia electrical code for kitchen outlets',
      timestamp: '1 day ago',
      result: 'GFCI required within 6 feet of sink',
    },
    {
      id: '3',
      question: 'Drywall quantity for 12x14 room',
      timestamp: '2 days ago',
      result: '14 sheets of 4x8 drywall needed',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* AI Assistant Header */}
      <View style={styles.headerCard}>
        <View style={styles.aiIcon}>
          <Ionicons name="sparkles" size={32} color="#2563EB" />
        </View>
        <Text style={styles.headerTitle}>AI Research Assistant</Text>
        <Text style={styles.headerDescription}>
          Get instant answers about suppliers, building codes, materials, and more
        </Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color="#6B7280" />
          <Text style={styles.searchPlaceholder}>Ask anything about your project...</Text>
        </View>
        <TouchableOpacity style={styles.voiceButton}>
          <Ionicons name="mic-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Quick Prompts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Prompts</Text>
        <View style={styles.promptsGrid}>
          {quickPrompts.map((prompt) => (
            <TouchableOpacity key={prompt.id} style={styles.promptCard}>
              <View style={[styles.promptIcon, { backgroundColor: `${prompt.color}15` }]}>
                <Ionicons name={prompt.icon as any} size={24} color={prompt.color} />
              </View>
              <Text style={styles.promptTitle}>{prompt.title}</Text>
              <Text style={styles.promptDescription}>{prompt.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Queries */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Queries</Text>
        {recentQueries.map((query) => (
          <TouchableOpacity key={query.id} style={styles.queryCard}>
            <View style={styles.queryContent}>
              <Text style={styles.queryQuestion}>{query.question}</Text>
              <Text style={styles.queryResult}>{query.result}</Text>
              <Text style={styles.queryTimestamp}>{query.timestamp}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Features */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Features</Text>
        
        <View style={styles.featureCard}>
          <Ionicons name="link-outline" size={24} color="#2563EB" />
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Cited Sources</Text>
            <Text style={styles.featureDescription}>
              All answers include reliable sources and citations
            </Text>
          </View>
        </View>

        <View style={styles.featureCard}>
          <Ionicons name="location-outline" size={24} color="#059669" />
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Local Focus</Text>
            <Text style={styles.featureDescription}>
              Results prioritize your local area and regulations
            </Text>
          </View>
        </View>

        <View style={styles.featureCard}>
          <Ionicons name="save-outline" size={24} color="#7C3AED" />
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Project Integration</Text>
            <Text style={styles.featureDescription}>
              Save research directly to your projects
            </Text>
          </View>
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
  headerCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  aiIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  headerDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchPlaceholder: {
    marginLeft: 12,
    fontSize: 16,
    color: '#9CA3AF',
    flex: 1,
  },
  voiceButton: {
    width: 52,
    height: 52,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  promptsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  promptCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  promptIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  promptTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  promptDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
  queryCard: {
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
  queryContent: {
    flex: 1,
  },
  queryQuestion: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  queryResult: {
    fontSize: 14,
    color: '#059669',
    marginBottom: 4,
  },
  queryTimestamp: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  featureCard: {
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
  featureContent: {
    marginLeft: 16,
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
});