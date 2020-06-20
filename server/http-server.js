const fs = require('fs')
const path = require('path')
const express = require('express')
const fileupload = require('express-fileupload')
const cors = require('cors')
const sharp = require('sharp')
const getContentAddressableName = require('./util.js').getContentAddressableName

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


function fail(res, reason) {
  console.error(reason)
  res.writeHead(500, config.CONTENT_TYPE_JSON)
  res.end(JSON.stringify({
    status: 'error',
    reason: reason
  }))
}

function fileUploadSuccess(res, files = {}) {
  res.writeHead(200, config.CONTENT_TYPE_JSON)
  res.end(JSON.stringify({
    status: 'success',
    files,
  }))
}

async function moveAndRenameContentAddressable(filepath, extension = null) {
  const contentAddressableName = await getContentAddressableName(filepath, extension)
  const destination = path.join(config.ASSET_DIR, contentAddressableName)
  
  try {
    // Check if destination already exists. If content-addressable file exists,
    // we need not overwrite it because we are guaranteed its content is the same
    await fs.promises.access(destination)
    
    console.log(`Skipping 'move file': file already exists (${destination})`)
    
    // clean up
    await fs.promises.unlink(filepath)
    
    return path.basename(destination)
  } catch (accessError) {
    if (accessError.code === 'ENOENT') {
      
      console.log(`Moving file to '${destination}'`)
      
      await fs.promises.rename(filepath, destination)
      
      return path.basename(destination)
    } else {
      throw err
    }
  }
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
  
  try {
    switch (extension) {
      case '.jpg':
      case '.jpeg':
      case '.gif':
      case '.png':
      case '.webp':
        const pngTempFile = asset.tempFilePath + '.png'
        await sharp(asset.tempFilePath).toFile(asset.tempFilePath + '.png')
        const pngFile = await moveAndRenameContentAddressable(pngTempFile)
        
        const webpTempFile = asset.tempFilePath + '.webp'
        await sharp(asset.tempFilePath).toFile(asset.tempFilePath + '.webp')
        const webpFile = await moveAndRenameContentAddressable(webpTempFile)
        
        return fileUploadSuccess(res, {
          png: pngFile,
          webp: webpFile,
        })
      
      case '.glb':
      case '.gltf':
        return fileUploadSuccess(res, {
          gltf: await moveAndRenameContentAddressable(asset.tempFilePath, extension)
        })

      default:
        const file = await moveAndRenameContentAddressable(asset.tempFilePath, extension)
        return fileUploadSuccess(res, {
          "*": file
        })
    }
  } catch (err) {
    return fail(res, err)
  }
  
})

module.exports = app