import stampit from 'stampit'

import { Component } from './component.js'

const HasUniqueColor = stampit(Component, {
  deepProps: {
    state: {
      uniqueColor: {
        now: null,
        target: null
      }
    }
  },
  
  init({ uniqueColor }) {
    if (uniqueColor) {
      this.state.uniqueColor.now = this.state.uniqueColor.target = uniqueColor
    } else {
      this.pickRandomUniqueColor()
    }
  },
  
  methods: {
    pickRandomUniqueColor() {
      const hue = Math.floor(Math.random() * 360)
      const color = new THREE.Color(`hsl(${hue}, 100%, 58%)`)
      this.state.uniqueColor.now = this.state.uniqueColor.target = color.getHex()
    },

    getUniqueColor() {
      return this.state.uniqueColor.now
    },

    setUniqueColor(color) {
      this.state.uniqueColor.target = color
    },

    update(delta) {
      if (this.state.uniqueColor.now !== this.state.uniqueColor.target) {
        this.state.uniqueColor.now = this.state.uniqueColor.target
      }
    }
  }
})

const CopiesUniqueColor = stampit(Component, {
  props: {
    colorSource: null
  },

  init({ colorSource }) {
    this.colorSource = colorSource
  },

  methods: {
    update(delta) {
      if (this.colorSource) {
        this.setUniqueColor(this.colorSource.getUniqueColor())
      }
    }
  }
})

export { HasUniqueColor, CopiesUniqueColor }
