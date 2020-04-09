import stampit from 'stampit'

import { Entity } from './entity.js'
import { Component} from './component.js'
import { DOMReady } from './domready.js'
import { HasObject } from './has_object.js'
import { HasLabel } from './has_label.js'
import { addManifestTo } from './manifest_loaders.js'
import { FollowsTarget } from './follows_target.js'
import { KeyboardController } from './keyboard_controller.js'
import { CameraController } from './camera_controller.js'
import { HasAnimationMixer } from './has_animation_mixer.js'
import { WalksWhenMoving } from './walks_when_moving.js'
import { HasThoughtBubble } from './has_thought_bubble.js'

const Player = stampit(
  Entity,
  HasObject,
  HasLabel,
  HasThoughtBubble,
  FollowsTarget,
  HasAnimationMixer,
  WalksWhenMoving,
{
  name: 'Player',
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
  const player = window.player = Player({
    speed: 250,
    animationSpeed: 1.5,
    label: 'Guest',
    labelOffset: { x: 0, y: 0, z: 60 },
    animationResourceId: 'people',
    animationMeshName: 'fem-E-armature'
  })
  stage.add(player)


  // At various times, we need to set focus on the game so that character directional controls work
  const focusOnGame = () => { stage.renderer.domElement.focus() }
  // Do it once when the page finishes loading, too:
  focusOnGame()
  // If at any time we discover that the focus is on the document body instead of the canvas, correct it
  setInterval(() => {
    if (document.activeElement === document.body) { focusOnGame() }
  }, 250)

  // Allow TAB and ESC keys to switch from text input to game view
  document.getElementById('input').addEventListener('keydown', e => {
    if (e.keyCode === 9 /* TAB */ || e.keyCode === 27 /* ESC */) {
      e.preventDefault()
      e.stopPropagation()
      focusOnGame()
    } else if (e.keyCode === 13 /* ENTER */) {
      if (e.target.value.trim() !== "") {
        // Before focusing back on the game, clear the text and make a thought bubble
        player.setThought(e.target.value)
        e.target.value = ""
      }
      focusOnGame()
    }
  })

  const kbController = KeyboardController({ target: player })
  document.addEventListener('keydown', e => {
    if (e.target === stage.renderer.domElement) {
      kbController.keyPressed(e.keyCode)
      // This makes it so that 'tab' is controlled by us, rather than
      // the default HTML tabIndex system
      if (e.keyCode === 9) {
        e.preventDefault()
      }
    }
  })
  document.addEventListener('keyup', e => {
    if (e.target === stage.renderer.domElement) {
      kbController.keyReleased(e.keyCode)
      // This makes it so that 'tab' is controlled by us, rather than
      // the default HTML tabIndex system
      if (e.keyCode === 9) {
        e.preventDefault()
      }
    }
  })
  kbController.on('done', () => {
    const input = document.getElementById('input')
    input.focus()
  })
  kbController.on('switch', () => {
    const input = document.getElementById('input')
    input.focus()
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