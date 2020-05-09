import stampit from 'stampit'

import { Component } from './component.js'
import { Label } from './label.js'

const HasOffscreenIndicator = stampit(Component, {
  init() {
    this.onScreenVector = new THREE.Vector3()
    this.offscreenIndicatorHidden = false
    this.offscreenIndicatorText = ""
    this.offscreenIndicatorLabel = new Label()
    this.offscreenIndicatorLabel.domElement.style.opacity = '0.6'
  },

  methods: {
    isOnScreen() {
      this.onScreenVector.copy(this.object.position)
      this.onScreenVector.project( this.stage.camera )
      return (
        this.onScreenVector.x >= -1 && this.onScreenVector.x <= 1 &&
        this.onScreenVector.y >= -1 && this.onScreenVector.y <= 1
      )
    },
    
    hideOffscreenIndicator() {
      this.offscreenIndicatorHidden = true
    },

    showOffscreenIndicator() {
      this.offscreenIndicatorHidden = false
    },

    update(delta) {
      if (this.isOnScreen() || this.offscreenIndicatorHidden) {
        this.offscreenIndicatorLabel.hide()
      } else {
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
      }
    },

    teardown() {
      this.offscreenIndicatorLabel.destroyDomElement()
    }
  }
})

export { HasOffscreenIndicator }