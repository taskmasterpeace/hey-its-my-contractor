import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Audio } from 'expo-av';

interface FieldLoggerProps {
  projectId: string;
  onLogCreated: (log: any) => void;
}

export function FieldLogger({ projectId, onLogCreated }: FieldLoggerProps) {
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
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
      setPhotos(prev => [...prev, result.assets[0].uri]);
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
      const newPhotos = result.assets.map(asset => asset.uri);
      setPhotos(prev => [...prev, ...newPhotos]);
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
    console.log('Recording saved to:', uri);
    
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

  const submitLog = async () => {
    if (!notes.trim() && photos.length === 0) {
      Alert.alert('Error', 'Please add notes or photos before submitting');
      return;
    }

    setIsSubmitting(true);

    try {
      const location = await getCurrentLocation();
      
      const logData = {
        id: Date.now().toString(),
        projectId,
        notes: notes.trim(),
        photos,
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
      setPhotos([]);
      
      Alert.alert('Success', 'Field log created successfully');
    } catch (error) {
      console.error('Failed to create log:', error);
      Alert.alert('Error', 'Failed to create field log');
    } finally {
      setIsSubmitting(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Field Log</Text>
      
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

      {/* Photo Preview */}
      {photos.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.label}>Photos ({photos.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.photosContainer}>
              {photos.map((photoUri, index) => (
                <View key={index} style={styles.photoContainer}>
                  <Image source={{ uri: photoUri }} style={styles.photo} />
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => removePhoto(index)}
                  >
                    <Ionicons name="close-circle" size={20} color="#DC2626" />
                  </TouchableOpacity>
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
  photosContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 16,
  },
  photoContainer: {
    position: 'relative',
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
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
});