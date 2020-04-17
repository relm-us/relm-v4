/**
 * Uses the window.location as a way to distinguish which server environment we are in.
 * 
 * @param {Location} location The window.location of this web page
 * @returns {Object}
 */
export default function config(location) {
  let SERVER_YJS_URL
  let SERVER_UPLOAD_URL
  if (location.origin === 'https://relm.us') {
    SERVER_YJS_URL = 'wss://y.relm.us'
    SERVER_UPLOAD_URL = 'https://y.relm.us/asset'
  } else if (location.origin === 'http://localhost:1234') {
    SERVER_YJS_URL = 'ws://localhost:1235'
    SERVER_UPLOAD_URL = 'http://localhost:1235/asset'
  }

  let ROOM = location.pathname.split('/')[1]
  if (ROOM === '') { ROOM = 'relm' }
  
  return {
    SERVER_YJS_URL,
    SERVER_UPLOAD_URL,
    ROOM
  }
}