import fs from 'fs';
const logFile = './server.log';

export function log(message) {
  const entry = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync(logFile, entry);
}
