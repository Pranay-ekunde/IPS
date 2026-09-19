const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/itemController');

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
router.patch('/:id/toggle', ctrl.toggleActive);

module.exports = router;
