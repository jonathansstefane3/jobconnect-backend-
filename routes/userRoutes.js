const express = require('express');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Small convenience endpoint that mirrors /api/auth/me.
router.get('/me', protect, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
