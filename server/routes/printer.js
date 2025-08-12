import express from 'express';
import { printReceipt, WindowsPrinterService } from '../services/printerService.js';

const router = express.Router();
const printerService = new WindowsPrinterService();

// Initialize default printers
printerService.registerPrinter('main', {
  ip: process.env.PRINTER_IP || '192.168.1.100',
  port: parseInt(process.env.PRINTER_PORT || '9100'),
  enabled: true
});

printerService.registerPrinter('kitchen', {
  ip: process.env.KITCHEN_PRINTER_IP || '192.168.1.101',
  port: parseInt(process.env.KITCHEN_PRINTER_PORT || '9100'),
  enabled: true
});

// Print receipt
router.post('/print', async (req, res) => {
  try {
    await printReceipt(req.body);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Print receipt to specific printer
router.post('/print-receipt', async (req, res) => {
  try {
    const { printerIP, printerPort, receipt } = req.body;
    const printerId = `temp-${Date.now()}`;
    
    printerService.registerPrinter(printerId, {
      ip: printerIP,
      port: printerPort,
      enabled: true
    });
    
    await printerService.printReceipt(printerId, receipt);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Print raw ESC/POS data
router.post('/print-raw', async (req, res) => {
  try {
    const { printerIP, printerPort, data } = req.body;
    const printerId = `temp-${Date.now()}`;
    
    printerService.registerPrinter(printerId, {
      ip: printerIP,
      port: printerPort,
      enabled: true
    });
    
    await printerService.sendToPrinter(printerId, data);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Print Kitchen Order Ticket (KOT)
router.post('/print-kot', async (req, res) => {
  try {
    const { order } = req.body;
    await printerService.printKOT('kitchen', order);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Test printer connection
router.post('/test', async (req, res) => {
  try {
    const { ip, port } = req.body;
    const testId = `test-${Date.now()}`;
    
    printerService.registerPrinter(testId, {
      ip: ip || '192.168.1.100',
      port: parseInt(port) || 9100,
      enabled: true
    });
    
    const result = await printerService.testPrinter(testId);
    res.json({ success: result, connected: result });
  } catch (e) {
    res.status(500).json({ error: e.message, connected: false });
  }
});

// Discover printers on network
router.get('/discover', async (req, res) => {
  try {
    const { subnet = '192.168.1' } = req.query;
    const printers = await printerService.discoverPrinters(subnet);
    res.json({ printers });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get printer status
router.get('/status/:printerId', async (req, res) => {
  try {
    const status = printerService.getPrinterStatus(req.params.printerId);
    res.json({ status });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get all registered printers
router.get('/printers', async (req, res) => {
  try {
    const printers = printerService.getAllPrinters();
    res.json({ printers });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
