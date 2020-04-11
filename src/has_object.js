import stampit from 'stampit'
import { Component } from './component'
// see https://stampit.js.org/ecosystem/stamp-collision
// import { collisionSetup } from '@stamp/collision'

const HasObject = stampit(Component, {
  name: 'HasObject',

  props: {
    /**
     * @type {THREE.Object3D}
     */
    object: null
  },

  init() {
    this.object = new THREE.Object3D()
    // Layer 1 is used for things that can collide
    // this.object.layers.enable(1)
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