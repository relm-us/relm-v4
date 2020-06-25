import stampit from 'stampit'

import { Component } from './component.js'

const EMISSIVE_NO_EMISSION_COLOR = new THREE.Color(0x000000)
const EMISSIVE_DEFAULT_COLOR = new THREE.Color(0x666600)

const HasEmissiveMaterial = stampit(Component, {
  init({ emissiveColor }) {
    if (emissiveColor) {
      this._emissiveColor = emissiveColor
    } else {
      this._emissiveColor = EMISSIVE_DEFAULT_COLOR
    }
    
    this.on('mesh-updated', () => {
      this.applyEmissive()
    })
    this.on('select', () => {
      this.enableEmissive()
    })
    this.on('deselect', () => {
      this.disableEmissive()
    })
  },

  methods: {
    enableEmissive() {
      this._emissive = true
      this.applyEmissive()
    },

    disableEmissive() {
      this._emissive = false
      this.applyEmissive()
    },
    
    setEmissiveColor(color) {
      this._emissiveColor = color
    },
    
    applyEmissive() {
      const color = this._emissive ? this._emissiveColor : EMISSIVE_NO_EMISSION_COLOR
      this.object.traverse(o => {
        if (o.isMesh) {
          o.material.emissive = color
        }
      })
    },
  }
})

export { HasEmissiveMaterial }
