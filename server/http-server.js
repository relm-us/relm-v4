const fs = require('fs')
const path = require('path')
const express = require('express')
const fileupload = require('express-fileupload')
const cors = require('cors')

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

function fileUploadSuccess(res, assetId, filename) {
  res.writeHead(200, config.CONTENT_TYPE_JSON)
  res.end(JSON.stringify({
    status: 'success',
    id: assetId,
    file: filename,
    path: `/asset/${filename}`
  }))
}

// Upload images and 3D assets
app.post('/asset', cors(), async (req, res) => {
  const asset = req.files.file
  if (asset.size > config.MAX_FILE_SIZE) {
    return fail(res, 'file too large')
  }
  const extension = path.extname(asset.name)
  if (extension.length >= config.MAX_FILE_EXTENSION_LENGTH) {
    return fail(res, 'file extension too long')
  }
  
  const assetId = asset.md5 + '-' + asset.size
  const newName = assetId + extension
  const moveTo = config.ASSET_DIR + '/' + newName
  
  try {
    await fs.promises.access(moveTo)
    console.log('Asset upload skipped (already exists)', moveTo, asset.name)
  } catch (accessError) {
    if (accessError.code === 'ENOENT') {
      console.log('Asset uploaded to', moveTo, asset.name)
      asset.mv(moveTo, (err) => {
        if (err) { return fail(res, err) }
      })
    } else {
      throw err
    }
  }
  return fileUploadSuccess(res, assetId, newName)
})

module.exports = app