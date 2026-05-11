const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');

const CHECKIN_SECRET = () => process.env.QR_CHECKIN_SECRET || 'checkin-secret';
const REGISTER_SECRET = () => process.env.QR_REGISTER_SECRET || 'register-secret';
const ORIGIN = () => process.env.WEBAUTHN_ORIGIN || 'https://checkin.office.local';

exports.generateCheckinToken = (employeeId) => {
  return jwt.sign(
    { employeeId: String(employeeId), type: 'checkin' },
    CHECKIN_SECRET(),
    { expiresIn: Number(process.env.QR_CHECKIN_EXPIRES) || 300 }
  );
};

exports.verifyCheckinToken = (token) => {
  const payload = jwt.verify(token, CHECKIN_SECRET());
  if (payload.type !== 'checkin') throw new Error('Invalid token type');
  return payload;
};

exports.generateRegisterToken = (employeeId) => {
  return jwt.sign(
    { employeeId: String(employeeId), type: 'register' },
    REGISTER_SECRET(),
    { expiresIn: Number(process.env.QR_REGISTER_EXPIRES) || 3600 }
  );
};

exports.verifyRegisterToken = (token) => {
  const payload = jwt.verify(token, REGISTER_SECRET());
  if (payload.type !== 'register') throw new Error('Invalid token type');
  return payload;
};

exports.generateQRDataURL = async (url) => {
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 300,
    color: { dark: '#1e293b', light: '#ffffff' },
  });
};

exports.buildCheckinURL = (token) => `${ORIGIN()}/checkin?token=${token}`;
exports.buildRegisterURL = (token) => `${ORIGIN()}/register-passkey?token=${token}`;
