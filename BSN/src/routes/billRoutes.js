const express = require('express');
const router = express.Router();
const { createBill, getBill, updateBill, deleteBill, listBills, toggleFollow } = require('../controllers/billController');
const adminOnly = require('../middleware/adminOnly');
const { body } = require('express-validator');

const createValidators = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('amount').optional().isDecimal().withMessage('Amount must be a number')
];

router.get('/', listBills);
router.get('/:id', getBill);
router.post('/', adminOnly, createValidators, createBill);
router.put('/:id', adminOnly, updateBill);
router.delete('/:id', adminOnly, deleteBill);
router.post('/:id/follow', toggleFollow);

module.exports = router;
