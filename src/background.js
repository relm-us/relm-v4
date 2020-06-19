import stampit from 'stampit'

import { Entity } from './entity.js'
import { HasObject } from './components/has_object.js'
import { Component } from './components/component.js'

const HasPlane = stampit(Component, {
  init({ size }) {
    this.size = size || 10000000
  },

  methods: {
    _createMesh(size) {
      if (this.mesh) { this.object.remove(this.mesh) }
      
      const geometry = new THREE.PlaneBufferGeometry(this.size, this.size)

      const material = new THREE.MeshBasicMaterial({
        color: 0x050505,
        depthWrite: false,
        transparent: false,
      })

      this.mesh = new THREE.Mesh(geometry, material)
      
      this.object.rotation.x = -Math.PI/2
      this.object.position.y = -5.0
      this.object.add(this.mesh)
    },

    update(_delta) {
      if (!this.mesh) {
        this._createMesh()
      }
    }
  }
})

const Background = stampit(
  Entity,
  HasObject,
  HasPlane
).setType('background')

export { Background }
