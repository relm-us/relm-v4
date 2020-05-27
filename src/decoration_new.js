import stampit from 'stampit'

import { Entity } from './entity.js'
import { Component } from './component'
import { HasObject } from './has_object_new.js'
// import { HasEmissiveMaterial } from './has_emissive_material.js'
// import { ReceivesPointer } from './receives_pointer.js'
// import { FollowsTarget } from './follows_target.js'
import { CanAddGoal, Equal } from './goal.js'
import { LoadsAsset } from './loads_asset_new.js'

const IMAGE_DEFAULT_COLOR = 0xFFFFFF
const IMAGE_DEFAULT_ALPHA_TEST = 0.2

const { MathUtils } = THREE

const HasImage = stampit({
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
        
        /**
         * Since we aren't using `repeat`, we can use LinearFilter with ClampToEdgeWrapping, and
         * textures will not need to be resized to power-of-two. This prevents "Texture has been resized"
         * warnings in the console and ultimately makes things faster since we don't need any pause-
         * the-world events to create power-of-two mipmapped textures.
         */
        this.texture.minFilter = THREE.LinearFilter
        this.texture.wrapS = THREE.ClampToEdgeWrapping
        this.texture.wrapT = THREE.ClampToEdgeWrapping
        
        // Since we're using a clone, and updating its properties, we need to set this flag or risk being ignored
        this.texture.needsUpdate = true

        this._createImageMeshFromLoadedTexture(this.texture)
      } else {
        this.texture = null
      }
    },
    
    _createImageMeshFromLoadedTexture(texture) {
      const w = texture.image.width
      const h = texture.image.height
      
      const geometry = new THREE.PlaneGeometry(w, h)
      
      const material = new THREE.MeshStandardMaterial({
        color: IMAGE_DEFAULT_COLOR,
        alphaTest: IMAGE_DEFAULT_ALPHA_TEST,
        transparent: true,
        map: texture,
      })
      
      const mesh = new THREE.Mesh(geometry, material)
      mesh.receiveShadow = true
      this._setMesh(mesh)
    },

    _setMesh(mesh) {
      if (this.mesh) { this.object.remove(this.mesh) }
      this.mesh = mesh
      this.object.add(this.mesh)
      this.emit('object-modified')
    }
  }
})


const HasScaleGoal = stampit(CanAddGoal, {
  init() {
    this.addGoal('s',
      ['x', 1.0, Equal.Delta(0.001)],
      ['y', 1.0, Equal.Delta(0.001)],
      ['z', 1.0, Equal.Delta(0.001)],
    )
  }
})

const AnimatesScaling = stampit(Component, HasScaleGoal, {
  init() {
    this._scale = new THREE.Vector3()
  },

  methods: {
    update(_delta) {
      const scaleGoal = this.goals.s
      if (!scaleGoal.achieved) {
        ['x', 'y', 'z'].forEach((axis) => {
          scaleGoal.fastForward(axis)
          if (scaleGoal.pastDue(axis)) {
            const value = scaleGoal.get(axis)
            this.object.scale[axis] = scaleGoal.get(axis)
          } else {
            this.object.scale[axis] = MathUtils.lerp(this.object.scale[axis], scaleGoal.get(axis), 0.1)
          }
          scaleGoal.markAchievedIfEqual(axis, this.object.scale[axis])
        })
      }
    }
  }
})

const HasRotateGoal = stampit(CanAddGoal, {
  init() {
    this.addGoal('r',
      ['x', 0.0, Equal.Delta(0.01)],
      ['y', 0.0, Equal.Delta(0.01)],
      ['z', 0.0, Equal.Delta(0.01)],
    )
  }
})

const AnimatesRotation = stampit(Component, HasRotateGoal, {
  init() {
    this._rotation = new THREE.Euler()
    this._quaternion = new THREE.Quaternion()
  },

  methods: {
    update(_delta) {
      const rotationGoal = this.goals.r;
      if (!rotationGoal.achieved) {
        rotationGoal.fastForward()
        if (rotationGoal.allPastDue()) {
          this.object.rotation.x = rotationGoal.x
          this.object.rotation.y = rotationGoal.y
          this.object.rotation.z = rotationGoal.z
          rotationGoal.markAllAchieved()
        } else {
          this._rotation.x = rotationGoal.x
          this._rotation.y = rotationGoal.y
          this._rotation.z = rotationGoal.z
          
          this._quaternion.setFromEuler(this._rotation)
          this.object.quaternion.slerp(this._quaternion, 0.1)
          const angleDelta = Math.abs(this.object.quaternion.angleTo(this._quaternion))
          if (angleDelta < 0.01) {
            rotationGoal.markAllAchieved()
          }
        }
      }
    }
  }
})

const HasPositionGoal = stampit(CanAddGoal, {
  init() {
    this.addGoal('p',
      ['x', 0.0, Equal.Delta(0.01)],
      ['y', 0.0, Equal.Delta(0.01)],
      ['z', 0.0, Equal.Delta(0.01)],
    )
  }
})

const AnimatesPosition = stampit(Component, HasPositionGoal, {
  init() {
    this._position = new THREE.Vector3()
  },

  methods: {
    update(_delta) {
      const positionGoal = this.goals.p
      if (!positionGoal.achieved) {
        positionGoal.fastForward()
        if (positionGoal.allPastDue()) {
          this.object.position.copy(this.goals.p)
          positionGoal.markAllAchieved()
        } else {
          this._position.copy(this.goals.p)
          this.object.position.lerp(this._position, 0.1)
          const distance = this.object.position.distanceTo(this._position)
          if (distance < 0.01) {
            positionGoal.markAllAchieved()
          }
        }
      }
    }
  }
})

const DecorationNew = window.DecorationNew = stampit(
  Entity,
  HasObject,
  LoadsAsset,
  HasImage,
  AnimatesScaling,
  AnimatesRotation,
  AnimatesPosition,
  // HasEmissiveMaterial,
  // ReceivesPointer,
  // FollowsTarget,
)

export { DecorationNew }