import stampit from 'stampit'

import Dropzone from 'dropzone'
import { DOMReady } from './domready.js'
import { addManifestTo } from './manifest_loaders.js'
import { guestNameFromPlayerId, avatarOptionFromPlayerId } from './avatars.js'
import { Security } from './security.js'

import { Entity } from './entity.js'
import { HasObject } from './has_object.js'
import { HasLabel } from './has_label.js'
import { FollowsTarget } from './follows_target.js'
import { KeyboardController } from './keyboard_controller.js'
import { CameraController } from './camera_controller.js'
import { HasAnimationMixer } from './has_animation_mixer.js'
import { WalksWhenMoving } from './walks_when_moving.js'
import { HasThoughtBubble } from './has_thought_bubble.js'
import { HasOpacity } from './has_opacity.js'
import { NetworkGetsState } from './network_gets_state.js'
import { NetworkSetsState } from './network_sets_state.js'
import { LocalstoreGetsState, LocalstoreRestoreState } from './localstore_gets_state.js'
import { HasImage } from './has_image.js'
import { uuidv4 } from './util.js'
import config from './config.js'

const cfg = config(window.location)

// Don't look for 'dropzone' in HTML tags
Dropzone.autoDiscover = false

const security = Security()

const Decoration = stampit(
  Entity,
  HasObject,
  HasImage
)

const PlayerBase = stampit(
  Entity,
  HasObject,
  HasOpacity,
  HasLabel,
  HasThoughtBubble,
  FollowsTarget,
  HasAnimationMixer,
  WalksWhenMoving,
).props({
})
// .props({
//     speed: 250,
//     animationSpeed: 1.5,
//     labelOffset: { x: 0, y: 0, z: 60 },
//     animationResourceId: 'people',
//     networkKey: 'player'
// })

const Player = stampit(
  PlayerBase,
  // This is how the player sends updates
  NetworkGetsState,
  LocalstoreGetsState,
{
  name: 'Player',
})

const OtherPlayer = stampit(
  PlayerBase,
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
    network.addState('decoration', {
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
    label: guestNameFromPlayerId(playerId),
    animationMeshName: avatarOptionFromPlayerId(playerId).avatarId,
    speed: 250,
    animationSpeed: 1.5,
    labelOffset: { x: 0, y: 0, z: 60 },
    animationResourceId: 'people',
    networkKey: 'player',
    lsKey: 'player'
  })
  LocalstoreRestoreState('player', player)
  // Warp the player to their 'saved' location, if any
  player.warpToPosition(player.state.position.target)
  stage.add(player)

  // network.on('authorized', (params) => {
  //   console.log('Authorized!')
  // })

  network.on('connect', (key, state) => {
    const entity = stage.entities[state.uuid]
    switch(key) {
      case 'player':
        entity.setOpacity(1.0)
      default:
        console.warn('"connect" issued for unhandled type', key, state)
    }
  })
  
  network.on('disconnect', (key, state) => {
    const entity = stage.entities[state.uuid]
    switch(key) {
      case 'player':
        entity.setOpacity(0.2)
        entity.setThought(null)
      default:
        console.warn('"disconnect" issued for unhandled type', key, state)
    }
  })
  
  network.on('add', (key, state) => {
    switch(key) {
      case 'player':
        console.log('create other player', state)
        try {
          const otherPlayer = OtherPlayer({
            uuid: state.uuid,
            speed: 250,
            animationSpeed: 1.5,
            label: state.name,
            labelOffset: { x: 0, y: 0, z: 60 },
            animationResourceId: 'people',
            animationMeshName: state.animationMeshName,
            networkKey: 'player'
          })
          if (state.position) {
            otherPlayer.warpToPosition(state.position)
          }
          stage.add(otherPlayer)
        } catch (e) {
          console.error(e)
        }
        return
      case 'decoration':
        const decoration = Decoration(state)
        stage.add(decoration)
        return
      default:
        console.warn('"add" issued for unhandled type', key, state)
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
      if (text !== "") {
        // Before focusing back on the game, make a thought bubble, and clear the text
        player.setThought(text)
        e.target.value = ""
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
  
  const pubkey = await security.exportPublicKey()
  const url = new URL(window.location.href)
  const token = url.searchParams.get("t")
  const signature = await security.sign(playerId)
  const params = { id: playerId, s: signature }
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
  
  // Call network.connect now, after all the network callbacks are ready,
  // so that we don't miss any inital 'add' events
  network.connect(params)


  resources.enqueue([
    'sparkle'
  ])
  await resources.load()
  
}

start()