// src/routes/walletRoutes.js
const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const { protect } = require('../middlewares/authMiddleware');

// A user can only ever read their OWN wallet (derived from the auth token).
router.get('/', protect, walletController.getMyWallet);

module.exports = router;
