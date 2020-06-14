import stampit from 'stampit'
import EventEmittable from '@stamp/eventemittable'

import * as Y from 'yjs'

import { req, mapToObject } from '../util.js'

const Equality = {
  Distance: (threshold) => {
    return (a, b) => {
      const dx = a.get('x') - b.get('x')
      const dy = a.get('y') - b.get('y')
      const dz = a.get('z') - b.get('z')
      return Math.sqrt(dx * dx + dy * dy + dz * dz) <= threshold
    }
  },
  
  // Angle: (threshold) => {
  //   return (a, b) => {
  //     return Math.abs(a.angleTo(b)) < threshold
  //   }
  // },

  Delta: (property, threshold) => {
    return (a, b) => {
      const delta = Math.abs(a.get(property) - b.get(property)) 
      return delta <= threshold
    }
  },
  
  /**
   * Checks for shallow equality between two Map-compatible objects (e.g. Map, Y.Map). Ignores keys that begin with '@'.
   */
  Map: () => {
    return (map1, map2) => {
      let keys = new Set([...map1.keys(), ...map2.keys()])
      console.log('Equality.Map', map1, map2, keys)
      for (let k of keys.values()) {
        if (k.slice(0, 1) === '@') continue
        if (!map1.has(k) || !map2.has(k)) return false
        if (map1.get(k) !== map2.get(k)) return false
      }
      return true
    }
  }
}

function defineGoal(abbrev, defaults, equality = Equality.Map) {
  return { abbrev, defaults, equality }
}

/**
 * A Goal is a time-sequenced queue of states. It's intended that the animation engine will attempt to
 * generate an animation that transitions the current state to the goal state. For example, if a player.object
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
 * (See Equality.Delta).
 * 
 * @property {string} name - a name for the goal, e.g. 'position'
 * @property {Object} defaults - the default state of the goal
 * @property {Function} equality - a function that tests for equality--it takes two Maps as params and returns true or false
 */
const Goal = stampit(EventEmittable, {
  init({ name = req`name`, map = req`map`, defaults, equality }) {
    /**
     * The name of the goal, e.g. 'position', or 'quaternion'.
     *
     * @type {string}
     */
    this.name = name
    
    /**
     * A function that tests if a this goal is "equal" to another value or set of values. For instance,
     * if this goal is a position with components x, y, z, then the equalityTest would be a distance
     * calculation with a < threshold. Defaults to a shallow comparison of two objects.
     * 
     * @type {Function}
     */
    this.testEquality = equality || Equality.Map()
    
    /**
     * Keeps track of whether any of this goal's values have been achieved. Values also individually hold
     * `achieved` state. If any value is modified, it indicates current state is out of sync and needs to
     * be animated towards the goal state. This is an optimization that allows us to not process entities
     * that haven't changed since the last animation frame.
     */
    this.achieved = false
    
    /**
     * The goal's current state, e.g. `{x: 10, y: 10, z: 100}`.
     *
     * @type {Y.Map}
     */
    this._map = map
    
    this._map.observe((event) => {
      this.achieved = false
      // console.log('goal observed change', this, event)
    })
    
    // Set default values, as long as they don't overwrite existing values
    this._due = 0
    for (const [k, v] of Object.entries(defaults)) {
      if (!this._map.has(k)) {
        this._map.set(k, v)
      }
    }
    
    // For easier debugging, define 'value' as a getter on this object (instead of on the prototype)
    Object.defineProperty(this, 'value', {
      get: () => this._map.toJSON()
    })
  },

  methods: {
    /**
     * The time at which the goal is 'due', in milliseconds.
     */
    get due() {
      const due = this._map.get('@due') || 0
      return due
    },
    
    set due(dueAt) {
      this._map.set('@due', dueAt)
    },
    
    get(key) {
      if (!key) throw Error('key is required')
      return this._map.get(key)
    },

    /**
     * isPastDue checks the time this goal is `due` and returns true or false if it past due. This
     * can be used to determine if an animation needs to be cut short and resort to instantaneous
     * motion instead.
     * 
     * @param {number} now - the time in milliseconds to consider as "now" when comparing what is past
     */
    isPastDue(now = Date.now()) {
      return this.due < now
    },
    
    update(object, due = Date.now()) {
      this.due = due
      this._map.doc.transact(() => {
        for (const [k, v] of Object.entries(object)) {
          this._map.set(k, v)
        }
      })
    },
    
    equals(otherValue) {
      return this.testEquality(this._map, otherValue)
    },
    
    markAchieved() {
      this.achieved = true     
    },
    
    markAchievedIfEqual(value) {
      this.achieved = this.equals(value)
    },

    toJSON() {
      return this._map.toJSON()
    },
  }
})


export {
  Goal,
  Equality,
  defineGoal,
}
