import stampit from 'stampit'
import EventEmittable from '@stamp/eventemittable'

import { Component } from './component.js'
import { defineGoal } from '../goals/goal.js'

import { GLTFLoader } from '../lib/GLTFLoader.js'


const IMAGE_FILETYPE_RE = /\.(png|gif|jpg|jpeg|webp)$/
const GLTF_FILETYPE_RE = /\.(gltf|glb)$/


// Loader for regular GLTFs and GLBs
const regularGLTFLoader = new GLTFLoader()

// Loader for Textures
const textureLoader = new THREE.TextureLoader()


const getLoaderFromUrl = (url) => {
  if (!url.match) { console.error('URL is is not a string', url) }
  if (url.match(IMAGE_FILETYPE_RE)) {
    return textureLoader
  } else if (url.match(GLTF_FILETYPE_RE)) {
    return regularGLTFLoader
  } else {
    console.warn(`Can't match loader for asset at URL '${url}'`)
  }
}

const LoadsAsset = stampit(Component, EventEmittable, {
  deepStatics: {
    goalDefinitions: {
      asset: defineGoal('ast', { url: null })
    }
  },
  
  init() {
    this.asset = null
  },

  methods: {
    loadAsset() {
      const url = this.goals.asset.get('url')
      if (url) {
        const loader = getLoaderFromUrl(url)
        this.asset = loader.load(url, (asset) => {
          this.emit('asset-loaded', asset, url)
        })
      } else {
        this.asset = null
        this.emit('asset-loaded', null, url)
      }
    },

    update(_delta) {
      if (!this.goals.asset.achieved) {
        this.loadAsset()
        this.goals.asset.markAchieved('url')
      }
    }
  }
})

export {
  LoadsAsset,
  IMAGE_FILETYPE_RE,
  GLTF_FILETYPE_RE,
}
