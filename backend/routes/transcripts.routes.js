const express = require('express');
const router = express.Router();
const transcriptsController = require('../controllers/transcripts.controller');

// POST /api/transcripts/upload
router.post('/upload', transcriptsController.upload);

// GET /api/transcripts (all transcripts)
router.get('/', transcriptsController.getAll);

// GET /api/transcripts/:employeeId
router.get('/:employeeId', transcriptsController.getByEmployee);

module.exports = router;
