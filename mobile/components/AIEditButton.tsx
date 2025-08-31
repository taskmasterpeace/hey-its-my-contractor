import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  Image,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
  PanResponder,
  Vibration
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface EditResult {
  originalImageId: string;
  editedImageUrl: string;
  editedImageId: string;
  prompt: string;
  metadata: {
    editType: 'enhance' | 'modify' | 'generate';
    processingTime: number;
    confidence: number;
    aiGenerated: boolean;
  };
}

interface AIEditButtonProps {
  imageUrl: string;
  imageId: string;
  context: 'chat' | 'field-log' | 'document' | 'calendar';
  size?: 'sm' | 'md' | 'lg';
  position?: 'overlay' | 'adjacent';
  onEditStart?: (imageId: string) => void;
  onEditComplete?: (result: EditResult, action: 'replace' | 'keep-both') => void;
  disabled?: boolean;
  style?: any;
}

export function AIEditButton({
  imageUrl,
  imageId,
  context,
  size = 'md',
  position = 'overlay',
  onEditStart,
  onEditComplete,
  disabled = false,
  style
}: AIEditButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const sizes = {
    sm: { width: 32, height: 32, iconSize: 16 },
    md: { width: 44, height: 44, iconSize: 20 },
    lg: { width: 56, height: 56, iconSize: 24 }
  };

  const currentSize = sizes[size];

  const handlePress = async () => {
    if (disabled || isProcessing) return;

    // Trigger haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    onEditStart?.(imageId);
    setShowEditModal(true);
  };

  const handleEditComplete = (result: EditResult, action: 'replace' | 'keep-both') => {
    setShowEditModal(false);
    onEditComplete?.(result, action);
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.button,
          {
            width: currentSize.width,
            height: currentSize.height,
            opacity: disabled ? 0.6 : 1,
          },
          position === 'overlay' ? styles.overlayPosition : styles.adjacentPosition,
          style
        ]}
        onPress={handlePress}
        disabled={disabled || isProcessing}
        activeOpacity={0.8}
      >
        <View style={styles.buttonGradient}>
          {isProcessing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <View style={styles.buttonContent}>
              <Ionicons name="sparkles" size={currentSize.iconSize} color="#FFFFFF" />
              {size === 'lg' && <Text style={styles.buttonText}>AI</Text>}
            </View>
          )}
        </View>
      </TouchableOpacity>

      <AIImageEditorModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        imageUrl={imageUrl}
        imageId={imageId}
        context={context}
        onSave={handleEditComplete}
        setIsProcessing={setIsProcessing}
      />
    </>
  );
}

interface AIImageEditorModalProps {
  visible: boolean;
  onClose: () => void;
  imageUrl: string;
  imageId: string;
  context: 'chat' | 'field-log' | 'document' | 'calendar';
  onSave: (result: EditResult, action: 'replace' | 'keep-both') => void;
  setIsProcessing: (processing: boolean) => void;
}

