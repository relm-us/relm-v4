import stampit from 'stampit'

import { uuidv4 } from './util.js'

import { Component } from './components/component.js'
import { Typed } from './typed.js'
import { GoalGroup } from './goals/goal_group.js'
import * as R from './rmap.js'

/**
 * An Entity is the most basic thing in the game world. It has 
 * only an identifier (`.uuid`) and type (`.type`), and can be 
 * configured with a Stage, Resources, and Network.
 * 
 * Example:
 *   const ConfiguredEntity = Entity.conf({ stage: theStage })
 *   let monster = ConfiguredEntity() // do more with monster
 */
const EntityUnconfigured = stampit(Typed, Component, {
  name: 'Entity',

  // Static configuration. See https://stampit.js.org/api/configuration.
  conf: {
    /**
     * @type {Stage}
     */
    stage: null,

    /**
     * @type {ResourceLoader}
     */
    resources: null,

    /**
     * @type {Object} See network.js
     */
    network: null,
  },

  props: {
    /**
     * @type {Stage}
     */
    stage: null,
  },

  init({
    goals,
    stage,
    resources,
    network
  }, { stamp }) {
    if (goals) {
      this.goals = goals
    } else {
      console.warn('Entity initialized without goals', this)
      this.goals = GoalGroup({ map: new R.Map(Object.entries({ uuid: uuidv4() })) })
    }
    this.stage = stage || stamp.compose.configuration.stage
    this.resources = resources || stamp.compose.configuration.resources
    this.network = network || stamp.compose.configuration.network
  },

  methods: {
    /**
     * Note that each Entity can have multiple Components, each with
     * `setup`, `update` and `teardown` methods. These methods will be
     * called automatically during the lifecycle of an Entity as it
     * moves on stage, is rendered there, and moves off stage.
     */
     
    /**
     * Shortcut to get the UUID from the entitie's GoalGroup
     */
    get uuid () {
      if (this.goals) {
        return this.goals.uuid
      }
      //else {
      //  throw Error("Can't get UUID, entity lacks goals object")
      //}
    },
    
    set uuid (newUuid) {
      if (this.goals) {
        return this.goals.uuid = newUuid
      }
      // else {
      //  throw Error("Can't set UUID, entity lacks goals object")
      //}
    },

    addGoal(name, defaults, equality) {
      // this._ensureGoalGroupInitialized()
      const goal = this.goals.add(name, defaults, equality)
      // console.log('goal map', goal.name, goal._map)
      goal._map.observe((a, b) => {
        console.log('observe goal change', a, b)
      })
    },
  }
})

export { EntityUnconfigured }
