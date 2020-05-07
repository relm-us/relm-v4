import stampit from 'stampit'

import { Component } from './component.js'
import { stateToObject } from './state_to_object.js'

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
const NetworkGetsState = stampit(Component, {
  props: {
    /**
     * If set to true, the state is sent to the presence Awareness module, rather
     * than the historical state.
     */
    networkAwareness: true,
    
    networkGetsStateModulus: 20,
  },

  init({
    networkAwareness = this.networkAwareness,
    networkGetsStateModulus = this.networkGetsStateModulus
  }) {
    this.networkAwareness = networkAwareness
    this.networkGetsStateCounter = 0
    this.networkGetsStateModulus = networkGetsStateModulus
  },
  
  methods: {
    update(delta) {
      this.networkGetsStateCounter++
      if (this.networkGetsStateCounter % this.networkGetsStateModulus === 0 && this.network.provider) {
        const state = stateToObject(this.type, this.state)
        if (this.networkAwareness) {
          this.network.provider.awareness.setLocalStateField(this.uuid, state)
        } else {
          // TODO: write state to this.network.ydoc
        }
      }
    }
  }
})

export { NetworkGetsState }
