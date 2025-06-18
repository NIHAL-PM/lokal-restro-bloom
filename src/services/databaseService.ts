interface DatabaseSchema {
  orders: Order[];
  menuItems: MenuItem[];
  tables: Table[];
  rooms: Room[];
  users: User[];
  settings: AppSettings;
  transactions: Transaction[];
  syncLog: SyncLogEntry[];
}

interface Order {
  id: string;
  type: 'dine-in' | 'takeaway' | 'room-service';
  tableId?: string;
  roomId?: string;
  items: OrderItem[];
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';
  waiterId: string;
  timestamp: string;
  notes?: string;
  subtotal: number;
  tax: number;
  serviceCharge: number;
  discount: number;
  total: number;
}

interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  modifiers: string[];
  notes?: string;
  status: 'pending' | 'preparing' | 'ready';
}

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  available: boolean;
  stock: number;
  variants: string[];
  addOns: string[];
  image?: string;
}

interface Table {
  id: string;
  number: string;
  capacity: number;
  status: 'free' | 'occupied' | 'pending-billing' | 'reserved';
  currentOrderId?: string;
  occupiedSince?: string;
}

interface Room {
  id: string;
  number: string;
  type: string;
  price: number;
  status: 'vacant' | 'occupied' | 'cleaning' | 'maintenance' | 'reserved';
  guest?: Guest;
  orderIds: string[];
  checkInTime?: string;
}

interface Guest {
  name: string;
  phone: string;
  idNumber?: string;
  guests: number;
}

interface User {
  id: string;
  name: string;
  role: 'admin' | 'waiter' | 'chef' | 'cashier' | 'housekeeping';
  pin: string;
  active: boolean;
}

interface AppSettings {
  restaurantName: string;
  logo?: string;
  primaryColor: string;
  currency: string;
  taxRate: number;
  serviceChargeRate: number;
  enableSounds: boolean;
  soundVolume: number;
  printerConfig: {
    ip: string;
    port: string;
    enabled: boolean;
  };
  modules: {
    roomManagement: boolean;
    kds: boolean;
    reports: boolean;
  };
  darkMode: boolean;
}

interface Transaction {
  id: string;
  orderId: string;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'upi';
  timestamp: string;
  cashierId: string;
}

interface SyncLogEntry {
  id: string;
  timestamp: string;
  type: 'sync' | 'conflict' | 'error';
  message: string;
  deviceId: string;
}

class DatabaseService {
  private data: DatabaseSchema;
  private storageKey = 'lokalrestro_data';
  private listeners: ((data: DatabaseSchema) => void)[] = [];

  constructor() {
    this.data = this.loadFromStorage() || this.getDefaultData();
    this.saveToStorage();
  }

  private getDefaultData(): DatabaseSchema {
    return {
      orders: [],
      menuItems: this.getDefaultMenuItems(),
      tables: this.getDefaultTables(),
      rooms: this.getDefaultRooms(),
      users: this.getDefaultUsers(),
      settings: this.getDefaultSettings(),
      transactions: [],
      syncLog: []
    };
  }

  private getDefaultMenuItems(): MenuItem[] {
    return [
      {
        id: '1',
        name: 'Butter Chicken',
        category: 'Main Course',
        price: 350,
        description: 'Creamy tomato-based chicken curry',
        available: true,
        stock: 25,
        variants: ['Regular', 'Large'],
        addOns: ['Extra Rice', 'Naan']
      },
      {
        id: '2',
        name: 'Paneer Tikka',
        category: 'Starters',
        price: 280,
        description: 'Grilled cottage cheese with spices',
        available: true,
        stock: 15,
        variants: ['6pcs', '12pcs'],
        addOns: ['Mint Chutney', 'Onion Salad']
      },
      {
        id: '3',
        name: 'Biryani',
        category: 'Rice',
        price: 320,
        description: 'Fragrant basmati rice with spices',
        available: true,
        stock: 20,
        variants: ['Veg', 'Chicken', 'Mutton'],
        addOns: ['Raita', 'Pickle']
      }
    ];
  }

  private getDefaultTables(): Table[] {
    return Array.from({ length: 10 }, (_, i) => ({
      id: `T${i + 1}`,
      number: String(i + 1),
      capacity: [2, 4, 6][i % 3],
      status: 'free'
    }));
  }

  private getDefaultRooms(): Room[] {
    return Array.from({ length: 20 }, (_, i) => ({
      id: `R${101 + i}`,
      number: String(101 + i),
      type: ['Standard', 'Deluxe', 'Suite'][i % 3],
      price: [2500, 3500, 5000][i % 3],
      status: 'vacant',
      orderIds: []
    }));
  }

  private getDefaultUsers(): User[] {
    return [
      { id: '1', name: 'Admin User', role: 'admin', pin: '1234', active: true },
      { id: '2', name: 'John Waiter', role: 'waiter', pin: '1111', active: true },
      { id: '3', name: 'Chef Mike', role: 'chef', pin: '2222', active: true },
      { id: '4', name: 'Jane Cashier', role: 'cashier', pin: '3333', active: true },
      { id: '5', name: 'House Keeper', role: 'housekeeping', pin: '4444', active: true }
    ];
  }

