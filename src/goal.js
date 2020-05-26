
import stampit from 'stampit'
import FlatQueue from 'flatqueue'

const millis = Date.now

const Equal = {
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

/**
 * A Goal is a set of properties. It's intended that the animation engine will attempt to generate
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
 * @property {Function} equals - The equality operator to use when comparing the value with another value
 * @property {boolean} achieved - Whether or not the value has been achieved (a part of the larger goal)
 */
const Goal = stampit({
  init({ name, attrs = [] }) {
    /**
     * The name of the goal, e.g. 'position', or 'quaternion'.
     *
     * @type {string}
     */
    this.name = name
    
    /**
     * The goal's values. Each value is a priority queue, allowing us to grab the "next" value quickly.
     *
     * @type {Map<string, FlatQueue>}
     */
    this.values = {}
    
    /**
     * The goal's values' metadata.
     *
     * @type {Map<string, GoalMetadata>}
     */
    this.meta = {}
    
    /**
     * Keeps track of whether any of this goal's values have been achieved. Values also individually hold
     * `achieved` state. If any value is modified, it indicates current state is out of sync and needs to
     * be animated towards the goal state. This is an optimization that allows us to not process entities
     * that haven't changed since the last animation frame.
     */
    this.achieved = true
    
    const now = millis()
    attrs.forEach((attr) => {
      const [key, defaultValue, equalityOperator] = attr
      this.values[key] = new FlatQueue()
      const meta = this.meta[key] = {}
      meta.default = defaultValue
      meta.equals = equalityOperator
      Object.defineProperty(this, key, {
        get: () => this.get(key),
        set: (value) => this.set(key, value),
      })
      this.set(key, defaultValue, now)
    })
  },

  methods: {
    /**
     * This function skips past any values in the queue that are not current and retrieves the
     * most current value.
     * 
     * NOTE: This method has side effects! Once `now` is passed in, it will destructively remove
     *       old values from the queue.
     * 
     * @param {string} key - the value to get (e.g. 'x', 'y', 'z')
     * @param {number} now - the time in milliseconds to consider as "now" when getting a value
     */
    get(key, now = millis()) {
      const peek = this.fastForward(key, now).peek() 
      return (peek ? peek.value : this.meta[key].default)
    },

    /**
     * This function sets a value, valid within a certain time window.
     * 
     * @param {string} key - the key of the value to set (e.g. 'x', 'y', 'z')
     * @param {any} value - the value
     * @param {number} now - the time in milliseconds (now) when the value becomes active
     * @param {number} due - the time in milliseconds (in the future) when this value is considered
     *                       to have been given 'enough time' to animate
     */
    set(key, value, now = millis(), due = millis()) {
      this.achieved = false
      this.meta[key].achieved = false
      this.values[key].push({ value, due }, now)
    },
    
    equals(key, value) {
      const equals = this.meta[key].equals
      const peek = this.values[key].peek()
      const retval = equals(peek ? peek.value : null, value)
      return retval
    },
    
    /**
     * fastForward takes the `values[key]` queue and removes values that are older than 'now',
     * preserving only those values in the queue that are 'in the future'.
     * 
     * @param {string} key - the value's key to fast forward through (e.g. 'x', 'y', 'z')
     * @param {number} now - the time in milliseconds to consider as "now" when discarding old values
     */
    fastForward(key, now = millis()) {
      const queue = this.values[key]
      // console.log('queue peekValue', queue.peekValue(), now, queue.length)
      while (queue.peekValue() < now && queue.length > 1) {
        queue.pop()
      }
      return queue
    },

    /**
     * pastDue checks the time a value is `due` (as stored in the `values[key]` queue) and returns
     * true or false if it past due. This can be used to determine if an animation needs to be cut
     * short and resort to instantaneous motion instead.
     * 
     * @param {string} key - the value's key to check if it is past due
     * @param {number} now - the time in milliseconds to consider as "now" when comparing what is past
     */
    pastDue(key = null, now = millis()) {
      if (key === null) {
        let anyPastDue = false
        Object.keys(this.values).forEach((k) => {
          if (this.pastDue(k, now)) { anyPastDue = true }
        })
        return anyPastDue
      } else {
        const peek = this.values[key].peek()
        return (peek ? peek.due < now : true)
      }
    },
    
    markAchieved(key) {
      this.meta[key].achieved = true
      this.markAchievedIfAllAchieved()
    },

    markAchievedIfEqual(key, value) {
      this.meta[key].achieved = (this.values[key].length <= 1 && this.equals(key, value))
      this.markAchievedIfAllAchieved()
    },
    
    /**
     * We consider the whole goal 'achieved' if all of its values are achieved
     */
    markAchievedIfAllAchieved() {
      let achieved = true
      Object.keys(this.meta).forEach((key) => {
        if (!this.meta[key].achieved) { achieved = false }
      })
      this.achieved = achieved
    },
  }
})


const CanAddGoal = stampit({
  init() {
    if (!this.goals) { this.goals = {} }
  },

  methods: {
    addGoal(name, ...attrs) {
      this.goals[name] = Goal({ name, attrs })
    }
  }
})

export {
  Goal,
  CanAddGoal,
  Equal,
}