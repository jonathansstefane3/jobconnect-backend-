const express = require('express');
const {
  listJobs,
  getJob,
  createJob,
  employerJobs,
  updateJob,
  deleteJob
} = require('../controllers/jobController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

// Public job browsing. The controller only returns open jobs for public users.
router.get('/', listJobs);

// Must be declared before /:id so "employer/my-jobs" is not treated as an id.
router.get('/employer/my-jobs', protect, authorize('employer'), employerJobs);
router.get('/:id', getJob);

// Employers create jobs. Admins can still moderate jobs through PUT/DELETE below.
router.post('/', protect, authorize('employer'), createJob);
router.put('/:id', protect, authorize('employer', 'admin'), updateJob);
router.delete('/:id', protect, authorize('employer', 'admin'), deleteJob);

module.exports = router;