  private getDefaultSettings(): AppSettings {
    return {
      restaurantName: 'LokalRestro',
      primaryColor: '#3B82F6',
      currency: '₹',
      taxRate: 18,
      serviceChargeRate: 10,
      enableSounds: true,
      soundVolume: 50,
      printerConfig: {
        ip: '192.168.1.100',
        port: '9100',
        enabled: true
      },
      modules: {
        roomManagement: true,
        kds: true,
        reports: true
      },
      darkMode: false
    };
  }

  private loadFromStorage(): DatabaseSchema | null {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to load data from storage:', error);
      return null;
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to save data to storage:', error);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.data));
  }

  // Public API
  getData(): DatabaseSchema {
    return { ...this.data };
  }

  updateData(updates: Partial<DatabaseSchema>): void {
    this.data = { ...this.data, ...updates };
    this.saveToStorage();
  }

  subscribe(listener: (data: DatabaseSchema) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Orders
  createOrder(order: Omit<Order, 'id'>): Order {
    const newOrder: Order = {
      ...order,
      id: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    this.data.orders.push(newOrder);
    this.saveToStorage();
    return newOrder;
  }

  updateOrder(id: string, updates: Partial<Order>): void {
    const index = this.data.orders.findIndex(o => o.id === id);
    if (index !== -1) {
      this.data.orders[index] = { ...this.data.orders[index], ...updates };
      this.saveToStorage();
    }
  }

  // Menu Items
  createMenuItem(item: Omit<MenuItem, 'id'>): MenuItem {
    const newItem: MenuItem = {
      ...item,
      id: `MENU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    this.data.menuItems.push(newItem);
    this.saveToStorage();
    return newItem;
  }

  updateMenuItem(id: string, updates: Partial<MenuItem>): void {
    const index = this.data.menuItems.findIndex(m => m.id === id);
    if (index !== -1) {
      this.data.menuItems[index] = { ...this.data.menuItems[index], ...updates };
      this.saveToStorage();
    }
  }

  deleteMenuItem(id: string): void {
    this.data.menuItems = this.data.menuItems.filter(m => m.id !== id);
    this.saveToStorage();
  }

  // Tables
  updateTable(id: string, updates: Partial<Table>): void {
    const index = this.data.tables.findIndex(t => t.id === id);
    if (index !== -1) {
      this.data.tables[index] = { ...this.data.tables[index], ...updates };
      this.saveToStorage();
    }
  }

  // Rooms
  updateRoom(id: string, updates: Partial<Room>): void {
    const index = this.data.rooms.findIndex(r => r.id === id);
    if (index !== -1) {
      this.data.rooms[index] = { ...this.data.rooms[index], ...updates };
      this.saveToStorage();
    }
  }

  // Settings
  updateSettings(updates: Partial<AppSettings>): void {
    this.data.settings = { ...this.data.settings, ...updates };
    this.saveToStorage();
  }

  // Transactions
  createTransaction(transaction: Omit<Transaction, 'id'>): Transaction {
    const newTransaction: Transaction = {
      ...transaction,
      id: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    this.data.transactions.push(newTransaction);
    this.saveToStorage();
    return newTransaction;
  }

  // Sync Log
  addSyncLog(entry: Omit<SyncLogEntry, 'id'>): void {
    const logEntry: SyncLogEntry = {
      ...entry,
      id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    this.data.syncLog.push(logEntry);
    
    // Keep only last 1000 entries
    if (this.data.syncLog.length > 1000) {
      this.data.syncLog = this.data.syncLog.slice(-1000);
    }
    
    this.saveToStorage();
  }

  // Backup & Restore
  exportData(): string {
    return JSON.stringify({
      ...this.data,
      exportTimestamp: new Date().toISOString(),
      version: '1.0.0'
    }, null, 2);
  }

  importData(jsonData: string): void {
    try {
      const importedData = JSON.parse(jsonData);
      // Validate structure
      if (importedData.orders && importedData.menuItems && importedData.settings) {
        this.data = {
          orders: importedData.orders || [],
          menuItems: importedData.menuItems || [],
          tables: importedData.tables || [],
          rooms: importedData.rooms || [],
          users: importedData.users || [],
          settings: importedData.settings || this.getDefaultSettings(),
          transactions: importedData.transactions || [],
          syncLog: importedData.syncLog || []
        };
        this.saveToStorage();
      } else {
        throw new Error('Invalid data structure');
      }
    } catch (error) {
      throw new Error('Failed to import data: ' + (error as Error).message);
    }
  }
}

export const databaseService = new DatabaseService();
export type { DatabaseSchema, Order, MenuItem, Table, Room, User, AppSettings, Transaction, SyncLogEntry, Guest, OrderItem };
