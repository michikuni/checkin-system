const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const admin = await Admin.findOne({ username });
    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { adminId: admin._id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.json({ token, username: admin.username });
  } catch (err) {
    next(err);
  }
};

exports.me = async (req, res) => {
  res.json({ adminId: req.admin.adminId, username: req.admin.username });
};
