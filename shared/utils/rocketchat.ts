// Rocket.Chat Integration Service
// Provides real-time chat functionality for contractor teams and clients

export interface RocketChatConfig {
  baseUrl: string;
  username: string;
  password: string;
  userId?: string;
  authToken?: string;
}

export interface ChatMessage {
  _id: string;
  rid: string; // Room ID
  msg: string;
  ts: string; // Timestamp
  u: {
    _id: string;
    username: string;
    name?: string;
  };
  attachments?: Array<{
    title?: string;
    title_link?: string;
    text?: string;
    image_url?: string;
    type?: string;
  }>;
  file?: {
    _id: string;
    name: string;
    type: string;
    size: number;
  };
  reactions?: Record<string, { usernames: string[] }>;
  editedAt?: string;
  editedBy?: {
    _id: string;
    username: string;
  };
}

export interface ChatRoom {
  _id: string;
  name?: string;
  fname?: string; // Display name
  t: 'c' | 'p' | 'd'; // Channel, Private group, Direct message
  ro?: boolean; // Read only
  archived?: boolean;
  broadcast?: boolean;
  encrypted?: boolean;
  description?: string;
  topic?: string;
  msgs: number; // Message count
  usersCount: number;
  lastMessage?: ChatMessage;
  ts: string; // Created timestamp
  _updatedAt: string;
  customFields?: {
    projectId?: string;
    contractorId?: string;
    clientId?: string;
  };
}

export interface User {
  _id: string;
  username: string;
  name?: string;
  emails?: Array<{ address: string; verified: boolean }>;
  status: 'online' | 'away' | 'busy' | 'offline';
  statusConnection: 'online' | 'away' | 'busy' | 'offline';
  avatarUrl?: string;
  roles: string[];
  active: boolean;
  customFields?: {
    contractorRole?: 'contractor' | 'staff' | 'sub' | 'homeowner';
    tenantId?: string;
    projectIds?: string[];
  };
}

export class RocketChatService {
  private config: RocketChatConfig;
  private authToken: string | null = null;
  private userId: string | null = null;

  constructor(config: RocketChatConfig) {
    this.config = config;
    this.authToken = config.authToken || null;
    this.userId = config.userId || null;
  }

  /**
   * Authenticate with Rocket.Chat
   */
  async login(): Promise<{ authToken: string; userId: string }> {
    const response = await this.makeRequest('/api/v1/login', {
      method: 'POST',
      body: JSON.stringify({
        username: this.config.username,
        password: this.config.password,
      }),
    });

    if (response.status === 'success') {
      this.authToken = response.data.authToken;
      this.userId = response.data.userId;
      
      return {
        authToken: this.authToken,
        userId: this.userId,
      };
    }

    throw new Error('Login failed: ' + response.error);
  }

  /**
   * Create a project-specific channel
   */
  async createProjectChannel(projectId: string, projectName: string, members: string[]): Promise<ChatRoom> {
    await this.ensureAuthenticated();

    const channelName = `project-${projectId.slice(-8)}`.toLowerCase(); // Use last 8 chars of ID
    const displayName = `${projectName} - Project Chat`;

    const response = await this.makeRequest('/api/v1/channels.create', {
      method: 'POST',
      body: JSON.stringify({
        name: channelName,
        members: members,
        customFields: {
          projectId,
          type: 'project',
        },
      }),
    });

    if (response.success) {
      // Set channel topic and description
      await this.makeRequest('/api/v1/channels.setTopic', {
        method: 'POST',
        body: JSON.stringify({
          roomId: response.channel._id,
          topic: `Project discussion for ${projectName}`,
        }),
      });

      await this.makeRequest('/api/v1/channels.setDescription', {
        method: 'POST',
        body: JSON.stringify({
          roomId: response.channel._id,
          description: `Real-time communication for ${projectName} project. Share updates, photos, and coordinate tasks.`,
        }),
      });

      return response.channel;
    }

    throw new Error('Failed to create channel: ' + response.error);
  }

  /**
   * Get user's channels/rooms
   */
  async getUserRooms(): Promise<ChatRoom[]> {
    await this.ensureAuthenticated();

    const response = await this.makeRequest('/api/v1/rooms.get');
    
    if (response.success) {
      return response.update || [];
    }

    throw new Error('Failed to get rooms: ' + response.error);
  }

  /**
   * Get messages from a room
   */
  async getRoomMessages(
    roomId: string, 
    options: { count?: number; latest?: string; oldest?: string } = {}
  ): Promise<ChatMessage[]> {
    await this.ensureAuthenticated();

    const params = new URLSearchParams();
    if (options.count) params.append('count', options.count.toString());
    if (options.latest) params.append('latest', options.latest);
    if (options.oldest) params.append('oldest', options.oldest);

    const response = await this.makeRequest(`/api/v1/channels.history?roomId=${roomId}&${params}`);
    
    if (response.success) {
      return response.messages || [];
    }

    throw new Error('Failed to get messages: ' + response.error);
  }

  /**
   * Send a message to a room
   */
  async sendMessage(roomId: string, message: string, attachments?: any[]): Promise<ChatMessage> {
    await this.ensureAuthenticated();

    const payload: any = {
      roomId,
      text: message,
    };

    if (attachments && attachments.length > 0) {
      payload.attachments = attachments;
    }

    const response = await this.makeRequest('/api/v1/chat.sendMessage', {
      method: 'POST',
      body: JSON.stringify({ message: payload }),
    });

    if (response.success) {
      return response.message;
    }

    throw new Error('Failed to send message: ' + response.error);
  }

