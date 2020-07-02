const config = require('./config.js')

const URLSearchParams = require('url').URLSearchParams

function getUrlParams(requestUrl) {
  const queryString = requestUrl.slice(requestUrl.indexOf('?'))
  return new URLSearchParams(queryString)
}

/**
 * Generates a random UUID (version 4). This can be used as a decentralized way
 * to create an identifier that has such a low probability of collision that it
 * can essentially be treated as universally unique.
 * 
 * @returns {string}
 */
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function fail(res, reason) {
  console.error(reason)
  res.writeHead(500, config.CONTENT_TYPE_JSON)
  res.end(JSON.stringify({
    status: 'error',
    reason: reason
  }))
}

function respond(res, code, json) {
  res.writeHead(code, config.CONTENT_TYPE_JSON)
  res.end(JSON.stringify(Object.assign({
    status: code === 200 ? 'success' : 'failure',
  }, json)))
}

function normalizeRelmName(name) {
  return name.toLowerCase().replace(/[^a-z\-]+/, '')
}

function joinError(error, newError) {
  newError.stack += `\nCaused By:\n` + error.stack
  return newError
}

module.exports = {
  getUrlParams,
  uuidv4,
  fail,
  respond,
  normalizeRelmName,
  joinError,
}