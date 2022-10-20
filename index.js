const express = require('express');
const app = express(); //framework
const bodyParser = require('body-parser');
const path = require('path');
const cookieParser = require('cookie-parser');
const router = require('./route/userRoute');
require('dotenv').config();
const port = process.env.PORT || 4000;

//public
app.use(express.static(path.join(__dirname, 'public')));

//bodyParser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//cookieParser
app.use(cookieParser());

// view engine
app.set('view engine', 'ejs');
app.set('views', './views');

app.use('/', router);

app.listen(port, function () {
    console.log(`http://localhost:${port}`);
})