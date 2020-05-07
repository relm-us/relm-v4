import stampit from 'stampit'

import Dropzone from 'dropzone'
import { DOMReady } from './domready.js'
import { addManifestTo } from './manifest_loaders.js'
import { guestNameFromPlayerId, avatarOptionFromPlayerId, avatarOptionsOfGender } from './avatars.js'
import { Security } from './security.js'
import { initializeAVChat } from './avchat.js'

import { Entity } from './entity.js'
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
import { NetworkGetsState } from './network_gets_state.js'
import { NetworkSetsState } from './network_sets_state.js'
import { LocalstoreGetsState, LocalstoreRestoreState } from './localstore_gets_state.js'
import { MousePointer, OtherMousePointer } from './mouse_pointer.js'
import { Decoration } from './decoration.js'
import { uuidv4 } from './util.js'
import config from './config.js'

const cfg = config(window.location)

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
  NetworkGetsState,
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
  // This is how OtherPlayers get updates
  NetworkSetsState,
{
  name: 'OtherPlayer'
})

async function start() {
  // We first add all resources from the manifest so that the progress
  // bar can add up all the resource's sizes. The actual loading doesn't
  // happen until we `enqueue` and `load`.
  addManifestTo(resources)
  
  // Stage 1 Resource Load: Bare essentials
  resources.enqueue(['people', 'grass'])
  await resources.load()

  stage.setGroundTexture(resources.get('grass'))
  window.addEventListener('resize', _ => stage.windowResized(window.innerWidth, window.innerHeight))
  stage.start()


  await DOMReady()
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
    
    // Add the decoration to the network so everyone can see it
    const url = cfg.SERVER_UPLOAD_URL + '/' + response.file
    network.setState(null, {
      type: 'decoration',
      position: {
        x: player.state.position.now.x,
        y: player.state.position.now.y,
        z: player.state.position.now.z,
      },
      asset: {
        id: response.id,
        url: url,
      },
      imageScale: 1.0,
      orientation: 3
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
    animationSpeed: 1.5,
    labelOffset: { x: 0, y: 0, z: 60 },
    videoBubbleOffset: {x: 0, y: 0, z: -240 },
    animationResourceId: 'people',
    lsKey: 'player'
  })
  LocalstoreRestoreState('player', player)
  // Warp the player to their 'saved' location, if any
  player.warpToPosition(player.state.position.target)
  stage.add(player)
  
  const mousePointer = window.mousePointer = MousePointer({
    type: 'mouse',
    networkGetsStateModulus: 2,
  })
  stage.add(mousePointer)
  
  let mousePos = new THREE.Vector3()
  window.addEventListener('mousemove', (event) => {
    mousePointer.setScreenCoords(event.clientX, event.clientY)
    mousePos.copy(player.object.position)
    mousePos.sub(mousePointer.object.position)
    // mousePos.set(100, 0, 0)
    // console.log('mousePos', player.object.position, mousePointer.object.position, mousePos)
    // mousePointer.lineTrackEnd.copy(mousePos)
    // console.log('mouse', {x: event.clientX, y: event.clientY}, mousePos)
  })


  network.on('connect', (uuid, state) => {
    const entity = stage.entities[uuid]
    switch(state.type) {
      case 'player':
        entity.setOpacity(1.0)
        entity.showVideoBubble()
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
        break
      case 'mouse':
        entity.hideSphere()
        break
      default:
        console.warn('"disconnect" issued for unhandled type', uuid, state)
    }
  })
  
  network.on('add', (uuid, state) => {
    switch(state.type) {
      case 'player':
        console.log('create other player', state)
        try {
          const otherPlayer = OtherPlayer(Object.assign({
            speed: 250,
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
      console.log('decoration state', state)
        const decoration = Decoration(Object.assign({}, state, { uuid }))
        stage.add(decoration)
        break
      case 'mouse':
        const mousePointer = OtherMousePointer(Object.assign({}, state, { uuid }))
        stage.add(mousePointer)
        break
      default:
        console.warn('"add" issued for unhandled type', uuid, state)
    }
  })

  // At various times, we need to set focus on the game so that character directional controls work
  const focusOnGame = () => { stage.renderer.domElement.focus() }
  const focusOnInput = () => { document.getElementById('input').focus() }
  // Do it once when the page finishes loading, too:
  focusOnGame()
  // If at any time we discover that the focus is on the document body instead of the canvas, correct it
  setInterval(() => {
    if (document.activeElement === document.body) { focusOnGame() }
  }, 250)

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
  
  const kbController = KeyboardController({ target: player })
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

  resources.enqueue([
    'sparkle'
  ])
  await resources.load()
  
  initializeAVChat({
    createVideoElement: (entityId) => {
      console.log('playerId', playerId)
      console.log('createVideoElement', entityId)
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
  }, player.uuid)
}

start()