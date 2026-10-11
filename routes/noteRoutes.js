const express = require('express');
const { listNotes, addNote, deleteNote } = require('../controllers/noteController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect, authorize('employer', 'admin'));

router.get('/application/:applicationId', listNotes);
router.post('/application/:applicationId', addNote);
router.delete('/:id', deleteNote);

module.exports = router;
