
import { useToast } from "@/hooks/use-toast";

export interface SyncData {
  type: 'order' | 'menu' | 'table' | 'room' | 'settings';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: string;
  deviceId: string;
}

export interface ConnectedDevice {
  id: string;
  name: string;
  ip: string;
  role: string;
  status: 'online' | 'offline';
  lastSeen: string;
  ping?: number;
}

class SyncService {
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingTimer: NodeJS.Timeout | null = null;
  private deviceId: string;
  private serverUrl: string = 'ws://192.168.1.1:8080'; // Default LAN server
  private connectedDevices: ConnectedDevice[] = [];
  private listeners: ((data: SyncData) => void)[] = [];

  constructor() {
    this.deviceId = this.getOrCreateDeviceId();
    this.connect();
  }

  private getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem('lokal_device_id');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('lokal_device_id', deviceId);
    }
    return deviceId;
  }

  connect(serverUrl?: string) {
    if (serverUrl) {
      this.serverUrl = serverUrl;
    }

    try {
      this.ws = new WebSocket(this.serverUrl);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.register();
        this.startPing();
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.stopPing();
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.scheduleReconnect();
    }
  }

  private register() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const deviceInfo = {
        type: 'register',
        deviceId: this.deviceId,
        name: localStorage.getItem('lokal_device_name') || 'Unknown Device',
        role: localStorage.getItem('lokal_user_role') || 'waiter',
        timestamp: new Date().toISOString()
      };
      this.ws.send(JSON.stringify(deviceInfo));
    }
  }

  private startPing() {
    this.pingTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const pingStart = Date.now();
        this.ws.send(JSON.stringify({ type: 'ping', timestamp: pingStart }));
      }
    }, 15000);
  }

  private stopPing() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private scheduleReconnect() {
    if (!this.reconnectTimer) {
      this.reconnectTimer = setTimeout(() => {
        console.log('Attempting to reconnect...');
        this.connect();
      }, 10000);
    }
  }

  private handleMessage(data: any) {
    switch (data.type) {
      case 'sync':
        this.listeners.forEach(listener => listener(data));
        break;
      case 'devices':
        this.connectedDevices = data.devices;
        break;
      case 'pong':
        const ping = Date.now() - data.timestamp;
        console.log(`Ping: ${ping}ms`);
        break;
    }
  }

  sync(syncData: Omit<SyncData, 'deviceId' | 'timestamp'>) {
    const fullSyncData: SyncData = {
      ...syncData,
      deviceId: this.deviceId,
      timestamp: new Date().toISOString()
    };

    // Store locally first
    this.storeLocal(fullSyncData);

    // Send to network if connected
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'sync', ...fullSyncData }));
    }
  }

  private storeLocal(syncData: SyncData) {
    const syncQueue = JSON.parse(localStorage.getItem('lokal_sync_queue') || '[]');
    syncQueue.push(syncData);
    localStorage.setItem('lokal_sync_queue', JSON.stringify(syncQueue));
  }

  onSync(listener: (data: SyncData) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  getConnectedDevices(): ConnectedDevice[] {
    return this.connectedDevices;
  }

  pingAllDevices() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'ping_all' }));
    }
  }

  disconnect() {
    this.stopPing();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (this.ws) {
      this.ws.close();
    }
  }
}

export const syncService = new SyncService();
