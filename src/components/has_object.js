import stampit from 'stampit'

import { Component } from './component.js'

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
    },

    show() {
      this.object.visible = true
      this.emit('visible')
    },

    hide() {
      this.object.visible = false
      this.emit('invisible')
    }
  }
})

export { HasObject }