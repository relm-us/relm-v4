let WSServer = require('ws').Server;
let server = require('http').createServer();
let app = require('./http-server');
let util = require('./util.js')
let yws = require('./yws.js')
let db = require('./leveldb.js')
let authorize = require('./authorize.js')

let wss = new WSServer({ noServer: true });

wss.on('connection', (conn, req) => {
  console.log('connection')
  const docName = req.url.slice(1).split('?')[0]
  yws.setupWSConnection(conn, req, {
    docName: docName,
    gc: true,
    db: db
  })
})

server.on('request', app);

server.on('upgrade', (request, socket, head) => {
  const params = util.getUrlParams(request.url)
  console.log('upgrade requested', params)
  
  let id = params.get('id')
  let token = params.get('t')
  let sig = params.get('s')

  /**
   * @type {XYDoc}
   */
  let xydoc = {
    x: params.get('x'),
    y: params.get('y')
  }
  
  if (authorize(db, id, sig, token, xydoc)) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request)
    })
  }
})


module.exports = server