function AIImageEditorModal({
  visible,
  onClose,
  imageUrl,
  imageId,
  context,
  onSave,
  setIsProcessing
}: AIImageEditorModalProps) {
  const [prompt, setPrompt] = useState('');
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [processingTime, setProcessingTime] = useState(0);
  const [isProcessing, setIsProcessingLocal] = useState(false);

  // Animation for processing state
  const spinValue = new Animated.Value(0);
  const scaleValue = new Animated.Value(0);

  // Comparison slider for before/after
  const sliderValue = new Animated.Value(0.5);
  
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (evt) => {
      const x = evt.nativeEvent.locationX;
      const percentage = Math.max(0, Math.min(1, x / SCREEN_WIDTH));
      sliderValue.setValue(percentage);
    },
    onPanResponderRelease: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  });

  const quickPrompts = getContextPrompts(context);

  const startProcessingAnimation = () => {
    // Spinning animation for processing
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();

    // Scale animation for modal appearance
    Animated.spring(scaleValue, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsProcessingLocal(true);
    setIsProcessing(true);
    setError(null);
    const startTime = Date.now();

    // Start animations
    startProcessingAnimation();

    // Haptic pattern for processing start
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      // Simulate API call - in real implementation, this would call Nano Banana API
      await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));
      
      const result: EditResult = {
        originalImageId: imageId,
        editedImageUrl: `${imageUrl}?edited=${Date.now()}`,
        editedImageId: `edited-${imageId}-${Date.now()}`,
        prompt,
        metadata: {
          editType: 'modify',
          processingTime: Date.now() - startTime,
          confidence: 85 + Math.random() * 15,
          aiGenerated: true
        }
      };

      setEditedImageUrl(result.editedImageUrl);
      setShowComparison(true);
      setProcessingTime(result.metadata.processingTime);

      // Success haptic
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    } catch (err) {
      setError('Failed to edit image. Please try again.');
      // Error haptic
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsProcessingLocal(false);
      setIsProcessing(false);
      spinValue.stopAnimation();
    }
  };

  const handleSave = async (action: 'replace' | 'keep-both') => {
    if (!editedImageUrl) return;

    // Strong haptic for save action
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    const result: EditResult = {
      originalImageId: imageId,
      editedImageUrl,
      editedImageId: `edited-${imageId}-${Date.now()}`,
      prompt,
      metadata: {
        editType: 'modify',
        processingTime,
        confidence: 90,
        aiGenerated: true
      }
    };

    onSave(result, action);
  };

  const handleDiscard = () => {
    setEditedImageUrl(null);
    setShowComparison(false);
    setPrompt('');
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
    >
      <BlurView intensity={80} style={styles.modalContainer}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.title}>AI Photo Editor</Text>
            <View style={styles.sparkleIcon}>
              <Ionicons name="sparkles" size={20} color="#8B5CF6" />
            </View>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {isProcessing ? (
              // Processing State
              <View style={styles.processingContainer}>
                <Animated.View
                  style={[
                    styles.processingIcon,
                    {
                      transform: [
                        { rotate: spin },
                        { scale: scaleValue }
                      ]
                    }
                  ]}
                >
                  <View style={styles.processingIconInner}>
                    <Ionicons name="sparkles" size={32} color="#FFFFFF" />
                  </View>
                </Animated.View>

                <Text style={styles.processingTitle}>AI is editing your photo</Text>
                <Text style={styles.processingSubtitle}>
                  Using Nano Banana AI: "{prompt}"
                </Text>

                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <Animated.View style={[styles.progressFill, { width: '75%' }]} />
                  </View>
                  <Text style={styles.estimatedTime}>Estimated time: 3-5s</Text>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    setIsProcessingLocal(false);
                    setIsProcessing(false);
                    spinValue.stopAnimation();
                  }}
                  style={styles.cancelButton}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : !showComparison ? (
              // Edit Interface
              <View style={styles.editInterface}>
                <Text style={styles.sectionTitle}>Original Image</Text>
                <View style={styles.imageContainer}>
                  <Image source={{ uri: imageUrl }} style={styles.originalImage} />
                </View>

                <Text style={styles.sectionTitle}>Describe your edit:</Text>
                <TextInput
                  value={prompt}
                  onChangeText={setPrompt}
                  placeholder="e.g., Remove the background and make it more professional"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                  style={styles.promptInput}
                />

                <Text style={styles.suggestionTitle}>💡 Quick suggestions:</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.suggestionScroll}
                >
                  <View style={styles.suggestionContainer}>
                    {quickPrompts.map((suggestion, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => setPrompt(suggestion)}
                        style={styles.suggestionChip}
                      >
                        <Text style={styles.suggestionText}>{suggestion}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                {error && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="warning" size={16} color="#EF4444" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <TouchableOpacity
                  onPress={handleGenerate}
                  disabled={!prompt.trim()}
                  style={[
                    styles.generateButton,
                    { opacity: prompt.trim() ? 1 : 0.5 }
                  ]}
                >
                  <Ionicons name="sparkles" size={20} color="#FFFFFF" />
                  <Text style={styles.generateButtonText}>Generate AI Edit</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // Comparison & Save Interface
              <View style={styles.comparisonInterface}>
                <Text style={styles.sectionTitle}>Before & After</Text>
                
                {/* Interactive Before/After Slider */}
                <View style={styles.comparisonContainer} {...panResponder.panHandlers}>
                  <View style={styles.imageComparison}>
                    <Image source={{ uri: imageUrl }} style={styles.comparisonImage} />
                    <Animated.View
                      style={[
                        styles.comparisonOverlay,
                        {
                          width: sliderValue.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%']
                          })
                        }
                      ]}
                    >
                      <Image source={{ uri: editedImageUrl }} style={styles.comparisonImage} />
                    </Animated.View>
                    
                    <Animated.View
                      style={[
                        styles.sliderHandle,
                        {
                          left: sliderValue.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['-10px', `${SCREEN_WIDTH - 40}px`]
                          })
                        }
                      ]}
                    >
                      <View style={styles.sliderLine} />
                      <View style={styles.sliderCircle}>
                        <Ionicons name="resize" size={12} color="#FFFFFF" />
                      </View>
                    </Animated.View>
                  </View>
                  
                  <View style={styles.comparisonLabels}>
                    <Text style={styles.comparisonLabel}>Original</Text>
                    <Text style={[styles.comparisonLabel, styles.aiGeneratedLabel]}>
                      ✨ AI Edited
                    </Text>
                  </View>
                </View>

                {/* Edit Details */}
                <View style={styles.editDetails}>
                  <Text style={styles.detailsTitle}>Edit Details</Text>
                  <Text style={styles.detailsText}>Prompt: "{prompt}"</Text>
                  <Text style={styles.detailsText}>
                    Processing time: {Math.round(processingTime / 1000)}s
                  </Text>
                  <Text style={styles.detailsText}>Confidence: 92%</Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    onPress={() => handleSave('replace')}
                    style={[styles.actionButton, styles.replaceButton]}
                  >
                    <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Replace</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => handleSave('keep-both')}
                    style={[styles.actionButton, styles.keepBothButton]}
                  >
                    <Ionicons name="duplicate" size={20} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Keep Both</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={handleDiscard} style={styles.discardButton}>
                  <Text style={styles.discardButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </BlurView>
    </Modal>
  );
}

