import stampit from 'stampit'

import { DOMReady } from './domready.js'
import { addManifestTo } from './manifest_loaders.js'
import { LongTermMemory } from './long_term_memory.js'

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

const Player = stampit(
  Entity,
  HasObject,
  HasOpacity,
  HasLabel,
  HasThoughtBubble,
  FollowsTarget,
  HasAnimationMixer,
  WalksWhenMoving,
  // This is how the player sends updates
  NetworkGetsState,
{
  name: 'Player',
})

const OtherPlayer = stampit(
  Entity,
  HasObject,
  HasOpacity,
  HasLabel,
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

  // The player!
  const playerId = LongTermMemory.getOrCreatePlayerId()
  const playerState = LongTermMemory.getOrCreatePlayerState(playerId)
  const player = window.player = Player({
    uuid: playerId,
    speed: 250,
    animationSpeed: 1.5,
    label: playerState.name,
    labelOffset: { x: 0, y: 0, z: 60 },
    animationResourceId: 'people',
    animationMeshName: playerState.avatarId,
    networkKey: 'player'
  })
  stage.add(player)

  network.on('connect', (key, state) => {
    console.log('network on connect', key, state)
    if (state.uuid) {
      stage.entities[state.uuid].setOpacity(1.0)
    } else {
      console.warn("Can't show connect", key, state)
    }
  })
  
  network.on('disconnect', (key, state) => {
    console.log('network on disconnect', key, state)
    if (state.uuid) {
      stage.entities[state.uuid].setOpacity(0.2)
    } else {
      console.warn("Can't show disconnect", key, state)
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
          stage.add(otherPlayer)
        } catch (e) {
          console.error(e)
        }
        return
      default:
        console.warn('Network added unhandled type', key, state)
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
  
  resources.enqueue([
    'green tree', 'yellow tree', 'hollow stump', 'tree7', 'rock',
    'stump', 'shrub', 'mushroom', 'sparkle', 'signpost', 'signpole',
    'skybox'
  ])
  await resources.load()
}

start()