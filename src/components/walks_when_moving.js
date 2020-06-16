import stampit from 'stampit'

import { Component } from './component.js'

const DISTANCE_CLOSE_ENOUGH = 1.0

const WalksWhenMoving = stampit(Component, {
  methods: {
    setup() {
      this.walkingStopOnce = true
    },

    update(delta) {
      const dist = this.getDistanceToTarget()
      if (dist > DISTANCE_CLOSE_ENOUGH) {
        this.walkingStopOnce = false
        if (!this.walkingStartOnce) {
          this.walkingStartOnce = true
          if (!this.clips.walking.isRunning()) {
            this.clips.walking.play()
          }
          this.clips.walking.paused = false
          this.clips.walking.stopWarping().warp(0.0, 1.0, 0.1)
        }
      } else {
        this.walkingStartOnce = false
        if (!this.walkingStopOnce) {
          this.walkingStopOnce = true
          this.clips.walking.stopWarping().warp(1.0, 0.0, 0.3)
        }
      }
    }
  }
})

export { WalksWhenMoving }
