const router = require('express').Router();
const adminController = require('../controllers/adminController');
const requireAdmin = require('../middleware/auth');
const { adminLoginLimiter } = require('../middleware/rateLimit');

router.post('/login', adminLoginLimiter, adminController.login);
router.get('/me', requireAdmin, adminController.me);

module.exports = router;