  /**
   * Upload a file to a room
   */
  async uploadFile(roomId: string, file: File, description?: string): Promise<any> {
    await this.ensureAuthenticated();

    const formData = new FormData();
    formData.append('file', file);
    formData.append('roomId', roomId);
    if (description) {
      formData.append('description', description);
    }

    const response = await fetch(`${this.config.baseUrl}/api/v1/rooms.upload/${roomId}`, {
      method: 'POST',
      headers: {
        'X-Auth-Token': this.authToken!,
        'X-User-Id': this.userId!,
      },
      body: formData,
    });

    if (response.ok) {
      return await response.json();
    }

    throw new Error('Failed to upload file');
  }

  /**
   * Add users to a room
   */
  async addUsersToRoom(roomId: string, userIds: string[]): Promise<void> {
    await this.ensureAuthenticated();

    for (const userId of userIds) {
      await this.makeRequest('/api/v1/channels.invite', {
        method: 'POST',
        body: JSON.stringify({
          roomId,
          userId,
        }),
      });
    }
  }

  /**
   * Create a direct message channel
   */
  async createDirectMessage(username: string): Promise<ChatRoom> {
    await this.ensureAuthenticated();

    const response = await this.makeRequest('/api/v1/im.create', {
      method: 'POST',
      body: JSON.stringify({
        username,
      }),
    });

    if (response.success) {
      return response.room;
    }

    throw new Error('Failed to create direct message: ' + response.error);
  }

  /**
   * Search for users
   */
  async searchUsers(query: string): Promise<User[]> {
    await this.ensureAuthenticated();

    const response = await this.makeRequest(`/api/v1/users.list?query=${encodeURIComponent(query)}`);
    
    if (response.success) {
      return response.users || [];
    }

    throw new Error('Failed to search users: ' + response.error);
  }

  /**
   * Get online users
   */
  async getOnlineUsers(): Promise<User[]> {
    await this.ensureAuthenticated();

    const response = await this.makeRequest('/api/v1/users.list?fields={"status":1,"name":1,"username":1}&query={"status":"online"}');
    
    if (response.success) {
      return response.users || [];
    }

    return [];
  }

  /**
   * Subscribe to real-time updates via WebSocket
   */
  createRealtimeConnection(): WebSocket | null {
    if (!this.authToken || !this.userId) {
      throw new Error('Must be authenticated to create realtime connection');
    }

    try {
      const wsUrl = this.config.baseUrl.replace(/^http/, 'ws') + '/websocket';
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        // Send connect message
        ws.send(JSON.stringify({
          msg: 'connect',
          version: '1',
          support: ['1', 'pre2', 'pre1'],
        }));

        // Login with token
        ws.send(JSON.stringify({
          msg: 'method',
          method: 'login',
          params: [{ resume: this.authToken }],
          id: '1',
        }));
      };

      return ws;
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      return null;
    }
  }

  /**
   * Format message for display
   */
  formatMessage(message: ChatMessage): {
    id: string;
    text: string;
    sender: string;
    senderName: string;
    timestamp: Date;
    isFile: boolean;
    fileInfo?: any;
    reactions?: any;
  } {
    return {
      id: message._id,
      text: message.msg,
      sender: message.u._id,
      senderName: message.u.name || message.u.username,
      timestamp: new Date(message.ts),
      isFile: !!message.file,
      fileInfo: message.file,
      reactions: message.reactions,
    };
  }

  /**
   * Private helper methods
   */
  private async ensureAuthenticated(): Promise<void> {
    if (!this.authToken || !this.userId) {
      await this.login();
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.authToken && this.userId) {
      headers['X-Auth-Token'] = this.authToken;
      headers['X-User-Id'] = this.userId;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Utility methods for contractor-specific functionality
   */
  
  /**
   * Send project update with photo
   */
  async sendProjectUpdate(
    roomId: string, 
    update: string, 
    photo?: File,
    weather?: any,
    location?: any
  ): Promise<ChatMessage> {
    let message = update;

    // Add weather info if available
    if (weather) {
      message += `\n\n🌤️ Weather: ${weather.temperature}°F, ${weather.conditions}`;
    }

    // Add location if available  
    if (location) {
      message += `\n📍 Location: ${location.address || 'Job site'}`;
    }

    if (photo) {
      // Upload photo first, then send message with attachment
      const uploadResult = await this.uploadFile(roomId, photo, 'Project progress photo');
      
      return await this.sendMessage(roomId, message, [{
        title: 'Progress Photo',
        image_url: uploadResult.file.url,
        type: 'image',
      }]);
    }

    return await this.sendMessage(roomId, message);
  }

  /**
   * Create quick status message templates
   */
  getStatusTemplates(): Array<{ label: string; message: string; emoji: string }> {
    return [
      {
        label: 'Started Work',
        message: 'Work has begun on site. Will provide updates throughout the day.',
        emoji: '🔨',
      },
      {
        label: 'Break Time',
        message: 'Taking a short break. Back to work shortly.',
        emoji: '☕',
      },
      {
        label: 'Material Delivery',
        message: 'Materials have been delivered and inspected. Ready to proceed.',
        emoji: '📦',
      },
      {
        label: 'Inspection Passed',
        message: 'Inspection completed successfully. Moving to next phase.',
        emoji: '✅',
      },
      {
        label: 'Issue Found',
        message: 'Found an issue that needs attention. Details to follow.',
        emoji: '⚠️',
      },
      {
        label: 'Day Complete',
        message: 'Work completed for today. Site secured and clean.',
        emoji: '🏁',
      },
    ];
  }
}