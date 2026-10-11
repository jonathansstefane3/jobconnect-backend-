const express = require('express');
const { register, login, me } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes for creating a session.
router.post('/register', register);
router.post('/login', login);

// Private route for restoring the logged-in user from a saved JWT.
router.get('/me', protect, me);

module.exports = router;
