
import stampit from 'stampit'

import FlatQueue from 'flatqueue'
import { Component } from '../components/component.js'


const Equal = {
  Distance: (threshold) => {
    return (a, b) => {
      const dx = a.x - b.x
      const dy = a.y - b.y
      const dz = a.z - b.z
      return Math.sqrt(dx * dx + dy * dy + dz * dz) < threshold
    }
  },
  
  Angle: (threshold) => {
    return (a, b) => {
      return Math.abs(a.angleTo(b)) < threshold
    }
  },

  Delta: (threshold) => {
    return (a, b) => {
      return Math.abs(a - b) < threshold
    }
  },
  
  Compare: () => {
    return (a, b) => {
      return a == b
    }
  }
}


const Permanence = {
  PERMANENT: 0,
  TRANSIENT: 1,
}


/**
 * A Goal is a set of states. It's intended that the animation engine will attempt to generate
 * an animation that transitions the current state to the goal state. For example, if a player.object
 * is an Object3D, and its `position` has `x`, `y`, and `z` values, then the position's corresponding
 * goal would also have `x`, `y`, and `z` values.
 *
 * Setting values is complicated by the fact that we are using data transmitted over a network, and it
 * may be delayed. Therefore, each property of a Goal also has a time at which it is `due`. If the
 * current time surpasses the `due` time, then the animation is cancelled and we instantaneously
 * move current state to goal state.
 *
 * We use a priority queue (FlatQueue) to keep track of which goal states are next (sorted by `due`),
 * and easily check if we need to fast-forward.
 * 
 * Goals also use a custom equality test function per property. This allows us, for example, to check
 * for current state and goal state as being "close enough" when dealing with floating point numbers.
 * (See Equal.Delta).
 * 
 * @typedef GoalMetadata
 * @property {any} default - A default value
 */
const Goal = stampit({
  init({ name, defaults, equalityTest, toValue, fromValue }) {
    /**
     * The name of the goal, e.g. 'position', or 'quaternion'.
     *
     * @type {string}
     */
    this.name = name
    
    /**
     * The goal's states. Each state is a priority queue, allowing us to grab the "next" value quickly.
     *
     * @type {Map<string, FlatQueue>}
     */
    this.states = new FlatQueue()
    
    /**
     * The goal's values' metadata.
     *
     * @type {Map<string, GoalMetadata>}
     */
    this.defaults = Object.assign({}, defaults)
    
    /**
     * The time at which the goal is 'due', in milliseconds.
     * 
     * @type {number}
     */
    this.due = Date.now()
    
    /**
     * A function that tests if a this goal is "equal" to another value or set of values. For instance,
     * if this goal is a position with components x, y, z, then the equalityTest would be a distance
     * calculation with a < threshold.
     * 
     * @type {Function}
     */
    this.equalityTest = equalityTest
    
    /**
     * Keeps track of whether any of this goal's values have been achieved. Values also individually hold
     * `achieved` state. If any value is modified, it indicates current state is out of sync and needs to
     * be animated towards the goal state. This is an optimization that allows us to not process entities
     * that haven't changed since the last animation frame.
     */
    this.achieved = false
  },

  methods: {
    setDue(due = Date.now()) {
      this.due = due
    },

    /**
     * isPastDue checks the time this goal is `due` and returns  true or false if it past due. This
     * can be used to determine if an animation needs to be cut short and resort to instantaneous
     * motion instead.
     * 
     * @param {number} now - the time in milliseconds to consider as "now" when comparing what is past
     */
    isPastDue(now = Date.now()) {
      return this.due < now
    },
    
    /**
     * This function skips past any values in the queue that are not current and retrieves the
     * most current value.
     * 
     * NOTE: This method has side effects! Once `now` is passed in, it will destructively remove
     *       old values from the queue.
     * 
     * @param {number} now - the time in milliseconds to consider as "now" when getting a value
     */
    get(now = Date.now()) {
      const state = this.fastForward(now).peek()
      return (state !== undefined ? state : this.defaults)
    },

    /**
     * This function sets a value, valid within a certain time window.
     * 
     * @param {any} value - the value
     * @param {number} now - the time in milliseconds (now) when the value becomes active
     */
    set(state, due = Date.now(), now = Date.now()) {
      this.setDue(due)
      this.achieved = false
      this.states.push(state, now)
    },
    
    equals(otherValue, now = Date.now()) {
      return this.equalityTest(this.get(now), otherValue)
    },
    
    /**
     * fastForward takes the `states` queue and removes states that are older than 'now',
     * preserving only those states in the queue that are 'in the future'.
     * 
     * @param {number} now - the time in milliseconds to consider as "now" when discarding old values
     */
    fastForward(now = Date.now()) {
      const queue = this.states
      while (queue.peekValue() < now && queue.length > 1) {
        queue.pop()
      }
      return queue
    },
    
    markAchieved() {
      // console.log('goal achieved', this.name)
      this.achieved = true     
    },
    
    markAchievedIfEqual(value, now = Date.now()) {
      // console.log('goal achieved (eq)', this.name)
      this.achieved = this.equals(value, now)
    },

    toJSON(now = Date.now()) {
      return Object.assign({}, this.get(now), { '@due': this.due })
    },

    fromJSON(obj, now = Date.now()) {
      const due = obj['@due']
      delete obj['@due']
      this.set(obj, due, now)
    }
  }
})


const GoalsMap = (type) => {
  if (!type || typeof type !== 'string') {
    console.error('GoalsMap must have type', type)
  }
  const proto = {
    toJSON: function() {
      const obj = { '@type': type }
      for (let [goalName, goal] of Object.entries(this)) {
        obj[goalName] = goal.toJSON()
      }
      return obj
    },

    fromJSON: function(obj) {
      if (obj['@type'] === type) {
        delete obj['@type']
        for (let [goalName, goalState] of Object.entries(obj)) {
          const goal = this[goalName]
          if (goal) {
            goal.fromJSON(goalState)
          }
        }
      } else {
        console.warn("Won't update goals, type differs:", obj['@type'], type)
      }
    }
  }
  return Object.create(proto)
}


const GoalOriented = stampit(Component, {
  props: {
    permanence: Permanence.PERMANENT
  },
  
  init() {
    this.network.on(`update-${this.uuid}`, this._updateGoals.bind(this))
  },

  methods: {
    addGoal(name, defaults, { equals = null, to = null, from = null } = {}) {
      if (!this.goals) {
        this.goals = GoalsMap(this.type)
      }
      if (name in this.goals) {
        console.error('Goal previously added to entity', name, this)
      }
      this.goals[name] = Goal({
        name,
        defaults,
        equalityTest: equals,
        toValue: to,
        fromValue: from
      })
    },
    
    setGoal(goalName, goalState, due = Date.now()) {
      if (goalName in this.goals) {
        this.goals[goalName].set(goalState, due)
        if (this.network.isReady()) {
          if (this.permanence === Permanence.PERMANENT) {
            this.network.setPermanent(this, due)
          } else if (this.permanence === Permanence.TRANSIENT) {
            this.network.setTransient(this, due)
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

    _updateGoals(state) {
      // console.log('_updateGoals', state['@type'], state, this)
      this.goals.fromJSON(state)
      // state.forEach((stateMap, goalName) => {
      //   if (goalName === '@type') return
      //   const goal = this.goals[goalName]
      //   if (goal) {
      //     const state = stateMap.toJSON()
      //     const due = stateMap.get('@due')
      //     delete state['@due']
      //     goal.set(state, due)
      //   }
      // })
    },
  }
})


export {
  Goal,
  GoalOriented,
  Equal,
  Permanence,
}