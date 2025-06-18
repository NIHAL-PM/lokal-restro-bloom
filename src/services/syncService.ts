
interface SyncData {
  type: string;
  action: string;
  data: any;
  timestamp: number;
  deviceId: string;
}

interface SyncMessage {
  id: string;
  type: 'sync' | 'heartbeat' | 'discovery';
  data: SyncData | null;
  timestamp: number;
  deviceId: string;
}

class SyncService {
  private ws: WebSocket | null = null;
  private deviceId: string;
  private syncListeners: ((data: SyncData) => void)[] = [];
  private reconnectInterval: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private connectedDevices: Set<string> = new Set();
  private isConnected: boolean = false;
  private useWebSocket: boolean = true;
  private fallbackSyncInterval: NodeJS.Timeout | null = null;
  private lastSync: number = 0;
  private syncQueue: SyncData[] = [];

  constructor() {
    this.deviceId = this.generateDeviceId();
    this.connect();
    this.startFallbackSync();
  }

  private generateDeviceId(): string {
    const stored = localStorage.getItem('lokalrestro_device_id');
    if (stored) return stored;
    
    const newId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('lokalrestro_device_id', newId);
    return newId;
  }

  private connect(): void {
    try {
      // Try WebSocket connection first
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//localhost:8765`;
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected successfully');
        this.isConnected = true;
        this.useWebSocket = true;
        this.startHeartbeat();
        this.sendDiscovery();
        this.processSyncQueue();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: SyncMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse sync message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket connection closed');
        this.isConnected = false;
        this.fallbackToLocalSync();
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnected = false;
        this.fallbackToLocalSync();
      };

    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.fallbackToLocalSync();
    }
  }

  private fallbackToLocalSync(): void {
    console.log('Falling back to local storage sync');
    this.useWebSocket = false;
    this.isConnected = false;
    
    // Use localStorage events for local sync between tabs
    window.addEventListener('storage', this.handleStorageEvent.bind(this));
  }

  private handleStorageEvent(event: StorageEvent): void {
    if (event.key === 'lokalrestro_sync' && event.newValue) {
      try {
        const syncData: SyncData = JSON.parse(event.newValue);
        if (syncData.deviceId !== this.deviceId) {
          this.notifyListeners(syncData);
        }
      } catch (error) {
        console.error('Failed to parse storage sync data:', error);
      }
    }
  }

  private startFallbackSync(): void {
    // Periodic sync check for localStorage-based sync
    this.fallbackSyncInterval = setInterval(() => {
      if (!this.useWebSocket) {
        this.processLocalSync();
      }
    }, 1000);
  }

  private processLocalSync(): void {
    // Process any queued sync data when not using WebSocket
    if (this.syncQueue.length > 0) {
      const syncData = this.syncQueue.shift();
      if (syncData) {
        localStorage.setItem('lokalrestro_sync', JSON.stringify(syncData));
        localStorage.removeItem('lokalrestro_sync'); // Clear after setting to trigger event
      }
    }
  }

  private processSyncQueue(): void {
    // Process any queued sync data when connection is restored
    while (this.syncQueue.length > 0 && this.isConnected) {
      const syncData = this.syncQueue.shift();
      if (syncData && this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.sendMessage({
          id: this.generateMessageId(),
          type: 'sync',
          data: syncData,
          timestamp: Date.now(),
          deviceId: this.deviceId
        });
      }
    }
  }

  private handleMessage(message: SyncMessage): void {
    switch (message.type) {
      case 'sync':
        if (message.data && message.deviceId !== this.deviceId) {
          this.notifyListeners(message.data);
        }
        break;
      case 'heartbeat':
        this.connectedDevices.add(message.deviceId);
        break;
      case 'discovery':
        this.connectedDevices.add(message.deviceId);
        this.sendHeartbeat();
        break;
    }
  }

  private sendMessage(message: SyncMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  private sendDiscovery(): void {
    this.sendMessage({
      id: this.generateMessageId(),
      type: 'discovery',
      data: null,
      timestamp: Date.now(),
      deviceId: this.deviceId
    });
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 30000); // Send heartbeat every 30 seconds
  }

  private sendHeartbeat(): void {
    this.sendMessage({
      id: this.generateMessageId(),
      type: 'heartbeat',
      data: null,
      timestamp: Date.now(),
      deviceId: this.deviceId
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
    }
    
    this.reconnectInterval = setInterval(() => {
      console.log('Attempting to reconnect...');
      this.connect();
    }, 10000); // Try to reconnect every 10 seconds
  }

  private generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private notifyListeners(data: SyncData): void {
    this.syncListeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('Sync listener error:', error);
      }
    });
  }

  // Public API
  broadcast(data: SyncData): void {
    if (this.useWebSocket && this.isConnected) {
      this.sendMessage({
        id: this.generateMessageId(),
        type: 'sync',
        data,
        timestamp: Date.now(),
        deviceId: this.deviceId
      });
    } else {
      // Queue for later or use localStorage
      this.syncQueue.push(data);
      if (!this.useWebSocket) {
        localStorage.setItem('lokalrestro_sync', JSON.stringify(data));
        setTimeout(() => localStorage.removeItem('lokalrestro_sync'), 100);
      }
    }
  }

  onSync(listener: (data: SyncData) => void): () => void {
    this.syncListeners.push(listener);
    return () => {
      this.syncListeners = this.syncListeners.filter(l => l !== listener);
    };
  }

  getConnectedDevices(): string[] {
    return Array.from(this.connectedDevices);
  }

  getDeviceId(): string {
    return this.deviceId;
  }

  isOnline(): boolean {
    return this.isConnected;
  }

  getSyncStatus(): { online: boolean; method: string; devices: number } {
    return {
      online: this.isConnected || !this.useWebSocket,
      method: this.useWebSocket ? 'WebSocket' : 'LocalStorage',
      devices: this.connectedDevices.size
    };
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
    }
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    if (this.fallbackSyncInterval) {
      clearInterval(this.fallbackSyncInterval);
    }
    
    window.removeEventListener('storage', this.handleStorageEvent.bind(this));
    
    this.isConnected = false;
    this.connectedDevices.clear();
  }

  // Network discovery methods
  async discoverDevices(): Promise<string[]> {
    // Simulate network device discovery
    return new Promise((resolve) => {
      setTimeout(() => {
        const simulatedDevices = [
          'LokalRestro-Kitchen-001',
          'LokalRestro-Counter-002',
          'LokalRestro-Mobile-003'
        ];
        resolve(simulatedDevices);
      }, 1000);
    });
  }

  async pingDevice(deviceId: string): Promise<number> {
    // Simulate device ping
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(Math.random() * 100 + 10); // Random ping between 10-110ms
      }, 100);
    });
  }
}

export const syncService = new SyncService();
export type { SyncData, SyncMessage };
