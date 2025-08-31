'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { 
  Layers, 
  Plus, 
  Minus, 
  RotateCcw, 
  Eye, 
  EyeOff, 
  Move, 
  Square, 
  Circle,
  X,
  Wand2,
  Copy,
  Palette,
  Brush,
  Home,
  Settings,
  Target,
  Zap,
  CheckCircle
} from 'lucide-react';
import { GoogleImageResult } from './ImageSearchInterface';
import { LibraryImage } from './ImageLibrary';

export interface MixingLayer {
  id: string;
  image: GoogleImageResult | LibraryImage;
  opacity: number; // 0-100
  blendMode: 'normal' | 'multiply' | 'overlay' | 'soft-light' | 'hard-light' | 'screen' | 'color-burn' | 'color-dodge';
  maskType: 'none' | 'rectangular' | 'circular' | 'custom';
  position: { x: number; y: number };
  scale: number; // 0.1-3.0
  rotation: number; // 0-360
  visible: boolean;
  locked: boolean;
  feature: string; // e.g., "window trim", "flooring", "cabinets"
}

export interface MixingPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'architectural' | 'interior' | 'exterior' | 'materials';
  prompt: string;
  defaultLayers: Partial<MixingLayer>[];
}

interface ReferenceImageMixerProps {
  baseImage: GoogleImageResult | LibraryImage;
  referenceImages: (GoogleImageResult | LibraryImage)[];
  onMixComplete: (layers: MixingLayer[], prompt: string) => void;
  onClose: () => void;
  className?: string;
}

const MIXING_PRESETS: MixingPreset[] = [
  {
    id: 'trim-entire-house',
    name: 'Apply Trim Style',
    description: 'Add this window/door trim to entire house',
    icon: '🪟',
    category: 'exterior',
    prompt: 'Apply this trim and molding style to all windows and doors throughout the house exterior',
    defaultLayers: [
      { opacity: 85, blendMode: 'multiply', feature: 'window trim' },
      { opacity: 75, blendMode: 'overlay', feature: 'door trim' }
    ]
  },
  {
    id: 'flooring-throughout',
    name: 'Extend Flooring',
    description: 'Apply this flooring throughout the space',
    icon: '🏠',
    category: 'interior',
    prompt: 'Replace all flooring in this room with the reference flooring material and pattern',
    defaultLayers: [
      { opacity: 90, blendMode: 'multiply', feature: 'flooring' }
    ]
  },
  {
    id: 'cabinet-style',
    name: 'Cabinet Makeover',
    description: 'Apply cabinet style and hardware',
    icon: '🗄️',
    category: 'interior',
    prompt: 'Transform all cabinets to match the reference style, hardware, and color',
    defaultLayers: [
      { opacity: 80, blendMode: 'multiply', feature: 'cabinet doors' },
      { opacity: 95, blendMode: 'normal', feature: 'cabinet hardware' }
    ]
  },
  {
    id: 'paint-scheme',
    name: 'Color Scheme',
    description: 'Apply color palette throughout',
    icon: '🎨',
    category: 'interior',
    prompt: 'Apply this color scheme and paint colors throughout the entire space',
    defaultLayers: [
      { opacity: 70, blendMode: 'color-burn', feature: 'wall color' },
      { opacity: 60, blendMode: 'overlay', feature: 'accent colors' }
    ]
  },
  {
    id: 'lighting-fixtures',
    name: 'Lighting Update',
    description: 'Replace all lighting fixtures',
    icon: '💡',
    category: 'interior',
    prompt: 'Replace all lighting fixtures with this style throughout the space',
    defaultLayers: [
      { opacity: 95, blendMode: 'normal', feature: 'light fixtures' }
    ]
  },
  {
    id: 'siding-material',
    name: 'Siding Makeover',
    description: 'Apply siding material to exterior',
    icon: '🏘️',
    category: 'exterior',
    prompt: 'Replace exterior siding with this material and color throughout the house',
    defaultLayers: [
      { opacity: 85, blendMode: 'multiply', feature: 'exterior siding' }
    ]
  },
  {
    id: 'countertop-style',
    name: 'Countertop Upgrade',
    description: 'Apply countertop material everywhere',
    icon: '⬜',
    category: 'interior',
    prompt: 'Replace all countertops with this material and edge profile',
    defaultLayers: [
      { opacity: 90, blendMode: 'multiply', feature: 'countertops' }
    ]
  },
  {
    id: 'roofing-material',
    name: 'Roofing Update',
    description: 'Apply roofing material and color',
    icon: '🏠',
    category: 'exterior',
    prompt: 'Replace roofing material with this style and color',
    defaultLayers: [
      { opacity: 88, blendMode: 'multiply', feature: 'roofing' }
    ]
  }
];

