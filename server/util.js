const URLSearchParams = require('url').URLSearchParams

function getUrlParams(requestUrl) {
  const queryString = requestUrl.slice(requestUrl.indexOf('?'))
  return new URLSearchParams(queryString)
}

module.exports = {
  getUrlParams
}