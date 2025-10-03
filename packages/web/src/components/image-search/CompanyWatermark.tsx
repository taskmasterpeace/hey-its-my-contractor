'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Image as ImageIcon, 
  Upload, 
  Download, 
  Eye, 
  EyeOff, 
  Move, 
  RotateCcw, 
  Settings, 
  Palette, 
  Type,
  Shield,
  Star,
  X,
  Check,
  Copy,
  Zap
} from 'lucide-react';

export interface WatermarkSettings {
  enabled: boolean;
  companyName: string;
  logo?: string;
  text?: string;
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center' | 'bottom-center' | 'top-center';
  size: 'small' | 'medium' | 'large';
  opacity: number; // 0-100
  style: 'light' | 'dark' | 'outline' | 'filled' | 'glass';
  backgroundColor?: string;
  textColor: string;
  fontSize: number; // 12-32
  fontFamily: 'sans-serif' | 'serif' | 'monospace';
  rotation: number; // -45 to 45
  margin: number; // 8-48 pixels from edge
  showOnAllImages: boolean;
  showOnAIImages: boolean;
  brandColors: string[];
}

export interface WatermarkTemplate {
  id: string;
  name: string;
  description: string;
  settings: Partial<WatermarkSettings>;
  category: 'professional' | 'subtle' | 'branded' | 'custom';
  preview: string;
}

interface CompanyWatermarkProps {
  currentSettings: WatermarkSettings;
  onSettingsChange: (settings: WatermarkSettings) => void;
  companyInfo?: {
    name: string;
    logo?: string;
    brandColors: string[];
    website?: string;
    phone?: string;
  };
  previewImage?: string;
  className?: string;
}

const WATERMARK_TEMPLATES: WatermarkTemplate[] = [
  {
    id: 'professional-corner',
    name: 'Professional Corner',
    description: 'Clean company name in bottom right',
    category: 'professional',
    preview: '🏢',
    settings: {
      position: 'bottom-right',
      size: 'medium',
      opacity: 80,
      style: 'filled',
      backgroundColor: '#000000',
      textColor: '#FFFFFF',
      fontSize: 14,
      fontFamily: 'sans-serif',
      margin: 16,
      showOnAIImages: true
    }
  },
  {
    id: 'subtle-overlay',
    name: 'Subtle Overlay',
    description: 'Light watermark across image',
    category: 'subtle',
    preview: '👻',
    settings: {
      position: 'center',
      size: 'large',
      opacity: 15,
      style: 'outline',
      textColor: '#FFFFFF',
      fontSize: 24,
      fontFamily: 'sans-serif',
      rotation: -15,
      showOnAIImages: true
    }
  },
  {
    id: 'branded-badge',
    name: 'Branded Badge',
    description: 'Company logo with name',
    category: 'branded',
    preview: '🏆',
    settings: {
      position: 'bottom-center',
      size: 'medium',
      opacity: 90,
      style: 'glass',
      backgroundColor: '#FFFFFF',
      textColor: '#000000',
      fontSize: 12,
      fontFamily: 'sans-serif',
      margin: 20,
      showOnAIImages: true
    }
  },
  {
    id: 'minimal-text',
    name: 'Minimal Text',
    description: 'Just company name, small and clean',
    category: 'subtle',
    preview: '📝',
    settings: {
      position: 'bottom-right',
      size: 'small',
      opacity: 60,
      style: 'light',
      textColor: '#FFFFFF',
      fontSize: 11,
      fontFamily: 'sans-serif',
      margin: 12,
      showOnAIImages: true
    }
  },
  {
    id: 'premium-glass',
    name: 'Premium Glass',
    description: 'Elegant glass effect with logo',
    category: 'professional',
    preview: '💎',
    settings: {
      position: 'top-right',
      size: 'medium',
      opacity: 75,
      style: 'glass',
      backgroundColor: '#FFFFFF',
      textColor: '#333333',
      fontSize: 13,
      fontFamily: 'serif',
      margin: 16,
      showOnAIImages: true
    }
  }
];

