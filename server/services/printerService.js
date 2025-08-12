import net from 'net';
import { log } from '../logger.js';

export class WindowsPrinterService {
  constructor() {
    this.printers = new Map();
    this.defaultConfig = {
      ip: '192.168.1.100',
      port: 9100,
      timeout: 5000,
      encoding: 'ascii'
    };
  }

  // Register a printer with configuration
  registerPrinter(id, config) {
    this.printers.set(id, {
      ...this.defaultConfig,
      ...config,
      id,
      status: 'unknown',
      lastUsed: null
    });
    log(`Printer registered: ${id} at ${config.ip}:${config.port}`);
  }

  // Test printer connection
  async testPrinter(printerId) {
    const printer = this.printers.get(printerId);
    if (!printer) {
      throw new Error(`Printer ${printerId} not found`);
    }

    return new Promise((resolve, reject) => {
      const socket = new net.Socket();
      const timeout = setTimeout(() => {
        socket.destroy();
        reject(new Error('Connection timeout'));
      }, printer.timeout);

      socket.connect(printer.port, printer.ip, () => {
        clearTimeout(timeout);
        socket.end();
        printer.status = 'online';
        log(`Printer ${printerId} is online`);
        resolve(true);
      });

      socket.on('error', (error) => {
        clearTimeout(timeout);
        printer.status = 'offline';
        log(`Printer ${printerId} error: ${error.message}`);
        reject(new Error(`Connection failed: ${error.message}`));
      });
    });
  }

  // Send raw ESC/POS data to printer
  async sendToPrinter(printerId, data) {
    const printer = this.printers.get(printerId);
    if (!printer) {
      throw new Error(`Printer ${printerId} not found`);
    }

    return new Promise((resolve, reject) => {
      const socket = new net.Socket();
      
      const timeout = setTimeout(() => {
        socket.destroy();
        reject(new Error('Print timeout'));
      }, printer.timeout);

      socket.connect(printer.port, printer.ip, () => {
        clearTimeout(timeout);
        
        // Send the ESC/POS data
        socket.write(data, printer.encoding, (error) => {
          if (error) {
            socket.destroy();
            reject(new Error(`Print failed: ${error.message}`));
          } else {
            socket.end();
            printer.lastUsed = new Date().toISOString();
            printer.status = 'online';
            log(`Print job sent to ${printerId}`);
            resolve(true);
          }
        });
      });

      socket.on('error', (error) => {
        clearTimeout(timeout);
        printer.status = 'offline';
        log(`Print error for ${printerId}: ${error.message}`);
        reject(new Error(`Print failed: ${error.message}`));
      });
    });
  }

