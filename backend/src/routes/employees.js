const router = require('express').Router();
const ctrl = require('../controllers/employeeController');
const requireAdmin = require('../middleware/auth');

router.use(requireAdmin);

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.get('/:id', ctrl.getOne);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
router.post('/:id/generate-register-qr', ctrl.generateRegisterQR);
router.get('/:id/checkin-qr', ctrl.getCheckinQR);
router.delete('/:id/passkey', ctrl.deletePasskey);

module.exports = router;