const POSITION_OPTIONS = [
  { value: 'top-left', label: 'Top Left', icon: '↖️' },
  { value: 'top-center', label: 'Top Center', icon: '⬆️' },
  { value: 'top-right', label: 'Top Right', icon: '↗️' },
  { value: 'center', label: 'Center', icon: '⭕' },
  { value: 'bottom-left', label: 'Bottom Left', icon: '↙️' },
  { value: 'bottom-center', label: 'Bottom Center', icon: '⬇️' },
  { value: 'bottom-right', label: 'Bottom Right', icon: '↘️' }
];

const STYLE_OPTIONS = [
  { value: 'light', label: 'Light', description: 'White text with shadow' },
  { value: 'dark', label: 'Dark', description: 'Black text with shadow' },
  { value: 'outline', label: 'Outline', description: 'Outlined text' },
  { value: 'filled', label: 'Filled', description: 'Background rectangle' },
  { value: 'glass', label: 'Glass', description: 'Frosted glass effect' }
];

export function CompanyWatermark({
  currentSettings,
  onSettingsChange,
  companyInfo,
  previewImage,
  className = ''
}: CompanyWatermarkProps) {
  const [settings, setSettings] = useState<WatermarkSettings>(currentSettings);
  const [showPreview, setShowPreview] = useState(true);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [customLogo, setCustomLogo] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update local settings when props change
  useEffect(() => {
    setSettings(currentSettings);
  }, [currentSettings]);

  const updateSettings = useCallback((updates: Partial<WatermarkSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  }, [settings, onSettingsChange]);

  const applyTemplate = useCallback((template: WatermarkTemplate) => {
    const templateSettings: WatermarkSettings = {
      ...settings,
      ...template.settings,
      companyName: settings.companyName || companyInfo?.name || 'Company Name',
      brandColors: settings.brandColors || companyInfo?.brandColors || ['#000000']
    };
    
    setActiveTemplate(template.id);
    updateSettings(templateSettings);
  }, [settings, companyInfo, updateSettings]);

  const handleLogoUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const logoData = e.target?.result as string;
      setCustomLogo(logoData);
      updateSettings({ logo: logoData });
    };
    reader.readAsDataURL(file);
  }, [updateSettings]);

  const generateWatermarkPreview = useCallback(() => {
    if (!canvasRef.current || !previewImage) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Set canvas dimensions
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw base image
      ctx.drawImage(img, 0, 0);

      if (!settings.enabled) return;

      // Configure watermark style
      ctx.save();
      
      const fontSize = settings.fontSize;
      const margin = settings.margin;
      const text = settings.text || settings.companyName;
      
      // Set font
      ctx.font = `${fontSize}px ${settings.fontFamily}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      // Calculate position
      const textMetrics = ctx.measureText(text);
      const textWidth = textMetrics.width;
      const textHeight = fontSize;

      let x = margin;
      let y = margin;

      switch (settings.position) {
        case 'top-left':
          x = margin;
          y = margin;
          break;
        case 'top-center':
          x = (canvas.width - textWidth) / 2;
          y = margin;
          break;
        case 'top-right':
          x = canvas.width - textWidth - margin;
          y = margin;
          break;
        case 'center':
          x = (canvas.width - textWidth) / 2;
          y = (canvas.height - textHeight) / 2;
          break;
        case 'bottom-left':
          x = margin;
          y = canvas.height - textHeight - margin;
          break;
        case 'bottom-center':
          x = (canvas.width - textWidth) / 2;
          y = canvas.height - textHeight - margin;
          break;
        case 'bottom-right':
          x = canvas.width - textWidth - margin;
          y = canvas.height - textHeight - margin;
          break;
      }

      // Apply rotation
      if (settings.rotation !== 0) {
        ctx.translate(x + textWidth / 2, y + textHeight / 2);
        ctx.rotate((settings.rotation * Math.PI) / 180);
        ctx.translate(-textWidth / 2, -textHeight / 2);
        x = 0;
        y = 0;
      }

      // Apply opacity
      ctx.globalAlpha = settings.opacity / 100;

      // Draw watermark based on style
      switch (settings.style) {
        case 'filled':
          // Background rectangle
          if (settings.backgroundColor) {
            ctx.fillStyle = settings.backgroundColor;
            ctx.fillRect(x - 8, y - 4, textWidth + 16, textHeight + 8);
          }
          ctx.fillStyle = settings.textColor;
          ctx.fillText(text, x, y);
          break;

        case 'glass':
          // Glass effect
          const gradient = ctx.createLinearGradient(x, y, x, y + textHeight);
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
          ctx.fillStyle = gradient;
          ctx.fillRect(x - 8, y - 4, textWidth + 16, textHeight + 8);
          
          // Border
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.lineWidth = 1;
          ctx.strokeRect(x - 8, y - 4, textWidth + 16, textHeight + 8);
          
          ctx.fillStyle = settings.textColor;
          ctx.fillText(text, x, y);
          break;

        case 'outline':
          ctx.strokeStyle = settings.textColor;
          ctx.lineWidth = 2;
          ctx.strokeText(text, x, y);
          break;

        case 'light':
          // White text with dark shadow
          ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
          ctx.shadowOffsetX = 1;
          ctx.shadowOffsetY = 1;
          ctx.shadowBlur = 2;
          ctx.fillStyle = '#FFFFFF';
          ctx.fillText(text, x, y);
          break;

        case 'dark':
          // Dark text with light shadow
          ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
          ctx.shadowOffsetX = 1;
          ctx.shadowOffsetY = 1;
          ctx.shadowBlur = 2;
          ctx.fillStyle = '#000000';
          ctx.fillText(text, x, y);
          break;
      }

      ctx.restore();
    };
    
    img.src = previewImage;
  }, [previewImage, settings]);

  // Regenerate preview when settings change
  useEffect(() => {
    if (showPreview) {
      generateWatermarkPreview();
    }
  }, [showPreview, generateWatermarkPreview]);

  const downloadWatermarkPreview = useCallback(() => {
    if (!canvasRef.current) return;
    
    const link = document.createElement('a');
    link.download = `watermark-preview-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
  }, []);

  return (
    <div className={`company-watermark bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-blue-600" />
            Company Watermark
          </h2>
          <div className="flex items-center space-x-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => updateSettings({ enabled: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Enable watermarks</span>
            </label>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Automatically brand AI-generated and processed images with your company identity
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4">
        {/* Settings Panel */}
        <div className="space-y-6">
          {/* Quick Templates */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Quick Templates</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {WATERMARK_TEMPLATES.map(template => (
                <button
                  key={template.id}
                  onClick={() => applyTemplate(template)}
                  className={`text-left p-3 rounded-lg border transition-colors ${
                    activeTemplate === template.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">{template.preview}</span>
                    <div>
                      <h4 className="font-medium text-gray-900">{template.name}</h4>
                      <p className="text-xs text-gray-600">{template.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Basic Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Basic Settings</h3>
            
            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={settings.companyName}
                onChange={(e) => updateSettings({ companyName: e.target.value })}
                placeholder={companyInfo?.name || 'Enter company name'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Custom Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Text (optional)
              </label>
              <input
                type="text"
                value={settings.text || ''}
                onChange={(e) => updateSettings({ text: e.target.value })}
                placeholder="Custom watermark text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to use company name
              </p>
            </div>

            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Logo
              </label>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Logo
                </button>
                {(customLogo || settings.logo) && (
                  <img
                    src={customLogo || settings.logo}
                    alt="Logo preview"
                    className="w-8 h-8 object-contain"
                  />
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </div>

            {/* Position */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Position
              </label>
              <div className="grid grid-cols-3 gap-2">
                {POSITION_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    onClick={() => updateSettings({ position: option.value as any })}
                    className={`p-2 text-center rounded-lg border transition-colors ${
                      settings.position === option.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-lg mb-1">{option.icon}</div>
                    <div className="text-xs">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Style */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Style
              </label>
              <div className="space-y-2">
                {STYLE_OPTIONS.map(option => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="style"
                      value={option.value}
                      checked={settings.style === option.value}
                      onChange={(e) => updateSettings({ style: e.target.value as any })}
                      className="mr-3"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">{option.label}</span>
                      <p className="text-xs text-gray-600">{option.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Size & Opacity */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Size
                </label>
                <select
                  value={settings.size}
                  onChange={(e) => updateSettings({ size: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opacity: {settings.opacity}%
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={settings.opacity}
                  onChange={(e) => updateSettings({ opacity: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>

            {/* Advanced Settings Toggle */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              <Settings className="w-4 h-4 mr-2" />
              {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
            </button>

            {/* Advanced Settings */}
            {showAdvanced && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                {/* Colors */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Text Color
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={settings.textColor}
                        onChange={(e) => updateSettings({ textColor: e.target.value })}
                        className="w-12 h-8 rounded border border-gray-300"
                      />
                      <input
                        type="text"
                        value={settings.textColor}
                        onChange={(e) => updateSettings({ textColor: e.target.value })}
                        className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                      />
                    </div>
                  </div>
                  {['filled', 'glass'].includes(settings.style) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Background Color
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={settings.backgroundColor || '#FFFFFF'}
                          onChange={(e) => updateSettings({ backgroundColor: e.target.value })}
                          className="w-12 h-8 rounded border border-gray-300"
                        />
                        <input
                          type="text"
                          value={settings.backgroundColor || '#FFFFFF'}
                          onChange={(e) => updateSettings({ backgroundColor: e.target.value })}
                          className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Font Settings */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Font Size: {settings.fontSize}px
                    </label>
                    <input
                      type="range"
                      min="8"
                      max="48"
                      value={settings.fontSize}
                      onChange={(e) => updateSettings({ fontSize: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Font Family
                    </label>
                    <select
                      value={settings.fontFamily}
                      onChange={(e) => updateSettings({ fontFamily: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="sans-serif">Sans Serif</option>
                      <option value="serif">Serif</option>
                      <option value="monospace">Monospace</option>
                    </select>
                  </div>
                </div>

                {/* Rotation & Margin */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rotation: {settings.rotation}°
                    </label>
                    <input
                      type="range"
                      min="-45"
                      max="45"
                      value={settings.rotation}
                      onChange={(e) => updateSettings({ rotation: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Margin: {settings.margin}px
                    </label>
                    <input
                      type="range"
                      min="4"
                      max="64"
                      value={settings.margin}
                      onChange={(e) => updateSettings({ margin: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Application Settings */}
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.showOnAllImages}
                      onChange={(e) => updateSettings({ showOnAllImages: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Apply to all processed images</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.showOnAIImages}
                      onChange={(e) => updateSettings({ showOnAIImages: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Apply to AI-generated images</span>
                  </label>
                </div>
              </div>
            )}

            {/* Brand Colors */}
            {companyInfo?.brandColors && companyInfo.brandColors.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand Colors
                </label>
                <div className="flex items-center space-x-2">
                  {companyInfo.brandColors.map((color, index) => (
                    <button
                      key={index}
                      onClick={() => updateSettings({ textColor: color })}
                      className={`w-8 h-8 rounded border-2 transition-all ${
                        settings.textColor === color ? 'border-gray-800 scale-110' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      title={`Use ${color}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preview Panel */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Preview</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded transition-colors"
                title={showPreview ? 'Hide preview' : 'Show preview'}
              >
                {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                onClick={downloadWatermarkPreview}
                className="p-2 text-gray-400 hover:text-gray-600 rounded transition-colors"
                title="Download preview"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {showPreview ? (
            <div className="bg-gray-100 rounded-lg p-4">
              {previewImage ? (
                <div className="relative">
                  <canvas
                    ref={canvasRef}
                    className="w-full h-auto rounded-lg shadow-sm"
                    style={{ maxHeight: '400px', objectFit: 'contain' }}
                  />
                  {!settings.enabled && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                      <div className="text-white text-center">
                        <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Watermark disabled</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                  <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">No preview image available</p>
                  <p className="text-sm text-gray-500">
                    Upload an image or search for images to preview watermark
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <Eye className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Preview hidden</p>
            </div>
          )}

          {/* Watermark Info */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Watermark Settings</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p><strong>Status:</strong> {settings.enabled ? 'Enabled' : 'Disabled'}</p>
              <p><strong>Text:</strong> {settings.text || settings.companyName || 'No text set'}</p>
              <p><strong>Position:</strong> {settings.position.replace('-', ' ')}</p>
              <p><strong>Style:</strong> {settings.style}</p>
              <p><strong>Opacity:</strong> {settings.opacity}%</p>
              {settings.showOnAIImages && (
                <div className="flex items-center mt-2 pt-2 border-t border-blue-200">
                  <Zap className="w-4 h-4 mr-2" />
                  <span>Auto-applied to AI-generated images</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompanyWatermark;