import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Audio } from 'expo-av';
import { AIEditButton } from './AIEditButton';

interface EnhancedMediaFile {
  id: string;
  uri: string;
  type: 'photo' | 'audio';
  filename: string;
  aiGenerated?: boolean;
  originalImageId?: string;
  editPrompt?: string;
  editTimestamp?: string;
}

interface FieldLoggerProps {
  projectId: string;
  onLogCreated: (log: any) => void;
}

export function EnhancedFieldLogger({ projectId, onLogCreated }: FieldLoggerProps) {
  const [notes, setNotes] = useState('');
  const [media, setMedia] = useState<EnhancedMediaFile[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Camera permission is required to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const newMedia: EnhancedMediaFile = {
        id: `photo-${Date.now()}`,
        uri: result.assets[0].uri,
        type: 'photo',
        filename: result.assets[0].fileName || `photo-${Date.now()}.jpg`,
        aiGenerated: false
      };
      setMedia(prev => [...prev, newMedia]);
    }
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Photo library permission is required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const newMediaFiles = result.assets.map((asset, index) => ({
        id: `gallery-${Date.now()}-${index}`,
        uri: asset.uri,
        type: 'photo' as const,
        filename: asset.fileName || `photo-${Date.now()}-${index}.jpg`,
        aiGenerated: false
      }));
      setMedia(prev => [...prev, ...newMediaFiles]);
    }
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Audio permission is required for voice notes');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start voice recording');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });

    const uri = recording.getURI();
    if (uri) {
      const newMedia: EnhancedMediaFile = {
        id: `audio-${Date.now()}`,
        uri,
        type: 'audio',
        filename: `voice-note-${Date.now()}.wav`,
        aiGenerated: false
      };
      setMedia(prev => [...prev, newMedia]);
    }
    
    setRecording(undefined);
    Alert.alert('Success', 'Voice note recorded successfully');
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return null;
      }

      const location = await Location.getCurrentPositionAsync({});
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
      };
    } catch (error) {
      console.error('Failed to get location:', error);
      return null;
    }
  };

  const handleAIEditComplete = (index: number, result: any, action: 'replace' | 'keep-both') => {
    if (action === 'replace') {
      const updatedMedia = [...media];
      updatedMedia[index] = {
        ...updatedMedia[index],
        uri: result.editedImageUrl,
        aiGenerated: true,
        originalImageId: result.originalImageId,
        editPrompt: result.prompt,
        editTimestamp: new Date().toISOString()
      };
      setMedia(updatedMedia);
    } else {
      // Add as new photo
      const newMedia: EnhancedMediaFile = {
        id: `ai-edited-${Date.now()}`,
        uri: result.editedImageUrl,
        type: 'photo',
        filename: `ai-edited-${Date.now()}.jpg`,
        aiGenerated: true,
        originalImageId: result.originalImageId,
        editPrompt: result.prompt,
        editTimestamp: new Date().toISOString()
      };
      setMedia(prev => [...prev, newMedia]);
    }

    // Show success feedback
    Alert.alert(
      'AI Edit Complete!', 
      `Photo edited successfully: "${result.prompt}"`,
      [{ text: 'OK', style: 'default' }]
    );
  };

  const removeMedia = (index: number) => {
    Alert.alert(
      'Remove Media',
      'Are you sure you want to remove this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => setMedia(prev => prev.filter((_, i) => i !== index))
        }
      ]
    );
  };

  const submitLog = async () => {
    if (!notes.trim() && media.length === 0) {
      Alert.alert('Error', 'Please add notes or media before submitting');
      return;
    }

    setIsSubmitting(true);

    try {
      const location = await getCurrentLocation();
      
      const logData = {
        id: Date.now().toString(),
        projectId,
        notes: notes.trim(),
        media: media.map(m => ({
          id: m.id,
          uri: m.uri,
          type: m.type,
          filename: m.filename,
          aiGenerated: m.aiGenerated,
          originalImageId: m.originalImageId,
          editPrompt: m.editPrompt,
          editTimestamp: m.editTimestamp
        })),
        location,
        weather: {
          temperature: 72,
          conditions: 'Clear',
          humidity: 55,
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };

      onLogCreated(logData);
      
      // Reset form
      setNotes('');
      setMedia([]);
      
      Alert.alert('Success', 'Field log created successfully');
    } catch (error) {
      console.error('Failed to create log:', error);
      Alert.alert('Error', 'Failed to create field log');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Field Log with AI Editing</Text>
      
      {/* Notes Input */}
      <View style={styles.section}>
        <Text style={styles.label}>Progress Notes</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Describe work completed, issues, next steps..."
          multiline
          numberOfLines={4}
          style={styles.textInput}
        />
      </View>

      {/* Media Capture */}
      <View style={styles.section}>
        <Text style={styles.label}>Photos & Voice</Text>
        <View style={styles.mediaButtons}>
          <TouchableOpacity style={styles.mediaButton} onPress={takePhoto}>
            <Ionicons name="camera" size={24} color="#2563EB" />
            <Text style={styles.mediaButtonText}>Take Photo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.mediaButton} onPress={pickFromGallery}>
            <Ionicons name="images" size={24} color="#059669" />
            <Text style={styles.mediaButtonText}>Gallery</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.mediaButton, isRecording && styles.recordingButton]} 
            onPress={isRecording ? stopRecording : startRecording}
          >
            <Ionicons 
              name={isRecording ? "stop" : "mic"} 
              size={24} 
              color={isRecording ? "#DC2626" : "#7C3AED"} 
            />
            <Text style={[styles.mediaButtonText, isRecording && styles.recordingText]}>
              {isRecording ? 'Stop' : 'Voice Note'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Enhanced Media Preview with AI Editing */}
      {media.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.label}>
            Media ({media.length})
            {media.some(m => m.aiGenerated) && (
              <Text style={styles.aiCountLabel}>
                {' '}• {media.filter(m => m.aiGenerated).length} AI edited
              </Text>
            )}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.mediaContainer}>
              {media.map((mediaItem, index) => (
                <View key={mediaItem.id} style={styles.mediaItemContainer}>
                  {mediaItem.type === 'photo' ? (
                    <View style={styles.photoContainer}>
                      <Image source={{ uri: mediaItem.uri }} style={styles.photo} />
                      
                      {/* AI Generated Badge */}
                      {mediaItem.aiGenerated && (
                        <View style={styles.aiBadge}>
                          <Ionicons name="sparkles" size={10} color="#FFFFFF" />
                          <Text style={styles.aiBadgeText}>AI</Text>
                        </View>
                      )}
                      
                      {/* AI Edit Button - Only for photos */}
                      <AIEditButton
                        imageUrl={mediaItem.uri}
                        imageId={mediaItem.id}
                        context="field-log"
                        size="sm"
                        position="overlay"
                        onEditComplete={(result, action) => handleAIEditComplete(index, result, action)}
                        style={styles.aiEditButton}
                      />
                      
                      {/* Remove Button */}
                      <TouchableOpacity 
                        style={styles.removeButton}
                        onPress={() => removeMedia(index)}
                      >
                        <Ionicons name="close-circle" size={20} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    // Audio preview
                    <View style={styles.audioContainer}>
                      <Ionicons name="mic" size={32} color="#7C3AED" />
                      <Text style={styles.audioLabel}>Voice Note</Text>
                      <TouchableOpacity 
                        style={styles.audioRemoveButton}
                        onPress={() => removeMedia(index)}
                      >
                        <Ionicons name="close-circle" size={16} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Edit History Tooltip */}
                  {mediaItem.aiGenerated && mediaItem.editPrompt && (
                    <View style={styles.editTooltip}>
                      <Text style={styles.editTooltipText}>
                        "{mediaItem.editPrompt}"
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Auto-captured Data */}
      <View style={styles.section}>
        <Text style={styles.label}>Auto-captured Data</Text>
        <View style={styles.autoDataCard}>
          <View style={styles.autoDataRow}>
            <Ionicons name="time-outline" size={16} color="#6B7280" />
            <Text style={styles.autoDataText}>
              Time: {new Date().toLocaleTimeString()}
            </Text>
          </View>
          <View style={styles.autoDataRow}>
            <Ionicons name="location-outline" size={16} color="#6B7280" />
            <Text style={styles.autoDataText}>
              Location: GPS coordinates will be captured
            </Text>
          </View>
          <View style={styles.autoDataRow}>
            <Ionicons name="cloud-outline" size={16} color="#6B7280" />
            <Text style={styles.autoDataText}>
              Weather: 72°F, Clear conditions
            </Text>
          </View>
        </View>
      </View>

      {/* AI Usage Stats */}
      {media.some(m => m.aiGenerated) && (
        <View style={styles.section}>
          <View style={styles.aiStatsCard}>
            <Text style={styles.aiStatsTitle}>AI Editing Summary</Text>
            <View style={styles.aiStatsRow}>
              <Ionicons name="sparkles" size={16} color="#8B5CF6" />
              <Text style={styles.aiStatsText}>
                {media.filter(m => m.aiGenerated).length} photos enhanced with AI
              </Text>
            </View>
            <Text style={styles.aiStatsSubtext}>
              AI-edited photos are automatically tagged and saved to your project gallery
            </Text>
          </View>
        </View>
      )}

      {/* Submit Button */}
      <TouchableOpacity 
        style={[styles.submitButton, isSubmitting && styles.submittingButton]}
        onPress={submitLog}
        disabled={isSubmitting}
      >
        <Ionicons 
          name="send" 
          size={20} 
          color="#FFFFFF" 
        />
        <Text style={styles.submitButtonText}>
          {isSubmitting ? 'Creating Log...' : 'Create Field Log'}
        </Text>
      </TouchableOpacity>

      {/* AI Editing Tips */}
      <View style={styles.section}>
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>✨ AI Editing Tips</Text>
          <Text style={styles.tipsText}>
            • Tap the sparkle button on any photo to enhance it with AI{'\n'}
            • Try prompts like "remove background", "brighten image", or "professional lighting"{'\n'}
            • AI-edited photos are marked with a ✨ badge{'\n'}
            • Keep both versions or replace the original - your choice!
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  aiCountLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8B5CF6',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  mediaButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  mediaButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recordingButton: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  mediaButtonText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  recordingText: {
    color: '#DC2626',
  },
  mediaContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 16,
  },
  mediaItemContainer: {
    position: 'relative',
  },
  photoContainer: {
    position: 'relative',
    width: 120,
    height: 120,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  aiBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
  },
  aiEditButton: {
    position: 'absolute',
    top: 4,
    right: 30,
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  audioContainer: {
    width: 100,
    height: 100,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  audioLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 4,
  },
  audioRemoveButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 2,
  },
  editTooltip: {
    position: 'absolute',
    bottom: -25,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  editTooltipText: {
    color: '#FFFFFF',
    fontSize: 10,
    textAlign: 'center',
  },
  autoDataCard: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  autoDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  autoDataText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  aiStatsCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
    padding: 12,
    borderRadius: 8,
  },
  aiStatsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  aiStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  aiStatsText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  aiStatsSubtext: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
  submitButton: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 32,
  },
  submittingButton: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tipsCard: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    padding: 16,
    borderRadius: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0C4A6E',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    color: '#0369A1',
    lineHeight: 20,
  },
});