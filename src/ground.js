import stampit from 'stampit'

import { EntityShared } from './entity_shared.js'
import { Component } from './components/component.js'
import { HasObject } from './components/has_object.js'
import { HasEmissiveMaterial } from './components/has_emissive_material.js'
import { ReceivesPointer } from './receives_pointer.js'
import { LoadsAsset } from './components/loads_asset.js'
import { AnimatesPosition } from './components/animates_position.js'
import { defineGoal } from './goals/goal.js'

const UsesAssetAsGround = stampit(Component, {
  deepStatics: {
    goalDefinitions: {
      ground: defineGoal('ground', { type: 'circle', size: 1000, repeat: 2 }),
    }
  },
  
  init() {
    this.geometry = null
    this.material = null
    this.mesh = null
    
    this.texture = null
    
    this.on('asset-loaded', this._setTexture)
  },

  methods: {
    _setTexture(texture) {
      if (texture) {
        this.texture = texture.clone()
        
        this.texture.wrapS = THREE.RepeatWrapping
        this.texture.wrapT = THREE.RepeatWrapping
        this.texture.encoding = THREE.sRGBEncoding
        // this.texture.minFilter = THREE.LinearFilter
        
        // Since we're using a clone, and updating its properties, we need to set this flag or risk being ignored
        this.texture.needsUpdate = true

        this._createGroundMeshFromLoadedTexture(this.texture)
      } else {
        this.texture = null
      }
    },
    
    _createGeometry() {
      const groundSize = this.goals.ground.get('size')
      switch (this.goals.ground.get('type')) {
        case 'circle': return new THREE.CircleBufferGeometry(groundSize / 2, 60)
        case 'square': return new THREE.PlaneBufferGeometry(groundSize, groundSize)
        default:
          return new THREE.PlaneBufferGeometry(groundSize, groundSize)
      }
    },

    _createGroundMeshFromLoadedTexture(texture) {
      const geometry = this._createGeometry()

      const groundSize = this.goals.ground.get('size')
      const repeat = (groundSize / texture.image.width) / this.goals.ground.get('repeat')
      this.texture.repeat.set(repeat, repeat)
      
      const material = new THREE.MeshStandardMaterial({
        map: texture,
        side: THREE.DoubleSide,
        color: 0xAAAAAA,
        depthWrite: true,
        transparent: false,
      })

      const mesh = new THREE.Mesh(geometry, material)
      mesh.rotation.x = -Math.PI/2
      
      this._setMesh(mesh)
    },
    
    _setMesh(mesh) {
      if (this.mesh) { this.object.remove(this.mesh) }
      this.mesh = mesh
      this.object.add(this.mesh)
      this.emit('mesh-updated')
    },
    
    update(_delta) {
      const groundGoal = this.goals.ground
      if (this.texture && !groundGoal.achieved) {
        this._createGroundMeshFromLoadedTexture(this.texture)
        groundGoal.markAchieved()
      }
    }
  }
})



const Ground = stampit(
  EntityShared,
  HasObject,
  LoadsAsset,
  UsesAssetAsGround,
  AnimatesPosition,
  HasEmissiveMaterial,
  ReceivesPointer,
).setType('ground')


export { Ground }
