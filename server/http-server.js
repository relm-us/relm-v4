const fs = require('fs')
const path = require('path')
const express = require('express')
const fileupload = require('express-fileupload')
const cors = require('cors')
const sharp = require('sharp')
const conversion = require('./conversion.js')
const util = require('./util.js')
const relms = require('./relms.js')
const auth = require('./auth.js')
const db = require('./leveldb.js')
const config = require('./config.js')
const set = require('./set.js')


if (!fs.existsSync(config.ASSET_DIR)) {
  throw Error(`Asset upload directory doesn't exist: ${config.ASSET_DIR}`)
}


const app = express()


// Enable CORS pre-flight requests across the board
// See https://expressjs.com/en/resources/middleware/cors.html#enabling-cors-pre-flight
app.options('*', cors())


// Courtesy page just to say we're a Relm web server
app.get('/', function(_req, res) {
  res.sendFile(__dirname + '/index.html')
})


function getRemoteIP(req) {
  return req.headers['x-forwarded-for'] || req.connection.remoteAddress 
}

const middleware = {
  relmName: (key = 'name') => {
    return (req, res, next) => {
      if (req.params[key]) {
        req.relmName = util.normalizeRelmName(req.params[key])
        next()
      } else {
        util.respond(res, 400, {
          status: 'error',
          reason: 'relm name required'
        })
      }
    }
  },

  relmExists: () => {
    return (req, res, next) => {
      if (!relms.relmExists(req.relmName)) {
        console.log(`[${getRemoteIP(req)}] denied entry to '${req.relmName}' (relm does not exist)`)
        util.respond(res, 404, {
          status: 'error',
          reason: 'relm does not exist'
        })
      } else {
        next()
      }
    }
  },
  
  authenticated: () => {
    return async (req, res, next) => {
      const params = util.getUrlParams(req.url)
      
      let id = params.get('id')
      let sig = params.get('s')

      const token = params.get('t')
      
      const xydoc = {
        x: params.get('x'),
        y: params.get('y')
      }
      
      const identified = await auth.authenticate(id, sig, token, xydoc)
      
      if (identified === true) {
        req.authenticatedPlayerId = id
        next()
      } else {
        console.log(`[${getRemoteIP(req)}] denied access to '${req.relmName}' (unauthenticated)`)
        util.respond(res, 401, {
          status: 'error',
          reason: 'unauthenticated'
        })
      }
    }
  },

  authorized: (permission) => {
    return async (req, res, next) => {
      const permitted = auth.authorize(permission, req.relmName, req.authenticatedPlayerId)
      
      if (permitted === true) {
        next()
      } else {
        util.respond(res, 401, {
          status: 'error',
          reason: 'unauthorized'
        })
      }
    }
  }
}

        // db.put(invitationKey, invitations.get(key))
        // db.del(invitationKey)

app.get('/')
app.post('/relm/:name/invitation',
  cors(),
  middleware.relmName(),
  middleware.relmExists(),
  middleware.authenticated(),
  middleware.authorized('invite'),
async (req, res) => {
  util.respond(res, 200, {
    status: 'success',
    token: req.relmName
  })
})


app.get('/relm/:name/can/:permission',
  cors(),
  middleware.relmName(),
  middleware.relmExists(),
  middleware.authenticated(),
async (req, res) => {
  const permitted = auth.authorize(req.params.permission, req.relmName, req.authenticatedPlayerId)
  if (permitted === true) {
    util.respond(res, 200, {
      status: 'success',
      permission,
    })
  } else {
    util.respond(res, 401, {
      status: 'error',
      reason: 'unauthorized'
    })
  }
})


app.post('/relm/:name/create',
  cors(),
  middleware.relmName(),
  middleware.authenticated(),
  middleware.authorized('admin'),
async (req, res) => {
  const name = util.normalizeRelmName(req.params.name)
  console.log(`Creating relm '${name}'`)
  
  if (relms.relmExists(name)) {
    return util.respond(res, 409, {
      reason: `relm '${name}' already exists`,
    })
  } else {
    const { control, controlName } = relms.createRelm(name)
    return util.respond(res, 200, {
      action: 'created',
      control: controlName,
      settings: relms.yDocToJSON(control),
    })
  }
})


app.get('/relms',
  cors(),
async (req, res) => {
  const rs = relms.getRelms()
  util.respond(res, 200, { relms: rs })
})


// Upload images and 3D assets
app.post('/asset',
  cors(),
  // middleware.authenticated(),
async (req, res) => {
  const asset = req.files.file
  if (asset.size > config.MAX_FILE_SIZE) {
    return util.fail(res, 'file too large')
  }
  
  const extension = path.extname(asset.name)
  if (extension.length > config.MAX_FILE_EXTENSION_LENGTH) {
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
        
        return conversion.fileUploadSuccess(res, {
          png: pngFile,
          webp: webpFile,
        })
      
      case '.glb':
      case '.gltf':
        return conversion.fileUploadSuccess(res, {
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


// Serve uploaded files
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


module.exports = app