'use client';

import { useState } from 'react';
import { Sparkles, Edit3, Loader2 } from 'lucide-react';

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
  className?: string;
}

// Utility function for class names (simplified version)
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
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
  className 
}: AIEditButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm', 
    lg: 'w-10 h-10 text-base'
  };

  const positionClasses = {
    overlay: 'absolute top-2 right-2 z-10',
    adjacent: 'relative ml-2'
  };

  const handleClick = async () => {
    if (disabled || isProcessing) return;
    
    // Trigger haptic feedback on mobile
    if ('vibrate' in navigator && navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    onEditStart?.(imageId);
    setShowEditModal(true);
  };

  const handleEditComplete = async (result: EditResult, action: 'replace' | 'keep-both') => {
    setShowEditModal(false);
    onEditComplete?.(result, action);
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={disabled || isProcessing}
        className={cn(
          // Base styles
          'group flex items-center justify-center rounded-lg font-medium transition-all duration-200',
          'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md',
          'hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/25',
          'active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
          'disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100',
          
          // Size classes
          sizeClasses[size],
          
          // Position classes
          positionClasses[position],
          
          // Custom className
          className
        )}
        title="Edit with AI"
        aria-label="Edit image with AI"
      >
        {isProcessing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <div className="flex items-center space-x-1">
            <Sparkles className="w-4 h-4" />
            {size === 'lg' && <span className="ml-1">AI Edit</span>}
          </div>
        )}
      </button>

      {/* AI Image Editor Modal */}
      {showEditModal && (
        <AIImageEditor
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          imageUrl={imageUrl}
          imageId={imageId}
          context={context}
          onSave={handleEditComplete}
          setIsProcessing={setIsProcessing}
        />
      )}
    </>
  );
}

// AI Image Editor Modal Component
interface AIImageEditorProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  imageId: string;
  context: 'chat' | 'field-log' | 'document' | 'calendar';
  onSave: (result: EditResult, action: 'replace' | 'keep-both') => void;
  setIsProcessing: (processing: boolean) => void;
}

function AIImageEditor({ 
  isOpen, 
  onClose, 
  imageUrl, 
  imageId, 
  context, 
  onSave,
  setIsProcessing 
}: AIImageEditorProps) {
  const [prompt, setPrompt] = useState('');
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [processingTime, setProcessingTime] = useState(0);

  const quickPrompts = [
    'Remove background',
    'Enhance colors and lighting',
    'Make image brighter',
    'Sharpen and improve quality',
    'Remove unwanted objects',
    'Add professional lighting',
    'Improve weather conditions',
    'Clean up construction site'
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsProcessing(true);
    setError(null);
    const startTime = Date.now();

    try {
      // Simulate API call to Nano Banana
      await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));
      
      // Mock result - in real implementation, this would be the API response
      const result: EditResult = {
        originalImageId: imageId,
        editedImageUrl: `${imageUrl}?edited=${Date.now()}`, // Mock edited URL
        editedImageId: `edited-${imageId}-${Date.now()}`,
        prompt,
        metadata: {
          editType: 'modify',
          processingTime: Date.now() - startTime,
          confidence: 85 + Math.random() * 15, // Mock confidence 85-100%
          aiGenerated: true
        }
      };

      setEditedImageUrl(result.editedImageUrl);
      setShowComparison(true);
      setProcessingTime(result.metadata.processingTime);
    } catch (err) {
      setError('Failed to edit image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = (action: 'replace' | 'keep-both') => {
    if (!editedImageUrl) return;

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
            AI Photo Editor
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!showComparison ? (
            // Edit Interface
            <div className="space-y-6">
              {/* Original Image */}
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700 mb-2">Original Image</p>
                <img 
                  src={imageUrl} 
                  alt="Original" 
                  className="max-w-full max-h-64 mx-auto rounded-lg shadow-sm"
                />
              </div>

              {/* Prompt Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Describe the changes you want to make:
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., Remove the background and make it more professional"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Quick Prompts */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">💡 Quick suggestions:</p>
                <div className="flex flex-wrap gap-2">
                  {quickPrompts.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => setPrompt(suggestion)}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Generate Button */}
              <div className="text-center">
                <button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || setIsProcessing}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Generate AI Edit
                </button>
              </div>
            </div>
          ) : (
            // Comparison & Save Interface
            <div className="space-y-6">
              {/* Before/After Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700 mb-2">Original</p>
                  <img src={imageUrl} alt="Original" className="w-full rounded-lg shadow-sm" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700 mb-2">AI Edited</p>
                  <img src={editedImageUrl} alt="Edited" className="w-full rounded-lg shadow-sm" />
                  <div className="mt-2 flex items-center justify-center text-xs text-purple-600">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI Generated
                  </div>
                </div>
              </div>

              {/* Edit Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Edit Details</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><span className="font-medium">Prompt:</span> "{prompt}"</p>
                  <p><span className="font-medium">Processing time:</span> {Math.round(processingTime / 1000)}s</p>
                  <p><span className="font-medium">Confidence:</span> 92%</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={() => handleSave('replace')}
                  className="flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Replace Original
                </button>
                
                <button
                  onClick={() => handleSave('keep-both')}
                  className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Keep Both
                </button>
                
                <button
                  onClick={handleDiscard}
                  className="flex items-center justify-center px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}