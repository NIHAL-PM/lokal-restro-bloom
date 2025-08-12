import { WebSocketServer } from 'ws';
import { log } from './logger.js';

class DeviceSyncServer {
  constructor(port = 8765) {
    this.port = port;
    this.wss = null;
    this.clients = new Map();
    this.devices = new Map();
  }

  start() {
    this.wss = new WebSocketServer({ port: this.port });
    
    this.wss.on('connection', (ws, req) => {
      const clientId = this.generateClientId();
      const clientInfo = {
        id: clientId,
        ws: ws,
        ip: req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
        connectedAt: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        deviceInfo: null
      };
      
      this.clients.set(clientId, clientInfo);
      log(`WebSocket client connected: ${clientId} from ${clientInfo.ip}`);
      
      ws.on('message', (data) => {
        this.handleMessage(clientId, data);
      });
      
      ws.on('close', () => {
        log(`WebSocket client disconnected: ${clientId}`);
        this.clients.delete(clientId);
        this.devices.delete(clientId);
        this.broadcastDeviceList();
      });
      
      ws.on('error', (error) => {
        log(`WebSocket error for client ${clientId}: ${error.message}`);
      });
      
      // Send welcome message
      this.sendToClient(clientId, {
        type: 'connected',
        data: { clientId, timestamp: Date.now() }
      });
    });
    
    log(`WebSocket server started on port ${this.port}`);
    
    // Cleanup disconnected clients periodically
    setInterval(() => {
      this.cleanupClients();
    }, 30000);
  }

  generateClientId() {
    return `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  handleMessage(clientId, data) {
    try {
      const message = JSON.parse(data.toString());
      const client = this.clients.get(clientId);
      
      if (client) {
        client.lastSeen = new Date().toISOString();
      }
      
      switch (message.type) {
        case 'sync':
          this.handleSync(clientId, message);
          break;
        case 'heartbeat':
          this.handleHeartbeat(clientId, message);
          break;
        case 'discovery':
          this.handleDiscovery(clientId, message);
          break;
        case 'register_device':
          this.handleDeviceRegistration(clientId, message);
          break;
        case 'ping':
          this.handlePing(clientId, message);
          break;
        default:
          log(`Unknown message type: ${message.type} from client ${clientId}`);
      }
    } catch (error) {
      log(`Error parsing message from client ${clientId}: ${error.message}`);
    }
  }

  handleSync(clientId, message) {
    // Broadcast sync data to all other clients
    this.broadcast(message, clientId);
    log(`Sync message from ${clientId}: ${message.data?.type || 'unknown'}`);
  }

  handleHeartbeat(clientId, message) {
    // Update device status and respond with heartbeat
    this.updateDeviceStatus(clientId, 'online');
    this.sendToClient(clientId, {
      type: 'heartbeat_ack',
      data: { timestamp: Date.now() }
    });
  }

  handleDiscovery(clientId, message) {
    // Send list of connected devices
    this.sendDeviceList(clientId);
    this.broadcastDeviceList();
  }

  handleDeviceRegistration(clientId, message) {
    const deviceInfo = message.data;
    this.devices.set(clientId, {
      ...deviceInfo,
      clientId,
      status: 'online',
      lastSeen: new Date().toISOString()
    });
    
    log(`Device registered: ${deviceInfo.name} (${deviceInfo.type}) from ${clientId}`);
    this.broadcastDeviceList();
  }

  handlePing(clientId, message) {
    // Respond with pong including round-trip time
    this.sendToClient(clientId, {
      type: 'pong',
      data: { 
        id: message.data?.id,
        timestamp: Date.now(),
        originalTimestamp: message.data?.timestamp
      }
    });
  }

  updateDeviceStatus(clientId, status) {
    const device = this.devices.get(clientId);
    if (device) {
      device.status = status;
      device.lastSeen = new Date().toISOString();
    }
  }

  sendToClient(clientId, message) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === 1) { // WebSocket.OPEN
      try {
        client.ws.send(JSON.stringify(message));
      } catch (error) {
        log(`Error sending message to client ${clientId}: ${error.message}`);
      }
    }
  }

  broadcast(message, excludeClientId = null) {
    this.clients.forEach((client, clientId) => {
      if (clientId !== excludeClientId && client.ws.readyState === 1) {
        try {
          client.ws.send(JSON.stringify(message));
        } catch (error) {
          log(`Error broadcasting to client ${clientId}: ${error.message}`);
        }
      }
    });
  }

  sendDeviceList(clientId) {
    const devices = Array.from(this.devices.values());
    this.sendToClient(clientId, {
      type: 'device_list',
      data: devices
    });
  }

  broadcastDeviceList() {
    const devices = Array.from(this.devices.values());
    this.broadcast({
      type: 'device_list',
      data: devices
    });
  }

  cleanupClients() {
    const now = Date.now();
    const timeout = 5 * 60 * 1000; // 5 minutes
    
    this.clients.forEach((client, clientId) => {
      const lastSeen = new Date(client.lastSeen).getTime();
      if (now - lastSeen > timeout) {
        log(`Cleaning up inactive client: ${clientId}`);
        if (client.ws.readyState === 1) {
          client.ws.close();
        }
        this.clients.delete(clientId);
        this.devices.delete(clientId);
      }
    });
  }

  getStats() {
    return {
      connectedClients: this.clients.size,
      registeredDevices: this.devices.size,
      uptime: process.uptime(),
      port: this.port
    };
  }

  stop() {
    if (this.wss) {
      this.wss.close();
      log('WebSocket server stopped');
    }
  }
}

// Create and start the WebSocket server
const wsServer = new DeviceSyncServer(8765);
wsServer.start();

export default wsServer;