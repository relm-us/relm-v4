const fs = require('fs')

const server = require('./ws-server.js')
const db = require('./db/db.js')
const config = require('./config.js')


if (!fs.existsSync(config.ASSET_DIR)) {
  throw Error(`Asset upload directory doesn't exist: ${config.ASSET_DIR}`)
}


async function start() {
  await db.init()

  const port = config.PORT
  server.listen(port, () => {
    console.log(`http/ws server listening on ${port}`)
  })
}

start()