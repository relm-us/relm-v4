import stampit from 'stampit'

import { Component } from './component.js'
import { defineGoal } from '../goals/goal.js'

const findFirstMesh = (object3d) => {
  if (object3d.type === 'Object3D' || object3d.type === 'Mesh') {
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
          this.child.position.set(0, 0, 0)
          this.object.add(this.child)
        } else {
          console.warn("Couldn't find first mesh in GLTF scene", gltf.scene)
        }
      } else {
        this.child = null
      }
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
