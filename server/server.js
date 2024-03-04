// This is where we will create our express and socket io server

// Module imports
const fs = require('fs');
const https = require('https');
const express = require('express');
const socketio = require('socket.io');
const cors = require('cors');

const app = express();

// Express middlewares
app.use(express.json());
app.use(cors());
app.use(express.static(__dirname + '/public'));


// encryption keys for SSL
const key = fs.readFileSync('./certs/cert.key');
const cert = fs.readFileSync('./certs/cert.crt');


// Express server with SSL
const expressServer = https.createServer({ key, cert }, app);

// Getting the IO from socket io with cors config
const io = socketio(expressServer, {
    cors: ['https://localhost:3000', 'http://localhost:3001', 'http://localhost:3003']
});

// Port to listen on
expressServer.listen(9000);


// Exporting the io, expressserver and app to use outside
module.exports = { io, expressServer, app };
