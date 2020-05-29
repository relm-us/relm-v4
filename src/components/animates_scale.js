import stampit from 'stampit'

import { Component } from './component.js'

import { HasScaleGoal } from '../goals/has_scale_goal.js'

const AnimatesScale = stampit(Component, HasScaleGoal, {
  init() {
    this._scale = new THREE.Vector3()
  },

  methods: {
    update(_delta) {
      const scaleGoal = this.goals.s
      if (!scaleGoal.achieved) {
        if (scaleGoal.isPastDue()) {
          this.object.scale.copy(scaleGoal.get())
        } else {
          this._scale.copy(scaleGoal.get())
          this.object.scale.lerp(this._scale, 0.1)
        }
        scaleGoal.markAchievedIfEqual(this.object.scale)
      }
    }
  }
})

export { AnimatesScale }
