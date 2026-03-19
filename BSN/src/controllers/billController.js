const { Bill, User, BillFollow, BillStage } = require('../models');  // ← added BillStage
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

// ─────────────────────────────────────────────
// Internal helper — record a stage-change entry
// ─────────────────────────────────────────────
const recordStage = async (billId, stage, notes, changedBy, transaction) => {
  await BillStage.create(
    { billId, stage, notes: notes || null, changedBy: changedBy || null, changedAt: new Date() },
    { transaction }
  );
};

// ─────────────────────────────────────────────
// Create a bill (admin only)
// POST /api/admin/bills
// ─────────────────────────────────────────────
exports.createBill = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await t.rollback();
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { title, description, summary, amount, dueDate, billNumber, sponsor, category, status } = req.body;
    const initialStatus = status || 'draft';

    const bill = await Bill.create({
      title,
      description,
      summary,
      amount,
      dueDate,
      billNumber,
      sponsor,
      category,
      status: initialStatus,
      stageUpdatedAt: new Date(),
      creatorId: req.user.id
    }, { transaction: t });

    // Record the opening stage in history
    await recordStage(bill.id, initialStatus, 'Bill created', req.user.id, t);

    await t.commit();
    res.status(201).json({ success: true, data: { bill } });
  } catch (err) {
    await t.rollback();
    console.error('createBill error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// Get single bill (includes full stage history)
// GET /api/bills/:id
// ─────────────────────────────────────────────
exports.getBill = async (req, res) => {
  try {
    const bill = await Bill.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'fullName']
        },
        {
          model: BillStage,
          as: 'stageHistory',
          include: [{
            model: User,
            as: 'changedByUser',
            attributes: ['id', 'username', 'fullName']
          }],
          order: [['changedAt', 'ASC']]
        }
      ]
    });

    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });
    res.json({ success: true, data: { bill } });
  } catch (err) {
    console.error('getBill error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// Update bill (admin only) — records stage history on status change
// PUT /api/admin/bills/:id
// ─────────────────────────────────────────────
exports.updateBill = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const bill = await Bill.findByPk(req.params.id, { transaction: t });
    if (!bill) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    const updateData = { ...req.body };
    const statusChanged = req.body.status && req.body.status !== bill.status;

    if (statusChanged) {
      updateData.stageUpdatedAt = new Date();
    }

    await bill.update(updateData, { transaction: t });

    // Write a history record whenever the stage/status changes
    if (statusChanged) {
      await recordStage(
        bill.id,
        req.body.status,
        req.body.stageNotes || null,
        req.user.id,
        t
      );
    }

    await t.commit();

    // Re-fetch with history so the response always includes the updated timeline
    const updated = await Bill.findByPk(bill.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username', 'fullName'] },
        {
          model: BillStage,
          as: 'stageHistory',
          include: [{ model: User, as: 'changedByUser', attributes: ['id', 'username', 'fullName'] }],
          order: [['changedAt', 'ASC']]
        }
      ]
    });

    res.json({ success: true, data: { bill: updated } });
  } catch (err) {
    await t.rollback();
    console.error('updateBill error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// Delete bill (admin only)
// DELETE /api/admin/bills/:id
// ─────────────────────────────────────────────
exports.deleteBill = async (req, res) => {
  try {
    const bill = await Bill.findByPk(req.params.id);
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });
    // BillStage rows cascade-delete via onDelete: 'CASCADE' on the FK
    await bill.destroy();
    res.json({ success: true, message: 'Bill deleted' });
  } catch (err) {
    console.error('deleteBill error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// List bills with search / filter / pagination
// GET /api/bills
// ─────────────────────────────────────────────
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

    res.json({
      success: true,
      data: {
        bills: rows,
        pagination: {
          currentPage: page,
          totalItems: count,
          itemsPerPage: limit,
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (err) {
    console.error('listBills error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// Get stage history for a bill
// GET /api/bills/:id/stages
// ─────────────────────────────────────────────
exports.getBillStages = async (req, res) => {
  try {
    const bill = await Bill.findByPk(req.params.id);
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });

    const stages = await BillStage.findAll({
      where: { billId: req.params.id },
      include: [{
        model: User,
        as: 'changedByUser',
        attributes: ['id', 'username', 'fullName']
      }],
      order: [['changedAt', 'ASC']]
    });

    res.json({ success: true, data: { stages } });
  } catch (err) {
    console.error('getBillStages error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// Follow / unfollow a bill
// POST /api/bills/:id/follow
// ─────────────────────────────────────────────
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