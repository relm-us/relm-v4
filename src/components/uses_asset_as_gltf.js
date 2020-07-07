import stampit from 'stampit'

import { Component } from './component.js'
import { defineGoal } from '../goals/goal.js'

const findFirstMesh = (object3d) => {
  if (object3d.type === 'Object3D' || object3d.type === 'Mesh' || object3d.type === 'Group') {
    return object3d
  }
  for (let child of object3d.children) {
    return findFirstMesh(child)
  }
}

const UsesAssetAsGltf = stampit(Component, {
  deepStatics: {
    goalDefinitions: {
      normalizedScale: defineGoal('nsc', { v: 1.0 })
    }
  },

  init() {
    this.geometry = null
    this.material = null
    this.mesh = null
    
    this.child = null
    
    this.on('asset-loaded', this._setGltf)
  },

  methods: {
    _setGltf(gltf) {
      if (gltf) {
        this.child = findFirstMesh(gltf.scene)
        if (this.child) {
          this.child.scale.set(1, 1, 1)
          this._centerGltf(this.child)
          this.object.add(this.child)
        } else {
          console.warn("Couldn't find first mesh in GLTF scene", gltf.scene)
        }
      } else {
        this.child = null
      }
    },

    _centerGltf(object3d) {
      object3d.position.set(0, 0, 0)
      if (object3d.type === 'Group') {
        const meshes = object3d.children.filter(child => child.type === 'Mesh')
        const center = this._getCenter(meshes)
        for (const child of meshes) {
          child.position.x -= center.x
          child.position.y -= center.y
          child.position.z -= center.z
        }
      }
    },
    
    _getCenter(objects) {
      const center = {x: 0, y: 0, z: 0}
      const size = objects.length
      for (const obj of objects) {
        center.x += obj.position.x
        center.y += obj.position.y
        center.z += obj.position.z
      }
      center.x /= size
      center.y /= size
      center.z /= size

      return center
    },

    update(_delta) {
      const normScaleGoal = this.goals.normalizedScale
      if (!normScaleGoal.achieved && this.child) {
        const n = normScaleGoal.get('v')
        this.child.scale.set(n, n, n)
        normScaleGoal.markAchieved()
      }
    }
  }
})

export { UsesAssetAsGltf }
