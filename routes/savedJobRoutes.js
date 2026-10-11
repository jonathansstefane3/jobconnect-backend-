const express = require('express');
const { listSavedJobs, saveJob, unsaveJob } = require('../controllers/savedJobController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect, authorize('job_seeker'));

router.get('/', listSavedJobs);
router.post('/:jobId', saveJob);
router.delete('/:jobId', unsaveJob);

module.exports = router;
