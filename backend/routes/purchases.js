const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/purchaseController');

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);

// DELETE is intentionally not exposed — purchases are historical records
router.delete('/:id', (req, res) => {
  res.status(405).json({ error: 'Purchase deletion is not allowed. Purchases are historical records.' });
});

module.exports = router;
