const { User, Post, Comment } = require('../models');

// Dev-only: create demo user, post (with poll/conference data), and comment+reply
exports.createV2Demo = async (req, res) => {
  try {
    // Create a demo user
    // username must be alphanumeric per model validation
    const demoUsername = `demo${Date.now()}`;
    const user = await User.create({
      username: demoUsername,
      email: `${demoUsername}@example.com`,
      passwordHash: 'TempPass123!',
      fullName: 'Demo User'
    });

    // Create a post with pollData and conferenceData
    const post = await Post.create({
      content: 'This is a v2.0 demo post with poll and conference data.',
      userId: user.id,
      postType: 'poll',
      pollData: {
        question: 'Which feature do you like?',
        options: [{ id: 1, text: 'A' }, { id: 2, text: 'B' }]
      },
      conferenceData: {
        meetingId: 'conf-123',
        startAt: new Date().toISOString()
      }
    });

    // Create a parent comment
    const parentComment = await Comment.create({
      content: 'Parent comment',
      userId: user.id,
      postId: post.id,
      commentType: 'comment',
      isQuestion: false
    });

    // Create a reply to the parent comment
    const replyComment = await Comment.create({
      content: 'Reply to parent',
      userId: user.id,
      postId: post.id,
      parentId: parentComment.id,
      commentType: 'reply'
    });

    res.json({ success: true, data: { user, post, parentComment, replyComment } });
  } catch (error) {
    console.error('Dev demo error:', error);
    res.status(500).json({ success: false, message: 'Dev demo failed', error: error.message });
  }
};
