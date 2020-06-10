import stampit from 'stampit'

import { Component } from './component.js'

import { GoalOriented } from '../goals/goal_oriented.js'

const AnimatesRotation = stampit(Component, GoalOriented, {
  init({ goals = {} }) {
    this.addGoal('rotation', goals.rotation || { x: 0.0, y: 0.0, z: 0.0 })
    
    this._rotation = new THREE.Euler()
    this._quaternion = new THREE.Quaternion()
  },

  methods: {
    update(_delta) {
      const rotationGoal = this.goals.r;
      if (!rotationGoal.achieved) {
        const r = rotationGoal.toJSON()
        if (rotationGoal.isPastDue()) {
          this.object.rotation.set(r.x, r.y, r.z)
          rotationGoal.markAchieved()
        } else {
          this._rotation.set(r.x, r.y, r.z)
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
