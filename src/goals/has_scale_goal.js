import stampit from 'stampit'

import { CanAddGoal, Equal } from './goal.js'

const HasScaleGoal = stampit(CanAddGoal, {
  init() {
    this.addGoal('s', { x: 1.0, y: 1.0, z: 1.0 }, {
      equals: Equal.Distance(0.001)
    })
  }
})

export { HasScaleGoal }