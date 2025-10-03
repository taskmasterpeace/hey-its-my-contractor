'use client';

import { useState, useRef } from 'react';
import { WeatherData } from '@contractor-platform/types';
import { Camera, Mic, MapPin, Send, Upload, X, Play, Pause, Square, Cloud } from 'lucide-react';

interface FieldLogFormProps {
  projects: Array<{ id: string; name: string; address: string }>;
  selectedProject: string;
  onProjectChange: (projectId: string) => void;
  onCreateLog: (logData: {
    project_id: string;
    notes: string;
    media: File[];
  }) => void;
  currentWeather?: WeatherData | null;
  currentLocation?: { lat: number; lon: number } | null;
}

export function FieldLogForm({ 
  projects, 
  selectedProject, 
  onProjectChange, 
  onCreateLog,
  currentWeather,
  currentLocation 
}: FieldLogFormProps) {
  const [notes, setNotes] = useState('');
  const [media, setMedia] = useState<File[]>([]);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProject || (!notes.trim() && media.length === 0)) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onCreateLog({
        project_id: selectedProject,
        notes: notes.trim(),
        media,
      });
      
      // Reset form
      setNotes('');
      setMedia([]);
    } catch (error) {
      console.error('Failed to create log:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files).filter(file => 
        file.type.startsWith('image/') || 
        file.type.startsWith('audio/') || 
        file.type.startsWith('video/')
      );
      setMedia(prev => [...prev, ...newFiles]);
    }
  };

  const removeMedia = (index: number) => {
    setMedia(prev => prev.filter((_, i) => i !== index));
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      const audioChunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const audioFile = new File([audioBlob], `voice-note-${Date.now()}.wav`, {
          type: 'audio/wav',
        });
        setMedia(prev => [...prev, audioFile]);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecordingVoice(true);
      setRecordingDuration(0);
      
      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Failed to start voice recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecordingVoice(false);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Create Field Log</h2>
        <p className="text-gray-600">
          Document your daily progress with photos, voice notes, and automatic weather data
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Project Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project *
          </label>
          <select
            value={selectedProject}
            onChange={(e) => onProjectChange(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a project</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name} - {project.address}
              </option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Progress Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe the work completed, any issues encountered, next steps..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Media Capture */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Photos & Voice Notes
          </label>
          
          <div className="flex items-center space-x-3 mb-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <Camera className="w-4 h-4 mr-2" />
              Add Photos
            </button>
            
            {!isRecordingVoice ? (
              <button
                type="button"
                onClick={startVoiceRecording}
                className="flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
              >
                <Mic className="w-4 h-4 mr-2" />
                Voice Note
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <div className="flex items-center px-3 py-2 bg-red-100 text-red-700 rounded-lg">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2" />
                  <span className="text-sm font-medium">
                    {formatDuration(recordingDuration)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={stopVoiceRecording}
                  className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Square className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Media Preview */}
          {media.length > 0 && (
            <div className="space-y-2">
              {media.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                  <div className="flex items-center min-w-0 flex-1">
                    {file.type.startsWith('image/') ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-12 h-12 object-cover rounded mr-3"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center mr-3">
                        <Mic className="w-5 h-5 text-gray-500" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMedia(index)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,audio/*,video/*"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
        </div>

        {/* Location & Weather Info */}
        {(currentLocation || currentWeather) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Auto-Captured Data</h3>
            <div className="text-sm text-blue-800 space-y-1">
              {currentLocation && (
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>Location: {currentLocation.lat.toFixed(4)}, {currentLocation.lon.toFixed(4)}</span>
                </div>
              )}
              {currentWeather && (
                <div className="flex items-center">
                  <Cloud className="w-4 h-4 mr-2" />
                  <span>
                    Weather: {currentWeather.current.temperature}°F, {currentWeather.current.conditions}, 
                    {currentWeather.current.humidity}% humidity
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!selectedProject || (!notes.trim() && media.length === 0) || isSubmitting}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              !selectedProject || (!notes.trim() && media.length === 0) || isSubmitting
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Creating Log...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Create Field Log</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Tips */}
      <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-medium text-green-900 mb-2">📝 Field Log Tips</h4>
        <ul className="text-sm text-green-800 space-y-1">
          <li>• Take photos before, during, and after major work phases</li>
          <li>• Use voice notes for detailed observations while hands are dirty</li>
          <li>• Weather data is automatically captured for insurance purposes</li>
          <li>• GPS location helps track which site you were working on</li>
          <li>• Logs are automatically shared with project stakeholders</li>
        </ul>
      </div>
    </div>
  );
}