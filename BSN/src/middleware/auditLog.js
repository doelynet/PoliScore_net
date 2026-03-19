// Logs mutating actions to console/DB 
module.exports = (action) => (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (body?.success && req.user) {
      console.log(JSON.stringify({
        audit: true, action, userId: req.user.id,
        ip: req.ip, path: req.path, at: new Date().toISOString()
      }));
    }
    return originalJson(body);
  };
  next();
};

// Usage on sensitive routes:
// router.delete('/:id', protect, adminOnly, auditLog('delete_bill'), deleteBill);