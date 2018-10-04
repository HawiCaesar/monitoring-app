// Entry point

// Dependencies
const server = require('./lib/server');
const worker = require('./lib/workers');

// Declare APP
const app = {};

// Init function
app.init = function() {
  // start server
  server.init();

  // start workers
  workers.init();
}

app.init();

module.exports = app;