'use client';

import { useState, useEffect, useRef } from 'react';
import { MeetingTag } from '@contractor-platform/types';
import { 
  Tag, 
  Plus, 
  X, 
  Check, 
  Hash, 
  TrendingUp, 
  Clock,
  ChevronDown,
  Edit,
  Trash2
} from 'lucide-react';

interface MeetingTagManagerProps {
  availableTags: MeetingTag[];
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  onCreateTag?: (tagName: string, color: string) => void;
  onUpdateTag?: (tagId: string, updates: Partial<MeetingTag>) => void;
  onDeleteTag?: (tagId: string) => void;
  className?: string;
  placeholder?: string;
  showManagement?: boolean;
}

const predefinedColors = [
  { name: 'Blue', value: 'bg-blue-100 text-blue-700 border-blue-200' },
  { name: 'Green', value: 'bg-green-100 text-green-700 border-green-200' },
  { name: 'Purple', value: 'bg-purple-100 text-purple-700 border-purple-200' },
  { name: 'Orange', value: 'bg-orange-100 text-orange-700 border-orange-200' },
  { name: 'Pink', value: 'bg-pink-100 text-pink-700 border-pink-200' },
  { name: 'Indigo', value: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { name: 'Yellow', value: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { name: 'Red', value: 'bg-red-100 text-red-700 border-red-200' },
  { name: 'Gray', value: 'bg-gray-100 text-gray-700 border-gray-200' },
];

const contractorTagSuggestions = [
  { name: 'urgent', category: 'priority' },
  { name: 'electrical', category: 'trade' },
  { name: 'plumbing', category: 'trade' },
  { name: 'hvac', category: 'trade' },
  { name: 'framing', category: 'trade' },
  { name: 'drywall', category: 'trade' },
  { name: 'flooring', category: 'trade' },
  { name: 'roofing', category: 'trade' },
  { name: 'permits', category: 'process' },
  { name: 'inspection', category: 'process' },
  { name: 'change-order', category: 'process' },
  { name: 'client-request', category: 'process' },
  { name: 'materials', category: 'logistics' },
  { name: 'scheduling', category: 'logistics' },
  { name: 'budget', category: 'finance' },
  { name: 'safety', category: 'compliance' },
  { name: 'code-compliance', category: 'compliance' },
  { name: 'warranty', category: 'service' },
  { name: 'follow-up', category: 'service' },
];

export function MeetingTagManager({
  availableTags,
  selectedTags,
  onTagsChange,
  onCreateTag,
  onUpdateTag,
  onDeleteTag,
  className = '',
  placeholder = 'Add tags...',
  showManagement = false,
}: MeetingTagManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(predefinedColors[0].value);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTag, setEditingTag] = useState<MeetingTag | null>(null);
  const [showManagementPanel, setShowManagementPanel] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCreateForm(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredTags = availableTags.filter(tag =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSuggestions = contractorTagSuggestions.filter(suggestion =>
    suggestion.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !availableTags.some(tag => tag.name === suggestion.name)
  );

  const handleToggleTag = (tagName: string) => {
    const newTags = selectedTags.includes(tagName)
      ? selectedTags.filter(t => t !== tagName)
      : [...selectedTags, tagName];
    onTagsChange(newTags);
  };

  const handleCreateTag = () => {
    if (newTagName.trim() && !availableTags.some(tag => tag.name === newTagName.trim())) {
      onCreateTag?.(newTagName.trim(), newTagColor);
      setNewTagName('');
      setNewTagColor(predefinedColors[0].value);
      setShowCreateForm(false);
      // Auto-select the newly created tag
      onTagsChange([...selectedTags, newTagName.trim()]);
    }
  };

  const handleUpdateTag = (tagId: string, updates: Partial<MeetingTag>) => {
    onUpdateTag?.(tagId, updates);
    setEditingTag(null);
  };

  const getTagColorClasses = (color: string) => {
    return color || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'priority': return '🔥';
      case 'trade': return '🔧';
      case 'process': return '📋';
      case 'logistics': return '📦';
      case 'finance': return '💰';
      case 'compliance': return '✅';
      case 'service': return '🤝';
      default: return '🏷️';
    }
  };

  const getUsageColor = (usageCount: number) => {
    if (usageCount >= 10) return 'text-green-600';
    if (usageCount >= 5) return 'text-yellow-600';
    return 'text-gray-500';
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Selected Tags Display */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {selectedTags.map(tagName => {
          const tag = availableTags.find(t => t.name === tagName);
          return (
            <span
              key={tagName}
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                tag ? getTagColorClasses(tag.color) : 'bg-gray-100 text-gray-700 border-gray-200'
              }`}
            >
              <Tag className="w-3 h-3 mr-1" />
              {tagName}
              <button
                onClick={() => handleToggleTag(tagName)}
                className="ml-2 hover:text-red-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          );
        })}
      </div>

      {/* Tag Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        
        <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {showManagement && (
            <button
              onClick={() => setShowManagementPanel(!showManagementPanel)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
          
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {/* Existing Tags */}
          {filteredTags.length > 0 && (
            <div className="p-3 border-b border-gray-200">
              <div className="text-xs font-medium text-gray-700 mb-2 flex items-center">
                <Hash className="w-3 h-3 mr-1" />
                Existing Tags
              </div>
              
              <div className="space-y-1">
                {filteredTags.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => handleToggleTag(tag.name)}
                    className={`flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg hover:bg-gray-50 transition-colors ${
                      selectedTags.includes(tag.name) ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getTagColorClasses(tag.color)}`}>
                        {tag.name}
                      </span>
                      
                      <span className={`text-xs ${getUsageColor(tag.usage_count)}`}>
                        {tag.usage_count} uses
                      </span>
                    </div>
                    
                    {selectedTags.includes(tag.name) && (
                      <Check className="w-4 h-4 text-blue-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {filteredSuggestions.length > 0 && (
            <div className="p-3 border-b border-gray-200">
              <div className="text-xs font-medium text-gray-700 mb-2 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" />
                Suggested Tags
              </div>
              
              <div className="space-y-1">
                {filteredSuggestions.slice(0, 5).map(suggestion => (
                  <button
                    key={suggestion.name}
                    onClick={() => {
                      // Create the tag first, then select it
                      onCreateTag?.(suggestion.name, predefinedColors[Math.floor(Math.random() * predefinedColors.length)].value);
                      handleToggleTag(suggestion.name);
                    }}
                    className="flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">
                        {getCategoryIcon(suggestion.category)}
                      </span>
                      <span>{suggestion.name}</span>
                      <span className="text-xs text-gray-500 capitalize">
                        {suggestion.category}
                      </span>
                    </div>
                    
                    <Plus className="w-4 h-4 text-green-600" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Create New Tag */}
          <div className="p-3">
            {!showCreateForm ? (
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create new tag &ldquo;{searchQuery}&rdquo;
              </button>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Tag Name
                  </label>
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="Enter tag name"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    autoFocus
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {predefinedColors.map((color, index) => (
                      <button
                        key={index}
                        onClick={() => setNewTagColor(color.value)}
                        className={`w-6 h-6 rounded border-2 ${color.value.split(' ')[0]} ${
                          newTagColor === color.value ? 'ring-2 ring-blue-500' : ''
                        }`}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewTagName('');
                      setNewTagColor(predefinedColors[0].value);
                    }}
                    className="text-xs text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  
                  <button
                    onClick={handleCreateTag}
                    disabled={!newTagName.trim()}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create Tag
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tag Management Panel */}
      {showManagementPanel && (
        <div className="absolute z-50 top-full left-0 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-900">Manage Tags</h3>
              <button
                onClick={() => setShowManagementPanel(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {availableTags.map(tag => (
                <div
                  key={tag.id}
                  className="flex items-center justify-between p-2 border border-gray-200 rounded-lg"
                >
                  {editingTag?.id === tag.id ? (
                    <div className="flex-1 flex items-center space-x-2">
                      <input
                        type="text"
                        value={editingTag.name}
                        onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                      />
                      
                      <div className="flex space-x-1">
                        {predefinedColors.slice(0, 4).map((color, index) => (
                          <button
                            key={index}
                            onClick={() => setEditingTag({ ...editingTag, color: color.value })}
                            className={`w-5 h-5 rounded border ${color.value.split(' ')[0]} ${
                              editingTag.color === color.value ? 'ring-1 ring-blue-500' : ''
                            }`}
                          />
                        ))}
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleUpdateTag(tag.id, editingTag)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => setEditingTag(null)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getTagColorClasses(tag.color)}`}>
                          {tag.name}
                        </span>
                        
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <TrendingUp className="w-3 h-3" />
                          <span>{tag.usage_count} uses</span>
                          
                          <Clock className="w-3 h-3" />
                          <span>{new Date(tag.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => setEditingTag(tag)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        
                        <button
                          onClick={() => onDeleteTag?.(tag.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}