const express = require('express');
const {
  stats,
  users,
  jobs,
  applications,
  updateUserStatus
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

// Everything in this router is protected and admin-only.
router.use(protect, authorize('admin'));

// Admin reporting and moderation endpoints.
router.get('/stats', stats);
router.get('/users', users);
router.get('/jobs', jobs);
router.get('/applications', applications);
router.put('/users/:id/status', updateUserStatus);

module.exports = router;
