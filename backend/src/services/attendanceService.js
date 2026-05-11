const Attendance = require('../models/Attendance');

function todayString() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

exports.recordCheckin = async (employeeId, ipAddress, deviceInfo) => {
  const date = todayString();

  const existing = await Attendance.findOne({ employeeId, date });
  if (existing) {
    return { alreadyCheckedIn: true, record: existing };
  }

  const record = await Attendance.create({
    employeeId,
    date,
    firstCheckinAt: new Date(),
    ipAddress,
    deviceInfo,
  });

  return { alreadyCheckedIn: false, record };
};

exports.getTodayAttendance = async () => {
  return Attendance.find({ date: todayString() })
    .populate('employeeId', 'fullName employeeCode department level')
    .sort({ firstCheckinAt: 1 });
};

exports.getHistory = async ({ startDate, endDate, employeeId, page = 1, limit = 50 }) => {
  const query = {};
  if (employeeId) query.employeeId = employeeId;
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = startDate;
    if (endDate) query.date.$lte = endDate;
  }

  const skip = (page - 1) * limit;
  const [records, total] = await Promise.all([
    Attendance.find(query)
      .populate('employeeId', 'fullName employeeCode department level')
      .sort({ date: -1, firstCheckinAt: -1 })
      .skip(skip)
      .limit(limit),
    Attendance.countDocuments(query),
  ]);

  return { records, total, page, limit, pages: Math.ceil(total / limit) };
};
