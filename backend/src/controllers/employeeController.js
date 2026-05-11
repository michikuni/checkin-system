const Employee = require('../models/Employee');
const qrService = require('../services/qrService');

exports.create = async (req, res, next) => {
  try {
    const { fullName, employeeCode, department, role, level } = req.body;
    if (!fullName || !employeeCode) {
      return res.status(400).json({ error: 'fullName and employeeCode are required' });
    }
    const employee = await Employee.create({ fullName, employeeCode, department, role, level });
    res.status(201).json(employee);
  } catch (err) {
    next(err);
  }
};

exports.list = async (req, res, next) => {
  try {
    const employees = await Employee.find().sort({ fullName: 1 });
    res.json(employees);
  } catch (err) {
    next(err);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    res.json(employee);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { fullName, employeeCode, department, role, level } = req.body;
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { fullName, employeeCode, department, role, level },
      { new: true, runValidators: true }
    );
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    res.json(employee);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    res.json({ message: 'Employee deleted' });
  } catch (err) {
    next(err);
  }
};

exports.generateRegisterQR = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    const token = qrService.generateRegisterToken(employee._id);
    const url = qrService.buildRegisterURL(token);
    const qrDataURL = await qrService.generateQRDataURL(url);

    res.json({ token, url, qrDataURL, expiresIn: Number(process.env.QR_REGISTER_EXPIRES) || 3600 });
  } catch (err) {
    next(err);
  }
};

exports.getCheckinQR = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    const token = qrService.generateCheckinToken(employee._id);
    const url = qrService.buildCheckinURL(token);
    const qrDataURL = await qrService.generateQRDataURL(url);

    res.json({ token, url, qrDataURL, expiresIn: Number(process.env.QR_CHECKIN_EXPIRES) || 300 });
  } catch (err) {
    next(err);
  }
};

exports.deletePasskey = async (req, res, next) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { credentialId: null, publicKey: null, counter: 0, deviceInfo: null, passkeyRegisteredAt: null },
      { new: true }
    );
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    res.json({ message: 'Passkey removed', employee });
  } catch (err) {
    next(err);
  }
};
