import stampit from 'stampit'
// import EventEmittable from '@stamp/eventemittable'

import { Entity } from './entity.js'
import { Component } from './components/component.js'

const { Vector3 } = THREE

const PadDirection = stampit(Component, {
  props: {
    /**
     * The Entity that this KeyboardController controls.
     * 
     * @type {Entity}
     */
    target: null
  },
  
  init({ target }) {
    if (!target) {
      throw new Error('PadController requires a target to control')
    }
    if (typeof target.addPosition !== 'function') {
      console.error('PadController requires target to have FollowsTarget')
    }
    this.target = target
    this.controlDirection = new Vector3()
    this.padDirection = new Vector3()
  },

  methods: {
    padDirectionChanged(dir) {
      this.padDirection.copy(dir)
    },

    update() {
      if (this.target.addPosition) {
        this.target.addPosition(this.padDirection)
      }
    }
  }
})

const PadController = stampit(
  Entity,
  PadDirection
).setType('padcon')

export { PadController }