import stampit from 'stampit'

import { Component } from './component.js'

import { GoalOriented } from '../goals/goal_oriented.js'

const AnimatesRotation = stampit(Component, GoalOriented, {
  init() {
    this.addGoal('rotation', { x: 0.0, y: 0.0, z: 0.0 })
    
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
            rotationGoal.markAchieved()
          }
        }
      }
    }
  }
})

export { AnimatesRotation }
