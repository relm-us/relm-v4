const fs = require('fs')
const path = require('path')
const express = require('express')
const fileupload = require('express-fileupload')
const cors = require('cors')
const sharp = require('sharp')
const conversion = require('./conversion2.js')
const util = require('./util.js')
const relms = require('./relms.js')
const yws = require('./yws.js')
const Y = require('yjs')

const config = require('./config.js')

if (!fs.existsSync(config.ASSET_DIR)) {
  throw Error(`Asset upload directory doesn't exist: ${config.ASSET_DIR}`)
}
const app = express()

// Enable CORS pre-flight requests across the board
// See https://expressjs.com/en/resources/middleware/cors.html#enabling-cors-pre-flight
app.options('*', cors())

app.use(fileupload({
  useTempFiles: true,
  tempFileDir: path.join(__dirname, 'tmp')
}))
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

app.get('/relms', cors(), async (req, res) => {
  const relms = relms.getRelms()
  util.respond(res, 200, { relms })
})

app.post('/relm/create/:name', cors(), async (req, res) => {
  const name = util.normalizeRelmName(req.params.name)
  console.log(`Creating relm '${name}'`)
  
  if (relms.has(name)) {
    return util.respond(res, 409, {
      reason: `relm '${name}' already exists`,
    })
  } else {
    const { control, transient, permanent } = relms.createRelm(name)
    return util.respond(res, 200, {
      action: 'created',
      relm: name,
      control,
      transient,
      permanent,
    })
  }
})

// Upload images and 3D assets
app.post('/asset', cors(), async (req, res) => {
  const asset = req.files.file
  if (asset.size > config.MAX_FILE_SIZE) {
    return util.fail(res, 'file too large')
  }
  
  const extension = path.extname(asset.name)
  if (extension.length >= config.MAX_FILE_EXTENSION_LENGTH) {
    return util.fail(res, 'file extension too long')
  }
  
  try {
    switch (extension) {
      case '.jpg':
      case '.jpeg':
      case '.gif':
      case '.png':
      case '.webp':
        const pngTempFile = asset.tempFilePath + '.png'
        await sharp(asset.tempFilePath).toFile(asset.tempFilePath + '.png')
        const pngFile = await conversion.moveAndRenameContentAddressable(pngTempFile)
        
        const webpTempFile = asset.tempFilePath + '.webp'
        await sharp(asset.tempFilePath).toFile(asset.tempFilePath + '.webp')
        const webpFile = await conversion.moveAndRenameContentAddressable(webpTempFile)
        
        return fileUploadSuccess(res, {
          png: pngFile,
          webp: webpFile,
        })
      
      case '.glb':
      case '.gltf':
        return fileUploadSuccess(res, {
          gltf: await conversion.moveAndRenameContentAddressable(asset.tempFilePath, extension)
        })

      default:
        const file = await conversion.moveAndRenameContentAddressable(asset.tempFilePath, extension)
        return conversion.fileUploadSuccess(res, {
          "*": file
        })
    }
  } catch (err) {
    return util.fail(res, err)
  }
  
})

module.exports = app