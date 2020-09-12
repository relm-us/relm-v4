import stampit from 'stampit'
import { Vector3 } from 'three'

import { Component } from './component.js'

import { Equality, defineGoal } from '../goals/goal.js'

const AnimatesScale = stampit(Component, {
  deepStatics: {
    goalDefinitions: {
      scale: defineGoal('s', { x: 1, y: 1, z: 1 }, Equality.Distance(0.001)),
    },
  },

  init() {
    this._scale = new Vector3()
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
        scaleGoal.markAchievedIfEqual(
          new Map(Object.entries(this.object.scale))
        )
      }
    },
  },
})

export { AnimatesScale }
