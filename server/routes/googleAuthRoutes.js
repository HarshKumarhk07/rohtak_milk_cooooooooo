// server/routes/googleAuthRoutes.js
// Route for Google (Firebase) authentication. Mounted under /api/auth,
// exposing POST /api/auth/google.
const express = require('express');
const router = express.Router();
const googleAuthController = require('../controllers/googleAuthController');

router.post('/google', googleAuthController.googleLogin);

module.exports = router;
