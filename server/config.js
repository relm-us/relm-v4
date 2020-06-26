const SECURITY_CONFIG = {
  name: 'ECDSA',
  namedCurve: 'P-384',
  namedHash: 'SHA-384',
}

const MAX_TOKEN_LENGTH = 100
const MAX_UUID_LENGTH = 36
const MAX_FILE_SIZE = 2097152 * 2
const MAX_FILE_EXTENSION_LENGTH = 30 // e.g. '.jpeg', '.gltf', '.packed-gltf'
const SETUP_TOKEN = 'setup'
const SETUP_TOKEN_COUNTER = 1
const CONTENT_TYPE_JSON = { 'Content-Type': 'application/json' }
const ASSET_DIR = __dirname + '/assets'
const PASSWORD_LENGTH_MINIMUM = 6

const DATABASE_NAME = process.env.PGDATABASE || 'relm'
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
  PASSWORD_LENGTH_MINIMUM,
  DATABASE_NAME,
  PORT,
}
