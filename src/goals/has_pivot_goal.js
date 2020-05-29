import stampit from 'stampit'

import { CanAddGoal } from './goal.js'

const HasPivotGoal = stampit(CanAddGoal, {
  init() {
    this.addGoal('pivot', { x: 0.0, y: 0.0, z: 0.0 })
  },

})

export { HasPivotGoal }