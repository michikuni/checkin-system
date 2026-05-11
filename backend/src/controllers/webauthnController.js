const Employee = require('../models/Employee');
const webauthnService = require('../services/webauthnService');
const qrService = require('../services/qrService');

exports.registrationOptions = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Register token required' });

    let payload;
    try {
      payload = qrService.verifyRegisterToken(token);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired register token' });
    }

    const employee = await Employee.findById(payload.employeeId);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    const options = await webauthnService.getRegistrationOptions(employee);
    res.json(options);
  } catch (err) {
    next(err);
  }
};

exports.registrationVerify = async (req, res, next) => {
  try {
    const { token, response } = req.body;
    if (!token || !response) {
      return res.status(400).json({ error: 'token and response required' });
    }

    let payload;
    try {
      payload = qrService.verifyRegisterToken(token);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired register token' });
    }

    const employee = await Employee.findById(payload.employeeId);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    const credentialData = await webauthnService.verifyRegistration(employee, response);

    await Employee.findByIdAndUpdate(employee._id, {
      ...credentialData,
      passkeyRegisteredAt: new Date(),
    });

    res.json({ verified: true, message: 'Passkey registered successfully' });
  } catch (err) {
    if (err.message?.includes('verif') || err.message?.includes('challenge')) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
};

exports.authOptions = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Checkin token required' });

    let payload;
    try {
      payload = qrService.verifyCheckinToken(token);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired checkin token' });
    }

    const employee = await Employee.findById(payload.employeeId);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    if (!employee.credentialId) {
      return res.status(400).json({ error: 'Employee has no registered passkey' });
    }

    const options = await webauthnService.getAuthenticationOptions(employee);
    res.json({ ...options, employeeId: employee._id });
  } catch (err) {
    next(err);
  }
};

exports.authVerify = async (req, res, next) => {
  try {
    const { token, response, employeeId } = req.body;
    if (!token || !response || !employeeId) {
      return res.status(400).json({ error: 'token, response, and employeeId required' });
    }

    try {
      qrService.verifyCheckinToken(token);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired checkin token' });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    const newCounter = await webauthnService.verifyAuthentication(employee, response);
    await Employee.findByIdAndUpdate(employee._id, { counter: newCounter });

    req.verifiedEmployee = employee;
    next();
  } catch (err) {
    if (err.message?.includes('verif') || err.message?.includes('challenge') || err.message?.includes('counter')) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
};
