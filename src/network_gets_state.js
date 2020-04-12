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
     * The networkKey can be set to the type of object, e.g. 'player', so that
     * the state can be stored separately from other things (e.g. mouse movement).
     */
    networkKey: 'state',
    
    /**
     * If set to true, the state is sent to the presence Awareness module, rather
     * than the historical state.
     */
    networkAwareness: true,
  },

  init({ networkKey = this.networkKey, networkAwareness = this.networkAwareness }) {
    this.networkKey = networkKey
    this.networkAwareness = networkAwareness
    this.networkGetsStateCounter = 0
  },
  
  methods: {
    update(delta) {
      this.networkGetsStateCounter++
      if (this.networkGetsStateCounter % 20 === 0) {
        const state = stateToObject(this.uuid, this.state)
        if (this.networkAwareness) {
          this.network.provider.awareness.setLocalStateField(this.networkKey, state)
        } else {
          // TODO: write state to this.network.ydoc
        }
      }
    }
  }
})

export { NetworkGetsState }
