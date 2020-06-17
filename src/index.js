// Import external libraries and helpers
import Dropzone from 'dropzone'
import { guestNameFromPlayerId, avatarOptionFromPlayerId, avatarOptionsOfGender } from './avatars.js'
import { Security } from './security.js'
import { initializeAVChat, muteAudio, unmuteAudio } from './avchat.js'
import { normalizeWheel } from './lib/normalizeWheel.js'
import { showToast } from './lib/Toast.js'
import { showInfoAboutObject } from './show_info_about_object.js'
import "toastify-js/src/toastify.css"

// Register each type of shared entity
import { Typed } from './typed.js'
import { Player } from './player.js'
import { MousePointer } from './mouse_pointer.js'
import { Decoration } from './decoration.js'
import { Thing3D } from './thing3d.js'
import { Teleportal } from './teleportal.js'

// Misc. other imports
import { KeyboardController } from './keyboard_controller.js'
import { CameraController } from './camera_controller.js'
import { FindIntersectionsFromScreenCoords } from './find_intersections_from_screen_coords.js'
import { localstoreRestore } from './localstore_gets_state.js'
import { uuidv4, getOrCreateLocalId, randomPastelColor, domReady } from './util.js'
import { config, stage } from './config.js'
import { network } from './network.js'
import { PadController } from './pad_controller.js'
import { relmImport } from './lib/relmExport.js'
import { GoalGroup } from './goals/goal_group.js'
import { addManifestTo } from './manifest_loaders.js'
import { parseCommand } from './commands.js'
import { recordCoords } from './record_coords.js'

import {
  KEY_UP, KEY_DOWN, KEY_LEFT, KEY_RIGHT,
  KEY_W, KEY_A, KEY_S, KEY_D, KEY_Q, KEY_E,
  KEY_SPACE, KEY_TAB, KEY_RETURN, KEY_ESCAPE,
  KEY_BACK_SLASH, KEY_SLASH,
  KEY_BACK_SPACE, KEY_DELETE
} from 'keycode-js'

const IMAGE_FILETYPE_RE = /\.(png|gif|jpg|jpeg|webp)$/
const GLTF_FILETYPE_RE = /\.(gltf|glb)$/

const cfg = config(window.location)
const intersectionFinder = FindIntersectionsFromScreenCoords({ stage })
let previousMousedownIndex = 0

// Don't look for 'dropzone' in HTML tags
Dropzone.autoDiscover = false

// Enable three.js cache for textures and meshes
THREE.Cache.enabled = true

const security = Security()

let player
let mousePointer


/**
 * Wait for an entity to be added to the stage. Normally, it shouldn't take more then a few milliseconds.
 * 
 * @param {string} uuid - the UUID of the entity to wait for
 * @param {number} maxWait - the maximum number of milliseconds to wait
 * @param {Function} condition - an optional additional condition to be met
 */
const entityOnStage = async ({ uuid, maxWait = 1000, condition = null }) => {
  const startTime = Date.now()
  return new Promise((resolve, reject) => {
    const intervalId = setInterval(() => {
      if (uuid in stage.entities && (condition === null || condition(stage.entities[uuid]))) {
        clearInterval(intervalId)
        resolve(stage.entities[uuid])
      } else if (Date.now() - startTime > maxWait) {
        clearInterval(intervalId)
        reject(`Unable to add entity to scene, waited ${maxWait} milliseconds (UUID: '${uuid}')`)
      }
    }, 10)
  })
}


