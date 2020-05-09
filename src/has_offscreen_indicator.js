import stampit from 'stampit'

import { Component } from './component.js'
import { Label } from './label.js'

const HasOffscreenIndicator = stampit(Component, {
  init() {
    this.onScreenVector = new THREE.Vector3()
    this.offscreenIndicatorText = ""
    this.offscreenIndicatorLabel = new Label()
  },

  methods: {
    isOnScreen() {
      this.onScreenVector.copy(this.object.position)
      this.onScreenVector.project( this.stage.camera )
      return (this.onScreenVector.x >= -1 && this.onScreenVector.x <= 1 && this.onScreenVector.y >= -1 && this.onScreenVector.y <= 1)
    },

    update(delta) {
      if (!this.isOnScreen()) {
        this.onScreenVector.normalize()
        const x = (this.onScreenVector.x + 1) * this.stage.width / 2
        const y = -(this.onScreenVector.y - 1) * this.stage.height / 2
        
        this.offscreenIndicatorLabel.vector.copy({x, y, z: 0})
        if (this.offscreenIndicatorText !== this.state.label.target) {
          this.offscreenIndicatorLabel.setText(this.state.label.target)
          this.offscreenIndicatorText = this.state.label.target
        }
        this.offscreenIndicatorLabel.updateDomElement()
        this.offscreenIndicatorLabel.show()
      } else {
        this.offscreenIndicatorLabel.hide()
      }
    }
  }
})

export { HasOffscreenIndicator }