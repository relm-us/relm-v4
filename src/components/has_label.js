import stampit from 'stampit'
// import EventEmittable from '@stamp/eventemittable'

import { Component } from './component.js'
import { Label } from '../label.js'
import { defineGoal } from '../goals/goal.js'

const { Vector3, Color } = THREE

const HasLabel = stampit(Component, {
  deepStatics: {
    goalDefinitions: {
      label: defineGoal('lbl', { text: null, ox: 0, oy: 0, oz: 0 })
    }
  },

  props: {
    labelPosition: null,
    labelOffset: null,
    labelColor: null,
  },

  init({
    labelColor = this.labelColor
  }) {
    this.labelPosition = new Vector3()
    this.labelColor = labelColor || new Color()
    this.labelObj = new Label()
    this.labelOffset = new Vector3()
    
    this.setLabelColor(labelColor)
    this.on('visible', () => this.labelObj.show())
    this.on('invisible', () => this.labelObj.hide())
  },

  methods: {
    /**
     * @returns {string}
     */
    getLabel() {
      return this.goals.label.get('text')
    },

    /**
     * @param {string} text
     */
    setLabel(text) {
      this.goals.label.set('text', text)
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
      const labelGoal = this.goals.label
      if (!labelGoal.achieved) {
        this.labelOffset.x = labelGoal.get('ox')
        this.labelOffset.y = labelGoal.get('oy')
        this.labelOffset.z = labelGoal.get('oz')
        this.labelObj.setText(labelGoal.get('text'))
        labelGoal.markAchieved()
      }
    },

    teardown() {
      this.labelObj.destroyDomElement()
      this.stage.removePostrenderFunction(this.postrenderLabel)
    }
  }

})

export { HasLabel }