const start = async () => {
  const playerId = await security.getOrCreateId()
  const mouseId = getOrCreateLocalId('mouseId')
  
  // Initialize network first so that entities can send their initial state
  // even before we've connected to server (or eventually, peers)
  network.on('add', async (goalGroupMap, isTransient) => {
    console.log('network.on add', goalGroupMap.toJSON())
    
    // Get the stamp that has registered itself as a named, matching type
    const typeName = goalGroupMap.get('@type')
    const Type = Typed.getType(typeName)
    
    const params = {
      goals: GoalGroup({ goalDefinitions: Type.goalDefinitions, goalGroupMap })
    }
    
    const entity = Type(params)
    
    if (isTransient) {
      network.transients.installInterceptors(entity)
    }
    
    stage.add(entity)
  })
  
  network.on('remove', (uuid) => {
    const entity = stage.entities[uuid]
    if (entity) {
      stage.remove(entity)
    }
  })
  
  const params = { id: playerId }
  const url = new URL(window.location.href)
  const token = url.searchParams.get("t")
  if (window.crypto.subtle) {
    const pubkey = await security.exportPublicKey()
    const signature = await security.sign(playerId)
    params.s = signature
    if (token) {
      Object.assign(params, {
        t: token,
        /**
         * The `x` and `y` parameters are public parts of the ECDSA algorithm.
         * The server registers these and can later verify anything this client
         * cryptographically signs.
         */
        x: pubkey.x,
        y: pubkey.y
      })
    }
    await security.verify(playerId, signature)
  } else {
    console.log("Not using crypto.subtle")
  }
  
  network.connect({
    params,
    onTransientsSynced: () => {
      // If we don't find ourselves in the transients document, we need to create ourselves
      if (!network.transients.objects.has(playerId)) {
        network.transients.create({
          type: 'player',
          uuid: playerId,
          goals: {
            label: { text: guestNameFromPlayerId(playerId), oz: 50 },
            animationMesh: { v: avatarOptionFromPlayerId(playerId).avatarId },
            animationSpeed: { v: 1.0 },
            speed: { max: 250 },
            color: randomPastelColor(),
          },
        })
      }
      
      if (!network.transients.objects.has(mouseId)) {
        network.transients.create({
          type: 'mouse',
          uuid: mouseId,
          goals: {
            color: randomPastelColor(),
          }
        })
      }
    }
  })
  
  

  // We first add all resources from the manifest so that the progress
  // bar can add up all the resource's sizes. The actual loading doesn't
  // happen until we `enqueue` and `load`.
  addManifestTo(resources)
  
  // Stage 1 Resource Load: Bare essentials
  resources.enqueue(['people', 'interact', 'sparkle', 'marble'])
  await resources.load()

  stage.setGroundTexture(resources.get('marble'))
  window.addEventListener('resize', _ => stage.windowResized(window.innerWidth, window.innerHeight))
  stage.start()


  await domReady()
  
  let playersCentroid = new THREE.Vector3()
  let occasionalUpdate = 0
  const sortByZ = (a, b) => (a.object.position.z - b.object.position.z)
  
  // The player!
  // player.on('thoughtBubbleAction', (thought) => {
  //   mostRecentlyCreatedObjectId = uuidv4()
  //   const position = Object.assign({}, player.state.position.now)
  //   const diamond = InteractionDiamond({
  //     uuid: mostRecentlyCreatedObjectId,
  //     type: 'diamond',
  //     link: thought,
  //     position,
  //   })
  //   diamond.object.position.copy(position)
  //   // Make it about chest-height by default
  //   diamond.state.position.target.y += 100
  //   diamond.state.position.target.x += 100
  //   network.setEntity(diamond)
    
  //   player.setThought(null)
  // })
  // player.videoBubble.object.createDomElement()
  // player.videoBubble.object.on('mute', muteAudio)
  // player.videoBubble.object.on('unmute', unmuteAudio)
  
  player = stage.player = await entityOnStage({ uuid: playerId })
  
  mousePointer = stage.mouse = await entityOnStage({ uuid: mouseId })
  
  network.on('transient-receive', (uuid, state) => {
    if (uuid !== mouseId && uuid !== playerId) {
      const entity = stage.entities[uuid]
      if (entity) {
        for (const [goalAbbrev, goalState] of Object.entries(state)) {
          const goal = entity.goals.get(goalAbbrev)
          if ('@due' in goalState) {
            goal.due = goalState['@due']
          }
          for (const [k, v] of Object.entries(goalState)) {
            if (k.slice(0,1) !== '@') {
              goal._map.set(k, v)
            }
          }
        }
      }
    }
  })
  
  // Perform several calculations once per game loop:
  // 1. (occasionally) Refresh videoBubble diameter
  // 2. Calculate centroid of all players on stage
  // 3. Sort players by Z order
  stage.addUpdateFunction((delta) => {
    occasionalUpdate++

    // Double-count the player's position so that the camera prefers player slightly
    let playerCount = 1
    playersCentroid.copy(player.object.position)   
    // TODO: make this filter for 'HasVideoBubble' instead of just looking for players
    stage.forEachEntityOnStageOfType('player', (player, i) => {
      // Occasionally refresh videoBubble diameter due to new players
      // entering scene and needing size adjusted to zoom level
      if (occasionalUpdate % 100 === 0) {
        player.videoBubble.object.setDiameter(stage.fov)
      }
      
      // Add player positions and keep track of count so we can divide by
      // number of players after the loop (to get average/centroid position)
      playersCentroid.add(player.object.position)
      playerCount++
      
      // Sort the visible players by Z order
      const el = player.videoBubble.object.domElement
      if (el) { el.style.zIndex = i + 1 }
    }, sortByZ)
    
    // Finalize player centroid calculation
    playersCentroid.divideScalar(playerCount)
    
    network.transients.sendState([playerId, mouseId])
  })
    
  // Mouse wheel zooms in and out
  document.addEventListener('wheel', function(event) {
    if (event.target.id === 'game') {
      let pixelY = normalizeWheel(event.deltaY)
      const newFov = stage.fov - pixelY
      stage.setFov(newFov)
      
      stage.forEachEntityOnStageOfType('player', player => {
        player.videoBubble.object.setDiameter(stage.fov)
      })
    }
  })

  // The stage is special in that it creates a domElement that must be added to our page
  document.getElementById('game').appendChild(stage.renderer.domElement)
  
  document.getElementById('upload-button').addEventListener('mousedown', (event) => {
    event.preventDefault()
  })
  const previews = document.getElementById('previews')
  const dropzone = new Dropzone(document.body, {
    url: cfg.SERVER_UPLOAD_URL,
    clickable: '#upload-button',
    previewsContainer: '#previews',
    maxFiles: 1,
  })
  dropzone.on('addedfile', (file) => {
    previews.classList.add('show')
  })
  dropzone.on('error', async (dz, error, xhr) => {
    previews.classList.remove('show')
    showToast(`Unable to upload: ${error.reason} (note: 2MB file size limit)`)
  })
  dropzone.on('success', async (dz, response) => {
    // Close the upload box automatically
    previews.classList.remove('show')
    
    const url = cfg.SERVER_UPLOAD_URL + '/' + response.file
    
    // Add the asset to the network so everyone can see it
    if (response.file.match(IMAGE_FILETYPE_RE)) {
      const layer = Math.floor(Math.random() * 100)
      network.permanents.create({
        type: 'decoration',
        goals: {
          position: {
            x: player.object.position.x,
            y: player.object.position.y + (layer / 100),
            z: player.object.position.z,
          },
          asset: { url },
        }
      })
    } else if (response.file.match(GLTF_FILETYPE_RE)) {
      const uuid = uuidv4()
      network.permanents.create({
        type: 'thing3d',
        uuid: uuid,
        goals: {
          position: {
            x: player.object.position.x,
            y: player.object.position.y,
            z: player.object.position.z,
          },
          asset: { url },
        },
      })
      const thing3d = await entityOnStage({ uuid, condition: (entity) => entity.child })
      
      // The `normalize` step happens just once after loading
      thing3d.normalize()
        
      // Select the thing that was just uploaded
      stage.selection.select([thing3d])
        
      showToast(`Uploaded with scale normalized to ${parseInt(thing3d.goals.scale.get('x'), 10)}`)
    } else {
      const ext = /(?:\.([^.]+))?$/.exec(response.file)[1] || 'unknown'
      showToast(`Upload canceled. We don't know how to use files of type ${ext}`)
    }
  })
  dropzone.on('complete', (a) => {
    console.log('file upload complete', a)
    dropzone.removeAllFiles()
  })

  const padController = stage.create('padcon', { target: player })
  const controlPadEl = document.getElementById('control-pad')
  // controlPadEl.addEventListener('mousemove', (event) => {
  //   const rect = controlPadEl.getBoundingClientRect()
  //   const x = (event.layerX - rect.width / 2) / (rect.width/2)
  //   const y = (event.layerY - rect.height / 2) / (rect.height/2)
  //   const position = new THREE.Vector3(x * 100, 0, y * 100)
  //   padController.padDirectionChanged(position)
  // })
  // controlPadEl.addEventListener('mouseleave', (event) => {
  //   padController.padDirectionChanged(new THREE.Vector3())
  // })
  const onTouchEvent = (event) => {
    const rect = controlPadEl.getBoundingClientRect()
    const touchX = event.targetTouches[0].clientX - rect.x
    const touchY = event.targetTouches[0].clientY - rect.y
    const x = (touchX - rect.width / 2) / (rect.width/2)
    const y = (touchY - rect.height / 2) / (rect.height/2)
    const position = new THREE.Vector3(x * 100, 0, y * 100)
    padController.padDirectionChanged(position)
  }
  controlPadEl.addEventListener('touchstart', onTouchEvent)
  controlPadEl.addEventListener('touchmove', onTouchEvent)
  controlPadEl.addEventListener('touchend', (event) => {
    padController.padDirectionChanged(new THREE.Vector3())
  })
  controlPadEl.addEventListener('touchcancel', (event) => {
    padController.padDirectionChanged(new THREE.Vector3())
  })
  // stage.add(padController)
  
  
  let dragLock = false
  let dragStart = false
  let dragStartPos = null
  let dragDelta = new THREE.Vector3()
  window.addEventListener('mousemove', (event) => {
    // Show mouse pointer
    mousePointer.setScreenCoords(event.clientX, event.clientY)
    intersectionFinder.setScreenCoords(event.clientX, event.clientY)
    
    // If mouse has moved a certain distance since clicking, then turn into a "drag"
    if (dragStart && !dragLock) {
      const intersection = intersectionFinder.getOneIntersection(stage.ground)
      if (intersection) {
        const mousePos = intersection.point
        if (mousePos.distanceTo(dragStartPos) > 10) {
          dragLock = true
        }
      }
    }
    
    if (dragLock) {
      const intersection = intersectionFinder.getOneIntersection(stage.ground)
      if (intersection && stage.selection.hasAtLeast(1)) {
        stage.selection.forEach((entity) => {
          dragDelta.copy(intersection.point)
          dragDelta.sub(dragStartPos)
          const pos = stage.selection.savedPositionFor('drag', entity)
          dragDelta.add(pos)
          
          if (stage.gridSnap) {
            const size = stage.gridSnap
            dragDelta.x = Math.floor(dragDelta.x / size) * size
            dragDelta.z = Math.floor(dragDelta.z / size) * size
          }
          
          // entity.disableFollowsTarget()
          entity.object.position.copy(dragDelta)
          entity.goals.position.update({
            x: dragDelta.x,
            y: dragDelta.y,
            z: dragDelta.z,
          })
          // entity.state.position.now.copy(dragDelta)
          // entity.state.position.target.copy(dragDelta)
          // network.setEntity(entity)
        })
      }
    }
  })
  
  window.addEventListener('mousedown', (event) => {
    if (event.target.id !== 'game' && event.target.id !== 'glcanvas') { return }
    // must be left-click
    if (event.button !== 0) { return }
    
    intersectionFinder.setScreenCoords(event.clientX, event.clientY)
    
    // This might be the beginning of a drag & drop sequence, so prep for that possibility
    if (stage.selection.hasAtLeast(2)) {
      const intersection = intersectionFinder.getOneIntersection(stage.ground)
      if (intersection) {
        dragStart = true
        dragStartPos = intersection.point
        stage.selection.savePositions('drag')
      }
    } else if (!event.shiftKey && !event.ctrlKey) {
        let intersections = intersectionFinder.getAllIntersectionsOnStage()
        if (!stage.editorMode) {
          intersections = intersections.filter((isect) => !isect.entity.isUiLocked())
        }
        const groundIntersection = intersectionFinder.getOneIntersection(stage.ground)
        // Don't allow selecting locked objects
        if (intersections.length > 0 && groundIntersection) {
          const isect = intersections[0]
          stage.selection.select([isect.entity], '=')
        
          dragStart = true
          dragStartPos = groundIntersection.point
          stage.selection.savePositions('drag')
        }
    }
    
    // TODO: Why can't we detect a click on the player?
    //
    // const isect3 = mousePointer.getIntersects(player.object)
    // console.log(isect3)
    // if (isect3.length > 0) {
    //   console.log('clicked player')
    // }
  })
  
  window.addEventListener('mouseup', (event) => {
    if (event.target.id !== 'game' && event.target.id !== 'glcanvas') { return }
    
    if (dragLock) {
      if (stage.selection.hasAtLeast(1)) {
        // If we disabled FollowsTarget during drag/drop, re-enable it
        // stage.selection.forEach((entity) => {
          // entity.enableFollowsTarget()
        // })
      }
    } else {
    
      // Did player click on something with an onClick callback?
      let clickedEntities = intersectionFinder.getAllIntersectionsOnStage().map((isect) => isect.entity)
      clickedEntities.forEach((entity) => {
        if (entity.onClick) {
          entity.onClick()
        }
      })
      
      // Click to select things on the stage
      recordCoords({ x: event.clientX, y: event.clientY }, (isNearPrevious) => {
        /**
         * Convert 'shift' and 'ctrl' clicks into set operations:
         *   - shift+click: set addition
         *   - ctrl+click: set subtraction
         *   - click: replace set
         */
        const operation = event.shiftKey ? '+' : (event.ctrlKey ? '-' : '=')
        // Select whatever the most recent 'mousemove' event got us closest to
        let selected = intersectionFinder.getAllIntersectionsOnStage().map((isect) => isect.entity)
        if (!stage.editorMode) {
          // Don't allow selecting locked objects
          selected = selected.filter((entity) => !entity.isUiLocked())
        }
        
        // When clicking near the same spot as last time without shift or ctrl keys,
        // cycle through the various intersecting objects under the mouse pointer
        if (operation === '=' && isNearPrevious) {
          previousMousedownIndex++
        } else {
          previousMousedownIndex = 0
        }
        if (operation === '=' && selected.length > 0) {
          selected = [selected[previousMousedownIndex % selected.length]]
        }
        
        stage.selection.select(selected, operation)
      })
    }
    dragStart = false
    dragLock = false
  })

  
  const runCommand = (text, targetObjects = null) => {
    try {
      const command = parseCommand(text)
      const objects = targetObjects || stage.selection.getAllEntities()
      const position = player.object.position
      if (command) {
        command({ network, stage, player, objects, position })
      } else {
        showToast('Should there be a command after the `/`?')
      }
    } catch (err) {
      console.trace(err)
      showToast(err.message)
    }
  }


  // At various times, we need to set focus on the game so that character directional controls work
  const focusOnGame = () => { stage.renderer.domElement.focus() }
  const focusOnInput = () => { document.getElementById('input').focus() }
  // Do it once when the page finishes loading, too:
  focusOnGame()

  document.body.addEventListener('mousedown', (event) => {
    if (event.target.id === 'game') {
      focusOnGame()
      event.preventDefault()
    }
  }, true)
  
  const invite = document.getElementById('invite')
  if (invite) {
    const invitation = document.getElementById('invitation')
    const invitationInput = document.getElementById('invitation-input')
    invite.addEventListener('mousedown', (event) => {
      if (invitation.classList.contains('show')) {
        invitation.classList.remove('show')
      } else {
        const invitationToken = uuidv4().slice(0,7)
        network.invitations.set(invitationToken, 1)
        invitationInput.value = `${window.location.origin}/?t=${invitationToken}`
        invitation.classList.add('show')
      }
      event.preventDefault()
    })
  }
  

  
  
  // Import/Export HTML Events
  const importExport = document.getElementById('import-export')
  const importButton = document.getElementById('import-button')
  const importExportCloseButton = document.getElementById('import-export-close-button')
  importButton.addEventListener('click', (event) => {
    const text = document.getElementById('import-export-data')
    const data = JSON.parse(text.value)
    const objectCount = relmImport(network, data)
    importExport.classList.add('hide')
    showToast(`Imported ${objectCount} objects into this relm.`)
  })
  importExportCloseButton.addEventListener('mouseup', (event) => {
    importExport.classList.add('hide')
    event.stopPropagation()
    focusOnGame()
  }, true)
  

  // Avatar Selection HTML Events
  const avatarSelection = document.getElementById('avatars')
  const avatarSelectionClose = document.getElementById('avatars-close')
  const avatarSelectionButton = document.getElementById('my-character')
  const avatarButtons = document.getElementsByClassName('avatar-button')
  Array.from(avatarButtons).forEach(button => {
    button.addEventListener('click', (event) => {
      const gender = button.dataset.gender
      const index = parseInt(button.dataset.index, 10)
      const avatarOptions = avatarOptionsOfGender(gender)
      avatarSelection.classList.add('hide')
      player.goals.animationMesh.update({ v: avatarOptions[index].avatarId })
      focusOnGame()
    })
  })
  avatarSelectionClose.addEventListener('click', (event) => {
    avatarSelection.classList.add('hide')
    focusOnGame()
  })
  avatarSelectionButton.addEventListener('mousedown', (event) => {
    avatarSelection.classList.remove('hide')
    event.preventDefault()
  })
  

  // Allow TAB and ESC keys to switch from text input to game view
  const inputEl = document.getElementById('input')
  inputEl.addEventListener('keydown', e => {
    const text = e.target.value.trim()
    if (e.keyCode === KEY_TAB) {
      // Don't allow TAB to propagate up and cause focus to be switched us back to input
      e.preventDefault()
      e.stopPropagation()
      focusOnGame()
    } else if (e.keyCode === KEY_ESCAPE) {
      player.setThought(null)
      focusOnGame()
    } else if (e.keyCode === KEY_RETURN) {
      if (text.substring(0,1) === '/') {
        runCommand(text.substring(1))
        e.target.value = ''
        focusOnGame()
      } else if (text !== '') {
        // Before focusing back on the game, make a thought bubble, and clear the text
        player.setThought(text)
        e.target.value = ''
      } else {
        focusOnGame()
      }
    } else if (
      (e.keyCode === KEY_UP || e.keyCode === KEY_DOWN) ||
      ((e.keyCode === KEY_LEFT || e.keyCode === KEY_RIGHT) && text === "")
    ) {
      // If the player has typed nothing, but uses the arrow keys, go back to the game
      focusOnGame()
      kbController.keyPressed(e.keyCode)
    }
  })

  const pressTabHelp = document.getElementById('press-tab-help')
  pressTabHelp.addEventListener('mousedown', (event) => {
    pressTabHelp.classList.add('hide')
    // Don't move focus away from webgl canvas
    event.preventDefault()
  })
  
  document.addEventListener('contextmenu', (event) => {
    let intersections = intersectionFinder.getAllIntersectionsOnStage()
    if (intersections.length > 0) {
      const clickedEntity = intersections[0].entity
      showInfoAboutObject(clickedEntity)
    }
    event.preventDefault()
  })
  
  const kbController = stage.create('keycon', { target: player })
  document.addEventListener('keydown', e => {
    
    if (e.target === stage.renderer.domElement) {
      if (e.keyCode === KEY_BACK_SPACE || e.keyCode === KEY_DELETE) {
        runCommand('object delete')
        // Don't accidentally allow backspace to trigger browser back
        e.preventDefault()
      }
      // This makes it so that 'tab' is controlled by us, rather than
      // the default HTML tabIndex system
      else if (e.keyCode === KEY_TAB) {
        e.preventDefault()
      }
      else if (e.keyCode === KEY_ESCAPE && stage.selection.hasAtLeast(1)) {
        runCommand('select none')
      }
      // Use `shift+\` as shortcut for toggling lock state of objects
      else if (e.keyCode === KEY_BACK_SLASH && e.shiftKey) {
        runCommand('object locktoggle')
      }
      // Support `ctrl+A` and `cmd+A` for selecting all
      else if (e.keyCode === KEY_A && (e.ctrlKey || e.metaKey)) {
        runCommand('select all')
        e.preventDefault()
      }
      // Make it easier to type '/object` and all the other commands
      else if (e.keyCode === KEY_SLASH /* Forward Slash */) {
        e.preventDefault()
        focusOnInput()
        document.getElementById('input').value = '/' 
      }
      else if (!e.repeat) {
        kbController.keyPressed(e.keyCode, { shift: e.shiftKey, ctrl: e.ctrlKey, meta: e.metaKey })
      }
    }
  })
  document.addEventListener('keyup', e => {
    if (e.target === stage.renderer.domElement) {
      kbController.keyReleased(e.keyCode, { shift: e.shiftKey, ctrl: e.ctrlKey, meta: e.metaKey })
      // This makes it so that 'tab' is controlled by us, rather than
      // the default HTML tabIndex system
      if (e.keyCode === 9) {
        e.preventDefault()
      } else if (e.keyCode === 191 /* Forward Slash */) {
        e.preventDefault()
      }
    }
  })
  kbController.on('done', focusOnInput)
  kbController.on('switch', () => { focusOnInput(); pressTabHelp.classList.add('hide') })
  kbController.on('close', () => { player.setThought(null) })
  kbController.on('unknown', (keyCode, opts) => {
    // If the player presses a letter of the alphabet on the keyboard, give them a hint
    if (keyCode >= 65 && keyCode <= 90 && !opts.ctrl && !opts.meta) {
      pressTabHelp.classList.remove('hide')
      pressTabHelp.classList.add('show')
      setTimeout(() => {
        pressTabHelp.classList.add('hide')
      }, 7500)
    }
  })
  kbController.on('doublePressed', (action) => {
    player.setSpeed(500)
    // player.setAnimationSpeed(3)
    player.goals.animationSpeed.update({ v: 3.0 })
    // network.setEntity(player)
  })
  kbController.on('released', (action) => {
    player.setSpeed(250)
    // player.setAnimationSpeed(1.5)
    player.goals.animationSpeed.update({ v: 1.5 })
    // network.setEntity(player)
  })

  const camController = stage.create('camcon', {
    targetNear: playersCentroid,
    targetFar: player.object.position
  })
  

  initializeAVChat(player.uuid, 'relm-' + cfg.ROOM, {
    onMuteChanged: (track, playerId) => {
      const muted = track.isMuted()
      const otherPlayer = stage.entities[playerId]
      // console.log('onMuteChanged', playerId, muted, otherPlayer)
      if (muted) {
        otherPlayer.videoBubble.object.enterMutedState()
      } else {
        otherPlayer.videoBubble.object.enterUnmutedState()
      }
    },
    createVideoElement: (entityId) => {
      // console.log('playerId', playerId)
      // console.log('createVideoElement', entityId)
      const entity = stage.entities[entityId]
      if (entity) {
        if (entity.videoBubble) {
          return entity.videoBubble.object.createDomElement()
        } else {
          console.warn("Can't create video element for entity that has no VideoBubble", entityId)
        }
      } else {
        console.warn("Can't create video element for missing entity", entityId)
      }
    }
  })
}

start()