const express = require('express');
const protect = require('../middleware/authMiddleware');
const { searchAddress } = require('../controllers/locationController');

const router = express.Router();

router.get('/search', protect, searchAddress);

module.exports = router;