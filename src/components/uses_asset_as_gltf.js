import stampit from 'stampit'

import { Component } from './component.js'

const findFirstMesh = (object3d) => {
  if (object3d.type === 'Object3D' || object3d.type === 'Mesh') {
    return object3d
  }
  for (let child of object3d.children) {
    return findFirstMesh(child)
  }
}

const UsesAssetAsGltf = stampit(Component, {
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
        console.log('set gltf', this.child, gltf)
        // this._createMeshFromLoadedGltf(this.child)
      } else {
        this.child = null
      }
    },
    

    // _setMesh(mesh) {
    //   if (this.mesh) { this.object.remove(this.mesh) }
    //   this.mesh = mesh
    //   this.object.add(this.mesh)
    //   this.emit('mesh-updated')
    // },

    
    // update(_delta) {
    // }
  }
})

export { UsesAssetAsGltf }
