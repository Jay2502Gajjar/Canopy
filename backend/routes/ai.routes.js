const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');

// POST /api/ai/chat
router.post('/chat', aiController.chat);

// POST /api/ai/employee — Generate employee insights
router.post('/employee', aiController.employeeInsight);

// POST /api/ai/meeting-brief — Generate meeting preparation brief
router.post('/meeting-brief', aiController.meetingBrief);

// GET /api/ai/meeting-prep/:employeeId
router.get('/meeting-prep/:employeeId', aiController.meetingBrief);

module.exports = router;
