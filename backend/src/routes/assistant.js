const express = require('express');
const router  = express.Router();
const { chat } = require('../controllers/assistantController');
const rateLimit = require('express-rate-limit');

const assistantLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max: 10,               // 10 messages / minute / IP
  message: { error: 'Trop de messages, veuillez patienter une minute.' },
});

// POST /api/assistant/chat
router.post('/chat', assistantLimiter, chat);

module.exports = router;