function getContextPrompts(context: string): string[] {
  const basePrompts = [
    'Remove background',
    'Enhance colors',
    'Make brighter',
    'Sharpen image'
  ];

  const contextPrompts = {
    'field-log': [
      'Clean up site',
      'Remove workers',
      'Better lighting',
      'Professional look'
    ],
    'chat': [
      'More professional',
      'Better quality',
      'Remove clutter',
      'Good for sharing'
    ],
    'document': [
      'Remove shadows',
      'Straighten page',
      'Better contrast',
      'Clear text'
    ],
    'calendar': [
      'Event photo',
      'Clean background',
      'Meeting ready',
      'Professional'
    ]
  };

  return [...basePrompts, ...(contextPrompts[context] || [])];
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonGradient: {
    flex: 1,
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  overlayPosition: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
  },
  adjacentPosition: {
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.95,
    minHeight: SCREEN_HEIGHT * 0.8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  sparkleIcon: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  processingIcon: {
    width: 80,
    height: 80,
    marginBottom: 24,
  },
  processingIconInner: {
    width: 80,
    height: 80,
    backgroundColor: '#8B5CF6',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  processingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  processingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 32,
  },
  progressBar: {
    width: '80%',
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 3,
  },
  estimatedTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#6B7280',
    textDecorationLine: 'underline',
  },
  editInterface: {
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  originalImage: {
    width: SCREEN_WIDTH - 40,
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  promptInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 100,
    marginBottom: 20,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 12,
  },
  suggestionScroll: {
    marginBottom: 20,
  },
  suggestionContainer: {
    flexDirection: 'row',
    paddingRight: 20,
  },
  suggestionChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  suggestionText: {
    fontSize: 14,
    color: '#374151',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginLeft: 8,
  },
  generateButton: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  comparisonInterface: {
    paddingVertical: 20,
  },
  comparisonContainer: {
    marginBottom: 24,
  },
  imageComparison: {
    position: 'relative',
    height: 250,
    borderRadius: 12,
    overflow: 'hidden',
  },
  comparisonImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  comparisonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    overflow: 'hidden',
  },
  sliderHandle: {
    position: 'absolute',
    top: 0,
    height: '100%',
    width: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderLine: {
    width: 2,
    height: '100%',
    backgroundColor: '#FFFFFF',
    position: 'absolute',
  },
  sliderCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  comparisonLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  comparisonLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  aiGeneratedLabel: {
    color: '#8B5CF6',
    fontWeight: '500',
  },
  editDetails: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  detailsText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  replaceButton: {
    backgroundColor: '#6366F1',
  },
  keepBothButton: {
    backgroundColor: '#059669',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  discardButton: {
    alignItems: 'center',
    padding: 12,
  },
  discardButtonText: {
    fontSize: 14,
    color: '#6B7280',
    textDecorationLine: 'underline',
  },
});