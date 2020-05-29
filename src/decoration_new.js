import stampit from 'stampit'

import { Entity } from './entity.js'
import { Component } from './components/component.js'
import { HasObject } from './components/has_object_new.js'
import { HasEmissiveMaterial } from './components/has_emissive_material.js'
import { ReceivesPointer } from './receives_pointer.js'
// import { FollowsTarget } from './follows_target.js'
import { CanAddGoal, Equal } from './goals/goal.js'
import { LoadsAsset } from './components/loads_asset_new.js'
import { Network } from './network.js'
import { VisibleEdges } from './visible_edges.js'
import { HasPivotGoal } from './goals/has_pivot_goal.js'
import { AnimatesScale } from './components/animates_scale.js'

const IMAGE_DEFAULT_COLOR = 0xFFFFFF
const IMAGE_DEFAULT_ALPHA_TEST = 0.2

const UsesAssetAsImage = stampit(Component, HasPivotGoal, {
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
      const pivot = this.goals.pivot.get()
      
      const geometry = this._createFoldingPlaneBufferGeometry(w, h, pivot.y)
      const material = this._createMaterial(texture)
      const mesh = new THREE.Mesh(geometry, material)
    
      this._setMesh(mesh)
    },
    
    /**
     * Creates a "FoldingPlaneBufferGeometry" which is basically an L-shaped PlaneBuffer. This is used
     * to create the illusion that part of an image can be walked on ("below the fold") while part of
     * the image is standing up ("above the fold").
     * 
     * @param {number} w - width of the image (texture)
     * @param {number} h - height of the image (texture)
     * @param {number} fold - a number from 0.0 to 1.0: the point at which the image should "fold".
     *                        0.0 means there is no fold (the entire image is "up", above the fold),
     *                        while 1.0 also means there is no fold (the entire image is "down", below
     *                        the fold)
     */
    _createFoldingPlaneBufferGeometry(w, h, fold) {
      const top = h * (1.0 - fold)
      const bot = h * fold
      
      const geometry = new THREE.BufferGeometry()
      
      const vertices = new Float32Array([
        -w/2, 1.0, 0.0, // lower-left
         w/2, 1.0, 0.0, // to lower-right
         w/2, top, 0.0, // to upper-right
        -w/2, top, 0.0, // to upper-left
        -w/2, 1.0, bot, // protruding bottom left
         w/2, 1.0, bot, // protruding bottom right
      ])
      
      // Each triplet of the 4 triangles described by these indices is in counter-clockwise order
      const indices = [
        0, 1, 2,
        2, 3, 0,
        1, 0, 4,
        4, 5, 1,
      ]
      
      // Map the image to the folding plane
      const uvs = new Float32Array([
        0.0, fold,
        1.0, fold,
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,
        1.0, 0.0,
      ])
      
      geometry.setIndex(indices)
      geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
      geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
      geometry.computeVertexNormals()
      
      return geometry
    },

    _createMaterial(texture) {
      return new THREE.MeshStandardMaterial({
        color: IMAGE_DEFAULT_COLOR,
        alphaTest: IMAGE_DEFAULT_ALPHA_TEST,
        transparent: true,
        side: THREE.DoubleSide,
        map: texture,
      })
    },

    _setMesh(mesh) {
      if (this.mesh) { this.object.remove(this.mesh) }
      this.mesh = mesh
      this.object.add(this.mesh)
      this.emit('object-modified')
    },

    
    update(_delta) {
      const pivotGoal = this.goals.pivot
      if (!pivotGoal.achieved && this.texture) {
        this._createImageMeshFromLoadedTexture(this.texture)
        pivotGoal.markAchieved()
      }
    }
  }
})


      


const HasRotateGoal = stampit(CanAddGoal, {
  init() {
    this.addGoal('r', { x: 0.0, y: 0.0, z: 0.0 })
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
        if (rotationGoal.isPastDue()) {
          const r = rotationGoal.get()
          this.object.rotation.set(r.x, r.y, r.z)
          rotationGoal.markAchieved()
        } else {
          const r = rotationGoal.get()
          this._rotation.set(r.x, r.y, r.z)
          this._quaternion.setFromEuler(this._rotation)
          this.object.quaternion.slerp(this._quaternion, 0.1)
          const angleDelta = Math.abs(this.object.quaternion.angleTo(this._quaternion))
          if (angleDelta < 0.01) {
            rotationGoal.markAchieved()
          }
        }
      }
    }
  }
})

const HasPositionGoal = stampit(CanAddGoal, {
  init() {
    this.addGoal('p', { x: 0.0, y: 0.0, z: 0.0 }, {
      equals: Equal.Distance(0.01)
    })
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
        if (positionGoal.isPastDue()) {
          this.object.position.copy(positionGoal.get())
          positionGoal.markAchieved()
        } else {
          this._position.copy(positionGoal.get())
          this.object.position.lerp(this._position, 0.1)
          positionGoal.markAchievedIfEqual(this.object.position)
        }
      }
    }
  }
})


const GoalsAreNetworkSettable = stampit({
  init() {
    this.on(`update-goal-${this.uuid}`, this.updateGoals)
  },
  
  methods: {
    updateGoals(state) {
      state.forEach((stateMap, goalName) => {
        if (goalName === '@type') return
        const goal = this.goals[goalName]
        if (goal) {
          const state = stateMap.toJSON()
          const due = stateMap.get('@due')
          delete state['@due']
          goal.set(state, due)
        }
      })
    }
  }
})

const Typed = stampit({
  statics: {
    setType(type) {
      this.type = type
      Network.registerType(type, this)
      return this
    }
  },
  init(_, { stamp }) {
    this.type = stamp.type
  }
})

const DecorationNew = window.DecorationNew = stampit(
  Entity,
  Typed,
  HasObject,
  LoadsAsset,
  UsesAssetAsImage,
  AnimatesScale,
  AnimatesRotation,
  AnimatesPosition,
  GoalsAreNetworkSettable,
  HasEmissiveMaterial,
  ReceivesPointer,
  // FollowsTarget,
  {
    init() {
      this.edges = VisibleEdges({
        object: this.object,
      })
      this.on('object-modified', () => {
        this.edges.enable()
      })
    }
  }
).setType('decoration')

export { DecorationNew }