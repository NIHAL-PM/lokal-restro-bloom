import express from 'express';
import session from 'express-session';
import cors from 'cors';
import { Server } from 'socket.io';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
dotenv.config();

import { log } from './logger.js';
import { monitor } from './monitor.js';

// Import WebSocket server
import './websocketServer.js';

import authRouter from './routes/auth.js';
import menuRouter from './routes/menu.js';
import roomRouter from './routes/room.js';
import reportRouter from './routes/report.js';
import printerRouter from './routes/printer.js';
import tableRouter from './routes/table.js';
import orderRouter from './routes/order.js';
import settingsRouter from './routes/settings.js';
import syncRouter from './routes/sync.js';
import healthRouter from './health.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true }
}));

// Logging middleware
app.use((req, res, next) => {
  log(`${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/menu', menuRouter);
app.use('/api/rooms', roomRouter);
app.use('/api/reports', reportRouter);
app.use('/api/printer', printerRouter);
app.use('/api/tables', tableRouter);
app.use('/api/orders', orderRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/sync', syncRouter);
app.use('/api/health', healthRouter);

// Serve static files from the React app build
const buildPath = path.join(__dirname, '../dist');
app.use(express.static(buildPath));

// Serve the React app for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

// WebSocket for real-time updates (in addition to the sync server)
io.on('connection', (socket) => {
  log(`Socket.IO client connected: ${socket.id}`);
  
  socket.on('join-room', (room) => {
    socket.join(room);
    log(`Client ${socket.id} joined room: ${room}`);
  });
  
  socket.on('order-update', (data) => {
    socket.broadcast.to('kitchen').emit('order-update', data);
    socket.broadcast.to('billing').emit('order-update', data);
    log(`Order update broadcast: ${JSON.stringify(data)}`);
  });
  
  socket.on('sync', (data) => {
    socket.broadcast.emit('sync', data);
    log(`Sync event: ${JSON.stringify(data)}`);
  });
  
  socket.on('disconnect', () => {
    log(`Socket.IO client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, '0.0.0.0', () => {
  log(`🚀 LokalRestro Server running on port ${PORT}`);
  log(`📱 Access from mobile devices at: http://[YOUR-IP]:${PORT}`);
  log(`💻 Local access at: http://localhost:${PORT}`);
  log(`🔄 WebSocket sync server on port 8765`);
  monitor();
});
