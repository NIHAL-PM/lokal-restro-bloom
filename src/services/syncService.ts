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

export interface ConnectedDevice {
  id: string;
  name: string;
  ip: string;
  role: string;
  status: 'online' | 'offline';
  ping?: number;
  lastSeen: string;
}

class SyncService {
  private ws: WebSocket | null = null;
  private deviceId: string;
  private syncListeners: ((data: SyncData) => void)[] = [];
  private reconnectInterval: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private connectedDevices: Map<string, ConnectedDevice> = new Map();
  private isConnected: boolean = false;
  private useWebSocket: boolean = true;
  private fallbackSyncInterval: NodeJS.Timeout | null = null;
  private syncQueue: SyncData[] = [];
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  constructor() {
    this.deviceId = this.generateDeviceId();
    this.connect();
    this.startFallbackSync();
    this.startDeviceDiscovery();
  }

  private generateDeviceId(): string {
    const stored = localStorage.getItem('lokalrestro_device_id');
    if (stored) return stored;
    
    const newId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('lokalrestro_device_id', newId);
    return newId;
  }

  private connect(): void {
    // Don't try to reconnect if we've exceeded max attempts
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      // ...removed debug log...
      this.fallbackToLocalSync();
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//localhost:8765`;
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        // ...removed debug log...
        this.isConnected = true;
        this.useWebSocket = true;
        this.reconnectAttempts = 0; // Reset on successful connection
        this.startHeartbeat();
        this.sendDiscovery();
        this.processSyncQueue();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: SyncMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          // ...removed debug log...
        }
      };

      this.ws.onclose = () => {
        // ...removed debug log...
        this.isConnected = false;
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        } else {
          this.fallbackToLocalSync();
        }
      };

      this.ws.onerror = (error) => {
        // ...removed debug log...
        this.isConnected = false;
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          this.fallbackToLocalSync();
        }
      };

    } catch (error) {
      // ...removed debug log...
      this.fallbackToLocalSync();
    }
  }

  private fallbackToLocalSync(): void {
    // ...removed debug log...
    this.useWebSocket = false;
    this.isConnected = false;
    
    // Clear any existing reconnection attempts
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }
    
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
        // ...removed debug log...
      }
    }
  }

  private startFallbackSync(): void {
    this.fallbackSyncInterval = setInterval(() => {
      if (!this.useWebSocket) {
        this.processLocalSync();
      }
    }, 1000);
  }

  private processLocalSync(): void {
    if (this.syncQueue.length > 0) {
      const syncData = this.syncQueue.shift();
      if (syncData) {
        localStorage.setItem('lokalrestro_sync', JSON.stringify(syncData));
        setTimeout(() => localStorage.removeItem('lokalrestro_sync'), 100);
      }
    }
  }

  private processSyncQueue(): void {
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
        this.updateDeviceStatus(message.deviceId, 'online');
        break;
      case 'discovery':
        this.updateDeviceStatus(message.deviceId, 'online');
        this.sendHeartbeat();
        break;
    }
  }

  private updateDeviceStatus(deviceId: string, status: 'online' | 'offline'): void {
    if (deviceId === this.deviceId) return;
    
    const existing = this.connectedDevices.get(deviceId);
    const device: ConnectedDevice = {
      id: deviceId,
      name: existing?.name || `Device-${deviceId.slice(-4)}`,
      ip: existing?.ip || '192.168.1.xxx',
      role: existing?.role || 'unknown',
      status,
      lastSeen: new Date().toISOString()
    };
    
    this.connectedDevices.set(deviceId, device);
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
    }, 30000);
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
    
    // Exponential backoff for reconnection
    const delay = Math.min(10000 * Math.pow(2, this.reconnectAttempts), 60000);
    
    this.reconnectInterval = setTimeout(() => {
      // ...removed debug log...
      this.connect();
    }, delay);
  }

  private generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private notifyListeners(data: SyncData): void {
    this.syncListeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        // ...removed debug log...
      }
    });
  }

  private startDeviceDiscovery(): void {
    setInterval(() => {
      this.discoverLocalDevices();
    }, 60000);
  }

  private async discoverLocalDevices(): Promise<void> {
    const simulatedDevices = [
      { id: 'kitchen-pos-001', name: 'Kitchen Display', ip: '192.168.1.101', role: 'KDS' },
      { id: 'counter-pos-002', name: 'Counter Terminal', ip: '192.168.1.102', role: 'Billing' },
      { id: 'mobile-waiter-003', name: 'Waiter Mobile', ip: '192.168.1.103', role: 'Orders' }
    ];

    simulatedDevices.forEach(device => {
      if (!this.connectedDevices.has(device.id)) {
        this.connectedDevices.set(device.id, {
          ...device,
          status: 'online',
          lastSeen: new Date().toISOString()
        });
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

  getConnectedDevices(): ConnectedDevice[] {
    return Array.from(this.connectedDevices.values());
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
      method: this.useWebSocket ? (this.isConnected ? 'WebSocket' : 'Connecting...') : 'LocalStorage',
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

  async discoverDevices(): Promise<string[]> {
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
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(Math.random() * 100 + 10);
      }, 100);
    });
  }

  async pingAllDevices(): Promise<void> {
    const devices = Array.from(this.connectedDevices.keys());
    for (const deviceId of devices) {
      try {
        const ping = await this.pingDevice(deviceId);
        const device = this.connectedDevices.get(deviceId);
        if (device) {
          device.ping = ping;
          device.status = 'online';
          device.lastSeen = new Date().toISOString();
          this.connectedDevices.set(deviceId, device);
        }
      } catch (error) {
        const device = this.connectedDevices.get(deviceId);
        if (device) {
          device.status = 'offline';
          this.connectedDevices.set(deviceId, device);
        }
      }
    }
  }
}

export const syncService = new SyncService();
export type { SyncData, SyncMessage };
