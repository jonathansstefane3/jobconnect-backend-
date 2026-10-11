const express = require('express');
const {
  getProfile,
  upsertEmployerProfile,
  upsertJobSeekerProfile
} = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// One profile endpoint is shared because the response depends on req.user.role.
router.get('/', protect, getProfile);

// Only employers can edit employer/company profiles.
router.put('/employer', protect, authorize('employer'), upsertEmployerProfile);

// Only job seekers can edit seeker profiles and upload CV files.
router.put('/job-seeker', protect, authorize('job_seeker'), upload.single('cv'), upsertJobSeekerProfile);

module.exports = router;
