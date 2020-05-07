import stampit from 'stampit'

import { Component } from './component.js'

/**
 * SyncsStateWithAwareness syncs any data in the `state` deepProps of the Entity
 * to the Awareness system on the network.
 * 
 * The network 'Awareness' that we're talking about here is the yjs way of
 * telling us when a user is connected or disconnected, as well as transient
 * state information such as mouse pointer location or player location.
 * 
 * We use this transience as a speed boost and as a logical way of keeping
 * track of a lot of dynamic information that we don't actually care to
 * store anywhere (at least for now).
 */
const NetworkSetsState = stampit(Component, {
  props: {
    /**
     * If set to true, the state is sent to the presence Awareness module, rather
     * than the historical state.
     */
    networkAwareness: true,
  },

  init({ networkAwareness = this.networkAwareness }) {
    this.networkAwareness = networkAwareness
  },
  
  methods: {
    setup() {
      if (this.networkAwareness) {
        this.network.on('update', (uuid, object) => {
          if (uuid === this.uuid) {
            for (let k in object) {
              if (k === 'type') { continue }
              if (!this.state[k]) { this.state[k] = {} }
              this.state[k].target = object[k]
            }
          }
        })
      } else {
        // TODO: write state to this.network.ydoc
      }
    }
  }
})

export { NetworkSetsState }
