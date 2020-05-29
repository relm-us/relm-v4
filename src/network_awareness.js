import stampit from 'stampit'

import { Component } from './components/component.js'
import { stateToObject } from './state_to_object.js'

/*
Note about "Network Awareness":

The network 'Awareness' that we're talking about here is the yjs way of
telling us when a user is connected or disconnected, as well as transient
state information such as mouse pointer location or player location.

We use this transience as a speed boost and as a logical way of keeping
track of a lot of dynamic information that we don't actually care to
store anywhere (at least for now).
*/


/**
 * AwarenessSetsState syncs any data in the `state` deepProps of the Entity
 * to the Awareness system on the network.
 */
const AwarenessSetsState = stampit(Component, {
  methods: {
    setup() {
      this.network.on('update', (uuid, object) => {
        if (uuid === this.uuid) {
          for (let k in object) {
            if (k === 'type') { continue }
            if (!this.state[k]) { this.state[k] = {} }
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
const AwarenessGetsState = stampit(Component, {
  props: {
    awarenessUpdateFrequency: 20,
  },

  init({
    awarenessUpdateFrequency = this.awarenessUpdateFrequency
  }) {
    this.awarenessGetsStateCounter = 0
    this.awarenessUpdateFrequency = awarenessUpdateFrequency
  },
  
  methods: {
    update(delta) {
      this.awarenessGetsStateCounter++
      if (this.awarenessGetsStateCounter % this.awarenessUpdateFrequency === 0 && this.network.isReady()) {
        const state = stateToObject(this.type, this.state)
        this.network.wsProvider.awareness.setLocalStateField(this.uuid, state)
      }
    }
  }
})

export { AwarenessGetsState, AwarenessSetsState }
