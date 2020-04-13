const level = require('level')
const url = require('url')
const { Crypto } = require('@peculiar/webcrypto')
const base64 = require('base64-arraybuffer')
require('fast-text-encoding')

const crypto = new Crypto();

const INVITE_PREFIX = 'invitation'
const PUBKEY_PREFIX = 'pubkey'
const MAX_TOKEN_LENGTH = 100
const MAX_UUID_LENGTH = 36

const SECURITY_CONFIG = {
  name: 'ECDSA',
  namedCurve: 'P-384',
  namedHash: 'SHA-384'
}

/**
 * If this is the first-time creation of the leveldb, add
 * a setup token that allows the first user in to Relm.
 */
async function setupDatabase(db) {
  const token = 'setup'
  const oneTimeKey = `${INVITE_PREFIX}.${token}`
  try {
    await db.get(oneTimeKey)
  } catch (err) {
    if (err instanceof level.errors.NotFoundError) {
      try {
        await db.put(oneTimeKey, 9999)
        console.log(`First-time setup: "${token}" one-time-use token created`)
        console.log(`Visit e.g. https://relm.us/?t=${token} to authorize for the first time`)
      } catch(err) {
        console.error(`unable to set "${token}" one-time use token`, err)
      }
    }
  }
}

async function setupRelm(doc, db) {
  const invitations = doc.getMap('invitations')
  invitations.observe((event, t) => {
    console.log('observed invitation change')
    event.changes.keys.forEach(async ({ action }, key) => {
      const invitationKey = `${INVITE_PREFIX}.${key}`
      if (action === 'add') {
        console.log('observed invitation [ADD]', key, invitations.get(key))
        await db.put(invitationKey, invitations.get(key))
      } else if (action === 'delete') {
        console.log('observed invitation [DEL]', key)
        await db.del(invitationKey)
      }
    })
  })
}

function getParamsFromUrl(requestUrl, hrefPrefixIfMissing) {
  let params
  try {
    if (requestUrl.indexOf('ws') === 0) {
      params = new url.URL(requestUrl)
    } else {
      params = new url.URL(hrefPrefixIfMissing + requestUrl)
    }
  } catch (e) {
    console.error('unable to parse url', requestUrl, e)
    return
  }
  return params.searchParams
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
  await db.put(`${PUBKEY_PREFIX}.${id}`, JSON.stringify(secret))
}

async function getPublicKeyDocForId(db, id) {
  const result = await db.get(`${PUBKEY_PREFIX}.${id}`)
  return JSON.parse(result)
}

async function authorizeWithToken(db, token, id, pkx, pky) {
  const invitationKey = `${INVITE_PREFIX}.${token}`
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
    await setPublicKeyDocForId(db, id, pkx, pky)
    return true
  } else {
    console.warn('token use count exhausted')
  }
  
  return false
}

async function docToPubKey(pubkeyDoc) {
  return await crypto.subtle.importKey(
    'jwk', pubkeyDoc,
    SECURITY_CONFIG,
    true, ['verify']
  ) 
}

async function verify(message, signature, publicKey) {
  const encoded = new TextEncoder('utf-8').encode(message)
  const signatureArrayBuffer = base64.decode(signature)
  
  const result = await crypto.subtle.verify(
    { name: SECURITY_CONFIG.name,
      hash: {name: SECURITY_CONFIG.namedHash}},
    publicKey,
    signatureArrayBuffer,
    encoded
  )
  return result
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

async function authorize(request, socket, wss, ws, db) {
  let authorized = false

  const params = getParamsFromUrl(request.url, 'wss://relm.us')
  console.log('params', params)
  
  let id = params.get('id')
  
  // Try authorizing with token first
  let token = params.get('t')
  let pkx = params.get('x')
  let pky = params.get('y')
  if (token && token.length <= MAX_TOKEN_LENGTH) {
    console.log('Authorizing token')
    if (await authorizeWithToken(db, token, id, pkx, pky)) {
      console.log('Authorization succeeded with token', `'${token}'`, `(${id})`)
      authorized = true
    } else {
      console.log('Authorization failed with token', `'${token}'`, `(${id})`)
    }
  } else {
    console.log('Skipping token auth')
  }
  
  // Try authorizing with signature second
  let sig = params.get('s')
  if (id && id.length <= MAX_UUID_LENGTH && sig) {
    console.log('Authorizing signature')
    if (await authorizeWithSignature(db, id, sig)) {
      console.log('Authorization succeeded with signature', `'${sig}'`, `(${id})`)
      authorized = true
    } else {
      console.log('Authorization failed with signature', `'${sig}'`, `(${id})`)
    }
  } else {
    console.log('Skipping signature auth')
  }
  
  if (authorized) {
    wss.emit('connection', ws, request)
  } else {
    // socket.destroy()
  }

}
module.exports = {
  setupDatabase,
  setupRelm,
  authorize
}