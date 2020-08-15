import stampit from 'stampit'
import EventEmittable from '@stamp/eventemittable'

import { Component } from './component.js'
import { defineGoal } from '../goals/goal.js'

import { GLTFLoader } from '../lib/GLTFLoader.js'
import { MeshoptGLTFLoader } from '../lib/MeshoptGLTFLoader.js'

import { checkWebpFeature } from '../util.js'

const IMAGE_FILETYPE_RE = /\.(png|gif|jpg|jpeg|webp)$/
const GLTF_PACKED_FILETYPE_RE = /\.packed-(gltf|glb)$/
const GLTF_FILETYPE_RE = /\.(gltf|glb)$/

let hasWebpSupport = true
checkWebpFeature('alpha', (feature, result) => {
  hasWebpSupport = result
})

// Loader for regular GLTFs and GLBs
const regularGLTFLoader = new GLTFLoader()

// Loader for packed GLTFs and GLBs (see https://github.com/zeux/meshoptimizer/tree/master/gltf)
const meshoptGLTFLoader = new MeshoptGLTFLoader()

// Loader for Textures
const textureLoader = new THREE.TextureLoader()

const getLoaderFromUrl = (url) => {
  if (!url.match) {
    console.error('URL is is not a string', url)
  }
  if (url.match(IMAGE_FILETYPE_RE)) {
    return textureLoader
  } else if (url.match(GLTF_PACKED_FILETYPE_RE)) {
    return meshoptGLTFLoader
  } else if (url.match(GLTF_FILETYPE_RE)) {
    return regularGLTFLoader
  } else {
    console.warn(`Can't match loader for asset at URL '${url}'`)
  }
}

const LoadsAsset = stampit(Component, EventEmittable, {
  deepStatics: {
    goalDefinitions: {
      asset: defineGoal('ast', { url: null, alt: null }),
    },
  },

  init() {
    this.asset = null
  },

  methods: {
    loadAsset() {
      const url = this.goals.asset.get(hasWebpSupport ? 'url' : 'alt')
      console.log('url', hasWebpSupport, url)
      if (url) {
        const loader = getLoaderFromUrl(url)
        if (!loader) return
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
        this.goals.asset.markAchieved()
      }
    },
  },
})

export {
  LoadsAsset,
  IMAGE_FILETYPE_RE,
  GLTF_FILETYPE_RE,
  GLTF_PACKED_FILETYPE_RE,
}
