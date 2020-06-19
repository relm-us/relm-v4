import stampit from 'stampit'

import { Component } from './component.js'
import { Label } from '../label.js'

const HasOffscreenIndicator = stampit(Component, {
  init() {
    this.onScreenVector = new THREE.Vector3()
    this.offscreenIndicatorHidden = false
    this.offscreenIndicatorText = ""
    this.offscreenIndicatorLabel = new Label()
    
    this.offscreenIndicatorLabel.domElement.classList.add('offscreen-indicator-label')
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
        const left = 60
        const bottom = 30
        const width = this.stage.width - left * 2
        const height = this.stage.height - bottom
        const x = (this.onScreenVector.x + 1) * width / 2 + left
        const y = -(this.onScreenVector.y - 1) * height / 2 - bottom
        
        const labelText = this.goals.label.get('text')
        
        this.offscreenIndicatorLabel.vector.copy({x, y, z: 0})
        if (this.offscreenIndicatorText !== labelText) {
          this.offscreenIndicatorLabel.setText(labelText)
          this.offscreenIndicatorText = labelText
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