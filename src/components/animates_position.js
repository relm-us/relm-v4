import stampit from 'stampit'

import { Component } from './component.js'
import { Equality } from '../goals/goal.js'
import { GoalOriented } from '../goals/goal_oriented.js'

const AnimatesPosition = stampit(GoalOriented, Component, {
  init() {
    this.addGoal('position', { x: 0.0, y: 0.0, z: 0.0 }, Equality.Distance(0.01))
    
    this._position = new THREE.Vector3()
  },

  methods: {
    _getPositionLerpAlpha(distance, delta) {
      return 0.1
    },

    update(delta) {
      const positionGoal = this.goals.position
      if (!positionGoal.achieved) {
        if (positionGoal.isPastDue()) {
          // if (this.type === 'mouse') {
          //   console.log('mouse p past due', positionGoal.achieved, positionGoal.get())
          // }
          this.object.position.copy(positionGoal.toJSON())
          positionGoal.markAchieved()
        } else {
          this._position.copy(positionGoal.toJSON())
          const distance = this.object.position.distanceTo(this._position)
          const alpha = this._getPositionLerpAlpha(distance, delta)
          this.object.position.lerp(this._position, alpha)
          positionGoal.markAchievedIfEqual(this.object.position)
        }
      }
    }
  }
})

export { AnimatesPosition }