  // Generate ESC/POS commands for receipt
  generateReceiptESCPOS(receipt) {
    let escpos = '';
    
    // ESC/POS control characters
    const ESC = '\x1B';
    const GS = '\x1D';
    const INIT = ESC + '@';
    const CENTER = ESC + 'a1';
    const LEFT = ESC + 'a0';
    const RIGHT = ESC + 'a2';
    const BOLD_ON = ESC + 'E1';
    const BOLD_OFF = ESC + 'E0';
    const UNDERLINE_ON = ESC + '-1';
    const UNDERLINE_OFF = ESC + '-0';
    const CUT = GS + 'V1';
    const FEED = '\n';
    const DOUBLE_HEIGHT = ESC + '!1';
    const NORMAL_SIZE = ESC + '!0';

    // Initialize printer
    escpos += INIT;
    
    // Header
    escpos += CENTER + BOLD_ON + DOUBLE_HEIGHT;
    escpos += receipt.header.restaurantName + FEED;
    escpos += NORMAL_SIZE + BOLD_OFF;
    
    if (receipt.header.address) {
      escpos += receipt.header.address + FEED;
    }
    if (receipt.header.phone) {
      escpos += 'Tel: ' + receipt.header.phone + FEED;
    }
    
    // Separator line
    escpos += LEFT + UNDERLINE_ON;
    escpos += '='.repeat(42) + FEED;
    escpos += UNDERLINE_OFF;
    
    // Order details
    escpos += BOLD_ON + 'ORDER DETAILS' + BOLD_OFF + FEED;
    escpos += `Order ID: ${receipt.order.id}` + FEED;
    if (receipt.order.table) escpos += `Table: ${receipt.order.table}` + FEED;
    if (receipt.order.room) escpos += `Room: ${receipt.order.room}` + FEED;
    escpos += `Waiter: ${receipt.order.waiter}` + FEED;
    escpos += `Time: ${new Date(receipt.order.timestamp).toLocaleString()}` + FEED;
    
    escpos += '-'.repeat(42) + FEED;
    
    // Items header
    escpos += BOLD_ON;
    escpos += this.formatLine('Item', 'Qty', 'Price', 'Total');
    escpos += BOLD_OFF;
    escpos += '-'.repeat(42) + FEED;
    
    // Items
    receipt.items.forEach(item => {
      escpos += this.formatItemLine(item.name, item.quantity.toString(), item.price, item.total);
    });
    
    escpos += '-'.repeat(42) + FEED;
    
    // Totals
    escpos += this.formatTotalLine('Subtotal:', receipt.totals.subtotal);
    if (receipt.totals.tax > 0) {
      escpos += this.formatTotalLine('Tax:', receipt.totals.tax);
    }
    if (receipt.totals.serviceCharge > 0) {
      escpos += this.formatTotalLine('Service Charge:', receipt.totals.serviceCharge);
    }
    if (receipt.totals.discount > 0) {
      escpos += this.formatTotalLine('Discount:', -receipt.totals.discount);
    }
    
    escpos += '='.repeat(42) + FEED;
    escpos += BOLD_ON + DOUBLE_HEIGHT;
    escpos += this.formatTotalLine('TOTAL:', receipt.totals.total);
    escpos += NORMAL_SIZE + BOLD_OFF;
    escpos += '='.repeat(42) + FEED;
    
    // Payment details
    escpos += FEED + BOLD_ON + 'PAYMENT DETAILS' + BOLD_OFF + FEED;
    escpos += `Method: ${receipt.payment.method}` + FEED;
    escpos += this.formatTotalLine('Paid:', receipt.payment.amount);
    if (receipt.payment.change && receipt.payment.change > 0) {
      escpos += this.formatTotalLine('Change:', receipt.payment.change);
    }
    
    // Footer
    if (receipt.footer) {
      escpos += FEED + CENTER;
      escpos += receipt.footer + FEED;
    }
    
    escpos += LEFT + FEED;
    escpos += 'Thank you for your visit!' + FEED;
    escpos += 'Visit us again!' + FEED;
    escpos += FEED + FEED + FEED;
    
    // Cut paper
    escpos += CUT;
    
    return escpos;
  }

  // Format a line with columns
  formatLine(col1, col2, col3, col4) {
    const total = 42;
    const c1 = 16, c2 = 4, c3 = 8, c4 = 8;
    
    return this.padRight(col1, c1) + 
           this.padRight(col2, c2) + 
           this.padLeft(col3, c3) + 
           this.padLeft(col4, c4) + '\n';
  }

  // Format item line
  formatItemLine(name, qty, price, total) {
    const nameLen = 24;
    const qtyLen = 4;
    const priceLen = 6;
    const totalLen = 8;
    
    let result = '';
    // Truncate name if too long
    const truncatedName = name.length > nameLen ? name.substring(0, nameLen - 3) + '...' : name;
    
    result += this.padRight(truncatedName, nameLen);
    result += this.padRight(qty, qtyLen);
    result += this.padLeft('₹' + price.toFixed(2), priceLen);
    result += this.padLeft('₹' + total.toFixed(2), totalLen);
    result += '\n';
    
    return result;
  }

  // Format total line
  formatTotalLine(label, amount) {
    const labelLen = 30;
    const amountLen = 12;
    
    return this.padRight(label, labelLen) + 
           this.padLeft('₹' + amount.toFixed(2), amountLen) + '\n';
  }

  // Utility functions for formatting
  padRight(str, len) {
    return str.substring(0, len).padEnd(len, ' ');
  }

