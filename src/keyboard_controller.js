import stampit from 'stampit'
import EventEmittable from '@stamp/eventemittable'

import { Entity } from './entity.js'
import { Component } from './components/component.js'
import {
  KEY_UP, KEY_DOWN, KEY_LEFT, KEY_RIGHT,
  KEY_W, KEY_A, KEY_S, KEY_D, KEY_Q, KEY_E,
  KEY_SPACE, KEY_TAB, KEY_RETURN, KEY_ESCAPE,
} from 'keycode-js'

const { Vector3 } = THREE

const KeyboardKeyMap = stampit(Component, {
  props: {
    /**
     * The Entity that this KeyboardController controls.
     * 
     * @type {Entity}
     */
    target: null
  },

  deepProps: {
    /**
     * Map of actions to their (possibly many) keys
     * 
     * Great place to look these up: https://keycode.info/
     */
    keyMap: {
      up: [KEY_UP, KEY_W],
      down: [KEY_DOWN, KEY_S],
      left: [KEY_LEFT, KEY_A],
      right: [KEY_RIGHT, KEY_D],
      auxleft: [KEY_Q],
      auxright: [KEY_E],
      act: [KEY_SPACE],
      switch: [KEY_TAB],
      done: [KEY_RETURN],
      close: [KEY_ESCAPE],
    }
  },

  init({ target, keyMap = this.keyMap }) {
    if (!target) {
      throw new Error('KeyboardController requires a target to control')
    }
    if (typeof target.setPosition !== 'function') {
      throw new Error('KeyboardController requires target to have FollowsTarget')
    }
    this.target = target
    this.keyMap = keyMap
    this.keyCodeAction = this.invertKeyMap()
    this.actions = new Set()
    this.doubleStopwatch = {}
    this.releaseStopwatch = {}
    this.controlDirection = new Vector3()
  },

  methods: {
    invertKeyMap() {
      let inverted = {}
      for (let action in this.keyMap) {
        const keyCodes = this.keyMap[action]
        for (let keyCode of keyCodes) {
          inverted[keyCode] = action
        }
      }
      return inverted
    },

    getActionFromKeyCode (keyCode) {
      return this.keyCodeAction[keyCode]
    },

    getVectorFromAction (action, magnitude = 100.0) {
      switch (action) {
        case 'up': return new Vector3(0, 0, -magnitude)
        case 'down': return new Vector3(0, 0, magnitude)
        case 'left': return new Vector3(-magnitude, 0, 0)
        case 'right': return new Vector3(magnitude, 0, 0)
        default: return new Vector3(0, 0, 0)
      }
    },

    keyPressed (keyCode, opts) {
      const action = this.getActionFromKeyCode(keyCode)
      if (action === undefined) {
        // If this doesn't match a known action, emit 'unknown' so that we can
        // potentially help the player with visual feedback or other cues.
        this.emit('unknown', keyCode, opts)
      } else if (['done', 'switch', 'close'].includes(action)) {
        this.emit(action)
        this.actions.clear()
      } else {
        // Check for 'double tap' action
        const now = Date.now()
        if (
          (!this.doubleStopwatch[action] || (now - this.doubleStopwatch[action]) > 500) &&
          (this.releaseStopwatch[action] && (now - this.releaseStopwatch[action]) < 200)
        ) {
          // Emit 'double tap'
          this.emit('doublePressed', action)
          this.doubleStopwatch[action] = now
        }
        
        // Add regular action
        this.actions.add(action)
      }
    },

    keyReleased (keyCode) {
      const action = this.getActionFromKeyCode(keyCode)
      if (this.actions.has(action)) {
        this.emit('released', action)
        this.actions.delete(action)
      }
      
      const now = Date.now()
      this.releaseStopwatch[action] = now
    },

    update() {
      this.actions.forEach(action => this.target.addPosition(this.getVectorFromAction(action)))
    }
  }
})

const KeyboardController = stampit(
  Entity,
  EventEmittable,
  KeyboardKeyMap
)

export { KeyboardController }
