import stampit from 'stampit'
import EventEmittable from '@stamp/eventemittable'

import { Component } from './component.js'
import { CanAddGoal, Equal } from './goal.js'

import { GLTFLoader } from './lib/GLTFLoader.js'


// Loader for regular GLTFs and GLBs
const regularGLTFLoader = new GLTFLoader()

// Loader for Textures
const textureLoader = new THREE.TextureLoader()


const getLoaderFromUrl = (url) => {
  if (!url.match) { console.error('URL is is not a string', url) }
  if (url.match(/\.(png|jpg|jpeg|webp)$/)) {
    return textureLoader
  } else if (url.match(/\.(glb|gltf)/)) {
    return regularGLTFLoader
  } else {
    throw Error(`Can't match loader for asset at URL '${url}'`)
  }
}

const LoadsAsset = stampit(CanAddGoal, Component, EventEmittable, {
  init() {
    this.addGoal('asset', { url: null })
    this.asset = null
  },

  methods: {
    loadAsset() {
      const url = this.goals.asset.url
      // console.log('loadAsset', url)
      if (url) {
        const loader = getLoaderFromUrl(url)
        this.asset = loader.load(url, () => {
          this.emit('asset-loaded', this.asset, url)
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

export { LoadsAsset }
