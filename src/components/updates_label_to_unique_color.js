import stampit from 'stampit'

import { Component } from './component.js'

const UpdatesLabelToUniqueColor = stampit(Component, {
  init() {
    this.updatesLabelColor = new THREE.Color()
  },
  
  methods: {
    update(delta) {
      this.updatesLabelColor.setHex(this.getUniqueColor())
      this.setLabelUnderlineColor(this.updatesLabelColor)
    }
  }
})

export { UpdatesLabelToUniqueColor }