import stampit from 'stampit'
import {
  Mesh,
  MeshStandardMaterial,
  BufferGeometry,
  BufferAttribute,
  // Constants
  LinearFilter,
  ClampToEdgeWrapping,
  sRGBEncoding,
  AdditiveBlending,
  SubtractiveBlending,
  MultiplyBlending,
  DoubleSide,
} from 'three'

import { Component } from './component.js'
import { PhotoMaterial } from '../materials/photo_material.js'
import { defineGoal } from '../goals/goal.js'

const IMAGE_DEFAULT_COLOR = 0xffffff
const IMAGE_DEFAULT_ALPHA_TEST = 0.05

const UsesAssetAsImage = stampit(Component, {
  deepStatics: {
    goalDefinitions: {
      fold: defineGoal('pvt', { v: 0 }),
      flip: defineGoal('flp', { x: false, y: false }),
      material: defineGoal('mat', { type: 'default' }),
      renderOrder: defineGoal('ro', { v: 100 }),
      normalizedScale: defineGoal('nsc', { v: 1.0 }),
    },
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
        this.texture.minFilter = LinearFilter
        this.texture.wrapS = ClampToEdgeWrapping
        this.texture.wrapT = ClampToEdgeWrapping
        this.texture.encoding = sRGBEncoding

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
      const flip = this.goals.flip
      const fold = this.goals.fold.get('v')
      const materialType = this.goals.material.get('type')

      const geometry = this._createFoldingPlaneBufferGeometry(
        w,
        h,
        flip.get('x'),
        flip.get('y'),
        fold
      )
      const material = this._createMaterialWithDefaults(texture, materialType)
      const mesh = new Mesh(geometry, material)

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
    _createFoldingPlaneBufferGeometry(w, h, flipx, flipy, fold) {
      const top = h * (1.0 - fold)
      const bot = h * fold

      const geometry = new BufferGeometry()

      const vertices = new Float32Array([
        -w / 2,
        1.0,
        0.0, // lower-left
        w / 2,
        1.0,
        0.0, // to lower-right
        w / 2,
        top,
        0.0, // to upper-right
        -w / 2,
        top,
        0.0, // to upper-left
        -w / 2,
        1.0,
        bot, // protruding bottom left
        w / 2,
        1.0,
        bot, // protruding bottom right
      ])

      // Each triplet of the 4 triangles described by these indices is in counter-clockwise order
      const indices = [0, 1, 2, 2, 3, 0, 1, 0, 4, 4, 5, 1]

      // Map the image to the folding plane
      const uvs = new Float32Array([
        flipx ? 1.0 : 0.0,
        flipy ? 1.0 - fold : fold,
        flipx ? 0.0 : 1.0,
        flipy ? 1.0 - fold : fold,
        flipx ? 0.0 : 1.0,
        flipy ? 0.0 : 1.0,
        flipx ? 1.0 : 0.0,
        flipy ? 0.0 : 1.0,
        flipx ? 1.0 : 0.0,
        flipy ? 1.0 : 0.0,
        flipx ? 0.0 : 1.0,
        flipy ? 1.0 : 0.0,
      ])

      geometry.setIndex(indices)
      geometry.setAttribute('position', new BufferAttribute(vertices, 3))
      geometry.setAttribute('uv', new BufferAttribute(uvs, 2))
      geometry.computeVertexNormals()

      return geometry
    },

    _createMaterial(texture, materialType) {
      switch (materialType) {
        // TODO: GLSL shader language changed during upgrade to THREE.js r120
        //       so we need to re-enable 'PhotoMaterial' with proper shader code

        // case 'photo':
        //   return PhotoMaterial({ texture })
        // case 'add':
        //   return PhotoMaterial({ texture, blending: AdditiveBlending })
        // case 'subtract':
        //   return PhotoMaterial({ texture, blending: SubtractiveBlending })
        // case 'multiply':
        //   return PhotoMaterial({ texture, blending: MultiplyBlending })
        default:
          return new MeshStandardMaterial({
            map: texture,
            side: DoubleSide,
          })
      }
    },

    _createMaterialWithDefaults(texture, materialType) {
      const material = this._createMaterial(texture, materialType)

      material.alphaTest = IMAGE_DEFAULT_ALPHA_TEST
      material.premultipliedAlpha = true
      material.transparent = true
      material.needsUpdate = true

      return material
    },

    _setMesh(mesh) {
      if (this.mesh) {
        this.object.remove(this.mesh)
      }
      this.mesh = mesh
      this.object.add(this.mesh)
      this.emit('mesh-updated')
    },

    update(_delta) {
      const foldGoal = this.goals.fold
      const flipGoal = this.goals.flip
      const materialGoal = this.goals.material
      const orderGoal = this.goals.renderOrder
      const normScaleGoal = this.goals.normalizedScale
      if (
        this.texture &&
        (!foldGoal.achieved ||
          !flipGoal.achieved ||
          !materialGoal.achieved ||
          !normScaleGoal.achieved ||
          (!orderGoal.achieved && this.object.children.length > 0))
      ) {
        this._createImageMeshFromLoadedTexture(this.texture)
        this.object.traverse((o) => (o.renderOrder = orderGoal.get('v')))
        foldGoal.markAchieved()
        flipGoal.markAchieved()
        materialGoal.markAchieved()
        orderGoal.markAchieved()

        const n = normScaleGoal.get('v')
        this.mesh.scale.set(n, n, n)
        normScaleGoal.markAchieved()
      }
    },
  },
})

export { UsesAssetAsImage }
