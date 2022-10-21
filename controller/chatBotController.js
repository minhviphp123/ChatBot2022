require('dotenv').config();
const { response } = require('express');
const request = require('request');

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

function getHomePage(req, res) {
    return res.render('home');
}

function getWebHook(req, res) {
    // Parse the query params
    let mode = req.query["hub.mode"];
    let token = req.query["hub.verify_token"];
    let challenge = req.query["hub.challenge"];

    // Check if a token and mode is in the query string of the request
    if (mode && token) {
        // Check the mode and token sent is correct
        if (mode === "subscribe" && token === VERIFY_TOKEN) {
            // Respond with the challenge token from the request
            console.log("WEBHOOK_VERIFIED");
            res.status(200).send(challenge);
        } else {
            // Respond with '403 Forbidden' if verify tokens do not match
            res.sendStatus(403);
        }
    }
}

function postWebHook(req, res) {

    // Parse the request body from the POST
    let body = req.body;

    // Check the webhook event is from a Page subscription
    if (body.object === 'page') {

        // Iterate over each entry - there may be multiple if batched
        body.entry.forEach(function (entry) {

            // Gets the body of the webhook event
            let webhook_event = entry.messaging[0];
            console.log(webhook_event);


            // Get the sender PSID
            let sender_psid = webhook_event.sender.id;
            console.log('Sender PSID: ' + sender_psid);

            // Check if the event is a message or postback and
            // pass the event to the appropriate handler function
            if (webhook_event.message) {
                handleMessage(sender_psid, webhook_event.message);
            } else if (webhook_event.postback) {
                handlePostback(sender_psid, webhook_event.postback);
            }

        });

        // Return a '200 OK' response to all events
        res.status(200).send('EVENT_RECEIVED');

    } else {
        // Return a '404 Not Found' if event is not from a page subscription
        res.sendStatus(404);
    }

}

async function handleMessage(sender_psid, received_message) {
    let response;
    let username

    // Checks if the message contains text
    if (received_message.text === 'hello' || received_message.text === 'hi') {
        // Create the payload for a basic text message, which
        // will be added to the body of our request to the Send API
        // request({
        //     "uri": `https://graph.facebook.com/v2.6/me/messages/${webhook_event.sender.id}`,
        //     "qs": { "access_token": PAGE_ACCESS_TOKEN },
        //     "method": "GET",
        // }, (err, res, body) => {
        //     if (!err) {
        //         console.log('message sent!')
        //     } else {
        //         console.error("Unable to send message:" + err);
        //     }
        // });
        try {
            username = await getUserName(sender_psid);
            response = { 'text': `Hello ${username}` }
        } catch (err) {
            throw new Error(err);
        }
    } if (received_message.text !== 'hello' && received_message.text !== 'hi' && received_message.text !== 'Get_started') {
        response = { 'text': `You sent the message: "${received_message.text}". Now send me an image!` }
    }

    if (received_message.attachments) {
        // Get the URL of the message attachment
        let attachment_url = received_message.attachments[0].payload.url;
        response = {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "generic",
                    "elements": [{
                        "title": "Is this the right picture?",
                        "subtitle": "Tap a button to answer.",
                        "image_url": attachment_url,
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Yes!",
                                "payload": "yes",
                            },
                            {
                                "type": "postback",
                                "title": "No!",
                                "payload": "no",
                            }
                        ],
                    }]
                }
            }
        }
    }

    // Send the response message
    callSendAPI(sender_psid, response);
}

function callSendAPI(sender_psid, response) {
    // Construct the message body
    let request_body = {
        "recipient": {
            "id": sender_psid
        },
        "message": response
    }

    // Send the HTTP request to the Messenger Platform
    request({
        "uri": "https://graph.facebook.com/v2.6/me/messages",
        "qs": { "access_token": PAGE_ACCESS_TOKEN },
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
        if (!err) {
            console.log('message sent!')
        } else {
            console.error("Unable to send message:" + err);
        }
    });
}

async function handlePostback(sender_psid, received_postback) {
    let response;
    let username;
    // Get the payload for the postback
    let payload = received_postback.payload;

    // Set the response based on the postback payload
    if (payload === 'yes') {
        response = { "text": "Thanks!" }
    } else if (payload === 'no') {
        response = { "text": "Oops, try sending another image." }
    } else if (payload === 'GET_STARTED') {
        try {
            username = await getUserName(sender_psid);
            response = { 'text': `Hello ${username}` }
        } catch (err) {
            throw new Error(err);
        }
    }
    // Send the message to acknowledge the postback
    callSendAPI(sender_psid, response);
}

function getUserName(sender_psid,) {
    return new Promise((resolve, reject) => {
        let username = '';
        // Send the HTTP request to the Messenger Platform
        request({
            "uri": `https://graph.facebook.com/${sender_psid}?fields=first_name,last_name,profile_pic&access_token=${PAGE_ACCESS_TOKEN}"`,
            "qs": { "access_token": PAGE_ACCESS_TOKEN },
            "method": "GET"
        }, (err, res, body) => {
            if (!err) {
                body = JSON.parse(body);
                username = `${body.first_name} ${body.last_name}`;
                resolve(username);
            } else {
                reject(err);
            }
        });

    })
}

async function setupProfile(req, res) {

    let request_body = {
        "get_started": { "payload": "GET_STARTED" },
        "whitelisted_domains": ["https://l--chat-app--l.herokuapp.com/"]
    }

    await request({
        "uri": `https://graph.facebook.com/v9.0/me/messenger_profile?access_token=${PAGE_ACCESS_TOKEN}`,
        "qs": { "access_token": PAGE_ACCESS_TOKEN },
        "method": "POST",
        "json": request_body
    }, function (err, res, body) {
        if (!err) {
            console.log('set up profile succeed');
        } else {
            console.log('unable to setup user profile');
        }
    })

}

module.exports = {
    getHomePage, getWebHook, postWebHook,
    setupProfile
}