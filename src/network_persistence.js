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
        console.log('update for uuid', this.uuid, object)
        for (let k in object) {
          if (k === 'type') { continue }
          if (!this.state[k]) { this.state[k] = {} }
          if (k === 'quaternion') {
            // Hack that quaternions serialize themselves with _x,_y,_z,_w
            // but need to be unserialized with .set
            // TODO: Fix this with get/set style assignment
            const q = object[k]
            this.state[k].target.set(q._x, q._y, q._z, q._w)
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
    console.log('update', this.uuid)
      if (this.updated && this.network.provider) {
        this.updated = false
        const object = stateToObject(this.type, this.state)
        console.log('thing updated', this.uuid, object)
        this.network.setState(this.uuid, object)
      }
    }
  }
})

export { NetworkGetsState, NetworkSetsState }
