
const SECURITY_CONFIG = {
  name: 'ECDSA',
  namedCurve: 'P-384',
  namedHash: 'SHA-384'
}

const MAX_TOKEN_LENGTH = 100
const MAX_UUID_LENGTH = 36
const MAX_FILE_SIZE = 2097152
const MAX_FILE_EXTENSION_LENGTH = 5 // e.g. '.jpeg', '.gltf'
const SETUP_TOKEN = 'setup'
const SETUP_TOKEN_COUNTER = 1
const CONTENT_TYPE_JSON = { 'Content-Type': 'application/json' }
const ASSET_DIR = __dirname + '/assets'

const DBNAME = process.env.PGDATABASE || 'relm'
const PORT = process.env.PORT || 3000


module.exports = {
  SECURITY_CONFIG,
  MAX_TOKEN_LENGTH,
  MAX_UUID_LENGTH,
  MAX_FILE_SIZE,
  MAX_FILE_EXTENSION_LENGTH,
  SETUP_TOKEN,
  SETUP_TOKEN_COUNTER,
  CONTENT_TYPE_JSON,
  ASSET_DIR,
  DBNAME,
  PORT,
}
