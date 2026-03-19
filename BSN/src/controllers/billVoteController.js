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
