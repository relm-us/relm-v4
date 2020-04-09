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


const Player = stampit(
  Entity,
  HasObject,
  HasLabel,
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
  document.getElementById('game').appendChild(stage.renderer.domElement)
  stage.renderer.domElement.focus()

  setInterval(() => {
    if (document.activeElement === document.body) {
      stage.renderer.domElement.focus()
    }
  }, 250)

  // Allow `tab` and `esc` keys to switch from text input to game view
  document.getElementById('input').addEventListener('keydown', e => {
    if (e.keyCode === 9 /* TAB */ || e.keyCode === 27 /* ESC */) {
      const canvas = document.getElementById('glcanvas')
      canvas.focus()
      e.preventDefault()
      e.stopPropagation()
    }
  })

  const player = window.player = Player({
    speed: 250,
    animationSpeed: 1.5,
    label: 'Guest',
    labelOffset: { x: 0, y: 0, z: 60 },
    animationResourceId: 'people',
    animationMeshName: 'fem-E-armature'
  })
  stage.add(player)

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