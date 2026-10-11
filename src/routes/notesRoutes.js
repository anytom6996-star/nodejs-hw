const express = require('express');

const {
  getAllNotes,
  getNoteById,
  createNote,
  deleteNote,
  updateNote,
} = require('../controllers/notesController');

const router = express.Router();

router.get('/notes', getAllNotes);
router.get('/notes/:noteId', getNoteById);
router.post('/notes', createNote);
router.patch('/notes/:noteId', updateNote);
router.delete('/notes/:noteId', deleteNote);

module.exports = router;