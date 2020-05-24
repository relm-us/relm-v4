import stampit from 'stampit'
import EventEmittable from '@stamp/eventemittable'

import { Component } from './component.js'


const LoadingState = {
  UNSENT: 0,
  LOADING: 1,
  DONE: 2,
}

const LoadsAsset = stampit(Component, EventEmittable, {
  props: {
    loadingState: LoadingState.UNSENT,
    loadedAsset: null,
    loader: null,
  },

  deepProps: {
    state: {
      asset: {
        now: {id: null, url: null},
        target: {id: null, url: null},
      },
    }
  },


  init({ asset, loader }) {
    if (asset) {
      Object.assign(this.state.asset.target, asset)
    }
    
    // The loader should be a function such as 
    if (loader) {
      this.loader = loader
    }
  },

  methods: {
    loadAsset() {
      switch(this.loadingState) {
        case LoadingState.UNSENT:
          const asset = this.state.asset.target
          this.loader(asset.url).then((gltf) => {
            this.loadedAsset = gltf
            this.loadingState = LoadingState.DONE
          }, (rejectReason) => {
            this.loadedAsset = null
            this.loadingState = LoadingState.DONE
            console.error('Unable to load asset:', rejectReason, asset)
          })
          this.loadingState = LoadingState.LOADING
          break
        case LoadingState.LOADING:
          break
        case LoadingState.DONE:
          Object.assign(this.state.asset.now, this.state.asset.target)
          this.emit('loaded', this.loadedAsset)
          this.loadingState = LoadingState.UNSENT
          break
      }
    },

    update(_delta) {
      if (this.state.asset.now.id !== this.state.asset.target.id) {
        this.loadAsset()
      }
    }
  }
})

export { LoadsAsset }
