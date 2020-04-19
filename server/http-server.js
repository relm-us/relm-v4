const fs = require('fs')
const path = require('path')
const express = require('express')
const fileupload = require('express-fileupload')
const cors = require('cors')
// const detect = require('detect-file-type')

const config = require('./config.js')
const uuidv4 = require('./util.js').uuidv4

if (!fs.existsSync(config.ASSET_DIR)) {
  throw Error(`Asset upload directory doesn't exist: ${config.ASSET_DIR}`)
}
const app = express()

// Enable CORS pre-flight requests across the board
// See https://expressjs.com/en/resources/middleware/cors.html#enabling-cors-pre-flight
app.options('*', cors())

app.use(fileupload())
app.use('/asset', express.static(config.ASSET_DIR, {
  setHeaders: (res, path, stat) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
  }
}))

// Courtesy page just to say we're a Relm web server
app.get('/', function(_req, res) {
  res.sendFile(__dirname + '/index.html')
})

function fail(res, reason) {
  console.error(reason)
  res.writeHead(500, config.CONTENT_TYPE_JSON)
  res.end(JSON.stringify({
    status: 'error',
    reason: reason
  }))
}

// Upload images and 3D assets
app.post('/asset', cors(), (req, res) => {
  const asset = req.files.file
  if (asset.size > config.MAX_FILE_SIZE) {
    return fail(res, 'file too large')
  }
  const extension = path.extname(asset.name)
  if (extension.length >= config.MAX_FILE_EXTENSION_LENGTH) {
    return fail(res, 'file extension too long')
  }
  const assetId = uuidv4()
  const newName = assetId + extension
  const moveTo = config.ASSET_DIR + '/' + newName
  
  console.log('Uploading asset to', moveTo, asset.name)
  asset.mv(moveTo, (err) => {
    if (err) {
      return fail(res, err)
    } else {
      res.writeHead(200, config.CONTENT_TYPE_JSON)
      res.end(JSON.stringify({
        status: 'success',
        id: assetId,
        file: newName,
        path: `/asset/${newName}`
      }))
    }
  })
})

module.exports = app