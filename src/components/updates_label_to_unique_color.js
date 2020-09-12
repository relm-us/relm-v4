import stampit from 'stampit'
import { Color } from 'three'

import { Component } from './component.js'

const UpdatesLabelToUniqueColor = stampit(Component, {
  init() {
    this.updatesLabelColor = new Color()
  },

  methods: {
    update(delta) {
      this.updatesLabelColor.setHex(this.getUniqueColor())
      this.setLabelUnderlineColor(this.updatesLabelColor)
    },
  },
})

export { UpdatesLabelToUniqueColor }
