import stampit from 'stampit'

import { Component } from './component.js'
import { Equality, defineGoal } from '../goals/goal.js'

const AnimatesPosition = stampit(Component, {
  deepStatics: {
    goalDefinitions: {
      position: defineGoal('p', { x: 0, y: 0, z: 0 }, Equality.Distance(0.01))
    }
  },
  
  init() {
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
