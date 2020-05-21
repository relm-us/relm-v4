import stampit from 'stampit'
// import EventEmittable from '@stamp/eventemittable'

import { Component } from './component.js'
import { Label } from './label.js'

const { Vector3, Color } = THREE

const HasLabel = stampit(Component, {
  name: 'HasLabel',

  props: {
    labelPosition: null,
    labelOffset: null,
    labelColor: null,
  },

  deepProps: {
    state: {
      label: {
        now: null,
        target: null,
      },
    },
  },

  init({
    label = this.state.label.target,
    labelOffset = this.labelOffset,
    labelColor = this.labelColor
  }) {
    this.labelPosition = new Vector3()
    this.labelOffset = labelOffset || new Vector3()
    this.labelColor = labelColor || new Color()
    this.labelObj = new Label()
    this.setLabel(label)
    this.setLabelColor(labelColor)
  },

  methods: {
    /**
     * @returns {string}
     */
    getLabel() {
      return this.state.label.target
    },

    /**
     * @param {string} text
     */
    setLabel(text) {
      this.state.label.target = text
    },
    
    setLabelColor(color) {
      this.labelColor = color
      if (color) {
        this.labelObj.domElement.style.color = '#' + color.getHexString()
      }
    },
    
    setLabelUnderlineColor(color) {
      this.labelObj.domElement.style.borderBottom = `3px solid #${color.getHexString()}`
    },
    
    setup() {
      this.postrenderLabel = () => {
        // Since nametags are just HTML and CSS we have to 'manually' project
        // their position on to the screen
        this.labelPosition.copy(this.object.position)
        this.labelPosition.add(this.labelOffset)

        const screenSize = { width: this.stage.width, height: this.stage.height }
        this.labelObj.project(this.labelPosition, this.stage.camera, screenSize)
      }
      this.stage.addPostrenderFunction(this.postrenderLabel)
    },

    update() {
      // No transition, just update the name
      if (this.state.label.now !== this.state.label.target) {
        this.state.label.now = this.state.label.target
        this.labelObj.setText(this.state.label.now)
      }

    },

    teardown() {
      this.labelObj.destroyDomElement()
      this.stage.removePostrenderFunction(this.postrenderLabel)
    }
  }

})

export { HasLabel }