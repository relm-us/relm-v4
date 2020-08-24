// Import external libraries and helpers
import { guestNameFromPlayerId, avatarOptionFromPlayerId } from './avatars.js'
import { Security } from './security.js'
import { initializeAVChat, muteAudio, unmuteAudio } from './audiovideo/chat.js'
import { normalizeWheel } from './lib/normalizeWheel.js'
import 'toastify-js/src/toastify.css'

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
import {
  uuidv4,
  getOrCreateLocalId,
  randomPastelColor,
  domReady,
  sortByZ,
  delta,
  distance,
} from './util.js'
import { config } from './config.js'
import { network } from './network.js'
import { stage } from './stage.js'
import { GoalGroup } from './goals/goal_group.js'
import { addManifestTo } from './manifest_loaders.js'
import { runCommand } from './commands.js'
import { recordCoords } from './record_coords.js'
import { getRef } from './dom_reference.js'

import State from './svelte/stores.js'

import {
  KEY_A,
  KEY_C,
  KEY_V,
  KEY_TAB,
  KEY_ESCAPE,
  KEY_SLASH,
  KEY_BACK_SPACE,
  KEY_DELETE,
  KEY_M,
} from 'keycode-js'

import App from './svelte/App.svelte'
import { showToast } from './lib/Toast.js'

let previousMousedownIndex = 0

// Enable three.js cache for textures and meshes
THREE.Cache.enabled = true

const security = Security()

