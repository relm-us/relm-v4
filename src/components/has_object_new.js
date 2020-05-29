import stampit from 'stampit'

import { Component } from './component'

const HasObject = stampit(Component, {
  init() {
    this.object = new THREE.Object3D()
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