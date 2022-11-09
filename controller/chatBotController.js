require('dotenv').config();
const { response } = require('express');
const { watchFile } = require('fs');
const request = require('request');

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

let cxk = 'bit.ly/3hlj9xA';
let tk = 'https://www.google.com/imgres?imgurl=https%3A%2F%2Flogin.medlatec.vn%2F%2FImagePath%2Fimages%2F20210920%2F20210920_dieu-tri-dau-day-than-kinh-v-2.jpg&imgrefurl=https%3A%2F%2Fmedlatec.vn%2Ftin-tuc%2Fdau-hieu-nguyen-nhan-va-cach-dieu-tri-dau-day-than-kinh-v-s65-n24235&tbnid=y3lrqon5OqwShM&vet=12ahUKEwjr5aCgoZz7AhUJ_JQKHV6qAP0QMygSegUIARDeAQ..i&docid=EQJGFmYWEUUhRM&w=800&h=600&q=than%20kinh&ved=2ahUKEwjr5aCgoZz7AhUJ_JQKHV6qAP0QMygSegUIARDeAQ';
let tmh = 'bit.ly/3zNPjYX';

let eusImg = 'bit.ly/euschatbot';

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
        response = getDetailTemplate();
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

function getDetailTemplate() {
    let response = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [
                    {
                        "title": "Bác Sĩ",
                        "subtitle": "A",
                        "image_url": eusImg,
                        // "buttons": [
                        //     {
                        //         "type": "postback",
                        //         "title": "Chi Tiết",
                        //         "payload": "reserve_table",
                        //     }
                        // ],
                    },
                    {
                        "title": "Bác Sĩ",
                        "subtitle": "B",
                        "image_url": eusImg,

                    },
                    {
                        "title": "Bác Sĩ",
                        "subtitle": "C",
                        "image_url": eusImg,
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