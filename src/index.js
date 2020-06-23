// Import external libraries and helpers
import { guestNameFromPlayerId, avatarOptionFromPlayerId, avatarOptionsOfGender } from './avatars.js'
import { Security } from './security.js'
import { initializeAVChat, muteAudio, unmuteAudio, switchVideo } from './avchat2.js'
import { normalizeWheel } from './lib/normalizeWheel.js'
import { showInfoAboutObject } from './show_info_about_object.js'
import "toastify-js/src/toastify.css"


// The `Typed` stamp allows Entities and SharedEntities to be registered
import { Typed } from './typed.js'

// Register each type of Entity
import { Background } from './background.js'
import { KeyboardController } from './keyboard_controller.js'
import { CameraController } from './camera_controller.js'
import { PadController } from './pad_controller.js'

// Register each type of SharedEntity
import { Player } from './player.js'
import { MousePointer } from './mouse_pointer.js'
import { Decoration } from './decoration.js'
import { Thing3D } from './thing3d.js'
import { Teleportal } from './teleportal.js'
import { Ground } from './ground.js'
import { DiamondIndicator } from './diamond_indicator.js'
import { Skybox } from './skybox.js'
import { TriggerPlate } from './trigger_plate.js'


// Misc. other imports
import { localstoreRestore } from './localstore_gets_state.js'
import { uuidv4, getOrCreateLocalId, randomPastelColor, domReady } from './util.js'
import { config, stage } from './config.js'
import { network } from './network.js'
import { GoalGroup } from './goals/goal_group.js'
import { addManifestTo } from './manifest_loaders.js'
import { runCommand, importExportState } from './commands.js'
import { recordCoords } from './record_coords.js'

import { pressTabHelpState, exportImportState } from './svelte/stores.js'

import {
  KEY_UP, KEY_DOWN, KEY_LEFT, KEY_RIGHT,
  KEY_W, KEY_A, KEY_S, KEY_D, KEY_Q, KEY_E,
  KEY_SPACE, KEY_TAB, KEY_RETURN, KEY_ESCAPE,
  KEY_BACK_SLASH, KEY_SLASH,
  KEY_BACK_SPACE, KEY_DELETE
} from 'keycode-js'

import App from './svelte/App.svelte'

const cfg = config(window.location)
let previousMousedownIndex = 0

// Enable three.js cache for textures and meshes
THREE.Cache.enabled = true

const security = Security()

let player
let mousePointer


