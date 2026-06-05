// src/routes/adminSecurityRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/adminSecurityController');
const { protect, admin } = require('../middlewares/authMiddleware');

// Every endpoint here is admin-only.
router.use(protect, admin);

router.get('/logs', ctrl.getLogs);
router.get('/locked', ctrl.getLockedAccounts);
router.get('/accounts', ctrl.getAdminAccounts);
router.post('/unlock/:userId', ctrl.unlockAccount);

module.exports = router;
