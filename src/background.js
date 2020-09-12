import stampit from 'stampit'
import { Mesh, PlaneBufferGeometry, MeshBasicMaterial } from 'three'

import { Entity } from './entity.js'
import { HasObject } from './components/has_object.js'
import { Component } from './components/component.js'

const HasPlane = stampit(Component, {
  init({ size }) {
    this.size = size || 10000000
  },

  methods: {
    _createMesh(size) {
      if (this.mesh) {
        this.object.remove(this.mesh)
      }

      const geometry = new PlaneBufferGeometry(this.size, this.size)

      const material = new MeshBasicMaterial({
        color: 0x050505,
        depthWrite: false,
        transparent: false,
      })

      this.mesh = new Mesh(geometry, material)
      this.mesh.visible = false

      this.object.rotation.x = -Math.PI / 2
      this.object.position.y = -5.0
      this.object.add(this.mesh)
    },

    update(_delta) {
      if (!this.mesh) {
        this._createMesh()
      }
    },
  },
})

const Background = stampit(Entity, HasObject, HasPlane).setType('background')

export { Background }
