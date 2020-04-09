import stampit from 'stampit'
import EventEmittable from '@stamp/eventemittable'

import { Entity } from './entity.js'
import { Component } from './component.js'
import { ThoughtBubble } from './thought_bubble.js'

const HasThoughtBubble = stampit(Entity, Component, EventEmittable, {
  props: {
    thoughtBubble: null
  },

  deepProps: {
    state: {
      thought: {
        now: null,
        target: null
      }
    }
  },

  methods: {
    setThought(text) {
      this.state.thought.target = text
    },

    setup() {
      const action = () => { this.emit('thoughtBubbleAction') }
      const close = () => { this.emit('thoughtBubbleClose'); this.thoughtBubble.clearText() }
      this.thoughtBubble = new ThoughtBubble(this.stage.camera, action, close)
    },

    update(delta) {
      if (this.state.thought.now !== this.state.thought.target) {
        this.state.thought.now = this.state.thought.target
        this.thoughtBubble.setText(this.state.thought.now)
      }
      const walkCycleTime = this.clips.walking.time / this.clips.walking.getClip().duration
      const bounceMotion = Math.sin(walkCycleTime * Math.PI * 4 + Math.PI/8) * 2
      this.thoughtBubble.position.copy(this.object.position)
      this.thoughtBubble.position.y += 165 + bounceMotion
      this.thoughtBubble.position.x += 30
      this.thoughtBubble.project(this.stage.width, this.stage.height)
    }
  }

})

export { HasThoughtBubble }
