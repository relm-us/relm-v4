import stampit from 'stampit'

import { Component } from './component.js'

const COLOR_BLACK = new THREE.Color(0x000000)
const DECORATION_NORMAL_COLOR = new THREE.Color(0x000000)
const DECORATION_SELECTED_COLOR = new THREE.Color(0x666600)

const HasEmissiveMaterial = stampit(Component, {
  props: {
    emissiveColor: null,
  },

  init({ emissiveColor }) {
    if (emissiveColor) {
      this.emissiveColor = emissiveColor
    } else {
      // default of 'black' color makes no emissive effect
      this.emissiveColor = COLOR_BLACK
    }
    
    this.on('select', () => {
      this.setEmissive(DECORATION_SELECTED_COLOR)
    })
    this.on('deselect', () => {
      this.setEmissive(DECORATION_NORMAL_COLOR)
    })
  },

  methods: {
    setEmissive(color) {
      this.emissiveColor = color
      this.object.traverse(o => {
        if (o.isMesh) {
          o.material.emissive = color
        }
      })
    },
  }
})

export { HasEmissiveMaterial }
