# LokalRestro Windows Deployment Guide

## System Requirements

- Windows 10/11 (64-bit)
- Node.js 18.0 or higher
- Network connectivity (LAN/WiFi)
- ESC/POS thermal printers (optional)

## Installation Steps

### 1. Download and Extract
```bash
# Extract the application to a folder like:
C:\LokalRestro\
```

### 2. Install Node.js Dependencies
```bash
# Open Command Prompt as Administrator
cd C:\LokalRestro
npm install

# Install server dependencies
cd server
npm install
cd ..
```

### 3. Configure Environment Variables
Create a `.env` file in the server directory:
```env
# Server Configuration
PORT=4000
SESSION_SECRET=your-secret-key-here

# Printer Configuration (update with your printer IPs)
PRINTER_IP=192.168.1.100
PRINTER_PORT=9100
KITCHEN_PRINTER_IP=192.168.1.101
KITCHEN_PRINTER_PORT=9100

# Database
DB_PATH=./db/lokal-restro.json
```

### 4. Build Frontend
```bash
npm run build
```

### 5. Configure Windows Firewall
Add firewall exceptions for:
- Port 4000 (HTTP API Server)
- Port 8765 (WebSocket Sync Server)
- Port 5173 (Development server, if needed)

```cmd
# Run as Administrator
netsh advfirewall firewall add rule name="LokalRestro API" dir=in action=allow protocol=TCP localport=4000
netsh advfirewall firewall add rule name="LokalRestro Sync" dir=in action=allow protocol=TCP localport=8765
```

### 6. Create Windows Service (Optional)
Create `lokal-restro-service.js`:
```javascript
const { Service } = require('node-windows');

const svc = new Service({
  name: 'LokalRestro Server',
  description: 'LokalRestro Restaurant Management System',
  script: 'C:\\LokalRestro\\server\\index.js',
  nodeOptions: [
    '--harmony',
    '--max_old_space_size=4096'
  ]
});

svc.on('install', () => {
  svc.start();
});

svc.install();
```

### 7. Start the Application
```bash
# Start the server
cd server
node index.js

# Or use PM2 for production
npm install -g pm2
pm2 start index.js --name "lokal-restro"
pm2 startup windows
pm2 save
```

## Network Configuration

### For Local Area Network (LAN) Setup:

1. **Server Machine (Main Terminal)**:
   - Install and run LokalRestro as above
   - Note the IP address: `ipconfig`
   - Example: 192.168.1.50

2. **Client Devices (Tablets, Mobile, Other PCs)**:
   - Open web browser
   - Navigate to: `http://192.168.1.50:4000`
   - Or serve the built frontend: `http://192.168.1.50:5173`

3. **Static IP Configuration** (Recommended):
   ```cmd
   # Set static IP (run as Administrator)
   netsh interface ip set address "Wi-Fi" static 192.168.1.50 255.255.255.0 192.168.1.1
   ```

### For Multiple Location Setup:

1. **VPN Configuration**: Use VPN to connect multiple locations
2. **Port Forwarding**: Configure router for external access
3. **Cloud Hosting**: Deploy on cloud servers if needed

## Printer Configuration

### Network Printer Setup:

1. **Connect Printer to Network**:
   - Use Ethernet cable or WiFi
   - Set static IP address on printer
   - Note IP address (e.g., 192.168.1.100)

2. **Test Printer Connection**:
   ```cmd
   # Test network connectivity
   ping 192.168.1.100
   telnet 192.168.1.100 9100
   ```

3. **Configure in LokalRestro**:
   - Go to Settings → Printer Settings
   - Enter printer IP and port (usually 9100)
   - Test connection

### USB Printer Setup (via Print Server):

1. **Install Print Server Software** (e.g., PrintNode, Share-a-Printer)
2. **Configure Network Bridge** to expose USB printer on network
3. **Use bridge IP/Port** in LokalRestro settings

## Mobile Device Configuration

### Android Tablets/Phones:
1. Connect to same WiFi network
2. Open Chrome browser
3. Navigate to: `http://[SERVER-IP]:4000`
4. Add to Home Screen for app-like experience
5. Enable notifications for order updates

### iOS Devices:
1. Connect to same WiFi network
2. Open Safari browser
3. Navigate to: `http://[SERVER-IP]:4000`
4. Add to Home Screen
5. Configure notifications

### Windows Tablets:
1. Install Chrome or Edge browser
2. Connect to network
3. Navigate to server URL
4. Enable full-screen mode

## Device Roles Configuration

### Kitchen Display System (KDS):
- Large tablet or PC monitor
- URL: `http://[SERVER-IP]:4000/kitchen`
- Role: Kitchen staff to view and manage orders

### Point of Sale (POS):
- Counter terminal or tablet
- URL: `http://[SERVER-IP]:4000/billing`
- Role: Cashier for billing and payments

### Waiter Mobile:
- Smartphone or small tablet
- URL: `http://[SERVER-IP]:4000/orders`
- Role: Taking orders and table management

### Admin Terminal:
- Main computer or tablet
- URL: `http://[SERVER-IP]:4000/admin`
- Role: Management and configuration

## Troubleshooting

### Common Issues:

1. **Server Won't Start**:
   ```bash
   # Check if port is in use
   netstat -an | findstr :4000
   
   # Kill process if needed
   taskkill /F /PID [PID_NUMBER]
   ```

2. **Devices Can't Connect**:
   - Check firewall settings
   - Verify IP addresses
   - Test network connectivity: `ping [SERVER-IP]`

3. **Printer Not Working**:
   - Test printer network connection
   - Check printer IP and port settings
   - Verify ESC/POS compatibility

4. **Sync Issues**:
   - Check WebSocket connection (port 8765)
   - Verify all devices on same network
   - Check browser console for errors

### Performance Optimization:

1. **Hardware Requirements**:
   - Minimum: 4GB RAM, Intel i3 or equivalent
   - Recommended: 8GB RAM, Intel i5 or equivalent
   - SSD storage for better performance

2. **Network Optimization**:
   - Use Gigabit Ethernet for main server
   - 5GHz WiFi for mobile devices
   - Quality router with sufficient bandwidth

3. **Browser Optimization**:
   - Use Chrome or Edge for best performance
   - Clear cache regularly
   - Disable unnecessary extensions

## Security Considerations

1. **Network Security**:
   - Use WPA3 WiFi encryption
   - Change default router passwords
   - Enable firewall rules

2. **Application Security**:
   - Change default admin PIN
   - Regular data backups
   - Keep software updated

3. **Physical Security**:
   - Secure server location
   - Lock screen savers on terminals
   - Access control for admin functions

## Backup and Recovery

### Automatic Backup:
Create `backup.bat` file:
```batch
@echo off
set BACKUP_DIR=C:\LokalRestro\Backups
set DATE=%date:~-4,4%%date:~-10,2%%date:~-7,2%
mkdir "%BACKUP_DIR%\%DATE%"
xcopy "C:\LokalRestro\server\db" "%BACKUP_DIR%\%DATE%\db\" /E /I /Y
echo Backup completed: %BACKUP_DIR%\%DATE%
```

### Schedule Backup:
```cmd
# Schedule daily backup at 2 AM
schtasks /create /tn "LokalRestro Backup" /tr "C:\LokalRestro\backup.bat" /sc daily /st 02:00
```

## Support and Maintenance

1. **Log Files**: Check `server/logs/` for error logs
2. **Updates**: Regular software updates via npm
3. **Monitoring**: Use PM2 dashboard for system monitoring
4. **Support**: Keep documentation and contact information accessible