import { ShowLoadingProgress } from './show_loading_progress.js'
import { ResourceLoader } from './resource_loader.js'
import { Stage } from './stage.js'

/**
 * Uses the window.location as a way to distinguish which server environment we are in.
 * 
 * @param {Location} location The window.location of this web page
 * @returns {Object}
 */
function config(location) {
  let ENV
  let SERVER_YJS_URL
  let SERVER_UPLOAD_URL
  if (location.origin === 'https://relm.us') {
    ENV = 'p'
    SERVER_YJS_URL = 'wss://y.relm.us'
    SERVER_UPLOAD_URL = 'https://y.relm.us/asset'
  } else if (location.origin === 'https://staging.relm.us') {
    ENV = 's'
    SERVER_YJS_URL = 'wss://y-staging.relm.us'
    SERVER_UPLOAD_URL = 'https://y-staging.relm.us/asset'
  } else {
    ENV = 'l'
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
  
  let LANDING_COORDS = null
  if (params.has('x') && params.has('z')) {
    LANDING_COORDS = {
      x: parseInt(params.get('x'), 10),
      y: 0,
      z: parseInt(params.get('z'), 10),
    }
  }
  
  let SINGLE_PLAYER_MODE = (location.hash === '#1')
  
  window.config = {
    SERVER_YJS_URL,
    SERVER_UPLOAD_URL,
    ENV,
    ROOM,
    LANDING_COORDS,
    SINGLE_PLAYER_MODE,
  }
  
  return window.config
}


// Show progress as we load resources
const resources = window.resources = ResourceLoader()
// resources.on('loaded', ({ id, currentProgress, maxProgress }) => {
//   ShowLoadingProgress(id, currentProgress, maxProgress) 
// })

// The Stage is where all the THREE.js things come together, e.g. camera, lights
const stage = window.stage = Stage({ width: window.innerWidth, height: window.innerHeight })


export {
  config,
  resources,
  stage,
}