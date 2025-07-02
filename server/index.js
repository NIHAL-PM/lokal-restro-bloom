import express from 'express';
import session from 'express-session';
import cors from 'cors';
import { Server } from 'socket.io';
import http from 'http';
import dotenv from 'dotenv';
dotenv.config();

import { log } from './logger.js';

import { monitor } from './monitor.js';

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


const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });


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

// Routers
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


// WebSocket for LAN sync
io.on('connection', (socket) => {
  log(`Client connected: ${socket.id}`);
  socket.on('sync', (data) => {
    socket.broadcast.emit('sync', data);
    log(`Sync event: ${JSON.stringify(data)}`);
  });
  socket.on('disconnect', () => {
    log(`Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  log(`Server running on port ${PORT}`);
  monitor();
});
