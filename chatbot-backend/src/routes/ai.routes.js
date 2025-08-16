const express = require('express');
const aiController = require('../controllers/ai.controller');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post("/get-review", aiController.getReview);
router.post("/chat", authMiddleware, aiController.chat); // Apply auth middleware here

module.exports = router;
