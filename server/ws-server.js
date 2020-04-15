let WSServer = require('ws').Server;
let server = require('http').createServer();
let app = require('./http-server');

let wss = new WSServer({
  server: server
});

server.on('request', app);

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    console.log(`received: ${message}`)
    ws.send(JSON.stringify({
      answer: 42
    }))
  })
})

module.exports = server
