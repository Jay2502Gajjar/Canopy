const express = require('express');
const router = express.Router();
const employeesController = require('../controllers/employees.controller');

// GET /api/employees
router.get('/', employeesController.getAll);

// GET /api/employees/:id
router.get('/:id', employeesController.getById);

// POST /api/employees
router.post('/', employeesController.create);

// PATCH /api/employees/:id
router.patch('/:id', employeesController.update);

// DELETE /api/employees/:id
router.delete('/:id', employeesController.deleteEmployee);

// GET /api/employees/:id/sentiment
router.get('/:id/sentiment', employeesController.getSentiment);

// GET /api/employees/:id/notes
router.get('/:id/notes', employeesController.getNotes);

// POST /api/employees/sync-hrms
router.post('/sync-hrms', employeesController.syncHRMS);

module.exports = router;
