// Nano Banana AI Service for Gemini 2.5 Flash Image Editing
// This service integrates with Google's Nano Banana (Gemini 2.5 Flash Image) API
// for natural language image editing in FieldTime contractor platform

interface NanoBananaConfig {
  apiKey: string;
  endpoint: string;
  model: 'gemini-2.5-flash-image';
  maxResolution: '1MP';
  timeout: 30000; // 30 second timeout
}

interface ImageEditParams {
  imageFile: File | Blob;
  prompt: string;
  options?: {
    preserveAspectRatio?: boolean;
    quality?: 'standard' | 'high';
    iterations?: number;
    style?: string;
  };
}

interface ImageEditResult {
  success: boolean;
  editedImageUrl: string;
  editedImageId: string;
  metadata: {
    originalImageId: string;
    prompt: string;
    processingTimeMs: number;
    confidence: number;
    modelVersion: string;
    iterations: number;
    imageSize: {
      width: number;
      height: number;
      fileSize: number;
    };
  };
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
}

interface CachedImage {
  url: string;
  editResult: ImageEditResult;
  timestamp: number;
  accessCount: number;
}

class ImageProcessor {
  /**
   * Preprocesses image to optimize for Nano Banana API
   * Compresses large images to stay within 1MP limit for best results
   */
  static async preprocessImage(file: File): Promise<File> {
    // Check if compression is needed (API works best with 1MP images)
    if (file.size > 1024 * 1024) { // 1MB threshold
      console.log('Compressing image for optimal AI processing...');
      return await this.compressImage(file);
    }
    return file;
  }

  static async compressImage(file: File): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate dimensions to stay within 1MP for optimal processing
        const maxPixels = 1000000; // 1MP
        const currentPixels = img.width * img.height;
        
        if (currentPixels > maxPixels) {
          const scaleFactor = Math.sqrt(maxPixels / currentPixels);
          canvas.width = Math.floor(img.width * scaleFactor);
          canvas.height = Math.floor(img.height * scaleFactor);
        } else {
          canvas.width = img.width;
          canvas.height = img.height;
        }
        
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            }));
          }
        }, 'image/jpeg', 0.85); // 85% quality for good balance
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Validates image file for AI editing compatibility
   */
  static validateImage(file: File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB limit
    const supportedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    
    if (!supportedTypes.includes(file.type)) {
      return { valid: false, error: 'Unsupported image format. Please use JPEG, PNG, or WebP.' };
    }
    
    if (file.size > maxSize) {
      return { valid: false, error: 'Image too large. Maximum size is 10MB.' };
    }
    
    return { valid: true };
  }
}

