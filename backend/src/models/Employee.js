const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  employeeCode: { type: String, required: true, unique: true, trim: true },
  department: { type: String, trim: true, default: '' },
  role: { type: String, trim: true, default: '' },
  level: {
    type: String,
    enum: ['Intern', 'Junior', 'Middle', 'Senior', 'Lead', 'Manager', 'Director', ''],
    default: '',
  },
  // WebAuthn credential (max 1 active)
  credentialId: { type: String, default: null },
  publicKey: { type: String, default: null },
  counter: { type: Number, default: 0 },
  deviceInfo: { type: String, default: null },
  passkeyRegisteredAt: { type: Date, default: null },
}, { timestamps: true });

employeeSchema.virtual('hasPasskey').get(function () {
  return !!this.credentialId;
});

employeeSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Employee', employeeSchema);
