#!/usr/bin/env node

/**
 * @type {any}
 */
const WebSocket = require('ws')
const http = require('http')
const level = require('level')
const wss = new WebSocket.Server({ noServer: true })
const setupWSConnection = require('./utils.js').setupWSConnection
const relm = require('./relm.js')

const db = level(process.env.DBNAME || 'relm-db')
const port = process.env.PORT || 1234

async function start() {
  console.log("Checking LevelDB...")
  await relm.setupDatabase(db)
  
  console.log("Starting...")
  const server = http.createServer((request, response) => {
    response.writeHead(200, { 'Content-Type': 'text/plain' })
    response.end('okay')
  })

  wss.on('connection', (conn, req) => {
    setupWSConnection(conn, req, {
      docName: req.url.slice(1).split('?')[0],
      gc: true,
      db: db
    })
  })

  server.on('upgrade', async (request, socket, head) => {
    /**
     * @param {any} ws
     */
    const handleAuth = async (ws) => {
      await relm.authorize(request, socket, wss, ws, db)
    }
    wss.handleUpgrade(request, socket, head, handleAuth)
  })

  server.listen(port)

  console.log('running on port', port)
}

start()