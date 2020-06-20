const fs = require('fs')
const path = require('path')
const md5File = require('md5-file')

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

function getFileSizeInBytes(filename) {
  const stats = fs.statSync(filename);
  const fileSizeInBytes = stats.size;
  return fileSizeInBytes;
}

async function getContentAddressableName(filepath, fallbackExtension = null) {
  const hash = await md5File(filepath)
  const fileSize = getFileSizeInBytes(filepath)
  let extension = path.extname(filepath)
  
  if (extension === '') {
    if (fallbackExtension) {
      extension = fallbackExtension
    } else {
      throw Error(`File has no extension: '${filepath}'`)
    }
  }
  
  return `${hash}-${fileSize}${extension}`
}
module.exports = {
  getUrlParams,
  uuidv4,
  getFileSizeInBytes,
  getContentAddressableName,
}