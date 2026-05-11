const attendanceService = require('../services/attendanceService');

exports.checkin = async (req, res, next) => {
  try {
    const employee = req.verifiedEmployee;
    const ipAddress =
      req.headers['x-forwarded-for']?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      '';
    const deviceInfo = req.headers['user-agent'] || '';

    const result = await attendanceService.recordCheckin(employee._id, ipAddress, deviceInfo);

    if (result.alreadyCheckedIn) {
      return res.status(200).json({
        alreadyCheckedIn: true,
        message: `Already checked in today at ${result.record.firstCheckinAt.toLocaleTimeString('vi-VN')}`,
        record: result.record,
        employee: {
          fullName: employee.fullName,
          employeeCode: employee.employeeCode,
          level: employee.level,
        },
      });
    }

    res.status(201).json({
      alreadyCheckedIn: false,
      message: 'Check-in successful!',
      record: result.record,
      employee: {
        fullName: employee.fullName,
        employeeCode: employee.employeeCode,
        level: employee.level,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.today = async (req, res, next) => {
  try {
    const records = await attendanceService.getTodayAttendance();
    res.json(records);
  } catch (err) {
    next(err);
  }
};

exports.history = async (req, res, next) => {
  try {
    const { startDate, endDate, employeeId, page, limit } = req.query;
    const result = await attendanceService.getHistory({
      startDate,
      endDate,
      employeeId,
      page: Number(page) || 1,
      limit: Math.min(Number(limit) || 50, 200),
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};
