import stampit from 'stampit'

import { Component } from './component.js'

import { Equality } from '../goals/goal.js'
import { GoalOriented } from '../goals/goal_oriented.js'

const AnimatesScale = stampit(Component, GoalOriented, {
  init() {
    this.addGoal('scale', { x: 1.0, y: 1.0, z: 1.0 }, Equality.Distance(0.001))
    
    this._scale = new THREE.Vector3()
  },

  methods: {
    update(_delta) {
      const scaleGoal = this.goals.scale
      if (!scaleGoal.achieved) {
        if (scaleGoal.isPastDue()) {
          this.object.scale.copy(scaleGoal.toJSON())
        } else {
          this._scale.copy(scaleGoal.toJSON())
          this.object.scale.lerp(this._scale, 0.1)
        }
        scaleGoal.markAchievedIfEqual(new Map(Object.entries(this.object.scale)))
      }
    }
  }
})

export { AnimatesScale }