const start = async () => {
  const playerId = await security.getOrCreateId()
  const mouseId = getOrCreateLocalId('mouseId')
  
  // Initialize network first so that entities can send their initial state
  // even before we've connected to server (or eventually, peers)
  network.on('add', async (goalGroupMap, isTransient) => {
    // console.log('network.on add', goalGroupMap.toJSON())
    
    // Get the stamp that has registered itself as a named, matching type
    const typeName = goalGroupMap.get('@type')
    const Type = Typed.getType(typeName)
    
    const goals = GoalGroup({ goalDefinitions: Type.goalDefinitions, goalGroupMap })
    
    const entity = Type({ goals })
    
    if (isTransient) {
      network.transients.installInterceptors(entity)
    }
    
    stage.add(entity)
  })
  
  network.on('remove', (uuid) => {
    const entity = stage.entities[uuid]
    if (entity) {
      stage.remove(uuid, entity)
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
    room: cfg.ROOM,
    serverUrl: cfg.SERVER_YJS_URL,
    connectTransients: !cfg.SINGLE_PLAYER_MODE,
    onTransientsSynced: () => {
      const color = randomPastelColor()      
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
            color: color,
          },
        })
      }
      
      if (!network.transients.objects.has(mouseId)) {
        network.transients.create({
          type: 'mouse',
          uuid: mouseId,
          goals: {
            color: color,
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

  window.addEventListener('resize', _ => stage.windowResized(window.innerWidth, window.innerHeight))
  stage.start()


  await domReady()
  
  let playersCentroid = new THREE.Vector3()
  let occasionalUpdate = 0
  const sortByZ = (a, b) => (a.object.position.z - b.object.position.z)
  
  // The player!
  
  
  player = stage.player = await stage.awaitEntity({ uuid: playerId })
  player.autonomous = false
  const vidobj = player.videoBubble.object
  vidobj.createDomElement()
  vidobj.on('mute', muteAudio)
  vidobj.on('unmute', unmuteAudio)
  vidobj.setOnClick(() => {
    const isVideo = switchVideo()
    vidobj.setMirrored(isVideo)
    vidobj.setCircular(isVideo)
  })
  player.labelObj.setOnLabelChanged((text) => {
    player.goals.label.update({ text })
  })
  player.on('thoughtBubbleAction', (thought) => {
    const pos = player.object.position
    network.permanents.create({
      type: 'diamond',
      goals: {
        diamond: { open: true, text: thought },
        position: {
          x: pos.x + 60,
          y: pos.y + 80,
          z: pos.z,
        }
      }
    })
    player.clearThought()
  })
  
  const playerJSON = localstoreRestore(playerId)
  if (playerJSON) {
    try {
      network.transients.fromJSON(playerJSON, true)
    } catch (e) {
      console.warn("Unable to restore player json", e)
    }
  } else {
    console.log('New Player!', playerId)
  }
  
  mousePointer = stage.mouse = await stage.awaitEntity({ uuid: mouseId })
  {
    const c = player.goals.color
    mousePointer.goals.color.update({ r: c.get('r'), g: c.get('g'), b: c.get('b') })
  }
  
  // Create the stable but invisible "ground" layer that acts as a plane
  // that can always be clicked on by the mouse.
  stage.background = stage.create('background')
  
  network.on('transient-receive', (uuid, state) => {
    if (uuid !== mouseId && uuid !== playerId) {
      const entity = stage.entities[uuid]
      if (entity) {
        for (const [goalAbbrev, goalState] of Object.entries(state)) {
          const goal = entity.goals.get(goalAbbrev)
          for (const [k, v] of Object.entries(goalState)) {
            if (goal._map.get(k) !== v) {
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
  


  
  
  let dragLock = false
  let dragStart = false
  let dragStartPos = null
  let dragDelta = new THREE.Vector3()
  window.addEventListener('mousemove', (event) => {
    // Show mouse pointer
    mousePointer.setScreenCoords(event.clientX, event.clientY)
    stage.intersectionFinder.setScreenCoords(event.clientX, event.clientY)
    
    // If mouse has moved a certain distance since clicking, then turn into a "drag"
    if (dragStart && !dragLock) {
      const intersection = stage.intersectionFinder.getOneIntersection(stage.background.object)
      if (intersection) {
        const mousePos = intersection.point
        if (mousePos.distanceTo(dragStartPos) > 10) {
          dragLock = true
        }
      }
    }
    
    if (dragLock) {
      const intersection = stage.intersectionFinder.getOneIntersection(stage.background.object)
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
    
    stage.intersectionFinder.setScreenCoords(event.clientX, event.clientY)
    
    // This might be the beginning of a drag & drop sequence, so prep for that possibility
    if (stage.selection.hasAtLeast(2)) {
      const intersection = stage.intersectionFinder.getOneIntersection(stage.background.object)
      if (intersection) {
        dragStart = true
        dragStartPos = intersection.point
        stage.selection.savePositions('drag')
      }
    } else if (!event.shiftKey && !event.ctrlKey) {
        let intersections = stage.intersectionFinder.getAllIntersectionsOnStage()
        if (!stage.editorMode) {
          intersections = intersections.filter((isect) => !isect.entity.isUiLocked())
        }
        const groundIntersection = stage.intersectionFinder.getOneIntersection(stage.background.object)
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
    // must be left-click
    if (event.button !== 0) { return }
    
    if (!dragLock) {
      // Did player click on something with an onClick callback?
      let clickedEntities = stage.intersectionFinder.getAllIntersectionsOnStage().map((isect) => isect.entity)
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
        let selected = stage.intersectionFinder.getAllIntersectionsOnStage().map((isect) => isect.entity)
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
        console.log(stage.selection)
      })
    }
    dragStart = false
    dragLock = false
  })

  
  const runCommandSimple = (text) => runCommand(text, { network, stage, cfg })


  // Do it once when the page finishes loading, too:
  stage.focusOnGame()

  document.body.addEventListener('mousedown', (event) => {
    if (event.target.id === 'game') {
      stage.focusOnGame()
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
  
  document.addEventListener('contextmenu', (event) => {
    let intersections = stage.intersectionFinder.getAllIntersectionsOnStage()
    if (intersections.length > 0) {
      const clickedEntity = intersections[0].entity
      
      if (stage.selection.has(clickedEntity)) {
        // Don't modify the selection, keep it as-is
        console.log("already has")
      } else {
        // If player right-clicked on something that wasn't selected, select it
        stage.selection.select([clickedEntity], '=')
      }
      
      // Provide a slight delay so player can visually confirm that they
      // selected the thing they thought they did
      setTimeout(() => {
        exportImportState.update(() => true)
      }, 300)
    }
    event.preventDefault()
  })
  
  const kbController = stage.create('keycon', { target: player })
  window.addEventListener('keydown', e => {
    
    if (e.target === stage.renderer.domElement) {
      if (e.keyCode === KEY_BACK_SPACE || e.keyCode === KEY_DELETE) {
        runCommandSimple('object delete')
        // Don't accidentally allow backspace to trigger browser back
        e.preventDefault()
      }
      // This makes it so that 'tab' is controlled by us, rather than
      // the default HTML tabIndex system
      else if (e.keyCode === KEY_TAB) {
        e.preventDefault()
      }
      else if (e.keyCode === KEY_ESCAPE && stage.selection.hasAtLeast(1)) {
        runCommandSimple('select none')
      }
      // Support `ctrl+A` and `cmd+A` for selecting all
      else if (e.keyCode === KEY_A && (e.ctrlKey || e.metaKey)) {
        runCommandSimple('select all')
        e.preventDefault()
      }
      // Make it easier to type '/object` and all the other commands
      else if (e.keyCode === KEY_SLASH /* Forward Slash */) {
        e.preventDefault()
        stage.focusOnInput()
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
  kbController.on('done', stage.focusOnInput)
  kbController.on('switch', () => { stage.focusOnInput(); pressTabHelpState.update(() => false) })
  kbController.on('close', () => { player.setThought(null) })
  kbController.on('unknown', (keyCode, opts) => {
    // If the player presses a letter of the alphabet on the keyboard, give them a hint
    if (keyCode >= 65 && keyCode <= 90 && !opts.ctrl && !opts.meta) {
      pressTabHelpState.update(() => true)
      setTimeout(() => {
        pressTabHelpState.update(() => false)
      }, 7500)
    }
  })
  kbController.on('doublePressed', (action) => {
    player.setSpeed(500)
    player.goals.animationSpeed.update({ v: 3.0 })
  })
  kbController.on('released', (action) => {
    player.setSpeed(250)
    player.goals.animationSpeed.update({ v: 1.5 })
  })

  const camController = stage.create('camcon', {
    targetNear: playersCentroid,
    targetFar: player.object.position
  })
  

  initializeAVChat({
    playerId: player.uuid,
    room: 'relm-' + cfg.ENV + '-' + cfg.ROOM + (cfg.SINGLE_PLAYER_MODE ? `-${playerId}` : ''),
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

  console.log('start() complete')
}

const app = new App({
  target: document.body,
  props: {
    start,
    stage,
    network,
    importExportState,
  }
})

export default app