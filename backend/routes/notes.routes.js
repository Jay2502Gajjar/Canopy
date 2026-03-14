const express = require('express');
const router = express.Router();
const notesController = require('../controllers/notes.controller');

// GET /api/notes — Get all notes
router.get('/', notesController.getAllNotes);

// GET /api/notes/:employeeId
router.get('/:employeeId', notesController.getNotesByEmployee);

// POST /api/notes
router.post('/', notesController.addNote);

// DELETE /api/notes/:id
router.delete('/:id', notesController.deleteNote);

module.exports = router;
