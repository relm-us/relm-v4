import stampit from 'stampit'

import { Component } from './component.js'

import { GoalOriented, Equal } from '../goals/goal.js'

const AnimatesScale = stampit(Component, GoalOriented, {
  init() {
    this.addGoal('s', { x: 1.0, y: 1.0, z: 1.0 }, {
      equals: Equal.Distance(0.001)
    })
    
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
