import stampit from 'stampit'

import { Component } from './component.js'
import { defineGoal } from '../goals/goal.js'

const IMAGE_DEFAULT_COLOR = 0xFFFFFF
const IMAGE_DEFAULT_ALPHA_TEST = 0.2

const UsesAssetAsImage = stampit(Component, {
  deepStatics: {
    goalDefinitions: {
      fold: defineGoal('pvt', { v: 0 })
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
      const fold = this.goals.fold
      
      const geometry = this._createFoldingPlaneBufferGeometry(w, h, fold.get('v'))
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
      this.emit('mesh-updated')
    },

    
    update(_delta) {
      const foldGoal = this.goals.fold
      if (!foldGoal.achieved && this.texture) {
        this._createImageMeshFromLoadedTexture(this.texture)
        foldGoal.markAchieved()
      }
    }
  }
})

export { UsesAssetAsImage }
