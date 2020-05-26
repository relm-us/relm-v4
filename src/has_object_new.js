import stampit from 'stampit'

import { CanAddGoal, Equal } from './goal.js'
import { Component } from './component'

const { Vector3 } = THREE

const HasObject = stampit(CanAddGoal, Component, {
  init({ position }) {
    this.object = new THREE.Object3D()
    
    this.addGoal('position',
      ['x', 0.0, Equal.Delta(0.01)],
      ['y', 0.0, Equal.Delta(0.01)],
      ['z', 0.0, Equal.Delta(0.01)],
    )
    
    this.object.position.copy(this.goals.position)
  },

  methods: {
    setup() {
      this.stage.scene.add(this.object)
    },

    teardown() {
      this.stage.scene.remove(this.object)
    }
  }
})

export { HasObject }