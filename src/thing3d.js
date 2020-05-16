import stampit from 'stampit'

import { Entity } from './entity.js'
import { Component } from './component.js'
import { HasObject } from './has_object.js'
import { HasEmissiveMaterial } from './has_emissive_material.js'
import { CanUiLock } from './can_ui_lock.js'
import { ReceivesPointer } from './receives_pointer.js'
import { FollowsTarget } from './follows_target.js'
import { NetworkSetsState } from './network_persistence.js'

import { addDynamicGltfTo } from './manifest_loaders.js'

const DEFAULT_SIZE = 100

const getClonedMesh = (gltf) => {
  let mesh
  gltf.scene.traverse( o => {
    if (o.isMesh) {
      mesh = o
    }
  })
  if (mesh) {
    return mesh.clone()
  }
}

const resizeObject3D = (object3d, largestSide) => {
  const bbox = new THREE.Box3().setFromObject(object3d)
  let size = new THREE.Vector3()
  bbox.getSize(size)
  let ratio
  if (size.x > size.y && size.x > size.z) {
    ratio = largestSide / size.x
  } else if (size.x > size.z) {
    ratio = largestSide / size.y
  } else {
    ratio = largestSide / size.z
  }
  object3d.scale.multiplyScalar(ratio)
}

const findFirstMesh = (object3d) => {
  if (object3d.type === 'Object3D' || object3d.type === 'Mesh') {
    return object3d
  }
  for (let child of object3d.children) {
    return findFirstMesh(child)
  }
}

const HasThing3D = stampit(Component, {
  deepProps: {
    state: {
      asset: {
        now: {id: null, url: null},
        target: {id: null, url: null},
      },
      scale: {
        now: 1.0,
        target: 1.0,
      },
      quaternion: {
        now: null,
        target: null,
      }
    }
  },

  init({ asset, scale, quaternion }) {
    if (asset) {
      this.state.asset.now = asset
      Object.assign(this.state.asset.target, this.state.asset.now)
      this.loadAsset(this.state.asset.now)
    }
    
    if (scale) {
      this.state.scale.now = this.state.scale.target = scale
    }
    
    this.state.quaternion.now = new THREE.Quaternion()
    this.state.quaternion.target = new THREE.Quaternion()
    if (quaternion) {
      this.state.quaternion.now.copy(quaternion)
      this.state.quaternion.target.copy(quaternion)
    }
  },

  methods: {
    /**
     * Loads a given asset as the mesh. Uses ResourceLoader so we keep a local cache
     * of material and mesh, and save on load time in case of redundancy.
     */
    async loadAsset() {
      const asset = this.state.asset.now
      
      // Register this uploaded image as a resource that can be used as a texture
      await addDynamicGltfTo(this.resources, asset.id, asset.url)
      
      // Get the texture and create a decoration locally
      try {
        const gltf = await resources.getAsync(asset.id)
        if (gltf) { 
          this.setGltf(gltf) }
      } catch (err) {
        console.warn("Can't load gltf", err)
      }
    },
    
    setGltf(gltf) {
      // Search for mesh within scene
      const object = findFirstMesh(gltf.scene)
      if (object) {
        object.scale.set(1, 1, 1)
        object.position.set(0, 0, 0)
        resizeObject3D(object, DEFAULT_SIZE)
        this.object.add(object)
        // Adjust object so it's centered & sitting on the ground
        // const globalbbox = new THREE.Box3().setFromObject(this.object)
        // this.state.position.target.y -= globalbbox.y
      }
    },
    
    update(delta) {
      if (this.state.asset.now.id !== this.state.asset.target.id) {
        Object.assign(this.state.asset.now, this.state.asset.target)
        this.loadAsset()
      }
    }
  }
})

const Thing3D = stampit(
  Entity,
  HasObject,
  HasThing3D,
  HasEmissiveMaterial,
  CanUiLock,
  ReceivesPointer,
  FollowsTarget,
  NetworkSetsState
)

export { Thing3D }