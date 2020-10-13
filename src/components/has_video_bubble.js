import stampit from 'stampit'
import { Vector3 } from 'three'

import { Component } from './component.js'
import { defineGoal } from '../goals/goal.js'
import { project2d } from '../util.js'
import { participants } from '../connection.js'

/**
 * HasVideoBubble is a Component that can be added to a Player or other
 * in-game entity.
 */
const HasVideoBubble = stampit(Component, {
  deepStatics: {
    goalDefinitions: {
      videoOffset: defineGoal('vbo', { x: 0, y: 290, z: 0 }),
      jitsiId: defineGoal('jid', { v: null }),
    },
  },

  init() {
    this.videoPosition = new Vector3()
    // Vector3 version of the videoOffset goal--updated only when the goal is updated
    this.videoOffset = new Vector3()
  },

  methods: {
    updateVideoOffset() {
      const offset = this.goals.videoOffset
      this.videoOffset.x = offset.get('x')
      this.videoOffset.y = offset.get('y')
      this.videoOffset.z = offset.get('z')
    },

    update(delta) {
      if (!this.goals.videoOffset.achieved) {
        this.updateVideoOffset()
        this.goals.videoOffset.markAchieved()
      }

      this.videoPosition.copy(this.object.position)
      this.videoPosition.add(this.videoOffset)

      project2d(this.videoPosition, this.stage.camera, {
        width: this.stage.width,
        height: this.stage.height,
      })
    },
  },
})

export { HasVideoBubble }
