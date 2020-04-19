import stampit from 'stampit'

import { Component } from './component.js'
import { addDynamicImageTo } from './manifest_loaders.js'

const {
  PlaneGeometry,
  MeshPhongMaterial,
  Mesh,
} = THREE

const Orientation = {
  up: 0,
  left: 1,
  right: 2,
  down: 3
}

/**
 * 
 * @typedef {AssetDesc}
 * @property {string} id A unique identifier for the asset (usually a UUID)
 * @property {string} url The URL of the asset, e.g. http://y.relm.us/asset/48340adf-e2a8-4c45-8185-23bf92cdea84.png
 */

const HasImage = stampit(Component, {
  props: {
    texture: null,
  },
  
  deepProps: {
    state: {
      orientation: {
        now: Orientation.up,
        target: Orientation.up,
      },
      imageScale: {
        now: 1.0,
        target: 1.0,
      },
      asset: {
        // @type {AssetDesc}
        now: {id: null, url: null},
        target: {id: null, url: null},
      },
    }
  },
  
  init({ asset, orientation, imageScale }) {
    this.geometry = null
    this.material = null
    this.mesh = null
    this.texture = null
    
    if (orientation) {
      this.state.orientation.now = this.state.orientation.target = orientation
    }
    
    if (imageScale) {
      this.state.imageScale.now = this.state.imageScale.target = imageScale
    }
    
    if (asset) {
      this.state.asset.now = asset
      Object.assign(this.state.asset.target, this.state.asset.now)
      this.loadAsset(this.state.asset.now)
    }
  },

  methods: {
    setTexture(texture) {
      this.texture = texture.clone()
      this.texture.needsUpdate = true
      
      this.texture.repeat.set(1, 1)
      this.texture.wrapS = THREE.RepeatWrapping
      this.texture.wrapT = THREE.RepeatWrapping

      this.geometry = new PlaneGeometry(
        this.texture.image.width,
        this.texture.image.height
      )
      console.log(this.texture)

      this.material = new MeshPhongMaterial({
        color: 0xffffff,
        map: this.texture,
        alphaTest: 0.2,
        transparent: true,
      })
      
      if (this.mesh) {
        this.object.remove(this.mesh)
      }
      
      this.mesh = new Mesh(this.geometry, this.material)
      this.mesh.receiveShadow = true
      
      this.object.add(this.mesh)
      
      this.setRotationFromState()
      this.setScaleFromState()
    },
    
    setRotationFromState() {
      const scale = this.state.imageScale.now
      switch(this.state.orientation.now) {
        case Orientation.up:
          // Standing up straight
          this.mesh.position.set(0, this.texture.image.height/2 * scale, 0)
          break;
        case Orientation.left:
          // Standing up, but rotated to the left
          this.mesh.position.set(0, this.texture.image.height/2 * scale, 0)
          this.mesh.rotation.y = Math.PI/4
          break;
        case Orientation.right:
          // Standing up, but rotated to the right
          this.mesh.position.set(0, this.texture.image.height/2 * scale, 0)
          this.mesh.rotation.y = -Math.PI/4
          break;
        case Orientation.down:
          // Place it flat, and *slightly* above the ground
          this.mesh.position.set(0, 0.5, 0)
          this.mesh.rotation.x = -Math.PI/2
          break;
      }
    },
    
    setScaleFromState() {
      const scale = this.state.imageScale.now
      this.mesh.scale.set(scale, scale, scale)
    },
    
    /**
     * Loads a given asset as the image texture. Uses ResourceLoader so we keep a local cache
     * of images and save on load time in case of redundancy.
     * 
     * @param {AssetDesc} asset 
     */
    async loadAsset(asset) {
      // Register this uploaded image as a resource that can be used as a texture
      await addDynamicImageTo(this.resources, asset.id, asset.url)
      
      // Get the texture and create a decoration locally
      const texture = await resources.getAsync(asset.id)
      this.setTexture(texture)
    },
    
    setup() {
      console.log('HasImage setup')
    },

    update(delta) {
      if (this.state.orientation.now !== this.state.orientation.target) {
        // TODO: animate  
        this.state.orientation.now = this.state.orientation.target
        this.setRotationFromOrientation()
      }
      
      const imageScaleDelta = Math.abs(this.state.imageScale.now - this.state.imageScale.target)
      if (imageScaleDelta > 0.01) {
        this.state.imageScale.now = this.state.imageScale.target
        this.setScaleFromState()
      }
      
      if (this.state.asset.now.id !== this.state.asset.target.id) {
        Object.assign(this.state.asset.now, this.state.asset.target)
        this.loadAsset(this.state.asset.now)
      }
    }
    
  }
})

export { HasImage }
