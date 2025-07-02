import fs from 'fs';
import https from 'https';
import { config } from './config.js';
import app from './index.js';

export function createHttpsServer() {
  const options = {
    key: fs.readFileSync('./ssl/key.pem'),
    cert: fs.readFileSync('./ssl/cert.pem'),
  };
  return https.createServer(options, app).listen(443, () => {
    console.log('HTTPS server running on port 443');
  });
}
