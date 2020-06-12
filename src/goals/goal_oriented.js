import stampit from 'stampit'

import { Component } from '../components/component.js'
import { GoalGroup } from './goal_group.js'


const Permanence = {
  PERMANENT: 0,
  TRANSIENT: 1,
}


const GoalOriented = stampit(Component, {
  props: {
    permanence: Permanence.PERMANENT
  },
  
  init() {
    // this.network.on(`update-${this.uuid}`, this._updateGoals.bind(this))
  },

  methods: {
    _ensureGoalGroupInitialized() {
      if (!this.goals) {
        this.goals = GoalGroup({ type: this.type, uuid: this.uuid, map: new Map() })
      }
    },
    
    
    /*
    setGoal(goalName, goalState, due = Date.now()) {
      if (goalName in this.goals) {
        this.goals[goalName].set(goalState, due)
        if (this.network.isReady()) {
          if (this.permanence === Permanence.PERMANENT) {
            this.network.setPermanent(this)
          } else if (this.permanence === Permanence.TRANSIENT) {
            this.network.setTransient(this)
          } else {
            console.error("Permanence value not in range", this.permanence, Permanence)
          }
        } else {
          console.log("Network not ready, can't send goal yet", goalName, goalState)
        }
      } else {
        console.warn("Can't setGoal, goal not found", goalName, this.goals)
      }
    },
    
    goalsToJSON() {
      const obj = { '@id': this.uuid, '@type': this.type }
      for (let [goalName, goal] of Object.entries(this.goals)) {
        obj[goalName] = goal.toJSON()
      }
      return obj
    },
    
    goalsFromJSON(obj) {
      if (obj['@type'] === this.type) {
        if (obj['@id'] === this.uuid) {
          for (let [goalName, goalState] of Object.entries(obj)) {
            if (goalName.slice(0, 1) === '@') continue
            const goal = this.goals[goalName]
            if (goal) {
              goal.fromJSON(goalState)
            }
          }
        } else {
          console.trace("Won't update goals, id differs:", obj['@id'], this.uuid)
        }
      } else {
        console.trace("Won't update goals, type differs:", obj['@type'], this.type)
      }
    },
    */

    _updateGoals(state) {
      // console.log('_updateGoals', state['@type'], state, this)
      this.goalsFromJSON(state)
    },
  }
})

export {
  GoalOriented,
  Permanence
}
