import stampit from 'stampit'
// import EventEmittable from '@stamp/eventemittable'

import { Component } from './component.js'
import { Label } from './label.js'

const { Vector3 } = THREE

const HasLabel = stampit(Component, {
  name: 'HasLabel',

  props: {
    labelPosition: null,
    labelOffset: null,
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
    labelOffset = this.labelOffset
  }) {
  
    this.state.label.now = label
    this.state.label.target = label
    this.labelPosition = new Vector3()
    this.labelOffset = labelOffset || new Vector3()
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

    setup() {
      this.labelObj = new Label(this.object, this.stage.camera)
    },

    update() {
      // No transition, just update the name
      this.state.label.now = this.state.label.target

      // Since nametags are just HTML and CSS we have to 'manually' project
      // their position on to the screen
      this.labelPosition.copy(this.object.position)
      this.labelPosition.add(this.labelOffset)

      const size = { width: this.stage.width, height: this.stage.height }
      this.labelObj.project(this.state.label.now, this.labelPosition, size)
    },

    teardown() {
      this.labelObj.destroyDomElement()
    }
  }

})

export { HasLabel }