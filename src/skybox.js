import stampit from 'stampit'

import { EntityShared } from './entity_shared.js'
import { Component } from './components/component.js'
import { LoadsAsset } from './components/loads_asset.js'

const UsesAssetAsSkybox = stampit(Component, {
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
        
        const canvasAspect = this.stage.width / this.stage.height
        const imageAspect = this.texture.image.width / this.texture.image.height
        const aspect = imageAspect / canvasAspect;

        this.texture.offset.x = aspect > 1 ? (1 - 1 / aspect) / 2 : 0
        this.texture.repeat.x = aspect > 1 ? 1 / aspect : 1

        this.texture.offset.y = aspect > 1 ? 0 : (1 - aspect) / 2
        this.texture.repeat.y = aspect > 1 ? 1 : aspect
        
        // Since we're using a clone, and updating its properties, we need to set this flag or risk being ignored
        this.texture.needsUpdate = true

        this.stage.scene.background = this.texture
      } else {
        this.texture = null
      }
    },
  }
})



const Skybox = stampit(
  EntityShared,
  LoadsAsset,
  UsesAssetAsSkybox,
).setType('skybox')


export { Skybox }


