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
  } else {
    SERVER_YJS_URL = `ws://${location.hostname}:1235`
    SERVER_UPLOAD_URL = `http://${location.hostname}:1235/asset`
  }

  const params = new URLSearchParams(document.location.search.substring(1))
  const roomParam = params.get('room')
  const roomPath = location.pathname.split('/')[1]
  let ROOM
  if (roomParam) {
    ROOM = roomParam
  } else if (roomPath !== '') {
    ROOM = roomPath
  } else {
    ROOM = 'relm'
  }
  
  ROOM = ROOM.toLowerCase().replace(/[^a-z\-]/, '')
  
  window.config = {
    SERVER_YJS_URL,
    SERVER_UPLOAD_URL,
    ROOM
  }
  
  return window.config
}