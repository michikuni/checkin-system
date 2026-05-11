require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Admin = require('../src/models/Admin');
const connectDB = require('../src/config/database');

async function seed() {
  await connectDB();

  const existing = await Admin.findOne({ username: 'admin' });
  if (existing) {
    console.log('Admin already exists, skipping seed.');
    return process.exit(0);
  }

  const passwordHash = await Admin.hashPassword('Admin@123');
  await Admin.create({ username: 'admin', passwordHash });
  console.log('Default admin created — username: admin / password: Admin@123');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
