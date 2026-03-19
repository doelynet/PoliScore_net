const { Bill, User, BillFollow } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

// Create a bill (admin only)
exports.createBill = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { title, description, amount, dueDate, billNumber, sponsor, category, status } = req.body;
    const bill = await Bill.create({
      title,
      description,
      amount,
      dueDate,
      billNumber,
      sponsor,
      category,
      status: status || 'draft',
      stageUpdatedAt: new Date(),
      creatorId: req.user.id
    });
    res.status(201).json({ success: true, data: { bill } });
  } catch (err) {
    console.error('createBill error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get single bill
exports.getBill = async (req, res) => {
  try {
    const bill = await Bill.findByPk(req.params.id, { include: [{ model: User, as: 'creator', attributes: ['id','username','fullName'] }] });
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });
    res.json({ success: true, data: { bill } });
  } catch (err) {
    console.error('getBill error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update bill (admin only)
exports.updateBill = async (req, res) => {
  try {
    const bill = await Bill.findByPk(req.params.id);
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });

    // Track stage changes
    const updateData = { ...req.body };
    if (req.body.status && req.body.status !== bill.status) {
      updateData.stageUpdatedAt = new Date();
    }

    await bill.update(updateData);
    res.json({ success: true, data: { bill } });
  } catch (err) {
    console.error('updateBill error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete bill (admin only)
exports.deleteBill = async (req, res) => {
  try {
    const bill = await Bill.findByPk(req.params.id);
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });
    await bill.destroy();
    res.json({ success: true, message: 'Bill deleted' });
  } catch (err) {
    console.error('deleteBill error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// List bills with search/filter/pagination
exports.listBills = async (req, res) => {
  try {
    const q = req.query.q || '';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { status, category } = req.query;

    const where = {};
    if (q) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${q}%` } },
        { billNumber: { [Op.iLike]: `%${q}%` } }
      ];
    }
    if (status) where.status = status;
    if (category) where.category = category;

    const { count, rows } = await Bill.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [{ model: User, as: 'creator', attributes: ['id', 'username', 'fullName'] }]
    });
    res.json({ success: true, data: { bills: rows, pagination: { currentPage: page, totalItems: count, itemsPerPage: limit, totalPages: Math.ceil(count/limit) } } });
  } catch (err) {
    console.error('listBills error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Follow/unfollow bill
exports.toggleFollow = async (req, res) => {
  try {
    const billId = req.params.id;
    const userId = req.user.id;
    const existing = await BillFollow.findOne({ where: { billId, userId } });
    if (existing) {
      await existing.destroy();
      return res.json({ success: true, message: 'Unfollowed', data: { following: false } });
    }
    await BillFollow.create({ billId, userId });
    res.json({ success: true, message: 'Following', data: { following: true } });
  } catch (err) {
    console.error('toggleFollow error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
