const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const {
    getDashboardStats,
    getUsers,
    updateUserRole,
    suspendUser,
    deleteContent
} = require('../controllers/adminController');
const { listBills, createBill, updateBill, deleteBill } = require('../controllers/billController');

// All admin routes require auth + admin role
router.use(protect);
router.use(adminOnly);

router.get('/stats', getDashboardStats);
router.get('/users', getUsers);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/suspend', suspendUser);
router.delete('/content/:type/:id', deleteContent);

// Admin bill management
router.get('/bills', listBills);
router.post('/bills', createBill);
router.put('/bills/:id', updateBill);
router.delete('/bills/:id', deleteBill);

module.exports = router;
