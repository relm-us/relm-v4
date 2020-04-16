const { Crypto } = require('@peculiar/webcrypto')
const base64 = require('base64-arraybuffer')
const level = require('level')
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
 * 
 * @param {LevelDB} db LevelDB Database
 * @param {UUID} id The UUID of the player
 * @param {string} sig The base64-encoded signature of the player UUID (null if not supplied)
 * @param {string} token The token potentially granting access (null if not supplied)
 * @param {XYDoc} xydoc An object containing minimal info to reconstruct a public key
 */
async function authorize(db, id, sig, token, xydoc) {
  // Try authorizing with token first
  if (token && token.length <= config.MAX_TOKEN_LENGTH) {
    console.log('Authorizing token')
    if (await authorizeWithToken(db, token)) {
      console.log('Authorization succeeded with token', `'${token}'`, `(${id})`)
      await setPublicKeyDocForId(db, id, xydoc.x, xydoc.y)
      return true
    } else {
      console.log('Authorization failed with token', `'${token}'`, `(${id})`)
    }
  } else {
    console.log('Skipping token auth')
  }
  
  // Try authorizing with signature second
  if (id && id.length <= config.MAX_UUID_LENGTH && sig) {
    console.log('Authorizing signature')
    if (await authorizeWithSignature(db, id, sig)) {
      console.log('Authorization succeeded with signature', `'${sig}'`, `(${id})`)
      return true
    } else {
      console.log('Authorization failed with signature', `'${sig}'`, `(${id})`)
    }
  } else {
    console.log('Skipping signature auth')
  }

  return false
}

async function setPublicKeyDocForId(db, id, pkx, pky) {
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

async function getPublicKeyDocForId(db, id) {
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

async function authorizeWithToken(db, token) {
  const invitationKey = `${config.INVITE_PREFIX}.${token}`
  
  let allowCounter
  try {
    allowCounter = await db.get(invitationKey)
  } catch (err) {
    if (err instanceof level.errors.NotFoundError) {
      console.warn('token not found', token)
    } else {
      console.error(err)
    }
    return false
  }
  
  if (allowCounter > 0) {
    await db.put(invitationKey, allowCounter - 1)
    return true
  } else {
    console.warn('token use count exhausted')
  }
  
  return false
}

async function authorizeWithSignature(db, id, sig) {
  let pubkeyDoc
  try {
    pubkeyDoc = await getPublicKeyDocForId(db, id)
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

module.exports = authorize