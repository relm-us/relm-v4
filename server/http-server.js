const fs = require('fs')
const path = require('path')
const express = require('express')
const fileupload = require('express-fileupload')
const cors = require('cors')
const sharp = require('sharp')
const createError = require('http-errors')

const conversion = require('./conversion.js')
const util = require('./util.js')
const relms = require('./relms.js')
const auth = require('./auth.js')
const db = require('./db/db.js')
const config = require('./config.js')
const set = require('./set.js')


const { Player, Invitation, Permission } = db

const app = express()

// Enable CORS pre-flight requests across the board
// See https://expressjs.com/en/resources/middleware/cors.html#enabling-cors-pre-flight
app.options('*', cors())


// We use wrapAsync so that async errors get caught and handled by our generic error handler
function wrapAsync(fn) {
  return function(req, res, next) {
    fn(req, res, next).catch(next)
  }
}


function getRemoteIP(req) {
  return req.headers['x-forwarded-for'] || req.connection.remoteAddress 
}

async function getDbClient(req) {
  if (!req.dbClient) {
    req.dbClient = await db.pool.connect()
  }
  return req.dbClient
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
      const client = await getDbClient(req)
      
      const params = util.getUrlParams(req.url)
      
      const playerId = params.get('id')
      
      const sig = params.get('s') // the `id`, signed

      const x = params.get('x')
      const y = params.get('y')
      
      try {
        req.verifiedPubKey = await Player.findOrCreateVerifiedPubKey(client, { playerId, sig, x, y })
        req.authenticatedPlayerId = playerId
        next()
      } catch (err) {
        next(util.joinError(err, Error(`can't authenticate`)))
      }
      
      
    }
  },
  
  acceptToken: () => {
    return async (req, res, next) => {
      const client = await getDbClient(req)
      
      const params = util.getUrlParams(req.url)
      
      const token = params.get('t')
      const relm = req.relmName
      const playerId = req.authenticatedPlayerId
      
      try {
        await db.useToken(client, { token, relm, playerId })
      } catch (err) {
        if (err.message.match(/no longer valid/)) {
          next()
        } else {
          next(err)
        }
      }
      
      next()
    }
  },

  authorized: (permission) => {
    return async (req, res, next) => {
      const client = await getDbClient(req)
      
      let permitted = false
      try {
        const permissions = await Permission.getPermissions(client, {
          playerId: req.authenticatedPlayerId,
          relm: req.relmName,
        })
        
        permitted = permissions.has(permission)
      } catch (err) {
        next(err)
      }
      
      if (permitted === true) {
        next()
      } else {
        next(createError(401, 'unauthorized'))
      }
    }
  }
}


// Courtesy page just to say we're a Relm web server
app.get('/', function(_req, res) {
  res.sendFile(__dirname + '/index.html')
})


app.post('/authenticate',
  cors(),
  middleware.authenticated(),
  middleware.acceptToken(),
wrapAsync(async (req, res) => {
  util.respond(res, 200, {
    action: 'authenticated'
  })
}))


app.post('/relm/:name/create',
  cors(),
  middleware.relmName(),
  middleware.authenticated(),
  middleware.acceptToken(),
  middleware.authorized('admin'),
wrapAsync(async (req, res) => {
  const relmName = util.normalizeRelmName(req.params.name)
  
  if (relms.relmExists(relmName)) {
    throw Error(`relm '${relmName}' already exists`)
  } else {
    console.log(`Creating relm '${relmName}'`)
    const { control, controlName } = relms.createRelm(relmName)
    return util.respond(res, 200, {
      action: 'created',
      control: controlName,
      settings: relms.yDocToJSON(control),
    })
  }
}))


app.get('/relm/:name/can/:permission',
  cors(),
  middleware.relmName(),
  middleware.relmExists(),
  middleware.authenticated(),
  middleware.acceptToken(),
wrapAsync(async (req, res) => {
  const auth = middleware.authorized(req.params.permission)
  await auth(req, res, (err) => {
  console.log('permission err', err)
    if (!err) {
      util.respond(res, 200, {
        action: 'permitted'
      })
    } else {
      throw err
    }
  })
}))


app.post('/relm/:name/invitation',
  cors(),
  middleware.relmName(),
  middleware.relmExists(),
  middleware.authenticated(),
  middleware.authorized('invite'),
wrapAsync(async (req, res) => {
  util.respond(res, 200, {
    status: 'success',
    token: req.relmName
  })
}))


app.get('/relms',
  cors(),
wrapAsync(async (req, res) => {
  const rs = relms.getRelms()
  util.respond(res, 200, { relms: rs })
}))


// Upload images and 3D assets
app.post('/asset',
  cors(),
  // middleware.authenticated(),
wrapAsync(async (req, res) => {
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
  
}))


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


// General error handler; must be last middleware
app.use(function(error, req, res, next) {
  const errorId = util.uuidv4().split('-')[0]
  const status = error.status || 400
  console.log(`[${getRemoteIP(req)}] ${status} (${errorId}): ${error.message}\n${error.stack}`)
  util.respond(res, status, {
    status: 'error',
    reason: `${error.message} (${errorId})`,
  })
})


module.exports = app