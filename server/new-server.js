#!/usr/bin/env node
const express = require('express')
const http = require('http')
const WebSocket = require('ws')
const yws = require('./yws.js')
const relm = require('./relm.js')

const level = require('level')

const port = process.env.PORT || 3000
const dbname = process.env.DBNAME || 'relm-db'

const db = level(dbname)
const app = express()
const server = http.createServer()
const wss = new WebSocket.Server({ server })

app.get('/', (req, res) => {
  console.log('GET /')
  res.send("ok")
})

wss.on('connection', (conn, req) => {
  console.log('connection')
  const docName = req.url.slice(1).split('?')[0]
  yws.setupWSConnection(conn, req, {
    docName: docName,
    gc: true,
    db: db
  })
})

server.on('request', app)

server.on('upgrade', async (request, socket, head) => {
  console.log('upgrade')
  /**
   * @param {any} ws
   */
  const handleAuth = async (ws) => {
    await relm.authorize(request, socket, wss, ws, db)
  }
  wss.handleUpgrade(request, socket, head, handleAuth)
})

async function start() {
  console.log("Starting...")
  
  await relm.setupDatabase(db)
  
  // app.listen(port, () => {
  //   console.log(`Relm server listening on ${port}`)
  // })
  console.log(`Relm server listening on ${port}`)
  server.listen(port)
}

start()