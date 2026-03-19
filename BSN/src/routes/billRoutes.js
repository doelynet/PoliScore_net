const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');        // ← was missing on write routes
const adminOnly = require('../middleware/adminOnly');
const { body } = require('express-validator');
const {
  createBill,
  getBill,
  updateBill,
  deleteBill,
  listBills,
  toggleFollow,
  getBillStages                                          // ← new
} = require('../controllers/billController');

const createValidators = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('amount').optional().isDecimal().withMessage('Amount must be a number'),
  body('status')
    .optional()
    .isIn(['draft','first_reading','committee_stage','second_reading',
          'third_reading','presidential_assent','enacted','rejected'])
    .withMessage('Invalid status value')
];

// ── Public routes ──
router.get('/', listBills);
router.get('/:id', getBill);
router.get('/:id/stages', getBillStages);               // ← new: full stage timeline

// ── Admin-only write routes (protect MUST come before adminOnly) ──
router.post('/',     protect, adminOnly, createValidators, createBill);
router.put('/:id',   protect, adminOnly, createValidators, updateBill);
router.delete('/:id', protect, adminOnly, deleteBill);

// ── Authenticated user routes ──
router.post('/:id/follow', protect, toggleFollow);       // ← protect added

module.exports = router;