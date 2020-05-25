import stampit from 'stampit'

import { Entity } from './entity.js'
import { HasObject } from './has_object.js'
import { HasEmissiveMaterial } from './has_emissive_material.js'
import { ReceivesPointer } from './receives_pointer.js'
import { FollowsTarget } from './follows_target.js'
import { NetworkSetsState } from './network_persistence.js'

const Equal = {
  Delta: (threshold) => {
    return (a, b) => {
      return Math.abs(a - b) < threshold
    }
  },
  Compare: () => {
    return (a, b) => {
      return a == b
    }
  }
}

const Goal = stampit({
  init({ name, value = {}}) {
    this.name = name
    this.attrs = {}
    this.value = {}
    
    this.set(value)
  },

  methods: {
    set(value) {
      Object.assign(this.value, value)
      this.modified = true
    }
  }
})

const AddsGoal = stampit({
  init() {
    if (!this.goals) { this.goals = {} }
  },

  methods: {
    addGoal(name, ...props) {
      this.goals[name] = Goal(name, defaultObject)
    }
  }
})

const CanScale = stampit({
  init() {
    this.addGoal('scale',
      ['x', 1.0, Equal.Delta(0.01)],
      ['y', 1.0, Equal.Delta(0.01)],
      ['z', 1.0, Equal.Delta(0.01)]
    )
  },

  methods: {

  }
})

const HasImageNew = stampit({
  deepProps: {

  }

})

const GetsGoalUpdates = stampit({

})

const Decoration = stampit(
  Entity,
  HasObject,
  HasImageNew,
  HasEmissiveMaterial,
  ReceivesPointer,
  FollowsTarget,
)

export { Decoration }