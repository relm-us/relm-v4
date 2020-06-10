import stampit from 'stampit'
import * as Y from 'yjs'

import { Goal } from './goal.js'
import { ABBREV } from './abbrev.js'
import { mapToObject } from '../util.js'

const newMapOfSameType = (map) => {
  return Reflect.construct(Reflect.getPrototypeOf(map).constructor, [])
}


const GoalGroup = stampit({
  init({ uuid, type, map = new Map() }) {
    if (!type) {
      throw Error('GoalGroup must have type', type)
    }
    this._goals = new Map()
    this._map = map
    if (!map) { console.trace(); throw Error('Goal requires a Map object') }
    
    this.uuid = uuid
    this.type = type
  },
  
  methods: {
    get uuid () {
      if (!this._map.has('@id')) {
        this._map.set('@id', uuidv4())
      }
      return this._map.get('@id')
    },
    
    set uuid (newUuid) {
      this._map.set('@id', newUuid)
    },
    
    get type () {
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

      return this
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
