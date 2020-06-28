const WSServer = require('ws').Server;
const server = require('http').createServer();
const app = require('./http-server');
const util = require('./util.js')
const relms = require('./relms.js')
const yws = require('./yws.js')
const auth = require('./auth.js')

let wss = new WSServer({ noServer: true });

wss.on('connection', (conn, req) => {
  console.log('connection')
  const relmName = getRelmName(req)
  try {
    yws.setupWSConnection(conn, req, {
      docName: relmName,
      gc: true,
    })
  } catch (err) {
    console.error(err)
    conn.close()
  }
})

server.on('request', app);

server.on('upgrade', (request, socket, head) => {
  console.log('upgrade requested')
  const relmName = relms.getRelmNameFromRequest(request)
  const params = util.getUrlParams(request.url)
  
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

  if (!relms.relmExists(relmName)) {
    console.log(`Visitor sought to enter '${relmName}' but was rejected because it doesn't exist`)
    socket.write('HTTP/1.1 404 Not Found\r\n\r\n')
    socket.destroy()
  } else if (!auth.authenticate(id, sig, token, xydoc)) {
    console.log(`Visitor sought to enter '${relmName}' but was rejected because unauthorized`, params)
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
    socket.destroy()
  } else {
    wss.handleUpgrade(request, socket, head, (conn) => {
      wss.emit('connection', conn, request)
    })
  }
})


module.exports = server
