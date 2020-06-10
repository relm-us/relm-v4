import stampit from 'stampit'
// import EventEmittable from '@stamp/eventemittable'

import { Component } from './component.js'
import { Label } from '../label.js'
import { GoalOriented } from '../goals/goal_oriented.js'

const { Vector3, Color } = THREE

const HasLabel = stampit(Component, GoalOriented, {
  name: 'HasLabel',

  props: {
    labelPosition: null,
    labelOffset: null,
    labelColor: null,
  },

  init({
    goals = {},
    labelOffset = this.labelOffset,
    labelColor = this.labelColor,
    onLabelChanged
  }) {
    this.addGoal('label', goals.label || { text: null })
    
    this.labelPosition = new Vector3()
    this.labelOffset = labelOffset || new Vector3()
    this.labelColor = labelColor || new Color()
    this.labelObj = new Label({ onLabelChanged })
    
    this.setLabelColor(labelColor)
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