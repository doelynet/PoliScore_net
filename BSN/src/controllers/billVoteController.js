const { BillVote, Bill, User } = require('../models');

// ─────────────────────────────────────────────
// POST /api/bills/:id/vote
// Vote on a bill — create or update, saves optional comment
// ─────────────────────────────────────────────
exports.vote = async (req, res) => {
  try {
    const { id: billId } = req.params;
    const { vote, comment } = req.body;

    if (!['yes', 'no', 'abstain'].includes(vote)) {
      return res.status(400).json({ success: false, message: 'Invalid vote. Must be yes, no, or abstain' });
    }

    const bill = await Bill.findByPk(billId);
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });

    const existing = await BillVote.findOne({ where: { billId, userId: req.user.id } });
    if (existing) {
      existing.vote = vote;
      existing.comment = comment !== undefined ? comment : existing.comment;
      await existing.save();
      return res.json({ success: true, message: 'Vote updated', data: { vote: existing } });
    }

    const newVote = await BillVote.create({
      billId,
      userId: req.user.id,
      vote,
      comment: comment || null
    });

    res.status(201).json({ success: true, message: 'Voted', data: { vote: newVote } });
  } catch (err) {
    console.error('vote error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/bills/:id/vote/results?industry=technology
// Vote tally with optional industry filter and percentages
// ─────────────────────────────────────────────
exports.results = async (req, res) => {
  try {
    const { id: billId } = req.params;
    const { industry } = req.query;

    const query = { where: { billId } };

    if (industry) {
      query.include = [{
        model: User,
        as: 'user',
        where: { industry },
        attributes: ['id', 'industry', 'businessType']
      }];
    }

    const votes = await BillVote.findAll(query);

    const tally = votes.reduce(
      (acc, v) => { acc[v.vote] = (acc[v.vote] || 0) + 1; return acc; },
      { yes: 0, no: 0, abstain: 0 }
    );

    const total = votes.length;

    res.json({
      success: true,
      data: {
        tally,
        percentages: total > 0 ? {
          yes:     ((tally.yes     / total) * 100).toFixed(1),
          no:      ((tally.no      / total) * 100).toFixed(1),
          abstain: ((tally.abstain / total) * 100).toFixed(1)
        } : null,
        total,
        filteredBy: industry || null
      }
    });
  } catch (err) {
    console.error('vote results error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/bills/:id/vote/report
// Full sentiment breakdown for legislators
// ─────────────────────────────────────────────
exports.report = async (req, res) => {
  try {
    const { id: billId } = req.params;

    const bill = await Bill.findByPk(billId, {
      attributes: ['id', 'title', 'billNumber', 'status', 'category']
    });
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });

    const votes = await BillVote.findAll({
      where: { billId },
      include: [{
        model: User,
        as: 'user',
        attributes: ['industry', 'businessType']
      }]
    });

    const overall = { yes: 0, no: 0, abstain: 0 };
    const byIndustry = {};
    const byBusinessType = {};

    votes.forEach(v => {
      overall[v.vote]++;

      const ind   = v.user?.industry     || 'unspecified';
      const btype = v.user?.businessType || 'unspecified';

      if (!byIndustry[ind])       byIndustry[ind]       = { yes: 0, no: 0, abstain: 0 };
      if (!byBusinessType[btype]) byBusinessType[btype] = { yes: 0, no: 0, abstain: 0 };

      byIndustry[ind][v.vote]++;
      byBusinessType[btype][v.vote]++;
    });

    const total = votes.length;

    res.json({
      success: true,
      data: {
        bill,
        overall,
        percentages: total > 0 ? {
          yes:     ((overall.yes     / total) * 100).toFixed(1),
          no:      ((overall.no      / total) * 100).toFixed(1),
          abstain: ((overall.abstain / total) * 100).toFixed(1)
        } : null,
        total,
        byIndustry,
        byBusinessType,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('report error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/users/me/votes
// Current user's full voting history
// ─────────────────────────────────────────────
exports.myVotes = async (req, res) => {
  try {
    const votes = await BillVote.findAll({
      where: { userId: req.user.id },
      include: [{
        model: Bill,
        as: 'bill',
        attributes: ['id', 'title', 'status', 'category', 'stageUpdatedAt']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, data: { votes } });
  } catch (err) {
    console.error('myVotes error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};