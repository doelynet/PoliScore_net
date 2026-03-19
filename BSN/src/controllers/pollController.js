const { Post } = require('../models');

// Vote on a poll within a Post (pollData.options[].id)
exports.vote = async (req, res) => {
  try {
    const postId = req.params.postId;
    const { optionId } = req.body;
    const post = await Post.findByPk(postId);
    if (!post) return res.status(404).json({ success:false, message:'Post not found' });
    if (post.postType !== 'poll') return res.status(400).json({ success:false, message:'Post is not a poll' });

    // Ensure pollData exists and option is valid
    const poll = post.pollData || {};
    const options = poll.options || [];
    const option = options.find(o => o.id === optionId || String(o.id) === String(optionId));
    if (!option) return res.status(400).json({ success:false, message:'Invalid option' });

    // Simple per-post poll votes stored inside post.pollData.votes as { userId: optionId }
    const votes = (poll.votes && typeof poll.votes === 'object') ? poll.votes : {};
    votes[req.user.id] = option.id;
    poll.votes = votes;

    post.pollData = poll;
    await post.save();

    res.json({ success:true, message:'Voted', data:{ poll } });
  } catch (err) {
    console.error('poll vote error:', err);
    res.status(500).json({ success:false, message:err.message });
  }
};

// Get poll results
exports.results = async (req, res) => {
  try {
    const postId = req.params.postId;
    const post = await Post.findByPk(postId);
    if (!post) return res.status(404).json({ success:false, message:'Post not found' });
    if (post.postType !== 'poll') return res.status(400).json({ success:false, message:'Post is not a poll' });

    const poll = post.pollData || {};
    const options = poll.options || [];
    const votes = poll.votes || {};
    const tally = {};
    options.forEach(o => tally[o.id] = 0);
    Object.values(votes).forEach(v => { tally[v] = (tally[v]||0) + 1; });

    res.json({ success:true, data:{ tally, total: Object.keys(votes).length } });
  } catch (err) {
    console.error('poll results error:', err);
    res.status(500).json({ success:false, message:err.message });
  }
};
