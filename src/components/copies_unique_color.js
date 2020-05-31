import stampit from 'stampit'

import { Component } from './component.js'

function getRandomColor() {
  const hue = Math.floor(Math.random() * 360)
  return new THREE.Color(`hsl(${hue}, 100%, 58%)`)
}

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

export { CopiesUniqueColor, getRandomColor }
