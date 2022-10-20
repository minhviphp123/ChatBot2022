const express = require('express');
const router = express.Router();
const chatBotController = require('../controller/chatBotController');

// Register
router.get('/', chatBotController.getHomePage);
router.get('/webhook', chatBotController.getHomePage);
router.post('/webhook', chatBotController.postWebHook);

module.exports = router;