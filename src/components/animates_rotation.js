import stampit from 'stampit'

import { Component } from './component.js'
import { defineGoal } from '../goals/goal.js'

const AnimatesRotation = stampit(Component, {
  deepStatics: {
    goalDefinitions: {
      rotation: defineGoal('r', { x: 0, y: 0, z: 0 })
    }
  },
  
  init() {
    this._rotation = new THREE.Euler()
    this._quaternion = new THREE.Quaternion()
  },

  methods: {
    update(_delta) {
      const rotationGoal = this.goals.rotation;
      if (!rotationGoal.achieved) {
        const r = rotationGoal
        if (rotationGoal.isPastDue()) {
          this.object.rotation.set(r.get('x'), r.get('y'), r.get('z'))
          rotationGoal.markAchieved()
        } else {
          this._rotation.set(r.get('x'), r.get('y'), r.get('z'))
          this._quaternion.setFromEuler(this._rotation)
          this.object.quaternion.slerp(this._quaternion, 0.1)
          const angleDelta = Math.abs(this.object.quaternion.angleTo(this._quaternion))
          if (angleDelta < 0.01) {
            this.object.quaternion.copy(this._quaternion)
            rotationGoal.markAchieved()
          }
        }
      }
    }
  }
})

export { AnimatesRotation }
