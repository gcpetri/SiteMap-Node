// === imports ===
const http = require('http');
const express = require('express');
const path = require('path');

// === globals ===
const HOSTNAME = '127.0.0.1';
const PORT = process.env.PORT || 8080;

// === set the view routes ===
const indexRouter = require('./routes/index');

// === start the app ===
const app = express();

// === sets ===
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// === middlewares ===
app.use(express.json());
app.use(express.urlencoded({ extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

// === view middleware ===
app.use('/', indexRouter.homepage);

// === listen ===
const listener = app.listen(PORT, (err) => {
    if (err) {
        console.log(`Error starting the server: ${err}`);
        return;
    }
    console.log(`Listening on port ${listener.address().port}`);
});
