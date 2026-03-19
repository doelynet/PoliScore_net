const express = require('express');
const router = express.Router();
const { createV2Demo } = require('../controllers/devController');

// GET /api/dev/v2-demo -> create demo resources (dev only)
router.post('/v2-demo', createV2Demo);

module.exports = router;
