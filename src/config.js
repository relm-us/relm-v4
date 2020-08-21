/**
 * Uses the window.location as a way to distinguish which server environment we are in.
 *
 * @param {Location} location The window.location of this web page
 * @returns {Object}
 */
function Config(location) {
  let ENV
  let SERVER_URL
  let SERVER_YJS_URL
  let SERVER_UPLOAD_URL
  if (location.origin === 'https://relm.us') {
    ENV = 'p'
    SERVER_URL = 'https://y.relm.us'
    SERVER_YJS_URL = 'wss://y.relm.us'
  } else if (location.origin === 'https://staging.relm.us') {
    ENV = 's'
    SERVER_URL = 'https://y-staging.relm.us'
    SERVER_YJS_URL = 'wss://y-staging.relm.us'
  } else {
    ENV = 'l'
    SERVER_URL = `http://${location.hostname}:1235`
    SERVER_YJS_URL = `ws://${location.hostname}:1235`
  }
  SERVER_UPLOAD_URL = `${SERVER_URL}/asset`

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

  let LANDING_COORDS = null
  if (params.has('x') && params.has('z')) {
    LANDING_COORDS = {
      x: parseInt(params.get('x'), 10),
      y: 0,
      z: parseInt(params.get('z'), 10),
    }
  }

  let SINGLE_PLAYER_MODE = location.hash === '#1'

  let CAMERA_NEAR = { x: 0, y: 2000, z: 2500 }
  let CAMERA_FAR = { x: 0, y: 6000, z: 7500 }
  let CAMERA_EDITOR = { x: 0, y: 14000, z: 17500 }

  let DEFAULT_OBJECT_SIZE = 200

  return {
    SERVER_URL,
    SERVER_YJS_URL,
    SERVER_UPLOAD_URL,
    ENV,
    ROOM,
    LANDING_COORDS,
    SINGLE_PLAYER_MODE,
    CAMERA_NEAR,
    CAMERA_FAR,
    CAMERA_EDITOR,
    DEFAULT_OBJECT_SIZE,
  }
}

const config = (window.config = Config(window.location))

export { config }