class ImageCache {
  private cache = new Map<string, CachedImage>();
  private maxCacheSize = 50; // Maximum cached images
  private cacheExpiryMs = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Attempts to retrieve cached edit result
   */
  async getCachedEdit(imageId: string, prompt: string): Promise<ImageEditResult | null> {
    const cacheKey = `${imageId}-${this.hashPrompt(prompt)}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiryMs) {
      cached.accessCount++;
      console.log(`Cache hit for prompt: "${prompt}"`);
      return cached.editResult;
    }
    
    // Clean up expired entry
    if (cached) {
      this.cache.delete(cacheKey);
    }
    
    return null;
  }

  /**
   * Caches successful edit result
   */
  setCachedEdit(imageId: string, prompt: string, result: ImageEditResult): void {
    const cacheKey = `${imageId}-${this.hashPrompt(prompt)}`;
    
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      this.evictOldestEntries();
    }
    
    this.cache.set(cacheKey, {
      url: result.editedImageUrl,
      editResult: result,
      timestamp: Date.now(),
      accessCount: 1
    });
    
    console.log(`Cached edit result for: "${prompt}"`);
  }

  /**
   * Simple hash function for prompt strings
   */
  private hashPrompt(prompt: string): string {
    let hash = 0;
    for (let i = 0; i < prompt.length; i++) {
      const char = prompt.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Removes least recently used cache entries
   */
  private evictOldestEntries(): void {
    const entries = Array.from(this.cache.entries())
      .sort(([,a], [,b]) => a.timestamp - b.timestamp)
      .slice(0, 10); // Remove oldest 10 entries
    
    entries.forEach(([key]) => {
      this.cache.delete(key);
    });
    
    console.log(`Evicted ${entries.length} cache entries`);
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      entries: Array.from(this.cache.entries()).map(([key, value]) => ({
        key,
        accessCount: value.accessCount,
        age: Date.now() - value.timestamp
      }))
    };
  }
}

class NanoBananaService {
  private config: NanoBananaConfig;
  private cache: ImageCache;
  
  constructor(config: NanoBananaConfig) {
    this.config = config;
    this.cache = new ImageCache();
  }

  /**
   * Main method to edit image using Nano Banana AI
   */
  async editImage(params: ImageEditParams): Promise<ImageEditResult> {
    const startTime = Date.now();

    try {
      // Validate input image
      const validation = ImageProcessor.validateImage(params.imageFile as File);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Preprocess image for optimal results
      const processedImage = await ImageProcessor.preprocessImage(params.imageFile as File);

      // Check cache first
      const imageId = await this.generateImageId(processedImage);
      const cachedResult = await this.cache.getCachedEdit(imageId, params.prompt);
      if (cachedResult) {
        return cachedResult;
      }

      // Prepare API request
      const formData = new FormData();
      formData.append('image', processedImage);
      formData.append('prompt', params.prompt);
      formData.append('model', this.config.model);
      
      if (params.options) {
        formData.append('preserve_aspect_ratio', String(params.options.preserveAspectRatio ?? true));
        formData.append('quality', params.options.quality ?? 'high');
        formData.append('iterations', String(params.options.iterations ?? 1));
      }

      console.log(`Sending image edit request: "${params.prompt}"`);

      // Make API call to Nano Banana
      const response = await fetch(`${this.config.endpoint}/v1/edit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'X-Platform': 'fieldtime-contractor',
          'X-Version': '1.0.0'
        },
        body: formData,
        signal: AbortSignal.timeout(this.config.timeout)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API Error: ${response.status} ${response.statusText}. ${errorData.message || ''}`);
      }

      const apiResult = await response.json();
      
      // Process API response
      const result: ImageEditResult = {
        success: true,
        editedImageUrl: apiResult.edited_image_url,
        editedImageId: apiResult.edited_image_id || `edited-${imageId}-${Date.now()}`,
        metadata: {
          originalImageId: imageId,
          prompt: params.prompt,
          processingTimeMs: Date.now() - startTime,
          confidence: apiResult.confidence || 0,
          modelVersion: apiResult.model_version || this.config.model,
          iterations: apiResult.iterations || 1,
          imageSize: {
            width: apiResult.image_width || 0,
            height: apiResult.image_height || 0,
            fileSize: apiResult.file_size || 0
          }
        }
      };

      // Cache successful result
      this.cache.setCachedEdit(imageId, params.prompt, result);

      console.log(`Image edit completed in ${result.metadata.processingTimeMs}ms`);
      return result;

    } catch (error) {
      console.error('Nano Banana AI edit failed:', error);
      
      return {
        success: false,
        editedImageUrl: '',
        editedImageId: '',
        metadata: {
          originalImageId: '',
          prompt: params.prompt,
          processingTimeMs: Date.now() - startTime,
          confidence: 0,
          modelVersion: this.config.model,
          iterations: 0,
          imageSize: { width: 0, height: 0, fileSize: 0 }
        },
        error: {
          code: error instanceof Error ? error.name : 'UNKNOWN_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          retryable: this.isRetryableError(error)
        }
      };
    }
  }

  /**
   * Determines if an error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      // Network errors, timeouts, and 5xx server errors are retryable
      return error.message.includes('timeout') || 
             error.message.includes('network') ||
             error.message.includes('fetch') ||
             /5\d{2}/.test(error.message); // 5xx status codes
    }
    return false;
  }

  /**
   * Generates unique ID for image (for caching)
   */
  private async generateImageId(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex.substring(0, 16); // Use first 16 chars
  }

  /**
   * Get service statistics and cache info
   */
  getStats() {
    return {
      cache: this.cache.getStats(),
      config: {
        model: this.config.model,
        maxResolution: this.config.maxResolution,
        timeout: this.config.timeout
      }
    };
  }

  /**
   * Clear cache (useful for development/testing)
   */
  clearCache() {
    this.cache = new ImageCache();
    console.log('Nano Banana cache cleared');
  }
}

class NanoBananaImageEditor {
  private service: NanoBananaService;
  private maxRetries = 3;
  private retryDelays = [1000, 2000, 4000]; // Exponential backoff

  constructor(config: NanoBananaConfig) {
    this.service = new NanoBananaService(config);
  }

  /**
   * Edit image with automatic retry logic
   */
  async editImageWithRetry(params: ImageEditParams): Promise<ImageEditResult> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        console.log(`Edit attempt ${attempt + 1}/${this.maxRetries}`);
        const result = await this.service.editImage(params);
        
        if (result.success) {
          return result;
        }
        
        // If not successful but has error info, check if retryable
        if (result.error && !result.error.retryable) {
          return result; // Don't retry non-retryable errors
        }
        
        lastError = new Error(result.error?.message || 'Edit failed');
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.warn(`Edit attempt ${attempt + 1} failed:`, lastError.message);
        
        // Don't retry on client errors (400-499)
        if (lastError.message.includes('4') && /4\d{2}/.test(lastError.message)) {
          break;
        }
      }

      // Wait before retry (except on last attempt)
      if (attempt < this.maxRetries - 1) {
        console.log(`Waiting ${this.retryDelays[attempt]}ms before retry...`);
        await new Promise(resolve => 
          setTimeout(resolve, this.retryDelays[attempt])
        );
      }
    }

    // All retries exhausted
    throw lastError || new Error('All edit attempts failed');
  }

  /**
   * Batch edit multiple images (useful for bulk operations)
   */
  async editImagesInBatch(edits: ImageEditParams[], concurrency = 2): Promise<ImageEditResult[]> {
    const results: ImageEditResult[] = [];
    const chunks = this.chunkArray(edits, concurrency);

    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map(params => this.editImageWithRetry(params))
      );
      results.push(...chunkResults);
    }

    return results;
  }

  /**
   * Utility function to chunk array for batch processing
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Get suggested prompts based on context
   */
  getSuggestedPrompts(context: 'field-log' | 'chat' | 'document' | 'calendar'): string[] {
    const basePrompts = [
      'Remove background',
      'Enhance colors and lighting',
      'Make image brighter',
      'Sharpen and improve quality',
      'Remove unwanted objects'
    ];

    const contextPrompts = {
      'field-log': [
        'Clean up construction site',
        'Improve weather conditions',
        'Remove workers for clean shot',
        'Enhance work progress visibility',
        'Add professional lighting to workspace'
      ],
      'chat': [
        'Make more professional',
        'Improve photo quality',
        'Remove personal items',
        'Better lighting for sharing'
      ],
      'document': [
        'Enhance document readability',
        'Remove shadows and glare',
        'Straighten document perspective',
        'Improve contrast for text'
      ],
      'calendar': [
        'Create clean event image',
        'Remove clutter from scene',
        'Add meeting room ambiance',
        'Professional event photo'
      ]
    };

    return [...basePrompts, ...contextPrompts[context]];
  }

  /**
   * Get service statistics
   */
  getStats() {
    return this.service.getStats();
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.service.clearCache();
  }
}

// Offline handling for poor network conditions
class OfflineImageEditor {
  private offlineQueue: EditRequest[] = [];
  private dbName = 'fieldtime-ai-edits';
  private editor: NanoBananaImageEditor;

  interface EditRequest {
    id: string;
    imageFile: File;
    prompt: string;
    context: string;
    timestamp: number;
    retryCount: number;
  }

  constructor(editor: NanoBananaImageEditor) {
    this.editor = editor;
    this.initializeOfflineHandling();
  }

  private async initializeOfflineHandling() {
    // Load queued edits from IndexedDB on startup
    await this.loadOfflineQueue();
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      console.log('Connection restored, processing offline queue...');
      this.processOfflineQueue();
    });
    
    window.addEventListener('offline', () => {
      console.log('Connection lost, switching to offline mode...');
    });
  }

  /**
   * Handle image edit when offline
   */
  async handleOfflineEdit(params: ImageEditParams, context: string): Promise<string> {
    const request: EditRequest = {
      id: crypto.randomUUID(),
      imageFile: params.imageFile as File,
      prompt: params.prompt,
      context,
      timestamp: Date.now(),
      retryCount: 0
    };

    this.offlineQueue.push(request);
    
    // Persist to IndexedDB
    await this.persistOfflineQueue();
    
    // Show user feedback
    this.showOfflineNotification('Edit queued for when connection returns');
    
    return request.id;
  }

  /**
   * Process all queued offline edits
   */
  async processOfflineQueue(): Promise<void> {
    if (!navigator.onLine || this.offlineQueue.length === 0) return;

    console.log(`Processing ${this.offlineQueue.length} offline edits...`);
    const batch = this.offlineQueue.splice(0, 5); // Process 5 at a time
    
    for (const request of batch) {
      try {
        const result = await this.editor.editImageWithRetry({
          imageFile: request.imageFile,
          prompt: request.prompt
        });
        
        if (result.success) {
          this.showOfflineNotification(`Processed offline edit: "${request.prompt}"`);
          // Trigger callback if available
          this.notifyEditComplete(request.id, result);
        } else {
          throw new Error(result.error?.message || 'Edit failed');
        }
        
      } catch (error) {
        console.warn(`Offline edit failed for "${request.prompt}":`, error);
        request.retryCount++;
        
        if (request.retryCount < 3) {
          this.offlineQueue.push(request); // Re-queue for retry
        } else {
          this.showOfflineNotification(`Failed to process: "${request.prompt}"`);
        }
      }
    }

    await this.persistOfflineQueue();
    
    // Continue processing if more items remain
    if (this.offlineQueue.length > 0) {
      setTimeout(() => this.processOfflineQueue(), 2000);
    }
  }

  private async persistOfflineQueue(): Promise<void> {
    // Store in localStorage as IndexedDB fallback
    try {
      const queueData = this.offlineQueue.map(req => ({
        ...req,
        imageFile: null // Can't serialize File objects
      }));
      localStorage.setItem('fieldtime-offline-edits', JSON.stringify(queueData));
    } catch (error) {
      console.warn('Failed to persist offline queue:', error);
    }
  }

  private async loadOfflineQueue(): Promise<void> {
    try {
      const queueData = localStorage.getItem('fieldtime-offline-edits');
      if (queueData) {
        // Note: This is simplified - in production, you'd need to handle File serialization
        console.log('Loaded offline edit queue from storage');
      }
    } catch (error) {
      console.warn('Failed to load offline queue:', error);
    }
  }

  private showOfflineNotification(message: string): void {
    // In a real app, this would use your notification system
    console.log('Offline notification:', message);
    
    // Example: Show toast notification
    if (typeof window !== 'undefined') {
      // Dispatch custom event for UI to handle
      window.dispatchEvent(new CustomEvent('ai-edit-notification', {
        detail: { message, type: 'offline' }
      }));
    }
  }

  private notifyEditComplete(requestId: string, result: ImageEditResult): void {
    window.dispatchEvent(new CustomEvent('ai-edit-complete', {
      detail: { requestId, result }
    }));
  }

  getQueueStatus() {
    return {
      queueLength: this.offlineQueue.length,
      oldestRequest: this.offlineQueue.length > 0 ? 
        new Date(Math.min(...this.offlineQueue.map(r => r.timestamp))) : null,
      isOnline: navigator.onLine
    };
  }
}

// Factory function to create configured Nano Banana instance
export function createNanoBananaEditor(config: Partial<NanoBananaConfig> = {}): NanoBananaImageEditor {
  const defaultConfig: NanoBananaConfig = {
    apiKey: process.env.NANO_BANANA_API_KEY || '',
    endpoint: process.env.NANO_BANANA_ENDPOINT || 'https://api.nanobanana.ai',
    model: 'gemini-2.5-flash-image',
    maxResolution: '1MP',
    timeout: 30000
  };

  const finalConfig = { ...defaultConfig, ...config };
  
  if (!finalConfig.apiKey) {
    console.warn('Nano Banana API key not provided. AI editing will not work.');
  }

  return new NanoBananaImageEditor(finalConfig);
}

// Export all classes and types
export {
  NanoBananaService,
  NanoBananaImageEditor,
  ImageProcessor,
  ImageCache,
  OfflineImageEditor,
  type NanoBananaConfig,
  type ImageEditParams,
  type ImageEditResult
};