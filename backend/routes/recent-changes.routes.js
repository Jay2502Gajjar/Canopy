const express = require('express');
const router = express.Router();
const recentChangesController = require('../controllers/recent-changes.controller');

// GET /api/recent-changes
router.get('/', recentChangesController.getRecentChanges);

module.exports = router;
