import stampit from 'stampit'

import Dropzone from 'dropzone'
import { DOMReady } from './domready.js'
import { addManifestTo } from './manifest_loaders.js'
import { guestNameFromPlayerId, avatarOptionFromPlayerId, avatarOptionsOfGender } from './avatars.js'
import { Security } from './security.js'
import { initializeAVChat, muteAudio, unmuteAudio } from './avchat.js'
import { normalizeWheel } from './lib/normalizeWheel.js'

import { Entity, stage, network } from './entity.js'
import { HasObject } from './has_object.js'
import { HasLabel } from './has_label.js'
import { FollowsTarget } from './follows_target.js'
import { KeyboardController } from './keyboard_controller.js'
import { CameraController } from './camera_controller.js'
import { HasAnimationMixer } from './has_animation_mixer.js'
import { WalksWhenMoving } from './walks_when_moving.js'
import { HasThoughtBubble } from './has_thought_bubble.js'
import { HasVideoBubble } from './has_video_bubble.js'
import { HasOpacity } from './has_opacity.js'
import { HasOffscreenIndicator } from './has_offscreen_indicator.js'
import { AwarenessGetsState, AwarenessSetsState } from './network_awareness.js'
import { LocalstoreGetsState, LocalstoreRestoreState } from './localstore_gets_state.js'
import { MousePointer, OtherMousePointer } from './mouse_pointer.js'
import { Decoration } from './decoration.js'
import { Teleportal } from './teleportal.js'
import { uuidv4 } from './util.js'
import config from './config.js'
import { PadController } from './pad_controller.js'
import { stateToObject } from './state_to_object.js'

const cfg = config(window.location)
const decorationLayerThickness = 0.01
const DECORATION_NORMAL_COLOR = new THREE.Color(0x000000)
const DECORATION_HOVER_COLOR = new THREE.Color(0x333300)
const DECORATION_SELECTED_COLOR = new THREE.Color(0x666600)
const DECORATION_NEAREST_MAX_RANGE = 400
let decorationLayer = 0
let nearestDecoration = null
let previousNearestDecoration = null
let selectedDecoration = null

// Don't look for 'dropzone' in HTML tags
Dropzone.autoDiscover = false

const security = Security()

const Player = stampit(
  Entity,
  HasObject,
  HasOpacity,
  HasLabel,
  HasVideoBubble,
  HasThoughtBubble,
  FollowsTarget,
  HasAnimationMixer,
  WalksWhenMoving,
  // This is how the player sends updates
  AwarenessGetsState,
  LocalstoreGetsState,
{
  name: 'Player',
})

const OtherPlayer = stampit(
  Entity,
  HasObject,
  HasOpacity,
  HasLabel,
  HasVideoBubble,
  HasThoughtBubble,
  FollowsTarget,
  HasAnimationMixer,
  WalksWhenMoving,
  HasOffscreenIndicator,
  // This is how OtherPlayers get updates
  AwarenessSetsState,
{
  name: 'OtherPlayer'
})

