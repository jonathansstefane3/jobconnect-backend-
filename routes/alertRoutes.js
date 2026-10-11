const express = require('express');
const { listAlerts, createAlert, deleteAlert, alertMatches } = require('../controllers/alertController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect, authorize('job_seeker'));

router.get('/', listAlerts);
router.post('/', createAlert);
router.get('/:id/matches', alertMatches);
router.delete('/:id', deleteAlert);

module.exports = router;
