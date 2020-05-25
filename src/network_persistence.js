import stampit from 'stampit'

import { Component } from './component.js'
import { stateToObject } from './state_to_object.js'

/**
 * NetworkSetsState syncs any data in the `state` deepProps of the Entity
 * to the persistence system on the network.
 */
const NetworkSetsState = stampit(Component, {
  methods: {
    setup() {
      this.network.on(`update-${this.uuid}`, (object) => {
        for (let k in object) {
          if (k === 'type') { continue }
          if (!this.state[k]) { this.state[k] = {} }
          if (this.state[k].target && this.state[k].target.copy) {
            this.state[k].target.copy(object[k])
          } else {
            this.state[k].target = object[k]
          }
        }
      })
    }
  }
})

/**
 * AwarenessGetsState syncs any data in the `state` deepProps of the Entity
 * to the Awareness system on the network.
 */
const NetworkGetsState = stampit(Component, {
  methods: {
    update(delta) {
      if (this.updated) {
        this.updated = false
        const object = stateToObject(this.type, this.state)
        this.network.setState(this.uuid, object)
      }
    }
  }
})

export { NetworkGetsState, NetworkSetsState }
