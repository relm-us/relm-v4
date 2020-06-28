const { Crypto } = require('@peculiar/webcrypto')
const base64 = require('base64-arraybuffer')
const level = require('level')
const db = require('./leveldb.js')
const invitation = require('./invitation.js')
require('fast-text-encoding')

const config = require('./config.js')

const crypto = new Crypto();


/**
 * The 'x' and 'y' components of ECDSA key that can be used to create a public key.
 * @typedef XYDoc
 * @property {string} x The 'x' component of the ECDSA public key, base64 encoded
 * @property {string} y The 'y' component of the ECDSA public key, base64 encoded
 */


/**
 * Authenticate
 */


/**
 * Authenticate returns true if the user can be identified, or false otherwise. If
 * a token is provided, the signature and xydoc is recorded as the identity.
 * 
 * @param {UUID} id The UUID of the player
 * @param {string} sig The base64-encoded signature of the player UUID (null if not supplied)
 * @param {string} token The token potentially granting access (null if not supplied)
 * @param {XYDoc} xydoc An object containing minimal info to reconstruct a public key
 */
async function authenticate(id, sig, token, xydoc) {
  // Try authorizing with token first
  if (token && token.length <= config.MAX_TOKEN_LENGTH) {
    console.log('Authenticating via token')
    if (await authenticateWithToken(token)) {
      console.log('Authentication succeeded via token', `'${token}'`, `(${id})`)
      await setPublicKeyDocForId(id, xydoc.x, xydoc.y)
      return true
    } else {
      console.log('Authentication failed via token', `'${token}'`, `(${id})`)
    }
  } else {
    console.log('Skipping authentication via token')
  }
  
  // Try authorizing with signature second
  if (id && id.length <= config.MAX_UUID_LENGTH && sig) {
    console.log('Authenticating via signature')
    if (await authenticateWithSignature(id, sig)) {
      console.log('Authentication succeeded via signature', `'${sig}'`, `(${id})`)
      return true
    } else {
      console.log('Authenticating failed via signature', `'${sig}'`, `(${id})`)
    }
  } else {
    console.log('Skipping authentication via signature')
  }

  return false
}

async function setPublicKeyDocForId(id, pkx, pky) {
  const secret = {
    crv: 'P-384',
    ext: true,
    key_ops: ['verify'],
    kty: 'EC',
    x: pkx,
    y: pky,
  }
  await db.put(`${config.PUBKEY_PREFIX}.${id}`, JSON.stringify(secret))
}

async function getPublicKeyDocForId(id) {
  const result = await db.get(`${config.PUBKEY_PREFIX}.${id}`)
  return JSON.parse(result)
}

async function docToPubKey(pubkeyDoc) {
  return await crypto.subtle.importKey(
    'jwk', pubkeyDoc,
    config.SECURITY_CONFIG,
    true, ['verify']
  ) 
}

async function verify(message, signature, publicKey) {
  const encoded = new TextEncoder('utf-8').encode(message)
  const signatureArrayBuffer = base64.decode(signature)
  
  const result = await crypto.subtle.verify(
    { name: config.SECURITY_CONFIG.name,
      hash: {name: config.SECURITY_CONFIG.namedHash}},
    publicKey,
    signatureArrayBuffer,
    encoded
  )
  return result
}

async function authenticateWithToken(token) {
  if (await invitation.useInvitation(db, { token })) {
    const invite = await invitation.getInvitation(db, { token })

    // Copy invitation params over to permissions
    
  }
  
  return false
}

async function authenticateWithSignature(id, sig) {
  let pubkeyDoc
  try {
    pubkeyDoc = await getPublicKeyDocForId(id)
  } catch (err) {
    if (err instanceof level.errors.NotFoundError) {
      console.warn('id not found', id)
    } else {
      console.error(err)
    }
    return false
  }
  const publicKey = await docToPubKey(pubkeyDoc)
  return await verify(id, sig, publicKey)
}


/**
 * Authorization
 */
 
async function authorize(permission, relmName, playerId) {
  let relmPermissions
  const relmPermsJSON = await db.get(`perms.${relmName}.*`)
  try {
    relmPermissions = new Set(JSON.parse(relmPermsJSON))
    console.log('relmPermissions', relmPermissions)
  } catch (err) {
    relmPermissions = new Set()
  }
  
  let playerPermissions
  const playerPermsJSON = await db.get(`perms.${relmName}.${playerId}`)
  try {
    playerPermissions = new Set(JSON.parse(playerPermsJSON))
    console.log('playerPermissions', playerPermissions)
  } catch (err) {
    playerPermissions = new Set()
  }

  const permissions = set.union(relmPermissions, playerPermissions)
  
  return permissions.has(permission)
}

module.exports = {
  authenticate,
  authenticateWithSignature,
  authorize,
}
