const rateLimit = require('express-rate-limit');

exports.adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

exports.checkinLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many checkin attempts, please slow down' },
  standardHeaders: true,
  legacyHeaders: false,
});

exports.webauthnLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Too many WebAuthn requests' },
  standardHeaders: true,
  legacyHeaders: false,
});
