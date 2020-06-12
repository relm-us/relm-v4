import stampit from 'stampit'
import * as Y from 'yjs'

import { Goal } from './goal.js'
import { ABBREV } from './abbrev.js'
import { uuidv4, mapToObject } from '../util.js'

const newMapOfSameType = (map) => {
  return Reflect.construct(Reflect.getPrototypeOf(map).constructor, [])
}


const GoalGroup = stampit({
  init({ map }) {
    if (!map) {
      console.trace(map)
      throw Error('GoalGroup must be given a map (Map or Y.Map)')
    }
    this._goals = new Map()
    this._map = map
  },

  statics: {
    goalsDescToJson: (type, uuid, goals) => {
      if (!type) {
        console.trace(type)
        throw Error('goalsDescToJson requires type')
      }
      const json = {
        '@id': uuid,
        '@type': type,
      }
      for (let [goalName, goalAttrs] of Object.entries(goals)) {
        json[goalName] = { '@due': 0 }
        for (let [attrName, attrValue] of Object.entries(goalAttrs)) {
          json[goalName][attrName] = attrValue
        }
      }
      return json
    },

    // Given a javascript object, convert to a Map-like suitable to init a GoalGroup
    goalsDescToMap: (MapLike, type, uuid, goals) => {
      if (!type) {
        console.trace(type)
        throw Error('goalsDescToMap requires type')
      }
      const state = new MapLike()
      state.set('@id', uuid || uuidv4())
      state.set('@type', type)
      for (let [goalName, goalAttrs] of Object.entries(goals)) {
        const abbrev = ABBREV[goalName] || goalName
        const child = new MapLike()
        state.set(abbrev, child)
        child.set('@due', 0)
        for (let [attrName, attrValue] of Object.entries(goalAttrs)) {
          child.set(attrName, attrValue)
        }
      }
      console.log('goalsDescToMap', goals, state.get('ast').get('url'))
      return state
    },

    jsonToMap: (MapLike, json) => {
      const state = new MapLike()
      for (let [goalName, goalAttrs] of Object.entries(json)) {
        if (goalName.slice(0,1) === '@') {
          state.set(goalName, goalAttrs)
        } else {
          state.set(goalName, new MapLike(Object.entries(goalAttrs)))
        }
      }
      return state
    }
  },
  
  methods: {
    get uuid () {
      if (typeof this._map.get !== 'function') { console.trace(this._map) }
      return this._map.get('@id')
    },
    
    set uuid (newUuid) {
      this._map.set('@id', newUuid)
    },
    
    get type () {
      if (typeof this._map.get !== 'function') { console.trace(this._map) }
      return this._map.get('@type')
    },

    set type (newType) {
      this._map.set('@type', newType)
    },
    
    add(name, defaults, equality) {
      const abbrev = ABBREV[name] || name
      if (this._goals.has(abbrev)) {
        throw Error(`Goal already added: '${abbrev}' ('${name}')`)
      }
      
      const map = newMapOfSameType(this._map)
      const goal = Goal({ name, defaults, equality, map })
      
      this._map.set(abbrev, map)
      this._goals.set(abbrev, goal)
      
      Object.defineProperty(this, name, {
        get: () => this.get(abbrev)
      })

      return goal
    },
    
    /**
     * Get a Goal using its abbreviated name. Use getters for full name access
     * (e.g. `group.position` to get `group.get('p')`)
     * 
     * @param {string} abbrev - get a goal with abbreviation `abbrev'
     * @returns {Goal}
     */
    get(abbrev) {
      return this._goals.get(abbrev)
    },

    keys() {
      return this._goals.keys()
    },

    toJSON() {
      return mapToObject(this._map)
    }
  }
})

export { GoalGroup }
