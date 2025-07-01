
# LokalRestro - Complete Restaurant & Hotel Management System

![LokalRestro Logo](https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=400&fit=crop&crop=center)

## 🌟 Overview

LokalRestro is a comprehensive, offline-first restaurant and hotel management system built for local establishments. It operates entirely on your local network (LAN) without requiring internet connectivity, ensuring your business operations continue uninterrupted.

### Key Features

- **🏠 Offline-First Architecture** - Works without internet, data stored locally
- **🔄 Real-time LAN Synchronization** - WebSocket-based sync across multiple devices
- **🖨️ ESC/POS Thermal Printing** - Direct integration with thermal printers
- **👥 Multi-Role Support** - Admin, Waiter, Chef, Cashier, Housekeeping roles
- **📱 Responsive Design** - Works on desktop, tablet, and mobile devices
- **🌙 Dark Mode Support** - Modern UI with light/dark theme switching
- **🔐 Secure Authentication** - PIN-based user authentication system

## 🏗️ System Architecture

### Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **UI Framework**: ShadCN UI + Tailwind CSS
- **Build Tool**: Vite
- **State Management**: React Context + Local Storage
- **Database**: PouchDB/LocalStorage (offline-first)
- **Real-time Sync**: WebSocket + LocalStorage fallback
- **Printing**: ESC/POS thermal printer integration
- **Charts & Analytics**: Recharts
- **Icons**: Lucide React

### Core Modules

1. **Dashboard** - Real-time overview of restaurant operations
2. **Order Management** - Create, track, and manage customer orders
3. **Kitchen Display System (KDS)** - Digital kitchen workflow management
4. **Billing System** - Process payments and generate receipts
5. **Table Management** - Manage restaurant seating and table status
6. **Menu Management** - Add, edit, and organize menu items
7. **Room Management** - Hotel room booking and guest management
8. **Reports & Analytics** - Sales reports and business insights
9. **Settings** - System configuration and customization
10. **Admin Tools** - User management and system administration

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- ESC/POS thermal printer (optional, for printing functionality)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-repo/lokalrestro.git
   cd lokalrestro
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Access the application**
   - Open your browser and navigate to `http://localhost:5173`
   - Use demo credentials to login (see Login Screen)

### Production Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Serve the built files**
   ```bash
   npm run preview
   ```

3. **Deploy to your local server**
   - Copy the `dist` folder to your web server
   - Configure your server to serve the SPA (Single Page Application)
   - Ensure WebSocket support for real-time sync

### Network Setup for LAN Sync

1. **Configure your router/network**
   - Ensure all devices are on the same LAN
   - Open required ports (default: 8765 for WebSocket)

2. **Update configuration**
   - Modify `src/services/syncService.ts` with your WebSocket server details
   - Configure printer IP addresses in Settings

3. **Test connectivity**
   - Use the Admin Tools to test device discovery
   - Verify sync status in the header

## 👤 User Roles & Permissions

### Admin
- Full system access
- User management
- Settings configuration
- Reports and analytics
- Backup and restore

### Waiter
- Order creation and management
- Table management
- Customer service
- Basic reporting

### Chef
- Kitchen Display System access
- Order status updates
- Menu item management
- Kitchen workflow

### Cashier
- Billing and payment processing
- Receipt generation
- Transaction management
- Daily sales reports

### Housekeeping
- Room management
- Guest check-ins/check-outs
- Room status updates
- Cleaning schedules

## 🖨️ Printer Configuration

### Supported Printers
- Any ESC/POS compatible thermal printer
- Network-enabled printers (Ethernet/WiFi)
- USB printers (with network print server)

### Setup Instructions

1. **Connect printer to network**
   - Assign static IP address to printer
   - Note down IP address and port (usually 9100)

2. **Configure in LokalRestro**
   - Go to Settings → Printer Settings
   - Enter printer IP and port
   - Click "Test Printer" to verify connection

3. **Receipt Format**
   - Customizable header with restaurant details
   - Itemized billing with taxes and charges
   - Multiple payment method support
   - QR codes and promotional messages

## 🔄 Data Synchronization

### How It Works