const start = async () => {
  // We first add all resources from the manifest so that the progress
  // bar can add up all the resource's sizes. The actual loading doesn't
  // happen until we `enqueue` and `load`.
  addManifestTo(resources)
  
  // Stage 1 Resource Load: Bare essentials
  resources.enqueue(['people', 'sparkle', 'marble'])
  await resources.load()

  stage.setGroundTexture(resources.get('marble'))
  window.addEventListener('resize', _ => stage.windowResized(window.innerWidth, window.innerHeight))
  stage.start()


  await DOMReady()
  
  stage.addUpdateFunction((delta) => {
    // TODO: make this filter for 'HasVideoBubble' instead of just looking for players
    const sortByZ = (a, b) => (a.object.position.z - b.object.position.z)
    stage.forEachEntityOfType('player', (player, i) => {
      const el = player.videoBubble.object.domElement
      if (el) { el.style.zIndex = i + 1 }
    }, sortByZ)
  })
    
  // Mouse wheel zooms in and out
  document.addEventListener('wheel', function(event) {
    if (event.target.id === 'game') {
      let pixelY = normalizeWheel(event.deltaY)
      stage.setFov(stage.fov + pixelY);
      stage.forEachEntityOfType('player', player => {
        player.videoBubble.object.setDiameter(stage.fov)
      })
    }
  })

  // The stage is special in that it creates a domElement that must be added to our page
  document.getElementById('game').appendChild(stage.renderer.domElement)
  
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
  dropzone.on('success', async (dz, response) => {
    // Close the upload box automatically
    previews.classList.remove('show')
    
    decorationLayer += decorationLayerThickness
    // Add the decoration to the network so everyone can see it
    const url = cfg.SERVER_UPLOAD_URL + '/' + response.file
    network.setState(null, {
      type: 'decoration',
      position: {
        x: player.state.position.now.x,
        y: player.state.position.now.y + decorationLayer, // a little above the ground
        z: player.state.position.now.z,
      },
      asset: {
        id: response.id,
        url: url,
      },
      imageScale: 1.0,
      orientation: 0
    })
  })
  dropzone.on('complete', (a) => {
    console.log('file upload complete', a)
    dropzone.removeAllFiles()
  })

  // The player!
  const playerId = await security.getOrCreateId()
  const player = window.player = Player({
    uuid: playerId,
    type: 'player',
    label: guestNameFromPlayerId(playerId),
    animationMeshName: avatarOptionFromPlayerId(playerId).avatarId,
    speed: 250,
    followTurning: true,
    animationSpeed: 1.5,
    labelOffset: { x: 0, y: 0, z: 60 },
    videoBubbleOffset: {x: 0, y: 0, z: -240 },
    animationResourceId: 'people',
    lsKey: 'player'
  })
  LocalstoreRestoreState('player', player)
  if (cfg.LANDING_COORDS) {
    player.state.position.target.copy(cfg.LANDING_COORDS)
  }
  // Warp the player to their 'saved' location, if any
  player.warpToPosition(player.state.position.target)
  // Restore to fully opaque, in case we were saved in a translucent state
  player.state.opacity.target = 1.0
  stage.add(player)
  
  player.videoBubble.object.on('mute', muteAudio)
  player.videoBubble.object.on('unmute', unmuteAudio)
  
  const padController = PadController({ type: 'pad', target: player })
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
  stage.add(padController)
  
  const mousePointer = window.mousePointer = MousePointer({
    type: 'mouse',
    awarenessUpdateFrequency: 2,
  })
  stage.add(mousePointer)
  
  let mousePos = new THREE.Vector3()
  window.addEventListener('mousemove', (event) => {
    mousePointer.setScreenCoords(event.clientX, event.clientY)
    mousePos.copy(player.object.position)
    mousePos.sub(mousePointer.object.position)
    
    if (mousePointer.intersects.length > 0) {
      nearestDecoration = mousePointer.intersects[0].entity
    } else {
      nearestDecoration = null
    }
    if (nearestDecoration) {
      if (nearestDecoration === selectedDecoration) {
        // do nothing
        if (previousNearestDecoration && nearestDecoration !== previousNearestDecoration) {
          previousNearestDecoration.setEmissive(DECORATION_NORMAL_COLOR)
        }
      } else if (previousNearestDecoration === null) {
        // nearestDecoration.setEmissive(DECORATION_HOVER_COLOR)
      } else if (nearestDecoration !== previousNearestDecoration) {
        // nearestDecoration.setEmissive(DECORATION_HOVER_COLOR)
        if (previousNearestDecoration !== selectedDecoration) {
          previousNearestDecoration.setEmissive(DECORATION_NORMAL_COLOR)
        }
      }
      previousNearestDecoration = nearestDecoration
    } else if (!nearestDecoration && previousNearestDecoration) {
      if (previousNearestDecoration !== selectedDecoration) {
        previousNearestDecoration.setEmissive(DECORATION_NORMAL_COLOR)
      }
      previousNearestDecoration = null
    }
  })
  
  window.addEventListener('mousedown', (event) => {
    if (selectedDecoration) {
      selectedDecoration.setEmissive(DECORATION_NORMAL_COLOR)
    }
    if (selectedDecoration != nearestDecoration) {
      selectedDecoration = nearestDecoration
      if (selectedDecoration) {
        selectedDecoration.setEmissive(DECORATION_SELECTED_COLOR)
      }
    }
  })


  network.on('connect', (uuid, state) => {
    const entity = stage.entities[uuid]
    switch(state.type) {
      case 'player':
        entity.setOpacity(1.0)
        entity.showVideoBubble()
        entity.showOffscreenIndicator()
        break
      case 'mouse':
        entity.showSphere()
        break
      default:
        console.warn('"connect" issued for unhandled type', uuid, state)
    }
  })
  
  network.on('disconnect', (uuid, state) => {
    const entity = stage.entities[uuid]
    switch(state.type) {
      case 'player':
        entity.setOpacity(0.2)
        entity.hideVideoBubble()
        entity.setThought(null)
        entity.hideOffscreenIndicator()
        break
      case 'mouse':
        entity.hideSphere()
        break
      default:
        console.warn('"disconnect" issued for unhandled type', uuid, state)
    }
  })
  
  network.on('add', (uuid, state) => {
    if (Object.keys(stage.entities).includes(uuid)) {
      console.warn(`Stage already has entity with UUID ${uuid}, not adding`)
      return
    }
    switch(state.type) {
      case 'player':
        console.log('create other player', uuid, state)
        try {
          const otherPlayer = OtherPlayer(Object.assign({
            speed: 250,
            followTurning: true,
            animationSpeed: 1.5,
            labelOffset: { x: 0, y: 0, z: 60 },
            videoBubbleOffset: {x: 0, y: 0, z: -240 },
            animationResourceId: 'people',
          }, state, { uuid }))
          if (state.position) {
            otherPlayer.warpToPosition(state.position)
          }
          stage.add(otherPlayer)
        } catch (e) {
          console.error(e)
        }
        break
      
      case 'decoration':
        // console.log('adding decoration, state:', state)
        const decoration = Decoration(Object.assign({
          speed: 500,
        }, state, { uuid }))
        stage.add(decoration)
        break
      
      case 'mouse':
        const mousePointer = OtherMousePointer(Object.assign({}, state, { uuid }))
        stage.add(mousePointer)
        break
      
      case 'teleportal':
        const teleportal = Teleportal(Object.assign({
          target: player,
          active: false,
          speed: 500,
        }, state, { uuid }))
        console.log('Added teleportal', state, teleportal)
        stage.add(teleportal)
        break
        
      default:
        console.warn('"add" issued for unhandled type', uuid, state)
    }
  })
  
  network.on('remove', (uuid) => {
    const entity = stage.entities[uuid]
    if (entity) {
      stage.remove(entity)
    } else {
      console.warn("Can't remove entity (not found)", uuid)
    }
  })

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
  
  // If at any time we discover that the focus is on the document body instead of the canvas, correct it
  // setInterval(() => {
  //   if (document.activeElement === document.body) { focusOnGame() }
  // }, 250)

  const invite = document.getElementById('invite')
  const invitation = document.getElementById('invitation')
  const invitationInput = document.getElementById('invitation-input')
  invite.addEventListener('click', () => {
    if (invitation.classList.contains('show')) {
      invitation.classList.remove('show')
    } else {
      const invitationToken = uuidv4().slice(0,7)
      network.invitations.set(invitationToken, 1)
      invitationInput.value = `${window.location.origin}/?t=${invitationToken}`
      invitation.classList.add('show')
    }
  })
  
  const doCommand = (command, args) => {
    switch (command) {
      case 'home':
        player.warpToPosition({x:0,y:0,z:0})
        break
        
      case 'name':
        player.setLabel(args.join(' '))
        break
        
      case 'character':
        const gender = args[0]
        if (gender === 'f' || gender === 'm') {
          const avatarOptions = avatarOptionsOfGender(gender)
          const index = parseInt(args[1], 10)
          if (index < avatarOptions.length) {
            player.state.animationMeshName.target = avatarOptions[index].avatarId
          } else {
            console.warn("Can't get avatar")
          }
        } else {
          console.warn('Gender not available')
        }
        break
        
      case 'object':
      case 'obj':
        const subCommand = args[0]
        // const decoration = findNearestOfType('decoration', stage.entities, player.state.position.now)
        const decoration = selectedDecoration
        if (!decoration) {
          console.log('Selected decoration not found')
          return
        } else {
          console.log('Selected decoration', decoration)
          if (subCommand === 'up') {
            decoration.state.orientation.target = 0
            network.setEntity(decoration)
          } else if (subCommand === 'down') {
            decoration.state.orientation.target = 3
            network.setEntity(decoration)
          } else if (subCommand === 'delete') {
            network.removeEntity(decoration.uuid)
          } else if (subCommand === 'fetch') {
            const destination = new THREE.Vector3()
            const y = decoration.state.position.now.y
            destination.copy(player.state.position.now)
            destination.y = y
            decoration.setPosition(destination)
            network.setEntity(decoration)
          } else if (subCommand === 'move') {
            if (args[1]) { decoration.state.position.target.x += parseFloat(args[1]) }
            if (args[2]) { decoration.state.position.target.y += parseFloat(args[2]) }
            if (args[3]) { decoration.state.position.target.z += parseFloat(args[3]) }
            network.setEntity(decoration)
          } else if (subCommand === 'x') {
            if (args[1]) { decoration.state.position.target.x += parseFloat(args[1]) }
            network.setEntity(decoration)
          } else if (subCommand === 'y') {
            if (args[1]) { decoration.state.position.target.y += parseFloat(args[1]) }
            network.setEntity(decoration)
          } else if (subCommand === 'z') {
            if (args[1]) { decoration.state.position.target.z += parseFloat(args[1]) }
            network.setEntity(decoration)
          } else if (subCommand === 'scale') {
            if (args[1]) {
              decoration.state.imageScale.target = parseFloat(args[1])
            }
            network.setEntity(decoration)
          } else if (subCommand === 'clone') {
            const clonedState = stateToObject(decoration.type, decoration.state)
            clonedState.position = Object.assign({}, clonedState.position)
            clonedState.position.x += 50
            clonedState.position.z += 50
            console.log('clonedState', clonedState)
            network.setState(uuidv4(), clonedState)
          }
        }
        break

      case 'mute':
        muteAudio()
        break
      
      case 'unmute':
        unmuteAudio()
        break
        
      case 'portal':
        if (!args || args.length === 0) {
          console.warn('URL is required')
          break
        }
        const radius = parseInt(args[1] || '150')
        const url = args[0]
        const tp = Teleportal({
          type: 'teleportal',
          target: player,
          url: url,
          active: false,
          radius: radius,
          position: player.state.position.now,
        })
        tp.object.position.copy(player.state.position.now)
        network.setEntity(tp)
        stage.add(tp)
        break
        
      case 'stop':
        stage.continueRendering = false
        break

      case 'reset':
        stage.continueRendering = false
        setTimeout(() => {
          localStorage.clear()
          window.location.reload()
        }, 100)
        break
    }
  }
  
  // Allow TAB and ESC keys to switch from text input to game view
  document.getElementById('input').addEventListener('keydown', e => {
    const text = e.target.value.trim()
    if (e.keyCode === 9 /* TAB */) {
      // Don't allow TAB to propagate up and cause focus to be switched us back to input
      e.preventDefault()
      e.stopPropagation()
      focusOnGame()
    } else if (e.keyCode === 27 /* ESC */) {
      focusOnGame()
    } else if (e.keyCode === 13 /* ENTER */) {
      if (text.substring(0,1) === '/') {
        const parts = text.substring(1).split(' ')
        if (parts.length === 1 && parts[0] !== '') {
          const command = parts[0]
          doCommand(command)
        } else if (parts.length > 1) {
          const command = parts[0]
          const args = parts.slice(1)
          doCommand(command, args)
        }
        e.target.value = ''
        focusOnGame()
      } else if (text !== '') {
        // Before focusing back on the game, make a thought bubble, and clear the text
        player.setThought(text)
        e.target.value = ''
      } else {
        focusOnGame()
      }
    } else if (e.keyCode >= 37 && e.keyCode <= 40 && text === "") {
      // If the player has typed nothing, but uses the arrow keys, go back to the game
      focusOnGame()
      kbController.keyPressed(e.keyCode)
    }
  })

  const pressTabHelp = document.getElementById('press-tab-help')
  pressTabHelp.addEventListener('click', () => { pressTabHelp.classList.add('hide') })
  
  const kbController = KeyboardController({ type: "keyboard", target: player })
  document.addEventListener('keydown', e => {
    if (e.target === stage.renderer.domElement) {
      kbController.keyPressed(e.keyCode, { shift: e.shiftKey, ctrl: e.ctrlKey, meta: e.metaKey })
      // This makes it so that 'tab' is controlled by us, rather than
      // the default HTML tabIndex system
      if (e.keyCode === 9) {
        e.preventDefault()
      } else if (e.keyCode === 191 /* Forward Slash */) {
        e.preventDefault()
        focusOnInput()
        document.getElementById('input').value = '/' 
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
  stage.add(kbController)

  const camController = CameraController({ target: player })
  stage.add(camController)
  
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
    console.log('sec params', params)
    await security.verify(playerId, signature)
  } else {
    console.log("Not using crypto.subtle")
  }
  
  // Call network.connect now, after all the network callbacks are ready,
  // so that we don't miss any inital 'add' events
  network.connect(params)

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