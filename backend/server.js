require('dotenv').config();
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const app = require('./src/app');
const connectDB = require('./src/config/database');

const PORT = process.env.PORT || 3001;

connectDB().then(() => {
  const certPath = path.join(__dirname, '..', 'certs');
  const keyFile = path.join(certPath, 'key.pem');
  const certFile = path.join(certPath, 'cert.pem');

  if (fs.existsSync(keyFile) && fs.existsSync(certFile)) {
    const options = {
      key: fs.readFileSync(keyFile),
      cert: fs.readFileSync(certFile),
    };
    https.createServer(options, app).listen(PORT, '0.0.0.0', () => {
      console.log(`HTTPS server running on port ${PORT}`);
    });
  } else {
    console.warn('SSL certs not found — running HTTP (WebAuthn will only work on localhost)');
    http.createServer(app).listen(PORT, '0.0.0.0', () => {
      console.log(`HTTP server running on port ${PORT}`);
    });
  }
});
