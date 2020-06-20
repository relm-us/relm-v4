import stampit from 'stampit'

import { Component } from './components/component.js'
import { Entity } from './entity.js'
import { network } from './network.js'

/**
 * An EntityShared is an Entity with the ability to share its goals over the network.
 */
const EntityShared = stampit(Entity, Component, {
  conf: {
    network: null,
  },

  init({
    network,
    goals,
  }, { stamp }) {
    this.network = network || stamp.compose.configuration.network
    this.goals = goals
    
    /**
     * Route uuid get/set shortcuts to the GoalGroup instead of local _uuid property
     */
    Object.defineProperty(this, 'uuid', { configurable: true,
      get: () => {
        if (this.goals) {
          return this.goals.uuid
        } else {
          throw Error("Can't get UUID, shared entity lacks 'goals' object")
        }
      },
      set: (uuid) => {
        if (this.goals) {
          return this.goals.uuid = newUuid
        } else {
          throw Error("Can't set UUID, shared entity lacks 'goals' object")
        }
      },
    })
  },

  methods: {
  }
}).conf({ network })

export { EntityShared }
