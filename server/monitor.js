import os from 'os';
import { log } from './logger.js';

export function healthCheck() {
  return {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    load: os.loadavg(),
    timestamp: Date.now(),
  };
}

export function monitor() {
  setInterval(() => {
    const health = healthCheck();
    log(`Health: ${JSON.stringify(health)}`);
  }, 60000);
}