const BLEND_MODES = [
  { value: 'normal', name: 'Normal', description: 'Standard overlay' },
  { value: 'multiply', name: 'Multiply', description: 'Darkens, good for materials' },
  { value: 'overlay', name: 'Overlay', description: 'Enhances contrast' },
  { value: 'soft-light', name: 'Soft Light', description: 'Subtle enhancement' },
  { value: 'hard-light', name: 'Hard Light', description: 'Strong enhancement' },
  { value: 'screen', name: 'Screen', description: 'Lightens and brightens' },
  { value: 'color-burn', name: 'Color Burn', description: 'Darkens colors' },
  { value: 'color-dodge', name: 'Color Dodge', description: 'Lightens colors' }
];

export function ReferenceImageMixer({
  baseImage,
  referenceImages,
  onMixComplete,
  onClose,
  className = ''
}: ReferenceImageMixerProps) {
  const [layers, setLayers] = useState<MixingLayer[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [previewMode, setPreviewMode] = useState<'layers' | 'composite'>('composite');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Initialize layers from reference images
  const initializeLayers = useCallback((preset?: MixingPreset) => {
    const newLayers: MixingLayer[] = referenceImages.map((image, index) => ({
      id: `layer-${Date.now()}-${index}`,
      image,
      opacity: preset?.defaultLayers[index]?.opacity || 80,
      blendMode: preset?.defaultLayers[index]?.blendMode || 'multiply',
      maskType: 'none',
      position: { x: 0, y: 0 },
      scale: 1.0,
      rotation: 0,
      visible: true,
      locked: false,
      feature: preset?.defaultLayers[index]?.feature || `reference-${index + 1}`
    }));
    
    setLayers(newLayers);
    if (preset) {
      setCustomPrompt(preset.prompt);
    }
  }, [referenceImages]);

  const updateLayer = useCallback((layerId: string, updates: Partial<MixingLayer>) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, ...updates } : layer
    ));
  }, []);

  const duplicateLayer = useCallback((layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (layer) {
      const duplicatedLayer: MixingLayer = {
        ...layer,
        id: `layer-${Date.now()}`,
        feature: `${layer.feature} (copy)`
      };
      setLayers(prev => [...prev, duplicatedLayer]);
    }
  }, [layers]);

  const deleteLayer = useCallback((layerId: string) => {
    setLayers(prev => prev.filter(l => l.id !== layerId));
    if (selectedLayer === layerId) {
      setSelectedLayer(null);
    }
  }, [selectedLayer]);

  const reorderLayer = useCallback((layerId: string, direction: 'up' | 'down') => {
    setLayers(prev => {
      const index = prev.findIndex(l => l.id === layerId);
      if (index === -1) return prev;
      
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      
      const newLayers = [...prev];
      [newLayers[index], newLayers[newIndex]] = [newLayers[newIndex], newLayers[index]];
      return newLayers;
    });
  }, []);

  const applyPreset = useCallback((preset: MixingPreset) => {
    setSelectedPreset(preset.id);
    initializeLayers(preset);
  }, [initializeLayers]);

  const finalPrompt = useMemo(() => {
    const presetPrompt = selectedPreset 
      ? MIXING_PRESETS.find(p => p.id === selectedPreset)?.prompt || ''
      : '';
    
    const layerDescriptions = layers
      .filter(l => l.visible)
      .map(l => `${l.feature} (${l.opacity}% opacity)`)
      .join(', ');
    
    return customPrompt || 
           (presetPrompt && layerDescriptions 
            ? `${presetPrompt}. Mixing elements: ${layerDescriptions}`
            : layerDescriptions);
  }, [selectedPreset, customPrompt, layers]);

  // Group presets by category
  const presetsByCategory = useMemo(() => {
    const categories: Record<string, MixingPreset[]> = {};
    MIXING_PRESETS.forEach(preset => {
      if (!categories[preset.category]) {
        categories[preset.category] = [];
      }
      categories[preset.category].push(preset);
    });
    return categories;
  }, []);

  // Initialize with first preset if none selected
  React.useEffect(() => {
    if (layers.length === 0 && referenceImages.length > 0) {
      initializeLayers();
    }
  }, [referenceImages, layers.length, initializeLayers]);

  return (
    <div className={`reference-image-mixer bg-white rounded-lg shadow-lg max-w-6xl w-full max-h-[90vh] overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <Layers className="w-5 h-5 mr-2 text-purple-600" />
          Reference Image Mixer
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex flex-col lg:flex-row h-[calc(90vh-80px)]">
        {/* Left Panel - Controls */}
        <div className="lg:w-1/3 border-r flex flex-col">
          {/* Preset Templates */}
          <div className="p-4 border-b">
            <h3 className="font-medium text-gray-900 mb-3">Quick Presets</h3>
            <div className="space-y-3">
              {Object.entries(presetsByCategory).map(([category, presets]) => (
                <div key={category}>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    {category.replace('_', ' ')}
                  </p>
                  <div className="grid grid-cols-1 gap-1">
                    {presets.map(preset => (
                      <button
                        key={preset.id}
                        onClick={() => applyPreset(preset)}
                        className={`text-left p-2 rounded text-sm hover:bg-gray-50 transition-colors ${
                          selectedPreset === preset.id ? 'bg-purple-50 border border-purple-200' : 'border border-transparent'
                        }`}
                      >
                        <div className="flex items-center">
                          <span className="text-lg mr-2">{preset.icon}</span>
                          <div>
                            <div className="font-medium text-gray-900">{preset.name}</div>
                            <div className="text-xs text-gray-600">{preset.description}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Layers Panel */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">Mixing Layers</h3>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setPreviewMode(previewMode === 'layers' ? 'composite' : 'layers')}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                    title={previewMode === 'layers' ? 'Show composite' : 'Show layers'}
                  >
                    {previewMode === 'layers' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {layers.map((layer, index) => (
                  <div
                    key={layer.id}
                    className={`border rounded-lg p-3 ${
                      selectedLayer === layer.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <button
                          onClick={() => updateLayer(layer.id, { visible: !layer.visible })}
                          className={`mr-2 p-1 rounded ${
                            layer.visible ? 'text-green-600' : 'text-gray-400'
                          }`}
                        >
                          {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <div
                          className="cursor-pointer"
                          onClick={() => setSelectedLayer(layer.id === selectedLayer ? null : layer.id)}
                        >
                          <p className="text-sm font-medium text-gray-900">{layer.feature}</p>
                          <p className="text-xs text-gray-500">{layer.blendMode} • {layer.opacity}%</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => reorderLayer(layer.id, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => reorderLayer(layer.id, 'down')}
                          disabled={index === layers.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => duplicateLayer(layer.id)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="Duplicate layer"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => deleteLayer(layer.id)}
                          className="p-1 text-red-400 hover:text-red-600"
                          title="Delete layer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Layer thumbnail */}
                    <img
                      src={'thumbnailUrl' in layer.image ? layer.image.thumbnailUrl : layer.image.url}
                      alt={layer.feature}
                      className="w-full h-12 object-cover rounded mb-2"
                    />

                    {/* Layer controls */}
                    {selectedLayer === layer.id && (
                      <div className="space-y-2 border-t pt-2">
                        {/* Opacity */}
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Opacity: {layer.opacity}%
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={layer.opacity}
                            onChange={(e) => updateLayer(layer.id, { opacity: parseInt(e.target.value) })}
                            className="w-full h-1 bg-gray-200 rounded-lg"
                          />
                        </div>

                        {/* Blend Mode */}
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Blend Mode</label>
                          <select
                            value={layer.blendMode}
                            onChange={(e) => updateLayer(layer.id, { blendMode: e.target.value as any })}
                            className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                          >
                            {BLEND_MODES.map(mode => (
                              <option key={mode.value} value={mode.value}>
                                {mode.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Feature Name */}
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Feature Name</label>
                          <input
                            type="text"
                            value={layer.feature}
                            onChange={(e) => updateLayer(layer.id, { feature: e.target.value })}
                            className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                            placeholder="e.g., window trim, flooring"
                          />
                        </div>

                        {showAdvanced && (
                          <>
                            {/* Scale */}
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">
                                Scale: {Math.round(layer.scale * 100)}%
                              </label>
                              <input
                                type="range"
                                min="0.1"
                                max="3.0"
                                step="0.1"
                                value={layer.scale}
                                onChange={(e) => updateLayer(layer.id, { scale: parseFloat(e.target.value) })}
                                className="w-full h-1 bg-gray-200 rounded-lg"
                              />
                            </div>

                            {/* Rotation */}
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">
                                Rotation: {layer.rotation}°
                              </label>
                              <input
                                type="range"
                                min="0"
                                max="360"
                                value={layer.rotation}
                                onChange={(e) => updateLayer(layer.id, { rotation: parseInt(e.target.value) })}
                                className="w-full h-1 bg-gray-200 rounded-lg"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Advanced Controls Toggle */}
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="mt-3 text-xs text-gray-600 hover:text-gray-900 flex items-center"
              >
                <Settings className="w-3 h-3 mr-1" />
                {showAdvanced ? 'Hide' : 'Show'} Advanced
              </button>
            </div>
          </div>

          {/* Prompt Section */}
          <div className="p-4 border-t">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Custom Prompt (Optional)
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Override with custom instructions..."
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to use auto-generated prompt
            </p>
          </div>

          {/* Action Buttons */}
          <div className="p-4 border-t">
            <button
              onClick={() => onMixComplete(layers, finalPrompt)}
              disabled={layers.filter(l => l.visible).length === 0}
              className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              <div className="flex items-center justify-center">
                <Wand2 className="w-4 h-4 mr-2" />
                Apply Mixing ({layers.filter(l => l.visible).length} layers)
              </div>
            </button>
            <p className="text-xs text-gray-500 text-center mt-2">
              This will send your mixed layers to AI processing
            </p>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="lg:w-2/3 flex flex-col">
          {/* Preview Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Preview</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Base Image:</span>
                <span className="text-sm font-medium text-gray-900">{baseImage.title}</span>
              </div>
            </div>
          </div>

          {/* Preview Area */}
          <div className="flex-1 p-4 bg-gray-50 overflow-auto">
            <div className="max-w-2xl mx-auto">
              {/* Base Image */}
              <div className="relative bg-white rounded-lg shadow-sm overflow-hidden mb-4">
                <img
                  src={baseImage.url}
                  alt="Base image"
                  className="w-full h-auto"
                />
                <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                  Base Image
                </div>
              </div>

              {/* Layer Previews */}
              {previewMode === 'layers' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {layers.filter(l => l.visible).map(layer => (
                    <div key={layer.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                      <img
                        src={'thumbnailUrl' in layer.image ? layer.image.thumbnailUrl : layer.image.url}
                        alt={layer.feature}
                        className="w-full h-32 object-cover"
                        style={{
                          opacity: layer.opacity / 100,
                          transform: `scale(${layer.scale}) rotate(${layer.rotation}deg)`
                        }}
                      />
                      <div className="p-2">
                        <p className="text-xs font-medium text-gray-900">{layer.feature}</p>
                        <p className="text-xs text-gray-500">
                          {layer.blendMode} • {layer.opacity}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Composite Preview Simulation */}
              {previewMode === 'composite' && (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="relative">
                    <img
                      src={baseImage.url}
                      alt="Composite preview"
                      className="w-full h-auto"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center">
                      <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 text-center">
                        <Target className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          Composite Preview
                        </p>
                        <p className="text-xs text-gray-600 mb-3">
                          AI will blend {layers.filter(l => l.visible).length} reference layers
                        </p>
                        <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Ready for AI processing</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Final Prompt Preview */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-1">AI Prompt:</p>
                <p className="text-sm text-blue-700 italic">"{finalPrompt}"</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReferenceImageMixer;