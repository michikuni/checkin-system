const router = require('express').Router();
const ctrl = require('../controllers/attendanceController');
const requireAdmin = require('../middleware/auth');

router.get('/today', requireAdmin, ctrl.today);
router.get('/history', requireAdmin, ctrl.history);

module.exports = router;
