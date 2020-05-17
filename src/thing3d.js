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
import { LoadsAsset } from './loads_asset.js'

const DEFAULT_SIZE = 100

/**
 * Returns a ratio that can be used to multiply by the object's current size so as to
 * scale it up or down to the desired largestSide size.
 * 
 * @param {Object3D} object3d The THREE.Object3D whose size is of interest
 * @param {number} largestSide The size of the desired "largest side" after scaling
 */
const getScaleRatio = (object3d, largestSide) => {
  const bbox = new THREE.Box3().setFromObject(object3d)
  console.log('scalefornorm bbox', bbox, object3d)
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
  return ratio
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
    fastforward: {
      quaternion: true,
    },
    state: {
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

  init({ scale, quaternion }) {
    if (scale) {
      this.state.scale.now = this.state.scale.target = scale
    }
    
    this.state.quaternion.now = new THREE.Quaternion(0, 0, 0, 1)
    this.state.quaternion.target = new THREE.Quaternion()
    if (quaternion) {
      const q = quaternion
      const qtarget = this.state.quaternion.target
      if ('_x' in q) {
        qtarget.set(q._x, q._y, q._z, q._w)
      } else if ('x' in q) {
        qtarget.set(q.x, q.y, q.z, q.w)
      } else {
        console.error('Thing3D expects quaternion to have `x` or `_x` keys', quaternion)
      }
    }
    
    this.loader = addDynamicGltfTo
    this.on('loaded', (gltf) => {
      if (gltf) {
        this.setGltf(gltf)
        this.setScaleFromState()
      }
    })
  },

  methods: {
    setGltf(gltf) {
      // Search for mesh within scene
      const child = findFirstMesh(gltf.scene)
      if (child) {
        child.scale.set(1, 1, 1)
        child.position.set(0, 0, 0)
        this.object.add(child)
      } else {
        console.warn("Couldn't find first mesh in GLTF scene", gltf.scene)
      }
    },
    
    normalize() {
      const ratio = getScaleRatio(this.object, DEFAULT_SIZE)
      const scale = this.state.scale.target
      this.state.scale.target = scale * ratio
    },
    
    setScale(scale) {
      this.state.scale.target = scale
    },
    
    setScaleFromState() {
      const scale = this.state.scale.now
      this.object.scale.set(scale, scale, scale)
    },
    
    setRotation(radians) {
      console.log('setRotation', radians, this.state.quaternion)
      this.state.quaternion.target.setFromAxisAngle(this.object.up, radians)
    },
    
    setQuaternionFromState() {
      this.object.quaternion.copy(this.state.quaternion.now)
    },
    
    update(delta) {
      const scaleDelta = Math.abs(this.state.scale.now - this.state.scale.target)
      if (scaleDelta > 0.01) {
        this.state.scale.now = this.state.scale.target
        this.setScaleFromState()
      }
      
      const angleDelta = Math.abs(this.state.quaternion.now.angleTo(this.state.quaternion.target))
      if (angleDelta > 0.01) {
        if (this.fastforward.quaternion) {
          this.state.quaternion.now.copy(this.state.quaternion.target)
          this.fastforward.quaternion = false
        } else {
          this.state.quaternion.now.slerp(this.state.quaternion.target, 0.1)
        }
        this.setQuaternionFromState()
      }
    }
  }
})

const Thing3D = stampit(
  Entity,
  HasObject,
  LoadsAsset,
  HasThing3D,
  HasEmissiveMaterial,
  CanUiLock,
  ReceivesPointer,
  FollowsTarget,
  NetworkSetsState
)

export { Thing3D }