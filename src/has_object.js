import stampit from 'stampit'

import { Component } from './component'

const { Vector3 } = THREE

const HasObject = stampit(Component, {
  name: 'HasObject',

  props: {
    /**
     * @type {THREE.Object3D}
     */
    object: null
  },
  
  deepProps: {
    state: {
      position: {
        /**
         * @type {Vector3}
         */
        now: null,
        /**
         * @type {Vector3}
         */
        target: null,
      },
    }
  },

  init({ position }) {
    this.object = new THREE.Object3D()
    // Layer 1 is used for things that can collide
    // this.object.layers.enable(1)
    
    this.state.position.now = new Vector3(0, 0, 0)
    this.state.position.target = new Vector3(0, 0, 0)
    
    // Note that `copy` just takes the .x, .y, .z, (and .w) properties
    // and then calls _onChangeCallbeck(). See https://github.com/mrdoob/three.js
    // /blob/3ba0553208cfc9113152f5f39b4036a448cf3f25/src/math/Quaternion.js#L186
    this.state.position.now.copy(position || this.state.position.now)
    this.state.position.target.copy(position || this.state.position.now)
    
    this.object.position.copy(this.state.position.now)
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