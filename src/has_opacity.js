import stampit from 'stampit'

import { Component } from './component.js'

const HasOpacity = stampit(Component, {
  deepProps: {
    state: {
      opacity: {
        now: 1.0,
        target: 1.0,
      }
    }
  },

  methods: {
    setOpacity(opacity) {
      this.state.opacity.target = opacity
    },
    
    update(_delta) {
      const closeEnough = this.state.opacity.target - this.state.opacity.now
      if (Math.abs(closeEnough) > 0.01) {
        const increment = Math.sign(closeEnough) * 0.02
        this.state.opacity.now += increment
        // Traverse the entity's SkinnedMesh and set opacity on any associated materials
        if (this.object) {
          this.object.traverse(o => {
            if (o.isMesh) { o.material.opacity = this.state.opacity.now }
          })
        }
      }
    }
  }
})

export { HasOpacity }
