'use client';

import React, { useState, useCallback, useRef } from 'react';
import { 
  Sparkles, 
  Wand2, 
  Image as ImageIcon, 
  Upload, 
  X, 
  Plus, 
  Minus, 
  RotateCcw, 
  Download, 
  Share, 
  Eye, 
  Layers,
  Palette,
  Zap,
  Settings,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { GoogleImageResult } from './ImageSearchInterface';
import { LibraryImage } from './ImageLibrary';

export interface AIEditRequest {
  baseImage: {
    url: string;
    id: string;
    source: 'search' | 'library' | 'upload';
  };
  referenceImages?: {
    url: string;
    id: string;
    weight: number; // 0.1 to 1.0
    description?: string;
  }[];
  prompt: string;
  style?: 'photorealistic' | 'architectural' | 'artistic' | 'professional' | 'sketch';
  strength: number; // 0.1 to 1.0
  preserveStructure: boolean;
  seed?: number;
  steps: number; // 10-50
  guidance: number; // 1-20
}

export interface AIEditResult {
  id: string;
  originalImageId: string;
  editedImageUrl: string;
  prompt: string;
  referenceImages: string[];
  metadata: {
    model: 'nano-banana-v2' | 'nano-banana-pro';
    processingTime: number;
    settings: AIEditRequest;
    confidence: number;
    watermarkApplied: boolean;
  };
  createdAt: string;
}

interface AIMagicWandProps {
  baseImage: GoogleImageResult | LibraryImage;
  referenceImages?: (GoogleImageResult | LibraryImage)[];
  onEditComplete: (result: AIEditResult) => void;
  onClose: () => void;
  companySettings?: {
    name: string;
    logo?: string;
    watermarkEnabled: boolean;
    brandColors: string[];
  };
  className?: string;
}

const STYLE_PRESETS = {
  photorealistic: {
    name: 'Photorealistic',
    description: 'Natural, photo-like results',
    icon: '📷',
    defaultStrength: 0.7
  },
  architectural: {
    name: 'Architectural',
    description: 'Clean, professional building shots',
    icon: '🏛️',
    defaultStrength: 0.8
  },
  artistic: {
    name: 'Artistic',
    description: 'Creative, stylized interpretation',
    icon: '🎨',
    defaultStrength: 0.9
  },
  professional: {
    name: 'Professional',
    description: 'Business-ready, polished look',
    icon: '💼',
    defaultStrength: 0.6
  },
  sketch: {
    name: 'Sketch',
    description: 'Hand-drawn, blueprint style',
    icon: '✏️',
    defaultStrength: 0.8
  }
};

const QUICK_PROMPTS = [
  'Make this look more professional and polished',
  'Add this trim/molding style to the entire room',
  'Apply this color scheme throughout',
  'Replace the flooring with this style',
  'Update the lighting to match this fixture',
  'Change the cabinet hardware to this style',
  'Apply this paint color to the walls',
  'Replace windows with this style',
  'Update the countertops to this material',
  'Add this tile pattern to the backsplash'
];

const CONTRACTOR_PROMPTS = [
  'Show the completed renovation with these finishes',
  'Visualize this room with updated fixtures',
  'Apply these materials to create a before/after view',
  'Transform this space using reference styling',
  'Create a professional presentation image',
  'Show potential client what finished project looks like'
];

export function AIMagicWand({
  baseImage,
  referenceImages = [],
  onEditComplete,
  onClose,
  companySettings,
  className = ''
}: AIMagicWandProps) {
  const [editRequest, setEditRequest] = useState<AIEditRequest>({
    baseImage: {
      url: baseImage.url,
      id: baseImage.id,
      source: 'thumbnailUrl' in baseImage ? 'search' : 'library'
    },
    referenceImages: referenceImages.map((img, idx) => ({
      url: img.url,
      id: img.id,
      weight: 0.8 - (idx * 0.1), // Decreasing weight for multiple references
      description: img.title
    })),
    prompt: '',
    style: 'professional',
    strength: STYLE_PRESETS.professional.defaultStrength,
    preserveStructure: true,
    steps: 25,
    guidance: 7.5
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [previewMode, setPreviewMode] = useState<'single' | 'comparison'>('single');
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState<'setup' | 'processing' | 'result'>('setup');
  const [result, setResult] = useState<AIEditResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      const newRef = {
        url: imageUrl,
        id: `upload-${Date.now()}`,
        weight: 0.8,
        description: 'Uploaded reference'
      };

      setEditRequest(prev => ({
        ...prev,
        referenceImages: [...(prev.referenceImages || []), newRef]
      }));
    };
    reader.readAsDataURL(file);
  }, []);

  const updateReferenceWeight = useCallback((imageId: string, weight: number) => {
    setEditRequest(prev => ({
      ...prev,
      referenceImages: prev.referenceImages?.map(ref =>
        ref.id === imageId ? { ...ref, weight } : ref
      )
    }));
  }, []);

  const removeReference = useCallback((imageId: string) => {
    setEditRequest(prev => ({
      ...prev,
      referenceImages: prev.referenceImages?.filter(ref => ref.id !== imageId)
    }));
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!editRequest.prompt.trim()) return;

    setIsProcessing(true);
    setStep('processing');
    setProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 20;
        });
      }, 500);

      // Simulate API call to Nano Banana
      await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));

      clearInterval(progressInterval);
      setProgress(100);

      // Mock result - in real implementation, this would be the API response
      const mockResult: AIEditResult = {
        id: `ai-edit-${Date.now()}`,
        originalImageId: baseImage.id,
        editedImageUrl: `${baseImage.url}?ai-edited=${Date.now()}`,
        prompt: editRequest.prompt,
        referenceImages: editRequest.referenceImages?.map(ref => ref.id) || [],
        metadata: {
          model: 'nano-banana-pro',
          processingTime: Date.now() - Date.now(),
          settings: editRequest,
          confidence: 85 + Math.random() * 15,
          watermarkApplied: companySettings?.watermarkEnabled || false
        },
        createdAt: new Date().toISOString()
      };

      setResult(mockResult);
      setStep('result');

      // Auto-save to library with watermark if enabled
      if (companySettings?.watermarkEnabled) {
        // In real implementation, watermark would be applied server-side
        console.log('Watermark applied with company branding');
      }

    } catch (error) {
      console.error('AI edit failed:', error);
      setIsProcessing(false);
      setStep('setup');
    } finally {
      setIsProcessing(false);
    }
  }, [editRequest, baseImage, companySettings]);

  const handleComplete = useCallback(() => {
    if (result) {
      onEditComplete(result);
    }
  }, [result, onEditComplete]);

  const insertPromptTemplate = useCallback((template: string) => {
    setEditRequest(prev => ({
      ...prev,
      prompt: prev.prompt ? `${prev.prompt} ${template}` : template
    }));
  }, []);

  if (step === 'processing') {
    return (
      <div className={`ai-magic-wand-processing bg-white rounded-lg shadow-lg ${className}`}>
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white animate-pulse" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">AI Magic in Progress</h3>
          <p className="text-gray-600 mb-6">Creating your professional image transformation...</p>
          
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div 
              className="bg-gradient-to-r from-purple-600 to-pink-600 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-500">{Math.round(progress)}% complete</p>
          
          <div className="mt-6 text-xs text-gray-400">
            <p>Using Nano Banana Pro model</p>
            <p>Processing with {editRequest.referenceImages?.length || 0} reference images</p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'result' && result) {
    return (
      <div className={`ai-magic-wand-result bg-white rounded-lg shadow-lg ${className}`}>
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
            AI Edit Complete
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Before/After Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700 mb-2">Original</p>
              <img 
                src={baseImage.url} 
                alt="Original" 
                className="w-full rounded-lg shadow-sm max-h-64 object-cover mx-auto"
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700 mb-2">AI Enhanced</p>
              <div className="relative">
                <img 
                  src={result.editedImageUrl} 
                  alt="AI Enhanced" 
                  className="w-full rounded-lg shadow-sm max-h-64 object-cover mx-auto"
                />
                {companySettings?.watermarkApplied && (
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                    {companySettings.name}
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-purple-600 text-white px-2 py-1 rounded-full text-xs flex items-center">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI Generated
                </div>
              </div>
            </div>
          </div>

          {/* Edit Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Edit Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Prompt:</span>
                <p className="text-gray-600 mt-1">"{result.prompt}"</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Style:</span>
                <p className="text-gray-600 mt-1">{STYLE_PRESETS[editRequest.style!].name}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Processing Time:</span>
                <p className="text-gray-600 mt-1">{(result.metadata.processingTime / 1000).toFixed(1)}s</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Confidence:</span>
                <p className="text-gray-600 mt-1">{Math.round(result.metadata.confidence)}%</p>
              </div>
              {result.referenceImages.length > 0 && (
                <div className="md:col-span-2">
                  <span className="font-medium text-gray-700">Reference Images:</span>
                  <p className="text-gray-600 mt-1">{result.referenceImages.length} image(s) used for mixing</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={handleComplete}
              className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              <Download className="w-4 h-4 mr-2" />
              Save to Library
            </button>
            
            <button
              onClick={() => {
                navigator.share?.({
                  title: 'AI Enhanced Image',
                  text: `Check out this AI-enhanced image: "${result.prompt}"`,
                  url: result.editedImageUrl
                });
              }}
              className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Share className="w-4 h-4 mr-2" />
              Share Result
            </button>
            
            <button
              onClick={() => {
                setResult(null);
                setStep('setup');
              }}
              className="flex items-center justify-center px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Edit Again
            </button>
          </div>

          {/* Watermark Info */}
          {companySettings?.watermarkEnabled && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center text-sm text-blue-800">
                <Sparkles className="w-4 h-4 mr-2" />
                <span>Professional watermark applied with {companySettings.name} branding</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Setup/Edit Interface
  return (
    <div className={`ai-magic-wand bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <Wand2 className="w-5 h-5 mr-2 text-purple-600" />
          AI Magic Wand
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="p-6">
        {/* Base Image */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Base Image</h3>
          <div className="flex items-start space-x-4">
            <img
              src={baseImage.url}
              alt={baseImage.title}
              className="w-32 h-32 object-cover rounded-lg shadow-sm"
            />
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{baseImage.title}</h4>
              <p className="text-sm text-gray-600 mt-1">
                {'width' in baseImage ? `${baseImage.width}×${baseImage.height}` : 'Library image'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                This will be your starting point for AI enhancement
              </p>
            </div>
          </div>
        </div>

        {/* Reference Images for Mixing */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium text-gray-900">Reference Images</h3>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Reference
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          
          {editRequest.referenceImages && editRequest.referenceImages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {editRequest.referenceImages.map((ref) => (
                <div key={ref.id} className="border rounded-lg p-3">
                  <div className="flex items-start space-x-3">
                    <img
                      src={ref.url}
                      alt={ref.description || 'Reference'}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {ref.description || 'Reference Image'}
                      </p>
                      <div className="mt-2">
                        <label className="block text-xs text-gray-600 mb-1">
                          Influence Weight: {Math.round(ref.weight * 100)}%
                        </label>
                        <input
                          type="range"
                          min="0.1"
                          max="1.0"
                          step="0.1"
                          value={ref.weight}
                          onChange={(e) => updateReferenceWeight(ref.id, parseFloat(e.target.value))}
                          className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                      <button
                        onClick={() => removeReference(ref.id)}
                        className="mt-2 text-xs text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
              <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                Add reference images to guide the AI transformation
              </p>
              <p className="text-xs text-gray-500">
                Perfect for "apply this style to my image" scenarios
              </p>
            </div>
          )}
        </div>

        {/* AI Prompt */}
        <div className="mb-6">
          <label className="block text-lg font-medium text-gray-900 mb-3">
            Describe Your Vision
          </label>
          <textarea
            value={editRequest.prompt}
            onChange={(e) => setEditRequest(prev => ({ ...prev, prompt: e.target.value }))}
            placeholder="Describe how you want the AI to transform this image..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
          
          {/* Quick Prompt Suggestions */}
          <div className="mt-3">
            <p className="text-sm text-gray-600 mb-2">💡 Quick suggestions:</p>
            <div className="space-y-2">
              <div>
                <p className="text-xs font-medium text-gray-700 mb-1">General:</p>
                <div className="flex flex-wrap gap-1">
                  {QUICK_PROMPTS.slice(0, 5).map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => insertPromptTemplate(prompt)}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-700 mb-1">Contractor-specific:</p>
                <div className="flex flex-wrap gap-1">
                  {CONTRACTOR_PROMPTS.slice(0, 3).map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => insertPromptTemplate(prompt)}
                      className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs hover:bg-purple-200 transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Style Presets */}
        <div className="mb-6">
          <label className="block text-lg font-medium text-gray-900 mb-3">Style</label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(STYLE_PRESETS).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => setEditRequest(prev => ({ 
                  ...prev, 
                  style: key as keyof typeof STYLE_PRESETS,
                  strength: preset.defaultStrength
                }))}
                className={`p-3 rounded-lg border text-center transition-colors ${
                  editRequest.style === key
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="text-2xl mb-1">{preset.icon}</div>
                <div className="text-sm font-medium">{preset.name}</div>
                <div className="text-xs text-gray-500 mt-1">{preset.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="mb-6">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Settings className="w-4 h-4 mr-2" />
            Advanced Settings
            {showAdvanced ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
          </button>

          {showAdvanced && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Edit Strength: {Math.round(editRequest.strength * 100)}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  value={editRequest.strength}
                  onChange={(e) => setEditRequest(prev => ({ ...prev, strength: parseFloat(e.target.value) }))}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">How much the AI should change the original</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quality Steps: {editRequest.steps}
                </label>
                <input
                  type="range"
                  min="10"
                  max="50"
                  step="5"
                  value={editRequest.steps}
                  onChange={(e) => setEditRequest(prev => ({ ...prev, steps: parseInt(e.target.value) }))}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">More steps = higher quality, slower processing</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Guidance: {editRequest.guidance}
                </label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="0.5"
                  value={editRequest.guidance}
                  onChange={(e) => setEditRequest(prev => ({ ...prev, guidance: parseFloat(e.target.value) }))}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">How closely to follow the prompt</p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="preserveStructure"
                  checked={editRequest.preserveStructure}
                  onChange={(e) => setEditRequest(prev => ({ ...prev, preserveStructure: e.target.checked }))}
                  className="mr-2"
                />
                <label htmlFor="preserveStructure" className="text-sm text-gray-700">
                  Preserve image structure
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Company Watermark Settings */}
        {companySettings && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Company Branding</h4>
                <p className="text-sm text-gray-600">
                  {companySettings.watermarkEnabled 
                    ? `${companySettings.name} watermark will be applied`
                    : 'Watermark disabled'}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {companySettings.brandColors.map((color, index) => (
                  <div
                    key={index}
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Generate Button */}
        <div className="text-center">
          <button
            onClick={handleGenerate}
            disabled={isProcessing || !editRequest.prompt.trim()}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            <div className="flex items-center">
              <Zap className="w-5 h-5 mr-2" />
              {isProcessing ? 'Generating Magic...' : 'Generate AI Magic'}
            </div>
          </button>
          {editRequest.referenceImages && editRequest.referenceImages.length > 0 && (
            <p className="text-sm text-gray-600 mt-2">
              Mixing with {editRequest.referenceImages.length} reference image(s)
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AIMagicWand;