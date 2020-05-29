import stampit from 'stampit'
import EventEmittable from '@stamp/eventemittable'

import { Entity } from '../entity.js'
import { Component } from './component.js'
import { ThoughtBubble } from '../thought_bubble.js'

const HasThoughtBubble = stampit(Entity, Component, EventEmittable, {
  props: {
    thoughtBubble: null,
    thoughtBubbleOffset: null,
  },

  deepProps: {
    state: {
      thought: {
        now: null,
        target: null
      }
    }
  },
  
  init({ thoughtBubbleOffset }) {
    this.thoughtBubbleOffset = thoughtBubbleOffset || {x: 0, y: 0}
    
    const action = () => { this.emit('thoughtBubbleAction', this.getThought()) }
    const close = () => { this.emit('thoughtBubbleClose'); this.setThought(null) }
    this.thoughtBubble = new ThoughtBubble(this.stage.camera, action, close)
  },

  methods: {
    setThought(text) {
      if (text === "") {
        this.state.thought.target = null
      } else {
        this.state.thought.target = text
      }
    },

    getThought() {
      return this.state.thought.now
    },

    hasThought() {
      if (!this.thoughtBubble) {
        return false
      }
      return !!this.state.thought.now
    },

    update(delta) {
      if (this.state.thought.now !== this.state.thought.target) {
        this.state.thought.now = this.state.thought.target
        this.thoughtBubble.setText(this.state.thought.now)
      }
      
      let bounceMotion = 0
      // If we have a walking AnimationClip available, we can use its time tracker
      // to make the thought bubble look more real by making it bob up and down a bit
      if (this.clips && this.clips.walking) {
        const walkCycleTime = this.clips.walking.time / this.clips.walking.getClip().duration
        bounceMotion = Math.sin(walkCycleTime * Math.PI * 4 + Math.PI/8) * 2
      }
      this.thoughtBubble.position.copy(this.object.position)
      this.thoughtBubble.position.x += this.thoughtBubbleOffset.x
      this.thoughtBubble.position.y += this.thoughtBubbleOffset.y + bounceMotion
      this.thoughtBubble.project(this.stage.width, this.stage.height)
    }
  }

})

export { HasThoughtBubble }
