// Middleware to restrict endpoints to admin users
module.exports = (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated' });
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    return next();
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