let occasionalUpdate = 0
let mouseWheelTarget = new THREE.Vector3()
let cameraPlayerOffset = new THREE.Vector3()
let mouseWheelScale = 0.0
const mouseWheelScaleMax = 100.0

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

    const goals = GoalGroup({
      goalDefinitions: Type.goalDefinitions,
      goalGroupMap,
    })

    const entity = Type({ goals })

    if (isTransient) {
      network.transients.installInterceptors(entity)
      if (entity.uuid !== playerId && entity.uuid !== mouseId) {
        entity.hide()
      }
    }

    stage.add(entity)

    // Handle local callbacks after object creation, e.g. to highlight newly pasted entities
    network.afterAdd(entity)
  })

  network.on('remove', (uuid) => {
    const entity = stage.entities[uuid]
    if (entity) {
      stage.remove(uuid, entity)
    }
  })

  if (!window.crypto.subtle) {
    showToast(
      `Unable to authenticate: please use a browser that supports signing with public keys, such as Firefox or Chrome`
    )
    return
  }

  const pubkey = await security.exportPublicKey()
  const signature = await security.sign(playerId)
  const params = {
    id: playerId,
    s: signature,
    x: pubkey.x,
    y: pubkey.y,
  }
  const url = new URL(window.location.href)
  const token = url.searchParams.get('t')
  if (token) {
    params.t = token
  }

  network
    .connect({
      params,
      room: config.ROOM,
      serverUrl: config.SERVER_URL,
      serverYjsUrl: config.SERVER_YJS_URL,
      connectTransients: !config.SINGLE_PLAYER_MODE,
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
            },
          })
        }
      },
    })
    .catch((err) => {
      console.log(err, err.response)
      if (err.response && err.response.data) {
        showToast(err.response.data.reason)
      } else {
        showToast(`There was a problem loading this relm`)
      }
    })

  // We first add all resources from the manifest so that the progress
  // bar can add up all the resource's sizes. The actual loading doesn't
  // happen until we `enqueue` and `load`.
  addManifestTo(resources)

  // Load bare essentials
  resources.enqueue(['people', 'interact'])
  await resources.load()

  window.addEventListener('resize', (_) =>
    stage.windowResized(window.innerWidth, window.innerHeight)
  )
  stage.start()

  await domReady()

  // The player!
  player = stage.player = await stage.awaitEntity({ uuid: playerId })

  // Allow local player to control self
  player.autonomous = false

  const vidobj = player.videoBubble.object
  vidobj.createDomElement()
  vidobj.on('mute', muteAudio)
  vidobj.on('unmute', unmuteAudio)

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
        },
      },
    })
    player.clearThought()
  })

  const playerJSON = localstoreRestore(playerId)
  if (playerJSON) {
    // Ignore stored video state
    delete playerJSON['vid']
    // Ignore player position if LANDING_COORDS given
    if (config.LANDING_COORDS) {
      console.log('setting landing coords', config.LANDING_COORDS)
      playerJSON.p = Object.assign({ '@due': 0 }, config.LANDING_COORDS)
    }
    try {
      network.transients.fromJSON(playerJSON, true)
    } catch (e) {
      console.warn('Unable to restore player json', e)
    }
  } else {
    console.log('New Player!', playerId)
    if (config.LANDING_COORDS) {
      console.log('setting landing coords (new player)', config.LANDING_COORDS)
      player.goals.position.update(config.LANDING_COORDS, 0)
    }
  }

  // The mouse pointer!
  mousePointer = stage.mouse = await stage.awaitEntity({ uuid: mouseId })
  {
    const c = player.goals.color
    mousePointer.goals.color.update({
      r: c.get('r'),
      g: c.get('g'),
      b: c.get('b'),
    })
  }

  // Create the stable but invisible "ground" layer that acts as a plane
  // that can always be clicked on by the mouse.
  stage.background = stage.create('background')

  network.on('transient-receive', (uuid, state) => {
    if (uuid !== mouseId && uuid !== playerId) {
      const entity = stage.entities[uuid]
      entity.show()
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
  // 1. Refresh videoBubble diameters
  // 2. Calculate audio volume based on distance
  // 3. Sort players by Z order
  stage.addUpdateFunction((delta) => {
    occasionalUpdate++

    const dist = stage.camera.position.distanceTo(player.object.position)
    // TODO: How do we arrive at this magic number?
    const playerHeight = 800000 / dist

    // TODO: make this filter for 'HasVideoBubble' instead of just looking for players
    stage.forEachEntityOfType('player', (anyPlayer, i) => {
      // Set videoBubble diameter, which can change due to
      // (a) new players entering the scene, or
      // (b) zoom level changing
      anyPlayer.videoBubble.object.setDiameter(playerHeight)
      // (Note: due to bug in ThreeJS, we incorrectly exclude players
      //  from being "on stage" when the bottom of their avatar
      //  goes off screen, so we process diameters here.)

      if (occasionalUpdate % 10 === 0) {
        const audio = anyPlayer.videoBubble.object.audio
        if (audio) {
          const dist = player.object.position.distanceTo(
            anyPlayer.object.position
          )
          // if dist = 0: (500 + 1000) / 500 = 3.0     => clamped to 1.0
          // if dist = 1000: (500 - 0) / 500 = 1.0     => clamped to 1.0
          // if dist = 1200: (500 - 200) / 500 = 0.6   => clamped to 0.6
          // if dist = 2000: (500 - 1000) / 500 = -0.5 => clamped to 0.15
          const volume = (500 - (dist - 1000)) / 500
          audio.volume = THREE.MathUtils.clamp(volume, 0.15, 1.0)
        }
      }
    })
    stage.forEachEntityOnStageOfType(
      'player',
      (anyPlayer, i) => {
        // Sort the visible players by Z order
        const el = anyPlayer.videoBubble.object.domElement
        if (el) {
          el.style.zIndex = i + 1
        }
      },
      sortByZ
    )

    network.transients.sendState([playerId, mouseId])
  })

  // Mouse wheel zooms in and out
  document.addEventListener('wheel', function (event) {
    if (event.target.id === 'game') {
      let pixelY = normalizeWheel(event)

      mouseWheelScale = THREE.MathUtils.clamp(
        mouseWheelScale - pixelY,
        0,
        mouseWheelScaleMax
      )
      if (
        zoomLockPos === null &&
        mouseWheelScale < mouseWheelScaleMax &&
        pixelY < 0 // Only re-position when zooming "IN"
      ) {
        zoomLockPos = {
          x: mousePointer.clientX,
          y: mousePointer.clientY,
        }
        mouseWheelTarget.copy(mousePointer.object.position)
        cameraPlayerOffset.copy(mouseWheelTarget)
        cameraPlayerOffset.sub(player.object.position)

        // Move the camera to a point hovering "above" the target
        cameraPlayerOffset.y += 1500
        cameraPlayerOffset.z += 1875
      }
    }
  })

  // The stage is special in that it creates a domElement that must be added to our page
  document.getElementById('game').appendChild(stage.renderer.domElement)

  let htmlDragTarget = null
  let htmlDragLock = false
  let htmlDragStartPos = null

  let dragStart = false
  let dragLock = false
  let dragStartPos = null
  let dragDelta = new THREE.Vector3()

  let zoomLockPos = null

  window.addEventListener('mousemove', (event) => {
    // Show mouse pointer
    mousePointer.setScreenCoords(event.clientX, event.clientY)
    stage.intersectionFinder.setScreenCoords(event.clientX, event.clientY)

    const pos = { x: event.clientX, y: event.clientY }

    if (htmlDragTarget) {
      if (htmlDragLock) {
        // no drag animation for now
      } else {
        if (distance(pos, htmlDragStartPos) > 10) {
          htmlDragLock = true
          htmlDragStartPos = pos
          htmlDragTarget.classList.add('drag-lock')
        }
      }
      return
    }

    // If mouse has moved a certain distance since zooming, then reset zoom lock
    if (zoomLockPos && distance(pos, zoomLockPos) > 10) {
      zoomLockPos = null
    }

    // If mouse has moved a certain distance since clicking, then turn into a "drag"
    if (dragStart && !dragLock) {
      const intersection = stage.intersectionFinder.getOneIntersection(
        stage.background.object
      )
      if (intersection) {
        const mousePos = intersection.point
        if (mousePos.distanceTo(dragStartPos) > 10) {
          dragLock = true
        }
      }
    }

    if (dragLock) {
      const intersection = stage.intersectionFinder.getOneIntersection(
        stage.background.object
      )
      if (intersection && stage.selection.count() >= 1) {
        stage.selection.forEach((entity) => {
          dragDelta.copy(intersection.point)
          dragDelta.sub(dragStartPos)
          const pos = stage.selection.savedPositionFor('drag', entity)
          dragDelta.add(pos)

          if (stage.gridSnap) {
            const size = stage.gridSnap
            dragDelta.x =
              Math.floor(dragDelta.x / size) * size + stage.gridOffsetX
            dragDelta.z =
              Math.floor(dragDelta.z / size) * size + stage.gridOffsetZ
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
    if (event.target.id !== 'game' && event.target.id !== 'glcanvas') {
      return
    }
    // must be left-click
    if (event.button !== 0) {
      return
    }

    // Check for pointer-events:none HTML that needs synthetic click
    for (const clickable of document.getElementsByClassName('clickable')) {
      const bounds = clickable.getBoundingClientRect()
      if (
        event.clientX >= bounds.left &&
        event.clientX <= bounds.right &&
        event.clientY >= bounds.top &&
        event.clientY <= bounds.bottom
      ) {
        clickable.focus()
      }
    }

    for (const el of document.querySelectorAll('[data-draggable]')) {
      const draggable = getRef(el, 'draggable')
      const pos = { x: event.clientX, y: event.clientY }
      if (draggable.pointerWithinBounds && draggable.pointerWithinBounds(pos)) {
        htmlDragTarget = el
        htmlDragStartPos = pos
        return
      }
    }

    stage.intersectionFinder.setScreenCoords(event.clientX, event.clientY)

    // This might be the beginning of a drag & drop sequence, so prep for that possibility
    if (stage.selection.count() >= 1) {
      const intersection = stage.intersectionFinder.getOneIntersection(
        stage.background.object
      )
      if (intersection) {
        dragStart = true
        dragStartPos = intersection.point
        stage.selection.savePositions('drag')
      }
    } else if (!event.shiftKey && !event.metaKey && !event.ctrlKey) {
      let intersections = stage.intersectionFinder.getAllIntersectionsOnStage()
      if (!stage.editorMode) {
        intersections = intersections.filter(
          (isect) => !isect.entity.isUiLocked()
        )
      }
      const groundIntersection = stage.intersectionFinder.getOneIntersection(
        stage.background.object
      )
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
    if (event.target.id !== 'game' && event.target.id !== 'glcanvas') {
      return
    }
    // must be left-click
    if (event.button !== 0) {
      return
    }

    if (htmlDragLock) {
      if (htmlDragTarget) {
        htmlDragTarget.classList.remove('drag-lock')

        const ref = getRef(htmlDragTarget, 'draggable')
        const pos = { x: event.clientX, y: event.clientY }
        const d = delta(htmlDragStartPos, pos)

        if (ref.onDrag) {
          ref.onDrag(d)
        }
      }
    } else {
      for (const el of document.querySelectorAll('[data-draggable]')) {
        const ref = getRef(el, 'draggable')
        const pos = { x: event.clientX, y: event.clientY }
        if (
          ref.pointerWithinBounds &&
          ref.pointerWithinBounds(pos) &&
          ref.onClick
        ) {
          ref.onClick()
        }
      }
    }

    if (dragLock) {
      if (stage.selection.count() === 1) {
        stage.selection.clearSelection()
      }
    } else {
      // Did player click on something with an onClick callback?
      let clickedEntities = stage.intersectionFinder
        .getAllIntersectionsOnStage()
        .map((isect) => isect.entity)
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
        const operation = event.shiftKey
          ? '+'
          : event.ctrlKey || event.metaKey
          ? '-'
          : '='
        // Select whatever the most recent 'mousemove' event got us closest to
        let selected = stage.intersectionFinder
          .getAllIntersectionsOnStage()
          .map((isect) => isect.entity)
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
          const one = selected[previousMousedownIndex % selected.length]
          showToast(`Selected ${one.type} (${one.uuid})`)
          selected = [one]
        }

        stage.selection.select(selected, operation)
      })
    }

    htmlDragTarget = null
    htmlDragLock = false
    htmlDragStartPos = null

    dragStart = false
    dragLock = false
  })

  const runCommandSimple = (text) =>
    runCommand(text, { network, stage, config })

  // Do it once when the page finishes loading, too:
  stage.focusOnGame()

  document.body.addEventListener(
    'mousedown',
    (event) => {
      if (event.target.id === 'game') {
        stage.focusOnGame()
        event.preventDefault()
      }
    },
    true
  )

  const invite = document.getElementById('invite')
  if (invite) {
    const invitation = document.getElementById('invitation')
    const invitationInput = document.getElementById('invitation-input')
    invite.addEventListener('mousedown', (event) => {
      if (invitation.classList.contains('show')) {
        invitation.classList.remove('show')
      } else {
        const invitationToken = uuidv4().slice(0, 7)
        network.invitations.set(invitationToken, 1)
        invitationInput.value = `${window.location.origin}/?t=${invitationToken}`
        invitation.classList.add('show')
      }
      event.preventDefault()
    })
  }

  document.addEventListener('contextmenu', (event) => {
    event.preventDefault()

    if (!stage.editorMode) {
      return
    }
    let intersections = stage.intersectionFinder.getAllIntersectionsOnStage()
    if (intersections.length == 0) {
      stage.forEachEntityOfType('skybox', (entity) => {
        stage.selection.select([entity], '=')
      })
    } else {
      const clickedEntity = intersections[0].entity

      if (stage.selection.has(clickedEntity)) {
        // Don't modify the selection, keep it as-is
      } else {
        // If player right-clicked on something that wasn't selected, select it
        stage.selection.select([clickedEntity], '=')
      }
    }
    // Provide a slight delay so player can visually confirm that they
    // selected the thing they thought they did
    setTimeout(() => {
      State.editModalVisible.update(() => true)
    }, 300)
  })

  const kbController = (stage.kbController = stage.create('keycon', {
    target: player,
  }))
  window.addEventListener('keydown', (e) => {
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
      } else if (e.keyCode === KEY_ESCAPE && stage.selection.count() >= 1) {
        runCommandSimple('select none')
      }
      // Support `ctrl+A` and `cmd+A` for selecting all
      else if (e.keyCode === KEY_A && (e.ctrlKey || e.metaKey)) {
        runCommandSimple('select all')
        e.preventDefault()
      }
      // Support `ctrl+C` and `cmd+C` for copy
      else if (e.keyCode === KEY_C && (e.ctrlKey || e.metaKey)) {
        runCommandSimple('select copy')
        e.preventDefault()
      }
      // Support `ctrl+V` and `cmd+V` for copy
      else if (e.keyCode === KEY_V && (e.ctrlKey || e.metaKey)) {
        runCommand('select paste', {
          network,
          stage,
          config,
          position: mousePointer.object.position,
        })
      }
      // Make it easier to type '/object` and all the other commands
      else if (e.keyCode === KEY_SLASH /* Forward Slash */) {
        e.preventDefault()
        stage.focusOnInput()
        document.getElementById('input').value = '/'
      }
      // Mute/unmute
      else if (e.keyCode === KEY_M) {
        const env = { network, stage, config }
        if (stage.player.videoBubble.object.muted) {
          runCommand('unmute', env)
        } else {
          runCommand('mute', env)
        }
      }
      // Forward other keys to the keyboard controller
      else if (!e.repeat) {
        kbController.keyPressed(e.keyCode, {
          shift: e.shiftKey,
          ctrl: e.ctrlKey,
          meta: e.metaKey,
        })
      }
    }
  })
  document.addEventListener('keyup', (e) => {
    if (e.target === stage.renderer.domElement) {
      kbController.keyReleased(e.keyCode, {
        shift: e.shiftKey,
        ctrl: e.ctrlKey,
        meta: e.metaKey,
      })
      // This makes it so that 'tab' is controlled by us, rather than
      // the default HTML tabIndex system
      if (e.keyCode === KEY_TAB) {
        e.preventDefault()
      } else if (e.keyCode === KEY_SLASH /* Forward Slash */) {
        e.preventDefault()
      }
    }
  })
  kbController.on('done', stage.focusOnInput)
  kbController.on('switch', () => {
    stage.focusOnInput()
    State.pressTabHelpVisible.update(() => false)
  })
  kbController.on('close', () => {
    player.setThought(null)
  })
  kbController.on('unknown', (keyCode, opts) => {
    // If the player presses a letter of the alphabet on the keyboard, give them a hint
    if (keyCode >= 65 && keyCode <= 90 && !opts.ctrl && !opts.meta) {
      State.pressTabHelpVisible.update(() => true)
      setTimeout(() => {
        State.pressTabHelpVisible.update(() => false)
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

  // Initialize the single camera object
  stage.create('camcon', {
    target: player.object.position,
    offsetNear: cameraPlayerOffset,
    offsetFar: new THREE.Vector3().copy(config.CAMERA_FAR),
    getRatio: () => {
      return mouseWheelScale / mouseWheelScaleMax
    },
  })

  // Restore editorMode, if saved
  switch (localStorage.getItem('editorMode')) {
    case 'true':
      stage.enableEditorMode()
      break
    case 'false':
      stage.disableEditorMode()
      break
  }

  initializeAVChat({
    playerId: player.uuid,
    room:
      'relm-' +
      config.ENV +
      '-' +
      config.ROOM +
      (config.SINGLE_PLAYER_MODE ? `-${playerId}` : ''),
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
          console.warn(
            "Can't create video element for entity that has no VideoBubble",
            entityId
          )
        }
      } else {
        console.warn("Can't create video element for missing entity", entityId)
      }
    },
    createAudioElement: (entityId) => {
      const entity = stage.entities[entityId]
      if (entity) {
        if (entity.videoBubble) {
          return entity.videoBubble.object.createAudioElement()
        } else {
          console.warn(
            "Can't create audio element for entity that has no VideoBubble",
            entityId
          )
        }
      } else {
        console.warn("Can't create audio element for missing entity", entityId)
      }
    },
  })

  // console.log('start() complete')
}

const app = new App({
  target: document.body,
  props: {
    start,
    stage,
    network,
  },
})

export default app
