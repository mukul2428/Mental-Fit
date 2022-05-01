#!/usr/bin/env node
require('dotenv').config()
var debug = require('debug')('exp-test:server');
var http = require('http');
const mustacheExpress = require('mustache-express');
const express = require('express');
const bodyParser = require('body-parser')
const session = require('express-session');
const mongoose = require('mongoose');

// connect to mongodb
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  console.log("sucessfully connected to mongodb")
});

const application = express()

// set view engine to mustache
application.engine('mustache', mustacheExpress(__dirname + '/views/partials', '.mustache'));
application.set('view engine', 'mustache');
application.set('views', __dirname + '/views');

// use static files
application.use(express.static('public'))

// support post requests
application.use(bodyParser.json());       // to support JSON-encoded bodies
application.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

// initialize session
application.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// import routes
const index = require('./routes/index')
const api = require('./routes/api')
const auth = require('./routes/auth')

// set routes
application.use('/', index)
application.use('/api', api) // sample API Routes
application.use('/auth', auth) // sample API Routes

// this controls the chat feature
application.socket = require('./socket');

module.exports = application

/* Get port from environment and store in Express. */

var port = normalizePort(process.env.PORT || '3000');
application.set('port', port);

var server = http.createServer(application);
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}

// this controls socket.io
// application.use((req, res, next) => {
//   console.log('lol ' + JSON.stringify(req.session.user))
//   application.socket(server, req);
//   next();
// })

application.socket(server);

