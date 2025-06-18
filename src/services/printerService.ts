
import { useToast } from "@/hooks/use-toast";

export interface PrinterConfig {
  ip: string;
  port: string;
  enabled: boolean;
}

export interface Receipt {
  header: {
    restaurantName: string;
    address?: string;
    phone?: string;
  };
  order: {
    id: string;
    table?: string;
    room?: string;
    waiter: string;
    timestamp: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  totals: {
    subtotal: number;
    tax: number;
    serviceCharge: number;
    discount: number;
    total: number;
  };
  payment: {
    method: string;
    amount: number;
    change?: number;
  };
  footer?: string;
}

class PrinterService {
  private config: PrinterConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): PrinterConfig {
    const stored = localStorage.getItem('lokal_printer_config');
    return stored ? JSON.parse(stored) : {
      ip: '192.168.1.100',
      port: '9100',
      enabled: true
    };
  }

  updateConfig(config: PrinterConfig) {
    this.config = config;
    localStorage.setItem('lokal_printer_config', JSON.stringify(config));
  }

  private formatESCPOS(receipt: Receipt): string {
    let escpos = '';
    
    // ESC/POS commands
    const ESC = '\x1B';
    const INIT = ESC + '@';
    const CENTER = ESC + 'a1';
    const LEFT = ESC + 'a0';
    const BOLD_ON = ESC + 'E1';
    const BOLD_OFF = ESC + 'E0';
    const CUT = ESC + 'd3' + ESC + 'i';
    const FEED = '\n';

    // Initialize printer
    escpos += INIT;
    
    // Header
    escpos += CENTER + BOLD_ON;
    escpos += receipt.header.restaurantName + FEED;
    escpos += BOLD_OFF;
    if (receipt.header.address) escpos += receipt.header.address + FEED;
    if (receipt.header.phone) escpos += receipt.header.phone + FEED;
    
    // Separator
    escpos += LEFT + '================================' + FEED;
    
    // Order details
    escpos += `Order: ${receipt.order.id}` + FEED;
    if (receipt.order.table) escpos += `Table: ${receipt.order.table}` + FEED;
    if (receipt.order.room) escpos += `Room: ${receipt.order.room}` + FEED;
    escpos += `Waiter: ${receipt.order.waiter}` + FEED;
    escpos += `Time: ${new Date(receipt.order.timestamp).toLocaleString()}` + FEED;
    escpos += '================================' + FEED;
    
    // Items
    receipt.items.forEach(item => {
      const itemLine = `${item.quantity}x ${item.name}`;
      const priceLine = `₹${item.total.toFixed(2)}`;
      const spaces = 32 - itemLine.length - priceLine.length;
      escpos += itemLine + ' '.repeat(Math.max(0, spaces)) + priceLine + FEED;
    });
    
    escpos += '================================' + FEED;
    
    // Totals
    const addTotal = (label: string, amount: number) => {
      const totalLine = `${label}:`;
      const amountLine = `₹${amount.toFixed(2)}`;
      const spaces = 32 - totalLine.length - amountLine.length;
      escpos += totalLine + ' '.repeat(Math.max(0, spaces)) + amountLine + FEED;
    };
    
    addTotal('Subtotal', receipt.totals.subtotal);
    if (receipt.totals.tax > 0) addTotal('Tax', receipt.totals.tax);
    if (receipt.totals.serviceCharge > 0) addTotal('Service Charge', receipt.totals.serviceCharge);
    if (receipt.totals.discount > 0) addTotal('Discount', -receipt.totals.discount);
    
    escpos += '--------------------------------' + FEED;
    escpos += BOLD_ON;
    addTotal('TOTAL', receipt.totals.total);
    escpos += BOLD_OFF;
    
    // Payment
    escpos += '================================' + FEED;
    escpos += `Payment: ${receipt.payment.method}` + FEED;
    addTotal('Paid', receipt.payment.amount);
    if (receipt.payment.change) addTotal('Change', receipt.payment.change);
    
    // Footer
    if (receipt.footer) {
      escpos += '================================' + FEED;
      escpos += CENTER + receipt.footer + FEED;
    }
    
    escpos += LEFT + FEED + FEED;
    escpos += CUT;
    
    return escpos;
  }

  async printReceipt(receipt: Receipt): Promise<boolean> {
    if (!this.config.enabled) {
      console.log('Printer disabled');
      return false;
    }

    try {
      const escposData = this.formatESCPOS(receipt);
      
      // In a real implementation, this would send to the actual printer
      // For now, we'll simulate the network call
      const response = await fetch(`http://${this.config.ip}:${this.config.port}/print`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        body: escposData,
      });

      if (response.ok) {
        console.log('Receipt printed successfully');
        return true;
      } else {
        throw new Error(`Printer responded with status: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to print receipt:', error);
      // For demo purposes, we'll log the ESC/POS data
      console.log('ESC/POS Data would be sent to printer:', this.formatESCPOS(receipt));
      return false;
    }
  }

  async testPrinter(): Promise<boolean> {
    const testReceipt: Receipt = {
      header: {
        restaurantName: localStorage.getItem('lokal_restaurant_name') || 'LokalRestro',
        address: '123 Restaurant Street',
        phone: '+91 98765 43210'
      },
      order: {
        id: 'TEST-001',
        table: 'T1',
        waiter: 'Test User',
        timestamp: new Date().toISOString()
      },
      items: [
        { name: 'Test Item', quantity: 1, price: 100, total: 100 }
      ],
      totals: {
        subtotal: 100,
        tax: 18,
        serviceCharge: 10,
        discount: 0,
        total: 128
      },
      payment: {
        method: 'Cash',
        amount: 130,
        change: 2
      },
      footer: 'Thank you for testing!'
    };

    return this.printReceipt(testReceipt);
  }

  getConfig(): PrinterConfig {
    return { ...this.config };
  }
}

export const printerService = new PrinterService();
