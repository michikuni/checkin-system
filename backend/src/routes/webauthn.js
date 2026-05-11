const router = require('express').Router();
const ctrl = require('../controllers/webauthnController');
const attendanceCtrl = require('../controllers/attendanceController');
const { webauthnLimiter, checkinLimiter } = require('../middleware/rateLimit');

router.post('/register/options', webauthnLimiter, ctrl.registrationOptions);
router.post('/register/verify', webauthnLimiter, ctrl.registrationVerify);

router.post('/auth/options', checkinLimiter, ctrl.authOptions);
// auth/verify → on success, immediately record checkin
router.post('/auth/verify', checkinLimiter, ctrl.authVerify, attendanceCtrl.checkin);

module.exports = router;
