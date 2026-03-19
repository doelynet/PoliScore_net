const { BillVote, Bill } = require('../models');

// Vote on a bill (create or update)
exports.vote = async (req, res) => {
  try {
    const { id: billId } = req.params;
    const { vote } = req.body; // 'yes'|'no'|'abstain'
    if (!['yes','no','abstain'].includes(vote)) return res.status(400).json({ success:false, message:'Invalid vote' });

    const bill = await Bill.findByPk(billId);
    if (!bill) return res.status(404).json({ success:false, message:'Bill not found' });

    const existing = await BillVote.findOne({ where: { billId, userId: req.user.id } });
    if (existing) {
      existing.vote = vote;
      await existing.save();
      return res.json({ success:true, message:'Vote updated', data:{ vote: existing } });
    }

    const newVote = await BillVote.create({ billId, userId: req.user.id, vote });
    res.status(201).json({ success:true, message:'Voted', data:{ vote:newVote } });
  } catch (err) {
    console.error('vote error:', err);
    res.status(500).json({ success:false, message:err.message });
  }
};

// Get vote tally for a bill
exports.results = async (req, res) => {
  try {
    const { id: billId } = req.params;
    const votes = await BillVote.findAll({ where: { billId } });
    const tally = votes.reduce((acc,v) => { acc[v.vote] = (acc[v.vote]||0)+1; return acc; }, {});
    res.json({ success:true, data:{ tally, total: votes.length } });
  } catch (err) {
    console.error('vote results error:', err);
    res.status(500).json({ success:false, message:err.message });
  }
};
// GET /api/bills/:id/vote/results?industry=technology
exports.results = async (req, res) => {
  const { id: billId } = req.params;
  const { industry } = req.query;

  let voteQuery = { where: { billId } };
  
  if (industry) {
    // Join with users to filter by industry
    voteQuery.include = [{
      model: User,
      as: 'user',
      where: { industry },
      attributes: ['id', 'industry', 'businessType']
    }];
  }

  const votes = await BillVote.findAll(voteQuery);
  const tally = votes.reduce((acc, v) => {
    acc[v.vote] = (acc[v.vote] || 0) + 1;
    return acc;
  }, { yes: 0, no: 0, abstain: 0 });

  const total = votes.length;
  res.json({
    success: true,
    data: {
      tally,
      percentages: total > 0 ? {
        yes: ((tally.yes / total) * 100).toFixed(1),
        no: ((tally.no / total) * 100).toFixed(1),
        abstain: ((tally.abstain / total) * 100).toFixed(1)
      } : null,
      total,
      filteredBy: industry || null
    }
  });
};

// GET /api/users/me/votes — voting history
exports.myVotes = async (req, res) => {
  const votes = await BillVote.findAll({
    where: { userId: req.user.id },
    include: [{ model: Bill, as: 'bill', attributes: ['id','title','status','category'] }],
    order: [['createdAt', 'DESC']]
  });
  res.json({ success: true, data: { votes } });
};

// GET /api/bills/:id/vote/report — sentiment report for legislators
exports.report = async (req, res) => {
  const { id: billId } = req.params;
  const bill = await Bill.findByPk(billId);
  if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });

  const votes = await BillVote.findAll({
    where: { billId },
    include: [{ model: User, as: 'user', attributes: ['industry', 'businessType'] }]
  });

  const byIndustry = {};
  const byBusinessType = {};

  votes.forEach(v => {
    const ind = v.user?.industry || 'unspecified';
    const btype = v.user?.businessType || 'unspecified';
    if (!byIndustry[ind]) byIndustry[ind] = { yes: 0, no: 0, abstain: 0 };
    if (!byBusinessType[btype]) byBusinessType[btype] = { yes: 0, no: 0, abstain: 0 };
    byIndustry[ind][v.vote]++;
    byBusinessType[btype][v.vote]++;
  });

  res.json({
    success: true,
    data: {
      bill: { id: bill.id, title: bill.title, status: bill.status },
      overall: votes.reduce((a, v) => { a[v.vote]++; return a; }, { yes: 0, no: 0, abstain: 0 }),
      total: votes.length,
      byIndustry,
      byBusinessType,
      generatedAt: new Date().toISOString()
    }
  });
};