1. **Primary Sync Method**: WebSocket connection between devices
2. **Fallback Method**: localStorage events for browser tabs
3. **Conflict Resolution**: Last-write-wins with timestamp comparison
4. **Data Integrity**: Automatic retry and queue management

### Sync Status Indicators

- **🟢 Green Wifi Icon**: Connected and syncing
- **🔴 Red Wifi Icon**: Offline mode (local only)
- **Device Counter**: Shows connected devices count

### Troubleshooting Sync Issues

1. **Check network connectivity**
2. **Verify WebSocket server is running**
3. **Ensure all devices are on same LAN**
4. **Check firewall settings**
5. **Restart devices if needed**

## 📊 Reporting & Analytics

### Available Reports

- **Daily Sales Report**: Revenue, orders, and performance metrics
- **Menu Performance**: Best-selling items and revenue by category
- **Staff Performance**: Orders and sales by waiter
- **Payment Analysis**: Payment method distribution
- **Time-based Analysis**: Peak hours and trends

### Export Options

- **CSV Export**: For spreadsheet analysis
- **JSON Export**: Complete data export
- **Print Reports**: Direct printing support

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_WEBSOCKET_URL=ws://localhost:8765
VITE_PRINTER_DEFAULT_IP=192.168.1.100
VITE_PRINTER_DEFAULT_PORT=9100
VITE_APP_VERSION=1.0.0
```

### Customization Options

- **Restaurant Branding**: Logo, name, colors, and theme
- **Tax Rates**: Configurable tax and service charge rates
- **Module Toggles**: Enable/disable specific modules
- **Sound Notifications**: Customizable audio alerts
- **Receipt Templates**: Customize receipt layout and content

## 🔒 Security Features

### Authentication
- PIN-based user authentication
- Role-based access control
- Session management
- Automatic logout

### Data Security
- Local data storage (no cloud dependency)
- Encrypted local storage options
- Audit trail for all transactions
- Backup and restore functionality

## 🛠️ Development

### Project Structure

```
src/
├── components/          # React components
│   ├── admin/          # Admin tools
│   ├── auth/           # Authentication
│   ├── billing/        # Billing system
│   ├── dashboard/      # Dashboard
│   ├── kitchen/        # Kitchen display
│   ├── layout/         # Layout components
│   ├── menu/           # Menu management
│   ├── orders/         # Order management
│   ├── reports/        # Reports & analytics
│   ├── rooms/          # Room management
│   ├── settings/       # Settings
│   ├── tables/         # Table management
│   └── ui/             # UI components (ShadCN)
├── hooks/              # Custom React hooks
├── services/           # Business logic services
│   ├── databaseService.ts  # Local database
│   ├── syncService.ts      # Real-time sync
│   ├── printerService.ts   # Printer integration
│   └── soundService.ts     # Audio notifications
├── lib/                # Utility functions
└── pages/              # Page components
```

### Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run type checking
npm run type-check

# Run linting
npm run lint

# Preview production build
npm run preview
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📱 Mobile Support

### Responsive Design
- Optimized for tablets (primary POS devices)
- Mobile-friendly interface for waiters
- Touch-optimized controls
- Offline functionality on mobile

### PWA Features
- Add to home screen
- Offline caching
- Background sync
- Push notifications (optional)

## 🐛 Troubleshooting

### Common Issues

1. **Sync not working**
   - Check network connectivity
   - Verify WebSocket server
   - Check firewall settings

2. **Printer not responding**
   - Verify IP address and port
   - Check network connection
   - Test with ping command

3. **Performance issues**
   - Clear browser cache
   - Check available storage
   - Restart application

4. **Data loss**
   - Check local storage
   - Restore from backup
   - Contact support

### Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Report bugs via GitHub issues
- **Community**: Join our Discord server
- **Email**: support@lokalrestro.com

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- ShadCN UI for the beautiful component library
- Lucide React for the icon set
- Recharts for analytics visualization
- The open-source community for inspiration and tools

---

**LokalRestro** - Empowering local restaurants with modern technology, offline-first approach, and seamless operations management.

For more information, visit our [website](https://lokalrestro.com) or contact us at [hello@lokalrestro.com](mailto:hello@lokalrestro.com).
