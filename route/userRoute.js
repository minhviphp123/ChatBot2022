const express = require('express');
const router = express.Router();
const chatBotController = require('../controller/chatBotController');

// Register
router.get('/', chatBotController.getHomePage);
router.get('/webhook', chatBotController.getWebHook);
router.post('/webhook', chatBotController.postWebHook);
router.post('/setupProfile', chatBotController.setupProfile);

module.exports = router;