
const SECURITY_CONFIG = {
  name: 'ECDSA',
  namedCurve: 'P-384',
  namedHash: 'SHA-384'
}

const INVITE_PREFIX = 'invitation'
const PUBKEY_PREFIX = 'pubkey'
const MAX_TOKEN_LENGTH = 100
const MAX_UUID_LENGTH = 36
const SETUP_TOKEN = 'setup'
const SETUP_TOKEN_COUNTER = 9999

module.exports = {
  SECURITY_CONFIG,
  INVITE_PREFIX,
  PUBKEY_PREFIX,
  MAX_TOKEN_LENGTH,
  MAX_UUID_LENGTH,
  SETUP_TOKEN,
  SETUP_TOKEN_COUNTER,
}
