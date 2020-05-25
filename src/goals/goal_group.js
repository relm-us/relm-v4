import stampit from 'stampit'
import * as Y from 'yjs'

import { Goal } from './goal.js'
import { ABBREV } from './abbrev.js'
import { req, mapToObject } from '../util.js'

const GoalGroup = stampit({
  statics: {
    // Given a javascript object, convert to a Map-like suitable to init a GoalGroup
    goalsDescToYMap: ({
      type = req`type`,
      uuid = req`uuid`,
      ymap = req`ymap`,
      goalDefinitions = req`goalDefinitions`,
      goalsDesc = {}
    }) => {
      ymap.set('@id', uuid)
      ymap.set('@type', type)
      for (const [goalName, goalDefinition] of Object.entries(goalDefinitions)) {
        const abbrev = goalDefinition.abbrev
        if (!abbrev) {
          throw Error('goal definition requires abbrev')
        }
        
        const child = new Y.Map()
        ymap.set(abbrev, child)
        child.set('@due', 0)
        // console.log('lookup goalsDesc', goalName, goalsDesc, goalsDesc[goalName])
        let goalAttrs = goalsDesc[goalName]
        if (!goalAttrs) {
          goalAttrs = goalDefinition.defaults
        }
        for (let [attrName, attrValue] of Object.entries(goalAttrs)) {
          // console.log('child.set', attrName, attrValue)
          child.set(attrName, attrValue)
        }
      }
    },
  },
  
  init({ goalDefinitions = req`goalDefinitions`, goalGroupMap = req`goalGroupMap` }) {
    this._map = goalGroupMap
    this._goals = this._createGoals(goalDefinitions)
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
    
    _findOrCreate(abbrev) {
      let map
      if (this._map.has(abbrev)) {
        map = this._map.get(abbrev)
      } else {
        map = new Y.Map()
        this._map.set(abbrev, map)
      }
      return map
    },
    
    _createGoals(definitions) {
      const goals = {}
      for (const [name, definition] of Object.entries(definitions)) {
        const abbrev = definition.abbrev
        if (!abbrev) {
          throw Error('goal definition requires abbrev')
        }
        const goalMap = this._findOrCreate(abbrev)
        goals[definition.abbrev] = Goal({
          name,
          map: goalMap,
          defaults: definition.defaults,
          equality: definition.equality,
        })
        Object.defineProperty(this, name, {
          get: () => this.get(abbrev)
        })
      }
      return goals
    },
    
    /**
     * Get a Goal using its abbreviated name. Use getters for full name access
     * (e.g. `group.position` to get `group.get('p')`)
     * 
     * @param {string} abbrev - get a goal with abbreviation `abbrev'
     * @returns {Goal}
     */
    get(abbrev) {
      if (!this._goals[abbrev]) {
        this.initGoal(abbrev)
      }
      return this._goals[abbrev]
    },

    keys() {
      return Object.keys(this._goals)
    },

    toJSON() {
      return mapToObject(this._map)
    }
  }
})

export { GoalGroup }