  padLeft(str, len) {
    return str.substring(0, len).padStart(len, ' ');
  }

  // Kitchen order ticket (KOT)
  generateKOT(order) {
    let escpos = '';
    
    const ESC = '\x1B';
    const GS = '\x1D';
    const INIT = ESC + '@';
    const CENTER = ESC + 'a1';
    const LEFT = ESC + 'a0';
    const BOLD_ON = ESC + 'E1';
    const BOLD_OFF = ESC + 'E0';
    const CUT = GS + 'V1';
    const FEED = '\n';
    const DOUBLE_HEIGHT = ESC + '!1';
    const NORMAL_SIZE = ESC + '!0';

    escpos += INIT;
    escpos += CENTER + BOLD_ON + DOUBLE_HEIGHT;
    escpos += 'KITCHEN ORDER' + FEED;
    escpos += NORMAL_SIZE + BOLD_OFF;
    
    escpos += LEFT;
    escpos += '='.repeat(32) + FEED;
    escpos += `Order: ${order.id}` + FEED;
    escpos += `Table: ${order.table || 'N/A'}` + FEED;
    escpos += `Time: ${new Date().toLocaleTimeString()}` + FEED;
    escpos += `Waiter: ${order.waiter}` + FEED;
    escpos += '-'.repeat(32) + FEED;
    
    order.items.forEach(item => {
      escpos += BOLD_ON + `${item.quantity}x ${item.name}` + BOLD_OFF + FEED;
      if (item.notes) {
        escpos += `   Note: ${item.notes}` + FEED;
      }
      escpos += FEED;
    });
    
    escpos += '-'.repeat(32) + FEED;
    escpos += CENTER + 'Priority: ' + (order.priority || 'Normal') + FEED;
    escpos += FEED + FEED + FEED;
    escpos += CUT;
    
    return escpos;
  }

  // Print receipt
  async printReceipt(printerId, receipt) {
    const escposData = this.generateReceiptESCPOS(receipt);
    return await this.sendToPrinter(printerId, escposData);
  }

  // Print KOT
  async printKOT(printerId, order) {
    const escposData = this.generateKOT(order);
    return await this.sendToPrinter(printerId, escposData);
  }

  // Get printer status
  getPrinterStatus(printerId) {
    return this.printers.get(printerId);
  }

  // Get all printers
  getAllPrinters() {
    return Array.from(this.printers.values());
  }

  // Discover printers on network (basic IP scan)
  async discoverPrinters(subnet = '192.168.1', startIP = 1, endIP = 254) {
    const discoveries = [];
    const promises = [];
    
    for (let i = startIP; i <= endIP; i++) {
      const ip = `${subnet}.${i}`;
      const promise = this.checkPrinterAtIP(ip, 9100)
        .then(isOnline => {
          if (isOnline) {
            discoveries.push({ ip, port: 9100, status: 'online' });
          }
        })
        .catch(() => {
          // Ignore errors for discovery
        });
      promises.push(promise);
    }
    
    await Promise.all(promises);
    return discoveries;
  }

  async checkPrinterAtIP(ip, port) {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      const timeout = setTimeout(() => {
        socket.destroy();
        resolve(false);
      }, 1000);

      socket.connect(port, ip, () => {
        clearTimeout(timeout);
        socket.end();
        resolve(true);
      });

      socket.on('error', () => {
        clearTimeout(timeout);
        resolve(false);
      });
    });
  }
}

// Legacy function compatibility
export async function printReceipt(data) {
  const printerService = new WindowsPrinterService();
  
  // Use default printer if available
  const defaultPrinter = 'default';
  printerService.registerPrinter(defaultPrinter, {
    ip: process.env.PRINTER_IP || '192.168.1.100',
    port: parseInt(process.env.PRINTER_PORT || '9100')
  });
  
  try {
    await printerService.printReceipt(defaultPrinter, data);
    return true;
  } catch (error) {
    log(`Print failed: ${error.message}`);
    return false;
  }
}

export default WindowsPrinterService;
