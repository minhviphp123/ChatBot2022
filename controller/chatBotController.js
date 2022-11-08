require('dotenv').config();
const { response } = require('express');
const { watchFile } = require('fs');
const request = require('request');

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

let cxk = 'data:image/jpeg;base64,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';
let tk = 'https://www.google.com/imgres?imgurl=https%3A%2F%2Flogin.medlatec.vn%2F%2FImagePath%2Fimages%2F20210920%2F20210920_dieu-tri-dau-day-than-kinh-v-2.jpg&imgrefurl=https%3A%2F%2Fmedlatec.vn%2Ftin-tuc%2Fdau-hieu-nguyen-nhan-va-cach-dieu-tri-dau-day-than-kinh-v-s65-n24235&tbnid=y3lrqon5OqwShM&vet=12ahUKEwjr5aCgoZz7AhUJ_JQKHV6qAP0QMygSegUIARDeAQ..i&docid=EQJGFmYWEUUhRM&w=800&h=600&q=than%20kinh&ved=2ahUKEwjr5aCgoZz7AhUJ_JQKHV6qAP0QMygSegUIARDeAQ';
let tmh = 'bit.ly/3zNPjYX';

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
            await callSendAPI(sender_psid, response);
        } catch (err) {
            throw new Error(err);
        }
    }

    else if (received_message.text === 'jsking') {
        response = await getMainSpecialtyTemplate();
        await callSendAPI(sender_psid, response);
    }

    else if (received_message.attachments) {
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
        // response = { 'text': 'attachment' }
        callSendAPI(sender_psid, response);
    }

    else {
        response = { 'text': `You sent the message: "${received_message.text}". Now send me an image!` }
        // response = { 'url': 'https://developers.facebook.com/docs/messenger-platform/getting-started/quick-start' }
        callSendAPI(sender_psid, response);
    }

}

async function callSendAPI(sender_psid, response) {
    // Construct the message body
    let request_body = {
        "recipient": {
            "id": sender_psid
        },
        "message": response
    }

    await sendMarkSeen(sender_psid);

    await sendTypingOn(sender_psid);

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

function sendMarkSeen(sender_psid) {
    // Construct the message body
    let request_body = {
        "recipient": {
            "id": sender_psid
        },
        "sender_action": "mark_seen"
    }

    // Send the HTTP request to the Messenger Platform
    request({
        "uri": "https://graph.facebook.com/v2.6/me/messages",
        "qs": { "access_token": PAGE_ACCESS_TOKEN },
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
        if (!err) {
            console.log('mark_seen!')
        } else {
            console.error("Unable to send m_s:" + err);
        }
    });
}

function sendTypingOn(sender_psid) {
    // Construct the message body
    let request_body = {
        "recipient": {
            "id": sender_psid
        },
        "sender_action": "typing_on"
    }

    // Send the HTTP request to the Messenger Platform
    request({
        "uri": "https://graph.facebook.com/v2.6/me/messages",
        "qs": { "access_token": PAGE_ACCESS_TOKEN },
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
        if (!err) {
            console.log('typing_on!')
        } else {
            console.error("Unable to send t_o:" + err);
        }
    });
}

async function handlePostback(sender_psid, received_postback) {
    let response1, response2, response;
    let username;
    // Get the payload for the postback
    let payload = received_postback.payload;

    // Set the response based on the postback payload
    if (payload === 'yes') {
        response = { "text": "Thanks!" }
        await callSendAPI(sender_psid, response);
    }
    if (payload === 'no') {
        response = { "text": "Oops, try sending another image." }
        await callSendAPI(sender_psid, response);
    } if (payload === 'GET_STARTED') {
        try {
            username = await getUserName(sender_psid);
            response1 = { 'text': `Hello ${username}` }
            response2 = getStartedTemplate();
            // Send the message to acknowledge the postback
            await callSendAPI(sender_psid, response1);
            //send generic template message
            await callSendAPI(sender_psid, response2)
        } catch (err) {
            throw new Error(err);
        }
    }

    if (payload === 'main_menu') {
        response = await getMainMenuTemplate();
        await callSendAPI(sender_psid, response);
    }

    if (payload === 'reserve_table') {
        response = { 'text': 'co cc ma xem:D' };
        await callSendAPI(sender_psid, response);
    }
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

function getStartedTemplate() {
    let response = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [{
                    "title": "Hello",
                    "subtitle": "Dưới đây là các lựa chọn...",
                    "image_url": imgGetStarted,
                    "buttons": [
                        {
                            "type": "postback",
                            "title": "Menu chính!",
                            "payload": "main_menu",
                        },
                        {
                            "type": "postback",
                            "title": "Đặt bàn",
                            "payload": "reserve_table",
                        },
                        {
                            "type": "postback",
                            "title": "HD sử dụng Bot!",
                            "payload": "guide_to_use",
                        },
                        // {
                        //     "type": "web_url",
                        //     "title": "HD đặt lịch khám!",
                        //     "url": "https://youmed.vn/tin-tuc/huong-dan-dat-lich-kham-cac-bac-si-phong-kham-de-dang-qua-youmed/",
                        // }
                    ],
                }]
            }
        }
    }
    return response;
}

function handleSendMainMenu() {
    return new Promise(async (resolve, reject) => {
        try {
            let res1 = getMainMenuTemplate();
            //text
            await callSendAPI(sender_psid, res1);
            //template
        } catch (e) {
            reject(e);
        }
    })
}

function getTemplateForPatient() {
    let response = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [
                    {
                        "title": "Menu nhà hàng",
                        "subtitle": "Menu nhà hàng",
                        "image_url": imgGetStarted,
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Đặt bàn",
                                "payload": "reserve_table",
                            }
                        ],
                    }
                ]
            }
        }
    }
    return response;
}

function getMainSpecialtyTemplate() {
    let response = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [
                    {
                        "title": "Chuyên khoa",
                        "subtitle": "Cơ Xương Khớp",
                        "image_url": cxk,
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Chi Tiết",
                                "payload": "reserve_table",
                            }
                        ],
                    },
                    {
                        "title": "Chuyên khoa",
                        "subtitle": "Thần Kinh",
                        "image_url": tk,
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Chi Tiết",
                                "payload": "reserve_table",
                            }
                        ],
                    },
                    {
                        "title": "Chuyên Khoa",
                        "subtitle": "Tai Mũi Họng",
                        "image_url": tmh,
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Chi tiết",
                                "payload": "show_room",
                            }
                        ],
                    }

                ]
            }
        }
    }
    return response;
}

module.exports = {
    getHomePage, getWebHook, postWebHook,
    setupProfile, handleSendMainMenu
}