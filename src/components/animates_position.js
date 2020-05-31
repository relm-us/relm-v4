import stampit from 'stampit'

import { Component } from './component.js'
import { GoalOriented, Equal } from '../goals/goal.js'

const AnimatesPosition = stampit(GoalOriented, Component, {
  init() {
    this.addGoal('p', { x: 0.0, y: 0.0, z: 0.0 }, {
      equals: Equal.Distance(0.01)
    })
    
    this._position = new THREE.Vector3()
  },

  methods: {
    _getPositionLerpAlpha(distance, delta) {
      return 0.1
    },

    update(delta) {
      const positionGoal = this.goals.p
      if (!positionGoal.achieved) {
        if (positionGoal.isPastDue()) {
          // if (this.type === 'mouse') {
          //   console.log('mouse p past due', positionGoal.achieved, positionGoal.get())
          // }
          this.object.position.copy(positionGoal.get())
          positionGoal.markAchieved()
        } else {
          this._position.copy(positionGoal.get())
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
